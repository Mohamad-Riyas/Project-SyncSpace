export type CollaboratorStatus = 'online' | 'idle' | 'offline';
export type CollaboratorActivity = 'coding' | 'drawing' | 'idle';

export interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  status: CollaboratorStatus;
  activity?: CollaboratorActivity;
}
