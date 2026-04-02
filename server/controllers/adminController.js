const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

// High-performance cache for reviewer mappings (across 109 teams)
let mappingsCache = null;
let lastMappingsUpdate = 0;
const MAPPINGS_TTL = 3000; // 3 seconds

// Static Team Registry Cache (109 teams)
let teamsCache = null;
let lastTeamsUpdate = 0;
const TEAMS_TTL = 60000; // 60 seconds

// High-performance Scoreboard Cache
let scoreboardCache = null;
let lastScoreboardUpdate = 0;
const SCOREBOARD_TTL = 15000; // 15 seconds

// Game Leaderboard Cache
let gameLeaderboardCache = null;
let lastGameUpdate = 0;
const GAME_TTL = 15000; // 15 seconds

const fetchTeams = async () => {
  if (teamsCache && (Date.now() - lastTeamsUpdate < TEAMS_TTL)) {
    return teamsCache;
  }
  const { data, error } = await supabase.from('teams').select('id, name, cluster, members').order('id');
  if (!error && data) {
    teamsCache = data;
    lastTeamsUpdate = Date.now();
  }
  return data || [];
};

const getReviewerSlot = (teamIdStr, round) => {
  const tid = parseInt(teamIdStr.replace('CREATOR-', ''));
  if (isNaN(tid)) return null;

  if (String(round) === "1") {
    if (tid >= 1 && tid <= 22) return "R1";
    if (tid >= 23 && tid <= 45) return "R2";
    if (tid >= 46 && tid <= 67) return "R3";
    if (tid >= 68 && tid <= 89) return "R4";
    if (tid >= 90 && tid <= 109) return "R5";
  } else {
    // Round 2 & 3
    if (tid >= 1 && tid <= 18) return "R1";
    if (tid >= 19 && tid <= 37) return "R2";
    if (tid >= 38 && tid <= 56) return "R3";
    if (tid >= 57 && tid <= 75) return "R4";
    if (tid >= 76 && tid <= 94) return "R5";
    if (tid >= 95 && tid <= 109) return "R6";
  }
  return null;
};

const fetchMappings = async () => {
  if (mappingsCache && (Date.now() - lastMappingsUpdate < MAPPINGS_TTL)) {
    return mappingsCache;
  }
  try {
    const res = await supabase.from('global_config').select('value').eq('key', 'reviewer_names_v2').maybeSingle();
    const reviewerNames = res.data?.value || { "1": {}, "2": {}, "3": {} };
    
    mappingsCache = { reviewerNames };
    lastMappingsUpdate = Date.now();
    return mappingsCache;
  } catch (err) {
    return { reviewerNames: { "1": {}, "2": {}, "3": {} } };
  }
};

const updateConfig = async (req, res) => {
  const { key, value } = req.body;
  try {
    const { error } = await supabase.from('global_config').upsert({ key, value });
    if (error) throw error;
    
    // Broadcast state changes for critical event lifecycle keys
    const io = req.app.get('socketio');
    if (io) {
      if (key === 'problem_selection_state') io.emit('selection_state_changed', value);
      if (key === 'game_zone_unlocked') io.emit('game_zone_changed', value);
      if (key === 'active_round') io.emit('round_changed', value);
      if (key === 'attendance_open' || key === 'active_session') {
        const activeRes = await supabase.from('session_registry').select('id').eq('is_active', true).maybeSingle();
        let uniqueTeamsPresent = 0;
        if (activeRes.data) {
           const { data: attendance } = await supabase.from('mission_reports').select('team_id').eq('session_id', activeRes.data.id);
           uniqueTeamsPresent = new Set((attendance || []).map(a => a.team_id)).size;
        }
        const { data: aOpen } = await supabase.from('global_config').select('value').eq('key', 'attendance_open').maybeSingle();
        const { data: aSess } = await supabase.from('global_config').select('value').eq('key', 'active_session').maybeSingle();
        io.emit('attendance_session_changed', { sessionName: aSess?.value, status: aOpen?.value });
      }
    }
    
    res.json({ message: `Updated ${key} successfully` });
  } catch (err) {
    res.status(500).json({ error: 'Failed', details: err.message });
  }
};

