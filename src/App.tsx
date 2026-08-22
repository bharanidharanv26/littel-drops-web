import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { LoginPage } from '@/pages/auth/LoginPage'
import { GlobalDashboard } from '@/pages/dashboard/GlobalDashboard'
import { BranchesPage } from '@/pages/branches/BranchesPage'
import { BranchDashboard } from '@/pages/branches/BranchDashboard'
import { ElderList } from '@/pages/elders/ElderList'
import { ElderForm } from '@/pages/elders/ElderForm'
import { ElderProfile } from '@/pages/elders/ElderProfile'
import { TransfersPage } from '@/pages/transfers/TransfersPage'
import { ReportsPage } from '@/pages/reports/ReportsPage'
import { UsersPage } from '@/pages/users/UsersPage'
import { AuditLogPage } from '@/pages/audit/AuditLogPage'
import { RequestsPage } from '@/pages/requests/RequestsPage'
import { ImportPage } from '@/pages/import/ImportPage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'

function AppShell() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<GlobalDashboard />} />
            <Route path="/branches" element={<BranchesPage />} />
            <Route path="/branches/:id" element={<BranchDashboard />} />
            <Route path="/elders" element={<ElderList />} />
            <Route path="/elders/new" element={<ElderForm mode="create" />} />
            <Route path="/elders/:id" element={<ElderProfile />} />
            <Route path="/elders/:id/edit" element={<ElderForm mode="edit" />} />
            <Route path="/transfers" element={<TransfersPage />} />
            <Route
              path="/requests"
              element={
                <ProtectedRoute allowedRoles={['founder', 'trustee']} />
              }
            >
              <Route index element={<RequestsPage />} />
            </Route>
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/audit" element={<AuditLogPage />} />
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['founder']} />
              }
            >
              <Route index element={<UsersPage />} />
            </Route>
            <Route
              path="/import"
              element={
                <ProtectedRoute allowedRoles={['founder']} />
              }
            >
              <Route index element={<ImportPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </>
  )
}
