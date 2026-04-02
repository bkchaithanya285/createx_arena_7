import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gamepad2, 
  Clock, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  Trophy,
  Loader2,
  ChevronRight
} from 'lucide-react';
import axios from 'axios';

const MemoryFlip = ({ onComplete }) => {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [solved, setSolved] = useState([]);
  const [moves, setMoves] = useState(0);
  const [startTime] = useState(Date.now());
  const [timer, setTimer] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  // Card photos from local assets (3 Pairs = 6 Cards)
  const photos = [
    'stark.png',
    'shield.png',
    'hammer.png'
  ];
  
  useEffect(() => {
    const deck = [...photos, ...photos]
      .sort(() => Math.random() - 0.5)
      .map((img, idx) => ({ id: idx, img }));
    setCards(deck);

    const interval = setInterval(() => {
      if (!isGameOver) setTimer(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isGameOver, startTime]);

  useEffect(() => {
    if (solved.length === photos.length * 2 && cards.length > 0) {
      setIsGameOver(true);
      const score = Math.max(10, Math.floor((1000 / timer) + (500 / moves)) * 10);
      onComplete({ score, time_taken: timer, moves });
    }
  }, [solved, timer, moves, onComplete, photos.length, cards.length]);

  const handleFlip = (id) => {
    if (flipped.length === 2 || flipped.includes(id) || solved.includes(id)) return;
    
    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;
      if (cards[first].img === cards[second].img) {
        setSolved([...solved, first, second]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  return (
    <div className="flex flex-col gap-8 items-center">
      <div className="flex gap-10 bg-white/5 p-6 rounded-2xl border border-white/10">
        <Stat icon={<Clock className="w-4 h-4 text-arena-rose" />} label="Time" value={`${timer}s`} />
        <div className="w-[1px] bg-white/10" />
        <Stat icon={<RotateCcw className="w-4 h-4 text-arena-rose" />} label="Moves" value={moves} />
      </div>

      <div className="grid grid-cols-4 gap-4">
        {cards.map((card) => (
          <motion.div 
            key={card.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleFlip(card.id)}
            className={`w-24 h-32 rounded-xl cursor-pointer perspective-1000 transition-all duration-500
              ${flipped.includes(card.id) || solved.includes(card.id) ? 'rotate-y-180' : ''}
            `}
          >
            <div className={`relative w-full h-full text-center transition-transform duration-500 preserve-3d
              ${flipped.includes(card.id) || solved.includes(card.id) ? 'rotate-y-180' : ''}
            `}>
              {/* Front (Hidden) */}
              <div className="absolute w-full h-full backface-hidden glass-card bg-arena-wine !border-arena-rose/30 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-white/10" />
              </div>
              {/* Back (Image) */}
              <div className="absolute w-full h-full backface-hidden rotate-y-180 glass-card p-0 flex items-center justify-center overflow-hidden border-arena-rose/50">
                <img 
                  src={`/assets/memory-flip/${card.img}`} 
                  alt="card" 
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const Stat = ({ icon, label, value }) => (
  <div className="flex items-center gap-3">
    {icon}
    <div>
      <p className="text-[8px] uppercase font-black text-arena-muted tracking-widest">{label}</p>
      <p className="text-xl font-black text-white">{value}</p>
    </div>
  </div>
);

export default MemoryFlip;
