import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCategories } from '../../hooks/useCategories'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { todayISO, cn } from '../../lib/utils'
import type { Transaction, TransactionType } from '../../types'

const schema = z.object({
  amount: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'El importe debe ser mayor que 0'),
  category_id: z.string().min(1, 'Selecciona una categoría'),
  description: z.string().optional(),
  date: z.string().min(1, 'La fecha es obligatoria'),
})

type FormData = z.infer<typeof schema>

interface TransactionFormProps {
  onSubmit: (data: { amount: number; type: TransactionType; category_id: string; description: string; date: string }) => Promise<void>
  onCancel: () => void
  submitting?: boolean
  initial?: Transaction
}

export function TransactionForm({ onSubmit, onCancel, submitting, initial }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense')
  const { categories } = useCategories(type)

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: initial?.amount ? String(initial.amount) : '',
      category_id: initial?.category_id ?? '',
      description: initial?.description ?? '',
      date: initial?.date ?? todayISO(),
    },
  })

  useEffect(() => {
    setValue('category_id', '')
  }, [type, setValue])

  async function submit(data: FormData) {
    await onSubmit({
      amount: Number(data.amount),
      type,
      category_id: data.category_id,
      description: data.description ?? '',
      date: data.date,
    })
    reset()
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      {/* Type toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-semibold transition-colors',
              type === t
                ? t === 'expense'
                  ? 'bg-danger text-white shadow-sm'
                  : 'bg-secondary text-white shadow-sm'
                : 'text-muted hover:text-app-text'
            )}
          >
            {t === 'expense' ? '💸 Gasto' : '💰 Ingreso'}
          </button>
        ))}
      </div>

      <Input
        label="Importe (€)"
        type="number"
        step="0.01"
        min="0.01"
        placeholder="0,00"
        error={errors.amount?.message}
        {...register('amount')}
      />

      <Select
        label="Categoría"
        placeholder="Selecciona una categoría"
        error={errors.category_id?.message}
        {...register('category_id')}
      >
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.icon ? `${c.icon} ` : ''}{c.name}
          </option>
        ))}
      </Select>

      <Input
        label="Descripción"
        placeholder="Opcional"
        {...register('description')}
      />

      <Input
        label="Fecha"
        type="date"
        error={errors.date?.message}
        {...register('date')}
      />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" fullWidth onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant={type === 'expense' ? 'danger' : 'secondary'}
          fullWidth
          loading={submitting}
        >
          {initial ? 'Guardar cambios' : type === 'expense' ? 'Registrar gasto' : 'Registrar ingreso'}
        </Button>
      </div>
    </form>
  )
}
