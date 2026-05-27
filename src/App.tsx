import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './components/layout/AuthProvider'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { AuthPage } from './pages/AuthPage'
import { AcceptInvitePage } from './pages/AcceptInvitePage'
import { DashboardPage } from './pages/DashboardPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { BudgetsPage } from './pages/BudgetsPage'
import { BankingPage } from './pages/BankingPage'
import { SettingsPage } from './pages/SettingsPage'
import { CategoriesSettingsPage } from './pages/settings/CategoriesSettingsPage'
import { MembersSettingsPage } from './pages/settings/MembersSettingsPage'
import { HouseholdSettingsPage } from './pages/settings/HouseholdSettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/accept-invite" element={<AcceptInvitePage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/budgets" element={<BudgetsPage />} />
              <Route path="/bank" element={<BankingPage />} />
              <Route path="/settings" element={<SettingsPage />}>
                <Route index element={<Navigate to="/settings/household" replace />} />
                <Route path="household" element={<HouseholdSettingsPage />} />
                <Route path="categories" element={<CategoriesSettingsPage />} />
                <Route path="members" element={<MembersSettingsPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
