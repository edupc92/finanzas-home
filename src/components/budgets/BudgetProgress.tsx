import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { ProgressBar } from '../ui/ProgressBar'
import { BudgetForm } from './BudgetForm'
import { formatCurrency } from '../../lib/utils'
import type { Budget } from '../../types'

interface Props {
  budget: Budget
  isOwner: boolean
  onSave: (categoryId: string, amount: number) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function BudgetProgress({ budget, isOwner, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const spent = budget.spent ?? 0
  const pct = budget.amount > 0 ? (spent / budget.amount) * 100 : 0

  async function handleSave(categoryId: string, amount: number) {
    setSubmitting(true)
    try {
      await onSave(categoryId, amount)
      setEditing(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="py-4 group">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{budget.category?.icon ?? '📦'}</span>
            <div>
              <p className="text-sm font-medium text-app-text">{budget.category?.name}</p>
              <p className="text-xs text-muted">
                {formatCurrency(spent)} de {formatCurrency(budget.amount)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${pct >= 100 ? 'text-danger' : pct >= 75 ? 'text-warning' : 'text-secondary'}`}>
              {Math.round(pct)}%
            </span>
            {isOwner && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>✏️</Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(budget.id)}>🗑️</Button>
              </div>
            )}
          </div>
        </div>
        <ProgressBar value={spent} max={budget.amount} />
        {pct > 100 && (
          <p className="text-xs text-danger mt-1">
            Superado en {formatCurrency(spent - budget.amount)}
          </p>
        )}
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Editar presupuesto">
        <BudgetForm
          onSubmit={handleSave}
          onCancel={() => setEditing(false)}
          submitting={submitting}
          initial={budget}
        />
      </Modal>
    </>
  )
}
