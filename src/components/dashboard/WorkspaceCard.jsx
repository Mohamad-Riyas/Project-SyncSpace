import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Palette, Layers, Users, Clock, ArrowRight, Pencil } from 'lucide-react';
import { Button } from '../ui/Button';
export const WorkspaceCard = ({ workspace, onEdit, readOnly = false }) => {
    const navigate = useNavigate();
    const getTypeIcon = (type) => {
        switch (type) {
            case 'Code Editor':
                return _jsx(Code2, { className: "w-4 h-4 text-cyan-400" });
            case 'Whiteboard':
                return _jsx(Palette, { className: "w-4 h-4 text-purple-400" });
            case 'Code + Whiteboard':
                return _jsx(Layers, { className: "w-4 h-4 text-indigo-400" });
            default:
                return _jsx(Layers, { className: "w-4 h-4 text-cyan-400" });
        }
    };
    const isOnline = workspace.status === 'Active';
    return (_jsxs("div", { className: "electric-card rounded-2xl p-5 flex flex-col justify-between group", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-start justify-between gap-3 mb-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-slate-900 border border-cyan-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-md shadow-cyan-950", children: getTypeIcon(workspace.type) }), _jsxs("div", { children: [_jsx("h3", { className: "font-bold text-base text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-1", children: workspace.name }), _jsx("span", { className: "text-[11px] text-cyan-400 font-mono", children: workspace.code || `SYNC-${workspace.id}` })] })] }), _jsxs("div", { className: `
            flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0
            ${isOnline ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300 shadow-sm shadow-cyan-500/30' : 'bg-slate-900 border-slate-800 text-slate-400'}
          `, children: [_jsx("span", { className: `w-2 h-2 rounded-full ${isOnline ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'}` }), _jsx("span", { children: workspace.status })] })] }), _jsx("p", { className: "text-xs text-slate-400 leading-relaxed mb-4 line-clamp-2 min-h-[36px]", children: workspace.description }), workspace.tags && workspace.tags.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-1.5 mb-4", children: workspace.tags.map((tag) => (_jsx("span", { className: "text-[10px] font-medium bg-slate-900 text-cyan-200 px-2 py-0.5 rounded-md border border-cyan-500/20", children: tag }, tag))) }))] }), _jsxs("div", { className: "pt-4 border-t border-slate-800/80 space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between text-xs text-slate-400", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [getTypeIcon(workspace.type), _jsx("span", { className: "font-medium text-slate-300", children: workspace.type })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Users, { className: "w-3.5 h-3.5 text-slate-400" }), _jsxs("span", { children: [workspace.collaborators, " collaborators"] })] })] }), _jsxs("div", { className: "flex items-center justify-between gap-2 pt-1", children: [_jsxs("div", { className: "flex items-center gap-1 text-[11px] text-slate-400", children: [_jsx(Clock, { className: "w-3 h-3" }), _jsxs("span", { children: ["Updated ", workspace.lastUpdated] })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => navigate(`/workspaces/${workspace.id}`), className: "group-hover:bg-cyan-500 group-hover:text-slate-950 group-hover:border-cyan-400 transition-all duration-200 font-bold", children: [_jsx("span", { children: "Open Workspace" }), _jsx(ArrowRight, { className: "w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" })] }), !readOnly && (_jsxs("button", { type: "button", onClick: () => onEdit(workspace), className: "inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-500/50 hover:text-cyan-300", title: `Edit ${workspace.name}`, children: [_jsx(Pencil, { className: "h-3.5 w-3.5" }), "Edit"] }))] })] })] }));
};
