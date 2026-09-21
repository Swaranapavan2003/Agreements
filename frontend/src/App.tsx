import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'

import { useAuthStore } from '@/store/auth.store'
import { authService } from '@/services/auth.service'
import { FullPageSpinner } from '@/components/ui/Spinner'

import { AuthLayout } from '@/components/layout/AuthLayout'
import { AppShell } from '@/components/layout/AppShell'

import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { UsersPage } from '@/pages/users/UsersPage'
import { UserDetailPage } from '@/pages/users/UserDetailPage'
import { OrganizationSettingsPage } from '@/pages/organization/OrganizationSettingsPage'
import { AgreementsPage } from '@/pages/agreements/AgreementsPage'
import { AgreementDetailPage } from '@/pages/agreements/AgreementDetailPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { TemplatesPage } from '@/pages/templates/TemplatesPage'
import { TemplateBuilderPage } from '@/pages/templates/TemplateBuilderPage'
import { ClausesPage } from '@/pages/clauses/ClausesPage'
import { WorkflowSettingsPage } from '@/pages/settings/WorkflowSettingsPage'
import { BillingPage } from '@/pages/settings/BillingPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
    mutations: { retry: 0 },
  }
})

function ComingSoonPage({ feature, phase }: { feature: string; phase: number }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🚧</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{feature}</h2>
        <p className="text-gray-500 mb-4">This feature is coming in Phase {phase} of development.</p>
        <span className="inline-flex px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">Phase {phase}</span>
      </div>
    </div>
  )
}

function PrivateRoute() {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

function AuthRoute() {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />
}

function AppInitializer() {
  const { setAuth, logout, setInitialized, isInitialized } = useAuthStore()

  useEffect(() => {
    const init = async () => {
      try {
        const refreshResp = await authService.refresh()
        const meResp = await authService.getMe()
        setAuth(meResp.data, refreshResp.data.access_token)
      } catch {
        logout()
      } finally {
        setInitialized(true)
      }
    }
    init()
  }, [])

  if (!isInitialized) return <FullPageSpinner />
  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppInitializerWrapper />
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

function AppInitializerWrapper() {
  const { isInitialized } = useAuthStore()

  if (!isInitialized) {
    return <AppInitializerLoader />
  }

  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>
      </Route>
      {/* Auth routes that don't redirect if logged in */}
      <Route element={<AuthLayout />}>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
      </Route>

      {/* Protected routes */}
      <Route element={<PrivateRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:userId" element={<UserDetailPage />} />
          <Route path="/organization/settings" element={<OrganizationSettingsPage />} />
          <Route path="/agreements" element={<AgreementsPage />} />
          <Route path="/agreements/:id" element={<AgreementDetailPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/templates/new" element={<TemplateBuilderPage />} />
          <Route path="/templates/:id" element={<TemplateBuilderPage />} />
          <Route path="/clauses" element={<ClausesPage />} />
          <Route path="/settings/workflows" element={<WorkflowSettingsPage />} />
          <Route path="/approvals/*" element={<ComingSoonPage feature="Approvals" phase={5} />} />
          <Route path="/renewals/*" element={<ComingSoonPage feature="Renewals" phase={5} />} />
          <Route path="/amendments/*" element={<ComingSoonPage feature="Amendments" phase={5} />} />
          <Route path="/documents/*" element={<ComingSoonPage feature="Documents" phase={2} />} />
          <Route path="/ai-assistant/*" element={<ComingSoonPage feature="AI Assistant" phase={6} />} />
          <Route path="/reports/*" element={<ComingSoonPage feature="Reports" phase={7} />} />
          <Route path="/audit-logs/*" element={<ComingSoonPage feature="Audit Logs" phase={6} />} />
          <Route path="/settings/billing" element={<BillingPage />} />
          <Route path="/billing/*" element={<Navigate to="/settings/billing" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

function AppInitializerLoader() {
  const { setAuth, logout, setInitialized } = useAuthStore()
  useEffect(() => {
    const init = async () => {
      try {
        const refreshResp = await authService.refresh()
        const meResp = await authService.getMe()
        setAuth(meResp.data, refreshResp.data.access_token)
      } catch {
        logout()
      } finally {
        setInitialized(true)
      }
    }
    init()
  }, [])
  return <FullPageSpinner />
}
