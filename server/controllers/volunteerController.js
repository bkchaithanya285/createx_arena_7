const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const markAttendance = async (req, res) => {
  const { teamId, presentMembers = [] } = req.body; // presentMembers is array of { regNo, name }
  const volunteerId = req.user.id;

  try {
    // 0. Check for ACTIVE session specifically in the new system
    const { data: activeSess, error: sessError } = await supabase
      .from('session_registry')
      .select('id, session_name')
      .eq('is_active', true)
      .maybeSingle();

    if (sessError || !activeSess) {
      return res.status(403).json({ error: 'Attendance session is currently CLOSED or not initialized by Admin' });
    }

    // 1. Prepare records for the new v2 table
    const attendanceRecords = presentMembers.map(m => ({
      team_id: teamId,
      session_id: activeSess.id,
      member_id: m.regNo || m.member_id,
      name: m.name,
      scanned_by: volunteerId,
      status: 'Present'
    }));

    if (attendanceRecords.length === 0) {
      return res.status(400).json({ error: 'No members selected for attendance' });
    }

    // 2. Insert into the fresh relational table (mission_reports) to avoid PostgREST cache paradoxical errors
    const { error: insertError } = await supabase
      .from('mission_reports')
      .upsert(attendanceRecords, { onConflict: 'member_id, session_id' });
    
    if (insertError) {
      console.error('Attendance V2 Insert Error:', insertError);
      throw insertError;
    }

    // 3. Optional: Sync back to legacy for compatibility if needed (Skipping for now as per "Rebuild" instruction)
    
    // 4. Update team table for dashboard reactivity
    await supabase.from('teams').update({ attendance_status: 'Updated' }).eq('id', teamId);
    
    const io = req.app.get('socketio');
    if (io) io.emit('attendance_marked', { teamId, sessionId: activeSess.id });

    res.json({ message: `Attendance marked for ${activeSess.session_name}` });
  } catch (err) {
    console.error('MarkAttendance Catch Error:', err);
    res.status(500).json({ error: 'Failed to mark attendance', details: err.message });
  }
};

const getAssignedTeams = async (req, res) => {
  const volunteerId = req.user.id;
  try {
    const { data: vol } = await supabase.from('volunteers').select('assigned_teams').eq('id', volunteerId).single();
    if (!vol || !vol.assigned_teams) return res.json([]);
    
    // Fetch teams
    const { data: teams } = await supabase
      .from('teams')
      .select('id, name, cluster, problem_id, ppt_status, attendance_status, members')
      .in('id', vol.assigned_teams);

    // Fetch extra metadata (Stars, Photos) from attendance table mocks
    const { data: meta } = await supabase
      .from('attendance')
      .select('team_id, session_id, status')
      .in('team_id', vol.assigned_teams)
      .in('session_id', ['STARS', 'PHOTO', 'PPT_VERIFIED']);

    const { data: selectionConfig } = await supabase.from('global_config').select('value').eq('key', 'problem_selection_state').maybeSingle();
    const activeRound = String(selectionConfig?.value?.active_round || "1");

    const { fetchMappings, getReviewerSlot } = require('./adminController');
    const { reviewerNames } = await fetchMappings();

    const enrichedTeams = teams.map(t => {
      const teamMeta = meta?.filter(m => m.team_id === t.id) || [];
      const slot = getReviewerSlot(t.id, activeRound);
      const assignedName = (reviewerNames[activeRound] && reviewerNames[activeRound][slot]) 
        ? reviewerNames[activeRound][slot] 
        : `Awaiting ${slot || 'Reviewer'}`;

      return {
        ...t,
        stars: parseInt(teamMeta.find(m => m.session_id === 'STARS')?.status || '0'),
        photo_url: teamMeta.find(m => m.session_id === 'PHOTO')?.status || null,
        is_ppt_verified: teamMeta.some(m => m.session_id === 'PPT_VERIFIED'),
        reviewer_name: assignedName
      };
    });
      
    res.json(enrichedTeams);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
};

const updateStars = async (req, res) => {
  const { teamId, stars } = req.body;
  const volunteerId = req.user.id;
  try {
    await supabase.from('attendance').delete().eq('team_id', teamId).eq('session_id', 'STARS');
    await supabase.from('attendance').insert({
      team_id: teamId,
      session_id: 'STARS',
      status: stars.toString(),
      marked_by: volunteerId,
      member_reg: 'SYSTEM'
    });
    res.json({ message: 'Stars updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
};

const verifyPPT = async (req, res) => {
  const { teamId } = req.body;
  const volunteerId = req.user.id;
  try {
    await supabase.from('attendance').insert({
      team_id: teamId,
      session_id: 'PPT_VERIFIED',
      status: 'TRUE',
      marked_by: volunteerId,
      member_reg: 'SYSTEM'
    });
    await supabase.from('teams').update({ ppt_status: 'Verified' }).eq('id', teamId);
    res.json({ message: 'PPT Verified' });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
};

const getStats = async (req, res) => {
  const volunteerId = req.user.id;
  try {
    const { data: vol } = await supabase.from('volunteers').select('assigned_teams').eq('id', volunteerId).single();
    if (!vol || !vol.assigned_teams) return res.json({ assigned: 0, scanned: 0, ppt_uploaded: 0, ppt_verified: 0 });

    const { data: teams } = await supabase.from('teams').select('id, attendance_status, ppt_status').in('id', vol.assigned_teams);
    const { data: meta } = await supabase.from('attendance').select('team_id, session_id').in('team_id', vol.assigned_teams).eq('session_id', 'PPT_VERIFIED');
    
    res.json({ 
      assigned: teams.length, 
      scanned: teams.filter(t => t.attendance_status === 'Updated').length, 
      ppt_uploaded: teams.filter(t => t.ppt_status === 'Uploaded' || t.ppt_status === 'Verified').length,
      ppt_verified: meta.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
};

const uploadPhoto = async (req, res) => {
  const { teamId, image } = req.body; // base64
  const volunteerId = req.user.id;
  try {
    const uploadRes = await cloudinary.uploader.upload(image, {
      folder: 'createx_arena/teams',
    });
    
    const photoUrl = uploadRes.secure_url;

    // Use our special session/mock trick to store the photo
    await supabase.from('attendance').delete().eq('team_id', teamId).eq('session_id', 'PHOTO');
    await supabase.from('attendance').insert({
      team_id: teamId,
      session_id: 'PHOTO',
      status: photoUrl,
      marked_by: volunteerId,
      member_reg: 'SYSTEM'
    });

    res.json({ message: 'Photo uploaded successfully', url: photoUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
};

module.exports = { markAttendance, getAssignedTeams, getStats, updateStars, verifyPPT, uploadPhoto };
