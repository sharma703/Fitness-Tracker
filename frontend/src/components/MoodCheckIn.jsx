import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smile, Zap, Moon, MessageSquare } from 'lucide-react';
import api from '../lib/api';

const MOOD_EMOJIS = [
  { value: 1, emoji: '😢', label: 'Terrible' },
  { value: 2, emoji: '😞', label: 'Bad' },
  { value: 3, emoji: '😕', label: 'Poor' },
  { value: 4, emoji: '😐', label: 'Okay' },
  { value: 5, emoji: '🙂', label: 'Fine' },
  { value: 6, emoji: '😊', label: 'Good' },
  { value: 7, emoji: '😄', label: 'Great' },
  { value: 8, emoji: '😁', label: 'Amazing' },
  { value: 9, emoji: '🤩', label: 'Fantastic' },
  { value: 10, emoji: '🥳', label: 'Perfect' },
];

export default function MoodCheckIn({ onClose }) {
  const [step, setStep] = useState(1);
  const [mood, setMood] = useState(null);
  const [energy, setEnergy] = useState(5);
  const [sleep, setSleep] = useState(7);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.post('/mood/checkin', { moodScore: mood, energy, sleepHours: sleep, notes });
      setDone(true);
      setTimeout(onClose, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}>
        {/* Backdrop */}
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />

        <motion.div
          className="relative w-full max-w-md glass-strong rounded-3xl p-8 z-10"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}>

          {done ? (
            <div className="text-center py-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
                className="text-6xl mb-4">✨</motion.div>
              <h2 className="text-2xl font-bold text-white">Check-in Complete!</h2>
              <p className="text-slate-400 mt-2">Your plan is being personalized for you.</p>
            </div>
          ) : (
            <>
              <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
              <div className="flex items-center gap-2 mb-1">
                <Smile size={20} className="text-brand-400" />
                <span className="text-xs font-medium text-brand-400 uppercase tracking-wider">Daily Check-in</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">How are you feeling?</h2>
              <p className="text-slate-400 text-sm mb-6">This helps us personalize today's plan for you</p>

              {/* Step indicators */}
              <div className="flex gap-2 mb-8">
                {[1, 2, 3].map(s => (
                  <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${step >= s ? 'bg-brand-500' : 'bg-white/10'}`} />
                ))}
              </div>

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="mood" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <p className="text-sm font-medium text-slate-300 mb-4">Select your mood</p>
                    <div className="grid grid-cols-5 gap-2 mb-6">
                      {MOOD_EMOJIS.map(m => (
                        <button key={m.value} onClick={() => setMood(m.value)}
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 
                            ${mood === m.value ? 'bg-brand-500/20 border-2 border-brand-500 scale-110' : 'bg-white/5 border-2 border-transparent hover:bg-white/10'}`}>
                          <span className="text-2xl">{m.emoji}</span>
                          <span className="text-xs text-slate-400">{m.label}</span>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => mood && setStep(2)} disabled={!mood}
                      className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed">
                      Next
                    </button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="metrics" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="space-y-6 mb-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                            <Zap size={16} className="text-warm-400" />
                            Energy Level
                          </div>
                          <span className="text-brand-400 font-bold">{energy}/10</span>
                        </div>
                        <input type="range" min="1" max="10" value={energy} onChange={e => setEnergy(+e.target.value)}
                          className="w-full accent-[#22c55e]" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                            <Moon size={16} className="text-calm-400" />
                            Sleep Hours
                          </div>
                          <span className="text-brand-400 font-bold">{sleep}h</span>
                        </div>
                        <input type="range" min="1" max="12" step="0.5" value={sleep} onChange={e => setSleep(+e.target.value)}
                          className="w-full accent-[#22c55e]" />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                      <button onClick={() => setStep(3)} className="btn-primary flex-1">Next</button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="notes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="mb-6">
                      <div className="flex items-center gap-2 text-slate-300 text-sm font-medium mb-2">
                        <MessageSquare size={16} className="text-brand-400" />
                        Any notes? (optional)
                      </div>
                      <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                        placeholder="Busy day, feeling stressed, had a good meeting..."
                        className="input resize-none" />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button>
                      <button onClick={submit} disabled={submitting}
                        className="btn-primary flex-1 disabled:opacity-60">
                        {submitting ? 'Saving...' : '✓ Complete'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
