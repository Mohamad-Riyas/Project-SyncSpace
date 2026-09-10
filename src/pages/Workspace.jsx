import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WorkspaceHeader from '../components/WorkspaceHeader';
import WorkspaceSidebar from '../components/WorkspaceSidebar';
import Whiteboard from '../components/Whiteboard';
import CodeEditor from '../components/CodeEditor';
import UsersPanel from '../components/UsersPanel';
import HistoryPanel from '../components/HistoryTemp';
import SettingsPanel from '../components/SettingsPanel';
import { clearWorkspaceHistory, getWorkspaceHistory, getWorkspacePreferences, getWorkspaceStore, saveWorkspace, saveWorkspaceHistory, saveWorkspacePreferences } from '../data/workspaceStore';
import './Workspace.css';
export const WorkspacePage = () => {
    const { id = 'workspace' } = useParams();
    const navigate = useNavigate();
    const workspace = getWorkspaceStore().workspaces.find((item) => item.id.toString() === id);
    const workspaceId = Number(id) || 0;
    const fallbackWorkspace = { id: workspaceId, name: `Workspace ${id}`, description: 'Collaborative workspace', collaborators: 1, lastUpdated: 'Just now', status: 'Active', type: 'Code + Whiteboard', owner: 'You' };
    const [currentWorkspace, setCurrentWorkspace] = useState(workspace || fallbackWorkspace);
    const workspaceType = currentWorkspace.type;
    const hasWhiteboard = workspaceType === 'Whiteboard' || workspaceType === 'Code + Whiteboard';
    const hasCodeEditor = workspaceType === 'Code Editor' || workspaceType === 'Code + Whiteboard';
    const hasBothTools = hasWhiteboard && hasCodeEditor;
    const defaultTab = hasWhiteboard ? 'whiteboard' : 'code';
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [splitRatio, setSplitRatio] = useState(() => getWorkspacePreferences(workspaceId).splitRatio);
    const [historyEntries, setHistoryEntries] = useState(() => getWorkspaceHistory(workspaceId));
    const visibleTabs = [
        'workspace',
        ...(hasWhiteboard ? ['whiteboard'] : []),
        ...(hasCodeEditor ? ['code'] : []),
        'users',
        'history',
        'settings',
    ];
    const safeActiveTab = visibleTabs.includes(activeTab) ? activeTab : defaultTab;
    const recordActivity = (action, source) => {
        saveWorkspaceHistory(workspaceId, { action, source });
        setHistoryEntries(getWorkspaceHistory(workspaceId));
    };
    const handleAddUser = (user) => {
        const existingUsers = currentWorkspace.collaboratorList || [
            { id: 'owner', name: currentWorkspace.owner || 'You', role: 'Owner', status: 'online' },
        ];
        const nextWorkspace = {
            ...currentWorkspace,
            collaboratorList: [...existingUsers, user],
            collaborators: existingUsers.length + 1,
            lastUpdated: 'Just now',
        };
        setCurrentWorkspace(nextWorkspace);
        saveWorkspace(nextWorkspace);
        recordActivity(`${user.name} joined the workspace`, 'workspace');
    };
    const handleDownload = () => {
        const exportData = {
            workspace: currentWorkspace,
            document: getWorkspaceStore().documents[String(workspaceId)] || {},
            history: getWorkspaceHistory(workspaceId),
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${currentWorkspace.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'syncspace-workspace'}.json`;
        link.click();
        URL.revokeObjectURL(url);
        recordActivity('Downloaded the workspace project', 'workspace');
    };
    const handleSplitRatioChange = (value) => {
        setSplitRatio(value);
        saveWorkspacePreferences(workspaceId, { splitRatio: value });
    };
    const showingManagementPanel = ['users', 'history', 'settings'].includes(safeActiveTab);
    return (_jsxs("div", { className: "workspace", "data-active-tab": safeActiveTab, children: [_jsx(WorkspaceHeader, { roomId: id, workspaceName: currentWorkspace.name, workspaceType: workspaceType, onLeave: () => navigate('/dashboard') }), _jsxs("div", { className: "workspace-body", children: [_jsx(WorkspaceSidebar, { activeTab: safeActiveTab, setActiveTab: setActiveTab, visibleTabs: visibleTabs }), _jsxs("main", { className: `workspace-main ${showingManagementPanel ? 'workspace-main-single' : ''}`, style: { gridTemplateColumns: showingManagementPanel || !hasBothTools ? '1fr' : `${splitRatio}fr ${100 - splitRatio}fr` }, children: [safeActiveTab === 'users' && _jsx(UsersPanel, { workspace: currentWorkspace, onAddUser: handleAddUser }), safeActiveTab === 'history' && _jsx(HistoryPanel, { entries: historyEntries, onClear: () => { clearWorkspaceHistory(workspaceId); setHistoryEntries([]); } }), safeActiveTab === 'settings' && _jsx(SettingsPanel, { splitRatio: splitRatio, hasBothTools: hasBothTools, onSplitRatioChange: handleSplitRatioChange, onDownload: handleDownload }), !showingManagementPanel && hasWhiteboard && (_jsxs("section", { className: "whiteboard-panel", "data-panel": "whiteboard", children: [_jsxs("div", { className: "panel-title", children: ["Whiteboard ", _jsx("span", { children: "Visual workspace" })] }), _jsx(Whiteboard, { workspaceId: workspaceId, onActivity: recordActivity })] })), !showingManagementPanel && hasCodeEditor && (_jsxs("section", { className: "code-panel", "data-panel": "code", children: [_jsxs("div", { className: "panel-title", children: ["Code Editor ", _jsx("span", { children: "Project files" })] }), _jsx(CodeEditor, { workspaceId: workspaceId, onActivity: recordActivity })] }))] })] })] }));
};
