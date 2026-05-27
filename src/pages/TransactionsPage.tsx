import { useState } from 'react'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { TransactionRow } from '../components/transactions/TransactionRow'
import { TransactionFilters } from '../components/transactions/TransactionFilters'
import { TransactionModal } from '../components/transactions/TransactionModal'
import { useTransactions } from '../hooks/useTransactions'
import { useAuthStore } from '../store/authStore'
import { useHouseholdStore } from '../store/householdStore'
import { currentMonth, formatDate } from '../lib/utils'
import type { Transaction } from '../types'

function groupByDate(txs: Transaction[]): Map<string, Transaction[]> {
  const map = new Map<string, Transaction[]>()
  for (const tx of txs) {
    const key = tx.date
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(tx)
  }
  return map
}

function dateLabel(iso: string): string {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (iso === today) return 'Hoy'
  if (iso === yesterday) return 'Ayer'
  return formatDate(iso)
}

export function TransactionsPage() {
  const user = useAuthStore((s) => s.user)
  const households = useHouseholdStore((s) => s.households)
  const activeHouseholdId = useHouseholdStore((s) => s.activeHouseholdId)
  const activeHousehold = households.find((h) => h.id === activeHouseholdId)
  const isOwner = activeHousehold?.owner_id === user?.id

  const [addOpen, setAddOpen] = useState(false)
  const { transactions, filters, loading, hasMore, count, updateFilter, loadMore, deleteTransaction } =
    useTransactions({ month: currentMonth() })

  const groups = groupByDate(transactions)

  return (
    <PageWrapper
      title="Transacciones"
      subtitle={count > 0 ? `${count} transacciones encontradas` : undefined}
      action={<Button onClick={() => setAddOpen(true)}>＋ Nueva</Button>}
    >
      <div className="space-y-4">
        <TransactionFilters filters={filters} onUpdate={updateFilter} />

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" className="text-primary" />
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon="📭"
            title="Sin transacciones"
            description="No hay transacciones que coincidan con los filtros seleccionados."
            action={{ label: '＋ Añadir primera transacción', onClick: () => setAddOpen(true) }}
          />
        ) : (
          <Card padding={false}>
            {Array.from(groups.entries()).map(([date, txs]) => (
              <div key={date}>
                <div className="px-4 py-2 bg-bg border-b border-gray-50">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                    {dateLabel(date)}
                  </p>
                </div>
                <div className="px-4 divide-y divide-gray-50">
                  {txs.map((tx) => (
                    <TransactionRow
                      key={tx.id}
                      tx={tx}
                      canEdit={isOwner || tx.user_id === user?.id}
                      onDelete={isOwner || tx.user_id === user?.id ? deleteTransaction : undefined}
                    />
                  ))}
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="p-4 text-center border-t border-gray-100">
                <Button variant="outline" onClick={loadMore} loading={loading}>
                  Cargar más
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>

      <TransactionModal open={addOpen} onClose={() => setAddOpen(false)} />
    </PageWrapper>
  )
}
