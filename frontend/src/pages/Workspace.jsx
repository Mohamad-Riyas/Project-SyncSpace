import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { GripVertical } from 'lucide-react';
import WorkspaceHeader from '../components/WorkspaceHeader';
import WorkspaceSidebar from '../components/WorkspaceSidebar';
import Whiteboard from '../components/Whiteboard';
import CodeEditor from '../components/CodeEditor';
import UsersPanel from '../components/UsersPanel';
import HistoryPanel from '../components/HistoryTemp';
import SettingsPanel from '../components/SettingsPanel';
import { getWorkspaceHistory, getWorkspacePreferences, getWorkspaceStore, saveWorkspaceHistory, saveWorkspacePreferences } from '../data/workspaceStore';
import { isInterviewWorkspace } from '../types/workspace';
import { workspaceApi, getAccessToken, getGuestSession } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import './Workspace.css';

const MONGO_ID_RE = /^[a-f0-9]{24}$/i;

export const WorkspacePage = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, role } = useAuth();
  const localWorkspace = getWorkspaceStore().workspaces.find((item) => String(item.id) === String(id));
  const [currentWorkspace, setCurrentWorkspace] = useState(localWorkspace || { id, name: 'Loading workspace…', description: '', collaborators: 0, status: 'Active', type: 'Code + Whiteboard' });
  const [loading, setLoading] = useState(MONGO_ID_RE.test(String(id)));
  const workspaceId = id;
  const [activeTab, setActiveTab] = useState('workspace');
  const [splitRatio, setSplitRatio] = useState(() => getWorkspacePreferences(workspaceId).splitRatio);
  const splitRatioRef = useRef(splitRatio);
  const workspaceMainRef = useRef(null);
  const resizingRef = useRef(false);
  const [historyEntries, setHistoryEntries] = useState(() => getWorkspaceHistory(workspaceId));
  const [presence, setPresence] = useState([]);
  const currentUserId = user?.id || user?._id;
  const guestSession = user ? null : getGuestSession();
  const isGuest = Boolean(guestSession);
  const selfId = currentUserId || guestSession?.guestId;
  const homePath = isGuest ? '/' : '/dashboard';

  useEffect(() => {
    let cancelled = false;
    if (!MONGO_ID_RE.test(String(id))) { setLoading(false); return undefined; }
    workspaceApi.get(id).then(({ workspace }) => { if (!cancelled) setCurrentWorkspace(workspace); }).catch((err) => { showToast(err.message || 'Could not load workspace', 'error'); navigate(homePath); }).finally(() => { if (!cancelled) setLoading(false); });
    workspaceApi.getActivity(id).then(({ entries }) => { if (!cancelled) setHistoryEntries(entries || []); }).catch((err) => showToast(err.message || 'Could not load workspace history', 'error'));
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001', { auth: { token: getAccessToken() } });
    socket.on('connect', () => socket.emit('join-workspace', id));
    socket.on('workspace:access-denied', () => {
      if (cancelled) return;
      showToast('You no longer have access to this workspace', 'error');
      navigate(homePath);
    });
    socket.on('workspace:updated', (workspace) => {
      if (cancelled) return;
      const stillMember = isGuest || role === 'admin' || String(workspace.owner) === String(currentUserId) ||
        (workspace.collaboratorList || []).some((member) => String(member.id) === String(currentUserId));
      if (!stillMember) {
        socket.emit('leave-workspace', id);
        showToast('You no longer have access to this workspace', 'error');
        navigate(homePath);
        return;
      }
      setCurrentWorkspace(workspace);
    });
    socket.on('workspace:activity', (entry) => {
      if (!cancelled) setHistoryEntries((entries) => [entry, ...entries.filter((item) => item._id !== entry._id)]);
    });
    socket.on('workspace:presence', (participants) => { if (!cancelled) setPresence(participants); });
    socket.on('workspace:file-updated', (file) => {
      if (!cancelled) window.dispatchEvent(new CustomEvent('syncspace:file-updated', { detail: file }));
    });
    socket.on('workspace:file-deleted', (payload) => {
      if (!cancelled) window.dispatchEvent(new CustomEvent('syncspace:file-deleted', { detail: payload }));
    });
    return () => { cancelled = true; socket.disconnect(); };
  }, [id, currentUserId, role, isGuest, navigate, showToast]);

  const workspaceType = currentWorkspace.type || 'Code + Whiteboard';
  const hasWhiteboard = workspaceType !== 'Code Editor';
  const hasCodeEditor = workspaceType !== 'Whiteboard';
  const hasBothTools = hasWhiteboard && hasCodeEditor;
  const defaultTab = hasWhiteboard ? 'whiteboard' : 'code';
  const visibleTabs = useMemo(() => ['workspace', ...(hasWhiteboard ? ['whiteboard'] : []), ...(hasCodeEditor ? ['code'] : []), 'users', 'history', 'settings'], [hasWhiteboard, hasCodeEditor]);
  const safeActiveTab = visibleTabs.includes(activeTab) ? activeTab : defaultTab;

  const canManage = role === 'admin' || String(currentWorkspace.owner) === String(currentUserId) ||
    (currentWorkspace.collaboratorList || []).some((member) => String(member.id) === String(currentUserId) && member.role === 'owner');
  const recordActivity = (action, source) => {
    if (!MONGO_ID_RE.test(String(workspaceId))) {
      saveWorkspaceHistory(workspaceId, { action, source });
      setHistoryEntries(getWorkspaceHistory(workspaceId));
      return;
    }
    workspaceApi.recordActivity(workspaceId, action, source).then(({ entry }) => {
      setHistoryEntries((entries) => [entry, ...entries.filter((item) => item._id !== entry._id)]);
    }).catch((err) => showToast(err.message || 'Could not save workspace activity', 'error'));
  };
  const handleMemberRoleChange = async (member, nextRole) => {
    try {
      const { workspace } = await workspaceApi.updateMember(workspaceId, member.id, nextRole);
      setCurrentWorkspace(workspace);
    } catch (err) {
      showToast(err.message || 'Could not update member access', 'error');
    }
  };
  const handleRemoveMember = async (member) => {
    if (!window.confirm(`Remove ${member.name} from this workspace?`)) return;
    try {
      const { workspace } = await workspaceApi.removeMember(workspaceId, member.id);
      setCurrentWorkspace(workspace);
      showToast(`${member.name} removed from workspace`, 'success');
    } catch (err) {
      showToast(err.message || 'Could not remove workspace member', 'error');
    }
  };
  const handleDownload = () => { const exportData = { workspace: currentWorkspace, document: getWorkspaceStore().documents[String(workspaceId)] || {}, history: historyEntries }; const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${currentWorkspace.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'workspace'}.json`; a.click(); URL.revokeObjectURL(url); recordActivity('Downloaded workspace project', 'workspace'); };
  const showingManagement = ['users', 'history', 'settings'].includes(safeActiveTab);
  const canResizePanels = safeActiveTab === 'workspace' && !showingManagement && hasBothTools;
  const resizePanelsTo = (ratio) => {
    const boundedRatio = Math.min(75, Math.max(25, ratio));
    splitRatioRef.current = boundedRatio;
    setSplitRatio(boundedRatio);
  };
  const savePanelRatio = () => saveWorkspacePreferences(workspaceId, { splitRatio: Math.round(splitRatioRef.current) });
  const handleSplitterKeyDown = (event) => {
    if (event.key === 'ArrowLeft') resizePanelsTo(splitRatioRef.current - 5);
    else if (event.key === 'ArrowRight') resizePanelsTo(splitRatioRef.current + 5);
    else if (event.key === 'Home') resizePanelsTo(25);
    else if (event.key === 'End') resizePanelsTo(75);
    else return;
    savePanelRatio();
    event.preventDefault();
  };
  const updatePanelRatioFromPointer = (clientX) => {
    const bounds = workspaceMainRef.current?.getBoundingClientRect();
    if (bounds?.width) resizePanelsTo(((clientX - bounds.left) / bounds.width) * 100);
  };

  if (localWorkspace && isInterviewWorkspace(localWorkspace)) return <Navigate to={`/interview/${id}`} replace />;
  if (loading) return <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">Loading workspace…</div>;

  return <div className="workspace" data-active-tab={safeActiveTab}>
    <WorkspaceHeader roomId={currentWorkspace.roomId || id} inviteCode={currentWorkspace.inviteCode || currentWorkspace.code} collaborators={currentWorkspace.collaboratorList || []} workspaceName={currentWorkspace.name} workspaceType={workspaceType} onLeave={() => navigate(homePath)} />
    <div className="workspace-body">
      <WorkspaceSidebar activeTab={safeActiveTab} setActiveTab={setActiveTab} visibleTabs={visibleTabs} />
      <main
        ref={workspaceMainRef}
        className={`workspace-main ${showingManagement ? 'workspace-main-single' : ''}`}
        style={{ gridTemplateColumns: canResizePanels ? `minmax(0, ${splitRatio}fr) 8px minmax(0, ${100 - splitRatio}fr)` : '1fr' }}
      >
        {safeActiveTab === 'users' && <UsersPanel workspace={currentWorkspace} canManage={canManage} presence={presence} selfId={selfId} onRoleChange={handleMemberRoleChange} onRemoveUser={handleRemoveMember} />}
        {safeActiveTab === 'history' && <HistoryPanel entries={historyEntries} />}
        {safeActiveTab === 'settings' && <SettingsPanel splitRatio={splitRatio} hasBothTools={hasBothTools} onSplitRatioChange={(v) => { resizePanelsTo(v); saveWorkspacePreferences(workspaceId, { splitRatio: v }); }} onDownload={handleDownload} />}
        {!showingManagement && safeActiveTab === 'workspace' && hasWhiteboard && <section className="whiteboard-panel"><div className="panel-title">Whiteboard <span>Visual workspace</span></div><Whiteboard workspaceId={workspaceId} roomId={currentWorkspace.roomId || workspaceId} onActivity={recordActivity} /></section>}
        {canResizePanels && (
          <div
            className="workspace-splitter"
            role="separator"
            aria-label="Resize whiteboard and code editor panels"
            aria-orientation="vertical"
            aria-valuemin={25}
            aria-valuemax={75}
            aria-valuenow={Math.round(splitRatio)}
            tabIndex={0}
            onKeyDown={handleSplitterKeyDown}
            onPointerDown={(event) => {
              resizingRef.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (resizingRef.current) updatePanelRatioFromPointer(event.clientX);
            }}
            onPointerUp={() => {
              resizingRef.current = false;
              savePanelRatio();
            }}
            onLostPointerCapture={() => { resizingRef.current = false; }}
          >
            <GripVertical size={16} aria-hidden="true" />
          </div>
        )}
        {!showingManagement && safeActiveTab === 'workspace' && hasCodeEditor && <section className="code-panel"><div className="panel-title">Code Editor <span>Persistent project files</span></div><CodeEditor workspaceId={workspaceId} roomId={currentWorkspace.roomId || workspaceId} onActivity={recordActivity} /></section>}
        {!showingManagement && safeActiveTab === 'whiteboard' && hasWhiteboard && <section className="whiteboard-panel"><div className="panel-title">Whiteboard <span>Visual workspace</span></div><Whiteboard workspaceId={workspaceId} roomId={currentWorkspace.roomId || workspaceId} onActivity={recordActivity} /></section>}
        {!showingManagement && safeActiveTab === 'code' && hasCodeEditor && <section className="code-panel"><div className="panel-title">Code Editor <span>Persistent project files</span></div><CodeEditor workspaceId={workspaceId} roomId={currentWorkspace.roomId || workspaceId} onActivity={recordActivity} /></section>}
      </main>
    </div>
  </div>;
};
