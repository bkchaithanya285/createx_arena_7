import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  RotateCcw, 
  Puzzle, 
  Palette, 
  Medal, 
  Search,
  Loader2,
  ChevronRight
} from 'lucide-react';
import api from '../utils/api';

const GameLeaderboard = () => {
  const [activeTab, setActiveTab] = useState('memory_flip');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/games/leaderboard?name=${activeTab}`);
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [activeTab]);

  const tabs = [
    { id: 'memory_flip', name: 'Memory Flip', icon: <RotateCcw className="w-4 h-4" /> },
    { id: 'jigsaw_puzzle', name: 'Jigsaw Puzzle', icon: <Puzzle className="w-4 h-4" /> },
    { id: 'color_code', name: 'Color Code', icon: <Palette className="w-4 h-4" /> }
  ];

  const filteredData = data.filter(d => 
    d.team_name.toLowerCase().includes(search.toLowerCase()) || 
    d.team_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-10 flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 glass-card bg-arena-rose/10 border-arena-rose/20 text-arena-rose">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-4xl font-extrabold uppercase tracking-widest text-white wine-glow mb-2">Game Leaderboards</h2>
            <p className="text-arena-muted font-light tracking-wide uppercase italic tracking-[0.2em]">Ranked Performance in Supplemental Challenges</p>
          </div>
        </div>

        <div className="relative group w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-arena-muted" />
          <input
            type="text"
            placeholder="Search teams..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-xs text-white focus:outline-none focus:border-arena-rose/50 transition-all placeholder:text-arena-muted/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl border transition-all duration-300
              ${activeTab === tab.id 
                ? 'bg-wine-gradient border-arena-rose text-white shadow-wine' 
                : 'bg-white/5 border-white/10 text-arena-muted hover:bg-white/10'}
            `}
          >
            {tab.icon}
            <span className="text-xs font-black uppercase tracking-widest">{tab.name}</span>
          </button>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5">
              <tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-arena-muted">
                <th className="py-6 px-8">Rank</th>
                <th className="py-6 px-8">Team Squad</th>
                <th className="py-6 px-8">Metrics (Time | Moves)</th>
                <th className="py-6 px-8 text-right">Aggregate Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center">
                    <Loader2 className="w-10 h-10 text-arena-rose animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center text-arena-muted uppercase tracking-[0.3em] font-bold italic">
                    No Evaluation Data for this Category
                  </td>
                </tr>
              ) : filteredData.map((d, idx) => (
                <tr key={idx} className={`group hover:bg-white/5 transition-all
                  ${idx === 0 ? 'bg-yellow-500/5' : idx === 1 ? 'bg-white/5' : idx === 2 ? 'bg-arena-rose/5' : ''}
                `}>
                  <td className="py-6 px-8">
                    <div className="flex items-center gap-3">
                      <span className={`text-xl font-black ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-arena-rose' : 'text-white/10'} group-hover:scale-125 transition-transform`}>
                        #{idx + 1}
                      </span>
                      {idx < 3 && <Medal className={`w-5 h-5 ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-300' : 'text-arena-rose'}`} />}
                    </div>
                  </td>
                  <td className="py-6 px-8">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white uppercase tracking-widest">{d.team_name}</span>
                      <span className="text-[10px] text-arena-muted font-black uppercase tracking-[0.2em]">{d.team_id}</span>
                    </div>
                  </td>
                  <td className="py-6 px-8">
                    <div className="flex gap-4 items-center">
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase tracking-widest text-arena-muted">Time</span>
                        <span className="text-sm font-bold text-white">{d.time_taken}s</span>
                      </div>
                      <div className="w-[1px] h-4 bg-white/10" />
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase tracking-widest text-arena-muted">Moves</span>
                        <span className="text-sm font-bold text-white">{d.moves}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-8 text-right">
                    <span className="text-xl font-black text-white wine-glow tracking-widest">{d.score}</span>
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

export default GameLeaderboard;
