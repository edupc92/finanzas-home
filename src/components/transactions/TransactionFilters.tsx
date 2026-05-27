import { Input } from '../ui/Input'
import { useCategories } from '../../hooks/useCategories'
import { useHousehold } from '../../hooks/useHousehold'
import { currentMonth } from '../../lib/utils'
import type { TransactionFilters } from '../../types'

interface Props {
  filters: TransactionFilters
  onUpdate: (key: keyof TransactionFilters, value: string | undefined) => void
}

function monthOptions() {
  const opts = []
  for (let i = 0; i < 12; i++) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    opts.push({ val, label: label.charAt(0).toUpperCase() + label.slice(1) })
  }
  return opts
}

export function TransactionFilters({ filters, onUpdate }: Props) {
  const { categories } = useCategories()
  const { members } = useHousehold()

  return (
    <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
      <Input
        placeholder="Buscar por descripción..."
        className="sm:w-48"
        defaultValue={filters.search}
        onChange={(e) => onUpdate('search', e.target.value || undefined)}
      />

      <select
        value={filters.month ?? currentMonth()}
        onChange={(e) => onUpdate('month', e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-app-text focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        {monthOptions().map((o) => (
          <option key={o.val} value={o.val}>{o.label}</option>
        ))}
      </select>

      <select
        value={filters.type ?? ''}
        onChange={(e) => onUpdate('type', e.target.value || undefined)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-app-text focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        <option value="">Todos los tipos</option>
        <option value="income">Ingresos</option>
        <option value="expense">Gastos</option>
      </select>

      <select
        value={filters.categoryId ?? ''}
        onChange={(e) => onUpdate('categoryId', e.target.value || undefined)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-app-text focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        <option value="">Todas las categorías</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
        ))}
      </select>

      {members.length > 1 && (
        <select
          value={filters.userId ?? ''}
          onChange={(e) => onUpdate('userId', e.target.value || undefined)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-app-text focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Todos los miembros</option>
          {members.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.profile?.full_name ?? m.user_id.slice(0, 8)}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
