import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { getWorkspaceStore, subscribeToWorkspaceStore } from '../data/workspaceStore';
import { Zap } from 'lucide-react';
export const SessionsPage = () => {
    const [store, setStore] = useState(() => getWorkspaceStore());
    useEffect(() => subscribeToWorkspaceStore(() => setStore(getWorkspaceStore())), []);
    const activities = useMemo(() => {
        const sessionActivities = store.sessions.map((session) => ({
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
    return (_jsx(DashboardLayout, { title: "Recent Sessions", children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-2xl font-bold text-slate-100 flex items-center gap-2", children: [_jsx("span", { children: "Recent Sessions" }), _jsx(Zap, { className: "w-5 h-5 text-cyan-400" })] }), _jsx("p", { className: "text-sm text-slate-400", children: "Real-time log of collaborative sessions and whiteboard updates" })] }), activities.length > 0 ? (_jsx(RecentActivity, { activities: activities })) : (_jsx("div", { className: "electric-card rounded-2xl p-8 text-center text-sm text-slate-400", children: "No sessions yet. Open a workspace to start recording activity." }))] }) }));
};
