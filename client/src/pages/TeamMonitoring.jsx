import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Search as SearchIcon, 
  Loader2,
  FileText,
  UserPlus
} from 'lucide-react';
import api from '../utils/api';
import axios from 'axios';

const TeamMonitoring = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchTeams = async () => {
    try {
      const res = await api.get('/volunteer/assigned-teams');
      setTeams(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
    const interval = setInterval(fetchTeams, 30000); // 30s auto refresh
    return () => clearInterval(interval);
  }, []);

  const filteredTeams = teams.filter(t => 
    t.id.toLowerCase().includes(search.toLowerCase()) || 
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-10 flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-extrabold uppercase tracking-widest text-white wine-glow mb-2">Team Monitoring</h2>
          <p className="text-arena-muted font-light tracking-wide uppercase italic text-xs flex items-center gap-2">
            <Activity className="w-3 h-3 text-arena-rose animate-pulse" /> Real-time active engagement tracking
          </p>
        </div>
        
        <div className="relative group w-96">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-arena-muted" />
          <input
            type="text"
            placeholder="Quick search team..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-arena-rose/50 transition-all text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {loading ? (
          <div className="col-span-full h-64 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-arena-rose" /></div>
        ) : filteredTeams.length === 0 ? (
          <div className="col-span-full h-64 flex items-center justify-center text-arena-muted uppercase font-black">No teams active</div>
        ) : (
          filteredTeams.map((team) => (
             <motion.div 
              key={team.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-6 border-l-2 border-l-arena-rose/30 flex flex-col gap-6"
             >
                <div className="flex items-center justify-between">
                   <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{team.id}</span>
                      <h3 className="text-lg font-bold uppercase tracking-widest text-arena-muted">{team.name}</h3>
                   </div>
                   <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${team.attendance_status === 'Updated' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {team.attendance_status === 'Updated' ? 'Active' : 'Missing'}
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                   <Indicator 
                    label="Problem" 
                    status={team.problem_id ? 'Selected' : 'Pending'} 
                    type={team.problem_id ? 'success' : 'muted'} 
                    icon={<AlertCircle className="w-3 h-3" />}
                   />
                   <Indicator 
                    label="PPT Status" 
                    status={team.ppt_status} 
                    type={team.ppt_status === 'Verified' ? 'success' : team.ppt_status === 'Uploaded' ? 'info' : 'muted'} 
                    icon={<FileText className="w-3 h-3" />}
                   />
                   <Indicator 
                    label="Attendance" 
                    status={team.attendance_status === 'Updated' ? 'Updated' : 'Pending'} 
                    type={team.attendance_status === 'Updated' ? 'success' : 'warning'} 
                    icon={<UserPlus className="w-3 h-3" />}
                   />
                </div>

                <div className="flex gap-4 pt-4 border-t border-white/5 items-center justify-between">
                  {team.problem_id && (
                    <p className="text-[9px] font-bold text-white uppercase tracking-widest truncate max-w-[150px]">
                      {team.problem_id} - CHALLENGE
                    </p>
                  )}
                  <div className="flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-arena-rose animate-ping" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-arena-rose">Live Tracker</span>
                  </div>
                </div>
             </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

const Indicator = ({ label, status, type, icon }) => {
  const colors = {
    success: 'text-green-500 border-green-500/20 bg-green-500/5',
    info: 'text-blue-500 border-blue-500/20 bg-blue-500/5',
    warning: 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5',
    muted: 'text-arena-muted border-white/5 bg-white/5'
  };
  return (
    <div className={`p-3 rounded-xl border flex flex-col gap-2 ${colors[type]}`}>
       <div className="flex items-center justify-between opacity-60">
          <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
          {icon}
       </div>
       <span className="text-[10px] font-black uppercase tracking-widest truncate">{status}</span>
    </div>
  );
};

export default TeamMonitoring;
