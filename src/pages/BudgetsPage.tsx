import { useState } from 'react'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { BudgetProgress } from '../components/budgets/BudgetProgress'
import { BudgetForm } from '../components/budgets/BudgetForm'
import { useBudgets } from '../hooks/useBudgets'
import { useAuthStore } from '../store/authStore'
import { useHouseholdStore } from '../store/householdStore'

export function BudgetsPage() {
  const user = useAuthStore((s) => s.user)
  const households = useHouseholdStore((s) => s.households)
  const activeHouseholdId = useHouseholdStore((s) => s.activeHouseholdId)
  const activeHousehold = households.find((h) => h.id === activeHouseholdId)
  const isOwner = activeHousehold?.owner_id === user?.id

  const { budgets, loading, month, createBudget, deleteBudget } = useBudgets()
  const [addOpen, setAddOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const monthLabel = new Date(`${month}-01`).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  async function handleCreate(categoryId: string, amount: number) {
    setSubmitting(true)
    try { await createBudget(categoryId, amount); setAddOpen(false) }
    finally { setSubmitting(false) }
  }

  return (
    <PageWrapper
      title="Presupuestos"
      subtitle={monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
      action={isOwner ? <Button onClick={() => setAddOpen(true)}>＋ Nuevo presupuesto</Button> : undefined}
    >
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-primary" />
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="Sin presupuestos"
          description="Define cuánto quieres gastar en cada categoría este mes."
          action={isOwner ? { label: '＋ Crear primer presupuesto', onClick: () => setAddOpen(true) } : undefined}
        />
      ) : (
        <Card>
          <div className="divide-y divide-gray-100">
            {budgets.map((b) => (
              <BudgetProgress
                key={b.id}
                budget={b}
                isOwner={isOwner}
                onSave={createBudget}
                onDelete={deleteBudget}
              />
            ))}
          </div>
        </Card>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Nuevo presupuesto">
        <BudgetForm onSubmit={handleCreate} onCancel={() => setAddOpen(false)} submitting={submitting} />
      </Modal>
    </PageWrapper>
  )
}
