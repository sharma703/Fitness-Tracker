import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { Play, Pause, SkipForward, Check, ChevronRight, Timer, Wind, ExternalLink } from 'lucide-react';

// Circular Timer Component
function CircularTimer({ total, remaining, size = 120 }) {
  const r = 50;
  const circ = 2 * Math.PI * r;
  const progress = remaining / total;
  const dash = circ * progress;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
      <circle cx="60" cy="60" r={r} fill="none" stroke="#22c55e" strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dasharray 0.5s ease' }} />
      <text x="60" y="55" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="Inter">
        {Math.floor(remaining / 60).toString().padStart(2, '0')}:{(remaining % 60).toString().padStart(2, '0')}
      </text>
      <text x="60" y="72" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="Inter">seconds</text>
    </svg>
  );
}

// Box Breathing Visualizer
function BoxBreathing({ onDone }) {
  const PHASES = [
    { label: 'Inhale', duration: 4, color: '#22c55e' },
    { label: 'Hold', duration: 4, color: '#38bdf8' },
    { label: 'Exhale', duration: 4, color: '#a78bfa' },
    { label: 'Hold', duration: 4, color: '#f59e0b' },
  ];
  const [phase, setPhase] = useState(0);
  const [sec, setSec] = useState(4);
  const [rounds, setRounds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSec(s => {
        if (s <= 1) {
          setPhase(p => {
            const next = (p + 1) % 4;
            if (next === 0) setRounds(r => r + 1);
            setSec(PHASES[next].duration);
            return next;
          });
          return PHASES[(phase + 1) % 4].duration;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => { if (rounds >= 4) onDone(); }, [rounds]);

  const cur = PHASES[phase];

  return (
    <div className="text-center py-6">
      <h3 className="text-white font-semibold mb-1">Box Breathing</h3>
      <p className="text-slate-400 text-sm mb-6">4 rounds to calm your nervous system</p>
      <div className="relative inline-flex items-center justify-center">
        <motion.div
          animate={{ scale: phase === 0 || phase === 1 ? [1, 1.3] : [1.3, 1] }}
          transition={{ duration: cur.duration, ease: 'easeInOut' }}
          className="w-32 h-32 rounded-full flex items-center justify-center"
          style={{ background: `${cur.color}25`, border: `3px solid ${cur.color}` }}>
          <div>
            <p className="text-2xl font-bold text-white">{sec}</p>
            <p className="text-sm" style={{ color: cur.color }}>{cur.label}</p>
          </div>
        </motion.div>
      </div>
      <p className="text-slate-400 text-xs mt-4">Round {Math.min(rounds + 1, 4)} of 4</p>
    </div>
  );
}

// Rep-Paced Set Timer
function RepTimer({ reps, difficulty, currentSet, totalSets, onSetComplete }) {
  const PACE = { beginner: 3, intermediate: 2, advanced: 1.5 };
  const pace = PACE[difficulty?.toLowerCase()] || 2;
  const paceSecs = Math.ceil(pace);

  const [currentRep, setCurrentRep] = useState(0);
  const [countdown, setCountdown] = useState(paceSecs);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);
  const repRef = useRef(0);
  const intervalRef2 = useRef(null);

  const playTick = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.start(); osc.stop(ctx.currentTime + 0.12);
    } catch(e) {}
  };

  const playFinish = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [880, 1100, 1320].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.2);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.25);
      });
    } catch(e) {}
  };

  useEffect(() => {
    if (!running || done) return;
    intervalRef2.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          const next = repRef.current + 1;
          repRef.current = next;
          setCurrentRep(next);
          if (next >= reps) {
            clearInterval(intervalRef2.current);
            setRunning(false);
            setDone(true);
            playFinish();
          } else {
            playTick();
          }
          return paceSecs;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef2.current);
  }, [running, done, reps, paceSecs]);

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => onSetComplete(), 1100);
      return () => clearTimeout(t);
    }
  }, [done]);

  const handleStart = () => {
    repRef.current = 0;
    setCurrentRep(0);
    setCountdown(paceSecs);
    setDone(false);
    setStarted(true);
    setRunning(true);
  };

  const handlePause = () => {
    setRunning(false);
    clearInterval(intervalRef2.current);
  };

  const handleReset = () => {
    handlePause();
    repRef.current = 0;
    setCurrentRep(0);
    setCountdown(paceSecs);
    setDone(false);
    setStarted(false);
  };

  const circ = 2 * Math.PI * 54;
  const repArc = circ * ((paceSecs - countdown) / paceSecs);
  const diffColor = { beginner: '#22c55e', intermediate: '#f59e0b', advanced: '#ef4444' };
  const color = diffColor[difficulty?.toLowerCase()] || '#22c55e';

  return (
    <div className="text-center">
      <p className="text-slate-400 text-xs mb-1 uppercase tracking-widest">Set {currentSet} of {totalSets}</p>

      {/* Central SVG timer */}
      <div className="flex justify-center mb-3">
        <motion.div
          animate={running && !done ? { scale: [1, 1.02, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          <svg width="170" height="170" viewBox="0 0 130 130">
            <circle cx="65" cy="65" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="9"/>
            <circle cx="65" cy="65" r="54" fill="none"
              stroke={done ? '#22c55e' : running ? color : 'rgba(255,255,255,0.12)'}
              strokeWidth="9"
              strokeDasharray={`${done ? circ : running ? repArc : 0} ${circ}`}
              strokeLinecap="round"
              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dasharray 0.25s linear, stroke 0.3s ease' }}
            />
            {done ? (
              <>
                <text x="65" y="60" textAnchor="middle" fill="#22c55e" fontSize="28" fontWeight="bold" fontFamily="Inter">✓</text>
                <text x="65" y="78" textAnchor="middle" fill="#22c55e" fontSize="12" fontFamily="Inter">Set Done!</text>
              </>
            ) : running ? (
              <>
                <text x="65" y="58" textAnchor="middle" fill="white" fontSize="34" fontWeight="bold" fontFamily="Inter">{countdown}</text>
                <text x="65" y="74" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="Inter">
                  Rep {Math.min(currentRep + 1, reps)} / {reps}
                </text>
              </>
            ) : started ? (
              <>
                <text x="65" y="58" textAnchor="middle" fill="white" fontSize="34" fontWeight="bold" fontFamily="Inter">{countdown}</text>
                <text x="65" y="74" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="Inter">Paused</text>
              </>
            ) : (
              <>
                <text x="65" y="58" textAnchor="middle" fill="#64748b" fontSize="30" fontWeight="bold" fontFamily="Inter">▶</text>
                <text x="65" y="75" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="Inter">Tap Start</text>
              </>
            )}
          </svg>
        </motion.div>
      </div>

      {/* Rep dots */}
      <div className="flex gap-1.5 justify-center flex-wrap mb-3 px-6">
        {Array.from({ length: reps }).map((_, i) => (
          <motion.div
            key={i}
            animate={i === currentRep && running ? { scale: [1, 1.4, 1] } : {}}
            transition={{ duration: 0.3 }}
            className="w-3 h-3 rounded-full transition-colors duration-300"
            style={{
              background: i < currentRep
                ? color
                : i === currentRep && running
                ? '#38bdf8'
                : 'rgba(255,255,255,0.08)'
            }}
          />
        ))}
      </div>

      {/* Pace info */}
      <p className="text-xs mb-4" style={{ color }}>
        {paceSecs}s per rep &middot; {difficulty} pace
      </p>

      {/* Controls */}
      {!done && (
        <div className="flex items-center justify-center gap-2">
          {!running ? (
            <button onClick={handleStart} className="btn-primary flex items-center gap-2 px-8">
              <Play size={16} /> {started ? 'Resume' : 'Start'}
            </button>
          ) : (
            <button onClick={handlePause} className="btn-secondary flex items-center gap-2 px-8">
              <Pause size={16} /> Pause
            </button>
          )}
          {started && !running && (
            <button onClick={handleReset}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all flex items-center justify-center text-lg">
              ↺
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function WorkoutSession() {
  const [plan, setPlan] = useState(null);
  const [day, setDay] = useState(null);
  const [phase, setPhase] = useState('pre'); // pre | workout | post | done
  const [currentEx, setCurrentEx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [sessionStart] = useState(Date.now());
  const [moodBefore, setMoodBefore] = useState(5);
  const [moodAfter, setMoodAfter] = useState(5);
  const [breathingDone, setBreathingDone] = useState(false);
  const [repTimerMode, setRepTimerMode] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    api.get('/plan/current').then(res => {
      setPlan(res.data);
      const dayOfWeek = new Date().getDay() || 7;
      const d = res.data?.planJson?.weeklyPlan?.find(d => d.day === dayOfWeek) || res.data?.planJson?.weeklyPlan?.[0];
      setDay(d);
      if (d?.workout?.[0]?.durationSeconds) setTimeLeft(d.workout[0].durationSeconds);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(intervalRef.current); setTimerActive(false); playBeep(); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [timerActive]);

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  };

  const exercise = day?.workout?.[currentEx];

  const nextSet = () => {
    if (currentSet < exercise.sets) {
      setCurrentSet(s => s + 1);
      setIsResting(true);
      setTimeLeft(exercise.restSeconds || 60);
      setTimerActive(true);
    } else {
      // completed all sets of this exercise
      setCompletedExercises(c => [...c, exercise.name]);
      if (currentEx < (day.workout.length - 1)) {
        setCurrentEx(i => i + 1);
        setCurrentSet(1);
        setIsResting(false);
        setRepTimerMode(false);
        const next = day.workout[currentEx + 1];
        setTimeLeft(next.durationSeconds || 0);
      } else {
        setPhase('post');
      }
    }
  };

  const skipRest = () => { clearInterval(intervalRef.current); setIsResting(false); setTimerActive(false); setTimeLeft(0); };

  const saveSession = async (after) => {
    try {
      const duration = Math.round((Date.now() - sessionStart) / 60000);
      await api.post('/session', {
        exercisesDone: completedExercises,
        duration: Math.max(duration, 1),
        calories: Math.round(duration * 6),
        moodBefore,
        moodAfter: after,
      });
    } catch (e) { console.error(e); }
    setPhase('done');
  };

  if (!plan) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Timer size={48} className="text-brand-400 mx-auto mb-4 animate-pulse" />
        <p className="text-white font-semibold mb-2">No plan found</p>
        <p className="text-slate-400 text-sm">Generate a plan from the dashboard first</p>
      </div>
    </div>
  );

  if (!day) return <p className="text-slate-400 text-center py-20">No workout scheduled for today.</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="section-title">Workout Session</h1>
        <p className="section-subtitle">{day.theme} · {day.workout?.length} exercises</p>
      </div>

      <AnimatePresence mode="wait">
        {/* PRE SESSION */}
        {phase === 'pre' && (
          <motion.div key="pre" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="card mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Wind size={18} className="text-calm-400" />
                <h2 className="text-white font-semibold">Pre-Session Mental Exercise</h2>
              </div>
              <p className="text-slate-400 text-sm mb-4">{day.mentalExercise?.preName}</p>

              <div className="mb-4">
                <p className="text-sm text-slate-300 mb-1">Your mood before session:</p>
                <div className="flex items-center gap-3">
                  <input type="range" min="1" max="10" value={moodBefore} onChange={e => setMoodBefore(+e.target.value)} className="flex-1 accent-[#22c55e]" />
                  <span className="text-brand-400 font-bold w-8">{moodBefore}</span>
                </div>
              </div>

              {!breathingDone ? (
                <BoxBreathing onDone={() => setBreathingDone(true)} />
              ) : (
                <div className="text-center">
                  <div className="text-4xl mb-2">✨</div>
                  <p className="text-brand-400 font-medium">Breathing complete! You're centered.</p>
                </div>
              )}
            </div>

            <button onClick={() => setPhase('workout')}
              className="btn-primary w-full flex items-center justify-center gap-2">
              <Play size={18} /> Begin Workout
            </button>
          </motion.div>
        )}

        {/* WORKOUT */}
        {phase === 'workout' && exercise && (
          <motion.div key="workout" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Progress */}
            <div className="glass rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
              <div className="flex gap-1.5 flex-1">
                {day.workout.map((_, i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < currentEx ? 'bg-brand-500' : i === currentEx ? 'bg-brand-400' : 'bg-white/10'}`} />
                ))}
              </div>
              <span className="text-xs text-slate-400 shrink-0">{currentEx + 1}/{day.workout.length}</span>
            </div>

            {isResting ? (
              <div className="card text-center">
                <p className="text-slate-400 font-medium mb-4">Rest Period</p>
                <div className="flex justify-center mb-4">
                  <CircularTimer total={exercise.restSeconds || 60} remaining={timeLeft} size={140} />
                </div>
                <button onClick={skipRest} className="btn-secondary">Skip Rest</button>
              </div>
            ) : (
              <div className="card">
                {/* Header always visible */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">{exercise.name}</h2>
                    <p className="text-slate-400 text-sm">{exercise.muscleGroup}</p>
                  </div>
                  <span className={`badge ${exercise.difficulty === 'beginner' ? 'bg-green-500/15 text-green-400' : exercise.difficulty === 'intermediate' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'}`}>
                    {exercise.difficulty}
                  </span>
                </div>

                {/* REP TIMER MODE */}
                {repTimerMode && exercise.reps ? (
                  <AnimatePresence mode="wait">
                    <motion.div key={`reptimer-${currentEx}-${currentSet}`}
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                      <RepTimer
                        reps={exercise.reps}
                        difficulty={exercise.difficulty}
                        currentSet={currentSet}
                        totalSets={exercise.sets}
                        onSetComplete={nextSet}
                      />

                      {/* Form tip in rep timer mode */}
                      {exercise.formTip && (
                        <div className="bg-calm-500/10 border border-calm-500/20 rounded-xl p-3 mt-4">
                          <p className="text-xs text-calm-400 font-medium mb-1">💡 Form Tip</p>
                          <p className="text-sm text-slate-300">{exercise.formTip}</p>
                        </div>
                      )}

                      <button onClick={() => setRepTimerMode(false)}
                        className="text-xs text-slate-500 hover:text-slate-300 mt-4 mx-auto flex items-center gap-1 transition-colors">
                        ← Switch to Manual Mode
                      </button>
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  /* MANUAL MODE */
                  <>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-white/5 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-brand-400">{exercise.sets}</p>
                        <p className="text-xs text-slate-400">Sets</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-white">{exercise.reps || `${exercise.durationSeconds}s`}</p>
                        <p className="text-xs text-slate-400">{exercise.reps ? 'Reps' : 'Duration'}</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-white">{currentSet}</p>
                        <p className="text-xs text-slate-400">Current Set</p>
                      </div>
                    </div>

                    {/* Rep timer CTA — only for rep-based exercises */}
                    {exercise.reps && (
                      <motion.button
                        onClick={() => setRepTimerMode(true)}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className="w-full mb-4 py-3 rounded-xl border border-dashed border-brand-500/40 bg-brand-500/5 hover:bg-brand-500/10 text-brand-400 hover:text-brand-300 text-sm font-medium transition-all flex items-center justify-center gap-2">
                        <Timer size={16} /> Use Rep Timer — follow the pace, skip counting
                      </motion.button>
                    )}

                    {exercise.durationSeconds > 0 && (
                      <div className="flex justify-center mb-4">
                        <CircularTimer total={exercise.durationSeconds} remaining={timerActive ? timeLeft : exercise.durationSeconds} size={140} />
                      </div>
                    )}

                    {exercise.formTip && (
                      <div className="bg-calm-500/10 border border-calm-500/20 rounded-xl p-3 mb-4">
                        <p className="text-xs text-calm-400 font-medium mb-1">💡 Form Tip</p>
                        <p className="text-sm text-slate-300">{exercise.formTip}</p>
                      </div>
                    )}

                    {exercise.videoSearch && (
                      <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.videoSearch)}`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 mb-4">
                        <ExternalLink size={12} /> Watch form demo on YouTube
                      </a>
                    )}

                    <div className="flex gap-3">
                      {exercise.durationSeconds > 0 && (
                        <button onClick={() => { setTimeLeft(exercise.durationSeconds); setTimerActive(!timerActive); }}
                          className="btn-secondary flex items-center gap-2">
                          {timerActive ? <Pause size={16} /> : <Play size={16} />}
                          {timerActive ? 'Pause' : 'Start'}
                        </button>
                      )}
                      <button onClick={nextSet} className="btn-primary flex-1 flex items-center justify-center gap-2">
                        {currentSet < exercise.sets ? (
                          <><Check size={16} /> Set {currentSet} Done — Rest</>
                        ) : (
                          <><SkipForward size={16} /> Next Exercise</>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* POST SESSION */}
        {phase === 'post' && (
          <motion.div key="post" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="card mb-4">
              <h2 className="text-white font-semibold mb-4">🎉 Workout Complete!</h2>
              <p className="text-slate-300 text-sm mb-2">{day.mentalExercise?.postName}</p>
              <p className="text-slate-400 text-sm mb-6">{day.mentalExercise?.postDescription}</p>
              <div className="mb-6">
                <p className="text-sm text-slate-300 mb-2">How do you feel NOW?</p>
                <div className="flex items-center gap-3">
                  <input type="range" min="1" max="10" value={moodAfter} onChange={e => setMoodAfter(+e.target.value)} className="flex-1 accent-[#22c55e]" />
                  <span className="text-brand-400 font-bold w-8">{moodAfter}</span>
                </div>
                {moodAfter > moodBefore && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-brand-400 text-sm mt-2">
                    ✨ Your mood improved by {moodAfter - moodBefore} points!
                  </motion.p>
                )}
              </div>
              <button onClick={() => saveSession(moodAfter)} className="btn-primary w-full">
                Save Session & Finish
              </button>
            </div>
          </motion.div>
        )}

        {/* DONE */}
        {phase === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card text-center py-12">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
              className="text-7xl mb-4">🏆</motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">Session Saved!</h2>
            <p className="text-slate-400 mb-6">Amazing work today. Your progress has been logged.</p>
            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto mb-6">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xl font-bold text-brand-400">{completedExercises.length}</p>
                <p className="text-xs text-slate-400">Exercises Done</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xl font-bold text-brand-400">{Math.round((Date.now() - sessionStart) / 60000)}m</p>
                <p className="text-xs text-slate-400">Total Time</p>
              </div>
            </div>
            <a href="/" className="btn-primary inline-flex items-center gap-2">
              Back to Dashboard <ChevronRight size={16} />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
