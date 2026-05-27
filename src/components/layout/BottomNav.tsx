import { NavLink } from 'react-router-dom'
import { useUIStore } from '../../store/uiStore'
import { cn } from '../../lib/utils'

const items = [
  { to: '/dashboard', icon: '🏠', label: 'Inicio' },
  { to: '/transactions', icon: '📋', label: 'Movimientos' },
  { to: '/budgets', icon: '🎯', label: 'Presupuestos' },
  { to: '/settings', icon: '⚙️', label: 'Ajustes' },
]

export function BottomNav() {
  const { openTransactionModal } = useUIStore()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-gray-100 flex items-center">
      {items.slice(0, 2).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors',
              isActive ? 'text-primary' : 'text-muted'
            )
          }
        >
          <span className="text-xl">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}

      {/* Center add button */}
      <button
        onClick={openTransactionModal}
        className="flex-none -mt-5 bg-secondary text-white h-14 w-14 rounded-full flex items-center justify-center shadow-lg hover:bg-secondary/90 transition-colors text-2xl font-light"
      >
        ＋
      </button>

      {items.slice(2).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors',
              isActive ? 'text-primary' : 'text-muted'
            )
          }
        >
          <span className="text-xl">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
