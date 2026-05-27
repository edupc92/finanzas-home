import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { CategoryForm } from './CategoryForm'
import { useCategories } from '../../hooks/useCategories'
import { useUIStore } from '../../store/uiStore'
import type { Category } from '../../types'

interface Props {
  category: Category
  isOwner: boolean
}

export function CategoryCard({ category, isOwner }: Props) {
  const [editing, setEditing] = useState(false)
  const { updateCategory, deleteCategory } = useCategories()
  const addToast = useUIStore((s) => s.addToast)
  const [submitting, setSubmitting] = useState(false)

  async function handleUpdate(data: Omit<Category, 'id' | 'household_id' | 'is_default'>) {
    setSubmitting(true)
    try {
      await updateCategory(category.id, data)
      setEditing(false)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar la categoría "${category.name}"?`)) return
    try {
      await deleteCategory(category.id)
    } catch (e: any) {
      addToast(e.message, 'error')
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 py-2.5 px-1 group">
        <div
          className="h-9 w-9 rounded-full flex items-center justify-center text-base flex-none"
          style={{ backgroundColor: `${category.color ?? '#718096'}20` }}
        >
          {category.icon ?? '📦'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-app-text">{category.name}</p>
          <Badge variant={category.type === 'income' ? 'income' : 'expense'} className="mt-0.5">
            {category.type === 'income' ? 'Ingreso' : 'Gasto'}
          </Badge>
        </div>
        {isOwner && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>✏️</Button>
            {!category.is_default && (
              <Button variant="ghost" size="sm" onClick={handleDelete}>🗑️</Button>
            )}
          </div>
        )}
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Editar categoría">
        <CategoryForm
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
          initial={category}
          submitting={submitting}
        />
      </Modal>
    </>
  )
}
