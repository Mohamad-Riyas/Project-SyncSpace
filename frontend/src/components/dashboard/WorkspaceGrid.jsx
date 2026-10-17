import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getWorkspaceStatus } from '../../data/workspaceStore';
import { EmptyState } from './EmptyState';
import { WorkspaceCard } from './WorkspaceCard';

const filters = ['All', 'Active', 'Code Editor', 'Whiteboard', 'Interview'];

export const WorkspaceGrid = ({
  workspaces,
  onCreateWorkspace,
  onEditWorkspace,
  searchQuery = '',
  readOnly = false,
}) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const normalizedQuery = searchQuery.toLowerCase();
  const filteredWorkspaces = workspaces.filter((workspace) => {
    const matchesSearch = workspace.name.toLowerCase().includes(normalizedQuery)
      || (workspace.description || '').toLowerCase().includes(normalizedQuery)
      || (workspace.code && workspace.code.toLowerCase().includes(normalizedQuery));

    if (!matchesSearch) return false;
    if (activeFilter === 'Active') return getWorkspaceStatus(workspace) === 'Active';
    if (activeFilter === 'Code Editor') return ['Code Editor', 'Code + Whiteboard'].includes(workspace.type);
    if (activeFilter === 'Whiteboard') return ['Whiteboard', 'Code + Whiteboard'].includes(workspace.type);
    if (activeFilter === 'Interview') return workspace.kind === 'interview';
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Your Workspaces</h2>
          <p className="text-xs text-slate-400">Shared rooms for code, whiteboards, and team collaboration.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1 text-xs md:flex">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                aria-pressed={activeFilter === filter}
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                  activeFilter === filter
                    ? 'bg-teal-700 text-white'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <Link to="/workspaces" className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-700 transition-colors hover:text-cyan-800">
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
      {filteredWorkspaces.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredWorkspaces.map((workspace) => (
            <WorkspaceCard key={workspace.id} workspace={workspace} onEdit={onEditWorkspace} readOnly={readOnly} />
          ))}
        </div>
      ) : (
        <EmptyState
          isSearch={Boolean(searchQuery)}
          title={searchQuery ? 'No matching workspaces found' : 'No workspaces yet'}
          description={searchQuery
            ? `No workspace matched "${searchQuery}". Try searching for another name or code.`
            : 'Create your first workspace and start collaborating with your team.'}
          actionText={searchQuery ? undefined : 'Create Workspace'}
          onAction={searchQuery || readOnly ? undefined : onCreateWorkspace}
        />
      )}
    </div>
  );
};
