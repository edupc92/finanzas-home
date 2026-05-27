import { NavLink, useNavigate } from 'react-router-dom'
import { useHousehold } from '../../hooks/useHousehold'
import { useAuth } from '../../hooks/useAuth'
import { useUIStore } from '../../store/uiStore'
import { Avatar } from '../ui/Avatar'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/transactions', icon: '📋', label: 'Transacciones' },
  { to: '/budgets', icon: '🎯', label: 'Presupuestos' },
  { to: '/bank', icon: '🏦', label: 'Cuentas bancarias' },
  { to: '/settings', icon: '⚙️', label: 'Ajustes' },
]

export function Sidebar() {
  const { households, activeHouseholdId, activeHousehold, switchHousehold } = useHousehold()
  const { user, signOut } = useAuth()
  const { openTransactionModal } = useUIStore()
  const navigate = useNavigate()

  return (
    <aside className="hidden md:flex flex-col w-60 h-screen bg-surface border-r border-gray-100 fixed left-0 top-0 z-30">
      {/* Brand */}
      <div className="p-4 border-b border-gray-100">
        <h1 className="text-lg font-bold text-primary">💶 FinanzasHogar</h1>
      </div>

      {/* Household selector */}
      {households.length > 1 && (
        <div className="px-3 py-2 border-b border-gray-100">
          <select
            value={activeHouseholdId ?? ''}
            onChange={(e) => switchHousehold(e.target.value)}
            className="w-full text-sm rounded-lg border border-gray-200 px-2 py-1.5 text-app-text focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {households.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
      )}

      {households.length === 1 && (
        <div className="px-4 py-2 border-b border-gray-100">
          <p className="text-xs text-muted">Hogar activo</p>
          <p className="text-sm font-medium text-app-text truncate">{activeHousehold?.name}</p>
        </div>
      )}

      {/* Nueva transacción */}
      <div className="px-3 py-3">
        <button
          onClick={openTransactionModal}
          className="w-full flex items-center justify-center gap-2 bg-secondary text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-secondary/90 transition-colors"
        >
          <span className="text-base">＋</span> Nueva transacción
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted hover:bg-gray-50 hover:text-app-text'
              )
            }
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/settings')}>
          <Avatar name={user?.user_metadata?.full_name ?? user?.email} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-app-text truncate">
              {user?.user_metadata?.full_name ?? 'Mi cuenta'}
            </p>
            <p className="text-xs text-muted truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full mt-1 text-xs text-muted hover:text-danger transition-colors px-2 py-1 text-left"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
