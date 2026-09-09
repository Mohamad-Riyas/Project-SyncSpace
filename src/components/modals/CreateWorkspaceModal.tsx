import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { WorkspaceType, Workspace } from '../../types/workspace';
import { Code2, Palette, Layers } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (workspace: Omit<Workspace, 'id' | 'collaborators' | 'lastUpdated' | 'status'>) => void;
}

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<WorkspaceType>('Code + Whiteboard');
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Workspace name is required.');
      showToast('Workspace name is required', 'error');
      return;
    }

    const randomCode = `SYNC-${Math.floor(1000 + Math.random() * 9000)}`;

    onCreate({
      name: name.trim(),
      description: description.trim() || 'Real-time electric collaborative workspace session.',
      type,
      code: randomCode,
      owner: 'Riyas',
      tags: [type.replace(' + ', '-')],
    });

    showToast(`Workspace "${name.trim()}" created successfully!`, 'success');

    setName('');
    setDescription('');
    setType('Code + Whiteboard');
    setError('');
    onClose();
  };

  const typesConfig: { type: WorkspaceType; label: string; desc: string; icon: React.ReactNode }[] = [
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
      subtitle="Set up a real-time room for electric code & whiteboard collaboration."
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
            placeholder="e.g. Project Helios Architecture"
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
            rows={3}
            placeholder="Briefly describe what your team will work on..."
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

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
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
