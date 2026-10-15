import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastContainer } from './components/ui/Toast';
import { ProtectedRoute, RoleRoute, WorkspaceRoute } from './components/auth/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { WorkspacesPage } from './pages/WorkspacesPage';
import { WorkspacePage } from './pages/Workspace';
import JoinWorkspacePage from './pages/JoinWorkspacePage';
import { InterviewWorkspacePage } from './features/interview/pages/InterviewWorkspace';
import { InterviewsListPage } from './features/interview-access/pages/InterviewsListPage';
import { CreateInterviewPage } from './features/interview-access/pages/CreateInterviewPage';
import { JoinInterviewPage } from './features/interview-access/pages/JoinInterviewPage';
import { PreJoinPage } from './features/interview-access/pages/PreJoinPage';
import { AdminDashboard } from './features/admin/pages/AdminDashboard';
import AuditLogsPage from './pages/AuditLogsPage';
import RecordingsPage from './pages/RecordingsPage';
import ProfilePage from './pages/ProfilePage';
import Login from './pages/Login';
import Register from './pages/Register';
import RoomTest from './pages/RoomTest';
import YjsTest from './pages/YjsTest';
import { GuideChatbox } from './components/GuideChatbox';
import { OnboardingModal } from './components/OnboardingModal';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Dashboard readOnly />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/room-test" element={<RoomTest />} />
              <Route path="/yjs-test" element={<YjsTest />} />

              {/* Any authenticated user */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/workspaces" element={<ProtectedRoute><WorkspacesPage /></ProtectedRoute>} />
              <Route path="/workspaces/join" element={<JoinWorkspacePage />} />
              <Route path="/workspaces/:id" element={<WorkspaceRoute><WorkspacePage /></WorkspaceRoute>} />
              <Route path="/sessions" element={<Navigate to="/audit-logs" replace />} />
              <Route path="/audit-logs" element={<ProtectedRoute><AuditLogsPage /></ProtectedRoute>} />
              <Route path="/recordings" element={<RoleRoute roles={["admin", "interviewer"]}><RecordingsPage /></RoleRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

              {/* Interview create/join/workspace flow */}
              <Route path="/interviews" element={<ProtectedRoute><InterviewsListPage /></ProtectedRoute>} />
              <Route path="/interviews/create" element={<RoleRoute roles={['interviewer', 'admin']}><CreateInterviewPage /></RoleRoute>} />
              <Route path="/interviews/join" element={<ProtectedRoute><JoinInterviewPage /></ProtectedRoute>} />
              <Route path="/interviews/prejoin/:code" element={<ProtectedRoute><PreJoinPage /></ProtectedRoute>} />
              <Route path="/interview/:id" element={<ProtectedRoute><InterviewWorkspacePage /></ProtectedRoute>} />

              {/* Admin only */}
              <Route path="/admin" element={<RoleRoute roles={['admin']}><AdminDashboard /></RoleRoute>} />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <OnboardingModal />
            <GuideChatbox />
            <ToastContainer />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
