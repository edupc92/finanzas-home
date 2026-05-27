import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useHousehold } from '../../hooks/useHousehold'
import { useUIStore } from '../../store/uiStore'

const schema = z.object({ name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres') })

export function HouseholdSettingsPage() {
  const { activeHousehold, isOwner, updateHouseholdName } = useHousehold()
  const addToast = useUIStore((s) => s.addToast)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: activeHousehold?.name ?? '' },
  })

  async function handleSave({ name }: { name: string }) {
    setSubmitting(true)
    try { await updateHouseholdName(name) }
    catch (e: any) { addToast(e.message, 'error') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-app-text">Configuración del hogar</h2>

      <Card>
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-4">Nombre del hogar</h3>
        {isOwner ? (
          <form onSubmit={handleSubmit(handleSave)} className="flex gap-3">
            <div className="flex-1">
              <Input error={errors.name?.message} {...register('name')} />
            </div>
            <Button type="submit" loading={submitting}>Guardar</Button>
          </form>
        ) : (
          <p className="text-sm text-app-text">{activeHousehold?.name}</p>
        )}
      </Card>
    </div>
  )
}
