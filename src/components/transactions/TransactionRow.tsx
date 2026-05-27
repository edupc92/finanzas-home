import { useState } from 'react'
import { formatCurrency, formatDate } from '../../lib/utils'
import { TransactionModal } from './TransactionModal'
import type { Transaction } from '../../types'

interface TransactionRowProps {
  tx: Transaction
  onDelete?: (id: string) => void
  canEdit?: boolean
}

export function TransactionRow({ tx, onDelete, canEdit = true }: TransactionRowProps) {
  const [editing, setEditing] = useState(false)

  return (
    <>
      <div className="flex items-center gap-3 py-3 px-1 group">
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center text-lg flex-none"
          style={{ backgroundColor: `${tx.category?.color ?? '#718096'}20` }}
        >
          {tx.category?.icon ?? '📦'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-app-text truncate">
            {tx.description || tx.category?.name || '—'}
          </p>
          <p className="text-xs text-muted">
            {tx.category?.name} · {formatDate(tx.date)}
            {tx.source === 'bank' && (
              <span className="ml-1 text-primary font-medium">· banco</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-semibold tabular-nums ${
              tx.type === 'income' ? 'text-secondary' : 'text-danger'
            }`}
          >
            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
          </span>
          {canEdit && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setEditing(true)}
                className="p-1 text-muted hover:text-primary rounded transition-colors text-xs"
              >
                ✏️
              </button>
              {onDelete && (
                <button
                  onClick={() => onDelete(tx.id)}
                  className="p-1 text-muted hover:text-danger rounded transition-colors text-xs"
                >
                  🗑️
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {editing && (
        <TransactionModal
          open={editing}
          onClose={() => setEditing(false)}
          editing={tx}
        />
      )}
    </>
  )
}
