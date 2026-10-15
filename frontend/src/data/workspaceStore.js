const storageKey = 'syncspace.workspace-store.v1';
const storeEvent = 'syncspace:workspace-store-updated';
const emptyState = {
    workspaces: [],
    activities: [],
    sessions: [],
    documents: {},
    history: {},
    preferences: {},
    interviews: {},
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
            interviews: parsed.interviews && typeof parsed.interviews === 'object' ? parsed.interviews : {},
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
};
export const updateWorkspaceStore = (update) => {
    const next = update(readState());
    if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
        window.dispatchEvent(new CustomEvent(storeEvent));
    }
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
export const deleteWorkspaceData = (workspaceId) => {
    const id = String(workspaceId);
    const removeKey = (record) => {
        const next = { ...record };
        delete next[id];
        return next;
    };
    updateWorkspaceStore((current) => ({
        ...current,
        workspaces: current.workspaces.filter((workspace) => String(workspace.id) !== id),
        documents: removeKey(current.documents),
        history: removeKey(current.history),
        preferences: removeKey(current.preferences),
        interviews: removeKey(current.interviews),
        activities: current.activities.filter((activity) => String(activity.workspaceId) !== id),
        sessions: current.sessions.filter((session) => String(session.workspaceId) !== id),
    }));
};
export const getInterviewRecord = (workspaceId) => (
    readState().interviews[String(workspaceId)] ?? null
);
export const getWorkspaceStatus = (workspace) => {
    if (workspace?.kind !== 'interview') return workspace?.status || 'Offline';
    const interviewStatus = getInterviewRecord(workspace.id)?.status || 'scheduled';
    if (interviewStatus === 'active') return 'Active';
    if (['completed', 'ended'].includes(interviewStatus)) return 'Offline';
    if (interviewStatus === 'cancelled') return 'Cancelled';
    return 'Scheduled';
};
export const saveInterviewRecord = (workspaceId, record) => {
    updateWorkspaceStore((current) => ({
        ...current,
        interviews: {
            ...current.interviews,
            [String(workspaceId)]: {
                ...(current.interviews[String(workspaceId)] || {}),
                ...record,
                workspaceId,
                updatedAt: new Date().toISOString(),
            },
        },
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
