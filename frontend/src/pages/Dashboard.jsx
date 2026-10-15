import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { WelcomeSection } from '../components/dashboard/WelcomeSection';
import { StatsCard } from '../components/dashboard/StatsCard';
import { WorkspaceGrid } from '../components/dashboard/WorkspaceGrid';
import { CreateWorkspaceModal } from '../components/modals/CreateWorkspaceModal';
import { JoinWorkspaceModal } from '../components/modals/JoinWorkspaceModal';
import { EditWorkspaceModal } from '../components/modals/EditWorkspaceModal';
import { workspaceApi, interviewsApi, recordingsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getWorkspacePath } from '../types/workspace';
import { deleteWorkspaceData, getWorkspaceStatus } from '../data/workspaceStore';

export const Dashboard = ({ readOnly = false }) => {
  const navigate = useNavigate();
  const { isAuthenticated, role: userRole } = useAuth();
  const { showToast } = useToast();
  const [workspaces, setWorkspaces] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [workspaceToEdit, setWorkspaceToEdit] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (readOnly || !isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const [workspaceData, interviewData] = await Promise.all([workspaceApi.list(), interviewsApi.list()]);
      setWorkspaces(workspaceData.workspaces || []);
      setInterviews(interviewData.interviews || []);
      if (['admin', 'interviewer'].includes(userRole)) {
        const recordingData = await recordingsApi.list();
        setRecordings(recordingData.recordings || []);
      }
    } catch (err) {
      showToast(err.message || 'Could not load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [isAuthenticated, readOnly, userRole]);

  const handleCreateWorkspace = async (newWsData) => {
    try {
      const { workspace } = await workspaceApi.create(newWsData);
      setWorkspaces((prev) => [workspace, ...prev]);
      showToast(`Workspace "${workspace.name}" created`, 'success');
      navigate(getWorkspacePath(workspace));
    } catch (err) {
      showToast(err.message || 'Could not create workspace', 'error');
    }
  };

  const handleJoinWorkspace = async (code) => {
    try {
      const { workspace } = await workspaceApi.join(code);
      setWorkspaces((prev) => [workspace, ...prev.filter((item) => item.id !== workspace.id)]);
      showToast(`Joined ${workspace.name}`, 'success');
      navigate(getWorkspacePath(workspace));
      return true;
    } catch (err) {
      showToast(err.message || 'Workspace not found', 'error');
      return false;
    }
  };

  const handleUpdateWorkspace = async (updatedWorkspace) => {
    try {
      const { workspace } = await workspaceApi.update(updatedWorkspace.id, updatedWorkspace);
      setWorkspaces((current) => current.map((item) => item.id === workspace.id ? workspace : item));
      setWorkspaceToEdit(null);
      showToast('Workspace updated', 'success');
    } catch (err) {
      showToast(err.message || 'Could not update workspace', 'error');
    }
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

  const activeWorkspaces = workspaces.filter((workspace) => getWorkspaceStatus(workspace) === 'Active').length;
  const collaboratorTotal = workspaces.reduce((total, workspace) => total + (workspace.collaborators || 0), 0);
  const activeInterviews = interviews.filter((iv) => iv.status === 'active').length;

  const dashboardStats = [
    { id: 'active-workspaces', label: 'Active Workspaces', value: activeWorkspaces, change: `${workspaces.length} total`, changeType: 'positive', iconName: 'FolderKanban' },
    { id: 'collaborators', label: 'Collaborators', value: collaboratorTotal, change: 'Live workspaces', changeType: 'positive', iconName: 'Users' },
    { id: 'interviews', label: 'Interviews', value: interviews.length, change: `${activeInterviews} active now`, changeType: 'neutral', iconName: 'Clock' },
    { id: 'active-now', label: 'Active Now', value: activeInterviews, change: activeInterviews ? 'Live interviews' : 'No active interviews', changeType: activeInterviews ? 'positive' : 'neutral', iconName: 'Zap' },
  ];

  return (
    <DashboardLayout title="Dashboard" searchQuery={searchQuery} setSearchQuery={setSearchQuery}>
      <WelcomeSection onCreateWorkspace={() => setCreateModalOpen(true)} onJoinWorkspace={() => setJoinModalOpen(true)} readOnly={readOnly} showLaptop={!isAuthenticated} />
      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Loading live workspace data…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardStats.map((stat) => <StatsCard key={stat.id} stat={stat} />)}
          </div>
          <WorkspaceGrid workspaces={workspaces} onCreateWorkspace={() => setCreateModalOpen(true)} onEditWorkspace={setWorkspaceToEdit} searchQuery={searchQuery} readOnly={readOnly} />
          {['admin', 'interviewer'].includes(userRole) && (
            <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Interview Recordings</h2>
                  <p className="text-xs text-slate-500">Authorized recordings available from your interview sessions.</p>
                </div>
                <button type="button" className="text-xs text-cyan-300 hover:text-cyan-200" onClick={() => navigate('/recordings')}>View all</button>
              </div>
              <div className="space-y-2">
                {recordings.slice(0, 5).map((recording) => (
                  <div key={recording.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2.5">
                    <div><p className="text-sm text-slate-200">{recording.interviewTitle}</p><p className="text-[11px] text-slate-500">{new Date(recording.createdAt).toLocaleString()}</p></div>
                    <span className="text-[11px] text-emerald-400">{recording.status}</span>
                  </div>
                ))}
                {!recordings.length && <p className="text-sm text-slate-600">No recordings yet.</p>}
              </div>
            </section>
          )}
        </>
      )}

      {!readOnly && isAuthenticated && (
        <>
          <CreateWorkspaceModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} onCreate={handleCreateWorkspace} />
          <JoinWorkspaceModal isOpen={joinModalOpen} onClose={() => setJoinModalOpen(false)} onJoin={handleJoinWorkspace} />
          <EditWorkspaceModal key={workspaceToEdit?.id || 'closed'} workspace={workspaceToEdit} onClose={() => setWorkspaceToEdit(null)} onSave={handleUpdateWorkspace} onDelete={handleDeleteWorkspace} />
        </>
      )}
    </DashboardLayout>
  );
};
