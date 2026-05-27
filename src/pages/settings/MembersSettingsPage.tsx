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
  const { members, pendingInvitations, isOwner, removeMember, createInvitation, revokeInvitation } =
    useHousehold()
  const addToast = useUIStore((s) => s.addToast)
  const [submitting, setSubmitting] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
  })

  async function handleInvite({ email }: { email: string }) {
    setSubmitting(true)
    try {
      const link = await createInvitation(email)
      setInviteLink(link)
      reset()
    } catch (e: any) {
      addToast(e.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm('¿Cancelar esta invitación?')) return
    try { await revokeInvitation(id) }
    catch (e: any) { addToast(e.message, 'error') }
  }

  async function handleRemove(userId: string) {
    if (!confirm('¿Eliminar a este miembro del hogar?')) return
    try { await removeMember(userId) }
    catch (e: any) { addToast(e.message, 'error') }
  }

  async function copyLink(link: string) {
    await navigator.clipboard.writeText(link)
    addToast('Enlace copiado al portapapeles')
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
        <>
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

            {inviteLink && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs font-medium text-blue-700 mb-2">
                  Enlace de invitación generado — compártelo con el invitado:
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-blue-600 flex-1 truncate font-mono">{inviteLink}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => copyLink(inviteLink)}
                  >
                    Copiar
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {pendingInvitations.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-app-text mb-4">Invitaciones pendientes</h3>
              <div className="divide-y divide-gray-50">
                {pendingInvitations.map((inv) => (
                  <div key={inv.id} className="flex items-center gap-3 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-app-text">{inv.email}</p>
                      <p className="text-xs text-muted">
                        Expira {new Date(inv.expires_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRevoke(inv.id)}>
                      Cancelar
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
