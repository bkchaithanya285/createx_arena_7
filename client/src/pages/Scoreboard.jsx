import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, Star, RefreshCw, Award, Lock as LockIcon, Search as SearchIcon, ArrowUp, ArrowDown } from 'lucide-react';
import api from '../utils/api';

const Scoreboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const handleVerify = (e) => {
    e.preventDefault();
    if (password === (import.meta.env.VITE_SCOREBOARD_PASSWORD || 'Tony@285')) {
      setIsAuthenticated(true);
      fetchScores();
    } else {
      setError('Invalid Access Credentials');
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchScores();
    const interval = setInterval(fetchScores, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const fetchScores = async () => {
    if (loading) return; // Prevent overlapping requests
    setLoading(true);
    try {
      const res = await api.get('/admin/scoreboard');
      setScores(res.data);
    } catch (err) {
      console.error('Failed to fetch scores:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredScores = scores.filter(s => 
    s.team_name.toLowerCase().includes(search.toLowerCase()) || 
    s.team_id.toLowerCase().includes(search.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card w-full max-w-md p-10 flex flex-col gap-8 border-t-4 border-t-arena-rose"
        >
          <div className="text-center">
            <Lock className="w-12 h-12 text-arena-rose mx-auto mb-4" />
            <h2 className="text-2xl font-black uppercase tracking-widest text-white wine-glow">Restricted Access</h2>
            <p className="text-arena-muted text-xs font-light tracking-wide uppercase mt-2 italic">Official Scoreboard - Authorization Required</p>
          </div>

          <form onSubmit={handleVerify} className="flex flex-col gap-6">
            <div className="relative group">
              <input
                type="password"
                required
                placeholder="Admin Scoreboard Password"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-white focus:outline-none focus:border-arena-rose/50 focus:bg-white/10 transition-all placeholder:text-arena-muted/50 text-center tracking-[0.5em]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-bounce">{error}</p>}

            <button
              type="submit"
              className="glass-button w-full !py-4 flex items-center justify-center gap-2 group"
            >
              Unlock Repository <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-10 flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-extrabold uppercase tracking-widest text-white wine-glow mb-2">Master Scoreboard</h2>
          <p className="text-arena-muted font-light tracking-wide uppercase italic tracking-[0.2em] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-500" /> SECURE SESSION: AUTHENTICATED ACCESS
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="relative group w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-arena-muted" />
            <input
              type="text"
              placeholder="Search team..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-arena-rose/50 transition-all placeholder:text-arena-muted/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="glass-button !bg-green-600 !px-6 !py-3 !text-xs !rounded-xl uppercase font-bold tracking-widest flex items-center gap-2">
            <Download className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5">
              <tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-arena-muted">
                <th className="py-6 px-8">Rank</th>
                <th className="py-6 px-8">Team Squad</th>
                <th className="py-6 px-8">Round 1</th>
                <th className="py-6 px-8">Round 2</th>
                <th className="py-6 px-8">Round 3</th>
                <th className="py-6 px-8 text-right">Aggregate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <Loader2 className="w-10 h-10 text-arena-rose animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredScores.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center text-arena-muted uppercase tracking-[0.3em] font-bold italic">
                    No Evaluation Data Available
                  </td>
                </tr>
              ) : filteredScores.map((s, idx) => (
                <tr key={idx} className="group hover:bg-white/5 transition-all">
                  <td className="py-6 px-8">
                    <span className="text-xl font-black text-arena-rose/50 group-hover:text-arena-rose transition-colors">#{idx + 1}</span>
                  </td>
                  <td className="py-6 px-8">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white uppercase tracking-widest">{s.team_name}</span>
                      <span className="text-[10px] text-arena-muted font-black uppercase tracking-[0.2em]">{s.team_id}</span>
                    </div>
                  </td>
                  <td className="py-6 px-8"><ScoreCell val={s.r1} /></td>
                  <td className="py-6 px-8"><ScoreCell val={s.r2} /></td>
                  <td className="py-6 px-8"><ScoreCell val={s.r3} /></td>
                  <td className="py-6 px-8 text-right">
                    <span className="text-xl font-black text-white wine-glow">{s.total}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ScoreCell = ({ val }) => (
  <div className="flex flex-col gap-1">
    <span className={`text-sm font-bold ${val > 0 ? 'text-white' : 'text-white/10 italic'}`}>
      {val > 0 ? val : 'N/A'}
    </span>
    {val > 0 && <div className="h-1 bg-white/5 rounded-full overflow-hidden w-12">
      <div className="h-full bg-arena-rose" style={{ width: `${(val / 30) * 100}%` }} />
    </div>}
  </div>
);

export default Scoreboard;
