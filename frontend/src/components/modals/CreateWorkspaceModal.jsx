import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Code2, Palette, Layers, Monitor, Mic } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { WorkspaceKind } from '../../types/workspace';
import { getCurrentUserName } from '../../data/currentUser';
import { useNavigate } from 'react-router-dom';

export const CreateWorkspaceModal = ({ isOpen, onClose, onCreate }) => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const canCreateInterviews = role === 'interviewer' || role === 'admin';
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState(WorkspaceKind.GENERAL);
  const [type, setType] = useState('Code + Whiteboard');
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Workspace name is required.');
      showToast('Workspace name is required', 'error');
      return;
    }
    const randomCode = `SYNC-${Math.floor(1000 + Math.random() * 9000)}`;
    const isInterview = kind === WorkspaceKind.INTERVIEW;
    const toolType = isInterview ? 'Code + Whiteboard' : type;
    onCreate({
      name: name.trim(),
      description:
        description.trim() ||
        (isInterview
          ? 'Technical interview workspace with collaborative whiteboard and code editor.'
          : 'Real-time electric collaborative workspace session.'),
      kind,
      type: toolType,
      code: randomCode,
      owner: getCurrentUserName() || 'You',
      tags: isInterview ? ['Interview', toolType.replace(' + ', '-')] : [toolType.replace(' + ', '-')],
    });
    showToast(
      isInterview
        ? `Interview workspace "${name.trim()}" created`
        : `Workspace "${name.trim()}" created successfully!`,
      'success'
    );
    setName('');
    setDescription('');
    setKind(WorkspaceKind.GENERAL);
    setType('Code + Whiteboard');
    setError('');
    onClose();
  };

  const kindsConfig = [
    {
      kind: WorkspaceKind.GENERAL,
      label: 'General Workspace',
      desc: 'Normal collaborative work with whiteboard and code editor.',
      icon: <Monitor className="w-4 h-4 text-cyan-400" />,
    },
    ...(canCreateInterviews ? [{
      kind: WorkspaceKind.INTERVIEW,
      label: 'Interview Workspace',
      desc: 'Conduct a technical interview with a candidate.',
      icon: <Mic className="w-4 h-4 text-violet-300" />,
    }] : []),
  ];

  const typesConfig = [
    {
      type: 'Code + Whiteboard',
      label: 'Code + Whiteboard',
      desc: 'Full hybrid workspace with Monaco code editor & interactive canvas.',
      icon: <Layers className="w-4 h-4 text-cyan-400" />,
    },
    {
      type: 'Code Editor',
      label: 'Code Editor',
      desc: 'Focused multi-language editor for pair programming.',
      icon: <Code2 className="w-4 h-4 text-blue-400" />,
    },
    {
      type: 'Whiteboard',
      label: 'Whiteboard',
      desc: 'Visual brainstorming canvas and diagramming workspace.',
      icon: <Palette className="w-4 h-4 text-purple-400" />,
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Workspace"
      subtitle={canCreateInterviews ? 'Choose a general room or an interview workspace.' : 'Create a general collaborative workspace.'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="ws-name" className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-2">
            Workspace Name <span className="text-rose-400">*</span>
          </label>
          <input
            id="ws-name"
            type="text"
            placeholder={kind === WorkspaceKind.INTERVIEW ? 'e.g. Frontend Developer Interview' : 'e.g. Project Helios Architecture'}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            className={`
              w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all
              ${error ? 'border-rose-500/80 focus:ring-rose-500' : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/20'}
            `}
            autoFocus
          />
          {error && <p className="text-xs text-rose-400 mt-1.5">{error}</p>}
        </div>

        <div>
          <label htmlFor="ws-desc" className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-2">
            Description <span className="text-slate-400 font-normal lowercase">(optional)</span>
          </label>
          <textarea
            id="ws-desc"
            rows={2}
            placeholder="Briefly describe what this room is for..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-2">
            Workspace Type <span className="text-rose-400">*</span>
          </label>
          <div className="space-y-2.5">
            {kindsConfig.map((item) => {
              const isSelected = kind === item.kind;
              return (
                <div
                  key={item.kind}
                  onClick={() => setKind(item.kind)}
                  className={`
                    flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200
                    ${isSelected
                      ? item.kind === WorkspaceKind.INTERVIEW
                        ? 'bg-violet-950/50 border-violet-400 text-slate-100 shadow-md shadow-violet-950'
                        : 'bg-cyan-950/60 border-cyan-500 text-slate-100 shadow-md shadow-cyan-950'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'}
                  `}
                >
                  <div className="mt-0.5 shrink-0">{item.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-200">{item.label}</span>
                      <input
                        type="radio"
                        name="workspaceKind"
                        checked={isSelected}
                        onChange={() => setKind(item.kind)}
                        className="text-cyan-500 focus:ring-cyan-500"
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {kind === WorkspaceKind.GENERAL && (
          <div>
            <label className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-2">
              Tools
            </label>
            <div className="space-y-2.5">
              {typesConfig.map((item) => {
                const isSelected = type === item.type;
                return (
                  <div
                    key={item.type}
                    onClick={() => setType(item.type)}
                    className={`
                      flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200
                      ${isSelected ? 'bg-cyan-950/60 border-cyan-500 text-slate-100 shadow-md shadow-cyan-950' : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'}
                    `}
                  >
                    <div className="mt-0.5 shrink-0">{item.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-200">{item.label}</span>
                        <input
                          type="radio"
                          name="workspaceType"
                          checked={isSelected}
                          onChange={() => setType(item.type)}
                          className="text-cyan-500 focus:ring-cyan-500"
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          {!canCreateInterviews && (
            <Button type="button" variant="outline" onClick={() => { onClose(); navigate('/interviews/join'); }}>
              Join Interview
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="thunder">
            Create Workspace
          </Button>
        </div>
      </form>
    </Modal>
  );
};
