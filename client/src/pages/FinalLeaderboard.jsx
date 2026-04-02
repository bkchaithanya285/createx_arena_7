import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Target, Zap, Rocket, Shield, Award, Users, Search as SearchIcon, Lock as LockIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const FinalLeaderboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isReleased, setIsReleased] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await api.get('/leaderboard/final');
        setData(res.data.rankings);
        setIsReleased(res.data.is_released);
      } catch (err) {
        console.error('Failed to fetch final leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const filteredData = data.filter(d => 
    d.team_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-10 flex flex-col gap-10 max-w-6xl mx-auto h-full min-h-[80vh] justify-center">
      <div className="text-center">
        <h2 className="text-5xl font-black uppercase tracking-widest text-white wine-glow mb-4">Final Leaderboard</h2>
        <p className="text-arena-muted uppercase tracking-[0.4em] font-light text-sm italic">Innovation Assembled: The Official Rankings of CREATEX Arena</p>
      </div>

      {!isReleased ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card flex-1 flex flex-col items-center justify-center gap-8 border-arena-rose/20 p-20"
        >
          <div className="relative">
            <Trophy className="w-24 h-24 text-arena-muted/20" />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-32 h-32 border-2 border-dashed border-arena-rose/30 rounded-full" />
            </motion.div>
            <Lock className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-arena-rose" />
          </div>
          <div className="text-center">
            <h3 className="text-3xl font-black uppercase tracking-[0.3em] text-white wine-glow mb-2">Results Not Announced</h3>
            <p className="text-arena-muted uppercase tracking-widest text-xs font-bold prose italic">Official verification in progress by the Core Technical Team</p>
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between glass-card p-6 border-white/5">
            <div className="relative group w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-arena-muted" />
              <input
                type="text"
                placeholder="Search squad..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-xs text-white focus:outline-none focus:border-arena-rose/50 transition-all placeholder:text-arena-muted/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Official Result: Verified</span>
            </div>
          </div>

          <div className="glass-card overflow-hidden !rounded-3xl shadow-wine">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/5">
                <tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-arena-muted">
                  <th className="py-6 px-10">Global Rank</th>
                  <th className="py-6 px-10">Squad Identity</th>
                  <th className="py-6 px-10 text-right pr-20">Arena Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan="3" className="py-32 text-center">
                      <Loader2 className="w-12 h-12 text-arena-rose animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-32 text-center text-arena-muted uppercase tracking-[0.4em] font-bold italic">
                      Zero datasets synchronized
                    </td>
                  </tr>
                ) : filteredData.map((d, idx) => (
                  <tr key={idx} className={`group hover:bg-white/5 transition-all
                    ${idx === 0 ? 'bg-yellow-500/10' : idx === 1 ? 'bg-white/10' : idx === 2 ? 'bg-arena-rose/10' : ''}
                  `}>
                    <td className="py-8 px-10">
                      <div className="flex items-center gap-4">
                        <span className={`text-4xl font-black ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-arena-rose' : 'text-white/20'} group-hover:scale-125 transition-transform duration-500`}>
                          #{idx + 1}
                        </span>
                        {idx < 3 && (
                          <div className={`p-2 rounded-full border border-white/10 bg-black/20 animate-pulse`}>
                            <Medal className={`w-6 h-6 ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-300' : 'text-arena-rose'}`} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-8 px-10">
                      <div className="flex flex-col gap-1">
                        <h4 className="text-2xl font-black uppercase tracking-[0.3em] text-white group-hover:text-arena-rose transition-all">{d.team_name}</h4>
                        <div className="flex items-center gap-4 mt-2">
                           {Array.from({ length: 3 }).map((_, i) => (
                             <Star key={i} className={`w-3 h-3 ${i < 3 - idx ? 'text-yellow-500 fill-yellow-500' : 'text-white/5'}`} />
                           ))}
                        </div>
                      </div>
                    </td>
                    <td className="py-8 px-10 text-right pr-20">
                      <div className="flex flex-col items-end gap-2">
                         <span className="text-[10px] font-black uppercase tracking-widest text-arena-muted italic">Participation Verified</span>
                         <span className={`px-4 py-1.5 rounded-full border border-white/10 text-[10px] uppercase font-black tracking-widest bg-white/5 ${idx < 3 ? 'text-green-500' : 'text-arena-muted'}`}>
                           {idx < 3 ? 'Elite Podium' : 'Final Tier'}
                         </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-8 bg-black/50 border border-white/5 rounded-3xl flex items-start gap-6">
            <div className="p-4 bg-arena-rose/10 rounded-2xl">
              <ShieldCheck className="w-8 h-8 text-arena-rose" />
            </div>
            <div>
              <h5 className="text-lg font-black uppercase tracking-widest text-white mb-2">Internal Validation Complete</h5>
              <p className="text-xs leading-relaxed text-arena-muted font-normal uppercase tracking-[0.2em] italic">
                Final scores have been normalized through a 3-round weighted evaluation matrix. Individual marks are permanently concealed to maintain the integrity of the innovation ecosystem. We congratulate all 109 squads for assembling innovation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalLeaderboard;
