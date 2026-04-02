import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Trophy, 
  Target, 
  Zap, 
  Rocket, 
  Shield as ShieldIcon, 
  Award, 
  Users, 
  Search as SearchIcon, 
  Lock as LockIcon, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ChevronRight,
  Loader2,
  Gamepad2,
  Star,
  Activity,
  Plus,
  Play
} from 'lucide-react';
import api from '../utils/api';
import socket from '../utils/socket';
import { formatTime } from '../utils/time';

const Dashboard = () => {
  const [team, setTeam] = useState(JSON.parse(localStorage.getItem('arena_user')) || {});

  const getSafeMembers = (members) => {
    if (!members) return [];
    if (typeof members === 'object') return Array.isArray(members) ? members : [];
    if (typeof members === 'string') {
      try {
        return JSON.parse(members);
      } catch (e) {
        return [];
      }
    }
    return [];
  };
  const [problemsState, setProblemsState] = useState({ countdown: null, revealed: false, details: false, enabled: false, broadcast: '' });
  const [activePoll, setActivePoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/teams/me');
        setTeam(res.data);
        if (res.data.problem_id) {
          const pRes = await api.get(`/problems/${res.data.problem_id}`);
          setSelectedProblem(pRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Poll Admin Dashboard State
    const fetchState = async () => {
      try {
        const st = await api.get('/teams/dashboard-state');
        
        // SYNC Team State from Polled Dashboard data
        if (st.data.problem_id) {
            setTeam(prev => {
               if (prev.problem_id !== st.data.problem_id) {
                  return { ...prev, problem_id: st.data.problem_id };
               }
               return prev;
            });
            
            setSelectedProblem(prev => {
               if (!prev) {
                  api.get(`/problems/${st.data.problem_id}`).then(pRes => {
                     setSelectedProblem(pRes.data);
                  });
               }
               return prev;
            });
        } else {
            // Handle RESET by admin
            setTeam(prev => {
               if (prev.problem_id) return { ...prev, problem_id: null };
               return prev;
            });
            setSelectedProblem(null);
        }

        setProblemsState(prev => {
          const newState = { ...st.data };
          if (newState.end_time) {
            const remaining = Math.max(0, Math.floor((newState.end_time - Date.now()) / 1000));
            newState.countdown = remaining;
          }
          return newState;
        });
        
        // Fetch Poll
        const pSt = await api.get('/admin/poll');
        if (pSt.data?.active) setActivePoll(pSt.data);
        else setActivePoll(null);

        // SYNC Selected Problem if newly found via polling
        if (st.data.problem_id && !selectedProblem) {
           const pRes = await api.get(`/problems/${st.data.problem_id}`);
           setSelectedProblem(pRes.data);
        }
      } catch (err) {}
    };
    fetchState();
    const poll = setInterval(fetchState, 5000);
    return () => clearInterval(poll);
  }, []);

  // REAL-TIME SYNC FOR SYSTEM RESETS
  useEffect(() => {
    const handleReset = () => {
      // Fetch fresh state instead of just clearing local to be 100% sure
      api.get('/teams/me').then(res => {
         setTeam(res.data);
         localStorage.setItem('arena_user', JSON.stringify(res.data));
         if (!res.data.problem_id) setSelectedProblem(null);
      });
    };

    socket.on('problem_reset', handleReset);
    socket.on('attendance_reset', handleReset);
    socket.on('round_changed', handleReset);
    socket.on('all_reset', () => {
        handleReset();
        window.location.reload(); // Hard refresh on full reset to be safe
    });

    return () => {
      socket.off('problem_reset');
      socket.off('attendance_reset');
      socket.off('round_changed');
      socket.off('all_reset');
    };
  }, []);

  // Tick the timer down locally based on absolute end_time
  useEffect(() => {
    const ticker = setInterval(() => {
      setProblemsState(prev => {
        if (prev.end_time) {
          const remaining = Math.max(0, Math.floor((prev.end_time - Date.now()) / 1000));
          // If timer just finished, enable selection locally
          if (remaining === 0 && prev.timer_started && !prev.enabled) {
            return { ...prev, countdown: 0, enabled: true };
          }
          return { ...prev, countdown: remaining };
        }
        if (prev.countdown > 0) return { ...prev, countdown: prev.countdown - 1 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(ticker);
  }, []);


  return (
    <div className="flex-1 flex gap-8 p-8 overflow-y-auto">
      {/* LEFT PANEL (25%) */}
      <div className="w-1/4 flex flex-col gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-8 flex flex-col items-center gap-6"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold wine-glow uppercase tracking-widest text-white">{team.name}</h2>
            <p className="text-arena-rose font-bold text-sm uppercase tracking-[0.2em] mt-1">{team.id}</p>
          </div>

          <div className="w-40 h-40 bg-white p-3 rounded-2xl shadow-xl">
            <QRCodeSVG value={JSON.stringify({ team_id: team.id })} className="w-full h-full" />
          </div>
          <p className="text-[10px] text-arena-muted uppercase tracking-widest text-center leading-4">Scan for Attendance / Verification</p>

          <div className="divider" />

          <div className="w-full flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-arena-rose" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-arena-muted">Cluster</p>
                <p className="text-lg font-bold text-white tracking-widest">CLUSTER {team.cluster}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-arena-rose" />
              <div className="w-full overflow-hidden">
                <p className="text-[10px] uppercase tracking-widest text-arena-muted mb-2">Team Members</p>
                <div className="flex flex-col gap-2">
                  {getSafeMembers(team.members).map((m, idx) => (
                    <div key={idx} className="flex flex-col border-l-2 border-white/10 pl-3">
                      <p className="text-xs font-bold text-white uppercase">{typeof m === 'object' ? m.name || `MEMBER ${idx + 1}` : `MEMBER ${idx + 1}`}</p>
                      <p className="text-[9px] text-arena-muted tracking-widest">{typeof m === 'object' ? m.regNo || m.reg_no || 'NO REG' : m}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* RIGHT PANEL (75%) */}
      <div className="w-3/4 flex flex-col gap-8">
        <div className="grid grid-cols-4 gap-6">
          <StatusCard icon={<UserCheck className="w-5 h-5" />} label="Attendance" value={['Present', 'Updated'].includes(team.attendance_status) ? 'Checked-In' : 'Ready'} color={['Present', 'Updated'].includes(team.attendance_status) ? 'text-green-400' : 'text-arena-rose'} />
          <StatusCard icon={<Activity className="w-5 h-5" />} label="Review Status" value={problemsState.assigned_reviewer || "Not Assigned"} color="text-yellow-400" />
          <StatusCard icon={<Trophy className="w-5 h-5" />} label="Game Status" value={problemsState.game_zone_unlocked ? "Unlocked" : "Locked"} color={problemsState.game_zone_unlocked ? "text-green-400" : "text-red-400"} />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 glass-card p-12 flex flex-col items-center justify-center text-center gap-10 min-h-[400px]"
        >
          {loading ? (
             <div className="flex flex-col items-center gap-4 animate-pulse">
                <Rocket className="w-16 h-16 text-arena-rose" />
                <h3 className="text-xl font-black text-white uppercase tracking-[0.5em]">Synchronizing Arena...</h3>
             </div>
          ) : (team.problem_id || selectedProblem) ? (
            <div className="w-full text-left flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
               {selectedProblem ? (
                  <>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="p-4 bg-green-500/20 rounded-2xl text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] border border-green-500/30">
                             <FileCheck className="w-10 h-10" />
                          </div>
                          <div>
                             <h3 className="text-4xl font-black text-white tracking-widest uppercase text-glow">Mission Assigned</h3>
                             <div className="flex items-center gap-2 mt-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.4em]">Challenge Locked & Active</span>
                             </div>
                          </div>
                       </div>
                       <div className="bg-white/5 border border-white/10 px-8 py-4 rounded-2xl text-right">
                          <p className="text-[10px] font-black text-arena-muted uppercase tracking-widest mb-1">Assigned ID</p>
                          <p className="text-3xl font-black text-white tracking-widest uppercase">{selectedProblem.id}</p>
                       </div>
                    </div>

                    <div className="glass-card !bg-gradient-to-br !from-green-500/5 !to-transparent p-12 border-l-8 border-l-green-500 relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-green-500/10 transition-all duration-1000" />
                       <div className="relative z-10 space-y-8">
                          <div className="space-y-4">
                             <h4 className="text-4xl font-black text-white uppercase tracking-tight leading-none text-glow-subtle">
                                {selectedProblem.title}
                             </h4>
                             <div className="h-1 w-24 bg-green-500/50 rounded-full" />
                          </div>
                          <p className="text-xl text-arena-muted font-light leading-relaxed italic max-w-4xl">
                             "{selectedProblem.description}"
                          </p>
                       </div>
                    </div>
                  </>
               ) : (
                  <div className="flex flex-col items-center gap-4 animate-pulse">
                     <FileCheck className="w-16 h-16 text-green-500" />
                     <h3 className="text-xl font-black text-white uppercase tracking-[0.5em]">Loading Challenge Briefing...</h3>
                  </div>
               )}
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-12 animate-in fade-in zoom-in duration-700">
              <div className="space-y-4">
                <h3 className="text-2xl font-black text-arena-muted uppercase tracking-[0.4em] text-center">Problem Statements Release In</h3>
                {problemsState.countdown !== null ? (
                   <div className="text-7xl font-black text-white wine-glow tracking-widest flex gap-6 justify-center">
                     {formatTime(problemsState.countdown).split(':').map((t, idx) => (
                       <div key={idx} className="flex flex-col items-center">
                         <div className="glass-card !px-8 !py-6 tabular-nums relative overflow-hidden group">
                            <div className="absolute inset-0 bg-arena-rose/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="relative z-10">{t}</span>
                         </div>
                         <span className="text-[10px] mt-4 uppercase tracking-[0.4em] font-black text-arena-rose/70">
                           {idx === 0 ? 'Hours' : idx === 1 ? 'Minutes' : 'Seconds'}
                         </span>
                       </div>
                     ))}
                   </div>
                ) : (
                   <div className="text-4xl font-black text-white/20 uppercase tracking-[0.8em]">-- : -- : --</div>
                )}
              </div>

              <div className="flex flex-col items-center gap-6">
                <Link 
                  to="/dashboard/selection"
                  className={`glass-button !px-16 !py-6 !text-2xl !rounded-full group shadow-wine-glow transition-all ${!problemsState.revealed ? 'opacity-20 pointer-events-none grayscale' : 'hover:scale-110'}`}
                >
                  <div className="flex items-center gap-4">
                     {problemsState.revealed ? <Rocket className="w-8 h-8 animate-bounce-slow" /> : <Lock className="w-8 h-8" />}
                     {problemsState.revealed ? "Enter Selection Zone" : "Vault Access Sealed"}
                     <ChevronRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                  </div>
                </Link>
                {!problemsState.revealed && (
                   <p className="text-[10px] font-black text-arena-muted uppercase tracking-[0.5em] animate-pulse">Awaiting Administrator Release Sequence</p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Live Poll Overlay */}
      {activePoll && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-10 max-w-lg w-full border-arena-rose/30 shadow-wine-glow"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-arena-wine/30 rounded-xl">
                <Vote className="w-6 h-6 text-arena-rose" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-widest">Radar Poll</h3>
            </div>
            
            <p className="text-lg text-white font-bold mb-8">{activePoll.question}</p>
            
            <div className="flex flex-col gap-4">
              {activePoll.options.filter(o => o).map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedOption(idx)}
                  className={`p-4 rounded-xl border transition-all text-left font-bold ${selectedOption === idx ? 'bg-arena-rose border-white text-black shadow-wine-glow' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
            
            <div className="flex gap-4 mt-10">
              <button 
                onClick={() => setActivePoll(null)} 
                className="w-full py-4 rounded-xl border border-white/10 text-arena-muted font-bold uppercase tracking-widest hover:bg-white/5"
              >
                Dismiss
              </button>
              <button 
                onClick={() => { alert('Vote submitted!'); setActivePoll(null); }}
                className="w-full py-4 rounded-xl bg-arena-rose text-black font-black uppercase tracking-widest shadow-wine-glow"
              >
                Submit Vote
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Broadcast Overlay */}
      {problemsState.broadcast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 glass-premium border-arena-rose !bg-black/80 px-8 py-4 z-50 flex items-center gap-4 animate-in slide-in-from-bottom-10 shadow-wine-glow">
          <Bell className="w-6 h-6 text-arena-rose animate-bounce" />
          <p className="text-white font-bold uppercase tracking-widest text-sm">{problemsState.broadcast}</p>
        </div>
      )}
    </div>
  );
};

const StatusCard = ({ icon, label, value, color }) => (
  <div className="glass-card p-6 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <div className="p-2 bg-white/5 rounded-lg text-arena-rose">{icon}</div>
      <div className={`text-[10px] font-bold uppercase tracking-widest ${color}`}>{value}</div>
    </div>
    <div className="text-xs text-arena-muted font-bold uppercase tracking-wide mt-2">{label}</div>
  </div>
);

export default Dashboard;
