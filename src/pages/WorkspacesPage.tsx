import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { WorkspaceGrid } from '../components/dashboard/WorkspaceGrid';
import { CreateWorkspaceModal } from '../components/modals/CreateWorkspaceModal';
import { initialWorkspaces } from '../data/mockData';
import type { Workspace } from '../types/workspace';
import { Button } from '../components/ui/Button';
import { Plus, Zap } from 'lucide-react';
import { getWorkspaceStore, saveWorkspace } from '../data/workspaceStore';
import { EditWorkspaceModal } from '../components/modals/EditWorkspaceModal';

export const WorkspacesPage: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    const saved = getWorkspaceStore().workspaces;
    return saved.length > 0 ? saved : initialWorkspaces;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [workspaceToEdit, setWorkspaceToEdit] = useState<Workspace | null>(null);

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
  };

  const handleUpdateWorkspace = (updatedWorkspace: Workspace) => {
    setWorkspaces((current) => current.map((workspace) => workspace.id === updatedWorkspace.id ? updatedWorkspace : workspace));
    saveWorkspace(updatedWorkspace);
  };

  return (
    <DashboardLayout
      title="Workspaces"
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span>All Workspaces</span>
            <Zap className="w-5 h-5 text-cyan-400" />
          </h2>
          <p className="text-sm text-slate-400">Manage all active team rooms and collaboration nodes</p>
        </div>
        <Button
          variant="thunder"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setCreateModalOpen(true)}
        >
          Create Workspace
        </Button>
      </div>

      <WorkspaceGrid
        workspaces={workspaces}
        onCreateWorkspace={() => setCreateModalOpen(true)}
        onEditWorkspace={setWorkspaceToEdit}
        searchQuery={searchQuery}
      />

      <CreateWorkspaceModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateWorkspace}
      />

      <EditWorkspaceModal
        workspace={workspaceToEdit}
        onClose={() => setWorkspaceToEdit(null)}
        onSave={handleUpdateWorkspace}
      />
    </DashboardLayout>
  );
};
