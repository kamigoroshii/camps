import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@mui/material'

import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import RequestsPage from './pages/RequestsPage'
import CreateRequestPage from './pages/CreateRequestPage'
import RequestDetailsPage from './pages/RequestDetailsPage'
import ProfilePage from './pages/ProfilePage'
import NotificationsPage from './pages/NotificationsPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminRequestsPage from './pages/AdminRequestsPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminReportsPage from './pages/AdminReportsPage'
import AdminSettingsPage from './pages/AdminSettingsPage'
import AdminChatPage from './pages/AdminChatPage'
import ScholarshipPage from './pages/ScholarshipPage'
import ScholarshipUnifiedPage from './pages/ScholarshipUnifiedPage';
import MyApplicationsPage from './pages/MyApplicationsPage'
import ScholarshipVerificationPage from './pages/ScholarshipVerificationPage'
import AdminScholarshipReviewPage from './pages/AdminScholarshipReviewPage'
import CamsPage from './pages/CamsPage'
import CertificateRequestsPage from './pages/CertificateRequestsPage'
import BusPassPage from './pages/BusPassPage'
import MemoCardPage from './pages/MemoCardPage'
import ThemeDemoPage from './pages/ThemeDemoPage'
import ComponentsShowcasePage from './pages/ComponentsShowcasePage'
import AccessibleLoginPage from './pages/AccessibleLoginPage'
import ChatPage from './pages/ChatPage'
import DebugPage from './pages/DebugPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  // Allow both 'admin' and 'super_admin' roles (case-insensitive)
  const role = user?.role?.toLowerCase()
  const isAdmin = role === 'admin' || role === 'super_admin'

  if (!isAdmin) {
    // Redirect non-admins to dashboard with a message (you can add a toast notification here)
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Routes>
          {/* Public routes */}
          <Route path="/theme-demo" element={<ThemeDemoPage />} />
          <Route path="/components" element={<ComponentsShowcasePage />} />
          <Route path="/accessible-login" element={<AccessibleLoginPage />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Private routes */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="requests" element={<RequestsPage />} />
            <Route path="requests/new" element={<CreateRequestPage />} />
            <Route path="requests/history" element={<RequestsPage />} />
            <Route path="requests/:id" element={<RequestDetailsPage />} />
            
            {/* Student Services */}
            <Route path="student-services" element={<Navigate to="/requests" replace />} />
            <Route path="student-services/certificates" element={<CertificateRequestsPage />} />
            <Route path="student-services/bus-pass" element={<BusPassPage />} />
            <Route path="student-services/memo-card" element={<MemoCardPage />} />
            <Route path="student-services/history" element={<RequestsPage />} />
            
            <Route path="scholarship" element={<ScholarshipUnifiedPage />} />
            <Route path="scholarship/my-applications" element={<MyApplicationsPage />} />
            <Route path="scholarship-verification" element={<ScholarshipVerificationPage />} />
            <Route path="cams" element={<CamsPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="debug" element={<DebugPage />} />
          </Route>

          {/* Admin-only routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="requests" element={<AdminRequestsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="chat" element={<AdminChatPage />} />
            <Route path="scholarship-review" element={<AdminScholarshipReviewPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Box>
    </BrowserRouter>
  )
}

export default App
