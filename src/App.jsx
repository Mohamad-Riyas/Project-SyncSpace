import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastContainer } from './components/ui/Toast';
import { Dashboard } from './pages/Dashboard';
import { WorkspacesPage } from './pages/WorkspacesPage';
import { SessionsPage } from './pages/SessionsPage';
import { WorkspacePage } from './pages/Workspace';
import Login from './pages/Login';
import Register from './pages/Register';
function ProtectedRoute({ children }) {
    const location = useLocation();
    const isAuthenticated = window.localStorage.getItem('syncspace-authenticated') === 'true';
    if (!isAuthenticated) {
        return _jsx(Navigate, { to: `/login?returnTo=${encodeURIComponent(location.pathname)}`, replace: true });
    }
    return children;
}
export function App() {
    return (_jsx(ThemeProvider, { children: _jsx(ToastProvider, { children: _jsxs(BrowserRouter, { children: [_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Dashboard, { readOnly: true }) }), _jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/register", element: _jsx(Register, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(ProtectedRoute, { children: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "/workspaces", element: _jsx(ProtectedRoute, { children: _jsx(WorkspacesPage, {}) }) }), _jsx(Route, { path: "/sessions", element: _jsx(ProtectedRoute, { children: _jsx(SessionsPage, {}) }) }), _jsx(Route, { path: "/workspaces/:id", element: _jsx(ProtectedRoute, { children: _jsx(WorkspacePage, {}) }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/dashboard", replace: true }) })] }), _jsx(ToastContainer, {})] }) }) }));
}
export default App;
