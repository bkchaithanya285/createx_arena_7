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
    // 1. Fetch ALL round statuses from global config
    const [rd1, rd2, rd3] = await Promise.all([
      supabase.from('global_config').select('value').eq('key', 'review_round_1_status').maybeSingle(),
      supabase.from('global_config').select('value').eq('key', 'review_round_2_status').maybeSingle(),
      supabase.from('global_config').select('value').eq('key', 'review_round_3_status').maybeSingle()
    ]);
    const statuses = {
      1: rd1.data?.value || 'closed',
      2: rd2.data?.value || 'closed',
      3: rd3.data?.value || 'closed'
    };

    // 2. Fetch ALL teams using the high-performance cache
    const allTeams = await fetchTeams();
    const assignedTeams = allTeams.filter(t => getReviewerSlot(t.id) === slotKey);

    if (assignedTeams.length === 0) return res.json({ rounds: {}, statuses });

    // 3. Fetch ALL review records for this reviewer across ALL rounds
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('team_id, round')
      .eq('reviewer_id', req.user.id);

    // 4. Map data into rounds
    const roundsData = {};
    [1, 2, 3].forEach(r => {
      roundsData[r] = assignedTeams.map(t => {
        const hasEvaluated = allReviews?.some(rev => rev.team_id === t.id && String(rev.round) === String(r));
        return {
          ...t,
          status: hasEvaluated ? 'Completed' : 'Pending',
          currentRound: String(r)
        };
      });
    });

    res.json({ rounds: roundsData, statuses });
  } catch (err) {
    console.error('getAssignedTeams Error:', err);
    res.status(500).json({ error: 'Failed to fetch assigned teams' });
  }
};

module.exports = { submitEvaluation, getAssignedTeams };
