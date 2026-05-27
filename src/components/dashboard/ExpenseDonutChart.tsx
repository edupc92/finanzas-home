import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card } from '../ui/Card'
import { formatCurrency } from '../../lib/utils'
import type { DashboardSummary, Category } from '../../types'

interface Props {
  summary: DashboardSummary
  categories: Category[]
}

const FALLBACK_COLORS = ['#E74C3C','#F39C12','#2ECC71','#1E3A5F','#9B59B6','#E67E22','#1ABC9C','#34495E']

export function ExpenseDonutChart({ summary, categories }: Props) {
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  const data = summary.byCategory
    .filter((b) => b.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
    .map((b, i) => ({
      name: catMap[b.category_id]?.name ?? 'Otro',
      value: b.total,
      color: catMap[b.category_id]?.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
    }))

  if (data.length === 0) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-app-text mb-4">Gastos por categoría</h3>
        <p className="text-sm text-muted text-center py-10">Sin gastos este mes</p>
      </Card>
    )
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-app-text mb-4">Gastos por categoría</h3>
      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