const getScoreboard = async (req, res) => {
  if (scoreboardCache && (Date.now() - lastScoreboardUpdate < SCOREBOARD_TTL)) {
    return res.json(scoreboardCache);
  }
  try {
    const teams = await fetchTeams(); 
    const { data: reviews } = await supabase.from('reviews').select('*');
    
    const reviewsData = reviews || [];
    
    const scoreboard = teams.map(t => {
      const teamReviews = reviews.filter(r => r.team_id === t.id);
      const r1 = teamReviews.find(r => r.round === 1)?.total_marks || 0;
      const r2 = teamReviews.find(r => r.round === 2)?.total_marks || 0;
      const r3 = teamReviews.find(r => r.round === 3)?.total_marks || 0;
      return { team_id: t.id, team_name: t.name, r1, r2, r3, total: r1 + r2 + r3 };
    }).sort((a, b) => b.total - a.total);

    scoreboardCache = scoreboard;
    lastScoreboardUpdate = Date.now();
    res.json(scoreboard);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
};

const getDashboardSummary = async (req, res) => {
  try {
    // Consolidated high-performance query for all dashboard metrics
    const [teamsRes, attendanceStatsRes, configRes, sessionConfigRes, selectionConfigRes] = await Promise.all([
      supabase.from('teams').select('id, problem_id', { count: 'exact' }),
      supabase.from('global_config').select('value').eq('key', 'active_session').maybeSingle(),
      supabase.from('global_config').select('value').eq('key', 'attendance_open').maybeSingle(),
      supabase.from('global_config').select('value').eq('key', 'attendance_sessions').maybeSingle(),
      supabase.from('global_config').select('value').eq('key', 'problem_selection_state').maybeSingle()
    ]);

    const totalTeams = teamsRes.count || 109;
    const problemsSelected = (teamsRes.data || []).filter(t => t.problem_id).length;
    const activeSession = attendanceStatsRes.data?.value || 'Morning Check-In';
    const attendanceOpen = configRes.data?.value === true || String(configRes.data?.value) === 'true';
    const availableSessions = sessionConfigRes.data?.value || ['Morning Check-In', 'Afternoon Check-In'];
    const selectionState = selectionConfigRes.data?.value || { released: false, timer_started: false };

    // Fetch present count for active session
    const activeRes = await supabase.from('session_registry').select('id').eq('session_name', activeSession).maybeSingle();
    let uniquePresent = 0;
    if (activeRes.data) {
      const { data: attendance } = await supabase.from('mission_reports').select('team_id').eq('session_id', activeRes.data.id);
      uniquePresent = new Set((attendance || []).map(a => a.team_id)).size;
    }

    // GAME ZONE STATUS: Extra check for admin clarity
    const { data: gzConfig } = await supabase.from('global_config').select('value').eq('key', 'game_zone_unlocked').maybeSingle();
    const isUnlocked = gzConfig?.value === true || String(gzConfig?.value).toLowerCase() === 'true';

    res.json({
      stats: {
        total_teams: totalTeams,
        active_teams: uniquePresent,
        problems_selected: problemsSelected,
        reviews_completed: 0 
      },
      attendance: {
        total: totalTeams,
        present: uniquePresent,
        session: activeSession
      },
      sessions: availableSessions,
      sessionActive: attendanceOpen,
      problemSelectionState: selectionState,
      gameZoneUnlocked: isUnlocked
    });
  } catch (err) {
    console.error('Summary Error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
};

const exportData = async (req, res) => {
  const { sessionId, mode } = req.query; // mode: 'all', 'team-wise', 'present-only', 'pending-only'
  
  try {
    if (!sessionId) return res.status(400).json({ error: 'Session ID required' });
    
    // Fetch Session Detail
    const { data: sessionInfo } = await supabase.from('session_registry').select('session_name').eq('id', sessionId).maybeSingle();
    const sessionName = sessionInfo?.session_name || 'Export';

    // Fetch Teams (using cache) & Records
    const teams = await fetchTeams();
    const { data: attendance } = await supabase.from('mission_reports').select('*').eq('session_id', sessionId);
    
    let reportData = [];

    if (mode === 'team-wise') {
      reportData = (teams || []).map(t => {
        const teamAttendance = (attendance || []).filter(a => a.team_id === t.id);
        const totalMembers = Array.isArray(t.members) ? t.members.length : 5;
        return {
          'Team ID': t.id,
          'Team Name': t.name,
          'Cluster': t.cluster,
          'Status': teamAttendance.length === totalMembers ? 'Completed' : (teamAttendance.length > 0 ? 'Partial' : 'Pending'),
          'Members Present': `${teamAttendance.length} / ${totalMembers}`,
          'Names Present': teamAttendance.map(a => a.name).join(', '),
          'Session': sessionName
        };
      });
    } else if (mode === 'present-only') {
      reportData = (attendance || []).map(a => ({
        'Team ID': a.team_id,
        'Member ID': a.member_id,
        'Member Name': a.name,
        'Status': 'Present',
        'Timestamp': new Date(a.scanned_at).toLocaleString(),
        'Scanned By': a.scanned_by,
        'Session': sessionName
      }));
    } else if (mode === 'pending-only') {
      const presentTeamIds = new Set((attendance || []).map(a => a.team_id));
      reportData = (teams || []).filter(t => !presentTeamIds.has(t.id)).map(t => ({
        'Team ID': t.id,
        'Team Name': t.name,
        'Cluster': t.cluster,
        'Status': 'Pending',
        'Session': sessionName
      }));
    } else { // 'all' (Detailed row per member for ALL teams)
      reportData = (teams || []).flatMap(t => {
        const teamMembers = Array.isArray(t.members) ? t.members : JSON.parse(t.members || '[]');
        const teamAttendance = (attendance || []).filter(a => a.team_id === t.id);
        
        return teamMembers.map(m => {
          const isPresent = teamAttendance.some(a => String(a.member_id) === String(m.regNo || m.reg_no));
          return {
            'Team ID': t.id,
            'Team Name': t.name,
            'Cluster': t.cluster,
            'Member Name': m.name,
            'Member ID': m.regNo || m.reg_no,
            'Status': isPresent ? 'Present' : 'Absent',
            'Timestamp': isPresent ? new Date(teamAttendance.find(a => String(a.member_id) === String(m.regNo || m.reg_no))?.scanned_at).toLocaleString() : 'N/A',
            'Session': sessionName
          };
        });
      });
    }

    res.json(reportData);
  } catch (err) {
    console.error('exportData error:', err);
    res.status(500).json({ error: 'Failed' });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const teamsCountRes = await supabase.from('teams').select('*', { count: 'exact', head: true });
    const problemsCount = await supabase.from('teams').select('*', { count: 'exact', head: true }).not('problem_id', 'is', null);

    // Get active session metrics
    const activeRes = await supabase.from('session_registry').select('id').eq('is_active', true).maybeSingle();
    let uniqueTeamsPresent = 0;
    if (activeRes.data) {
       const { data: attendance } = await supabase.from('mission_reports').select('team_id').eq('session_id', activeRes.data.id);
       uniqueTeamsPresent = new Set((attendance || []).map(a => a.team_id)).size;
    }

    res.json({
      total_teams: teamsCountRes.count || 109,
      active_teams: uniqueTeamsPresent,
      problems_selected: problemsCount.count || 0,
      reviews_completed: 0
    });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
};

const getAttendanceStats = async (req, res) => {
  try {
    const teamsCountRes = await supabase.from('teams').select('*', { count: 'exact', head: true });
    const activeRes = await supabase.from('session_registry').select('id, session_name').eq('is_active', true).maybeSingle();
    
    let presentCount = 0;
    if (activeRes.data) {
        const { data: attendance } = await supabase.from('mission_reports').select('team_id').eq('session_id', activeRes.data.id);
        presentCount = new Set((attendance || []).map(a => a.team_id)).size;
    }
    
    res.json({ total: teamsCountRes.count || 109, present: presentCount, session: activeRes.data?.session_name || 'None' });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
};

const getAttendanceDashboard = async (req, res) => {
  const { sessionId } = req.query;
  try {
    // 1. Fetch all teams (ordered by ID for consistent grid mapping - using cache)
    const teams = await fetchTeams();

    // 2. Determine target session
    let targetSessionId = sessionId;
    if (!targetSessionId) {
      const activeRes = await supabase.from('session_registry').select('id').eq('is_active', true).maybeSingle();
      targetSessionId = activeRes.data?.id;
    }

    if (!targetSessionId) {
      return res.json([]); // No session selected and none active
    }

    // 3. Fetch ALL attendance records for this session from the fresh mission_reports table
    const attendanceRes = await supabase.from('mission_reports').select('team_id, status, member_id').eq('session_id', targetSessionId);
    const attendance = attendanceRes.data || [];

    // 4. Map teams to their live attendance status (Pending/Partial/Completed)
    const dashboard = teams.map(t => {
      const teamRecords = attendance.filter(a => a.team_id === t.id);
      const totalMembers = Array.isArray(t.members) ? t.members.length : 5; // Default to 5 if not found
      const presentCount = teamRecords.length; // Each record in v2 is a present member
      
      let status = 'Pending';
      if (presentCount > 0) {
        status = presentCount >= totalMembers ? 'Completed' : 'Partial';
      }

      return { 
        id: t.id, 
        name: t.name, 
        cluster: t.cluster, 
        members: t.members,
        totalMembers,
        membersPresent: presentCount, 
        presentMemberIds: teamRecords.map(a => String(a.member_id)),
        status: status 
      };
    });

    res.json(dashboard);
  } catch (err) {
    console.error('getAttendanceDashboard error:', err);
    res.status(500).json({ error: 'Failed' });
  }
};

const getGameLeaderboard = async (req, res) => {
  if (gameLeaderboardCache && (Date.now() - lastGameUpdate < GAME_TTL)) {
    return res.json(gameLeaderboardCache);
  }
  try {
    const scoresRes = await supabase.from('game_scores').select('team_id, game_name, score, time_taken, teams(name)').order('score', { ascending: false });
    const scores = scoresRes.data || [];
    const leaderboardMap = {};
    scores.forEach(s => {
      if (!leaderboardMap[s.team_id]) {
        leaderboardMap[s.team_id] = { team_id: s.team_id, name: s.teams?.name || s.team_id, total_score: 0, games: [] };
      }
      leaderboardMap[s.team_id].total_score += s.score;
      leaderboardMap[s.team_id].games.push({ name: s.game_name, score: s.score });
    });
    const leaderboard = Object.values(leaderboardMap).sort((a, b) => b.total_score - a.total_score);
    
    gameLeaderboardCache = leaderboard;
    lastGameUpdate = Date.now();
    res.json(leaderboard);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
};

const manageAttendanceSessions = async (req, res) => {
  const { action, sessionName } = req.body || {};
  const io = req.app.get('socketio');

  try {
    if (action === 'START' && sessionName) {
      console.log('[DEBUG] Starting attendance session:', sessionName);
      
      // 1. Deactivate all existing sessions (Safe sequential update)
      await supabase.from('session_registry').update({ is_active: false }).neq('is_active', false);
      
      // 2. Create new active session
      const { data: newSession, error: insertError } = await supabase.from('session_registry').insert({
        session_name: sessionName,
        is_active: true,
        start_time: new Date()
      }).select();

      if (insertError) {
        console.error('[CRITICAL] Session Insert Error:', insertError);
        throw insertError;
      }

      const createdSession = Array.isArray(newSession) ? newSession[0] : newSession;
      if (!createdSession) throw new Error('Failed to create session');

      // 3. Update global config for dashboard reactivity
      await Promise.all([
        supabase.from('global_config').upsert({ key: 'active_session', value: sessionName }),
        supabase.from('global_config').upsert({ key: 'attendance_open', value: true }),
        supabase.from('global_config').upsert({ key: 'attendance_v2_active_id', value: createdSession.id })
      ]);

      if (io) io.emit('attendance_session_changed', { sessionName, status: true, sessionId: createdSession.id });
      return res.json({ message: 'Session started', session: createdSession });
    }

    if (action === 'END') {
      // Deactivate active session
      const { data: active } = await supabase.from('session_registry').select('id, session_name').eq('is_active', true).maybeSingle();
      await supabase.from('session_registry').update({ is_active: false, end_time: new Date() }).eq('is_active', true);
      
      await supabase.from('global_config').upsert({ key: 'attendance_open', value: false });
      await supabase.from('global_config').upsert({ key: 'attendance_v2_active_id', value: null });

      if (io) io.emit('attendance_session_changed', { sessionName: active?.session_name || 'None', status: false });
      return res.json({ message: 'Session ended' });
    }

    // Default: Return all sessions (History)
    const { data: sessions } = await supabase.from('session_registry').select('*').order('created_at', { ascending: false });
    const activeRes = await supabase.from('global_config').select('value').eq('key', 'attendance_open').maybeSingle();
    
    res.json({ sessions: sessions || [], isOpen: activeRes.data?.value === true || String(activeRes.data?.value) === 'true' });
  } catch (err) {
    console.error('manageAttendanceSessions error:', err);
    res.status(500).json({ error: 'Failed' });
  }
};

const getTeams = async (req, res) => {
  try {
    const teamsRes = await supabase.from('teams').select('*').order('id');
    const starsRes = await supabase.from('attendance').select('team_id, status').eq('session_id', 'STARS');
    const teams = teamsRes.data || [];
    const starsMeta = starsRes.data || [];

    const enriched = teams.map(t => {
      const starEntry = starsMeta.find(m => m.team_id === t.id);
      return { ...t, stars: parseInt(starEntry?.status || '0') };
    });
    res.json(enriched);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
};

const getReviewers = async (req, res) => {
  try {
    const { data } = await supabase.from('reviewers').select('*').order('id');
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
};

const assignReviewer = async (req, res) => {
  const { reviewerId, teamIds, isAssignment, round = "1" } = req.body || {}; 
  try {
    const configRes = await supabase.from('global_config').select('value').eq('key', 'reviewer_mappings').single();
    let mappings = configRes.data?.value || {};
    if (Array.isArray(mappings)) mappings = { "1": mappings };
    if (!mappings[round]) mappings[round] = [];
    if (isAssignment) {
      (teamIds || []).forEach(tid => {
        mappings[round] = mappings[round].filter(m => m.teamId !== tid);
        mappings[round].push({ reviewerId, teamId: tid });
      });
    } else {
      mappings[round] = mappings[round].filter(m => !(teamIds || []).includes(m.teamId));
    }
    await supabase.from('global_config').upsert({ key: 'reviewer_mappings', value: mappings });
    mappingsCache = null;
    res.json({ message: 'Updated', mappings: mappings[round] });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
};

const clearData = async (req, res) => {
  const { type } = req.body || {};
  try {
    if (type === 'selections') {
      await supabase.from('teams').update({ problem_id: null }).not('id', 'is', null);
      await supabase.from('problems').update({ selected_by: null, selected_cluster: null }).not('id', 'is', null);
      const io = req.app.get('socketio');
      if (io) io.emit('problem_reset');
    } else if (type === 'attendance') {
      await supabase.from('mission_reports').delete().neq('session_id', 'SYSTEM'); 
      await supabase.from('teams').update({ attendance_status: 'Pending' });
      const io = req.app.get('socketio');
      if (io) io.emit('attendance_reset');
    } else if (type === 'all') {
      await Promise.all([
        supabase.from('teams').update({ problem_id: null, attendance_status: 'Pending' }).neq('id', 'SYSTEM_DUMMY'),
        supabase.from('problems').update({ selected_by: null, selected_cluster: null }).neq('id', 'SYSTEM_DUMMY'),
        supabase.from('mission_reports').delete().neq('session_id', 'SYSTEM'),
        supabase.from('global_config').upsert({ key: 'reviewer_mappings', value: {} })
      ]);
      mappingsCache = null;
      const io = req.app.get('socketio');
      if (io) io.emit('all_reset');
    }
    res.json({ message: 'Clear success' });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
};

const removeMapping = async (req, res) => {
  const { round, reviewerId, teamId } = req.body || {};
  try {
    const configRes = await supabase.from('global_config').select('value').eq('key', 'reviewer_mappings').single();
    let mappings = configRes.data?.value || {};
    if (mappings[round]) {
      mappings[round] = mappings[round].filter(m => !(m.reviewerId === reviewerId && m.teamId === teamId));
      await supabase.from('global_config').update({ value: mappings }).eq('key', 'reviewer_mappings');
      mappingsCache = null;
    }
    res.json({ message: 'Removed' });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
};

module.exports = { 
  updateConfig, getScoreboard, getAnalytics, exportData, getTeams, getReviewers, 
  assignReviewer, getAttendanceStats, getAttendanceDashboard, getGameLeaderboard, 
  managePolls: (req, res) => res.json({ message: 'Polls coming soon' }), 
  manageAttendanceSessions, fetchMappings, getReviewerSlot, clearData, removeMapping,
  getDashboardSummary, fetchTeams
};
