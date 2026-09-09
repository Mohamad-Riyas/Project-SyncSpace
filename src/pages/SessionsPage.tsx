import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { getWorkspaceStore, subscribeToWorkspaceStore } from '../data/workspaceStore';
import type { Activity } from '../types/workspace';
import { Zap } from 'lucide-react';

export const SessionsPage: React.FC = () => {
  const [store, setStore] = useState(() => getWorkspaceStore());

  useEffect(() => subscribeToWorkspaceStore(() => setStore(getWorkspaceStore())), []);

  const activities = useMemo<Activity[]>(() => {
    const sessionActivities: Activity[] = store.sessions.map((session) => ({
      id: Number(session.id.split('-').pop()) || Date.now(),
      message: session.endedAt
        ? `You completed a session in ${session.workspaceName}`
        : `You are active in ${session.workspaceName}`,
      user: 'Riyas',
      time: new Date(session.endedAt ?? session.startedAt).toLocaleString(),
      type: 'edit',
      workspaceName: session.workspaceName,
    }));

    return [...sessionActivities, ...store.activities]
      .sort((first, second) => second.id - first.id)
      .slice(0, 50);
  }, [store]);

  return (
    <DashboardLayout title="Recent Sessions">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span>Recent Sessions</span>
            <Zap className="w-5 h-5 text-cyan-400" />
          </h2>
          <p className="text-sm text-slate-400">Real-time log of collaborative sessions and whiteboard updates</p>
        </div>
        {activities.length > 0 ? (
          <RecentActivity activities={activities} />
        ) : (
          <div className="electric-card rounded-2xl p-8 text-center text-sm text-slate-400">
            No sessions yet. Open a workspace to start recording activity.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
