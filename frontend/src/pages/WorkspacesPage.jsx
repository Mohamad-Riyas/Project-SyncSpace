import { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { WorkspaceGrid } from '../components/dashboard/WorkspaceGrid';
import { CreateWorkspaceModal } from '../components/modals/CreateWorkspaceModal';
import { EditWorkspaceModal } from '../components/modals/EditWorkspaceModal';
import { JoinWorkspaceModal } from '../components/modals/JoinWorkspaceModal';
import { Button } from '../components/ui/Button';
import { Plus, Zap, Link2, RefreshCw } from 'lucide-react';
import { workspaceApi } from '../api/client';
import { getWorkspacePath } from '../types/workspace';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { deleteWorkspaceData } from '../data/workspaceStore';

export const WorkspacesPage = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { showToast } = useToast();
  const [workspaces, setWorkspaces] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [workspaceToEdit, setWorkspaceToEdit] = useState(null);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loadWorkspaces = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const data = await workspaceApi.list();
        if (!cancelled) setWorkspaces(Array.isArray(data?.workspaces) ? data.workspaces : []);
      } catch (err) {
        if (!cancelled) {
          const message = err.message || 'Could not load workspaces';
          setLoadError(message);
          showToast(message, 'error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadWorkspaces();
    return () => { cancelled = true; };
  }, [reloadKey, showToast]);

  const handleCreateWorkspace = async (data) => {
    try {
      const { workspace } = await workspaceApi.create(data);
      setWorkspaces((prev) => [workspace, ...prev]);
      navigate(getWorkspacePath(workspace));
    } catch (err) { showToast(err.message || 'Could not create workspace', 'error'); }
  };

  const handleJoinWorkspace = async (code) => { try { const { workspace } = await workspaceApi.join(code); setWorkspaces((prev) => [workspace, ...prev.filter((x) => x.id !== workspace.id)]); setJoinModalOpen(false); navigate(getWorkspacePath(workspace)); return true; } catch (err) { showToast(err.message || 'Could not join workspace', 'error'); return false; } };

  const handleUpdateWorkspace = async (updatedWorkspace) => {
    try {
      const { workspace } = await workspaceApi.update(updatedWorkspace.id, updatedWorkspace);
      setWorkspaces((current) => current.map((item) => item.id === workspace.id ? workspace : item));
      setWorkspaceToEdit(null);
    } catch (err) { showToast(err.message || 'Could not update workspace', 'error'); }
  };

  const handleDeleteWorkspace = async (workspace) => {
    try {
      await workspaceApi.remove(workspace.id);
      deleteWorkspaceData(workspace.id);
      setWorkspaces((current) => current.filter((item) => item.id !== workspace.id));
      setWorkspaceToEdit(null);
      showToast('Workspace deleted', 'success');
    } catch (err) {
      showToast(err.message || 'Could not delete workspace', 'error');
      throw err;
    }
  };

  return (
    <DashboardLayout title="Workspaces" searchQuery={searchQuery} setSearchQuery={setSearchQuery}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">All Workspaces <Zap className="w-5 h-5 text-cyan-400" /></h2>
          <p className="text-sm text-slate-400">Live workspaces stored in MongoDB with secure share links.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {role === 'user' && <Button variant="outline" icon={<Link2 className="w-4 h-4" />} onClick={() => navigate('/interviews/join')}>Join Interview</Button>}
          <Button variant="outline" icon={<Link2 className="w-4 h-4" />} onClick={() => setJoinModalOpen(true)}>Join Workspace</Button>
          <Button variant="thunder" icon={<Plus className="w-4 h-4" />} onClick={() => setCreateModalOpen(true)}>Create Workspace</Button>
        </div>
      </div>
      {loading ? <div className="py-16 text-center text-slate-500">Loading your workspaces…</div> : loadError ? <div className="py-16 text-center"><p className="mb-4 text-sm text-rose-300">{loadError}</p><Button variant="outline" icon={<RefreshCw className="w-4 h-4" />} onClick={() => setReloadKey((key) => key + 1)}>Try again</Button></div> : <WorkspaceGrid workspaces={workspaces} onCreateWorkspace={() => setCreateModalOpen(true)} onEditWorkspace={setWorkspaceToEdit} searchQuery={searchQuery} />}
      <JoinWorkspaceModal isOpen={joinModalOpen} onClose={() => setJoinModalOpen(false)} onJoin={handleJoinWorkspace} />
      <CreateWorkspaceModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} onCreate={handleCreateWorkspace} />
      <EditWorkspaceModal key={workspaceToEdit?.id || 'closed'} workspace={workspaceToEdit} onClose={() => setWorkspaceToEdit(null)} onSave={handleUpdateWorkspace} onDelete={handleDeleteWorkspace} />
    </DashboardLayout>
  );
};
