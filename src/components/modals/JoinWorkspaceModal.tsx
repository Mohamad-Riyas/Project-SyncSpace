import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { KeyRound } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface JoinWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (code: string) => void;
}

export const JoinWorkspaceModal: React.FC<JoinWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onJoin,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = code.trim().toUpperCase();

    if (!trimmedCode) {
      setError('Workspace code is required.');
      showToast('Workspace code is required', 'error');
      return;
    }

    onJoin(trimmedCode);
    showToast(`Successfully joined workspace ${trimmedCode}!`, 'success');

    setCode('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Join Workspace"
      subtitle="Enter a workspace join key to establish live team connection."
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="join-code" className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-2">
            Enter Workspace Code <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="join-code"
              type="text"
              placeholder="e.g. SYNC-4821"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (error) setError('');
              }}
              className={`
                w-full bg-slate-950 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 font-mono tracking-wider uppercase placeholder-slate-500 focus:outline-none focus:ring-2 transition-all
                ${error ? 'border-rose-500/80 focus:ring-rose-500' : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/20'}
              `}
              autoFocus
            />
          </div>
          {error ? (
            <p className="text-xs text-rose-400 mt-1.5">{error}</p>
          ) : (
            <p className="text-xs text-slate-400 mt-1.5">
              Example code: <code className="text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded text-[11px] border border-cyan-500/30">SYNC-4821</code>
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="thunder">
            Join Workspace
          </Button>
        </div>
      </form>
    </Modal>
  );
};
