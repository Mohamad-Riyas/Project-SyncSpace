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
import type { Workspace, Activity } from '../types/workspace';

interface DashboardProps {
  readOnly?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ readOnly = false }) => {
  const [store, setStore] = useState(() => getWorkspaceStore());
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    const saved = getWorkspaceStore().workspaces;
    return saved.length > 0 ? saved : initialWorkspaces;
  });
  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = getWorkspaceStore().activities;
    return saved.length > 0 ? saved : initialActivities;
  });
  const [searchQuery, setSearchQuery] = useState('');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [workspaceToEdit, setWorkspaceToEdit] = useState<Workspace | null>(null);

  useEffect(() => subscribeToWorkspaceStore(() => {
    const next = getWorkspaceStore();
    setStore(next);
    setWorkspaces(next.workspaces);
    setActivities(next.activities);
  }), []);

  const handleCreateWorkspace = (
    newWsData: Omit<Workspace, 'id' | 'collaborators' | 'lastUpdated' | 'status'>
  ) => {
    const newWs: Workspace = {
      ...newWsData,
      id: Date.now(),
      collaborators: 1,
      lastUpdated: 'Just now',
      status: 'Active',
    };

    setWorkspaces((prev) => [newWs, ...prev]);
    saveWorkspace(newWs);

    const newActivity: Activity = {
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

  const handleJoinWorkspace = (code: string) => {
    const newActivity: Activity = {
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

  const handleUpdateWorkspace = (updatedWorkspace: Workspace) => {
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
      change: `${workspaces.length} stored`, changeType: 'positive' as const, iconName: 'FolderKanban' as const,
    },
    {
      id: 'total-collaborators', label: 'Collaborators', value: workspaces.reduce((total, workspace) => total + workspace.collaborators, 0),
      change: `${activities.length} recorded events`, changeType: 'positive' as const, iconName: 'Users' as const,
    },
    {
      id: 'recent-sessions', label: 'Recent Sessions', value: store.sessions.length,
      change: `${activities.length} activity records`, changeType: 'neutral' as const, iconName: 'Clock' as const,
    },
    {
      id: 'active-now', label: 'Active Now', value: activeSessions,
      change: activeSessions > 0 ? 'Live session stored' : 'No open sessions', changeType: activeSessions > 0 ? 'positive' as const : 'neutral' as const, iconName: 'Zap' as const,
    },
  ];

  return (
    <DashboardLayout
      title="Dashboard"
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
    >
      {/* 1. Thunder Radiation Welcome Section */}
      <WelcomeSection
        onCreateWorkspace={() => setCreateModalOpen(true)}
        onJoinWorkspace={() => setJoinModalOpen(true)}
        readOnly={readOnly}
      />

      {/* 2. Quick Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardStats.map((stat) => (
          <StatsCard key={stat.id} stat={stat} />
        ))}
      </div>

      {/* 3. Main Workspace Grid */}
      <WorkspaceGrid
        workspaces={workspaces}
        onCreateWorkspace={() => setCreateModalOpen(true)}
        onEditWorkspace={setWorkspaceToEdit}
        searchQuery={searchQuery}
        readOnly={readOnly}
      />

      {/* 4. Recent Activity Stream */}
      <RecentActivity activities={activities} />

      {/* Modals */}
      {!readOnly && (
        <>
          <CreateWorkspaceModal
            isOpen={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onCreate={handleCreateWorkspace}
          />

          <JoinWorkspaceModal
            isOpen={joinModalOpen}
            onClose={() => setJoinModalOpen(false)}
            onJoin={handleJoinWorkspace}
          />

          <EditWorkspaceModal
            workspace={workspaceToEdit}
            onClose={() => setWorkspaceToEdit(null)}
            onSave={handleUpdateWorkspace}
          />
        </>
      )}
    </DashboardLayout>
  );
};
