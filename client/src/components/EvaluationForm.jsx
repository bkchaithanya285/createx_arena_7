import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardCheck, 
  Send, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  Award,
  ChevronRight,
  Info
} from 'lucide-react';
import api from '../utils/api';

const EvaluationForm = ({ team, round, onComplete }) => {
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(false);
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

  const currentCriteria = roundsConfig[round] || [];
  if (!roundsConfig[round]) {
      return (
        <div className="glass-card p-10 flex flex-col items-center gap-6 text-center border-l-4 border-l-red-500">
           <AlertCircle className="w-12 h-12 text-red-500" />
           <p className="text-white font-bold uppercase tracking-widest">Configuration Error: Round {round} not found.</p>
        </div>
      );
  }

  const handleInputChange = (id, val) => {
    const criterion = currentCriteria.find(c => c.id === id);
    if (!criterion) return;
    const max = criterion.max;
    const num = Math.min(max, Math.max(0, parseInt(val) || 0));
    setMarks(prev => ({ ...prev, [id]: num }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/reviewer/submit-evaluation', {
        teamId: team.id,
        round,
        marks
      });
      onComplete();
    } catch (err) {
      setError('Failed to submit evaluation. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="glass-card p-10 flex flex-col gap-10 border-l-4 border-l-yellow-500 shadow-wine"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-3xl font-black uppercase tracking-widest text-white wine-glow">Round {round} Evaluation</h3>
          <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-[0.3em]">Scoring for {team.name} ({team.id})</p>
        </div>
        <div className="bg-white/5 p-3 rounded-xl flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-500" />
          <span className="text-xl font-black text-white">{Object.values(marks).reduce((a, b) => a + b, 0)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {currentCriteria.map((c) => (
          <div key={c.id} className="flex flex-col gap-3">
            <div className="flex justify-between items-end">
              <label className="text-sm font-black uppercase tracking-widest text-arena-muted">{c.label}</label>
              <span className="text-[10px] font-bold text-arena-rose/70 uppercase tracking-widest">Max Score: {c.max}</span>
            </div>
            <div className="relative group">
              <input 
                type="number"
                min="0"
                max={c.max}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-xl font-bold text-white focus:outline-none focus:border-yellow-500/50 transition-all placeholder:text-arena-muted/30"
                placeholder={`0 - ${c.max}`}
                value={marks[c.id] || ''}
                onChange={(e) => handleInputChange(c.id, e.target.value)}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-arena-muted/20 font-black italic">PTS</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-6 pt-6">
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-2xl flex items-start gap-4">
          <Info className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
          <p className="text-[10px] leading-relaxed text-arena-muted font-normal uppercase tracking-tight italic">
            Double-check all marks before submission. Once submitted, the scores for this round will be <span className="text-yellow-500 font-bold">LOCKED</span> and cannot be edited.
          </p>
        </div>

        {error && <p className="text-red-500 font-bold uppercase tracking-widest text-xs animate-bounce">{error}</p>}

        <button 
          type="submit"
          disabled={loading}
          className="glass-button !bg-gradient-to-r from-yellow-600 to-yellow-500 group !py-5 !text-xl !rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3"
        >
          {loading ? 'Submitting Score...' : (
            <>
              Confirm & Lock Submission <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    </motion.form>
  );
};

export default EvaluationForm;
