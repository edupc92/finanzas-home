import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'
import { TransactionRow } from '../transactions/TransactionRow'
import { EmptyState } from '../ui/EmptyState'
import type { Transaction } from '../../types'

interface Props {
  transactions: Transaction[]
}

export function RecentTransactions({ transactions }: Props) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-app-text">Últimas transacciones</h3>
        <Link to="/transactions" className="text-xs text-primary hover:underline">
          Ver todas →
        </Link>
      </div>
      {transactions.length === 0 ? (
        <EmptyState icon="📭" title="Sin transacciones" description="Registra tu primer ingreso o gasto." />
      ) : (
        <div className="divide-y divide-gray-50">
          {transactions.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} canEdit={false} />
          ))}
        </div>
      )}
    </Card>
  )
}
