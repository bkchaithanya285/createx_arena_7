import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Send, 
  Image as ImageIcon, 
  Search, 
  Clock, 
  CheckCircle2, 
  Plus, 
  X,
  Loader2,
  Heart
} from 'lucide-react';
import api from '../utils/api';

const MemoryWall = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchWall();
  }, []);

  const fetchWall = async () => {
    setLoading(true);
    try {
      const res = await api.get('/memory-wall');
      setImages(res.data);
    } catch (err) {
      console.error('Failed to fetch memory wall:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('caption', caption);

    try {
      await api.post('/memory-wall/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowUpload(false);
      setCaption('');
      setSelectedFile(null);
      setPreview(null);
      fetchWall();
      alert("Memories uploaded! Awaiting Admin Approval.");
    } catch (err) {
      alert("Upload failed. Check file size/connection.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-10 flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-extrabold uppercase tracking-widest text-white wine-glow mb-2">Memory Wall</h2>
          <p className="text-arena-muted font-light tracking-wide uppercase italic tracking-[0.2em] flex items-center gap-2">
            Capturing the Spirit of the Innovation Arena
          </p>
        </div>
        
        <button 
          onClick={() => setShowUpload(true)}
          className="glass-button !py-4 !px-8 !rounded-2xl flex items-center gap-2 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          <span>Upload Memory</span>
        </button>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-arena-rose animate-spin" />
        </div>
      ) : images.length === 0 ? (
        <div className="h-96 glass-card flex flex-col items-center justify-center gap-6 border-white/5 opacity-40 italic">
          <ImageIcon className="w-12 h-12" />
          <p className="text-xs uppercase tracking-[0.3em] font-bold">The wall is currently blank. Be the first to capture a moment.</p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {images.map((img, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card !bg-white/5 p-4 flex flex-col gap-4 group relative overflow-hidden break-inside-avoid"
            >
              <div className="relative overflow-hidden rounded-xl h-fit">
                <img src={img.image_url} alt="Memory" className="w-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest text-white/50">
                  {img.team_id}
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-arena-rose uppercase tracking-widest">{img.team_name}</span>
                  <div className="flex items-center gap-1 text-white/20 hover:text-arena-rose transition-colors cursor-pointer">
                    <Heart className="w-3 h-3 fill-current" />
                  </div>
                </div>
                <p className="text-sm font-light text-arena-muted leading-relaxed tracking-wide italic">"{img.caption}"</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/50">
            <motion.form 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onSubmit={handleUpload}
              className="glass-card max-w-lg w-full p-10 flex flex-col gap-8 border-t-4 border-t-arena-rose shadow-wine"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black uppercase tracking-widest text-white">Upload New Memory</h3>
                <button 
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-arena-muted" />
                </button>
              </div>

              <div 
                onClick={() => document.getElementById('file-upload').click()}
                className="w-full h-64 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-arena-rose/50 transition-all overflow-hidden relative"
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="w-12 h-12 text-arena-rose" />
                    <p className="text-xs uppercase font-bold text-arena-muted tracking-widest">Select Image (Max 5MB)</p>
                  </>
                )}
                <input id="file-upload" type="file" hidden accept="image/*" onChange={handleFileChange} />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-arena-muted">Caption</label>
                <textarea 
                  required
                  placeholder="Express the moment..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-sm text-white focus:outline-none focus:border-arena-rose/50 transition-all placeholder:text-arena-muted/30"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
              </div>

              <button 
                type="submit"
                disabled={uploading || !selectedFile}
                className={`glass-button !py-4 !text-lg !rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all
                  ${uploading || !selectedFile ? 'opacity-20 cursor-not-allowed' : ''}
                `}
              >
                {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    Freeze Moment <Send className="w-5 h-5" />
                  </>
                )}
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MemoryWall;
