import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { useHousehold } from '../../hooks/useHousehold'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'

const schema = z.object({ email: z.string().email('Email inválido') })

export function MembersSettingsPage() {
  const user = useAuthStore((s) => s.user)
  const { members, isOwner, removeMember, createInvitation } = useHousehold()
  const addToast = useUIStore((s) => s.addToast)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
  })

  async function handleInvite({ email }: { email: string }) {
    setSubmitting(true)
    try {
      await createInvitation(email)
      reset()
    } catch (e: any) {
      addToast(e.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove(userId: string) {
    if (!confirm('¿Eliminar a este miembro del hogar?')) return
    try { await removeMember(userId) }
    catch (e: any) { addToast(e.message, 'error') }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-app-text">Miembros del hogar</h2>

      <Card>
        <div className="divide-y divide-gray-50">
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-3 py-3">
              <Avatar name={m.profile?.full_name} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-app-text">
                  {m.profile?.full_name ?? 'Usuario'}
                  {m.user_id === user?.id && <span className="text-muted ml-1">(tú)</span>}
                </p>
                <Badge variant={m.role === 'owner' ? 'owner' : 'member'} className="mt-0.5">
                  {m.role === 'owner' ? 'Propietario' : 'Miembro'}
                </Badge>
              </div>
              {isOwner && m.user_id !== user?.id && (
                <Button variant="ghost" size="sm" onClick={() => handleRemove(m.user_id)}>
                  Eliminar
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {isOwner && (
        <Card>
          <h3 className="text-sm font-semibold text-app-text mb-4">Invitar miembro</h3>
          <form onSubmit={handleSubmit(handleInvite)} className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="email@ejemplo.com"
                type="email"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>
            <Button type="submit" loading={submitting}>Invitar</Button>
          </form>
          <p className="text-xs text-muted mt-2">
            La invitación expira en 7 días. El invitado recibirá un enlace para unirse.
          </p>
        </Card>
      )}
    </div>
  )
}
