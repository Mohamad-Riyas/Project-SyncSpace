import { useNavigate } from 'react-router-dom';
import { Code2, Palette, Layers, Users, Clock, ArrowRight, Pencil, Mic } from 'lucide-react';
import { Button } from '../ui/Button';
import { getWorkspacePath, isInterviewWorkspace } from '../../types/workspace';
import { getInterviewRecord, getWorkspaceStatus } from '../../data/workspaceStore';
import { useAuth } from '../../context/AuthContext';

export const WorkspaceCard = ({ workspace: sourceWorkspace, onEdit, readOnly = false }) => {
    const navigate = useNavigate();
    const { user, role } = useAuth();
    const workspace = { ...sourceWorkspace };
    const interview = isInterviewWorkspace(workspace);
    const interviewRecord = interview ? getInterviewRecord(workspace.id) : null;
    const userId = user?.id || user?._id;
    const canManage = role === 'admin' || String(workspace.owner) === String(userId) ||
        (workspace.collaboratorList || []).some((member) => String(member.id) === String(userId) && member.role === 'owner');
    const getTypeIcon = (type) => {
        if (interview) return <Mic className="w-4 h-4 text-violet-300" />;
        switch (type) {
            case 'Code Editor':
                return <Code2 className="w-4 h-4 text-cyan-400" />;
            case 'Whiteboard':
                return <Palette className="w-4 h-4 text-purple-400" />;
            case 'Code + Whiteboard':
                return <Layers className="w-4 h-4 text-indigo-400" />;
            default:
                return <Layers className="w-4 h-4 text-cyan-400" />;
        }
    };
    const interviewStatus = interviewRecord?.status || 'scheduled';
    const status = getWorkspaceStatus(workspace);
    workspace.status = status;
    const isOnline = status === 'Active';
    const updated = workspace.lastUpdated || (workspace.updatedAt ? new Date(workspace.updatedAt).toLocaleDateString() : 'Recently');

    return (
        <article className="electric-card group flex flex-col justify-between rounded-2xl p-5">
            <div>
                <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-slate-900 shadow-md transition-transform group-hover:scale-110 ${interview ? 'border-violet-400/40 shadow-violet-950' : 'border-cyan-500/30 shadow-cyan-950'}`}>
                            {getTypeIcon(workspace.type)}
                        </div>
                        <div className="min-w-0">
                            <h3 className="line-clamp-1 text-base font-bold text-slate-100 transition-colors group-hover:text-cyan-300">{workspace.name}</h3>
                            <span className="font-mono text-[11px] text-cyan-400">{workspace.code || `SYNC-${workspace.id}`}</span>
                        </div>
                    </div>
                    <span className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${isOnline ? 'border-cyan-500/50 bg-cyan-950/80 text-cyan-300' : 'border-slate-800 bg-slate-900 text-slate-400'}`}>
                        <span className={`h-2 w-2 rounded-full ${isOnline ? 'animate-pulse bg-cyan-400' : 'bg-slate-500'}`} />{workspace.status}
                    </span>
                </div>
                {interview && <div className="mb-3 flex items-center gap-2"><span className="rounded-md border border-violet-400/40 bg-violet-950/50 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-200">Interview</span><span className="text-[10px] capitalize text-slate-400">{interviewStatus}</span></div>}
                <p className="mb-4 line-clamp-2 min-h-9 text-xs leading-relaxed text-slate-400">{workspace.description}</p>
                {workspace.tags?.length > 0 && <div className="mb-4 flex flex-wrap gap-1.5">{workspace.tags.map((tag) => <span key={tag} className="rounded-md border border-cyan-500/20 bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-cyan-200">{tag}</span>)}</div>}
            </div>
            <div className="space-y-4 border-t border-slate-800/80 pt-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">{getTypeIcon(workspace.type)}<span className="font-medium text-slate-300">{interview ? 'Interview Workspace' : workspace.type}</span></div>
                    <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /><span>{workspace.collaborators || 0} collaborators</span></div>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400"><Clock className="h-3 w-3" /><span>Updated {updated}</span></div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate(getWorkspacePath(workspace))} className="font-bold transition-all group-hover:border-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950">
                            {interview ? 'Open Interview' : 'Open Workspace'}<ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                        {!readOnly && canManage && onEdit && <button type="button" onClick={() => onEdit(workspace)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-500/50 hover:text-cyan-300" title={`Edit ${workspace.name}`}><Pencil className="h-3.5 w-3.5" />Edit</button>}
                    </div>
                </div>
            </div>
        </article>
    );
};
