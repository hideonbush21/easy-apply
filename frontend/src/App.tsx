import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'

import LandingPage from '@/pages/Landing/LandingPage'
import OnboardingPage from '@/pages/Onboarding/OnboardingPage'
import TimelinePage from '@/pages/Timeline/TimelinePage'
import LoginPage from '@/pages/Auth/LoginPage'
import RegisterPage from '@/pages/Auth/RegisterPage'
import Dashboard from '@/pages/Dashboard'
import ProfilePage from '@/pages/Profile/ProfilePage'
import SchoolListPage from '@/pages/Schools/SchoolListPage'
import SchoolDetailPage from '@/pages/Schools/SchoolDetailPage'
import RecommendationsPage from '@/pages/Schools/RecommendationsPage'
import ApplicationListPage from '@/pages/Applications/ApplicationListPage'
import DocumentsPage from '@/pages/Documents/DocumentsPage'
import AdminDashboard from '@/pages/Admin/AdminDashboard'
import UserManagePage from '@/pages/Admin/UserManagePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public landing page */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected app routes under /dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="schools" element={<SchoolListPage />} />
          <Route path="schools/recommendations" element={<RecommendationsPage />} />
          <Route path="schools/:id" element={<SchoolDetailPage />} />
          <Route path="applications" element={<ApplicationListPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="timeline" element={<TimelinePage />} />
          <Route path="recommendations" element={<Navigate to="/dashboard/documents" replace />} />

          <Route
            path="admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/users"
            element={
              <ProtectedRoute requireAdmin>
                <UserManagePage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
