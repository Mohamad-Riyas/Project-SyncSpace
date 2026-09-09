import type { Activity, Workspace } from '../types/workspace';
import type { EditorFile } from '../types/editor';
import type { WhiteboardObject } from '../types/whiteboard';
import { apiClient } from '../api/client';

export interface WorkspaceSession {
  id: string;
  workspaceId: number;
  workspaceName: string;
  startedAt: string;
  endedAt?: string;
}

export interface WorkspaceHistoryEntry {
  id: string;
  action: string;
  source: 'code' | 'whiteboard' | 'workspace';
  createdAt: string;
}

export interface WorkspacePreferences {
  splitRatio: number;
}

export interface WorkspaceStoreState {
  workspaces: Workspace[];
  activities: Activity[];
  sessions: WorkspaceSession[];
  documents: Record<string, WorkspaceDocument>;
  history: Record<string, WorkspaceHistoryEntry[]>;
  preferences: Record<string, WorkspacePreferences>;
}

export interface WorkspaceDocument {
  files?: EditorFile[];
  folders?: string[];
  whiteboard?: WhiteboardObject[];
  whiteboardState?: {
    rectangles?: unknown[];
    circles?: unknown[];
    lines?: unknown[];
    freehandLines?: unknown[];
    texts?: unknown[];
  };
  updatedAt?: string;
}

const storageKey = 'syncspace.workspace-store.v1';
const storeEvent = 'syncspace:workspace-store-updated';
let serverWriteQueue: Promise<unknown> = Promise.resolve();

const queueServerWrite = (write: () => Promise<unknown>) => {
  serverWriteQueue = serverWriteQueue.then(write, write).catch(() => undefined);
};

const emptyState: WorkspaceStoreState = {
  workspaces: [],
  activities: [],
  sessions: [],
  documents: {},
  history: {},
  preferences: {},
};

const readState = (): WorkspaceStoreState => {
  if (typeof window === 'undefined') return emptyState;

  try {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return emptyState;
    const parsed = JSON.parse(saved) as Partial<WorkspaceStoreState>;
    return {
      workspaces: Array.isArray(parsed.workspaces) ? parsed.workspaces : [],
      activities: Array.isArray(parsed.activities) ? parsed.activities : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      documents: parsed.documents && typeof parsed.documents === 'object' ? parsed.documents : {},
      history: parsed.history && typeof parsed.history === 'object' ? parsed.history : {},
      preferences: parsed.preferences && typeof parsed.preferences === 'object' ? parsed.preferences : {},
    };
  } catch {
    return emptyState;
  }
};

export const getWorkspaceDocument = (workspaceId: number): WorkspaceDocument => (
  readState().documents[String(workspaceId)] ?? {}
);

export const saveWorkspaceDocument = (workspaceId: number, document: WorkspaceDocument) => {
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

export const getWorkspaceStore = (): WorkspaceStoreState => readState();

export const getWorkspaceHistory = (workspaceId: number): WorkspaceHistoryEntry[] => (
  readState().history[String(workspaceId)] ?? []
);

export const saveWorkspaceHistory = (workspaceId: number, entry: Omit<WorkspaceHistoryEntry, 'id' | 'createdAt'>) => {
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

export const clearWorkspaceHistory = (workspaceId: number) => {
  updateWorkspaceStore((current) => ({
    ...current,
    history: { ...current.history, [String(workspaceId)]: [] },
  }));
};

export const getWorkspacePreferences = (workspaceId: number): WorkspacePreferences => (
  readState().preferences[String(workspaceId)] ?? { splitRatio: 50 }
);

export const saveWorkspacePreferences = (workspaceId: number, preferences: WorkspacePreferences) => {
  updateWorkspaceStore((current) => ({
    ...current,
    preferences: { ...current.preferences, [String(workspaceId)]: preferences },
  }));
  queueServerWrite(() => apiClient.savePreferences(workspaceId, preferences));
};

export const updateWorkspaceStore = (update: (current: WorkspaceStoreState) => WorkspaceStoreState) => {
  const next = update(readState());
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(storageKey, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(storeEvent));
  }
  queueServerWrite(() => apiClient.saveState(next));
  return next;
};

export const subscribeToWorkspaceStore = (listener: () => void) => {
  if (typeof window === 'undefined') return () => undefined;
  const handleUpdate = () => listener();
  window.addEventListener(storeEvent, handleUpdate);
  window.addEventListener('storage', handleUpdate);
  return () => {
    window.removeEventListener(storeEvent, handleUpdate);
    window.removeEventListener('storage', handleUpdate);
  };
};

export const saveWorkspace = (workspace: Workspace) => {
  updateWorkspaceStore((current) => ({
    ...current,
    workspaces: [workspace, ...current.workspaces.filter((item) => item.id !== workspace.id)],
  }));
};

export const saveActivity = (activity: Activity) => {
  updateWorkspaceStore((current) => ({
    ...current,
    activities: [activity, ...current.activities].slice(0, 100),
  }));
};

export const startWorkspaceSession = (workspaceId: number, workspaceName: string) => {
  const session: WorkspaceSession = {
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

export const endWorkspaceSession = (sessionId: string) => {
  updateWorkspaceStore((current) => ({
    ...current,
    sessions: current.sessions.map((session) => (
      session.id === sessionId && !session.endedAt
        ? { ...session, endedAt: new Date().toISOString() }
        : session
    )),
  }));
};
