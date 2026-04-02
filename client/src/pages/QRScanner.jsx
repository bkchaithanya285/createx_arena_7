import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Play, Trophy, Users, Clock, AlertTriangle, ShieldCheck, CheckCircle2, XCircle, Search as SearchIcon, Star, Target, Zap, Lock as LockIcon, User as UserIcon } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import socket from '../utils/socket';
import api from '../utils/api';

const QRScanner = () => {
  const [step, setStep] = useState(1); // 1: Scan, 2: Members, 3: Success
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [activeSession, setActiveSession] = useState('');
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  const [activeCameraId, setActiveCameraId] = useState(null);
  const [scannedTeam, setScannedTeam] = useState(null);
  const [presentMembers, setPresentMembers] = useState([]);
  const scannerRef = useRef(null);

  const fetchSessionStatus = async () => {
    try {
      const { data } = await api.get('/teams/dashboard-state');
      setIsSessionOpen(data.attendance_open === true || String(data.attendance_open) === 'true');
      setActiveSession(data.active_session || 'No Session');
    } catch (err) {}
  };

  useEffect(() => {
    fetchSessionStatus();

    socket.on('attendance_session_changed', ({ sessionName, status }) => {
      setIsSessionOpen(status);
      setActiveSession(sessionName);
      if (!status) stopScanner();
    });

    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        setCameras(devices);
        const backCam = devices.find(c => c.label.toLowerCase().includes('back'));
        setActiveCameraId(backCam ? backCam.id : devices[0].id);
      }
    }).catch(err => setError('Camera access denied.'));

    const onReset = () => {
      setStep(1);
      setScannedTeam(null);
      setPresentMembers([]);
      setScanning(false);
      stopScanner();
    };

    socket.on('attendance_reset', onReset);
    socket.on('all_reset', onReset);

    return () => {
      stopScanner();
      socket.off('attendance_reset');
      socket.off('all_reset');
      socket.off('attendance_session_changed');
    };
  }, []);

  const switchCamera = async () => {
    if (cameras.length < 2) return;
    const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextId = cameras[nextIndex].id;
    
    await stopScanner();
    setActiveCameraId(nextId);
    // Auto-restart if we were scanning
    // setTimeout to give hardware a split second to release
    if (scanning) setTimeout(() => startScanner(nextId), 300);
  };

  const startScanner = async (cid = activeCameraId) => {
    if (!cid || !isSessionOpen) return;
    setError('');
    setScanning(true);
    try {
      if (!scannerRef.current) scannerRef.current = new Html5Qrcode('qr-reader');
      await scannerRef.current.start(cid, { fps: 10, qrbox: { width: 250, height: 250 } }, onScanSuccess, () => {});
    } catch (err) { 
      setError('Could not start camera.'); 
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
    }
    setScanning(false);
  };

  const onScanSuccess = async (decodedText) => {
    await stopScanner();
    setLoading(true);
    try {
      let teamId = decodedText;
      if (decodedText.startsWith('{')) {
        const parsed = JSON.parse(decodedText);
        teamId = parsed.team_id || parsed.id;
      }

      // Fetch latest assigned teams to ensure member lists are accurate
      const res = await api.get('/volunteer/assigned-teams');
      const team = res.data.find(t => t.id === teamId);
      
      if (!team) throw new Error('Squad not assigned to you or invalid artifact.');

      setScannedTeam(team);
      const memberList = Array.isArray(team.members) ? team.members : [];
      setPresentMembers(memberList.map(m => m.regNo || m.reg_no)); 
      setStep(2);
    } catch (err) {
      setError(err.message || 'Invalid Scan Artifact');
      setTimeout(() => { setError(''); startScanner(); }, 3000);
    } finally { setLoading(false); }
  };

  const submitAttendance = async () => {
    setLoading(true);
    try {
      const memberList = Array.isArray(scannedTeam.members) ? scannedTeam.members : [];
      const marked = memberList.filter(m => presentMembers.includes(m.regNo || m.reg_no));
      
      await api.post('/volunteer/mark-attendance', { 
        teamId: scannedTeam.id,
        presentMembers: marked.map(m => ({ regNo: m.regNo || m.reg_no, name: m.name }))
      });
      
      socket.emit('attendance_marked', { teamId: scannedTeam.id });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Uplink Failed');
    } finally { setLoading(false); }
  };

  const toggleMember = (reg) => {
    setPresentMembers(prev => prev.includes(reg) ? prev.filter(r => r !== reg) : [...prev, reg]);
  };

  if (!isSessionOpen) {
    return (
      <div className="min-h-screen bg-arena-bg flex items-center justify-center p-6">
         <motion.div 
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="glass-premium p-12 rounded-[2rem] border border-red-500/30 text-center flex flex-col items-center gap-8 max-w-lg shadow-[0_0_50px_rgba(239,68,68,0.1)]"
         >
            <div className="relative">
               <ShieldAlert className="w-24 h-24 text-red-500" />
               <motion.div 
                 animate={{ opacity: [0.2, 0.5, 0.2] }}
                 transition={{ repeat: Infinity, duration: 2 }}
                 className="absolute inset-0 bg-red-500 blur-3xl -z-10" 
               />
            </div>
            <div>
               <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Scanner Locked</h2>
               <p className="text-red-400 font-bold uppercase text-[10px] tracking-[0.3em]">Mission Status: Standby</p>
            </div>
            <p className="text-arena-muted text-xs leading-relaxed uppercase font-black opacity-60 tracking-widest italic">
               Attendance gates are currently CLOSED. Check back when Central Command initializes a new mission session.
            </p>
            <button 
              onClick={fetchSessionStatus}
              className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase hover:bg-white/10 transition-all flex items-center gap-3"
            >
               <RefreshCw className="w-4 h-4" /> Check for Mission Start
            </button>
         </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 flex flex-col gap-10 h-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter wine-glow">Mission Scanner</h2>
          <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.2em]">{activeSession}</span>
        </div>
        {step === 1 && scanning && cameras.length > 1 && (
          <button onClick={switchCamera} className="glass-button !py-3 flex items-center gap-2 text-xs"><RefreshCw className="w-4 h-4" /> Flip Radar</button>
        )}
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        {step === 1 && (
          <div className="glass-card p-10 flex flex-col items-center justify-center w-full max-w-lg gap-8 border-arena-rose/30 relative">
             {!isSessionOpen ? (
                <div className="flex flex-col items-center gap-6 py-10">
                   <ShieldAlert className="w-20 h-20 text-red-500 opacity-50" />
                   <div className="text-center space-y-2">
                      <h3 className="text-2xl font-black text-white uppercase">Sector Locked</h3>
                      <p className="text-arena-muted text-xs uppercase tracking-widest">Administrator has closed this session.</p>
                   </div>
                </div>
             ) : (
                <>
                   <div id="qr-reader" className={`w-full bg-black rounded-xl overflow-hidden ${scanning ? 'min-h-[350px]' : 'h-0'}`} />
                   {!scanning && !loading && <div className="w-56 h-56 border-4 border-dashed border-arena-rose/50 rounded-xl flex items-center justify-center animate-pulse-slow"><Camera className="w-12 h-12 text-arena-rose/50" /></div>}
                   {loading && <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm bg-black/50 rounded-xl"><Loader2 className="w-12 h-12 text-arena-rose animate-spin" /></div>}
                   {error && <div className="w-full p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3 font-medium"><ShieldAlert className="w-5 h-5 flex-shrink-0" /> {error}</div>}
                   {!scanning ? <button onClick={() => startScanner()} className="glass-button w-full flex items-center justify-center gap-3 !py-5 text-lg"><Play className="w-6 h-6" /> Open Radar</button> : <button onClick={stopScanner} className="w-full py-5 rounded-xl bg-red-500/10 text-red-500 font-bold uppercase tracking-widest">Stop</button>}
                </>
             )}
          </div>
        )}

        {step === 2 && scannedTeam && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-10 max-w-lg w-full flex flex-col gap-8 border-blue-500/30">
            <div className="flex flex-col gap-1">
               <span className="text-arena-rose text-[10px] font-black uppercase tracking-[0.4em]">{scannedTeam.id}</span>
               <h3 className="text-2xl font-black uppercase tracking-widest text-white">{scannedTeam.name}</h3>
            </div>
            
            <div className="flex flex-col gap-3">
               <p className="text-xs font-bold text-arena-muted uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                 <Users className="w-4 h-4" /> Select Present Members:
               </p>
               {(typeof scannedTeam.members === 'string' ? JSON.parse(scannedTeam.members || '[]') : (scannedTeam.members || [])).map((member, idx) => {
                 const reg = member.regNo || member;
                 return (
                   <button 
                    key={idx} 
                    onClick={() => toggleMember(reg)}
                    className={`p-4 rounded-xl border flex items-center justify-between transition-all ${presentMembers.includes(reg) ? 'border-green-500/50 bg-green-500/10 text-white' : 'border-white/5 text-arena-muted hover:bg-white/5'}`}
                   >
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-[10px] font-black text-white">{member.name || `Member ${idx + 1}`}</span>
                        <span className="text-[9px] font-bold font-mono opacity-50 uppercase tracking-tighter">{reg}</span>
                      </div>
                      {presentMembers.includes(reg) && <UserCheck className="w-4 h-4 text-green-500" />}
                   </button>
                 );
               })}
            </div>

            <button onClick={submitAttendance} disabled={loading} className="glass-button w-full !py-5 flex items-center justify-center gap-3 mt-4">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Log Attendance'}
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <div className="glass-card p-10 flex flex-col items-center justify-center max-w-lg w-full gap-8 border-green-500/30">
            <CheckCircle className="w-24 h-24 text-green-500 animate-bounce" />
            <h3 className="text-3xl font-black uppercase tracking-widest text-white text-center">{scannedTeam?.id} <br/><span className="text-green-500 text-xl">Attendance Confirmed</span></h3>
            <button onClick={() => setStep(1)} className="mt-6 w-full py-5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-3"><QrCode className="w-6 h-6" /> Next Team</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
