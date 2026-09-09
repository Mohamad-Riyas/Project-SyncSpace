import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, LogIn, UserPlus, Zap, Palette, Check, Moon, Sun } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useTheme, THEME_OPTIONS, type ThemeMode } from '../../context/ThemeContext';
import { Button } from '../ui/Button';

interface HeaderProps {
  title?: string;
  onMenuClick: () => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Dashboard',
  onMenuClick,
  searchQuery = '',
  setSearchQuery,
}) => {
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const { showToast } = useToast();
  const { theme, setTheme } = useTheme();

  const notifications = [
    { id: 1, title: 'Project Alpha updated', time: '10m ago', unread: true },
    { id: 2, title: 'Alex Vance joined workspace', time: '25m ago', unread: true },
    { id: 3, title: 'Weekly activity summary ready', time: '2h ago', unread: false },
  ];

  const currentTheme = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];
  const isLightMode = theme === 'light';

  return (
    <header className="h-16 border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left side: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-slate-400 hover:text-cyan-300 p-2 rounded-xl hover:bg-slate-900 border border-slate-800"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <span>{title}</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </h1>
        </div>
      </div>

      {/* Center/Right: Search + Theme Switcher + Notifications + Auth Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search Bar */}
        {setSearchQuery && (
          <div className="relative hidden md:block w-64 lg:w-72">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-8 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
              ⌘K
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setTheme(isLightMode ? 'cyan' : 'light');
            showToast(isLightMode ? 'Dark mode enabled' : 'Light mode enabled', 'info');
          }}
          className="p-2 rounded-xl border border-slate-800/80 text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition-colors"
          aria-label={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
          title={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Theme Switcher Button */}
        <div className="relative">
          <button
            onClick={() => {
              setThemeOpen(!themeOpen);
              setNotifOpen(false);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-900 border border-slate-800/80 transition-colors flex items-center gap-1.5 cursor-pointer"
            aria-label="Change Theme"
            title="Change Theme"
          >
            <Palette className="w-4 h-4" />
            <span
              className="w-2.5 h-2.5 rounded-full ring-1 ring-white/20 hidden sm:inline-block"
              style={{ backgroundColor: currentTheme.color }}
            />
          </button>

          {/* Theme Dropdown */}
          {themeOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-950 border border-cyan-500/30 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in duration-150">
              <div className="pb-2 mb-2 border-b border-slate-800 px-2 flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-300 uppercase tracking-wider">Select Theme</span>
                <Palette className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div className="space-y-1">
                {THEME_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setTheme(opt.id as ThemeMode);
                      showToast(`Theme changed to ${opt.name}`, 'info');
                      setThemeOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      theme === opt.id
                        ? 'bg-slate-800 text-white border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/90'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full shadow-sm ring-1 ring-white/20"
                        style={{ backgroundColor: opt.color }}
                      />
                      <span>{opt.name}</span>
                    </div>
                    {theme === opt.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Icon Button */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen(!notifOpen);
              setThemeOpen(false);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-900 border border-slate-800/80 transition-colors relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-slate-950 animate-ping" />
          </button>

          {/* Notifications Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-950 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950 p-4 z-50 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <span className="font-semibold text-sm text-slate-200">Notifications</span>
                <span className="text-xs text-cyan-400 font-medium cursor-pointer hover:underline" onClick={() => showToast('All marked as read', 'info')}>
                  Mark all read
                </span>
              </div>
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 transition-colors flex items-start justify-between border border-slate-800/60">
                    <div>
                      <p className="text-xs font-medium text-slate-200">{n.title}</p>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Guest Authentication Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<LogIn className="w-4 h-4 text-cyan-400" />}
            onClick={() => navigate('/login')}
          >
            Login
          </Button>

          <Button
            variant="thunder"
            size="sm"
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => navigate('/register')}
            className="hidden sm:inline-flex"
          >
            Register
          </Button>
        </div>
      </div>
    </header>
  );
};
