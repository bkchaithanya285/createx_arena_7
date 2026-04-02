import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Lock, 
  AlertCircle, 
  Search, 
  ShieldAlert,
  Loader2,
  ChevronRight
} from 'lucide-react';
import api from '../utils/api';
import socket from '../utils/socket';
import { formatTime } from '../utils/time';

const ProblemSelection = () => {
  const [problems, setProblems] = useState([]);
  const [team, setTeam] = useState(JSON.parse(localStorage.getItem('arena_user')) || {});
  const [problemsState, setProblemsState] = useState({ released: false, enabled: false });
  const [loading, setLoading] = useState(true);
  const [targetTime, setTargetTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null); // Changed from 0 to null to prevent split-second skip
  const [selectingId, setSelectingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/problems');
        setProblems(res.data);

        // SYNC CHECK: Ensure team has cluster (required for new atomic logic)
        if (!team.cluster) {
           setError('SESSION_OUTDATED: Please Logout and Login again to refresh your session permissions.');
           setLoading(false);
           return;
        }

        const st = await api.get('/teams/dashboard-state');
        setProblemsState(st.data);
        
        // SYNC CHECK: Force localized team profile to match server's problem assignment
        if (st.data.problem_id !== team.problem_id) {
           const updatedTeam = { ...team, problem_id: st.data.problem_id };
           localStorage.setItem('arena_user', JSON.stringify(updatedTeam));
           setTeam(updatedTeam);
        }

        if (st.data.end_time) {
          setTargetTime(st.data.end_time);
        }
      } catch (err) {
        setError('Failed to load problem statements.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    socket.on('selection_state_changed', (newState) => {
       setProblemsState(newState);
       if (newState.end_time) setTargetTime(newState.end_time);
    });

    socket.on('problem_reset', () => {
       const updatedTeam = { ...team, problem_id: null };
       localStorage.setItem('arena_user', JSON.stringify(updatedTeam));
       setTeam(updatedTeam);
    });

    socket.on('all_reset', () => {
       window.location.reload(); 
    });

    return () => {
      socket.off('problem_selected');
      socket.off('problem_reset');
      socket.off('all_reset');
    };
  }, []);

  // One Single Global Timer for all 40+ cards
  useEffect(() => {
    const ticker = setInterval(() => {
      if (targetTime) {
        setTimeLeft(Math.max(0, Math.floor((targetTime - Date.now()) / 1000)));
      }
    }, 1000);
    return () => clearInterval(ticker);
  }, [targetTime]); // Dependency on targetTime

  const handleSelect = async (problemId) => {
    setSelectingId(problemId);
    setError('');
    
    try {
      const res = await api.post('/problems/select', { selectedProblemId: problemId });
      
      // Success! Update local storage so other components know we are done
      const updatedUser = { ...team, problem_id: problemId };
      localStorage.setItem('arena_user', JSON.stringify(updatedUser));
      setTeam(updatedUser);
      
      // Also update the problems list to show the new count for this problem
      setProblems(prev => prev.map(p => {
        if (p.id === problemId) {
          const clusters = [...(p.taken_clusters || [])];
          if (!clusters.includes(team.cluster)) clusters.push(team.cluster);
          return { ...p, taken_clusters: clusters, taken_count: clusters.length };
        }
        return p;
      }));

      setConfirmId(null);
      // Optional: small delay before showing success state if needed, 
      // but the UI will auto-re-render because team.problem_id changed.
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Selection failed. Please try again.';
      setError(errorMsg);
      
      // If the error is 'Already assigned', we should probably sync our state
      if (errorMsg.includes('already has') || errorMsg.includes('already assigned')) {
         // Re-fetch user or dashboard state to sync
         const st = await api.get('/teams/dashboard-state');
         // If they actually have a problem now, update local
         if (st.data.problem_id) {
            const syncedUser = { ...team, problem_id: st.data.problem_id };
            localStorage.setItem('arena_user', JSON.stringify(syncedUser));
            setTeam(syncedUser);
         }
      }
      setConfirmId(null);
    } finally {
      setSelectingId(null);
    }
  };

  const filteredProblems = problems.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  // PHASE 0: NOT RELEASED
  if (!problemsState.released && !loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-10 text-center gap-8 animate-in fade-in zoom-in duration-700">
        <div className="w-32 h-32 bg-arena-rose/10 rounded-3xl flex items-center justify-center shadow-wine-glow border border-arena-rose/20 animate-pulse-slow">
          <Lock className="w-16 h-16 text-arena-rose" />
        </div>
        <div className="space-y-4">
          <h2 className="text-5xl font-black text-white tracking-[0.2em] uppercase text-glow">Secure Mission Vault</h2>
          <p className="text-arena-muted text-lg font-light tracking-widest uppercase max-w-2xl mx-auto leading-relaxed">
            The mission parameters are currently encrypted. <br />
            Awaiting <span className="text-arena-rose font-bold">Admin Authorization</span> to reveal all challenges.
          </p>
        </div>
        
        {timeLeft > 0 && (
           <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-black text-arena-rose uppercase tracking-[0.4em]">Decryption Completion In</span>
              <span className="text-4xl font-black text-white tabular-nums tracking-[0.2em]">{formatTime(timeLeft)}</span>
           </div>
        )}

        <div className="flex items-center gap-3 py-3 px-6 bg-white/5 rounded-full border border-white/5 opacity-50">
           <div className="w-2 h-2 bg-arena-rose rounded-full animate-pulse" />
           <span className="text-[10px] font-black text-white tracking-[0.4em] uppercase">Awaiting Release Command...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-extrabold uppercase tracking-widest text-white wine-glow mb-2">Problem Statements</h2>
          <p className="text-arena-muted font-light tracking-wide uppercase italic">Cluster {team.cluster} • Select Your Innovation Challenge</p>
        </div>
        
        <div className="flex items-center gap-8">
           {timeLeft > 0 && (
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-arena-rose uppercase tracking-[.3em] mb-1">Unlocking In</span>
                <span className="text-3xl font-black text-white tabular-nums tracking-widest leading-none">
                   {formatTime(timeLeft)}
                </span>
             </div>
           )}
           <div className="relative group w-96">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-arena-muted" />
             <input
               type="text"
               placeholder="Search problems..."
               className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-arena-rose/50 transition-all placeholder:text-arena-muted/50"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
           </div>
        </div>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3 font-medium"
        >
          <ShieldAlert className="w-5 h-5" /> {error}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {loading ? (
          <div className="col-span-full h-96 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-arena-rose animate-spin" />
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="col-span-full h-96 flex items-center justify-center text-arena-muted uppercase tracking-[0.3em] font-bold text-center">
            No Problem Statements Found
          </div>
        ) : filteredProblems.map((p) => {
          const isAllocatedToMe = team.problem_id === p.id;
          const anyProblemSelected = !!team.problem_id;
          return (
            <ProblemCard 
              key={p.id}
              problem={p}
              team={team}
              isAllocated={isAllocatedToMe}
              anySelected={anyProblemSelected}
              timeLeft={timeLeft}
              isSelectionEnabled={problemsState.enabled}
              onClick={() => {
                if (!anyProblemSelected) setConfirmId(p.id)
              }}
            />
          );
        })}
      </div>

      <AnimatePresence>
        {confirmId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card max-w-lg p-10 flex flex-col items-center text-center gap-6 border-arena-rose/30"
            >
              <div className="w-20 h-20 bg-arena-rose/10 rounded-full flex items-center justify-center text-arena-rose animate-pulse">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold uppercase tracking-widest text-white">Confirm Selection</h3>
              <p className="text-arena-muted text-lg leading-relaxed">
                Are you sure you want to select <span className="text-arena-rose font-bold">"{problems.find(p => p.id === confirmId)?.title}"</span>?
                <br /><br />
                This action is <span className="text-white font-bold underline decoration-arena-rose underline-offset-4">FINAL</span> and cannot be changed.
              </p>
              
              <div className="flex gap-4 w-full mt-4">
                <button 
                  onClick={() => setConfirmId(null)}
                  className="flex-1 py-4 px-6 rounded-xl border border-white/10 text-arena-muted font-bold uppercase tracking-widest hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleSelect(confirmId)}
                  disabled={selectingId === confirmId}
                  className="flex-1 glass-button !py-4 flex items-center justify-center gap-2"
                >
                  {selectingId === confirmId ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Selection'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProblemCard = React.memo(({ problem, team, isAllocated, anySelected, timeLeft, isSelectionEnabled, onClick }) => {
  const isClusterTaken = problem.taken_clusters?.includes(team.cluster);
  const isTimerRunning = timeLeft !== null && timeLeft > 0;
  // Selection is enabled ONLY if released(implied by card being shown), and timer is zero, and its not already taken.
  const canSelectNow = !anySelected && !isTimerRunning && !isClusterTaken;

  return (
    <motion.div 
      whileHover={canSelectNow ? { y: -5, scale: 1.02 } : {}}
      className={`glass-card p-10 flex flex-col gap-6 relative overflow-hidden transition-all duration-500
        ${isAllocated ? 'border-2 border-green-500 bg-green-500/5 shadow-[0_0_40px_rgba(34,197,94,0.2)]' : 'border-white/10'}
        ${(anySelected && !isAllocated) || (isClusterTaken && !isAllocated) ? 'opacity-30 grayscale-[0.9] pointer-events-none' : ''}
      `}
    >
      <div className="absolute top-0 right-0 p-4 flex gap-2">
         {isAllocated ? (
           <div className="bg-green-500/20 text-green-500 p-2 rounded-lg flex items-center gap-2">
             <CheckCircle2 className="w-5 h-5" />
             <span className="text-[10px] font-black uppercase tracking-widest">Your Selection</span>
           </div>
         ) : isClusterTaken ? (
            <div className="bg-red-500/20 text-red-500 p-2 rounded-lg flex items-center gap-2">
              <Lock className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Locked For cluster {team.cluster}</span>
            </div>
         ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-arena-rose">{problem.id}</p>
          <div className="h-px flex-1 bg-white/5" />
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10">
            <div className="flex gap-0.5">
              {[1, 2, 3].map(i => (
                <div key={i} className={`w-2.5 h-1 rounded-full ${i <= (problem.taken_count || 0) ? 'bg-arena-rose' : 'bg-white/10'}`} />
              ))}
            </div>
            <span className="text-[9px] font-black text-white">{problem.taken_count || 0}/3</span>
          </div>
        </div>
        <h3 className="text-2xl font-black uppercase tracking-widest text-white leading-tight">{problem.title}</h3>
      </div>

      <div className="flex-1">
        <p className="text-arena-muted leading-relaxed font-light text-lg">
          {problem.description}
        </p>
      </div>

      <div className="pt-6 border-t border-white/10 flex items-center justify-between">
        {isAllocated ? (
           <Link to="/dashboard" className="glass-button !bg-green-500 !text-white flex items-center gap-2 !px-8 text-xs font-black uppercase tracking-widest hover:scale-105 transition-all">
              Return to Dashboard <ChevronRight className="w-4 h-4" />
           </Link>
        ) : (
          <button
            onClick={onClick}
            disabled={!canSelectNow}
            className={`px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all
              ${canSelectNow 
                ? 'glass-button shadow-wine-glow hover:scale-105' 
                : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'}
            `}
          >
            {isClusterTaken ? 'Unavailable' : anySelected ? 'Selection Closed' : isTimerRunning ? 'Waiting...' : 'Lock Mission'}
          </button>
        )}
      </div>
    </motion.div>
  );
});

// availability logic moved into component


export default ProblemSelection;
