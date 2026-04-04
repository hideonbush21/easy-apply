import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'

import LoginPage from '@/pages/Auth/LoginPage'
import RegisterPage from '@/pages/Auth/RegisterPage'
import Dashboard from '@/pages/Dashboard'
import ProfilePage from '@/pages/Profile/ProfilePage'
import SchoolListPage from '@/pages/Schools/SchoolListPage'
import SchoolDetailPage from '@/pages/Schools/SchoolDetailPage'
import RecommendationsPage from '@/pages/Schools/RecommendationsPage'
import ApplicationListPage from '@/pages/Applications/ApplicationListPage'
import RecommendationPage from '@/pages/Recommendations/RecommendationPage'
import AdminDashboard from '@/pages/Admin/AdminDashboard'
import UserManagePage from '@/pages/Admin/UserManagePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/"
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
          <Route path="recommendations" element={<RecommendationPage />} />

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
