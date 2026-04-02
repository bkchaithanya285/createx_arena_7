import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, 
  Play, 
  Trophy, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import axios from 'axios';

const ColorCode = ({ onComplete }) => {
  const [sequence, setSequence] = useState([]);
  const [playerSequence, setPlayerSequence] = useState([]);
  const [level, setLevel] = useState(0);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [activeButton, setActiveButton] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const colors = [
    { id: 0, color: 'bg-red-500', shadow: 'shadow-red-500/50', border: 'border-red-500/30' },
    { id: 1, color: 'bg-blue-500', shadow: 'shadow-blue-500/50', border: 'border-blue-500/30' },
    { id: 2, color: 'bg-green-500', shadow: 'shadow-green-500/50', border: 'border-green-500/30' },
    { id: 3, color: 'bg-yellow-500', shadow: 'shadow-yellow-500/50', border: 'border-yellow-500/30' }
  ];

  const startGame = () => {
    setIsStarted(true);
    nextLevel([]);
  };

  const nextLevel = (currSeq) => {
    const newSeq = [...currSeq, Math.floor(Math.random() * 4)];
    setSequence(newSeq);
    setPlayerSequence([]);
    setLevel(newSeq.length);
    showSequence(newSeq);
  };

  const showSequence = async (seq) => {
    setIsShowingSequence(true);
    for (let i = 0; i < seq.length; i++) {
      await new Promise(r => setTimeout(r, 600));
      setActiveButton(seq[i]);
      await new Promise(r => setTimeout(r, 400));
      setActiveButton(null);
    }
    setIsShowingSequence(false);
  };

  const handleInput = (id) => {
    if (isShowingSequence || isGameOver || !isStarted) return;
    
    const newPlayerSeq = [...playerSequence, id];
    setPlayerSequence(newPlayerSeq);
    
    // Animate button tap
    setActiveButton(id);
    setTimeout(() => setActiveButton(null), 200);

    // Check correctness
    if (newPlayerSeq[newPlayerSeq.length - 1] !== sequence[newPlayerSeq.length - 1]) {
      setIsGameOver(true);
      const score = (level - 1) * 100;
      onComplete({ score });
      return;
    }

    // Check completion of sequence
    if (newPlayerSeq.length === sequence.length) {
      setTimeout(() => nextLevel(sequence), 1000);
    }
  };

  return (
    <div className="flex flex-col gap-10 items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="glass-card bg-white/5 px-8 py-3 rounded-2xl border-arena-rose/30 shadow-wine">
          <p className="text-[10px] uppercase font-black text-arena-muted tracking-[0.3em] mb-1">Level Reached</p>
          <p className="text-3xl font-black text-white wine-glow">{level}</p>
        </div>
      </div>

      {!isStarted && !isGameOver ? (
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={startGame}
          className="glass-button !px-12 !py-6 !text-2xl !rounded-full flex items-center gap-4"
        >
          <Play className="w-8 h-8 fill-white" /> START GAME
        </motion.button>
      ) : (
        <div className="grid grid-cols-2 gap-6 relative p-8 glass-card !rounded-[40px] border-white/5">
          {colors.map((c) => (
            <motion.button 
              key={c.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleInput(c.id)}
              disabled={isShowingSequence || isGameOver}
              className={`w-32 h-32 rounded-3xl border-4 transition-all duration-300
                ${c.color} ${c.border}
                ${activeButton === c.id ? `opacity-100 scale-110 ${c.shadow} brightness-125` : 'opacity-40'}
                ${isShowingSequence ? 'cursor-default' : 'cursor-pointer hover:opacity-100 hover:brightness-110'}
              `}
            />
          ))}
          
          <AnimatePresence>
            {isShowingSequence && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px] pointer-events-none"
              >
                <div className="bg-black/40 px-6 py-2 rounded-full border border-white/10 flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-arena-rose animate-spin" />
                  <span className="text-[10px] uppercase font-black tracking-widest text-arena-rose">Watch Closely</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="bg-arena-rose/5 p-4 rounded-xl flex items-center gap-3 border border-arena-rose/20">
        <Palette className="w-5 h-5 text-arena-rose" />
        <p className="text-[10px] uppercase font-black text-arena-muted tracking-widest">Repeat the system sequence with 100% precision</p>
      </div>

      {isGameOver && (
        <div className="text-center mt-4">
          <p className="text-red-500 font-bold uppercase tracking-widest animate-bounce">Sequence Broke! Final Level: {level - 1}</p>
        </div>
      )}
    </div>
  );
};

export default ColorCode;
