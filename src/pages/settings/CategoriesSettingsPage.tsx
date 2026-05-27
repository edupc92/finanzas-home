import { useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { CategoryCard } from '../../components/settings/CategoryCard'
import { CategoryForm } from '../../components/settings/CategoryForm'
import { Spinner } from '../../components/ui/Spinner'
import { useCategories } from '../../hooks/useCategories'
import { useHousehold } from '../../hooks/useHousehold'
import { useUIStore } from '../../store/uiStore'
import type { Category } from '../../types'

export function CategoriesSettingsPage() {
  const { categories, loading, createCategory } = useCategories()
  const { isOwner } = useHousehold()
  const addToast = useUIStore((s) => s.addToast)
  const [addOpen, setAddOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const expenseCategories = categories.filter((c) => c.type === 'expense')
  const incomeCategories = categories.filter((c) => c.type === 'income')

  async function handleCreate(data: Omit<Category, 'id' | 'household_id' | 'is_default'>) {
    setSubmitting(true)
    try { await createCategory(data); setAddOpen(false) }
    catch (e: any) { addToast(e.message, 'error') }
    finally { setSubmitting(false) }
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" className="text-primary" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-app-text">Categorías</h2>
        {isOwner && (
          <Button size="sm" onClick={() => setAddOpen(true)}>＋ Nueva categoría</Button>
        )}
      </div>

      {expenseCategories.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Gastos</h3>
          <div className="divide-y divide-gray-50">
            {expenseCategories.map((c) => <CategoryCard key={c.id} category={c} isOwner={isOwner} />)}
          </div>
        </Card>
      )}

      {incomeCategories.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Ingresos</h3>
          <div className="divide-y divide-gray-50">
            {incomeCategories.map((c) => <CategoryCard key={c.id} category={c} isOwner={isOwner} />)}
          </div>
        </Card>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Nueva categoría">
        <CategoryForm onSubmit={handleCreate} onCancel={() => setAddOpen(false)} submitting={submitting} />
      </Modal>
    </div>
  )
}
