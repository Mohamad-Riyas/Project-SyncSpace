import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Code2, Palette, Layers } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
export const CreateWorkspaceModal = ({ isOpen, onClose, onCreate, }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('Code + Whiteboard');
    const [error, setError] = useState('');
    const { showToast } = useToast();
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Workspace name is required.');
            showToast('Workspace name is required', 'error');
            return;
        }
        const randomCode = `SYNC-${Math.floor(1000 + Math.random() * 9000)}`;
        onCreate({
            name: name.trim(),
            description: description.trim() || 'Real-time electric collaborative workspace session.',
            type,
            code: randomCode,
            owner: 'Riyas',
            tags: [type.replace(' + ', '-')],
        });
        showToast(`Workspace "${name.trim()}" created successfully!`, 'success');
        setName('');
        setDescription('');
        setType('Code + Whiteboard');
        setError('');
        onClose();
    };
    const typesConfig = [
        {
            type: 'Code + Whiteboard',
            label: 'Code + Whiteboard',
            desc: 'Full hybrid workspace with Monaco code editor & interactive canvas.',
            icon: _jsx(Layers, { className: "w-4 h-4 text-cyan-400" }),
        },
        {
            type: 'Code Editor',
            label: 'Code Editor',
            desc: 'Focused multi-language editor for pair programming.',
            icon: _jsx(Code2, { className: "w-4 h-4 text-blue-400" }),
        },
        {
            type: 'Whiteboard',
            label: 'Whiteboard',
            desc: 'Visual brainstorming canvas and diagramming workspace.',
            icon: _jsx(Palette, { className: "w-4 h-4 text-purple-400" }),
        },
    ];
    return (_jsx(Modal, { isOpen: isOpen, onClose: onClose, title: "Create New Workspace", subtitle: "Set up a real-time room for electric code & whiteboard collaboration.", maxWidth: "md", children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [_jsxs("div", { children: [_jsxs("label", { htmlFor: "ws-name", className: "block text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-2", children: ["Workspace Name ", _jsx("span", { className: "text-rose-400", children: "*" })] }), _jsx("input", { id: "ws-name", type: "text", placeholder: "e.g. Project Helios Architecture", value: name, onChange: (e) => {
                                setName(e.target.value);
                                if (error)
                                    setError('');
                            }, className: `
              w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all
              ${error ? 'border-rose-500/80 focus:ring-rose-500' : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/20'}
            `, autoFocus: true }), error && _jsx("p", { className: "text-xs text-rose-400 mt-1.5", children: error })] }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "ws-desc", className: "block text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-2", children: ["Description ", _jsx("span", { className: "text-slate-400 font-normal lowercase", children: "(optional)" })] }), _jsx("textarea", { id: "ws-desc", rows: 3, placeholder: "Briefly describe what your team will work on...", value: description, onChange: (e) => setDescription(e.target.value), className: "w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-2", children: ["Workspace Type ", _jsx("span", { className: "text-rose-400", children: "*" })] }), _jsx("div", { className: "space-y-2.5", children: typesConfig.map((item) => {
                                const isSelected = type === item.type;
                                return (_jsxs("div", { onClick: () => setType(item.type), className: `
                    flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200
                    ${isSelected ? 'bg-cyan-950/60 border-cyan-500 text-slate-100 shadow-md shadow-cyan-950' : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'}
                  `, children: [_jsx("div", { className: "mt-0.5 shrink-0", children: item.icon }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm font-semibold text-slate-200", children: item.label }), _jsx("input", { type: "radio", name: "workspaceType", checked: isSelected, onChange: () => setType(item.type), className: "text-cyan-500 focus:ring-cyan-500" })] }), _jsx("p", { className: "text-xs text-slate-400 mt-0.5", children: item.desc })] })] }, item.type));
                            }) })] }), _jsxs("div", { className: "flex items-center justify-end gap-3 pt-4 border-t border-slate-800", children: [_jsx(Button, { type: "button", variant: "outline", onClick: onClose, children: "Cancel" }), _jsx(Button, { type: "submit", variant: "thunder", children: "Create Workspace" })] })] }) }));
};
