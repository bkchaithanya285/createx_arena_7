import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Users, FileDiff, CheckCircle, Search, Clock, Award } from 'lucide-react';

const ReviewerDashboard = () => {
  const [data, setData] = useState({ rounds: {}, statuses: { 1: 'closed', 2: 'closed', 3: 'closed' } });
  const [activeTab, setActiveTab] = useState('1');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const reviewerStr = localStorage.getItem('arena_user');
  const reviewer = reviewerStr ? JSON.parse(reviewerStr) : {};

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await api.get('/reviewer/assigned-teams');
        setData(res.data);
        
        // Auto-select first open round if current tab is closed
        const firstOpen = Object.keys(res.data.statuses).find(r => res.data.statuses[r] === 'open');
        if (firstOpen) setActiveTab(firstOpen);
        
      } catch (err) {
        console.error('Failed to fetch assigned teams:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  const currentTeams = data.rounds[activeTab] || [];

  return (
    <div className="p-8 lg:p-12 animate-in fade-in zoom-in duration-500 min-h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="p-4 glass-premium shadow-wine-glow rounded-2xl">
            <Users className="w-8 h-8 text-arena-rose" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-widest uppercase text-glow mb-1">
              Reviewer Portal
            </h1>
            <p className="text-arena-muted text-xs font-bold tracking-[0.3em] uppercase">
              {reviewer?.name || reviewer?.display_name || 'EVALUATOR'} • {data.statuses[activeTab] === 'open' ? 'Active Duty' : 'Standby'}
            </p>
          </div>
        </div>

        {/* Multi-Round Tab Control */}
        <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner">
           {[1, 2, 3].map(r => (
             <button
               key={r}
               onClick={() => setActiveTab(String(r))}
               className={`px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                 activeTab === String(r) 
                 ? 'bg-arena-rose text-white shadow-wine-glow' 
                 : 'text-arena-muted hover:text-white'
               }`}
             >
               ROUND {r}
               {data.statuses[r] === 'open' && <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="glass-premium p-6 border-l-4 border-l-arena-wine flex flex-col justify-center">
          <span className="text-arena-muted text-xs uppercase tracking-widest font-bold mb-2">Total Assigned</span>
          <span className="text-4xl font-black text-white">{currentTeams.length}</span>
        </div>
        <div className="glass-premium p-6 border-l-4 border-l-yellow-500/50 flex flex-col justify-center">
          <span className="text-yellow-500/70 text-xs uppercase tracking-widest font-bold mb-2">Pending Review</span>
          <span className="text-4xl font-black text-yellow-100">{currentTeams.filter(t => t.status !== 'Completed').length}</span>
        </div>
        <div className="glass-premium p-6 border-l-4 border-l-green-500/50 flex flex-col justify-center">
          <span className="text-green-500/70 text-xs uppercase tracking-widest font-bold mb-2">Completed</span>
          <span className="text-4xl font-black text-green-100">{currentTeams.filter(t => t.status === 'Completed').length}</span>
        </div>
      </div>

      <div className="glass-premium flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
          <h2 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">
            <Search className="w-5 h-5 text-arena-rose" />
            Evaluation Roster • Round {activeTab}
          </h2>
          {data.statuses[activeTab] !== 'open' && (
             <span className="px-4 py-1.5 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-lg">
                Phase Locked by Admin
             </span>
          )}
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-6">
          {loading ? (
             <div className="h-full flex items-center justify-center text-arena-rose animate-pulse">Syncing Logic Data...</div>
          ) : (
            <div className="flex flex-col gap-4">
              {currentTeams.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-arena-muted italic">No teams assigned for this round.</div>
              ) : currentTeams.map(team => (
                <div key={team.id} className={`flex flex-col md:flex-row items-center justify-between p-5 bg-white/5 border border-white/10 rounded-xl transition-all group ${data.statuses[activeTab] === 'open' ? 'hover:bg-white/10 hover:border-arena-rose/30' : 'opacity-60 grayscale'}`}>
                  <div className="flex items-center gap-6 mb-4 md:mb-0 w-full md:w-auto">
                    <div className="w-12 h-12 bg-black/40 rounded-lg flex items-center justify-center flex-shrink-0 border border-white/5">
                      <span className="text-xs font-black text-arena-rose capitalize">{team.id.split('-')[1]}</span>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg mb-1">{team.name}</h3>
                      <p className="text-arena-muted text-xs uppercase tracking-widest font-bold">
                        Problem: {team.problem_id || 'PENDING SELECTION'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className="flex items-center gap-2">
                       {team.status === 'Completed' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Clock className="w-4 h-4 text-yellow-400" />}
                       <span className={`text-xs font-bold uppercase tracking-widest ${team.status === 'Completed' ? 'text-green-400' : 'text-yellow-400'}`}>
                         {team.status}
                       </span>
                    </div>
                    {data.statuses[activeTab] === 'open' ? (
                       <button 
                         onClick={() => navigate(`/reviewer/evaluation/${team.id}?round=${activeTab}`)}
                         className="glass-button !py-2 !px-6 !text-xs whitespace-nowrap"
                       >
                         {team.status === 'Completed' ? 'View Details' : 'Start Review'}
                       </button>
                    ) : (
                       <div className="p-2 text-arena-muted">
                          <Lock className="w-4 h-4" />
                       </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewerDashboard;
