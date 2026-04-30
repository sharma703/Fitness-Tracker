import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { ChevronRight, ChevronLeft, CheckCircle, User, Target, Brain, Apple } from 'lucide-react';

const GOALS = [
  { value: 'weight_loss', label: 'Weight Loss', emoji: '🔥' },
  { value: 'muscle_gain', label: 'Muscle Gain', emoji: '💪' },
  { value: 'flexibility', label: 'Flexibility', emoji: '🧘' },
  { value: 'mental_clarity', label: 'Mental Clarity', emoji: '🧠' },
  { value: 'general_fitness', label: 'General Fitness', emoji: '⚡' },
];

const FITNESS_LEVELS = [
  { value: 'beginner', label: 'Beginner', desc: 'Just starting out or getting back in shape', emoji: '🌱' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Workout regularly, comfortable with basics', emoji: '🌿' },
  { value: 'advanced', label: 'Advanced', desc: 'Intense training, high endurance & strength', emoji: '🌳' },
];

const DIET_PREFS = [
  { value: 'non_veg', label: 'Non-Vegetarian', emoji: '🥩' },
  { value: 'vegetarian', label: 'Vegetarian', emoji: '🥗' },
  { value: 'vegan', label: 'Vegan', emoji: '🌱' },
  { value: 'keto', label: 'Keto', emoji: '🥑' },
  { value: 'no_preference', label: 'No Preference', emoji: '🍽️' },
];

const STEPS = [
  { id: 1, title: 'About You', icon: User },
  { id: 2, title: 'Your Goals', icon: Target },
  { id: 3, title: 'Fitness Level', icon: Brain },
  { id: 4, title: 'Diet & Lifestyle', icon: Apple },
];

export default function Onboarding() {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    age: '', gender: '', height: '', weight: '',
    goal: '', fitnessLevel: '', dietaryPref: '', scheduleJson: {}
  });

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.post('/user/onboarding', { ...form, age: parseInt(form.age) });
      updateUser({ onboardingComplete: true });
      navigate('/');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 to-calm-500" style={{ width: `${(step / 4) * 100}%`, transition: 'width 0.4s ease' }} />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full max-w-lg">
        <div className="glass-strong rounded-3xl p-8">
          {/* Steps indicator */}
          <div className="flex items-center justify-between mb-8">
            {STEPS.map(s => (
              <div key={s.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all duration-300
                  ${step >= s.id ? 'bg-brand-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                  {step > s.id ? <CheckCircle size={16} /> : s.id}
                </div>
                {s.id < 4 && <div className={`w-10 h-0.5 mx-1 transition-all duration-300 ${step > s.id ? 'bg-brand-500' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h2 className="section-title mb-1">Tell us about yourself</h2>
                <p className="text-slate-400 text-sm mb-6">This helps personalise your wellness plan</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Age</label>
                      <input type="number" min="13" max="100" placeholder="25" className="input"
                        value={form.age} onChange={e => update('age', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Gender</label>
                      <select className="input" value={form.gender} onChange={e => update('gender', e.target.value)}>
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Height (cm)</label>
                      <input type="number" placeholder="170" className="input"
                        value={form.height} onChange={e => update('height', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Weight (kg)</label>
                      <input type="number" placeholder="65" className="input"
                        value={form.weight} onChange={e => update('weight', e.target.value)} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h2 className="section-title mb-1">What's your primary goal?</h2>
                <p className="text-slate-400 text-sm mb-6">Your entire plan will be built around this</p>
                <div className="space-y-3">
                  {GOALS.map(g => (
                    <button key={g.value} onClick={() => update('goal', g.value)}
                      className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 transition-all duration-200
                        ${form.goal === g.value ? 'border-brand-500 bg-brand-500/15' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                      <span className="text-2xl">{g.emoji}</span>
                      <span className={`font-medium ${form.goal === g.value ? 'text-brand-300' : 'text-white'}`}>{g.label}</span>
                      {form.goal === g.value && <CheckCircle size={18} className="text-brand-400 ml-auto" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h2 className="section-title mb-1">Your fitness level</h2>
                <p className="text-slate-400 text-sm mb-6">Helps calibrate the intensity of your workouts</p>
                <div className="space-y-3">
                  {FITNESS_LEVELS.map(l => (
                    <button key={l.value} onClick={() => update('fitnessLevel', l.value)}
                      className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 text-left transition-all duration-200
                        ${form.fitnessLevel === l.value ? 'border-brand-500 bg-brand-500/15' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                      <span className="text-2xl">{l.emoji}</span>
                      <div>
                        <p className={`font-semibold ${form.fitnessLevel === l.value ? 'text-brand-300' : 'text-white'}`}>{l.label}</p>
                        <p className="text-xs text-slate-400">{l.desc}</p>
                      </div>
                      {form.fitnessLevel === l.value && <CheckCircle size={18} className="text-brand-400 ml-auto" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h2 className="section-title mb-1">Diet & lifestyle</h2>
                <p className="text-slate-400 text-sm mb-6">For personalised meal recommendations</p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {DIET_PREFS.map(d => (
                    <button key={d.value} onClick={() => update('dietaryPref', d.value)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200
                        ${form.dietaryPref === d.value ? 'border-brand-500 bg-brand-500/15' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                      <span className="text-xl">{d.emoji}</span>
                      <span className={`text-sm font-medium ${form.dietaryPref === d.value ? 'text-brand-300' : 'text-white'}`}>{d.label}</span>
                    </button>
                  ))}
                </div>
                <div className="glass rounded-xl p-4 border-l-4 border-brand-500">
                  <p className="text-xs text-slate-300">🎉 You're all set! We'll generate your personalised 7-day plan after you complete your first check-in.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex items-center gap-2">
                <ChevronLeft size={16} /> Back
              </button>
            )}
            {step < 4 ? (
              <button onClick={() => setStep(s => s + 1)}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={submit} disabled={submitting || !form.dietaryPref}
                className="btn-primary flex-1 disabled:opacity-60">
                {submitting ? 'Setting up...' : '🚀 Launch My Plan'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
