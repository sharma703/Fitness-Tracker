import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Home, Dumbbell, Apple, TrendingUp, BookOpen, LogOut, Leaf } from 'lucide-react';
import MoodCheckIn from './MoodCheckIn';
import { useEffect, useState } from 'react';
import api from '../lib/api';

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/session', label: 'Workout', icon: Dumbbell },
  { to: '/nutrition', label: 'Nutrition', icon: Apple },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/journal', label: 'Journal', icon: BookOpen },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showCheckIn, setShowCheckIn] = useState(false);

  useEffect(() => {
    api.get('/mood/status').then(res => {
      if (res.data.checkInNeeded) setShowCheckIn(true);
    }).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 glass border-r border-white/10 p-6 fixed h-full z-10">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-calm-500 rounded-xl flex items-center justify-center">
            <Leaf size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Go Fit</h1>
            <p className="text-xs text-slate-400">Your coach</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 
                ${isActive ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`
              }>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 pt-4 mt-4">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-calm-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all duration-200">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
        {/* Top bar mobile */}
        <header className="md:hidden flex items-center justify-between p-4 glass border-b border-white/10">
          <div className="flex items-center gap-2">
            <Leaf size={20} className="text-brand-400" />
            <span className="font-bold text-white">Go Fit</span>
          </div>
          <button onClick={handleLogout} className="text-slate-400 hover:text-white">
            <LogOut size={18} />
          </button>
        </header>

        <div className="flex-1 p-4 md:p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}>
            <Outlet />
          </motion.div>
        </div>

        {/* Bottom nav mobile */}
        <nav className="md:hidden flex glass border-t border-white/10 px-2 py-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors
                ${isActive ? 'text-brand-400' : 'text-slate-400'}`
              }>
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
      </main>

      {/* Mood Check-in Modal */}
      {showCheckIn && <MoodCheckIn onClose={() => setShowCheckIn(false)} />}
    </div>
  );
}
