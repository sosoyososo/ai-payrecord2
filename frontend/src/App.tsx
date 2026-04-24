import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import AppLayout from '@/components/AppLayout'

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const HomePage = lazy(() => import('@/pages/HomePage'))
const AddRecordPage = lazy(() => import('@/pages/AddRecordPage'))
const EditRecordPage = lazy(() => import('@/pages/EditRecordPage'))
const StatsPage = lazy(() => import('@/pages/StatsPage'))
const LedgerPage = lazy(() => import('@/pages/LedgerPage'))
const CategoryPage = lazy(() => import('@/pages/CategoryPage'))
const TagPage = lazy(() => import('@/pages/TagPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const ExportPage = lazy(() => import('@/pages/ExportPage'))
const BudgetPage = lazy(() => import('@/pages/BudgetPage'))
const EmailVerificationPage = lazy(() => import('@/pages/EmailVerificationPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'))

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

function UnknownRoute() {
  const { user } = useAuth()
  return <Navigate to={user ? '/' : '/login'} replace />
}

function App() {
  return (
    <ThemeProvider>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Public routes - no layout */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected routes - wrapped in AppLayout */}
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="add" element={<AddRecordPage />} />
            <Route path="edit/:id" element={<EditRecordPage />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="ledgers" element={<LedgerPage />} />
            <Route path="categories" element={<CategoryPage />} />
            <Route path="tags" element={<TagPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="export" element={<ExportPage />} />
            <Route path="budget" element={<BudgetPage />} />
          </Route>

          <Route path="*" element={<UnknownRoute />} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  )
}

export default App
