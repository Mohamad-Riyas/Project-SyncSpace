import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { WelcomeSection } from '../components/dashboard/WelcomeSection';
import { StatsCard } from '../components/dashboard/StatsCard';
import { WorkspaceGrid } from '../components/dashboard/WorkspaceGrid';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { CreateWorkspaceModal } from '../components/modals/CreateWorkspaceModal';
import { JoinWorkspaceModal } from '../components/modals/JoinWorkspaceModal';
import { EditWorkspaceModal } from '../components/modals/EditWorkspaceModal';
import { initialWorkspaces, initialActivities } from '../data/mockData';
import { getWorkspaceStore, saveActivity, saveWorkspace, subscribeToWorkspaceStore } from '../data/workspaceStore';
export const Dashboard = ({ readOnly = false }) => {
    const [store, setStore] = useState(() => getWorkspaceStore());
    const [workspaces, setWorkspaces] = useState(() => {
        const saved = getWorkspaceStore().workspaces;
        return saved.length > 0 ? saved : initialWorkspaces;
    });
    const [activities, setActivities] = useState(() => {
        const saved = getWorkspaceStore().activities;
        return saved.length > 0 ? saved : initialActivities;
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [joinModalOpen, setJoinModalOpen] = useState(false);
    const [workspaceToEdit, setWorkspaceToEdit] = useState(null);
    useEffect(() => subscribeToWorkspaceStore(() => {
        const next = getWorkspaceStore();
        setStore(next);
        setWorkspaces(next.workspaces);
        setActivities(next.activities);
    }), []);
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
        const newActivity = {
            id: Date.now(),
            message: `You created ${newWs.name}`,
            user: 'Riyas',
            time: 'Just now',
            type: 'create',
            workspaceName: newWs.name,
        };
        setActivities((prev) => [newActivity, ...prev]);
        saveActivity(newActivity);
    };
    const handleJoinWorkspace = (code) => {
        const newActivity = {
            id: Date.now(),
            message: `You joined workspace using code ${code}`,
            user: 'Riyas',
            time: 'Just now',
            type: 'join',
            workspaceName: code,
        };
        setActivities((prev) => [newActivity, ...prev]);
        saveActivity(newActivity);
    };
    const handleUpdateWorkspace = (updatedWorkspace) => {
        setWorkspaces((current) => current.map((workspace) => workspace.id === updatedWorkspace.id ? updatedWorkspace : workspace));
        saveWorkspace(updatedWorkspace);
        saveActivity({
            id: Date.now(),
            message: `You updated ${updatedWorkspace.name}`,
            user: 'Riyas',
            time: 'Just now',
            type: 'edit',
            workspaceName: updatedWorkspace.name,
        });
    };
    const activeWorkspaces = workspaces.filter((workspace) => workspace.status === 'Active').length;
    const activeSessions = store.sessions.filter((session) => !session.endedAt).length;
    const dashboardStats = [
        {
            id: 'active-workspaces', label: 'Active Workspaces', value: activeWorkspaces,
            change: `${workspaces.length} stored`, changeType: 'positive', iconName: 'FolderKanban',
        },
        {
            id: 'total-collaborators', label: 'Collaborators', value: workspaces.reduce((total, workspace) => total + workspace.collaborators, 0),
            change: `${activities.length} recorded events`, changeType: 'positive', iconName: 'Users',
        },
        {
            id: 'recent-sessions', label: 'Recent Sessions', value: store.sessions.length,
            change: `${activities.length} activity records`, changeType: 'neutral', iconName: 'Clock',
        },
        {
            id: 'active-now', label: 'Active Now', value: activeSessions,
            change: activeSessions > 0 ? 'Live session stored' : 'No open sessions', changeType: activeSessions > 0 ? 'positive' : 'neutral', iconName: 'Zap',
        },
    ];
    return (_jsxs(DashboardLayout, { title: "Dashboard", searchQuery: searchQuery, setSearchQuery: setSearchQuery, children: [_jsx(WelcomeSection, { onCreateWorkspace: () => setCreateModalOpen(true), onJoinWorkspace: () => setJoinModalOpen(true), readOnly: readOnly }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: dashboardStats.map((stat) => (_jsx(StatsCard, { stat: stat }, stat.id))) }), _jsx(WorkspaceGrid, { workspaces: workspaces, onCreateWorkspace: () => setCreateModalOpen(true), onEditWorkspace: setWorkspaceToEdit, searchQuery: searchQuery, readOnly: readOnly }), _jsx(RecentActivity, { activities: activities }), !readOnly && (_jsxs(_Fragment, { children: [_jsx(CreateWorkspaceModal, { isOpen: createModalOpen, onClose: () => setCreateModalOpen(false), onCreate: handleCreateWorkspace }), _jsx(JoinWorkspaceModal, { isOpen: joinModalOpen, onClose: () => setJoinModalOpen(false), onJoin: handleJoinWorkspace }), _jsx(EditWorkspaceModal, { workspace: workspaceToEdit, onClose: () => setWorkspaceToEdit(null), onSave: handleUpdateWorkspace })] }))] }));
};
