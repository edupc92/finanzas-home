import { Card } from '../ui/Card'
import { formatCurrency } from '../../lib/utils'
import type { DashboardSummary } from '../../types'

interface Props {
  summary: DashboardSummary
}

export function SummaryCards({ summary }: Props) {
  const net = summary.totalIncome - summary.totalExpense

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
        <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">Ingresos</p>
        <p className="text-2xl font-bold text-secondary">{formatCurrency(summary.totalIncome)}</p>
      </Card>
      <Card>
        <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">Gastos</p>
        <p className="text-2xl font-bold text-danger">{formatCurrency(summary.totalExpense)}</p>
      </Card>
      <Card>
        <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">Balance neto</p>
        <p className={`text-2xl font-bold ${net >= 0 ? 'text-primary' : 'text-danger'}`}>
          {net >= 0 ? '+' : ''}{formatCurrency(net)}
        </p>
      </Card>
    </div>
  )
}
