import { useEffect, useState } from 'react';
import { Activity, Loader2, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { auditApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

const dateKey = (date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

export default function AuditLogsPage() {
  const { role } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    auditApi.list(500)
      .then((data) => { if (!cancelled) setLogs(data.logs || []); })
      .catch((err) => { if (!cancelled) setError(err.message || 'Could not load activity history.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const retry = () => {
    setLoading(true);
    setError('');
    setReloadKey((key) => key + 1);
  };

  const today = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const count = logs.filter((log) => dateKey(new Date(log.createdAt)) === dateKey(date)).length;
    return { date, count };
  });
  const maxCount = Math.max(1, ...days.map((day) => day.count));

  return (
    <DashboardLayout title="Activity History">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
          <Activity className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Activity History</h1>
          <p className="text-sm text-slate-500">{role === 'admin' ? 'System-wide workspace and interview activity.' : 'Your workspace and interview activity.'}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-center">
          <p className="mb-3 text-sm text-rose-300">{error}</p>
          <Button variant="outline" icon={<RefreshCw className="h-4 w-4" />} onClick={retry}>Try again</Button>
        </div>
      ) : (
        <>
          <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5" aria-label="Activity during the last seven days">
            <div className="mb-5 flex items-baseline justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-100">Activity overview</h2>
                <p className="mt-1 text-xs text-slate-500">Events recorded over the past seven days</p>
              </div>
              <span className="text-sm font-semibold text-cyan-300">{days.reduce((total, day) => total + day.count, 0)} events</span>
            </div>
            <div className="grid h-36 grid-cols-7 items-end gap-2 sm:gap-4">
              {days.map(({ date, count }) => (
                <div key={dateKey(date)} className="flex h-full min-w-0 flex-col items-center justify-end gap-2" title={`${date.toLocaleDateString()}: ${count} events`}>
                  <div className="flex h-full w-full items-end">
                    <div className="w-full rounded-t bg-cyan-500/80 transition-all" style={{ height: `${count ? Math.max(8, (count / maxCount) * 100) : 3}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-500">{date.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60" aria-label="Activity events">
            <div className="border-b border-slate-800 px-5 py-4">
              <h2 className="font-semibold text-slate-100">Recent events</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-800 text-left text-slate-500">
                  <th className="px-5 py-3">Time</th><th className="px-5 py-3">Actor</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Action</th><th className="px-5 py-3">Item</th>
                </tr></thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id} className="border-b border-slate-900">
                      <td className="whitespace-nowrap px-5 py-3 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="px-5 py-3 text-slate-200">{log.actor?.name || log.actorName || 'System'}</td>
                      <td className="px-5 py-3 text-slate-400">{log.actor?.role || log.actorRole || '—'}</td>
                      <td className="px-5 py-3 font-mono text-xs text-cyan-300">{log.action}</td>
                      <td className="px-5 py-3 text-slate-500">{log.entityType || '—'} {log.entityId ? `#${String(log.entityId).slice(-8)}` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!logs.length && <div className="p-10 text-center text-sm text-slate-500">No activity recorded yet.</div>}
          </section>
        </>
      )}
    </DashboardLayout>
  );
}
