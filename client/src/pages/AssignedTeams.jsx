import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search as SearchIcon, 
  Star, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ChevronRight, 
  X,
  Loader2,
  MoreVertical,
  ShieldCheck
} from 'lucide-react';
import api from '../utils/api';

const AssignedTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTeams = async () => {
    try {
      const res = await api.get('/volunteer/assigned-teams');
      setTeams(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleUpdateStars = async (teamId, stars) => {
    setActionLoading(true);
    try {
      await api.post('/volunteer/update-stars', { teamId, stars });
      await fetchTeams();
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(prev => ({ ...prev, stars }));
      }
    } catch (err) {
      alert('Failed to update stars');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredTeams = teams.filter(t => 
    t.id.toLowerCase().includes(search.toLowerCase()) || 
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-10 flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-extrabold uppercase tracking-widest text-white wine-glow mb-2">Assigned Teams</h2>
          <p className="text-arena-muted font-light tracking-wide uppercase italic">Overview of your allocated clusters</p>
        </div>
        
        <div className="relative group w-96">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-arena-muted" />
          <input
            type="text"
            placeholder="Search team ID or name..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-arena-rose/50 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-arena-rose" /></div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 uppercase tracking-[0.2em] text-[10px] text-arena-muted font-black bg-white/5">
                <th className="py-6 px-8">Team Entity</th>
                <th className="py-6 px-8">Challenge</th>
                <th className="py-6 px-8 text-center">PPT Status</th>
                <th className="py-6 px-8 text-center">Attendance</th>
                <th className="py-6 px-8 text-center">Eval</th>
                <th className="py-6 px-8 text-right">Judge</th>
                <th className="py-6 px-8 text-right">Control</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.map((team) => (
                <tr key={team.id} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                  <td className="py-6 px-8">
                    <div className="flex flex-col">
                      <span className="text-white font-black uppercase tracking-widest text-sm">{team.id}</span>
                      <span className="text-xs text-arena-muted uppercase font-light mt-1">{team.name}</span>
                    </div>
                  </td>
                  <td className="py-6 px-8">
                    <span className="text-white font-bold text-xs uppercase tracking-widest leading-loose">
                      {team.problem_id || <span className="text-arena-muted italic">Awaiting Selection</span>}
                    </span>
                  </td>
                  <td className="py-6 px-8 text-center">
                    <StatusBadge 
                      status={team.ppt_status} 
                      type={team.ppt_status === 'Verified' ? 'success' : team.ppt_status === 'Uploaded' ? 'info' : 'muted'} 
                    />
                  </td>
                  <td className="py-6 px-8 text-center">
                    <StatusBadge 
                      status={team.attendance_status === 'Updated' ? 'Present' : 'Pending'} 
                      type={team.attendance_status === 'Updated' ? 'success' : 'warning'} 
                    />
                  </td>
                  <td className="py-6 px-8">
                    <div className="flex justify-center gap-1">
                      {[1, 2, 3].map(i => (
                        <Star 
                          key={i} 
                          className={`w-3.5 h-3.5 ${i <= team.stars ? 'text-yellow-500 fill-yellow-500' : 'text-white/10'}`} 
                        />
                      ))}
                    </div>
                  </td>
                  <td className="py-6 px-8 text-right font-black uppercase tracking-widest text-[9px] text-arena-rose/70">
                    {team.reviewer_name || "Awaiting"}
                  </td>
                  <td className="py-6 px-8 text-right">
                    <button 
                      onClick={() => setSelectedTeam(team)}
                      className="p-3 rounded-xl bg-white/5 text-arena-rose hover:bg-arena-rose/20 transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {selectedTeam && (
          <TeamDetailModal 
            team={selectedTeam} 
            onClose={() => setSelectedTeam(null)} 
            onUpdateStars={handleUpdateStars}
            actionLoading={actionLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const TeamDetailModal = ({ team, onClose, onUpdateStars, actionLoading }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60">
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="glass-card max-w-2xl w-full p-10 flex flex-col gap-10 border-arena-rose/20 relative"
    >
      <button onClick={onClose} className="absolute top-6 right-6 text-arena-muted hover:text-white transition-colors">
        <X className="w-6 h-6" />
      </button>

      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-arena-rose text-xs font-black uppercase tracking-[0.4em]">{team.id}</p>
          <h3 className="text-4xl font-black uppercase tracking-widest text-white">{team.name}</h3>
          <div className="flex items-center gap-4 mt-2">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-arena-muted text-[10px] font-black uppercase tracking-widest">
              Cluster {team.cluster}
            </span>
            <span className="px-3 py-1 bg-arena-rose/10 border border-arena-rose/30 rounded-lg text-arena-rose text-[10px] font-black uppercase tracking-widest">
              Judge: {team.reviewer_name || "NOT ASSIGNED"}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-green-500 font-bold uppercase tracking-widest">
              <CheckCircle2 className="w-4 h-4" /> Final Logic Verified
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-10">
        <div className="flex flex-col gap-6">
           <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-arena-muted">Team Evaluation (Aura)</h4>
              {team.stars > 0 && (
                <button 
                  onClick={() => onUpdateStars(team.id, 0)}
                  className="text-[9px] font-black uppercase text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <X className="w-3 h-3" /> Remove Star
                </button>
              )}
           </div>
           <div className="flex gap-4">
              {[1, 2, 3].map(i => (
                <button 
                  key={i} 
                  disabled={actionLoading}
                  onClick={() => onUpdateStars(team.id, i)}
                  className={`p-5 rounded-2xl glass-card transition-all group flex-1 flex flex-col items-center gap-2 ${i <= team.stars ? 'border-yellow-500/50 bg-yellow-500/10 shadow-wine-glow' : 'border-white/5 hover:border-white/20'}`}
                >
                  <Star className={`w-8 h-8 ${i <= team.stars ? 'text-yellow-500 fill-yellow-500' : 'text-white/10 group-hover:text-white/40'}`} />
                  <span className={`text-[8px] font-black uppercase tracking-widest ${i <= team.stars ? 'text-yellow-500' : 'text-arena-muted'}`}>Level {i}</span>
                </button>
              ))}
           </div>
           <p className="text-[10px] text-arena-muted font-light leading-relaxed italic">
             Stars are for discipline and overall team aura. Highly professional teams should receive 3 stars.
           </p>
        </div>

        <div className="flex flex-col gap-6">
          <h4 className="text-xs font-black uppercase tracking-[0.3em] text-arena-muted">Team Members</h4>
          <div className="flex flex-col gap-4">
             {/* Robust Member Parsing (Objects, Strings, or Arrays) */}
             {(() => {
                const raw = team.members;
                let parsed = [];
                if (Array.isArray(raw)) parsed = raw;
                else if (typeof raw === 'string') {
                  try { parsed = JSON.parse(raw); } 
                  catch { parsed = raw.split(',').map(m => m.trim()); }
                }

                if (parsed.length === 0 && team.leader_reg) {
                   return (
                     <div className="p-4 bg-arena-rose/5 border border-arena-rose/20 rounded-xl flex items-center justify-between">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Team Leader (RegOnly)</span>
                        <span className="text-xs font-bold text-arena-rose tracking-widest">{team.leader_reg}</span>
                     </div>
                   );
                }

                return parsed.map((member, idx) => (
                  <div key={idx} className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between group hover:border-white/20 transition-all">
                     <span className="text-[10px] font-black text-white uppercase tracking-widest">{member?.name || `PARTICIPANT ${idx + 1}`}</span>
                     <span className="text-xs font-bold text-arena-muted tracking-widest">{member?.regNo || member || 'N/A'}</span>
                  </div>
                ));
             })()}
             {(!team.members && !team.leader_reg) && (
               <div className="flex flex-col items-center gap-2 py-4">
                  <span className="text-[10px] text-arena-muted uppercase font-bold tracking-widest">No participant data linked</span>
               </div>
             )}
          </div>
        </div>
      </div>

      <div className="flex gap-4 border-t border-white/5 pt-10">
         <button className="flex-1 glass-button !py-4 flex items-center justify-center gap-3">
           <Camera className="w-5 h-5" /> Team Photo
         </button>
         <button className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-arena-muted hover:text-white transition-colors">
            Finalize Evaluation
         </button>
      </div>
    </motion.div>
  </div>
);

const StatusBadge = ({ status, type }) => {
  const styles = {
    success: 'bg-green-500/10 border-green-500/20 text-green-500',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
    muted: 'bg-white/5 border-white/10 text-arena-muted'
  };
  return (
    <span className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-[0.2em] inline-block ${styles[type]}`}>
      {status}
    </span>
  );
}

export default AssignedTeams;
