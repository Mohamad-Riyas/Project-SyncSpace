export type WorkspaceType =
  | "Code Editor"
  | "Whiteboard"
  | "Code + Whiteboard";

export type WorkspaceStatus = "Active" | "Offline";

import type { Collaborator } from './collaborator';

export interface Workspace {
  id: number;
  name: string;
  description: string;
  collaborators: number;
  collaboratorList?: Collaborator[];
  lastUpdated: string;
  status: WorkspaceStatus;
  type: WorkspaceType;
  code?: string;
  tags?: string[];
  owner?: string;
}

export interface Activity {
  id: number;
  message: string;
  user?: string;
  time: string;
  type: "join" | "edit" | "whiteboard" | "create";
  workspaceName?: string;
  avatarUrl?: string;
}

export interface DashboardStat {
  id: string;
  label: string;
  value: number | string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  iconName: "FolderKanban" | "Users" | "Clock" | "Zap";
}
