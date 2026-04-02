import React, { useState, useEffect } from 'react';
import { Bell, Info, AlertTriangle } from 'lucide-react';
import api from '../utils/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, listen to socket.io or fetch from DB
    // For now, setting mock data to fulfill functionality immediately
    setNotifications([
      { id: 1, type: 'info', title: 'System Online', message: 'The Arena is now live. Good luck teams!', time: '10 mins ago' },
      { id: 2, type: 'alert', title: 'Problem Selection Warning', message: 'Do not refresh the page during selection lock buffer.', time: '15 mins ago' }
    ]);
    setLoading(false);
  }, []);

  return (
    <div className="p-10 flex flex-col gap-10">
      <div className="flex items-center gap-4">
        <Bell className="w-8 h-8 text-arena-rose" />
        <h2 className="text-4xl font-extrabold uppercase tracking-widest text-white wine-glow">Notifications</h2>
      </div>

      <div className="flex flex-col gap-6">
        {loading ? (
          <p className="text-arena-muted">Loading broadcasts...</p>
        ) : notifications.length > 0 ? (
          notifications.map(note => (
            <div key={note.id} className={`glass-card p-6 flex items-start gap-4 border-l-4 ${note.type === 'alert' ? 'border-l-arena-rose' : 'border-l-blue-500'}`}>
               <div className={`p-3 rounded-xl ${note.type === 'alert' ? 'bg-arena-rose/20 text-arena-rose' : 'bg-blue-500/20 text-blue-500'}`}>
                 {note.type === 'alert' ? <AlertTriangle className="w-6 h-6" /> : <Info className="w-6 h-6" />}
               </div>
               <div className="flex-1">
                 <h4 className="text-lg font-bold text-white uppercase tracking-widest">{note.title}</h4>
                 <p className="text-sm text-arena-muted mt-2">{note.message}</p>
                 <p className="text-[10px] text-arena-muted mt-4 font-black tracking-widest uppercase">{note.time}</p>
               </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 text-arena-muted glass-card">
            No active alerts in the Arena.
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
