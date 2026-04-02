const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

const getTeamProfile = async (req, res) => {
  const teamId = req.user.id;
  try {
    const { data: team, error } = await supabase.from('teams').select('*').eq('id', teamId).single();
    if (error) throw error;
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

const submitGameScore = async (req, res) => {
  const teamId = req.user.id;
  const { game_name, score, time_taken, moves } = req.body;

  try {
    // 0. Check if Game Zone is UNLOCKED
    const { data: config } = await supabase.from('global_config').select('value').eq('key', 'game_zone_unlocked').single();
    if (config?.value !== true && String(config?.value).toLowerCase() !== 'true') {
      return res.status(403).json({ error: 'Game Zone is currently LOCKED by Admin' });
    }

    // 1. Check if already played
    const { data: existing } = await supabase
      .from('game_scores')
      .select('*')
      .eq('team_id', teamId)
      .eq('game_name', game_name)
      .single();

    if (existing) {
      return res.status(403).json({ error: 'Game already completed. One attempt only.' });
    }

    // 2. Insert score
    const { error } = await supabase.from('game_scores').insert({
      team_id: teamId,
      game_name,
      score,
      time_taken,
      moves,
      completed: true
    });

    if (error) throw error;

    // 3. Optional: Sync score to team total if needed
    // await supabase.rpc('increment_team_game_score', { team_id: teamId, increment: score });

    res.json({ message: 'Score saved successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save game score' });
  }
};

const getGamesStatus = async (req, res) => {
  const teamId = req.user.id;
  try {
    const { data: scores } = await supabase.from('game_scores').select('*').eq('team_id', teamId);
    const scoreMap = {};
    scores?.forEach(s => scoreMap[s.game_name] = s);
    
    // Check if games are unlocked (from global config)
    const { data: config } = await supabase.from('global_config').select('value').eq('key', 'game_zone_unlocked').single();
    
    res.json({ scores: scoreMap, unlocked: config?.value === true || String(config?.value).toLowerCase() === 'true' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch status' });
  }
};

let dashboardCache = null;
let lastDashboardUpdate = 0;
const DASHBOARD_TTL = 2000; // 2 seconds

const getDashboardState = async (req, res) => {
  try {
    // Fetch current team's latest data (non-cached for real-time problem selection)
    const { data: teamData } = await supabase
      .from('teams')
      .select('problem_id, attendance_status, ppt_status')
      .eq('id', req.user.id)
      .single();

    const { data: config } = await supabase.from('global_config').select('value').eq('key', 'problem_selection_state').maybeSingle();
    let state = { countdown: 3600, revealed: false, enabled: false };
    if (config?.value) {
      state = typeof config.value === 'string' ? JSON.parse(config.value) : config.value;
    }
    
    const { data: roundConfig } = await supabase.from('global_config').select('value').eq('key', 'active_round').maybeSingle();
    state.active_round = String(roundConfig?.value || "1");

    // Add team-specific data
    state.problem_id = teamData?.problem_id;
    state.attendance_status = teamData?.attendance_status;
    state.ppt_status = teamData?.ppt_status;

    // Also fetch broadcast alert
    const { data: alertConfig } = await supabase.from('global_config').select('value').eq('key', 'broadcast_message').maybeSingle();
    if (alertConfig?.value) {
      state.broadcast = alertConfig.value;
    }

    const { data: wallConfig } = await supabase.from('global_config').select('value').eq('key', 'memory_wall_active').maybeSingle();
    state.memory_wall_active = wallConfig?.value === true || String(wallConfig?.value).toLowerCase() === 'true';

    const { data: gameConfig } = await supabase.from('global_config').select('value').eq('key', 'game_zone_unlocked').maybeSingle();
    state.game_zone_unlocked = gameConfig?.value === true || String(gameConfig?.value).toLowerCase() === 'true';

    // BROADCAST: Fetch current attendance session state from NEW relational system
    const { data: activeSess } = await supabase.from('session_registry').select('*').eq('is_active', true).maybeSingle();
    state.attendance_open = !!activeSess;
    state.active_session = activeSess?.session_name || 'Closed';
    state.active_session_id = activeSess?.id || null;
    state.active_session_members = [];
    state.present_count = 0;
    state.total_count = 0;

    // FETCH: Detailed member status for active session
    if (activeSess) {
       const { data: attendance } = await supabase.from('mission_reports').select('member_id').eq('session_id', activeSess.id).eq('team_id', req.user.id);
       const presentRegs = new Set((attendance || []).map(a => a.member_id));
       const members = Array.isArray(req.user.members) ? req.user.members : [];
       
       state.active_session_members = members.map(m => ({
          name: m.name,
          regNo: m.regNo,
          status: presentRegs.has(m.regNo) ? 'Present' : 'Not Marked'
       }));
       state.present_count = presentRegs.size;
       state.total_count = members.length;
    }
    
    // INTEGRATED: Fetch Assigned Reviewer Name for Current Round (Range-based V2)
    try {
      const { fetchMappings, getReviewerSlot } = require('./adminController');
      const { reviewerNames } = await fetchMappings();
      
      const currentRound = String(state.active_round || "1");
      const slot = getReviewerSlot(req.user.id, currentRound);
      
      const assignedName = (reviewerNames[currentRound] && reviewerNames[currentRound][slot]) 
        ? reviewerNames[currentRound][slot] 
        : `Awaiting ${slot || 'Reviewer'}`;
        
      state.assigned_reviewer = assignedName;
    } catch (e) {
      state.assigned_reviewer = "Syncing...";
    }

    res.json(state);
  } catch (err) {
    console.error('getDashboardState error:', err);
    res.status(500).json({ error: 'Failed' });
  }
};

const getAttendance = async (req, res) => {
  const teamId = req.user?.id;
  try {
    // Stage 1: Fetch raw attendance records
    const { data: attendance, error: attError } = await supabase
      .from('mission_reports')
      .select('session_id, member_id, scanned_at')
      .eq('team_id', teamId);
    
    if (attError) throw attError;
    if (!attendance || attendance.length === 0) return res.json([]);

    const sessionIds = [...new Set(attendance.map(a => a.session_id))];
    const { data: sessionsData, error: sessError } = await supabase
      .from('session_registry')
      .select('id, session_name')
      .in('id', sessionIds);

    if (sessError) throw sessError;

    const sessionNames = (sessionsData || []).reduce((acc, s) => {
      acc[s.id] = s.session_name;
      return acc;
    }, {});

    const grouped = {};
    attendance.forEach(a => {
      const sId = a.session_id;
      if (!grouped[sId]) {
        grouped[sId] = {
          session_id: sId,
          session_name: sessionNames[sId] || `Session ${sId}`,
          status: 'Present',
          members_count: 0,
          timestamp: a.scanned_at
        };
      }
      grouped[sId].members_count += 1;
    });

    res.json(Object.values(grouped));
  } catch (err) {
    console.error('[ATTENDANCE_ERROR] getAttendance Failure:', err);
    res.status(500).json({ error: 'Failed' });
  }
};

module.exports = { getTeamProfile, getAttendance, submitGameScore, getGamesStatus, getDashboardState };
