import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { WorkspaceGrid } from '../components/dashboard/WorkspaceGrid';
import { CreateWorkspaceModal } from '../components/modals/CreateWorkspaceModal';
import { initialWorkspaces } from '../data/mockData';
import { Button } from '../components/ui/Button';
import { Plus, Zap } from 'lucide-react';
import { getWorkspaceStore, saveWorkspace } from '../data/workspaceStore';
import { EditWorkspaceModal } from '../components/modals/EditWorkspaceModal';
export const WorkspacesPage = () => {
    const [workspaces, setWorkspaces] = useState(() => {
        const saved = getWorkspaceStore().workspaces;
        return saved.length > 0 ? saved : initialWorkspaces;
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [workspaceToEdit, setWorkspaceToEdit] = useState(null);
    const handleCreateWorkspace = (newWsData) => {
        const newWs = {
            ...newWsData,
            id: Date.now(),
            collaborators: 1,
            lastUpdated: 'Just now',
            status: 'Active',
        };
        setWorkspaces((prev) => [newWs, ...prev]);
        saveWorkspace(newWs);
    };
    const handleUpdateWorkspace = (updatedWorkspace) => {
        setWorkspaces((current) => current.map((workspace) => workspace.id === updatedWorkspace.id ? updatedWorkspace : workspace));
        saveWorkspace(updatedWorkspace);
    };
    return (_jsxs(DashboardLayout, { title: "Workspaces", searchQuery: searchQuery, setSearchQuery: setSearchQuery, children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-2xl font-bold text-slate-100 flex items-center gap-2", children: [_jsx("span", { children: "All Workspaces" }), _jsx(Zap, { className: "w-5 h-5 text-cyan-400" })] }), _jsx("p", { className: "text-sm text-slate-400", children: "Manage all active team rooms and collaboration nodes" })] }), _jsx(Button, { variant: "thunder", icon: _jsx(Plus, { className: "w-4 h-4" }), onClick: () => setCreateModalOpen(true), children: "Create Workspace" })] }), _jsx(WorkspaceGrid, { workspaces: workspaces, onCreateWorkspace: () => setCreateModalOpen(true), onEditWorkspace: setWorkspaceToEdit, searchQuery: searchQuery }), _jsx(CreateWorkspaceModal, { isOpen: createModalOpen, onClose: () => setCreateModalOpen(false), onCreate: handleCreateWorkspace }), _jsx(EditWorkspaceModal, { workspace: workspaceToEdit, onClose: () => setWorkspaceToEdit(null), onSave: handleUpdateWorkspace })] }));
};
