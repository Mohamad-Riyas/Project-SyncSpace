import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, LogIn, UserPlus, LogOut } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';
import { getSocket } from '../../services/socket';
import { interviewsApi } from '../../api/client';

export const Header = ({ title = 'Dashboard', onMenuClick, searchQuery = '', setSearchQuery }) => {
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { showToast } = useToast();
  const { isAuthenticated, user, role, logout } = useAuth();
  const userId = user?.id || user?._id || user?.email;
  const storageKey = `syncspace-notifications:${userId || 'anonymous'}`;

  useEffect(() => {
    try {
      setNotifications(JSON.parse(window.localStorage.getItem(storageKey) || '[]'));
    } catch {
      setNotifications([]);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!isAuthenticated || !userId) return undefined;
    const socket = getSocket();
    const addNotification = (invitation, type, headline, actionLabel) => {
      const notification = {
        id: `${type}:${invitation.id}`,
        ...invitation,
        type,
        headline,
        actionLabel,
        createdAt: new Date().toISOString(),
        read: false,
      };
      setNotifications((current) => {
        if (current.some((item) => item.id === notification.id)) return current;
        const updated = [notification, ...current].slice(0, 20);
        window.localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
      showToast(`${headline}: ${invitation.title}`, 'info');
    };
    const onInvitation = (invitation) => addNotification(invitation, 'invitation', 'Interview invitation', 'Join interview');
    const onRecordingShared = (sharedRecording) => addNotification(sharedRecording, 'recording', 'Recording shared with you', 'View recording');
    socket.on('interview:invitation', onInvitation);
    socket.on('interview:recording-shared', onRecordingShared);
    if (role === 'user') {
      interviewsApi.list()
        .then(({ interviews: invitedInterviews = [] }) => {
          invitedInterviews
            .filter((interview) => ['scheduled', 'active'].includes(interview.status))
            .forEach((interview) => onInvitation({
              id: interview.id,
              title: interview.title,
              code: interview.code,
              link: `/interviews/join?code=${interview.code}`,
            }));
        })
        .catch((err) => console.error('Could not load interview invitations:', err));
    }
    return () => {
      socket.off('interview:invitation', onInvitation);
      socket.off('interview:recording-shared', onRecordingShared);
    };
  }, [isAuthenticated, role, showToast, storageKey, userId]);

  const handleLogout = () => {
    logout();
    showToast('Logged out', 'info');
    navigate('/login', { replace: true });
  };

  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const markAllRead = () => {
    setNotifications((current) => {
      const updated = current.map((notification) => ({ ...notification, read: true }));
      window.localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <header className="app-topbar h-16 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="app-icon-button lg:hidden p-2 rounded-lg" aria-label="Open sidebar menu">
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="page-title text-lg sm:text-xl font-bold tracking-tight">
            <span>{title}</span>
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {setSearchQuery && (
          <div className="header-search-wrap relative hidden md:block w-64 lg:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="header-search w-full border rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 transition-all"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">⌘K</span>
          </div>
        )}

        <ThemeToggle />

        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="app-icon-button p-2 rounded-lg border transition-colors relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && <span className="notification-dot absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2" />}
          </button>
          {notifOpen && (
            <div className="notification-popover absolute right-0 mt-2 w-80 rounded-xl border p-4 z-50 animate-in fade-in duration-150">
              <div className="notification-heading flex items-center justify-between pb-3 border-b mb-3">
                <span className="font-semibold text-sm text-slate-200">Notifications</span>
                {unreadCount > 0 && <button type="button" className="text-xs text-cyan-400 font-medium hover:underline" onClick={markAllRead}>Mark all read</button>}
              </div>
              <div className="space-y-2">
                {notifications.length ? notifications.map((notification) => (
                  <div key={notification.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800/60">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-slate-200">{notification.headline || 'Notification'}</p>
                        <p className="text-xs text-slate-300 mt-1">{notification.title}</p>
                        <span className="text-[10px] text-slate-500">{new Date(notification.createdAt).toLocaleString()}</span>
                      </div>
                      {!notification.read && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1" />}
                    </div>
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold text-cyan-300 hover:text-cyan-200"
                      onClick={() => {
                        markAllRead();
                        setNotifOpen(false);
                        navigate(notification.link || `/interviews/join?code=${notification.code}`);
                      }}
                    >
                      {notification.actionLabel || 'Open'}
                    </button>
                  </div>
                )) : <p className="text-xs text-slate-500 py-3 text-center">No notifications yet.</p>}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Button className="header-auth-button" variant="outline" size="sm" icon={<LogOut className="w-4 h-4 text-cyan-400" />} onClick={handleLogout}>
              Logout
            </Button>
          ) : (
            <>
              <Button className="header-auth-button" variant="outline" size="sm" icon={<LogIn className="w-4 h-4 text-cyan-400" />} onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button variant="thunder" size="sm" icon={<UserPlus className="w-4 h-4" />} onClick={() => navigate('/register')} className="header-auth-button hidden sm:inline-flex">
                Register
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};