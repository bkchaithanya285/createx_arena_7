import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, ArrowRight, ShieldAlert } from 'lucide-react';
import api from '../utils/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get('error') === 'session_invalidated') {
      setError('SESSION INVALIDATED: Logged in from another device/tab.');
    }
  }, [searchParams]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Sanitize input for mobile devices (auto-capitalization/spaces)
    const sanitizedUsername = username.trim();

    try {
      const res = await api.post('/auth/login', { 
        username: sanitizedUsername, 
        password 
      });
      const { token, role, user } = res.data;
      
      localStorage.setItem('arena_token', token);
      localStorage.setItem('arena_role', role);
      localStorage.setItem('arena_user', JSON.stringify(user));

      // Route based on role
      if (role === 'admin') navigate('/admin');
      else if (role === 'reviewer') navigate('/reviewer');
      else if (role === 'volunteer') navigate('/volunteer');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 selection:bg-arena-rose selection:text-white">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-arena-wine/20 rounded-full blur-[120px] animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-arena-rose/10 rounded-full blur-[120px] animate-pulse-slow pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-premium p-10 relative overflow-hidden">
          {/* Subtle top glow line */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-arena-rose to-transparent opacity-50" />
          
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-arena-wine/20 rounded-2xl flex items-center justify-center mb-6 shadow-wine-glow border border-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-arena-rose"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            <h1 className="text-4xl font-black text-white tracking-widest uppercase mb-2 text-glow">
              ARENA LOGIN
            </h1>
            <p className="text-arena-muted text-xs font-bold tracking-[0.3em] uppercase opacity-60">
              Innovation Zone Access
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-6">
              <div className="relative group">
                <User className="absolute left-0 top-3 w-5 h-5 text-arena-muted group-focus-within:text-arena-rose transition-colors" />
                <input
                  type="text"
                  placeholder="USERNAME / TEAM ID"
                  className="w-full bg-transparent border-b-2 border-white/10 py-3 pl-8 text-white focus:outline-none focus:border-arena-rose transition-all text-sm tracking-widest placeholder:text-white/20 font-bold"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-0 top-3 w-5 h-5 text-arena-muted group-focus-within:text-arena-rose transition-colors" />
                <input
                  type="password"
                  placeholder="PASSWORD / REG NO"
                  className="w-full bg-transparent border-b-2 border-white/10 py-3 pl-8 text-white focus:outline-none focus:border-arena-rose transition-all text-sm tracking-widest placeholder:text-white/20 font-bold"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`bg-arena-rose/10 border border-arena-rose/30 text-arena-rose text-[10px] font-black tracking-widest uppercase py-4 px-4 rounded-xl flex items-center gap-3 shadow-wine-glow mb-4 ${error.includes('INVALIDATED') ? 'bg-red-500/20 border-red-500/40 text-red-400' : ''}`}
                >
                  <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full glass-button group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center gap-3">
                {loading ? (
                  <span className="animate-spin text-white">⭮</span>
                ) : (
                  <>
                    ENTER ARENA <ArrowRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>

          <button
            onClick={() => navigate('/')}
            className="w-full mt-8 text-[10px] font-black text-arena-muted hover:text-white tracking-[.4em] uppercase transition-colors"
          >
            ← BACK TO HOME
          </button>
        </div>

        {/* System Status Indicator */}
        <div className="mt-8 flex items-center justify-center gap-4 py-3 px-6 glass-premium !bg-transparent !rounded-full opacity-60">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <span className="text-[10px] font-black text-white tracking-widest uppercase">
            System Live : Cluster Sync Active
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
