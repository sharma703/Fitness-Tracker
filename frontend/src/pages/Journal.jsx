import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Save } from 'lucide-react';
import api from '../lib/api';

const PRE_PROMPTS = [
  "What's one thing you want to feel after this session?",
  "I am showing up today because...",
  "One thing I'm grateful for right now is...",
];

const POST_PROMPTS = [
  "Name one thing your body did well today.",
  "After this session, I feel...",
  "One small win from today is...",
];

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [preText, setPreText] = useState('');
  const [postText, setPostText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [prePrompt] = useState(() => PRE_PROMPTS[Math.floor(Math.random() * PRE_PROMPTS.length)]);
  const [postPrompt] = useState(() => POST_PROMPTS[Math.floor(Math.random() * POST_PROMPTS.length)]);

  useEffect(() => {
    api.get('/journal/history').then(res => setEntries(res.data)).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.post('/journal', { preSessionText: preText, postSessionText: postText });
      setSaved(true);
      const res = await api.get('/journal/history');
      setEntries(res.data);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {} finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="section-title">Wellness Journal</h1>
        <p className="section-subtitle">Reflect, grow, and build self-awareness</p>
      </div>

      {/* Today's Entry */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <BookOpen size={18} className="text-brand-400" />
          <h2 className="font-semibold text-white">Today's Entry</h2>
          <span className="ml-auto text-xs text-slate-500">{new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        </div>

        <div className="space-y-5">
          <div>
            <label className="label text-calm-400">🌅 {prePrompt}</label>
            <textarea rows={3} className="input resize-none" placeholder="Write freely, there's no right answer..."
              value={preText} onChange={e => setPreText(e.target.value)} />
          </div>
          <div>
            <label className="label text-brand-400">🌿 {postPrompt}</label>
            <textarea rows={3} className="input resize-none" placeholder="Take a moment to reflect..."
              value={postText} onChange={e => setPostText(e.target.value)} />
          </div>
        </div>

        <button onClick={save} disabled={saving || (!preText && !postText)}
          className="btn-primary w-full mt-5 flex items-center justify-center gap-2 disabled:opacity-50">
          {saving ? 'Saving...' : saved ? '✓ Saved!' : <><Save size={16} /> Save Entry</>}
        </button>
      </div>

      {/* Past Entries */}
      {entries.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-white mb-4">Past Entries</h2>
          <div className="space-y-4">
            {entries.map((entry, i) => (
              <motion.div key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="border-l-2 border-brand-500/40 pl-4">
                <p className="text-xs text-slate-500 mb-2">{new Date(entry.date).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                {entry.preSessionText && (
                  <p className="text-sm text-slate-300 mb-1">
                    <span className="text-calm-400 font-medium">Pre: </span>{entry.preSessionText}
                  </p>
                )}
                {entry.postSessionText && (
                  <p className="text-sm text-slate-300">
                    <span className="text-brand-400 font-medium">Post: </span>{entry.postSessionText}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
