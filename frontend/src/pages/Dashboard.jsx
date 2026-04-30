import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Link } from 'react-router-dom';
import { Sparkles, Dumbbell, Brain, Apple, TrendingUp, RefreshCw, Play, ChevronRight } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

const AFFIRMATIONS = [
  "Your mental health is just as important as your physical health.",
  "Small consistent steps lead to massive transformation.",
  "You deserve to feel strong, calm, and energetic.",
  "Rest is not a reward — it's a requirement.",
  "Progress, not perfection.",
];

export default function Dashboard() {
  const { user } = useAuth();
  const [plan, setPlan] = useState(null);
  const [moodHistory, setMoodHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [latestMood, setLatestMood] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [affirmation] = useState(() => AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);
  const [todayDay, setTodayDay] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [planRes, moodRes, statsRes, latestRes] = await Promise.allSettled([
        api.get('/plan/current'),
        api.get('/mood/history'),
        api.get('/session/stats'),
        api.get('/mood/latest'),
      ]);
      if (planRes.status === 'fulfilled') {
        setPlan(planRes.value.data);
        const dayOfWeek = new Date().getDay();
        const mapped = dayOfWeek === 0 ? 7 : dayOfWeek;
        setTodayDay(planRes.value.data?.planJson?.weeklyPlan?.find(d => d.day === mapped) || planRes.value.data?.planJson?.weeklyPlan?.[0]);
      }
      if (moodRes.status === 'fulfilled') setMoodHistory(moodRes.value.data);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (latestRes.status === 'fulfilled') setLatestMood(latestRes.value.data);
    } catch (err) { console.error(err); }
  };

  const generatePlan = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/plan/generate');
      setPlan(res.data.plan);
      const d = res.data.plan?.planJson?.weeklyPlan?.[0];
      setTodayDay(d);
    } catch (err) {
      alert(err.response?.data?.error || 'Plan generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const moodChartData = moodHistory.slice(-7).map(m => ({
    date: new Date(m.date).toLocaleDateString('en', { weekday: 'short' }),
    mood: m.moodScore,
    energy: m.energy,
  }));

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-400 mt-1">{affirmation}</p>
      </motion.div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Sessions', value: stats.totalSessions, icon: '🏋️', color: 'brand' },
            { label: 'Minutes', value: stats.totalMinutes, icon: '⏱️', color: 'calm' },
            { label: 'Calories Burned', value: stats.totalCalories, icon: '🔥', color: 'warm' },
            { label: 'Avg Mood', value: `${stats.avgMoodAfter}/10`, icon: '😊', color: 'brand' },
          ].map(s => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="card text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Today's Plan */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Dumbbell size={18} className="text-brand-400" />
              <h2 className="font-semibold text-white">Today's Workout</h2>
            </div>
            <button onClick={generatePlan} disabled={generating}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-50">
              <RefreshCw size={13} className={generating ? 'animate-spin' : ''} />
              {generating ? 'Generating...' : 'New Plan'}
            </button>
          </div>

          {!plan ? (
            <div className="text-center py-8">
              <Sparkles size={40} className="text-brand-400 mx-auto mb-3" />
              <p className="text-slate-300 font-medium mb-1">No plan yet</p>
              <p className="text-slate-400 text-sm mb-4">Generate an AI-powered plan tailored to your goals</p>
              <button onClick={generatePlan} disabled={generating} className="btn-primary text-sm disabled:opacity-60">
                {generating ? 'Generating your plan...' : '✨ Generate My Plan'}
              </button>
            </div>
          ) : todayDay ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="badge bg-brand-500/20 text-brand-300 border border-brand-500/30">{todayDay.theme}</span>
                {todayDay.restDay && <span className="badge bg-calm-500/20 text-calm-300">Rest Day</span>}
              </div>
              <div className="space-y-2 mb-4">
                {todayDay.workout?.slice(0, 3).map((ex, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2">
                    <div className="w-2 h-2 bg-brand-400 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{ex.name}</p>
                      <p className="text-xs text-slate-400">
                        {ex.sets && ex.reps ? `${ex.sets}×${ex.reps}` : ex.durationSeconds ? `${ex.durationSeconds}s` : ''} · {ex.muscleGroup}
                      </p>
                    </div>
                    <span className={`badge text-xs ${ex.difficulty === 'beginner' ? 'bg-green-500/15 text-green-400' : ex.difficulty === 'intermediate' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'}`}>
                      {ex.difficulty}
                    </span>
                  </div>
                ))}
                {todayDay.workout?.length > 3 && (
                  <p className="text-xs text-slate-400 text-center">+{todayDay.workout.length - 3} more exercises</p>
                )}
              </div>
              <Link to="/session" className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
                <Play size={16} /> Start Session
              </Link>
            </div>
          ) : null}
        </motion.div>

        {/* Mental Health */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={18} className="text-calm-400" />
            <h2 className="font-semibold text-white">Mental Wellness</h2>
          </div>

          {todayDay?.mentalExercise ? (
            <div className="space-y-3">
              <div className="bg-calm-500/10 border border-calm-500/20 rounded-xl p-3">
                <p className="text-xs text-calm-400 font-medium mb-1">PRE-SESSION</p>
                <p className="text-sm font-semibold text-white">{todayDay.mentalExercise.preName}</p>
                <p className="text-xs text-slate-400 mt-1">{todayDay.mentalExercise.preDescription}</p>
              </div>
              <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-3">
                <p className="text-xs text-brand-400 font-medium mb-1">POST-SESSION</p>
                <p className="text-sm font-semibold text-white">{todayDay.mentalExercise.postName}</p>
                <p className="text-xs text-slate-400 mt-1">{todayDay.mentalExercise.postDescription}</p>
              </div>
              {todayDay.motivationalMicroGoal && (
                <div className="flex items-start gap-2 bg-warm-400/10 border border-warm-400/20 rounded-xl p-3">
                  <span className="text-lg">🎯</span>
                  <div>
                    <p className="text-xs text-warm-400 font-medium">Micro Goal</p>
                    <p className="text-sm text-white">{todayDay.motivationalMicroGoal}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain size={40} className="text-calm-400 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Generate a plan to see today's mental wellness protocol</p>
            </div>
          )}
        </motion.div>

        {/* Mood Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-brand-400" />
            <h2 className="font-semibold text-white">Mood Trend (7 days)</h2>
          </div>
          {moodChartData.length > 0 ? (
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moodChartData}>
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                  <Line type="monotone" dataKey="mood" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} name="Mood" />
                  <Line type="monotone" dataKey="energy" stroke="#38bdf8" strokeWidth={2} dot={{ fill: '#38bdf8', r: 3 }} name="Energy" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center">
              <p className="text-slate-400 text-sm">Complete check-ins to see your trend</p>
            </div>
          )}
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-brand-400" /><span className="text-xs text-slate-400">Mood</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-calm-400" /><span className="text-xs text-slate-400">Energy</span></div>
          </div>
        </motion.div>

        {/* Nutrition Snapshot */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Apple size={18} className="text-brand-400" />
              <h2 className="font-semibold text-white">Today's Diet Tip</h2>
            </div>
            <Link to="/nutrition" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              Log food <ChevronRight size={12} />
            </Link>
          </div>
          {todayDay?.dietaryTip ? (
            <div className="space-y-3">
              <p className="text-slate-300 text-sm">{todayDay.dietaryTip}</p>
              {todayDay.mealSuggestions && (
                <div className="space-y-1.5">
                  {Object.entries(todayDay.mealSuggestions).map(([meal, suggestion]) => (
                    <div key={meal} className="flex items-start gap-2 text-xs">
                      <span className="text-brand-400 font-medium capitalize w-16 shrink-0">{meal}</span>
                      <span className="text-slate-400">{suggestion}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-400 text-sm text-center py-6">Generate a plan to see meal suggestions</p>
          )}
        </motion.div>
      </div>

      {/* Weekly Plan Overview */}
      {plan?.planJson?.weeklyPlan && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
          <h2 className="font-semibold text-white mb-4">📅 Weekly Overview</h2>
          <div className="grid grid-cols-7 gap-2">
            {plan.planJson.weeklyPlan.map((day, i) => (
              <div key={i} className={`text-center p-2 rounded-xl border transition-all 
                ${day.restDay ? 'border-calm-500/20 bg-calm-500/5' : 'border-brand-500/20 bg-brand-500/5'}`}>
                <p className="text-xs text-slate-400 mb-1">{day.dayName?.slice(0, 3)}</p>
                <p className="text-lg">{day.restDay ? '🧘' : '💪'}</p>
                <p className="text-xs text-slate-400 mt-1">{day.restDay ? 'Rest' : `${day.workout?.length || 0} ex`}</p>
              </div>
            ))}
          </div>
          {plan.planJson.weeklyTheme && (
            <p className="text-center text-sm text-brand-400 mt-3 font-medium">"{plan.planJson.weeklyTheme}"</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
