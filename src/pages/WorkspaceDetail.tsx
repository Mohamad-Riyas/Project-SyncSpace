import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Code2, Palette, Zap, Layers, Sparkles } from 'lucide-react';
import { initialWorkspaces } from '../data/mockData';

export const WorkspaceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const workspace = initialWorkspaces.find((w) => w.id.toString() === id) || {
    id: id || '1',
    name: `Workspace #${id}`,
    description: 'Collaborative live workspace',
    type: 'Code + Whiteboard',
    status: 'Active',
    code: `SYNC-${id}`,
  };

  return (
    <DashboardLayout title={`Workspace / ${workspace.name}`}>
      <div className="space-y-6">
        {/* Navigation Back Bar */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/')}
          >
            Back to Dashboard
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Join Code:</span>
            <code className="text-xs font-mono bg-slate-950 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-lg">
              {workspace.code}
            </code>
          </div>
        </div>

        {/* Workspace Canvas / Editor Placeholder Box */}
        <div className="electric-card rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col items-center justify-center text-center space-y-6 min-h-[480px] relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/30 animate-thunder-pulse">
              <Layers className="w-7 h-7" />
            </div>
            <div className="w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400 shadow-lg shadow-violet-600/30">
              <Code2 className="w-7 h-7" />
            </div>
            <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-600/30">
              <Palette className="w-7 h-7" />
            </div>
          </div>

          <div className="relative z-10 space-y-2 max-w-lg">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 flex items-center justify-center gap-2">
              <span>{workspace.name}</span>
              <Zap className="w-6 h-6 text-cyan-400" />
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Electric Collaborative Workspace Ready
            </p>
          </div>

          {/* Roadmap Highlights */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl w-full text-left pt-4">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/20 flex items-start gap-3">
              <Palette className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Interactive Canvas</h4>
                <p className="text-[11px] text-slate-400">Konva.js real-time multi-user drawing</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/20 flex items-start gap-3">
              <Code2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Monaco Code Editor</h4>
                <p className="text-[11px] text-slate-400">Multi-language syntax & pair coding</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/20 flex items-start gap-3">
              <Zap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Conflict-Free Sync</h4>
                <p className="text-[11px] text-slate-400">Yjs CRDT state management</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/20 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Live Communication</h4>
                <p className="text-[11px] text-slate-400">Socket.IO real-time websockets</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
