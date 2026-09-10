import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { UserPlus, Edit3, Palette, PlusCircle, Clock, Zap } from 'lucide-react';
export const RecentActivity = ({ activities }) => {
    const getActivityIcon = (type) => {
        switch (type) {
            case 'join':
                return _jsx(UserPlus, { className: "w-4 h-4 text-cyan-400" });
            case 'edit':
                return _jsx(Edit3, { className: "w-4 h-4 text-blue-400" });
            case 'whiteboard':
                return _jsx(Palette, { className: "w-4 h-4 text-purple-400" });
            case 'create':
                return _jsx(PlusCircle, { className: "w-4 h-4 text-amber-400" });
            default:
                return _jsx(Zap, { className: "w-4 h-4 text-cyan-400" });
        }
    };
    return (_jsxs("div", { className: "electric-card rounded-3xl p-6", children: [_jsxs("div", { className: "flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-lg font-bold text-slate-100 flex items-center gap-2", children: [_jsx("span", { children: "Recent Activity" }), _jsx(Zap, { className: "w-4 h-4 text-cyan-400" })] }), _jsx("p", { className: "text-xs text-slate-400", children: "Live electric updates from your team workspaces" })] }), _jsxs("span", { className: "text-[11px] font-medium text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm shadow-cyan-950", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-cyan-400 animate-ping" }), "Live Stream"] })] }), _jsx("div", { className: "space-y-4", children: activities.map((activity, index) => (_jsxs("div", { className: "relative flex items-start gap-4 group", children: [index !== activities.length - 1 && (_jsx("span", { className: "absolute left-4 top-8 bottom-0 w-0.5 bg-slate-800 group-hover:bg-cyan-500/40 transition-colors" })), _jsx("div", { className: "w-8 h-8 rounded-xl bg-slate-950 border border-cyan-500/30 flex items-center justify-center shrink-0 group-hover:border-cyan-400 transition-colors z-10 shadow-sm shadow-cyan-950", children: getActivityIcon(activity.type) }), _jsxs("div", { className: "flex-1 bg-slate-950/60 hover:bg-slate-900/80 border border-slate-800/80 p-3 rounded-2xl transition-colors", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("p", { className: "text-xs font-semibold text-slate-200", children: activity.message }), _jsxs("div", { className: "flex items-center gap-1 text-[11px] text-slate-400 shrink-0", children: [_jsx(Clock, { className: "w-3 h-3" }), _jsx("span", { children: activity.time })] })] }), activity.workspaceName && (_jsx("span", { className: "inline-block mt-1 text-[10px] font-medium text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30", children: activity.workspaceName }))] })] }, activity.id))) })] }));
};
