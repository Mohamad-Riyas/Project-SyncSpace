import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { FolderPlus, SearchX } from 'lucide-react';
import { Button } from '../ui/Button';
export const EmptyState = ({ title = 'No workspaces yet', description = 'Create your first workspace and start collaborating with your team.', actionText = 'Create Workspace', onAction, isSearch = false, }) => {
    return (_jsxs("div", { className: "electric-card border-dashed rounded-3xl p-10 text-center flex flex-col items-center justify-center max-w-lg mx-auto space-y-4 my-8", children: [_jsx("div", { className: "w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950", children: isSearch ? _jsx(SearchX, { className: "w-7 h-7" }) : _jsx(FolderPlus, { className: "w-7 h-7" }) }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("h3", { className: "text-lg font-bold text-slate-100", children: title }), _jsx("p", { className: "text-sm text-slate-400 leading-relaxed max-w-sm", children: description })] }), onAction && (_jsx(Button, { variant: "thunder", size: "md", onClick: onAction, children: actionText }))] }));
};
