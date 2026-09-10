import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, History, LogIn, Layers, Zap, X } from 'lucide-react';
import { Button } from '../ui/Button';
export const Sidebar = ({ mobileOpen, setMobileOpen }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Workspaces', path: '/workspaces', icon: FolderKanban },
        { name: 'Recent Sessions', path: '/sessions', icon: History },
    ];
    return (_jsxs(_Fragment, { children: [mobileOpen && (_jsx("div", { className: "fixed inset-0 z-40 bg-slate-950/85 backdrop-blur-md lg:hidden", onClick: () => setMobileOpen(false) })), _jsxs("aside", { className: `
          fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-950/90 backdrop-blur-xl border-r border-cyan-500/20 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `, children: [_jsxs("div", { children: [_jsxs("div", { className: "h-16 flex items-center justify-between px-6 border-b border-slate-800/80", children: [_jsxs("div", { className: "flex items-center gap-3 cursor-pointer", onClick: () => navigate('/'), children: [_jsx("div", { className: "w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 animate-thunder-pulse", children: _jsx(Layers, { className: "w-5 h-5 text-white" }) }), _jsxs("div", { className: "flex flex-col", children: [_jsxs("span", { className: "font-extrabold text-lg text-slate-100 tracking-tight flex items-center gap-1", children: [_jsx("span", { children: "SyncSpace" }), _jsx(Zap, { className: "w-3.5 h-3.5 text-cyan-400" })] }), _jsx("span", { className: "text-[9px] uppercase font-bold tracking-widest text-cyan-400 -mt-1", children: "Thunder Workspace" })] })] }), _jsx("button", { onClick: () => setMobileOpen(false), className: "lg:hidden text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-900", "aria-label": "Close menu", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsxs("nav", { className: "p-4 space-y-1", children: [_jsx("div", { className: "px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest", children: "Navigation" }), navItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                                        return (_jsxs(NavLink, { to: item.path, onClick: () => setMobileOpen(false), className: `
                    flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 group
                    ${isActive
                                                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-950'
                                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'}
                  `, children: [_jsx(Icon, { className: `w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'}` }), _jsx("span", { children: item.name }), isActive && (_jsx("span", { className: "ml-auto w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400 animate-pulse" }))] }, item.name));
                                    })] })] }), _jsx("div", { className: "p-4 border-t border-slate-800/80 bg-slate-950/60", children: _jsxs("div", { className: "p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/20 text-center space-y-2.5", children: [_jsx("p", { className: "text-xs font-medium text-slate-300", children: "Sign in to sync your custom workspaces" }), _jsx(Button, { variant: "thunder", size: "sm", className: "w-full", icon: _jsx(LogIn, { className: "w-4 h-4" }), onClick: () => {
                                        setMobileOpen(false);
                                        navigate('/login');
                                    }, children: "Sign In / Login" })] }) })] })] }));
};
