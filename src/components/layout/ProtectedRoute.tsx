import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Spinner } from '../ui/Spinner'

export function ProtectedRoute() {
  const { user, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <Spinner size="lg" className="text-primary" />
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />

  return <Outlet />
}
