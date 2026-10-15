export const WorkspaceType = {
  CODE_EDITOR: 'Code Editor',
  WHITEBOARD: 'Whiteboard',
  CODE_AND_WHITEBOARD: 'Code + Whiteboard',
};

/** Workspace category: general collaboration vs technical interview. Separate from tool type. */
export const WorkspaceKind = {
  GENERAL: 'general',
  INTERVIEW: 'interview',
};

export const isInterviewWorkspace = (workspace) =>
  workspace?.kind === WorkspaceKind.INTERVIEW;

export const getWorkspacePath = (workspace) =>
  isInterviewWorkspace(workspace)
    ? `/interview/${workspace.id}`
    : `/workspaces/${workspace.id}`;

export const WorkspaceStatus = {
  ACTIVE: 'Active',
  OFFLINE: 'Offline',
};

export const ActivityType = {
  JOIN: 'join',
  EDIT: 'edit',
  WHITEBOARD: 'whiteboard',
  CREATE: 'create',
};

export const DashboardIconName = {
  FOLDER_KANBAN: 'FolderKanban',
  USERS: 'Users',
  CLOCK: 'Clock',
  ZAP: 'Zap',
};
