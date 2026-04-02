import React, { useState, useEffect } from 'react';
import { Shield, Settings, Users, FileText, Search as SearchIcon, QrCode, UploadCloud, ClipboardCheck, Gamepad2, ImageIcon, Bell, Trophy, BarChart3, Loader2, RefreshCw, Check, CheckCircle2, AlertTriangle, AlertCircle, RefreshCcw, Rocket, Clock, RefreshCw as RefreshIcon, ChevronRight, Star, Activity, Play, Eye, Lock as LockIcon, Unlock as UnlockIcon, ShieldCheck, Save, XCircle, History as HistoryIcon, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import api from '../utils/api';
import socket from '../utils/socket';
import { formatTime } from '../utils/time';

const PageWrapper = ({ title, icon, children }) => (
  <div className="p-8 animate-in fade-in zoom-in duration-500">
    <div className="flex items-center gap-4 mb-8">
      <div className="p-3 glass-premium shadow-wine-glow rounded-xl">
        {icon}
      </div>
      <h1 className="text-3xl font-black text-white tracking-widest uppercase text-glow">{title}</h1>
    </div>
    <div className="glass-premium p-8">
      {children}
    </div>
  </div>
);

// --- Admin Subpages ---

export const AdminTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/teams').then(res => {
      setTeams(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    }).catch(err => setLoading(false));
  }, []);

  return (
    <PageWrapper title={`Force Registry (${teams.length})`} icon={<Users className="w-8 h-8 text-arena-rose" />}>
      <div className="grid grid-cols-1 gap-4">
        {teams.map(t => (
          <div key={t.id} className="glass-card p-6 flex flex-col gap-6 border-l-4 border-l-arena-rose bg-white/5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
               <div className="flex items-center gap-4">
                  <span className="text-xl font-black text-white">{t.id}</span>
                  <div className="flex flex-col">
                     <h3 className="text-lg font-bold text-white uppercase">{t.name}</h3>
                     <span className="text-[10px] text-arena-muted uppercase tracking-widest">{t.cluster} Cluster</span>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <div className="flex gap-1 group">
                     {[1, 2, 3].map(i => (
                        <Star key={i} className={`w-4 h-4 ${i <= (t.stars || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-white/10'}`} />
                     ))}
                  </div>
                  <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${t.problem_id ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}>
                    {t.problem_id || 'Mission Pending'}
                  </span>
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
               {(Array.isArray(t.members) ? t.members : JSON.parse(t.members || '[]')).map((m, idx) => (
                 <div key={idx} className="p-4 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1">
                    <span className="text-[8px] font-black text-arena-rose uppercase tracking-[0.2em]">{m.role || 'Member'}</span>
                    <p className="text-xs font-bold text-white uppercase truncate">{m.name}</p>
                    <p className="text-[10px] text-arena-muted font-bold font-mono uppercase tracking-tighter">REG: {m.regNo || m.reg_no}</p>
                    {m.phone && <p className="text-[9px] text-arena-muted italic">{m.phone}</p>}
                 </div>
               ))}
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-center p-20"><Loader2 className="animate-spin text-arena-rose w-12 h-12" /></div>}
      </div>
    </PageWrapper>
  );
};

export const AdminProblems = () => {
  const [problems, setProblems] = useState([]);
  useEffect(() => {
    api.get('/problems')
      .then(res => setProblems(res.data)).catch(console.error);
  }, []);

  return (
    <PageWrapper title="Problem Statements" icon={<FileText className="w-8 h-8 text-arena-rose" />}>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-4">
        {problems.map(p => (
          <div key={p.id} className={`glass-card p-6 ${p.selected_by ? 'border-arena-rose/50 bg-white/5' : 'hover:border-arena-rose/30 transition-colors'}`}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] bg-arena-wine text-white px-2 py-1 rounded font-bold">{p.id}</span>
              {p.selected_by && <span className="text-[10px] text-arena-rose font-bold uppercase tracking-widest">Selected: {p.selected_by}</span>}
            </div>
            <h4 className="text-sm font-bold text-white mb-2 uppercase line-clamp-2">{p.title}</h4>
            <p className="text-xs text-arena-muted line-clamp-3">{p.description}</p>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
};

export const AdminSelectionControl = () => {
  const [config, setConfig] = useState({ revealed: false, end_time: 0, enabled: false });
  const [problems, setProblems] = useState([]);
  const [stats, setStats] = useState({ selected: 0, pending: 109, available: 0 });
  const [mins, setMins] = useState(5);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const fetchData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        api.get('/problems'),
        api.get('/teams/dashboard-state')
      ]);
      setProblems(pRes.data);
      setConfig(cRes.data);
      
      const selected = pRes.data.reduce((acc, p) => acc + (p.taken_count || 0), 0);
      setStats({
        selected,
        pending: 109 - selected,
        available: pRes.data.filter(p => (p.taken_count || 0) < 3).length
      });

      if (cRes.data.end_time) {
        setTimeLeft(Math.max(0, Math.floor((cRes.data.end_time - Date.now()) / 1000)));
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchData();
    
    socket.on('selection_state_changed', fetchData);
    
    const interval = setInterval(fetchData, 20000); // Relaxed polling
    const ticker = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => { 
      socket.off('selection_state_changed', fetchData);
      clearInterval(interval); 
      clearInterval(ticker); 
    };
  }, []);

  const handleLaunch = async () => {
    setLoading(true);
    try {
      const endTime = Date.now() + (mins * 60000);
      await api.post('/admin/config', { 
        key: 'problem_selection_state', 
        value: { released: false, timer_started: true, end_time: endTime, minutes: mins } 
      });
      alert(`MISSION INITIATED: ${mins} minute countdown started. Statements are HIDDEN from all teams.`);
      fetchData();
    } catch (err) {} finally { setLoading(false); }
  };

  const handleRelease = async () => {
    setLoading(true);
    try {
      await api.post('/admin/config', { 
        key: 'problem_selection_state', 
        value: { ...config, released: true } 
      });
      alert('MISSION RELEASED: Problem statements are now VISIBLE. Selection opens when timer hits 0.');
      fetchData();
    } catch (err) {} finally { setLoading(false); }
  };

  const handleLock = async () => {
    setLoading(true);
    try {
      await api.post('/admin/config', { 
        key: 'problem_selection_state', 
        value: { released: false, timer_started: false, end_time: null, enabled: false } 
      });
      alert('SYSTEM EMERGENCY LOCK: Selection portal sealed.');
      fetchData();
    } catch (err) {} finally { setLoading(false); }
  };

  const handleResetAllSelections = async () => {
    if (!window.confirm('CRITICAL MISSION WIPE: Are you sure you want to clear ALL 109-team problem selections? This will reset the entire selection matrix.')) return;
    setLoading(true);
    try {
      const res = await api.post('/admin/clear-data', { type: 'selections' });
      alert(res.data.message || 'GLOBAL WIPE SUCCESSFUL: All team selections cleared.');
      fetchData();
    } catch (err) {
      alert('Failed to reset selections: ' + (err.response?.data?.error || err.message));
    } finally { setLoading(false); }
  };

  return (
    <PageWrapper title="High-Stakes Selection Hub" icon={<Rocket className="w-8 h-8 text-arena-rose" />}>
      <div className="flex flex-col gap-10">
        
        {/* Phase Control */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* PHASE 1: START TIMER */}
           <div className={`glass-card p-10 flex flex-col gap-6 border-l-4 transition-all ${config.timer_started && !config.released ? 'border-l-arena-rose bg-arena-rose/5' : 'border-l-arena-muted'}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase tracking-widest text-white">Phase 1: Start Timer</h3>
                <Clock className={config.timer_started ? 'text-arena-rose animate-pulse' : 'text-arena-muted'} />
              </div>
              <div className="flex flex-col gap-2">
                 <label className="text-[9px] font-black uppercase text-arena-rose tracking-[0.3em]">Countdown (Mins)</label>
                 <input 
                   type="number" 
                   value={mins} 
                   onChange={e => setMins(e.target.value)} 
                   className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-2xl font-black text-white focus:border-arena-rose outline-none transition-all"
                 />
              </div>

              <button 
                onClick={handleLaunch} 
                disabled={loading || (config.timer_started && !config.released)}
                className="glass-button !py-4 w-full flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {config.timer_started ? <CheckCircle2 className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {config.timer_started ? 'Timer Active' : 'Start Countdown'}
              </button>
           </div>

           {/* PHASE 2: RELEASE STATEMENTS */}
           <div className={`glass-card p-10 flex flex-col gap-6 border-l-4 transition-all ${config.released ? 'border-l-green-500 bg-green-500/5' : 'border-l-arena-muted'}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase tracking-widest text-white">Phase 2: Release</h3>
                <Eye className={config.released ? 'text-green-500' : 'text-arena-muted'} />
              </div>
              <p className="text-[10px] text-arena-muted uppercase font-bold leading-relaxed">
                Make problem statements visible while timer is running. Selection remains LOCKED until 00:00.
              </p>
              <button 
                onClick={handleRelease} 
                disabled={loading || !config.timer_started || config.released}
                className="glass-button !bg-green-600/20 !border-green-500/50 text-green-400 !py-4 w-full flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {config.released ? <CheckCircle2 className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {config.released ? 'Statements Released' : 'Release Statements'}
              </button>
              {timeLeft > 0 && config.released && (
                <div className="text-center">
                   <p className="text-[10px] font-black text-green-500 uppercase tracking-[0.3em] animate-pulse">Selection Opening In</p>
                   <p className="text-3xl font-black text-white tabular-nums tracking-widest">{formatTime(timeLeft)}</p>
                </div>
              )}
           </div>

           {/* PHASE 3: EMERGENCY LOCK */}
           <div className="glass-card p-10 flex flex-col gap-6 border-l-4 border-l-red-500 bg-red-500/5 h-full">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase tracking-widest text-white">Emergency</h3>
                <AlertTriangle className="text-red-500" />
              </div>
              <p className="text-[10px] text-red-400 uppercase font-bold leading-relaxed italic text-center">
                Abort mission and seal the innovation vault.
              </p>
              <button 
                onClick={handleLock}
                disabled={loading}
                className="w-full py-4 border border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-black uppercase tracking-widest text-xs rounded-2xl transition-all"
              >
                Emergency Total Lock
              </button>

              <button 
                onClick={handleResetAllSelections}
                disabled={loading}
                className="w-full py-4 bg-red-600/20 border border-red-600 text-red-400 hover:bg-red-600 hover:text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all flex items-center justify-center gap-3"
              >
                <AlertTriangle className="w-4 h-4" /> Global Reset
              </button>
           </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <StatsCard label="Missions Locked" value={stats.selected} total={109} color="text-arena-rose" />
           <StatsCard label="Teams Reading" value={stats.pending} total={109} color="text-yellow-500" />
           <StatsCard label="Available Lots" value={stats.available} total={problems.length} color="text-green-500" />
           <div className="glass-card p-8 flex flex-col justify-center gap-2">
              <span className="text-[10px] font-black text-arena-muted uppercase tracking-widest text-center">Protocol Level</span>
              <span className="text-xl font-black text-white uppercase tracking-widest text-center">{config.enabled ? 'BATTLE READY' : 'COMMAND LOCK'}</span>
           </div>
        </div>

        {/* Real-time Occupancy */}
        <div className="glass-card p-10 flex flex-col gap-10">
           <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black uppercase tracking-widest text-white underline underline-offset-8 decoration-arena-rose/30">Problem Occupancy Matrix</h3>
              <Activity className="text-arena-rose animate-pulse" />
           </div>
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {problems.map(p => (
                <div key={p.id} className={`glass-card p-4 border flex flex-col gap-2 relative group transition-all ${p.taken_count >= 3 ? 'border-red-500/30 opacity-50 gray-scale' : 'border-white/5 hover:border-arena-rose/30'}`}>
                   <span className="text-[10px] font-black text-arena-rose opacity-60">{p.id}</span>
                   <div className="flex gap-1">
                      {[1, 2, 3].map(i => (
                        <div key={i} className={`flex-1 h-1 rounded-full ${i <= (p.taken_count || 0) ? 'bg-arena-rose shadow-wine-glow' : 'bg-white/10'}`} />
                      ))}
                   </div>
                   <span className="text-[10px] font-bold text-white uppercase truncate">{p.title}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </PageWrapper>
  );
};

const StatsCard = ({ label, value, total, color }) => (
  <div className="glass-card p-8 flex items-center justify-between">
    <div className="flex flex-col gap-1">
      <p className="text-[10px] font-black text-arena-muted uppercase tracking-widest">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className={`text-4xl font-black ${color}`}>{value}</span>
        <span className="text-xs text-arena-muted font-bold">/ {total}</span>
      </div>
    </div>
    <div className={`p-4 bg-white/5 rounded-2xl ${color}`}>
       <BarChart3 className="w-8 h-8" />
    </div>
  </div>
);

export const AdminAttendance = () => {
  const [sessions, setSessions] = useState([]);
  const [newSessionName, setNewSessionName] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState({ total: 109, present: 0, fullyPresent: 0, partial: 0, pending: 109 });
  const [dashboard, setDashboard] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const { data: sList } = await api.get('/admin/sessions');
      setSessions(sList.sessions || []);
      setIsOpen(sList.isOpen);

      // Default to active session if not selected
      let sid = selectedSessionId;
      if (!sid) {
        const active = sList.sessions.find(s => s.is_active);
        if (active) {
          sid = active.id;
          setSelectedSessionId(active.id);
        } else if (sList.sessions.length > 0) {
          sid = sList.sessions[0].id;
          setSelectedSessionId(sid);
        }
      }

      if (sid) {
        const { data: dBoard } = await api.get(`/admin/attendance-dashboard?sessionId=${sid}`);
        setDashboard(dBoard);
        
        // Calculate status metrics
        const total = dBoard.length || 109;
        const comp = dBoard.filter(t => t.status === 'Completed').length;
        const part = dBoard.filter(t => t.status === 'Partial').length;
        const pend = dBoard.filter(t => t.status === 'Pending').length;
        
        setStats({
          total,
          present: comp + part,
          fullyPresent: comp,
          partial: part,
          pending: pend
        });
      }
    } catch (err) {
      console.error('Fetch Admin Attendance Error:', err);
    }
  };

  useEffect(() => {
    fetchData();
    socket.on('attendance_session_changed', fetchData);
    socket.on('attendance_marked', fetchData);
    
    const interval = setInterval(fetchData, 12000); // Throttled polling to 12s
    return () => {
      socket.off('attendance_session_changed', fetchData);
      socket.off('attendance_marked', fetchData);
      clearInterval(interval);
    };
  }, [selectedSessionId]);

  const handleStart = async () => {
    if (!newSessionName.trim()) return alert('Please enter a session name (e.g. Day 1 Morning)');
    setLoading(true);
    try {
      await api.post('/admin/sessions', { action: 'START', sessionName: newSessionName.trim() });
      setNewSessionName('');
      setSelectedSessionId(null); // Will auto-select new active
      fetchData();
    } finally { setLoading(false); }
  };

  const handleEnd = async () => {
    if (!window.confirm('Are you sure you want to END the current session?')) return;
    setLoading(true);
    try {
      await api.post('/admin/sessions', { action: 'END' });
      fetchData();
    } finally { setLoading(false); }
  };

  const executeExport = async (mode) => {
    if (!selectedSessionId) return alert('Select a session to export');
    try {
      const { data } = await api.get(`/admin/export?sessionId=${selectedSessionId}&mode=${mode}`);
      if (!data || data.length === 0) return alert('No records found for this export mode.');

      const headers = Object.keys(data[0]);
      let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
      data.forEach(row => {
        const values = headers.map(h => `"${row[h] || ''}"`);
        csvContent += values.join(",") + "\n";
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      const sessionName = sessions.find(s => s.id === selectedSessionId)?.session_name || 'Session';
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Attendance_${sessionName}_${mode}_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('Export failed');
    }
  };

  const activeSession = sessions.find(s => s.is_active);

  return (
    <PageWrapper title="Attendance Command" icon={<QrCode className="w-8 h-8 text-arena-rose" />}>
      <div className="flex flex-col gap-8">
        
        {/* TOP LEVEL: Session Management & Metrics */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
           {/* Start/End Control */}
           <div className="glass-card p-6 bg-black/40 border-l-4 border-l-arena-rose flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-arena-muted uppercase tracking-widest">Mission Control</span>
                {isOpen && <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
              </div>

              {!isOpen ? (
                <div className="flex flex-col gap-3">
                   <input 
                      type="text" 
                      placeholder="Session Name (e.g. Day 1 Morning)"
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-bold"
                      value={newSessionName}
                      onChange={e => setNewSessionName(e.target.value)}
                   />
                   <button 
                     onClick={handleStart} 
                     disabled={loading} 
                     className="w-full py-3 bg-arena-rose/20 text-arena-rose border border-arena-rose/30 rounded-xl hover:bg-arena-rose/40 transition-all font-black text-xs uppercase flex items-center justify-center gap-2"
                   >
                     <Play className="w-4 h-4" /> Start New Session
                   </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                   <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                      <p className="text-[8px] font-black text-green-500 uppercase">Live Session</p>
                      <p className="text-sm font-black text-white truncate">{activeSession?.session_name}</p>
                   </div>
                   <button 
                     onClick={handleEnd} 
                     disabled={loading} 
                     className="w-full py-3 bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl hover:bg-red-500/40 transition-all font-black text-xs uppercase flex items-center justify-center gap-2"
                   >
                     <XCircle className="w-4 h-4" /> End Current Session
                   </button>
                </div>
              )}
           </div>

           {/* Metrics Grid */}
           <div className="xl:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-6 bg-black/40 border-b-2 border-b-white/5 flex flex-col justify-center">
                 <span className="text-[9px] font-black text-arena-muted uppercase tracking-normal">Total SQUADS</span>
                 <span className="text-3xl font-black text-white">{stats.total}</span>
              </div>
              <div className="glass-card p-6 bg-black/40 border-b-2 border-b-green-500/30 flex flex-col justify-center">
                 <span className="text-[9px] font-black text-green-500 uppercase tracking-normal">Fully Present</span>
                 <span className="text-3xl font-black text-green-500">{stats.fullyPresent}</span>
              </div>
              <div className="glass-card p-6 bg-black/40 border-b-2 border-b-yellow-500/30 flex flex-col justify-center">
                 <span className="text-[9px] font-black text-yellow-500 uppercase tracking-normal">Partial Check-in</span>
                 <span className="text-3xl font-black text-yellow-500">{stats.partial}</span>
              </div>
              <div className="glass-card p-6 bg-black/40 border-b-2 border-b-red-500/30 flex flex-col justify-center">
                 <span className="text-[9px] font-black text-red-500 uppercase tracking-normal">Pending Scan</span>
                 <span className="text-3xl font-black text-red-500">{stats.pending}</span>
              </div>
           </div>
        </div>

        {/* HISTORICAL VIEW & EXPORT COMMANDS */}
        <div className="flex flex-col lg:flex-row items-center gap-6">
           <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-2 rounded-2xl w-full lg:w-auto">
              <HistoryIcon className="w-5 h-5 text-arena-rose ml-3" />
              <select 
                className="bg-transparent text-white font-bold text-xs p-2 focus:outline-none min-w-[200px]"
                value={selectedSessionId || ''}
                onChange={e => setSelectedSessionId(Number(e.target.value))}
              >
                 {sessions.map(s => (
                   <option key={s.id} value={s.id} className="bg-arena-bg">
                      {s.session_name} {s.is_active ? '(LIVE)' : ''}
                   </option>
                 ))}
                 {sessions.length === 0 && <option>No History Available</option>}
              </select>
           </div>

           <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 custom-scrollbar">
              <button 
                onClick={() => executeExport('team-wise')} 
                className="whitespace-nowrap px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-arena-muted uppercase hover:text-white hover:bg-white/10 transition-all border-l-2 border-l-blue-500"
              >
                 Team Analysis
              </button>
              <button 
                onClick={() => executeExport('present-only')} 
                className="whitespace-nowrap px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-arena-muted uppercase hover:text-white hover:bg-white/10 transition-all border-l-2 border-l-green-500"
              >
                 Present Logs
              </button>
              <button 
                onClick={() => executeExport('pending-only')} 
                className="whitespace-nowrap px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-arena-muted uppercase hover:text-white hover:bg-white/10 transition-all border-l-2 border-l-red-500"
              >
                 Pending List
              </button>
              <button 
                onClick={() => executeExport('all')} 
                className="whitespace-nowrap px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-arena-muted uppercase hover:text-white hover:bg-white/10 transition-all border-l-2 border-l-arena-rose"
              >
                 Raw Export
              </button>
           </div>
        </div>

        {/* MISSION RADAR: 109 Squad Status Grid */}
        <div className="glass-premium p-8 rounded-3xl border border-white/5 bg-black/60 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
              <Activity className="w-40 h-40 text-arena-rose" />
           </div>

           <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6 relative z-10">
              <div className="flex flex-col">
                 <h2 className="text-3xl font-black text-white uppercase tracking-tight italic">Mission Radar</h2>
                 <p className="text-arena-rose text-[10px] font-black uppercase tracking-[0.4em] mt-1">Live Deployment Status [109 SQUADS]</p>
              </div>
              <button 
                onClick={fetchData} 
                className="p-3 bg-white/5 border border-white/10 rounded-2xl text-arena-muted hover:text-white transition-all shadow-inner"
              >
                 <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
           </div>

           <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15 xl:grid-cols-20 gap-3 relative z-10">
              {dashboard.map(t => {
                 let colorClass = "bg-white/5 border-white/5 text-arena-muted/30";
                 if (t.status === 'Completed') colorClass = "bg-green-500 border-green-400 text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]";
                 if (t.status === 'Partial') colorClass = "bg-yellow-500 border-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.2)]";
                 if (t.status === 'Pending') colorClass = "bg-red-500/20 border-red-500/40 text-red-500";
                 
                 return (
                    <div 
                      key={t.id} 
                      title={`${t.id}: ${t.name} (${t.status})`}
                      className={`aspect-square flex flex-col items-center justify-center rounded-lg text-[10px] font-black tracking-tighter transition-all duration-300 border cursor-help hover:scale-110 active:scale-95 ${colorClass}`}
                    >
                       {t.id.replace('CREATOR-', '')}
                    </div>
                 );
              })}
              {dashboard.length === 0 && Array.from({length: 109}, (_, i) => (
                <div key={i} className="aspect-square bg-white/5 border border-white/5 rounded-lg opacity-20" />
              ))}
           </div>
        </div>

        {/* Detailed Logs Section */}
        <div className="glass-card p-10 bg-black/40 border border-white/5">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                 <Activity className="w-6 h-6 text-arena-rose" />
                 <h3 className="text-xl font-black text-white uppercase tracking-widest italic">Squad Manifest Info</h3>
              </div>
           </div>
           
           <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-4">
               {dashboard.map(t => (
                  <TeamRow key={t.id} team={t} />
               ))}
            </div>
        </div>
      </div>
    </PageWrapper>
  );
};

const TeamRow = React.memo(({ team }) => {
  const [expanded, setExpanded] = useState(false);
  
  const getSafeMembers = (members) => {
    if (!members) return [];
    if (Array.isArray(members)) return members;
    try { return JSON.parse(members); } catch (e) { return []; }
  };

  return (
    <div className={`transition-all duration-500 overflow-hidden ${expanded ? 'bg-white/5 border border-white/10 rounded-2xl p-4' : 'bg-transparent border-b border-white/5'}`}>
      <div 
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between p-3 cursor-pointer group hover:bg-white/5 transition-all rounded-xl"
      >
        <div className="flex items-center gap-6">
          <span className="text-xs font-black text-white w-20">{team.id}</span>
          <div className="flex flex-col">
             <span className="text-sm font-bold text-white uppercase group-hover:text-arena-rose transition-colors">{team.name}</span>
             <span className="text-[10px] text-arena-muted uppercase tracking-widest">{team.cluster} Cluster</span>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <span className="px-3 py-1 rounded bg-white/5 border border-white/5 text-[9px] font-black text-arena-muted">
             {team.membersPresent || 0} / 5
          </span>
          <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${team.status === 'Present' ? 'bg-green-500/20 text-green-500 border border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}>
            {team.status}
          </span>
          <ChevronRight className={`w-4 h-4 text-arena-muted transition-transform duration-500 ${expanded ? 'rotate-90 text-arena-rose' : ''}`} />
        </div>
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="pt-6 pb-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 border-t border-white/10 pt-6">
              {getSafeMembers(team.members || []).map((m, idx) => {
                const isPresent = (team.presentMemberIds || []).includes(String(m.regNo || m.reg_no));
                return (
                  <div key={idx} className={`flex flex-col gap-2 p-4 rounded-xl border transition-all ${isPresent ? 'bg-green-500/10 border-green-500/30' : 'bg-black/20 border-white/5 opacity-60'}`}>
                     <div className="flex justify-between items-start">
                        <p className="text-[8px] font-black text-arena-rose uppercase tracking-[0.2em]">{m.role || 'Member'}</p>
                        <span className={`text-[7px] font-black px-2 py-0.5 rounded-full uppercase ${isPresent ? 'bg-green-500 text-black' : 'bg-red-500/20 text-red-500'}`}>
                           {isPresent ? 'PRESENT' : 'ABSENT'}
                        </span>
                     </div>
                     <p className="text-xs font-bold text-white uppercase truncate">{m.name}</p>
                     <p className="text-[10px] text-arena-muted font-bold tracking-widest">REG: {m.regNo || m.reg_no || 'NA'}</p>
                     <p className="text-[9px] text-arena-muted italic">{m.phone || 'No Contact'}</p>
                  </div>
                );
              })}
              {getSafeMembers(team.members || []).length === 0 && (
                <p className="col-span-full text-center text-arena-muted uppercase text-[10px] tracking-widest italic py-4">No member details available</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    );
});

// AdminPPT component removed per user request

export const AdminReviewers = () => {
  const [selectedRound, setSelectedRound] = useState('1');
  const [activeRound, setActiveRound] = useState('1');
  const [names, setNames] = useState({ "1": {}, "2": {}, "3": {} });
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const { data: nData } = await api.get('/admin/config', { params: { key: 'reviewer_names_v2' } });
      setNames(nData || { "1": {}, "2": {}, "3": {} });
      
      const { data: rState } = await api.get('/teams/dashboard-state');
      const currentRound = String(rState.active_round || "1");
      setActiveRound(currentRound);
      setSelectedRound(currentRound); // <--- SYNC ON MOUNT
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.post('/admin/config', { key: 'reviewer_names_v2', value: names });
      alert(`SUCCESS: Reviewer names synchronized for Round ${selectedRound}.`);
    } catch (err) { alert('Failed to sync names'); }
    finally { setLoading(false); }
  };

  const handleSetGlobalRound = async (r) => {
    if (!window.confirm(`SENSITIVE OPERATION: Switch global system to Round ${r}?`)) return;
    setLoading(true);
    try {
      // 1. Update active_round in config (syncs all teams/reviewers)
      await api.post('/admin/config', { key: 'active_round', value: r });
      
      // 2. AUTO-OPEN the phase for that round
      await api.post('/admin/config', { key: `review_round_${r}_status`, value: 'open' });

      setActiveRound(r);
      setSelectedRound(r); // <--- SYNC ON GLOBAL CHANGE
      alert(`SYSTEM ALERT: Now Operating in Round ${r} (Phase Opened)`);
    } catch (err) { alert('Failed to update system round'); }
    finally { setLoading(false); }
  };

  const updateName = (round, slot, val) => {
    setNames(prev => ({
      ...prev,
      [round]: { ...prev[round], [slot]: val }
    }));
  };

  const getRanges = () => {
    return [
      { slot: 'R1', range: 'Teams 1-11' },
      { slot: 'R2', range: 'Teams 12-22' },
      { slot: 'R3', range: 'Teams 23-33' },
      { slot: 'R4', range: 'Teams 34-44' },
      { slot: 'R5', range: 'Teams 45-55' },
      { slot: 'R6', range: 'Teams 56-66' },
      { slot: 'R7', range: 'Teams 67-77' },
      { slot: 'R8', range: 'Teams 78-88' },
      { slot: 'R9', range: 'Teams 89-99' },
      { slot: 'R10', range: 'Teams 100-109' },
    ];
  };

  return (
    <PageWrapper title="High-Stakes Reviewer Mapping" icon={<Users className="w-8 h-8 text-arena-rose" />}>
      <div className="flex flex-col gap-10">
        
        {/* System Control Section */}
        <div className="glass-premium p-8 rounded-3xl border border-arena-rose/20 bg-arena-wine/5 flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-arena-rose/10 rounded-2xl flex items-center justify-center border border-arena-rose/30 shadow-wine-glow">
                 <ShieldCheck className="w-8 h-8 text-arena-rose" />
              </div>
              <div>
                 <h3 className="text-xl font-black text-white uppercase tracking-widest">Active System Round</h3>
                 <p className="text-arena-muted text-[10px] font-black uppercase tracking-[0.4em] mt-1">Status: <span className="text-green-500">Live Operation</span></p>
              </div>
           </div>
           
           <div className="flex gap-4">
              {['1', '2', '3'].map(r => (
                <button 
                  key={r}
                  onClick={() => handleSetGlobalRound(r)}
                  disabled={loading}
                  className={`px-10 py-4 rounded-xl font-black transition-all border-2
                    ${activeRound === r 
                      ? 'bg-arena-rose border-arena-rose text-white shadow-wine-glow scale-110' 
                      : 'bg-white/5 border-white/10 text-arena-muted hover:border-arena-rose/50 hover:text-white'
                    }`}
                >
                  ROUND {r}
                </button>
              ))}
           </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
             <h3 className="text-lg font-black text-white uppercase tracking-widest">Mapping Configuration</h3>
             {/* Round Selection Tabs for Mapping */}
            <div className="flex gap-4 p-1.5 bg-black/40 rounded-xl">
              {['1', '2', '3'].map(r => (
                <button 
                  key={r}
                  onClick={() => setSelectedRound(r)}
                  className={`px-6 py-2 rounded-lg text-[10px] font-black transition-all ${selectedRound === r ? 'bg-arena-rose text-white shadow-wine-glow' : 'text-arena-muted hover:text-white'}`}
                >
                  CONFIG R{r}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getRanges(selectedRound).map((r, i) => (
              <div key={i} className="glass-card p-8 flex flex-col gap-4 border-l-4 border-l-arena-rose">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-arena-muted uppercase tracking-[0.2em]">Reviewer {i+1} Slot ({r.slot})</span>
                  <h4 className="text-lg font-black text-white uppercase">{r.range}</h4>
                </div>
                <input 
                  type="text" 
                  placeholder="Reviewer Name Placeholder"
                  className="bg-black/20 border border-white/10 rounded-xl p-4 text-white font-bold focus:border-arena-rose focus:ring-1 focus:ring-arena-rose/30 outline-none"
                  value={names[selectedRound]?.[r.slot] || ''}
                  onChange={(e) => updateName(selectedRound, r.slot, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-4 mt-4">
             <button 
               onClick={handleSave} 
               disabled={loading}
               className="glass-button !py-4 px-12 flex items-center gap-3 shadow-wine-glow disabled:opacity-50"
             >
               {loading ? <Loader2 className="animate-spin" /> : <Save className="w-5 h-5" />}
               Save Round {selectedRound} Mappings
             </button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export const AdminReviewControl = () => {
  const [loading, setLoading] = useState({});
  const [roundStatus, setRoundStatus] = useState({ 1: 'closed', 2: 'closed', 3: 'closed' });

  useEffect(() => {
    api.get('/teams/dashboard-state')
      .then(res => {
        setRoundStatus({
           1: res.data.review_round_1_status || 'closed',
           2: res.data.review_round_2_status || 'closed',
           3: res.data.review_round_3_status || 'closed'
        });
      });
  }, []);

  const toggleRound = async (round, status) => {
    setLoading(prev => ({ ...prev, [`${round}-${status}`]: true }));
    try {
      // 1. Update the session phase status (for UI visibility)
      await api.post('/admin/config', { key: `review_round_${round}_status`, value: status });
      
      // 2. CRITICAL: If opening a round, also make it the GLOBAL active round
      if (status === 'open') {
        await api.post('/admin/config', { key: 'active_round', value: String(round) });
      }

      setRoundStatus(prev => ({ ...prev, [round]: status }));
      alert(`Round ${round} ${status === 'open' ? 'Opened & Set Active' : 'Closed'}`);
    } catch (err) {
      alert('Failed to update round status');
    } finally {
      setLoading(prev => ({ ...prev, [`${round}-${status}`]: false }));
    }
  };

  return (
    <PageWrapper title="Review Phases Hub" icon={<ClipboardCheck className="w-8 h-8 text-arena-rose" />}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map(round => (
          <div key={round} className="glass-card p-10 flex flex-col items-center gap-6 text-center group hover:scale-[1.02] transition-transform">
            <div className={`p-4 rounded-full border shadow-wine-glow ${roundStatus[round] === 'open' ? 'bg-green-500/20 border-green-500' : 'bg-arena-wine/20 border-arena-rose/30'}`}>
              <ClipboardCheck className={`w-8 h-8 ${roundStatus[round] === 'open' ? 'text-green-500' : 'text-arena-rose'}`} />
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-widest text-glow">Round {round}</h3>
            <p className="text-[10px] text-arena-muted uppercase font-bold tracking-widest">Status: <span className={roundStatus[round] === 'open' ? 'text-green-500' : 'text-red-500'}>{roundStatus[round]}</span></p>
            <div className="flex flex-col gap-4 w-full mt-2">
              <button 
                onClick={() => toggleRound(round, 'open')}
                disabled={loading[`${round}-open`]}
                className="glass-button bg-green-600/20 text-green-400 !border-green-500/30 hover:bg-green-600/40 w-full flex items-center justify-center gap-2"
              >
                {loading[`${round}-open`] ? <Loader2 className="animate-spin" /> : 'Open Round'}
              </button>
              <button 
                onClick={() => toggleRound(round, 'closed')}
                disabled={loading[`${round}-closed`]}
                className="glass-button bg-red-600/20 text-red-400 !border-red-500/30 hover:bg-red-600/40 w-full flex items-center justify-center gap-2"
              >
                {loading[`${round}-closed`] ? <Loader2 className="animate-spin" /> : 'Close & Lock'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
};

export const AdminGameControl = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    fetchStatus();
    fetchLeaderboard();
    const interval = setInterval(() => {
      fetchStatus();
      fetchLeaderboard();
    }, 15000); // 15s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const { data } = await api.get('/admin/summary');
      setUnlocked(data.gameZoneUnlocked);
    } catch (err) { console.error('Failed to sync game status:', err); }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get('/admin/game-leaderboard');
      setLeaderboard(res.data);
    } catch (err) {}
  };

  const toggleGameZone = async (status) => {
    setLoading(true);
    try {
      await api.post('/admin/config', { key: 'game_zone_unlocked', value: status });
      setUnlocked(status); // Optimistic Update
      alert(`SYSTEM ALERT: Game Zone Vault ${status ? 'UNSEALED' : 'LOCKED'}`);
    } catch (err) {
      alert('Failed to update vault security protocols');
    } finally { setLoading(false); }
  };

  return (
    <PageWrapper title="Command Center: Game Master" icon={<Gamepad2 className="w-8 h-8 text-arena-rose" />}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 glass-card p-10 flex flex-col items-center justify-center gap-8 h-fit border-arena-rose/20 relative overflow-hidden group">
          <div className={`absolute inset-0 opacity-10 transition-all duration-1000 ${unlocked ? 'bg-green-500 shadow-[0_0_50px_rgba(34,197,94,0.2)]' : 'bg-red-500 shadow-[0_0_50px_rgba(239,68,68,0.2)]'}`} />
          <div className="relative z-10 flex flex-col items-center gap-6">
            <div className={`p-6 rounded-full border-2 transition-all duration-700 shadow-wine-glow ${unlocked ? 'bg-green-500/20 border-green-500 animate-pulse' : 'bg-red-500/10 border-red-500/30'}`}>
              {unlocked ? <Rocket className="w-12 h-12 text-green-500" /> : <LockIcon className="w-12 h-12 text-red-500" />}
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black text-white uppercase tracking-widest">Vault Status</h3>
              <p className="text-[10px] text-arena-muted uppercase font-bold tracking-[0.3em] mt-2">
                Operational State: <span className={unlocked ? 'text-green-500' : 'text-red-500'}>{unlocked ? 'OPEN' : 'LOCKED'}</span>
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full">
               <button 
                  onClick={() => toggleGameZone(true)} 
                  disabled={loading || unlocked}
                  className={`glass-button !py-4 !px-6 flex items-center justify-center gap-3 w-full transition-all duration-500 ${unlocked ? 'opacity-20 grayscale cursor-not-allowed' : 'bg-green-500/20 text-green-400 !border-green-500/50 hover:bg-green-500/30 shadow-green-500/20 shadow-lg'}`}
               >
                  <UnlockIcon className="w-5 h-5" /> UNLOCK GAME ZONE
               </button>
               <button 
                  onClick={() => toggleGameZone(false)} 
                  disabled={loading || !unlocked}
                  className={`glass-button !py-4 !px-6 flex items-center justify-center gap-3 w-full transition-all duration-500 ${!unlocked ? 'opacity-20 grayscale cursor-not-allowed' : 'bg-red-500/20 text-red-400 !border-red-500/50 hover:bg-red-500/30 shadow-red-500/20 shadow-lg'}`}
               >
                  <LockIcon className="w-5 h-5" /> LOCK GAME ZONE
               </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 glass-card p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white uppercase tracking-widest border-l-4 border-arena-wine pl-4">Game Leaderboard</h3>
            <button onClick={fetchLeaderboard} className="p-2 hover:bg-white/10 rounded-lg text-arena-rose"><RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
          </div>
          <div className="overflow-y-auto max-h-[300px] custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-arena-rose font-bold uppercase tracking-widest">
                  <th className="p-3">Rank</th>
                  <th className="p-3">Team</th>
                  <th className="p-3">Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length === 0 ? (
                  <tr><td colSpan="3" className="p-10 text-center text-arena-muted italic">No scores recorded yet.</td></tr>
                ) : leaderboard.map((t, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-3 font-black text-white"># {i + 1}</td>
                    <td className="p-3 font-bold text-white truncate max-w-[150px]">{t.name}</td>
                    <td className="p-3 text-arena-rose font-black">{t.total_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export const AdminMemoryWall = () => {
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    api.get('/teams/dashboard-state')
      .then(res => setActive(res.data.memory_wall_active || false));
  }, []);

  const toggleWall = async (status) => {
    setLoading(true);
    try {
      await api.post('/admin/config', { key: 'memory_wall_active', value: status });
      setActive(status);
      alert(`Memory Wall ${status ? 'Activated' : 'Deactivated'}`);
    } catch (err) {} finally { setLoading(false); }
  };

  return (
    <PageWrapper title="Memory Wall Control" icon={<ImageIcon className="w-8 h-8 text-arena-rose" />}>
      <div className="flex flex-col gap-6">
        <p className="text-xs text-arena-muted uppercase font-bold">Status: <span className={active ? 'text-green-500' : 'text-red-500'}>{active ? 'ACTIVE' : 'INACTIVE'}</span></p>
        <button 
          onClick={() => toggleWall(!active)}
          disabled={loading}
          className={`glass-button w-64 ${active ? 'bg-red-600/20 text-red-400' : 'bg-green-600/20 text-green-400'}`}
        >
          {loading ? <Loader2 className="animate-spin" /> : active ? 'Deactivate Wall' : 'Activate Wall Globally'}
        </button>
        <p className="text-arena-muted uppercase tracking-widest text-[10px]">Photo submissions will only be visible in the Wall when active.</p>
      </div>
    </PageWrapper>
  );
};

export const AdminNotifications = () => {
  const [message, setMessage] = useState('');
  const [poll, setPoll] = useState({ question: '', options: ['', '', '', ''], active: false });

  const sendBroadcast = async () => {
    if(!message) return;
    try {
      await api.post('/admin/config', { key: 'broadcast_message', value: message });
      alert('Broadcast dispatched globally!');
      setMessage('');
    } catch(err) { alert('Failed to broadcast'); }
  };

  const createPoll = async () => {
    if (!poll.question || poll.options.filter(o => o).length < 2) return alert('Poll needs a question and at least 2 options');
    try {
      await api.post('/admin/poll', { ...poll, active: true });
      alert('Poll broadcasted to all teams!');
    } catch(err) {}
  };

  return (
    <PageWrapper title="Command Comms" icon={<Bell className="w-8 h-8 text-arena-rose" />}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="glass-card p-10 flex flex-col gap-6">
          <h3 className="text-xl font-black text-white uppercase tracking-widest border-l-4 border-arena-rose pl-4">1. Global Broadcast</h3>
          <textarea 
            value={message} 
            onChange={e=>setMessage(e.target.value)} 
            placeholder="Broadcast urgent alert to all dashboards..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl p-6 text-white focus:border-arena-rose outline-none min-h-[150px] mb-4 text-sm" 
          />
          <button onClick={sendBroadcast} className="glass-button w-full shadow-wine-glow">Dispatch Broadcast</button>
        </div>

        <div className="glass-card p-10 flex flex-col gap-6">
          <h3 className="text-xl font-black text-white uppercase tracking-widest border-l-4 border-arena-wine pl-4">2. Interactive Poll</h3>
          <input 
            type="text" 
            placeholder="What is the question?" 
            value={poll.question}
            onChange={e => setPoll({...poll, question: e.target.value})}
            className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white outline-none focus:border-arena-rose"
          />
          <div className="grid grid-cols-2 gap-4">
            {poll.options.map((opt, i) => (
              <input 
                key={i}
                type="text" 
                placeholder={`Option ${i+1}`} 
                value={opt}
                onChange={e => {
                  const newOps = [...poll.options];
                  newOps[i] = e.target.value;
                  setPoll({...poll, options: newOps});
                }}
                className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-arena-rose"
              />
            ))}
          </div>
          <button onClick={createPoll} className="glass-button w-full border-arena-wine hover:shadow-wine-glow mt-4">Launch Radar Poll</button>
        </div>
      </div>
    </PageWrapper>
  );
};

export const AdminLeaderboards = () => (
  <PageWrapper title="Public Leaderboards" icon={<Trophy className="w-8 h-8 text-arena-rose" />}>
     <button className="glass-button w-64">Release Official Standings</button>
  </PageWrapper>
);

export const AdminExport = () => {
  const handleExport = async (type) => {
    try {
      const response = await api.get(`/admin/export?type=${type}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_export.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  return (
    <PageWrapper title="Data Export Center" icon={<FileText className="w-8 h-8 text-arena-rose" />}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { id: 'teams', label: 'Teams Data' },
          { id: 'attendance', label: 'Attendance Log' },
          { id: 'scores', label: 'Final Scores' },
          { id: 'problems', label: 'Problem Distribution' }
        ].map(({ id, label }) => (
          <button 
            key={id} 
            onClick={() => handleExport(id)}
            className="glass-premium p-6 flex flex-col items-center justify-center gap-4 hover:shadow-wine-glow hover:bg-white/10 transition-all cursor-pointer border-none text-left"
          >
            <FileText className="w-10 h-10 text-arena-rose" />
            <span className="text-sm font-bold text-white uppercase text-center">{label} (XLSX)</span>
          </button>
        ))}
      </div>
    </PageWrapper>
  );
};
