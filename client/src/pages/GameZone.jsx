import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gamepad2, 
  RotateCcw, 
  Puzzle, 
  Palette, 
  Lock as LockIcon, 
  CheckCircle2, 
  XCircle,
  Trophy,
  ArrowRight,
  Loader2,
  ChevronLeft,
  Brain,
  Clock,
  AlertCircle,
  ChevronRight,
  Play,
  RefreshCw,
  Star,
  Info,
  Target,
  Zap,
  Search as SearchIcon
} from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../utils/api';

// Games
import MemoryFlip from '../components/games/MemoryFlip';
import Jigsaw from '../components/games/Jigsaw';
import ColorCode from '../components/games/ColorCode';

const GameZone = () => {
  const [activeGame, setActiveGame] = useState(null); // 'flip', 'jigsaw', 'color'
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    fetchGameStatus();
    
    // Real-time Lock/Unlock Listener
    const handleGameChange = (status) => {
      setIsUnlocked(status);
      if (!status) setActiveGame(null); // Force close active game on lock
    };
    
    const socket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080');
    socket.on('game_zone_changed', handleGameChange);
    
    return () => {
      socket.off('game_zone_changed', handleGameChange);
      socket.disconnect();
    };
  }, []);

  const fetchGameStatus = async () => {
    try {
      const res = await api.get('/teams/me/games');
      setScores(res.data.scores);
      setIsUnlocked(res.data.unlocked);
    } catch (err) {
      console.error('Failed to fetch game status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGameComplete = async (gameKey, result) => {
    try {
      await api.post('/teams/me/games/submit', {
        game_name: gameKey,
        ...result
      });
      
      setScores(prev => ({ ...prev, [gameKey]: { ...result, completed: true } }));
      setActiveGame(null);
      alert(`${gameKey.replace('_', ' ').toUpperCase()} Completed! Score: ${result.score}`);
    } catch (err) {
      alert("Failed to save score. Check connection.");
    }
  };

  const games = [
    { 
      key: 'memory_flip', 
      name: 'Memory Flip', 
      icon: <RotateCcw className="w-8 h-8" />, 
      desc: 'Match all pairs of holographic cards.', 
      component: MemoryFlip,
      accent: 'border-blue-500'
    },
    { 
      key: 'jigsaw_puzzle', 
      name: 'Jigsaw Puzzle', 
      icon: <Puzzle className="w-8 h-8" />, 
      desc: 'Reconstruct the 4x4 image matrix.', 
      component: Jigsaw,
      accent: 'border-purple-500'
    },
    { 
      key: 'color_code', 
      name: 'Color Code', 
      icon: <Palette className="w-8 h-8" />, 
      desc: 'Mirror the system color sequence.', 
      component: ColorCode,
      accent: 'border-yellow-500'
    }
  ];

  if (activeGame) {
    const game = games.find(g => g.key === activeGame);
    return (
      <div className="p-10 flex flex-col gap-10 items-center">
        <div className="w-full flex justify-between items-center">
          <button 
            onClick={() => setActiveGame(null)}
            className="flex items-center gap-2 text-arena-muted hover:text-white transition-colors uppercase font-bold text-xs tracking-widest"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Game Hub
          </button>
          <div className="text-center">
            <h2 className="text-2xl font-black uppercase tracking-widest text-white wine-glow">{game.name}</h2>
            <p className="text-[10px] text-arena-rose/50 uppercase font-black tracking-widest italic">Live Attempt: One Entry Only</p>
          </div>
          <div className="w-24" /> {/* Spacer */}
        </div>
        
        <div className="flex-1 w-full max-w-5xl glass-card p-12 flex flex-col items-center justify-center">
          <game.component onComplete={(res) => handleGameComplete(game.key, res)} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-extrabold uppercase tracking-widest text-white wine-glow mb-2">Game Zone</h2>
          <p className="text-arena-muted font-light tracking-wide uppercase italic tracking-[0.2em] flex items-center gap-2">
            {!isUnlocked ? <LockIcon className="w-4 h-4 text-arena-rose" /> : <Gamepad2 className="w-4 h-4 text-green-500" />}
            {!isUnlocked ? 'LOCKED BY ADMIN' : 'CHALLENGES UNLOCKED'}
          </p>
        </div>
      </div>

      {!isUnlocked ? (
        <div className="h-96 flex flex-col items-center justify-center gap-6 glass-card border-arena-rose/20">
          <div className="w-24 h-24 bg-arena-rose/10 rounded-full flex items-center justify-center text-arena-rose animate-pulse shadow-wine">
            <LockIcon className="w-10 h-10" />
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold uppercase tracking-widest text-white mb-2">Game Hub Offline</h3>
            <p className="text-arena-muted uppercase tracking-[0.2em] font-light text-xs">Waiting for Admin to initialize entertainment modules</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {games.map((g) => {
            const isCompleted = scores[g.key]?.completed;
            const score = scores[g.key]?.score;

            return (
              <motion.div 
                key={g.key}
                whileHover={!isCompleted ? { y: -5 } : {}}
                className={`glass-card p-10 flex flex-col gap-8 transition-all duration-500 border-l-4 ${g.accent}
                  ${isCompleted ? 'opacity-60 grayscale-[0.5]' : 'hover:border-l-arena-rose'}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-4 bg-white/5 rounded-2xl ${isCompleted ? 'text-green-500' : 'text-arena-rose'}`}>
                    {g.icon}
                  </div>
                  {isCompleted && (
                    <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1 rounded-full text-green-500">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Completed</span>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-2xl font-black uppercase tracking-widest text-white mb-2 group-hover:text-arena-rose">{g.name}</h4>
                  <p className="text-arena-muted font-light leading-relaxed text-sm">{g.desc}</p>
                </div>

                <div className="divider" />

                <div className="flex items-center justify-between mt-auto">
                  {isCompleted ? (
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-arena-muted uppercase tracking-widest">Score Persisted</span>
                      <span className="text-2xl font-black text-white wine-glow tracking-widest">{score}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-arena-muted uppercase tracking-widest">One Attempt Only</span>
                  )}
                  
                  {!isCompleted && (
                    <button 
                      onClick={() => setActiveGame(g.key)}
                      className="glass-button !py-3 !px-6 !text-xs !rounded-xl group flex items-center gap-2"
                    >
                      Play Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="bg-white/5 p-6 rounded-2xl flex items-start gap-4 border border-white/5">
        <Trophy className="w-6 h-6 text-yellow-500 mt-1" />
        <div>
          <h5 className="text-sm font-bold uppercase tracking-widest text-white">Elite Competition Protocol</h5>
          <p className="text-[10px] leading-relaxed text-arena-muted font-normal uppercase tracking-tight italic mt-1">
            Scores are normalized based on time and accuracy. Once an attempt is initialized, it cannot be restarted. Refreshing the browser will automatically submit a Zero score. Proceed with focus.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GameZone;
