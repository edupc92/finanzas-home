import { Card } from '../ui/Card'
import { ProgressBar } from '../ui/ProgressBar'
import { formatCurrency } from '../../lib/utils'
import type { Budget } from '../../types'

interface Props {
  budgets: Budget[]
}

export function BudgetStatusList({ budgets }: Props) {
  if (budgets.length === 0) return null

  return (
    <Card>
      <h3 className="text-sm font-semibold text-app-text mb-4">Estado de presupuestos</h3>
      <div className="space-y-4">
        {budgets.map((b) => {
          const spent = b.spent ?? 0
          const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0
          return (
            <div key={b.id}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-app-text">
                  {b.category?.icon} {b.category?.name}
                </span>
                <span className="text-xs text-muted">
                  {formatCurrency(spent)} / {formatCurrency(b.amount)}
                </span>
              </div>
              <ProgressBar value={spent} max={b.amount} />
              {pct > 100 && (
                <p className="text-xs text-danger mt-0.5">
                  Superado en {formatCurrency(spent - b.amount)}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
