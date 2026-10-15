import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, X, Video, ShieldCheck, ScrollText, PlaySquare, UserCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Workspaces', path: '/workspaces', icon: FolderKanban },
    { name: 'Interviews', path: '/interviews', icon: Video },
    { name: 'Activity History', path: '/audit-logs', icon: ScrollText },
    ...(role === 'admin' || role === 'interviewer' ? [{ name: 'Recordings', path: '/recordings', icon: PlaySquare }] : []),
    ...(role === 'admin' ? [{ name: 'Admin', path: '/admin', icon: ShieldCheck }] : []),
  ];
  return (
    <>
      {mobileOpen && <div className="app-sidebar-scrim fixed inset-0 z-40 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={`app-sidebar fixed top-0 bottom-0 left-0 z-40 w-64 overflow-hidden border-r flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="brand-lockup h-16 flex items-center justify-between px-5 border-b">
            <button type="button" className="flex items-center gap-3" onClick={() => navigate('/dashboard')}>
              <span className="syncspace-mark-crop" aria-hidden="true"><img src="/SyncSpace%20Logo.png" alt="" /></span>
              <div className="flex flex-col text-left"><span className="font-extrabold text-lg text-slate-100 tracking-tight">SyncSpace</span><span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Work together</span></div>
            </button>
            <button onClick={() => setMobileOpen(false)} className="lg:hidden text-slate-400 p-1.5"><X className="w-5 h-5" /></button>
          </div>
          <nav className="p-4 space-y-1">
            <div className="nav-section-label px-3 pb-2 text-[10px] font-bold uppercase tracking-widest">Workspace</div>
            {navItems.map(({ name, path, icon: Icon }) => {
              const isActive = location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));
              return <NavLink key={name} to={path} onClick={() => setMobileOpen(false)} className={`app-nav-link flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-semibold text-sm transition-all ${isActive ? 'active' : ''}`}><Icon className="w-4 h-4" /><span>{name}</span>{isActive && <span className="app-nav-indicator ml-auto w-1.5 h-1.5 rounded-full" />}</NavLink>;
            })}
          </nav>
        </div>
        <div className="sidebar-account p-4 border-t">
          <button type="button" onClick={() => { setMobileOpen(false); navigate('/profile'); }} className="w-full flex items-center gap-3 rounded-xl p-2.5 hover:bg-slate-900 text-left">
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center overflow-hidden">{user?.avatarUrl ? <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" /> : <UserCircle className="w-5 h-5 text-cyan-300" />}</div>
            <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-100 truncate">{user?.name || 'My Profile'}</p><p className="text-[10px] uppercase tracking-wider text-cyan-400">{role || 'user'}</p></div>
          </button>
          <button type="button" onClick={() => { setMobileOpen(false); logout(); navigate('/login'); }} className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-300 hover:bg-rose-500/10"><LogOut className="w-3.5 h-3.5" /> Sign out</button>
        </div>
      </aside>
    </>
  );
};
