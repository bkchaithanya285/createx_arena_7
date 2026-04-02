const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);
const { getReviewerSlot, fetchTeams } = require('./adminController');

const submitEvaluation = async (req, res) => {
  const reviewerId = req.user.id;
  const { teamId, round, marks } = req.body;

  try {
    // 1. Calculate weighted total for the round
    const totalMarks = Object.values(marks).reduce((a, b) => a + (parseInt(b) || 0), 0);

    // 2. Check if already evaluated for this round
    const { data: existing } = await supabase
      .from('reviews')
      .select('*')
      .eq('team_id', teamId)
      .eq('round', round)
      .single();

    if (existing) {
      return res.status(403).json({ error: `Evaluation for Round ${round} already submitted and locked.` });
    }

    // 3. Insert review
    const { error } = await supabase.from('reviews').insert({
      team_id: teamId,
      reviewer_id: reviewerId,
      round,
      criteria_marks: marks,
      total_marks: totalMarks
    });

    if (error) throw error;

    res.json({ message: `Round ${round} evaluation submitted successfully!`, total: totalMarks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit evaluation' });
  }
};

const getAssignedTeams = async (req, res) => {
  const username = req.user.username; // e.g., reviewer_1
  const slot = username.split('_')[1].toUpperCase(); // R1, R2...
  const slotKey = "R" + slot;

  try {
    // 1. Get active round (Check standalone key first, then fallback to selection state)
    const { data: roundConfig } = await supabase.from('global_config').select('value').eq('key', 'active_round').maybeSingle();
    let activeRound = "1";
    if (roundConfig?.value) {
       activeRound = String(roundConfig.value);
    } else {
       const { data: selectionConfig } = await supabase.from('global_config').select('value').eq('key', 'problem_selection_state').maybeSingle();
       const state = typeof selectionConfig?.value === 'string' ? JSON.parse(selectionConfig.value) : selectionConfig?.value;
       activeRound = String(state?.active_round || "1");
    }

    // 2. Fetch teams using the high-performance cache
    const allTeams = await fetchTeams();

    const assignedTeams = allTeams.filter(t => getReviewerSlot(t.id, activeRound) === slotKey);

    if (assignedTeams.length === 0) return res.json({ teams: [], activeRound });

    // 3. Fetch review status for these teams specifically FOR THIS ROUND
    const assignedTeamIds = assignedTeams.map(t => t.id);
    const { data: reviews } = await supabase
      .from('reviews')
      .select('team_id')
      .eq('reviewer_id', req.user.id)
      .eq('round', activeRound);

    const teamData = assignedTeams.map(t => {
      const hasEvaluated = reviews?.some(r => r.team_id === t.id);
      return {
        ...t,
        status: hasEvaluated ? 'Completed' : 'Pending',
        currentRound: activeRound
      };
    });

    res.json({ teams: teamData, activeRound });
  } catch (err) {
    console.error('getAssignedTeams Error:', err);
    res.status(500).json({ error: 'Failed to fetch assigned teams' });
  }
};

module.exports = { submitEvaluation, getAssignedTeams };
