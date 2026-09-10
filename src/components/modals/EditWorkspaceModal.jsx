import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Code2, Layers, Palette } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
const workspaceTypes = [
    { value: 'Code Editor', label: 'Code Editor', description: 'Focused multi-language coding room.', icon: _jsx(Code2, { className: "h-4 w-4 text-cyan-400" }) },
    { value: 'Whiteboard', label: 'Whiteboard', description: 'Visual planning and diagramming room.', icon: _jsx(Palette, { className: "h-4 w-4 text-violet-400" }) },
    { value: 'Code + Whiteboard', label: 'Code + Whiteboard', description: 'Hybrid room with both tools.', icon: _jsx(Layers, { className: "h-4 w-4 text-indigo-400" }) },
];
export const EditWorkspaceModal = ({ workspace, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('Code + Whiteboard');
    const [tags, setTags] = useState('');
    const { showToast } = useToast();
    useEffect(() => {
        if (!workspace)
            return;
        setName(workspace.name);
        setDescription(workspace.description);
        setType(workspace.type);
        setTags(workspace.tags?.join(', ') ?? '');
    }, [workspace]);
    const handleSubmit = (event) => {
        event.preventDefault();
        if (!workspace || !name.trim()) {
            showToast('Workspace name is required', 'error');
            return;
        }
        onSave({
            ...workspace,
            name: name.trim(),
            description: description.trim() || 'Collaborative SyncSpace workspace.',
            type,
            tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
            lastUpdated: 'Just now',
        });
        showToast('Workspace updated', 'success');
        onClose();
    };
    return (_jsx(Modal, { isOpen: Boolean(workspace), onClose: onClose, title: "Edit Workspace", subtitle: "Update the workspace details and collaboration mode.", maxWidth: "md", children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "edit-ws-name", className: "mb-2 block text-xs font-semibold uppercase tracking-wider text-cyan-300", children: "Workspace Name" }), _jsx("input", { id: "edit-ws-name", value: name, onChange: (event) => setName(event.target.value), className: "w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500", autoFocus: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "edit-ws-description", className: "mb-2 block text-xs font-semibold uppercase tracking-wider text-cyan-300", children: "Description" }), _jsx("textarea", { id: "edit-ws-description", rows: 3, value: description, onChange: (event) => setDescription(event.target.value), className: "w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500" })] }), _jsxs("div", { children: [_jsx("span", { className: "mb-2 block text-xs font-semibold uppercase tracking-wider text-cyan-300", children: "Workspace Type" }), _jsx("div", { className: "space-y-2", children: workspaceTypes.map((option) => (_jsxs("label", { className: `flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${type === option.value ? 'border-cyan-500 bg-cyan-950/50' : 'border-slate-800 bg-slate-950/60'}`, children: [_jsx("input", { type: "radio", name: "editWorkspaceType", value: option.value, checked: type === option.value, onChange: () => setType(option.value) }), option.icon, _jsxs("span", { className: "flex-1", children: [_jsx("span", { className: "block text-sm font-semibold text-slate-100", children: option.label }), _jsx("span", { className: "block text-xs text-slate-400", children: option.description })] })] }, option.value))) })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "edit-ws-tags", className: "mb-2 block text-xs font-semibold uppercase tracking-wider text-cyan-300", children: "Tags" }), _jsx("input", { id: "edit-ws-tags", value: tags, onChange: (event) => setTags(event.target.value), placeholder: "frontend, planning, api", className: "w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500" })] }), _jsxs("div", { className: "flex justify-end gap-3 border-t border-slate-800 pt-4", children: [_jsx(Button, { type: "button", variant: "outline", onClick: onClose, children: "Cancel" }), _jsx(Button, { type: "submit", variant: "thunder", children: "Save Changes" })] })] }) }));
};
