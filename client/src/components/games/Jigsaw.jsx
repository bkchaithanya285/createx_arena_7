import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Puzzle, 
  Clock, 
  RotateCcw, 
  CheckCircle2, 
  ChevronRight,
  Maximize2
} from 'lucide-react';
import axios from 'axios';

const Jigsaw = ({ onComplete }) => {
  const [pieces, setPieces] = useState([]);
  const [shuffled, setShuffled] = useState([]);
  const [timer, setTimer] = useState(0);
  const [moves, setMoves] = useState(0);
  const [startTime] = useState(Date.now());
  const [isGameOver, setIsGameOver] = useState(false);
  const [dragging, setDragging] = useState(null);

  const GRID_SIZE = 4;
  const IMAGE_URL = `http://${window.location.hostname}:8080/assets/jigsaw/2500f734382a8c784bb7767bfeb68573.jpg.jpeg`;

  useEffect(() => {
    // Generate initial pieces
    const initial = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => ({
      id: i,
      pos: i,
      current: i,
    }));
    
    // Shuffle pieces (Fisher-Yates)
    const shuffledPieces = [...initial]
      .sort(() => Math.random() - 0.5)
      .map((p, i) => ({ ...p, current: i }));
    
    setPieces(initial);
    setShuffled(shuffledPieces);

    const interval = setInterval(() => {
      if (!isGameOver) setTimer(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isGameOver, startTime]);

  const handleDragStart = (e, index) => {
    setDragging(index);
  };

  const handleDrop = (e, targetIndex) => {
    if (dragging === null || dragging === targetIndex) return;
    
    const newShuffled = [...shuffled];
    const draggedPiece = newShuffled[dragging];
    newShuffled[dragging] = newShuffled[targetIndex];
    newShuffled[targetIndex] = draggedPiece;
    
    setShuffled(newShuffled);
    setMoves(m => m + 1);
    setDragging(null);

    // Check Win Condition
    const isWin = newShuffled.every((p, i) => p.pos === i);
    if (isWin) {
      setIsGameOver(true);
      const score = Math.floor((1000 / timer) + (500 / moves)) * 10;
      onComplete({ score, time_taken: timer, moves });
    }
  };

  return (
    <div className="flex flex-col gap-8 items-center">
      <div className="flex gap-10 bg-white/5 p-6 rounded-2xl border border-white/10">
        <Stat icon={<Clock className="w-4 h-4 text-arena-rose" />} label="Elapsed" value={`${timer}s`} />
        <div className="w-[1px] bg-white/10" />
        <Stat icon={<RotateCcw className="w-4 h-4 text-arena-rose" />} label="Moves" value={moves} />
      </div>

      <div className="grid grid-cols-4 gap-1 p-2 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden">
        {shuffled.map((piece, idx) => (
          <div 
            key={idx}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, idx)}
            className={`w-28 h-28 cursor-move border border-white/5 transition-all duration-300 relative group
              ${piece.pos === idx ? 'opacity-100' : 'opacity-80 hover:opacity-100'}
            `}
            style={{
              backgroundImage: `url(${IMAGE_URL})`,
              backgroundSize: '448px 448px', // 112px * 4
              backgroundPosition: `${-(piece.pos % GRID_SIZE) * 112}px ${-Math.floor(piece.pos / GRID_SIZE) * 112}px`,
            }}
          >
            <div className={`absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity ${piece.pos === idx ? 'opacity-20' : ''}`} />
            {piece.pos === idx && <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-green-500" />}
          </div>
        ))}
      </div>

      <div className="bg-arena-rose/5 border border-arena-rose/20 p-4 rounded-xl flex items-center gap-3">
        <Puzzle className="w-5 h-5 text-arena-rose" />
        <p className="text-[10px] uppercase font-black text-arena-muted tracking-widest">Rearrange tiles to reconstruct the image</p>
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

export default Jigsaw;
