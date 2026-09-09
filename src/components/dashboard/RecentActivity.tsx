import React from 'react';
import { UserPlus, Edit3, Palette, PlusCircle, Clock, Zap } from 'lucide-react';
import type { Activity } from '../../types/workspace';

interface RecentActivityProps {
  activities: Activity[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'join':
        return <UserPlus className="w-4 h-4 text-cyan-400" />;
      case 'edit':
        return <Edit3 className="w-4 h-4 text-blue-400" />;
      case 'whiteboard':
        return <Palette className="w-4 h-4 text-purple-400" />;
      case 'create':
        return <PlusCircle className="w-4 h-4 text-amber-400" />;
      default:
        return <Zap className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="electric-card rounded-3xl p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>Recent Activity</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </h2>
          <p className="text-xs text-slate-400">Live electric updates from your team workspaces</p>
        </div>
        <span className="text-[11px] font-medium text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm shadow-cyan-950">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          Live Stream
        </span>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={activity.id} className="relative flex items-start gap-4 group">
            {index !== activities.length - 1 && (
              <span className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-800 group-hover:bg-cyan-500/40 transition-colors" />
            )}

            <div className="w-8 h-8 rounded-xl bg-slate-950 border border-cyan-500/30 flex items-center justify-center shrink-0 group-hover:border-cyan-400 transition-colors z-10 shadow-sm shadow-cyan-950">
              {getActivityIcon(activity.type)}
            </div>

            <div className="flex-1 bg-slate-950/60 hover:bg-slate-900/80 border border-slate-800/80 p-3 rounded-2xl transition-colors">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-200">
                  {activity.message}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
                  <Clock className="w-3 h-3" />
                  <span>{activity.time}</span>
                </div>
              </div>

              {activity.workspaceName && (
                <span className="inline-block mt-1 text-[10px] font-medium text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                  {activity.workspaceName}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
