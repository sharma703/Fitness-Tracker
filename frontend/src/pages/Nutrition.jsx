import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Trash2, Apple } from 'lucide-react';
import api from '../lib/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const MACRO_COLORS = ['#22c55e', '#38bdf8', '#f59e0b', '#a78bfa'];

export default function Nutrition() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [logs, setLogs] = useState([]);
  const [searching, setSearching] = useState(false);
  const [logging, setLogging] = useState(null);

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    try {
      const res = await api.get('/food/today');
      setLogs(res.data);
    } catch (e) {}
  };

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await api.get(`/food/search?q=${encodeURIComponent(query)}`);
      setResults(res.data);
    } catch (e) {
      alert(e.response?.data?.error || 'Search failed');
    } finally { setSearching(false); }
  };

  const logFood = async (food) => {
    setLogging(food.name);
    try {
      await api.post('/food/log', {
        mealName: food.name,
        nutrientsJson: { calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat, fiber: food.fiber },
      });
      await loadLogs();
      setResults([]);
      setQuery('');
    } catch (e) {} finally { setLogging(null); }
  };

  // Aggregate macros
  const totals = logs.reduce((acc, l) => {
    const n = l.nutrientsJson || {};
    acc.calories += (n.calories || 0);
    acc.protein += (n.protein || 0);
    acc.carbs += (n.carbs || 0);
    acc.fat += (n.fat || 0);
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const macroData = [
    { name: 'Protein', value: Math.round(totals.protein) },
    { name: 'Carbs', value: Math.round(totals.carbs) },
    { name: 'Fat', value: Math.round(totals.fat) },
  ].filter(d => d.value > 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="section-title">Nutrition Tracker</h1>
        <p className="section-subtitle">Log meals and track your macros</p>
      </div>

      {/* Macros Overview */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4">Today's Nutrition</h2>
        <div className="flex items-center gap-6">
          {macroData.length > 0 ? (
            <div className="h-28 w-28 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={macroData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value">
                    {macroData.map((_, i) => <Cell key={i} fill={MACRO_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-28 w-28 shrink-0 rounded-full border-4 border-white/10 flex items-center justify-center">
              <Apple size={24} className="text-slate-500" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 flex-1">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-white">{Math.round(totals.calories)}</p>
              <p className="text-xs text-slate-400">Calories</p>
            </div>
            {[['Protein', totals.protein, 'brand-400'], ['Carbs', totals.carbs, 'warm-400'], ['Fat', totals.fat, 'calm-400']].map(([name, val, color]) => (
              <div key={name} className="bg-white/5 rounded-xl p-3 text-center">
                <p className={`text-xl font-bold text-${color}`}>{Math.round(val)}g</p>
                <p className="text-xs text-slate-400">{name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Food Search */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4">Search & Log Food</h2>
        <div className="flex gap-2 mb-4">
          <input type="text" className="input flex-1" placeholder="Search food (e.g. banana, grilled chicken...)"
            value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()} />
          <button onClick={search} disabled={searching} className="btn-primary px-4 disabled:opacity-60">
            <Search size={18} />
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((food, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-xl px-4 py-3 transition-all">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{food.name}</p>
                  <p className="text-xs text-slate-400">
                    {food.calories ? `${Math.round(food.calories)} kcal` : '–'} | P: {Math.round(food.protein || 0)}g C: {Math.round(food.carbs || 0)}g F: {Math.round(food.fat || 0)}g
                  </p>
                </div>
                <button onClick={() => logFood(food)} disabled={logging === food.name}
                  className="flex items-center gap-1 text-brand-400 hover:text-white text-xs font-medium disabled:opacity-50 transition-colors">
                  <Plus size={14} /> Log
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Today's Logs */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4">Today's Food Log</h2>
        {logs.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">Nothing logged yet. Search and add your first meal!</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log, i) => (
              <div key={log.id} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                <div className="w-8 h-8 bg-brand-500/20 rounded-lg flex items-center justify-center text-sm">🍽️</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{log.mealName}</p>
                  {log.nutrientsJson?.calories && (
                    <p className="text-xs text-slate-400">{Math.round(log.nutrientsJson.calories)} kcal</p>
                  )}
                </div>
                <p className="text-xs text-slate-500">{new Date(log.date).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
