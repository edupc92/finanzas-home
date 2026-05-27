import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card } from '../ui/Card'
import { monthLabel, formatCurrency } from '../../lib/utils'
import type { MonthlyData } from '../../types'

interface Props {
  data: MonthlyData[]
}

export function IncomeExpenseChart({ data }: Props) {
  const chartData = data.map((d) => ({
    name: monthLabel(d.month),
    Ingresos: d.income,
    Gastos: d.expense,
  }))

  return (
    <Card>
      <h3 className="text-sm font-semibold text-app-text mb-4">Ingresos vs. Gastos (6 meses)</h3>
      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Ingresos" fill="#2ECC71" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Gastos" fill="#E74C3C" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
