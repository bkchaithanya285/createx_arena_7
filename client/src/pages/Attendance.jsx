import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { 
  UserCheck,
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  History as HistoryIcon,
  Info 
} from 'lucide-react';
import api from '../utils/api';

const Attendance = () => {
  const [state, setState] = useState({
    attendance_open: false,
    active_session: 'Closed',
    active_session_members: [],
    present_count: 0,
    total_count: 0
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const { data: dashboard } = await api.get('/teams/dashboard-state');
      setState(dashboard);

      const { data: hist } = await api.get('/teams/me/attendance');
      setHistory(hist);
    } catch (err) {
      console.error('Failed to fetch attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const arenaUser = JSON.parse(localStorage.getItem('arena_user')) || {};

  return (
    <div className="p-6 lg:p-10 flex flex-col gap-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h2 className="text-4xl font-extrabold uppercase tracking-widest text-white wine-glow mb-2">Squad Attendance</h2>
           <p className="text-arena-muted uppercase tracking-[0.2em] font-light">Mission Presence Verification</p>
        </div>
        <div className={`px-6 py-3 rounded-2xl border flex items-center gap-4 transition-all duration-500 ${state.attendance_open ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30 opacity-60'}`}>
           <div className={`w-3 h-3 rounded-full ${state.attendance_open ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
           <div className="flex flex-col">
              <span className="text-[10px] font-black text-arena-muted uppercase">System Status</span>
              <span className={`text-sm font-black uppercase ${state.attendance_open ? 'text-green-500' : 'text-red-500'}`}>
                 {state.attendance_open ? 'LIVE' : 'CLOSED'}
              </span>
           </div>
           <div className="w-[1px] h-8 bg-white/10 mx-2" />
           <div className="flex flex-col">
              <span className="text-[10px] font-black text-arena-muted uppercase">Active Mission</span>
              <span className="text-sm font-black text-white uppercase">{state.active_session}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left: QR Code Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="xl:col-span-1 glass-card p-10 flex flex-col items-center justify-center text-center gap-8 border-t-4 border-t-arena-rose"
        >
          <div className="w-64 h-64 bg-white p-4 rounded-3xl shadow-[0_0_40px_rgba(255,255,255,0.1)] relative group">
            <QRCodeSVG value={JSON.stringify({ team_id: arenaUser.id })} className="w-full h-full" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-6 rounded-3xl backdrop-blur-sm">
               <p className="text-white text-xs font-bold leading-relaxed">Present this code to a volunteer to mark your squad's presence.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-2xl font-black uppercase tracking-widest text-white italic">Squad QR Access</h3>
            <div className="bg-white/5 p-4 rounded-xl flex items-center gap-4 border border-white/5 text-left">
              <ShieldCheck className="w-6 h-6 text-arena-rose flex-shrink-0" />
              <p className="text-[10px] uppercase font-bold tracking-widest text-arena-muted">
                Secure identification verified via CREATEX Central Command.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Center: Live Member Status */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="xl:col-span-2 flex flex-col gap-6"
        >
          <div className="glass-card p-8 flex flex-col gap-8 h-full">
            <div className="flex items-center justify-between border-b border-white/10 pb-6">
               <div className="flex items-center gap-3">
                  <UserCheck className="w-6 h-6 text-arena-rose" />
                  <h4 className="text-xl font-bold uppercase tracking-widest text-white italic">Live Squad Manifest</h4>
               </div>
               <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-arena-muted uppercase tracking-widest">Penetration</span>
                  <span className={`text-2xl font-black ${state.present_count === state.total_count ? 'text-green-500' : 'text-white'}`}>
                    {state.present_count} / {state.total_count}
                  </span>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {state.active_session_members.length === 0 ? (
                 <div className="col-span-full py-10 text-center text-arena-muted italic text-sm">
                    No session currently active. Check back when mission starts.
                 </div>
               ) : state.active_session_members.map((m, i) => (
                 <div key={i} className={`p-5 rounded-2xl border transition-all duration-500 flex items-center justify-between ${m.status === 'Present' ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10 opacity-70'}`}>
                    <div className="flex flex-col">
                       <span className="text-xs font-black text-white uppercase">{m.name}</span>
                       <span className="text-[9px] font-bold text-arena-muted tracking-widest">{m.regNo}</span>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[8px] font-black uppercase ${m.status === 'Present' ? 'bg-green-500/20 text-green-500' : 'bg-white/10 text-arena-muted'}`}>
                       {m.status === 'Present' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                       {m.status}
                    </div>
                 </div>
               ))}
            </div>

            <div className="mt-auto p-4 bg-arena-rose/5 rounded-2xl flex items-start gap-4 border border-arena-rose/10">
              <Info className="w-5 h-5 text-arena-rose mt-1 flex-shrink-0" />
              <p className="text-[10px] leading-relaxed text-arena-muted font-bold uppercase tracking-tight italic">
                SQUADS MUST ENSURE ALL MEMBERS ARE SCANNED IN DURING THE LIVE WINDOW. MISSING ENTRIES MAY IMPACT FINAL EVALUATION.
              </p>
            </div>
          </div>
        </motion.div>

        {/* History: Below fold */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-3 glass-card p-8 flex flex-col gap-6"
        >
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                <HistoryIcon className="w-6 h-6 text-arena-rose" />
                <h4 className="text-xl font-bold uppercase tracking-widest text-white italic">Mission Log History</h4>
             </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
             <table className="w-full text-left">
                <thead>
                   <tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-arena-muted">
                      <th className="py-4 px-4">Mission Name</th>
                      <th className="py-4 px-4 text-center">Status</th>
                      <th className="py-4 px-4 text-center">Deployment</th>
                      <th className="py-4 px-4 text-right">Last Sync</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                   {history.map((h, i) => (
                     <tr key={i} className="group hover:bg-white/5 transition-all">
                        <td className="py-5 px-4">
                           <span className="text-sm font-black text-white uppercase tracking-widest">{h.session_name}</span>
                        </td>
                        <td className="py-5 px-4">
                           <div className="flex items-center justify-center gap-2">
                              {h.members_count === state.total_count ? (
                                <span className="p-1 px-3 bg-green-500/20 text-green-500 border border-green-500/30 rounded-full text-[9px] font-black uppercase">Mission Success</span>
                              ) : (
                                <span className="p-1 px-3 bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 rounded-full text-[9px] font-black uppercase">Partial Entry</span>
                              )}
                           </div>
                        </td>
                        <td className="py-5 px-4 text-center">
                           <span className="text-xs font-black text-white">{h.members_count} / {state.total_count || 5}</span>
                        </td>
                        <td className="py-5 px-4 text-right">
                           <span className="text-[10px] text-arena-muted font-bold tracking-widest">{new Date(h.timestamp).toLocaleString()}</span>
                        </td>
                     </tr>
                   ))}
                   {history.length === 0 && (
                     <tr>
                        <td colSpan="4" className="py-20 text-center text-arena-muted uppercase text-xs tracking-widest italic opacity-50">Discovery Phase: No historical logs found.</td>
                     </tr>
                   )}
                </tbody>
             </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Attendance;
