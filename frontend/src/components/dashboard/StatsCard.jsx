import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { FolderKanban, Users, Clock, Zap, TrendingUp } from 'lucide-react';
const iconMap = {
    FolderKanban: FolderKanban,
    Users: Users,
    Clock: Clock,
    Zap: Zap,
};
export const StatsCard = ({ stat }) => {
    const IconComponent = iconMap[stat.iconName] || FolderKanban;
    return (_jsxs("div", { className: "electric-card rounded-2xl p-5 relative overflow-hidden group", children: [_jsx("div", { className: "absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-cyan-500/20 transition-colors" }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform shadow-sm shadow-cyan-950", children: _jsx(IconComponent, { className: "w-5 h-5" }) }), stat.change && (_jsxs("div", { className: `
            flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border
            ${stat.changeType === 'positive' ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400'}
          `, children: [stat.changeType === 'positive' && _jsx(TrendingUp, { className: "w-3 h-3 text-cyan-400" }), _jsx("span", { children: stat.change })] }))] }), _jsxs("div", { className: "mt-4 space-y-1", children: [_jsx("p", { className: "text-xs font-medium text-slate-400 tracking-wider uppercase", children: stat.label }), _jsx("p", { className: "text-2xl sm:text-3xl font-black text-slate-100 tracking-tight drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]", children: stat.value })] })] }));
};
