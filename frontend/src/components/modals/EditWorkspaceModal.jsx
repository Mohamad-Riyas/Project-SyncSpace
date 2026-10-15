import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Code2, Layers, Palette, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
const workspaceTypes = [
    { value: 'Code Editor', label: 'Code Editor', description: 'Focused multi-language coding room.', icon: <Code2 className="h-4 w-4 text-cyan-400" /> },
    { value: 'Whiteboard', label: 'Whiteboard', description: 'Visual planning and diagramming room.', icon: <Palette className="h-4 w-4 text-violet-400" /> },
    { value: 'Code + Whiteboard', label: 'Code + Whiteboard', description: 'Hybrid room with both tools.', icon: <Layers className="h-4 w-4 text-indigo-400" /> },
];
export const EditWorkspaceModal = ({ workspace, onClose, onSave, onDelete }) => {
    const [name, setName] = useState(workspace?.name || '');
    const [description, setDescription] = useState(workspace?.description || '');
    const [type, setType] = useState(workspace?.type || 'Code + Whiteboard');
    const [tags, setTags] = useState(workspace?.tags?.join(', ') || '');
    const [deleting, setDeleting] = useState(false);
    const { showToast } = useToast();
    const { user, role } = useAuth();
    const currentUserId = user?.id || user?._id;
    const canManage = role === 'admin' || String(workspace?.owner) === String(currentUserId) ||
        (workspace?.collaboratorList || []).some((member) => String(member.id) === String(currentUserId) && member.role === 'owner');
    const canDelete = canManage;

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!workspace || !name.trim()) {
            showToast('Workspace name is required', 'error');
            return;
        }
        onSave({
            ...workspace,
            name: name.trim(),
            description: description.trim() || 'Collaborative SyncSpace workspace.',
            type,
            tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
            lastUpdated: 'Just now',
        });
        showToast('Workspace updated', 'success');
        onClose();
    };

    const handleDelete = async () => {
        if (!workspace || !onDelete || !window.confirm(`Delete “${workspace.name}” and all of its files? This cannot be undone.`)) return;
        setDeleting(true);
        try {
            await onDelete(workspace);
            onClose();
        } catch {
            // The parent reports the API error; keep the edit dialog open.
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Modal isOpen={Boolean(workspace)} onClose={onClose} title="Edit Workspace" subtitle="Update workspace details or delete this workspace." maxWidth="md">
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label htmlFor="edit-ws-name" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-cyan-300">Workspace Name</label>
                    <input id="edit-ws-name" value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500" autoFocus />
                </div>
                <div>
                    <label htmlFor="edit-ws-description" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-cyan-300">Description</label>
                    <textarea id="edit-ws-description" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500" />
                </div>
                <div>
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-cyan-300">Workspace Type</span>
                    <div className="space-y-2">
                        {workspaceTypes.map((option) => (
                            <label key={option.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${type === option.value ? 'border-cyan-500 bg-cyan-950/50' : 'border-slate-800 bg-slate-950/60'}`}>
                                <input type="radio" name="editWorkspaceType" value={option.value} checked={type === option.value} onChange={() => setType(option.value)} />
                                {option.icon}
                                <span className="flex-1"><span className="block text-sm font-semibold text-slate-100">{option.label}</span><span className="block text-xs text-slate-400">{option.description}</span></span>
                            </label>
                        ))}
                    </div>
                </div>
                <div>
                    <label htmlFor="edit-ws-tags" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-cyan-300">Tags</label>
                    <input id="edit-ws-tags" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="frontend, planning, api" className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500" />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
                    {onDelete && canDelete ? <Button type="button" variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete Workspace'}</Button> : <span />}
                    <div className="ml-auto flex gap-3">
                        <Button type="button" variant="outline" onClick={onClose} disabled={deleting}>Cancel</Button>
                        {canManage && <Button type="submit" variant="thunder" disabled={deleting}>Save Changes</Button>}
                    </div>
                </div>
            </form>
        </Modal>
    );
};
