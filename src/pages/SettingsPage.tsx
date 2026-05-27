import { NavLink, Outlet } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { cn } from '../lib/utils'

const tabs = [
  { to: '/settings/household', label: '🏠 Hogar' },
  { to: '/settings/categories', label: '🏷️ Categorías' },
  { to: '/settings/members', label: '👥 Miembros' },
]

export function SettingsPage() {
  return (
    <PageWrapper title="Ajustes">
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-white text-app-text shadow-sm' : 'text-muted hover:text-app-text'
              )
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </PageWrapper>
  )
}
