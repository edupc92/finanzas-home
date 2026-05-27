import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

interface InvitationInfo {
  id: string
  email: string
  expires_at: string
  accepted_at: string | null
  households: { name: string }
}

export function AcceptInvitePage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const token = params.get('token')

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null)
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'expired' | 'already_accepted' | 'joining' | 'joined'>('loading')

  useEffect(() => {
    if (!token) { setStatus('invalid'); return }

    supabase
      .from('invitations')
      .select('id, email, expires_at, accepted_at, households(name)')
      .eq('token', token)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setStatus('invalid'); return }
        const inv = data as unknown as InvitationInfo
        setInvitation(inv)
        if (inv.accepted_at) { setStatus('already_accepted'); return }
        if (new Date(inv.expires_at) < new Date()) { setStatus('expired'); return }
        setStatus('valid')
      })
  }, [token])

  async function handleAccept() {
    if (!user) {
      sessionStorage.setItem('pendingInviteToken', token!)
      navigate(`/auth?redirect=/accept-invite?token=${token}`)
      return
    }
    setStatus('joining')
    const { data, error } = await supabase.rpc('accept_household_invitation', {
      invitation_token: token,
    })
    if (error || !data) {
      setStatus('valid')
      return
    }
    setStatus('joined')
    setTimeout(() => navigate('/dashboard'), 2000)
  }

  const householdName = invitation?.households?.name ?? 'el hogar'

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
        {status === 'loading' && (
          <>
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted text-sm">Verificando invitación…</p>
          </>
        )}

        {status === 'invalid' && (
          <>
            <p className="text-3xl">❌</p>
            <h1 className="text-lg font-semibold text-app-text">Invitación no válida</h1>
            <p className="text-sm text-muted">Este enlace de invitación no existe o ya fue usado.</p>
            <button onClick={() => navigate('/')} className="text-primary text-sm underline">
              Ir al inicio
            </button>
          </>
        )}

        {status === 'expired' && (
          <>
            <p className="text-3xl">⏰</p>
            <h1 className="text-lg font-semibold text-app-text">Invitación caducada</h1>
            <p className="text-sm text-muted">
              Esta invitación expiró el {invitation && new Date(invitation.expires_at).toLocaleDateString('es-ES')}.
              Pide al propietario que te envíe una nueva.
            </p>
          </>
        )}

        {status === 'already_accepted' && (
          <>
            <p className="text-3xl">✅</p>
            <h1 className="text-lg font-semibold text-app-text">Ya eres miembro</h1>
            <p className="text-sm text-muted">Esta invitación ya fue aceptada.</p>
            <button onClick={() => navigate('/dashboard')} className="text-primary text-sm underline">
              Ir al dashboard
            </button>
          </>
        )}

        {status === 'valid' && (
          <>
            <p className="text-3xl">🏠</p>
            <h1 className="text-lg font-semibold text-app-text">
              Únete a <span className="text-primary">{householdName}</span>
            </h1>
            {invitation && (
              <p className="text-sm text-muted">
                Invitación para <span className="font-medium">{invitation.email}</span>
              </p>
            )}
            {!user && (
              <p className="text-xs text-muted">
                Necesitas iniciar sesión o crear una cuenta para unirte.
              </p>
            )}
            <button
              onClick={handleAccept}
              className="w-full py-2.5 px-4 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              {user ? 'Unirme al hogar' : 'Iniciar sesión y unirme'}
            </button>
          </>
        )}

        {status === 'joining' && (
          <>
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted text-sm">Uniéndote al hogar…</p>
          </>
        )}

        {status === 'joined' && (
          <>
            <p className="text-3xl">🎉</p>
            <h1 className="text-lg font-semibold text-app-text">¡Bienvenido!</h1>
            <p className="text-sm text-muted">
              Ya eres miembro de <span className="font-medium">{householdName}</span>. Redirigiendo…
            </p>
          </>
        )}
      </div>
    </div>
  )
}
