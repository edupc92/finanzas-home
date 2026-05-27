import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Select } from '../ui/Select'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useCategories } from '../../hooks/useCategories'
import type { Budget } from '../../types'

const schema = z.object({
  category_id: z.string().min(1, 'Selecciona una categoría'),
  amount: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'El importe debe ser mayor que 0'),
})

type FormData = z.infer<typeof schema>

interface Props {
  onSubmit: (categoryId: string, amount: number) => Promise<void>
  onCancel: () => void
  submitting?: boolean
  initial?: Budget
}

export function BudgetForm({ onSubmit, onCancel, submitting, initial }: Props) {
  const { categories } = useCategories('expense')
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category_id: initial?.category_id ?? '', amount: initial?.amount ? String(initial.amount) : '' },
  })

  async function submit(data: FormData) {
    await onSubmit(data.category_id, Number(data.amount))
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <Select
        label="Categoría de gasto"
        placeholder="Selecciona una categoría"
        error={errors.category_id?.message}
        {...register('category_id')}
      >
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
        ))}
      </Select>

      <Input
        label="Límite mensual (€)"
        type="number"
        step="0.01"
        min="0.01"
        placeholder="0,00"
        error={errors.amount?.message}
        {...register('amount')}
      />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" fullWidth onClick={onCancel}>Cancelar</Button>
        <Button type="submit" fullWidth loading={submitting}>
          {initial ? 'Guardar cambios' : 'Crear presupuesto'}
        </Button>
      </div>
    </form>
  )
}
