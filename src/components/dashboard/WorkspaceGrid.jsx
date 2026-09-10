import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { WorkspaceCard } from './WorkspaceCard';
import { EmptyState } from './EmptyState';
import { ArrowRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
export const WorkspaceGrid = ({ workspaces, onCreateWorkspace, onEditWorkspace, searchQuery = '', readOnly = false, }) => {
    const [activeFilter, setActiveFilter] = useState('All');
    const filteredWorkspaces = workspaces.filter((ws) => {
        const matchesSearch = ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ws.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (ws.code && ws.code.toLowerCase().includes(searchQuery.toLowerCase()));
        if (!matchesSearch)
            return false;
        if (activeFilter === 'Active')
            return ws.status === 'Active';
        if (activeFilter === 'Code Editor')
            return ws.type === 'Code Editor' || ws.type === 'Code + Whiteboard';
        if (activeFilter === 'Whiteboard')
            return ws.type === 'Whiteboard' || ws.type === 'Code + Whiteboard';
        return true;
    });
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2", children: [_jsx("span", { children: "Your Workspaces" }), _jsx(Zap, { className: "w-4 h-4 text-cyan-400" })] }), _jsx("p", { className: "text-xs text-slate-400", children: "Active electric rooms for real-time team collaboration" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "hidden md:flex items-center gap-1 p-1 bg-slate-950 border border-cyan-500/30 rounded-xl text-xs", children: ['All', 'Active', 'Code Editor', 'Whiteboard'].map((filter) => (_jsx("button", { onClick: () => setActiveFilter(filter), className: `
                  px-3 py-1.5 rounded-lg font-medium transition-all
                  ${activeFilter === filter ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}
                `, children: filter }, filter))) }), _jsxs(Link, { to: "/workspaces", className: "inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors", children: [_jsx("span", { children: "View All" }), _jsx(ArrowRight, { className: "w-3.5 h-3.5" })] })] })] }), filteredWorkspaces.length > 0 ? (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5", children: filteredWorkspaces.map((workspace) => (_jsx(WorkspaceCard, { workspace: workspace, onEdit: onEditWorkspace, readOnly: readOnly }, workspace.id))) })) : (_jsx(EmptyState, { isSearch: Boolean(searchQuery), title: searchQuery ? 'No matching workspaces found' : 'No workspaces yet', description: searchQuery
                    ? `No workspace matched "${searchQuery}". Try searching for another name or code.`
                    : 'Create your first workspace and start collaborating with your team.', actionText: searchQuery ? undefined : 'Create Workspace', onAction: searchQuery || readOnly ? undefined : onCreateWorkspace }))] }));
};
