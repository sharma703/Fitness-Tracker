import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { TrendingUp, Award, Flame, Moon, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const BADGE_ICONS = {
  'First Workout': '🏋️',
  '7-Day Streak': '🔥',
  'Mental Health Champion': '🧠',
  'First Week Complete': '⭐',
  'Consistent Logger': '📝',
};

export default function Progress() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/progress/weekly').then(res => { setData(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-pulse-slow text-brand-400 text-lg">Loading progress...</div></div>;
  if (!data) return <p className="text-slate-400 text-center py-20">Could not load progress data.</p>;

  const chartData = data.moodTrend?.map(m => ({
    date: new Date(m.date).toLocaleDateString('en', { weekday: 'short' }),
    Mood: m.score,
    Energy: m.energy,
  })) || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="section-title">Weekly Progress</h1>
        <p className="section-subtitle">Your health journey at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Activity, label: 'Workouts', value: data.totalSessions, color: 'text-brand-400' },
          { icon: Flame, label: 'Cal Burned', value: data.totalCaloriesBurned, color: 'text-warm-400' },
          { icon: TrendingUp, label: 'Avg Mood', value: data.avgMood ? `${data.avgMood}/10` : '–', color: 'text-calm-400' },
          { icon: Moon, label: 'Avg Sleep', value: data.avgSleep ? `${data.avgSleep}h` : '–', color: 'text-purple-400' },
        ].map(s => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card text-center">
            <s.icon size={22} className={`${s.color} mx-auto mb-2`} />
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Mood Trend Chart */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4">Mood & Energy Trend</h2>
        {chartData.length > 0 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                <Line type="monotone" dataKey="Mood" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: '#22c55e', r: 4 }} />
                <Line type="monotone" dataKey="Energy" stroke="#38bdf8" strokeWidth={2.5} dot={{ fill: '#38bdf8', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center">
            <p className="text-slate-400 text-sm">Complete daily check-ins to see your trend chart</p>
          </div>
        )}
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-2"><div className="w-4 h-0.5 bg-brand-400 rounded" /><span className="text-xs text-slate-400">Mood</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-0.5 bg-calm-400 rounded" /><span className="text-xs text-slate-400">Energy</span></div>
        </div>
      </div>

      {/* Weekly Activity */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-semibold text-white mb-4">Activity Summary</h2>
          <div className="space-y-4">
            {[
              { label: 'Workout Days', value: data.workoutDays, max: 7, color: 'bg-brand-500' },
              { label: 'Nutrition Logged Days', value: data.nutritionDays, max: 7, color: 'bg-warm-400' },
              { label: 'Active Minutes', value: Math.min(data.totalMinutes, 300), max: 300, color: 'bg-calm-500', suffix: `${data.totalMinutes}min` },
            ].map(b => (
              <div key={b.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{b.label}</span>
                  <span className="text-white font-medium">{b.suffix || b.value}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(b.value / b.max) * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full ${b.color} rounded-full`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Award size={18} className="text-warm-400" />
            <h2 className="font-semibold text-white">Badges Earned</h2>
          </div>
          {data.badges?.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {data.badges.map(b => (
                <motion.div key={b.id} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
                  className="bg-warm-400/10 border border-warm-400/20 rounded-xl p-3 text-center">
                  <p className="text-2xl mb-1">{BADGE_ICONS[b.badgeName] || '🏅'}</p>
                  <p className="text-xs text-warm-300 font-medium">{b.badgeName}</p>
                  <p className="text-xs text-slate-500">{new Date(b.earnedAt).toLocaleDateString()}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Complete workouts & check-ins to earn badges!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
