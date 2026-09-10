import { apiClient } from '../api/client';
const storageKey = 'syncspace.workspace-store.v1';
const storeEvent = 'syncspace:workspace-store-updated';
let serverWriteQueue = Promise.resolve();
const queueServerWrite = (write) => {
    serverWriteQueue = serverWriteQueue.then(write, write).catch(() => undefined);
};
const emptyState = {
    workspaces: [],
    activities: [],
    sessions: [],
    documents: {},
    history: {},
    preferences: {},
};
const readState = () => {
    if (typeof window === 'undefined')
        return emptyState;
    try {
        const saved = window.localStorage.getItem(storageKey);
        if (!saved)
            return emptyState;
        const parsed = JSON.parse(saved);
        return {
            workspaces: Array.isArray(parsed.workspaces) ? parsed.workspaces : [],
            activities: Array.isArray(parsed.activities) ? parsed.activities : [],
            sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
            documents: parsed.documents && typeof parsed.documents === 'object' ? parsed.documents : {},
            history: parsed.history && typeof parsed.history === 'object' ? parsed.history : {},
            preferences: parsed.preferences && typeof parsed.preferences === 'object' ? parsed.preferences : {},
        };
    }
    catch {
        return emptyState;
    }
};
export const getWorkspaceDocument = (workspaceId) => (readState().documents[String(workspaceId)] ?? {});
export const saveWorkspaceDocument = (workspaceId, document) => {
    updateWorkspaceStore((current) => ({
        ...current,
        documents: {
            ...current.documents,
            [String(workspaceId)]: {
                ...current.documents[String(workspaceId)],
                ...document,
                updatedAt: new Date().toISOString(),
            },
        },
    }));
    queueServerWrite(() => apiClient.saveDocument(workspaceId, document));
};
export const getWorkspaceStore = () => readState();
export const getWorkspaceHistory = (workspaceId) => (readState().history[String(workspaceId)] ?? []);
export const saveWorkspaceHistory = (workspaceId, entry) => {
    updateWorkspaceStore((current) => ({
        ...current,
        history: {
            ...current.history,
            [String(workspaceId)]: [
                { ...entry, id: `${workspaceId}-${Date.now()}`, createdAt: new Date().toISOString() },
                ...(current.history[String(workspaceId)] ?? []),
            ].slice(0, 100),
        },
    }));
    queueServerWrite(() => apiClient.addHistory(workspaceId, entry));
};
export const clearWorkspaceHistory = (workspaceId) => {
    updateWorkspaceStore((current) => ({
        ...current,
        history: { ...current.history, [String(workspaceId)]: [] },
    }));
};
export const getWorkspacePreferences = (workspaceId) => (readState().preferences[String(workspaceId)] ?? { splitRatio: 50 });
export const saveWorkspacePreferences = (workspaceId, preferences) => {
    updateWorkspaceStore((current) => ({
        ...current,
        preferences: { ...current.preferences, [String(workspaceId)]: preferences },
    }));
    queueServerWrite(() => apiClient.savePreferences(workspaceId, preferences));
};
export const updateWorkspaceStore = (update) => {
    const next = update(readState());
    if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
        window.dispatchEvent(new CustomEvent(storeEvent));
    }
    queueServerWrite(() => apiClient.saveState(next));
    return next;
};
export const subscribeToWorkspaceStore = (listener) => {
    if (typeof window === 'undefined')
        return () => undefined;
    const handleUpdate = () => listener();
    window.addEventListener(storeEvent, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
        window.removeEventListener(storeEvent, handleUpdate);
        window.removeEventListener('storage', handleUpdate);
    };
};
export const saveWorkspace = (workspace) => {
    updateWorkspaceStore((current) => ({
        ...current,
        workspaces: [workspace, ...current.workspaces.filter((item) => item.id !== workspace.id)],
    }));
};
export const saveActivity = (activity) => {
    updateWorkspaceStore((current) => ({
        ...current,
        activities: [activity, ...current.activities].slice(0, 100),
    }));
};
export const startWorkspaceSession = (workspaceId, workspaceName) => {
    const session = {
        id: `${workspaceId}-${Date.now()}`,
        workspaceId,
        workspaceName,
        startedAt: new Date().toISOString(),
    };
    updateWorkspaceStore((current) => ({
        ...current,
        sessions: [...current.sessions, session],
    }));
    return session.id;
};
export const endWorkspaceSession = (sessionId) => {
    updateWorkspaceStore((current) => ({
        ...current,
        sessions: current.sessions.map((session) => (session.id === sessionId && !session.endedAt
            ? { ...session, endedAt: new Date().toISOString() }
            : session)),
    }));
};
