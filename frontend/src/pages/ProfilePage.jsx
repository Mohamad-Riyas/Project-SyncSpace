import { useEffect, useState } from 'react';
import { Save, UserCircle } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', bio: '', avatarUrl: '', password: '' });
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (user) setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '', bio: user.bio || '', avatarUrl: user.avatarUrl || '', password: '' }); }, [user]);
  const set = (key, value) => setForm((p) => ({ ...p, [key]: value }));
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: form.name, email: form.email, phone: form.phone, bio: form.bio, avatarUrl: form.avatarUrl };
      if (form.password) payload.password = form.password;
      await updateProfile(payload);
      set('password', '');
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Could not update profile', 'error');
    } finally { setSaving(false); }
  };
  return (
    <DashboardLayout title="My Profile">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center"><UserCircle className="w-7 h-7 text-cyan-300" /></div>
          <div><h1 className="text-2xl font-bold">Profile</h1><p className="text-sm text-slate-400">Update the details shown to your workspace and interview teammates.</p></div>
        </div>
        <form onSubmit={save} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            {['name','email','phone'].map((key) => <label key={key} className="text-sm text-slate-300">{key === 'name' ? 'Name' : key === 'email' ? 'Email' : 'Phone'}<input value={form[key]} onChange={(e) => set(key, e.target.value)} type={key === 'email' ? 'email' : 'text'} className="mt-1.5 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 outline-none focus:border-cyan-500" required={key !== 'phone'} /></label>)}
            <label className="text-sm text-slate-300">Role<input value={user?.role || ''} disabled className="mt-1.5 w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-500" /></label>
          </div>
          <label className="block text-sm text-slate-300">Avatar URL (optional)<input value={form.avatarUrl} onChange={(e) => set('avatarUrl', e.target.value)} className="mt-1.5 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 outline-none focus:border-cyan-500" placeholder="https://..." /></label>
          <label className="block text-sm text-slate-300">Bio<textarea value={form.bio} onChange={(e) => set('bio', e.target.value)} rows={4} className="mt-1.5 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 outline-none focus:border-cyan-500 resize-y" placeholder="A short introduction" /></label>
          <label className="block text-sm text-slate-300">New password (optional)<input value={form.password} onChange={(e) => set('password', e.target.value)} type="password" className="mt-1.5 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 outline-none focus:border-cyan-500" placeholder="Leave empty to keep current password" /></label>
          <div className="flex justify-end pt-3 border-t border-slate-800"><Button type="submit" variant="thunder" disabled={saving} icon={<Save className="w-4 h-4" />}>{saving ? 'Saving…' : 'Save Profile'}</Button></div>
        </form>
      </div>
    </DashboardLayout>
  );
}
