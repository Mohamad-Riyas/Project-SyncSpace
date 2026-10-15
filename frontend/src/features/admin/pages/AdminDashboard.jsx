import { useEffect, useState } from 'react';
import { Users, Video, Activity, AlertCircle, Loader2, Trash2, PlaySquare, ScrollText } from 'lucide-react';
import { adminApi, recordingsApi, auditApi } from '../../../api/client';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

const TABS = [
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'interviews', label: 'Interview Management', icon: Video },
  { id: 'recordings', label: 'Recordings', icon: PlaySquare },
  { id: 'audit', label: 'Audit Logs', icon: ScrollText },
];

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-5 py-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-100">{value ?? '—'}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function UsersTab({ users, onRoleChange, onDelete }) {
  const { user: currentUser } = useAuth();
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-800">
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">Email</th>
            <th className="py-2 pr-4">Role</th>
            <th className="py-2 pr-4">Joined</th>
            <th className="py-2 pr-4" />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id} className="border-b border-slate-900">
              <td className="py-2.5 pr-4 text-slate-200">{u.name}</td>
              <td className="py-2.5 pr-4 text-slate-400">{u.email}</td>
              <td className="py-2.5 pr-4">
                <select
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200"
                  value={u.role}
                  onChange={(e) => onRoleChange(u._id, e.target.value)}
                  disabled={u._id === currentUser?.id}
                >
                  <option value="user">User</option>
                  <option value="interviewer">Interviewer</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td className="py-2.5 pr-4 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
              <td className="py-2.5 pr-4 text-right">
                <button
                  className="text-slate-500 hover:text-rose-400 disabled:opacity-30 disabled:cursor-not-allowed"
                  onClick={() => onDelete(u._id)}
                  disabled={u._id === currentUser?.id}
                  title={u._id === currentUser?.id ? "You can't delete your own account" : 'Delete user'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InterviewsTab({ interviews }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-800">
            <th className="py-2 pr-4">Title</th>
            <th className="py-2 pr-4">Code</th>
            <th className="py-2 pr-4">Interviewer</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4">Created</th>
          </tr>
        </thead>
        <tbody>
          {interviews.map((iv) => (
            <tr key={iv._id} className="border-b border-slate-900">
              <td className="py-2.5 pr-4 text-slate-200">{iv.title}</td>
              <td className="py-2.5 pr-4 font-mono text-cyan-300">{iv.code}</td>
              <td className="py-2.5 pr-4 text-slate-400">{iv.interviewer?.name || '—'}</td>
              <td className="py-2.5 pr-4 text-slate-400">{iv.status}</td>
              <td className="py-2.5 pr-4 text-slate-500">{new Date(iv.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminDashboard() {
  const { showToast } = useToast();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAll = () => {
    setLoading(true);
    Promise.all([adminApi.listUsers(), adminApi.listInterviews(), adminApi.stats(), recordingsApi.list(), auditApi.list(500)])
      .then(([u, iv, s, r, l]) => {
        setUsers(u.users || []);
        setInterviews(iv.interviews || []);
        setStats(s);
        setRecordings(r.recordings || []);
        setLogs(l.logs || []);
      })
      .catch((err) => setError(err.message || 'Could not load admin data.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadAll, []);

  const handleRoleChange = async (id, role) => {
    try {
      await adminApi.updateUserRole(id, role);
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, role } : u)));
      showToast('Role updated', 'success');
    } catch (err) {
      showToast(err.message || 'Could not update role', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await adminApi.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      showToast('User deleted', 'success');
    } catch (err) {
      showToast(err.message || 'Could not delete user', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mb-8">System-wide user and interview management.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total users" value={stats?.userCount} icon={Users} />
          <StatCard label="Total interviews" value={stats?.interviewCount} icon={Video} />
          <StatCard label="Active now" value={stats?.activeInterviews} icon={Activity} />
        </div>

        <div className="flex gap-2 mb-6 border-b border-slate-800">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors ${
                tab === id ? 'border-cyan-500 text-cyan-300' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
              onClick={() => setTab(id)}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-10 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        )}
        {!loading && error && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
        {!loading && !error && tab === 'users' && <UsersTab users={users} onRoleChange={handleRoleChange} onDelete={handleDelete} />}
        {!loading && !error && tab === 'interviews' && <InterviewsTab interviews={interviews} />}
        {!loading && !error && tab === 'recordings' && (
          <div className="space-y-3">
            {recordings.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
                <div><p className="text-sm font-semibold">{r.interviewTitle}</p><p className="text-xs text-slate-500">{r.startedBy || '—'} · {new Date(r.createdAt).toLocaleString()}</p></div>
                <span className="text-xs text-emerald-400">{r.status}</span>
              </div>
            ))}
            {!recordings.length && <p className="text-sm text-slate-600 py-8 text-center">No recordings yet.</p>}
          </div>
        )}
        {!loading && !error && tab === 'audit' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-500 border-b border-slate-800"><th className="py-2 pr-4">Time</th><th className="py-2 pr-4">Actor</th><th className="py-2 pr-4">Action</th><th className="py-2 pr-4">Entity</th></tr></thead>
              <tbody>{logs.map((l) => <tr key={l._id} className="border-b border-slate-900"><td className="py-2.5 pr-4 text-slate-500">{new Date(l.createdAt).toLocaleString()}</td><td className="py-2.5 pr-4">{l.actor?.name || l.actorName || 'System'}</td><td className="py-2.5 pr-4 text-cyan-300 font-mono text-xs">{l.action}</td><td className="py-2.5 pr-4 text-slate-500">{l.entityType}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
