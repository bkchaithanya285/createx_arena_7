import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Users, 
  Search as SearchIcon, 
  Rocket, 
  Eye, 
  Clock, 
  Play, 
  CheckCircle2, 
  Lock as LockIcon, 
  AlertCircle,
  BarChart3,
  ExternalLink,
  Loader2,
  StatusOnlineIcon, // (Custom icon if needed, but not in lucide)
  ChevronRight,
  Activity,
  Gamepad2,
  RefreshCw,
  FileText,
  AlertTriangle,
  Trash2,
  Power,
  ChevronDown
} from 'lucide-react';
import api from '../utils/api';
import socket from '../utils/socket';
import { formatTime } from '../utils/time';

const AdminControl = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total_teams: 109, active_teams: 0, problems_selected: 0, reviews_completed: 0 });
  const [attendance, setAttendance] = useState({ total: 109, present: 0, session: 'Morning Check-In' });
  const [sessions, setSessions] = useState(['Morning Check-In', 'Afternoon Check-In']);
  const [selectedSession, setSelectedSession] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [targetTime, setTargetTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [releaseMins, setReleaseMins] = useState(5);
  const [gameZoneUnlocked, setGameZoneUnlocked] = useState(false);

  const fetchStats = async () => {
    try {
      setIsRefreshing(true);
      const { data: summary } = await api.get('/admin/summary');
      
      setStats(summary.stats);
      setAttendance(summary.attendance);
      setSessions(summary.sessions);
      setSessionActive(summary.sessionActive);
      
      // Initialize selected session ONLY if it's currently empty
      if (!selectedSession) {
         setSelectedSession(summary.attendance.session || summary.sessions[0] || '');
      }
      
      // Sync Game Zone state
      setGameZoneUnlocked(summary.gameZoneUnlocked);

      // Sync Mission Timing input with active server state
      if (summary.problemSelectionState) {
        if (summary.problemSelectionState.end_time) {
          setTargetTime(summary.problemSelectionState.end_time);
        }
        // Lock the input to the server value if mission is active
        if (summary.problemSelectionState.timer_started) {
          setReleaseMins(summary.problemSelectionState.minutes || 5);
        }
      }
    } catch (err) {
      console.error('Fetch Stats Error:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Immediate Socket updates for mission/round state changes (reduces polling dependency)
    socket.on('selection_state_changed', fetchStats);
    socket.on('attendance_session_changed', fetchStats);
    socket.on('round_changed', fetchStats);

    const statsInterval = setInterval(fetchStats, 15000); // Relaxed polling due to socket fallback
    const tickerInterval = setInterval(() => {
        setTargetTime(prevTarget => {
          if (prevTarget) {
            setTimeLeft(Math.max(0, Math.floor((prevTarget - Date.now()) / 1000)));
          }
          return prevTarget;
        });
    }, 1000);

    return () => {
        socket.off('selection_state_changed', fetchStats);
        socket.off('attendance_session_changed', fetchStats);
        socket.off('round_changed', fetchStats);
        clearInterval(statsInterval);
        clearInterval(tickerInterval);
    };
  }, [selectedSession]); // Added selectedSession to deps for initial stable sync

  const toggleSession = async (status) => {
    if (!selectedSession) return alert('Please select a session first');
    try {
      setIsRefreshing(true);
      await api.post('/admin/sessions', { 
        action: 'TOGGLE', 
        sessionName: selectedSession, 
        status 
      });
      setSessionActive(status);
      alert(`Session ${selectedSession} is now ${status ? 'LIVE' : 'CLOSED'}`);
      fetchStats();
    } catch (err) {
      alert('Failed to toggle session');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleReset = async (type) => {
    const confirmation = window.confirm(`DANGER: Are you sure you want to clear ${type}? This will permanently wipe 109-team data.`);
    if (!confirmation) return;

    try {
      setIsRefreshing(true);
      const res = await api.post('/admin/clear-data', { type });
      alert(res.data.message || `${type} cleared successfully`);
      fetchStats();
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      alert(`RESET ERROR: ${msg}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
     return (
        <div className="min-h-screen flex items-center justify-center bg-black">
           <Loader2 className="w-10 h-10 text-arena-rose animate-spin" />
        </div>
     )
  }

  return (
    <div className="p-10 flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-widest text-white wine-glow mb-2">Arena Mission Control</h2>
          <p className="text-arena-muted font-bold tracking-widest uppercase italic text-[10px]">Real-time Event Lifecycle Management</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={fetchStats} 
            className={`p-4 bg-white/5 border border-white/10 rounded-2xl text-arena-rose hover:bg-white/10 transition-all ${isRefreshing ? 'opacity-50' : ''}`}
          >
             <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Primary Pulse Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <SummaryCard label="Total Teams Loaded" value={stats.total_teams} icon={<Users />} />
         <SummaryCard label="Active in Arena" value={attendance.present} icon={<Activity />} color="text-green-500" />
         <SummaryCard label="Timer Status" value={timeLeft > 0 ? formatTime(timeLeft) : 'LIVE'} icon={<Clock />} color={timeLeft > 0 ? 'text-yellow-500' : 'text-arena-rose'} />
         <SummaryCard label="Locked Missions" value={stats.problems_selected} icon={<Rocket />} color="text-blue-500" />
      </div>

      {/* Modular Control Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Attendance Control Module [GO LIVE HUB] */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-10 flex flex-col gap-10 border-l-4 border-l-green-500 bg-green-500/5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <Users className="w-8 h-8 text-green-500" />
               <h3 className="text-2xl font-black uppercase tracking-widest text-white">Attendance Control</h3>
            </div>
            {sessionActive && (
               <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full border border-green-500/50">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Live Now</span>
               </div>
            )}
          </div>

          <div className="flex flex-col gap-8">
             <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-arena-muted ml-1">Select Target Session</label>
                <div className="relative group">
                   <select 
                     value={selectedSession}
                     onChange={(e) => setSelectedSession(e.target.value)}
                     className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black uppercase tracking-widest appearance-none focus:outline-none focus:border-green-500 transition-all cursor-pointer"
                   >
                     {sessions.map(s => (
                        <option key={s} value={s} className="bg-black text-white">{s}</option>
                     ))}
                   </select>
                   <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-arena-muted pointer-events-none group-focus-within:text-green-500 transition-all" />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <button 
                 onClick={() => toggleSession(true)}
                 disabled={sessionActive || isRefreshing}
                 className={`py-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all ${
                   sessionActive 
                   ? 'bg-green-500 text-black font-black uppercase' 
                   : 'bg-white/5 border border-white/10 text-green-500 hover:bg-green-500/10'
                 } disabled:opacity-50`}
               >
                 <Power className="w-8 h-8" />
                 <span className="text-xs font-black uppercase tracking-tighter">Enable Session (GO LIVE)</span>
               </button>
               
               <button 
                 onClick={() => toggleSession(false)}
                 disabled={!sessionActive || isRefreshing}
                 className={`py-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all ${
                   !sessionActive 
                   ? 'bg-red-600/20 border border-red-500/50 text-red-500 font-black' 
                   : 'bg-white/5 border border-white/10 text-red-500 hover:bg-red-500/10'
                 } disabled:opacity-50`}
               >
                 <LockIcon className="w-8 h-8" />
                 <span className="text-xs font-black uppercase tracking-tighter">Close (Harden System)</span>
               </button>
             </div>
          </div>
        </motion.div>

        {/* --- NEW: GAME ZONE SECURITY PROTOCOL --- */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-10 flex flex-col gap-10 border-l-4 border-l-arena-rose bg-arena-rose/5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <Gamepad2 className="w-8 h-8 text-arena-rose" />
               <h3 className="text-2xl font-black uppercase tracking-widest text-white">Game Zone Security</h3>
            </div>
            {gameZoneUnlocked && (
               <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full border border-green-500/50">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Gateway Open</span>
               </div>
            )}
          </div>

          <div className="flex flex-col gap-8">
             <div className="text-center p-6 bg-black/40 rounded-2xl border border-white/5">
                <p className="text-[10px] text-arena-muted uppercase font-bold tracking-[0.2em] mb-4">Current Authorization State</p>
                <div className={`text-3xl font-black uppercase tracking-tighter ${gameZoneUnlocked ? 'text-green-500' : 'text-red-500'}`}>
                   {gameZoneUnlocked ? 'PROTOCOL: UNSEALED' : 'PROTOCOL: LOCKED'}
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <button 
                 onClick={async () => {
                    await api.post('/admin/config', { key: 'game_zone_unlocked', value: true });
                    alert('SYSTEM: Game Zone Gateway UNSEALED.');
                    fetchStats();
                 }}
                 disabled={gameZoneUnlocked || isRefreshing}
                 className={`py-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all ${
                   gameZoneUnlocked 
                   ? 'bg-green-500/20 border border-green-500/50 text-green-400' 
                   : 'bg-white/5 border border-white/10 text-green-500 hover:bg-green-500/10 shadow-green-500/10 shadow-xl'
                 } disabled:opacity-50 font-black uppercase`}
               >
                 <Rocket className="w-8 h-8" />
                 <span className="text-xs tracking-widest">Authorize Access</span>
               </button>
               
               <button 
                 onClick={async () => {
                    await api.post('/admin/config', { key: 'game_zone_unlocked', value: false });
                    alert('SYSTEM: Game Zone Gateway LOCKED.');
                    fetchStats();
                 }}
                 disabled={!gameZoneUnlocked || isRefreshing}
                 className={`py-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all ${
                   !gameZoneUnlocked 
                   ? 'bg-red-600/20 border border-red-500/50 text-red-500' 
                   : 'bg-white/5 border border-white/10 text-red-500 hover:bg-red-500/10 shadow-red-500/10 shadow-xl'
                 } disabled:opacity-50 font-black uppercase`}
               >
                 <LockIcon className="w-8 h-8" />
                 <span className="text-xs tracking-widest">Emergency Seal</span>
               </button>
             </div>
          </div>
        </motion.div>

        {/* Action Hub */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col gap-6"
        >
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-6">
             <div className="glass-card p-8 flex flex-col items-center justify-center border-b-4 border-b-arena-rose">
                <span className="text-[10px] font-black text-arena-muted uppercase tracking-widest mb-2">Selection Rate</span>
                <span className="text-4xl font-black text-white">{Math.round((stats.problems_selected / (stats.total_teams || 109)) * 100)}%</span>
             </div>
             <div className="glass-card p-8 flex flex-col items-center justify-center border-b-4 border-b-green-500">
                <span className="text-[10px] font-black text-arena-muted uppercase tracking-widest mb-2">Arena Participation</span>
                <span className="text-4xl font-black text-white">{Math.round((attendance.present / (attendance.total || 109)) * 100)}%</span>
             </div>
          </div>

          <div className="glass-card p-10 flex flex-col gap-6 border-l-4 border-l-arena-rose">
             <div className="flex items-center gap-4">
                <Clock className="w-8 h-8 text-arena-rose" />
                <h3 className="text-2xl font-black uppercase tracking-widest text-white">Mission Timing</h3>
             </div>
             
             <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                   <input 
                     type="number" 
                     value={releaseMins}
                     onChange={e => setReleaseMins(parseInt(e.target.value) || 0)}
                     disabled={timeLeft > 0}
                     placeholder="Mins"
                     className={`w-24 bg-white/5 border border-white/10 rounded-xl px-4 text-white font-bold text-center focus:border-arena-rose outline-none transition-all ${timeLeft > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                   />
                   <button 
                     onClick={async () => {
                        const endTime = Date.now() + (releaseMins * 60 * 1000);
                        await api.post('/admin/config', { 
                          key: 'problem_selection_state', 
                          value: { timer_started: true, end_time: endTime, released: false, minutes: releaseMins } 
                        });
                        alert(`MISSION INITIATED: ${releaseMins} minute countdown started. Statements HIDDEN.`);
                        fetchStats();
                     }}
                     className="flex-1 glass-button !py-4 uppercase text-[10px] font-black"
                   >
                     Start Timer (Lock ALL)
                   </button>
                </div>
                
                <button 
                  onClick={async () => {
                     const { data: current } = await api.get('/teams/dashboard-state');
                     await api.post('/admin/config', { 
                       key: 'problem_selection_state', 
                       value: { ...current, released: true } 
                     });
                     alert('MISSION RELEASED: Problem statements are now VISIBLE to all teams.');
                     fetchStats();
                  }}
                  className="w-full bg-green-600 hover:bg-green-500 text-black font-black py-4 rounded-xl uppercase text-[10px] transition-all flex items-center justify-center gap-3"
                >
                  <Eye className="w-4 h-4" /> Release Problem Statements
                </button>

                <button 
                  onClick={async () => {
                     await api.post('/admin/config', { 
                       key: 'problem_selection_state', 
                       value: { timer_started: false, end_time: null, released: false, enabled: false } 
                     });
                     alert('MISSION ABORTED: Selection system reset to SAFE state.');
                     fetchStats();
                  }}
                  className="w-full bg-red-600/20 border border-red-500/30 text-red-500 hover:bg-red-600/30 py-3 rounded-xl uppercase text-[10px] font-black transition-all"
                >
                  Full Logic Reset
                </button>
             </div>
          </div>

          {/* Navigation Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NavButton label="Detailed Attendance Hub" path="/admin/attendance" icon={<Activity />} />
            <NavButton label="Managed Squads (109)" path="/admin/teams" icon={<Users />} />
            <NavButton label="Review Mapping Hub" path="/admin/reviewers" icon={<FileText />} />
            <NavButton label="Public Scoreboard" path="/admin/scoreboard" icon={<BarChart3 />} />
          </div>
        </motion.div>
      </div>

      {/* Danger Zone [Emergency Hardening] */}
      <div className="mt-10 p-10 bg-red-600/5 border border-red-600/20 rounded-[3rem] flex flex-col gap-10">
         <div className="flex items-center gap-4 text-red-500">
            <AlertTriangle className="w-10 h-10" />
            <div>
               <h3 className="text-2xl font-black uppercase tracking-widest">Operational Reset Modules</h3>
               <p className="text-[10px] uppercase font-bold tracking-widest opacity-60 italic">Emergency State Clearance Protocol (Non-Reversible)</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ResetButton 
               label="Flush All Selections" 
               desc="Wipe 109-team mission assignments" 
               onClick={() => handleReset('selections')} 
            />
            <ResetButton 
               label="Flush Attendance" 
               desc="Clear all check-in records" 
               onClick={() => handleReset('attendance')} 
            />
            <ResetButton 
               label="Flush Review Logs" 
               desc="Wipe judging scores & marks" 
               onClick={() => handleReset('scores')} 
            />
            <button 
               onClick={() => handleReset('all')}
               className="p-8 bg-red-600 hover:bg-red-500 text-black font-black uppercase text-xs rounded-3xl transition-all shadow-wine flex flex-col items-center gap-4 group"
            >
               <Trash2 className="w-8 h-8 group-hover:scale-125 transition-transform" />
               <div className="text-center">
                  <span className="block tracking-widest">Hard System Flush</span>
                  <span className="text-[9px] opacity-60 block mt-1">Full Factory Reset</span>
               </div>
            </button>
         </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value, icon, color }) => (
  <div className="glass-card p-10 flex flex-col gap-6 relative overflow-hidden group hover:scale-[1.02] transition-all cursor-default border-white/5">
    <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:text-arena-rose/20 transition-colors">
       {React.cloneElement(icon, { size: 60 })}
    </div>
    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-arena-muted">{label}</span>
    <span className={`text-4xl font-black uppercase tracking-widest ${color || 'text-white'}`}>{value}</span>
  </div>
);

const NavButton = ({ label, path, icon }) => {
  const navigate = useNavigate();
  return (
    <button 
      onClick={() => navigate(path)}
      className="glass-card p-6 flex items-center justify-between group hover:bg-white/10 transition-all border-white/5"
    >
       <div className="flex items-center gap-4">
          <div className="p-3 bg-white/5 rounded-xl text-arena-muted group-hover:text-arena-rose transition-colors">
             {icon}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-arena-muted group-hover:text-white transition-colors">{label}</span>
       </div>
       <ChevronRight className="w-4 h-4 text-arena-muted group-hover:translate-x-1 transition-transform" />
    </button>
  );
};

const ResetButton = ({ label, desc, onClick }) => (
  <button 
    onClick={onClick}
    className="p-8 border border-red-500/20 hover:bg-red-500/5 rounded-3xl flex flex-col items-center gap-4 group transition-all"
  >
     <AlertCircle className="w-8 h-8 text-red-500/50 group-hover:text-red-500 transition-colors" />
     <div className="text-center">
        <span className="block text-xs font-black uppercase tracking-widest text-red-500/80 group-hover:text-red-500">{label}</span>
        <span className="text-[9px] font-bold text-arena-muted uppercase mt-2 block tracking-tighter">{desc}</span>
     </div>
  </button>
);

export default AdminControl;
