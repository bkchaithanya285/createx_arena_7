import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { 
  ClipboardCheck, 
  Lock, 
  AlertTriangle, 
  CheckCircle, 
  Send, 
  Loader2, 
  Award,
  ChevronRight 
} from 'lucide-react';

const EvaluationForm = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [activeRound, setActiveRound] = useState('1');
  const [team, setTeam] = useState(null);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [marks, setMarks] = useState({});
  const [error, setError] = useState('');

  const roundsConfig = {
    1: [
      { id: 'understanding', label: 'Understanding', max: 10 },
      { id: 'creativity', label: 'Creativity', max: 10 },
      { id: 'communication', label: 'Communication', max: 10 }
    ],
    2: [
      { id: 'technical', label: 'Technical', max: 10 },
      { id: 'responsibility', label: 'Responsibility', max: 10 },
      { id: 'collaboration', label: 'Collaboration', max: 10 }
    ],
    3: [
      { id: 'explanation', label: 'Explanation', max: 15 },
      { id: 'problem_solving', label: 'Problem Solving', max: 10 },
      { id: 'innovation', label: 'Innovation', max: 10 },
      { id: 'real_world', label: 'Real-world', max: 5 }
    ]
  };

  const [searchParams] = useSearchParams();
  const queryRound = searchParams.get('round');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch assigned data for all rounds
        const assRes = await api.get('/reviewer/assigned-teams');
        
        if (!assRes.data || !assRes.data.statuses) {
          throw new Error('Invalid assigned teams data');
        }

        // 2. Determine targeted round (URL param or fallback)
        const round = queryRound || Object.keys(assRes.data.statuses).find(r => assRes.data.statuses[r] === 'open') || '1';
        setActiveRound(round);

        // 3. Find team in that specific round's dataset
        const currentRoundTeams = assRes.data.rounds?.[round] || [];
        const currentTeam = currentRoundTeams.find(t => t.id === teamId);
        
        if (!currentTeam) {
            alert(`This team is not assigned to you for Round ${round}.`);
            return navigate('/reviewer');
        }
        setTeam(currentTeam);
        if (currentTeam.status === 'Completed') setLocked(true);

        // 2. Initialize marks
        const initialMarks = {};
        roundsConfig[round].forEach(c => initialMarks[c.id] = '');
        setMarks(initialMarks);

      } catch (err) {
        setError('Failed to load evaluation data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [teamId]);

  const handleInputChange = (id, val, max) => {
    if (locked) return;
    const num = Math.min(max, Math.max(0, parseInt(val) || 0));
    setMarks(prev => ({ ...prev, [id]: isNaN(num) ? '' : num }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.values(marks).some(v => v === '')) return alert('Please fill all criteria');
    
    if (!window.confirm(`FINAL CONFIRMATION: Lock Round ${activeRound} marks for ${team.name}?`)) return;

    setSubmitting(true);
    try {
      await api.post('/reviewer/submit-evaluation', {
        teamId,
        round: activeRound,
        marks
      });
      setLocked(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 text-arena-rose">
      <Loader2 className="w-12 h-12 animate-spin" />
      <p className="font-black uppercase tracking-widest text-xs">Syncing with Command Center...</p>
    </div>
  );

  return (
    <div className="p-8 lg:p-12 animate-in fade-in zoom-in duration-500 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/reviewer')} className="bg-white/5 p-3 rounded-xl text-arena-muted hover:text-white transition-all group">
          <ChevronRight className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
            <h2 className="text-sm font-black text-arena-rose uppercase tracking-[0.3em] mb-1">Evaluation Portal</h2>
            <p className="text-white font-bold uppercase tracking-widest text-xs">Assigned Round: {activeRound}</p>
        </div>
      </div>

      <div className="glass-premium p-8 lg:p-12 relative overflow-hidden shadow-wine">
        {locked && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-20 animate-in fade-in duration-500">
            <div className="flex flex-col items-center gap-6 p-10 glass-premium border-green-500/30 text-center max-w-sm">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-400 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h2 className="text-white font-black text-2xl uppercase tracking-widest">Submission Locked</h2>
              <p className="text-arena-muted text-xs uppercase tracking-widest leading-relaxed">Round {activeRound} marks for <span className="text-white font-bold">{team?.name}</span> have been finalized.</p>
              <button onClick={() => navigate('/reviewer')} className="glass-button w-full">Return to Roster</button>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 pb-8 border-b border-white/10">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-arena-rose uppercase tracking-[0.4em]">Evaluating Team</span>
            <h1 className="text-4xl font-black text-white tracking-widest uppercase">{team?.name}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              {(Array.isArray(team?.members) ? team.members : JSON.parse(team?.members || '[]')).map((m, i) => (
                <span key={i} className="text-[9px] font-black bg-white/5 border border-white/10 px-2 py-1 rounded text-arena-muted uppercase tracking-widest">
                  {m.name}
                </span>
              ))}
            </div>
            <p className="text-arena-muted text-xs tracking-widest uppercase font-bold italic mt-2">{team?.id} • Round {activeRound}</p>
          </div>
          <div className="mt-8 md:mt-0 flex items-center gap-4">
             <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-arena-muted uppercase tracking-widest">Current Total</span>
                <span className="text-3xl font-black text-white tabular-nums">{Object.values(marks).reduce((a, b) => a + (parseInt(b) || 0), 0)}</span>
             </div>
             <div className="p-4 bg-arena-wine/30 rounded-2xl border border-arena-rose/30 shadow-wine-glow">
                <Award className="w-8 h-8 text-arena-rose" />
             </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {roundsConfig[activeRound].map((c) => (
              <div key={c.id} className="group glass-card !bg-white/[0.02] p-6 border border-white/5 flex flex-col gap-4 focus-within:border-arena-rose transition-all">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-arena-muted uppercase tracking-widest group-focus-within:text-white transition-colors">{c.label}</label>
                  <span className="text-[9px] font-black text-arena-rose/50 uppercase tracking-widest bg-black/40 px-3 py-1 rounded-lg">MAX {c.max}</span>
                </div>
                <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      max={c.max}
                      value={marks[c.id]}
                      onChange={(e) => handleInputChange(c.id, e.target.value, c.max)}
                      className="w-full bg-transparent border-b-2 border-white/5 py-3 text-3xl font-black text-white focus:outline-none focus:border-arena-rose text-center transition-all placeholder:text-white/5"
                      placeholder="--"
                      disabled={locked}
                    />
                    <div className="absolute right-2 bottom-4 text-[8px] font-black text-arena-muted/20 uppercase tracking-widest">Points</div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-10">
            <div className="bg-arena-wine/10 border border-arena-rose/20 p-6 rounded-2xl flex items-start gap-4 mb-8">
                <AlertTriangle className="w-5 h-5 text-arena-rose mt-1 flex-shrink-0" />
                <p className="text-[10px] leading-relaxed text-arena-muted font-normal uppercase tracking-tight italic">
                    By clicking submit, you are finalizing the scores for <span className="text-white font-bold">Round {activeRound}</span>. 
                    This action <span className="text-arena-rose font-bold">CANNOT BE UNDONE</span>. The system will automatically lock the form upon confirmation.
                </p>
            </div>

            <button 
              type="submit" 
              disabled={locked || submitting}
              className="glass-button w-full flex items-center justify-center gap-4 !py-6 !text-xl group shadow-wine-glow"
            >
              {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                   Submit & Lock Marks <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EvaluationForm;
