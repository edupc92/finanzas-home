import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import type { Category } from '../../types'

const schema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  type: z.enum(['income', 'expense']),
  icon: z.string().optional(),
  color: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const EMOJI_OPTIONS = ['🛒','🚗','🏠','💡','🏥','📚','🎬','👕','🍽️','📦','💼','💻','📈','💰','✈️','🏋️','🐾','🎵','🎮','🏡','🚌','💊','📱','🎁']
const COLOR_OPTIONS = ['#E74C3C','#E67E22','#F39C12','#2ECC71','#1ABC9C','#3498DB','#1E3A5F','#9B59B6','#718096','#34495E']

interface Props {
  onSubmit: (data: Omit<Category, 'id' | 'household_id' | 'is_default'>) => Promise<void>
  onCancel: () => void
  initial?: Category
  submitting?: boolean
}

export function CategoryForm({ onSubmit, onCancel, initial, submitting }: Props) {
  const [selectedIcon, setSelectedIcon] = useState(initial?.icon ?? '')
  const [selectedColor, setSelectedColor] = useState(initial?.color ?? '#718096')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? '',
      type: initial?.type ?? 'expense',
      icon: initial?.icon ?? '',
      color: initial?.color ?? '#718096',
    },
  })

  async function submit(data: FormData) {
    await onSubmit({ ...data, icon: selectedIcon || null, color: selectedColor || null })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <Input label="Nombre" placeholder="Ej. Alimentación" error={errors.name?.message} {...register('name')} />

      <Select label="Tipo" {...register('type')}>
        <option value="expense">Gasto</option>
        <option value="income">Ingreso</option>
      </Select>

      <div>
        <p className="text-sm font-medium text-app-text mb-2">Icono</p>
        <div className="flex flex-wrap gap-2">
          {EMOJI_OPTIONS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setSelectedIcon(e)}
              className={`text-xl p-1.5 rounded-lg border-2 transition-colors ${
                selectedIcon === e ? 'border-primary bg-primary/5' : 'border-transparent hover:border-gray-200'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-app-text mb-2">Color</p>
        <div className="flex gap-2 flex-wrap">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedColor(c)}
              className={`h-8 w-8 rounded-full border-2 transition-transform ${
                selectedColor === c ? 'border-gray-800 scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" fullWidth onClick={onCancel}>Cancelar</Button>
        <Button type="submit" fullWidth loading={submitting}>
          {initial ? 'Guardar cambios' : 'Crear categoría'}
        </Button>
      </div>
    </form>
  )
}
