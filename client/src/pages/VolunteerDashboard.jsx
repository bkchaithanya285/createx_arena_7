import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, CheckCircle2, ShieldCheck, PlayCircle, AlertTriangle, Clock, Camera } from 'lucide-react';
import api from '../utils/api';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const VolunteerDashboard = () => {
  const [volunteer] = useState(JSON.parse(localStorage.getItem('arena_user')) || {});
  const [stats, setStats] = useState({ total_teams: 0, present: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/volunteer/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="p-10 flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-extrabold uppercase tracking-widest text-white wine-glow mb-2">Volunteer Portal</h2>
          <p className="text-arena-muted font-light tracking-wide uppercase italic">
            {volunteer.name} • ID: {volunteer.id}
          </p>
        </div>
        <div className="glass-card !bg-blue-500/10 border-blue-500/20 px-6 py-2 flex items-center gap-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">System Live • Monitoring Active</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard label="Total Teams" value={stats.assigned} icon={<Users className="w-5 h-5" />} />
        <SummaryCard label="Attendance Logged" value={stats.scanned} icon={<Clock className="w-5 h-5" />} color="text-yellow-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Status Panel */}
        <div className="lg:col-span-2 flex flex-col gap-6">
           <div className="glass-card p-8 flex flex-col gap-6 border-l-4 border-l-arena-rose">
              <div className="flex items-center gap-4">
                <AlertTriangle className="w-6 h-6 text-arena-rose" />
                <h3 className="text-xl font-black uppercase tracking-widest text-white">Pending Actions</h3>
              </div>
              
              <div className="flex flex-col gap-4">
                {stats.assigned - stats.scanned > 0 && (
                  <StatusItem 
                    label="Teams pending attendance" 
                    count={stats.assigned - stats.scanned} 
                    type="warning"
                  />
                )}
                {stats.assigned - stats.scanned === 0 && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 font-bold uppercase tracking-widest text-xs flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4" /> All Assigned Tasks Completed
                  </div>
                )}
              </div>
           </div>

            <div className="glass-card p-8 flex flex-col gap-4">
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-arena-muted">Quick Access</h4>
              <div className="grid grid-cols-2 gap-4">
                 <button 
                  onClick={() => navigate('/volunteer/scan')}
                  className="p-4 glass-card hover:bg-white/5 transition-colors flex flex-col items-center gap-3 text-center group"
                 >
                    <PlayCircle className="w-6 h-6 text-arena-rose group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Live Scanner</span>
                 </button>
                 <button 
                  onClick={() => navigate('/volunteer/photos')}
                  className="p-4 glass-card hover:bg-white/5 transition-colors flex flex-col items-center gap-3 text-center group"
                 >
                    <Camera className="w-6 h-6 text-green-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Photos</span>
                 </button>
              </div>
            </div>
        </div>

        {/* Small Log/Activity */}
        <div className="glass-card p-8 flex flex-col gap-6">
           <h3 className="text-lg font-black uppercase tracking-widest text-white">Activity Log</h3>
           <div className="flex flex-col gap-4">
              <div className="flex gap-4 items-start">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                 <p className="text-xs text-arena-muted leading-relaxed font-light">Internal monitoring session initialized for {stats.assigned} clusters.</p>
              </div>
              <div className="flex gap-4 items-start">
                 <div className="w-1.5 h-1.5 rounded-full bg-arena-rose mt-1.5 flex-shrink-0" />
                 <p className="text-xs text-arena-muted leading-relaxed font-light font-bold text-white">ADMIN BROADCAST:</p>
              </div>
              <p className="text-[10px] uppercase font-black text-arena-rose tracking-widest bg-arena-rose/10 p-4 rounded-xl border border-arena-rose/20 leading-loose">
                 "ALL VOLUNTEERS: Please verify PPTs specifically for Round 1 immediately as teams arrive."
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value, icon, color }) => (
  <div className="glass-card p-6 flex items-center justify-between group hover:border-arena-rose/30 transition-all">
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-arena-muted">{label}</span>
      <span className={`text-3xl font-black uppercase tracking-widest ${color || 'text-white'}`}>{value}</span>
    </div>
    <div className="p-4 bg-white/5 rounded-2xl text-arena-rose group-hover:scale-110 transition-transform duration-500">
      {icon}
    </div>
  </div>
);

const StatusItem = ({ label, count, type }) => {
  const colors = {
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
    danger: 'bg-red-500/10 border-red-500/20 text-red-500'
  };

  return (
    <div className={`p-4 border rounded-xl flex items-center justify-between ${colors[type]}`}>
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      <span className="text-xl font-black">{count}</span>
    </div>
  );
};

export default VolunteerDashboard;
