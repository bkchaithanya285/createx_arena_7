import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, CheckCircle, Loader2, Play, Users, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const PhotoCapture = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const fetchTeams = async () => {
      const res = await api.get('/admin/teams/monitoring');
      setTeams(Array.isArray(res.data) ? res.data : []);
    };
    fetchTeams();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('SECURITY BLOCK: Camera access requires a SECURE connection (HTTPS or localhost). If you are accessing via IP, please ensure the server is serving over HTTPS.');
      return;
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      console.error('Camera Error:', err);
      alert('Camera access denied. Please check your browser permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      setCapturedImage(canvas.toDataURL('image/jpeg'));
      stopCamera();
    }
  };

  const handleUpload = async () => {
    if (!selectedTeamId) return alert('Select a team first');
    setUploading(true);
    try {
      await api.post('/volunteer/upload-photo', {
        teamId: selectedTeamId,
        image: capturedImage
      });
      setSuccess(true);
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-10 flex flex-col gap-10 h-full">
      <div>
        <h2 className="text-4xl font-extrabold uppercase tracking-widest text-white wine-glow mb-2">Team Photo Capture</h2>
        <p className="text-arena-muted font-light tracking-wide uppercase italic">Capture moments for the Memory Wall</p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-10 items-start">
         <div className="flex-1 w-full max-w-2xl flex flex-col gap-6">
            <div className="glass-card aspect-video relative overflow-hidden bg-black flex items-center justify-center border-arena-rose/20">
               {!stream && !capturedImage && (
                 <div className="flex flex-col items-center gap-4">
                    <Camera className="w-12 h-12 text-arena-muted/30" />
                    <button onClick={startCamera} className="glass-button !py-3 flex items-center gap-2">
                       <Play className="w-4 h-4 text-arena-rose" /> Initialize Camera
                    </button>
                 </div>
               )}
               
               {stream && !capturedImage && (
                 <>
                   <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                   <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                      <button onClick={capturePhoto} className="w-16 h-16 rounded-full bg-white border-4 border-arena-rose/50 shadow-2xl flex items-center justify-center group active:scale-95 transition-all">
                         <div className="w-12 h-12 rounded-full bg-arena-rose group-hover:scale-90 transition-transform" />
                      </button>
                   </div>
                 </>
               )}

               {capturedImage && (
                 <img src={capturedImage} className="w-full h-full object-cover" alt="Captured" />
               )}

               {uploading && (
                 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-12 h-12 text-arena-rose animate-spin" />
                    <span className="text-xs font-black uppercase tracking-[0.4em] text-white">Uploading to Cloudinary...</span>
                 </div>
               )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {capturedImage && !success && (
              <div className="flex gap-4">
                <button onClick={() => { setCapturedImage(null); startCamera(); }} className="flex-1 py-4 glass-card text-arena-muted hover:text-white uppercase tracking-widest font-black text-xs flex items-center justify-center gap-3">
                  <RefreshCw className="w-4 h-4" /> Retake
                </button>
                <button onClick={handleUpload} className="flex-1 glass-button !py-4 flex items-center justify-center gap-3">
                  <ImageIcon className="w-5 h-5" /> Confirm & Upload
                </button>
              </div>
            )}

            {success && (
               <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-2xl flex flex-col items-center gap-4 text-green-500">
                  <CheckCircle className="w-12 h-12" />
                  <span className="text-sm font-black uppercase tracking-widest">Photo successfully mapped to {selectedTeamId}</span>
                  <button onClick={() => { setSuccess(false); setCapturedImage(null); }} className="mt-2 text-[10px] underline uppercase tracking-[0.2em] font-black">Capture Another</button>
               </div>
            )}
         </div>

         <div className="w-full lg:w-96 flex flex-col gap-6">
            <div className="glass-card p-8 flex flex-col gap-6 border-l-4 border-l-blue-500">
               <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-3">
                 <Users className="w-5 h-5 text-blue-500" /> Select Target Team
               </h3>
               <div className="flex flex-col gap-2">
                 <select 
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-blue-500 transition-all font-black text-xs uppercase"
                 >
                    <option value="" className="bg-black text-white">-- Select Team --</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id} className="bg-black text-white">{team.id} - {team.name}</option>
                    ))}
                 </select>
                 <p className="text-[10px] text-arena-muted mt-2 leading-relaxed italic">
                   Note: Photos are automatically scaled and optimized before storage.
                 </p>
               </div>
            </div>

            <div className="glass-card p-6 flex items-start gap-4">
               <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
               <p className="text-[10px] text-arena-muted leading-relaxed uppercase font-light">
                 Ensure the team is visible and the environment is well-lit for the memory wall gallery.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default PhotoCapture;
