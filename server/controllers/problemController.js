const { createClient } = require('@supabase/supabase-js');
const redis = require('../utils/redis');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

// In-memory cache for massive performance boost (108 teams concurrent)
let problemsCache = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 2000; // 2 seconds safety buffer

const fetchAndCacheProblems = async () => {
  const { data: problems } = await supabase.from('problems').select('*').order('id', { ascending: true });
  const { data: selections } = await supabase.from('teams').select('problem_id, cluster').not('problem_id', 'is', null);

  problemsCache = problems.map(p => {
    const pSelections = selections?.filter(s => s.problem_id === p.id) || [];
    return {
      ...p,
      taken_clusters: pSelections.map(s => s.cluster),
      taken_count: pSelections.length
    };
  });
  lastCacheUpdate = Date.now();
  return problemsCache;
};

const selectProblem = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Unauthorized: Session required.' });
  }

  const { id: teamId, cluster, name: teamName } = req.user;
  const { selectedProblemId } = req.body;

  if (!selectedProblemId) {
    return res.status(400).json({ error: 'Missing challenge selection data.' });
  }

  try {
    // 1. Check if selection is authorized & Timer completion
    const { data: config } = await supabase.from('global_config').select('value').eq('key', 'problem_selection_state').single();
    const state = config?.value ? (typeof config.value === 'string' ? JSON.parse(config.value) : config.value) : { released: false, timer_started: false, end_time: 0 };
    
    // Selection is ONLY allowed if released is true AND the timer has expired
    const isTimerExpired = state.timer_started && state.end_time && Date.now() >= state.end_time;
    if (!state.released || !isTimerExpired) {
      return res.status(403).json({ error: 'Selection is currently LOCKED: Protocol incomplete.' });
    }

    // 2. ATOMIC SELECTION via RPC
    const { data: rpcRes, error: rpcError } = await supabase.rpc('select_team_problem', {
      t_id: teamId,
      p_id: selectedProblemId,
      t_cluster: cluster
    });

    if (rpcError) {
      console.error('RPC Selection Error:', rpcError);
      return res.status(500).json({ error: 'DB_SYNC_ERROR: Database execution failed.' });
    }

    if (!rpcRes.success) {
      // Map RPC errors to appropriate HTTP responses
      if (rpcRes.error === 'PROBLEM_FULL') {
        return res.status(410).json({ error: 'This challenge is already full (3/3 teams reached).' });
      }
      if (rpcRes.error === 'CLUSTER_COLLISION' || rpcRes.error === 'RACE_LOST_CLUSTER') {
        return res.status(409).json({ error: `Your Cluster (${cluster}) has already claimed this challenge.` });
      }
      if (rpcRes.error === 'ALREADY_SELECTED') {
        return res.status(409).json({ error: `Selection already locked: Statement ${rpcRes.current}` });
      }
      return res.status(409).json({ error: rpcRes.error || 'Selection failed: Competitive race condition.' });
    }

    // 4. BROADCAST
    const io = req.app.get('socketio');
    if (io) io.emit('problem_selected', { problemId: selectedProblemId, cluster, teamId });
    
    problemsCache = null; // Invalidate
    res.json({ message: 'Success!', problemId: selectedProblemId });
  } catch (err) {
    console.error('CRITICAL Selection Error:', err);
    res.status(500).json({ error: 'Server synchronization failure.' });
  }
};

const getProblems = async (req, res) => {
  try {
    // Return cache if fresh
    if (problemsCache && (Date.now() - lastCacheUpdate < CACHE_TTL)) {
      return res.json(problemsCache);
    }

    const data = await fetchAndCacheProblems();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
};

const getProblemById = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase.from('problems').select('*').eq('id', id).single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: 'Problem not found' });
  }
};

module.exports = { selectProblem, getProblems, getProblemById };
