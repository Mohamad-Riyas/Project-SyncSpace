import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getGuestSession } from '../../api/client';

/** Full-page loading state while a stored token is being validated. */
function AuthLoading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-secondary, #64748b)' }}>
      Loading your session…
    </div>
  );
}

/** Requires any authenticated user. */
export function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, status } = useAuth();

  if (status === 'loading') return <AuthLoading />;
  if (!isAuthenticated) {
    return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  return children;
}

/** Signed-in users, or a guest holding a session for this exact workspace (route param `id`). */
export function WorkspaceRoute({ children }) {
  const location = useLocation();
  const { id } = useParams();
  const { isAuthenticated, status } = useAuth();

  if (status === 'loading') return <AuthLoading />;
  const guest = getGuestSession();
  if (isAuthenticated || (guest && String(guest.workspaceId) === String(id))) return children;
  return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />;
}

/**
 * Requires an authenticated user whose backend-issued role is one of `roles`.
 * Users who are logged in but lack permission are redirected to /dashboard
 * with an explanatory query param, instead of a blank/broken page.
 */
export function RoleRoute({ roles, children }) {
  const location = useLocation();
  const { isAuthenticated, role, status } = useAuth();

  if (status === 'loading') return <AuthLoading />;
  if (!isAuthenticated) {
    return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  if (!roles.includes(role)) {
    return <Navigate to="/dashboard?denied=1" replace />;
  }
  return children;
}

export default ProtectedRoute;
