import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

type Tab = 'login' | 'register' | 'reset'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

const registerSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

const resetSchema = z.object({
  email: z.string().email('Email inválido'),
})

const authErrors: Record<string, string> = {
  'Invalid login credentials': 'Credenciales incorrectas',
  'Email not confirmed': 'Confirma tu email antes de iniciar sesión',
  'User already registered': 'Este email ya está registrado',
}

function mapError(msg: string): string {
  return authErrors[msg] ?? msg
}

export function AuthPage() {
  const { user } = useAuthStore()
  const { signIn, signUp, resetPassword } = useAuth()
  const [tab, setTab] = useState<Tab>('login')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loginForm = useForm({ resolver: zodResolver(loginSchema) })
  const registerForm = useForm({ resolver: zodResolver(registerSchema) })
  const resetForm = useForm({ resolver: zodResolver(resetSchema) })

  if (user) return <Navigate to="/dashboard" replace />

  async function handleLogin(data: z.infer<typeof loginSchema>) {
    setError(''); setSubmitting(true)
    try { await signIn(data.email, data.password) }
    catch (e: any) { setError(mapError(e.message)) }
    finally { setSubmitting(false) }
  }

  async function handleRegister(data: z.infer<typeof registerSchema>) {
    setError(''); setSubmitting(true)
    try {
      await signUp(data.email, data.password, data.fullName)
      setSuccess('Revisa tu email para confirmar tu cuenta.')
    }
    catch (e: any) { setError(mapError(e.message)) }
    finally { setSubmitting(false) }
  }

  async function handleReset(data: z.infer<typeof resetSchema>) {
    setError(''); setSubmitting(true)
    try {
      await resetPassword(data.email)
      setSuccess('Te hemos enviado un email con las instrucciones.')
    }
    catch (e: any) { setError(mapError(e.message)) }
    finally { setSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">💶 FinanzasHogar</h1>
          <p className="text-sm text-muted mt-2">Gestiona las finanzas de tu hogar</p>
        </div>

        <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-6">
          {tab !== 'reset' && (
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6">
              <button
                onClick={() => { setTab('login'); setError(''); setSuccess('') }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  tab === 'login' ? 'bg-white text-app-text shadow-sm' : 'text-muted'
                }`}
              >
                Iniciar sesión
              </button>
              <button
                onClick={() => { setTab('register'); setError(''); setSuccess('') }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  tab === 'register' ? 'bg-white text-app-text shadow-sm' : 'text-muted'
                }`}
              >
                Crear cuenta
              </button>
            </div>
          )}

          {tab === 'reset' && (
            <div className="mb-6">
              <button
                onClick={() => { setTab('login'); setError(''); setSuccess('') }}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                ← Volver al inicio de sesión
              </button>
              <h2 className="text-lg font-semibold text-app-text mt-3">Recuperar contraseña</h2>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-danger/10 text-danger text-sm">{error}</div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-secondary/10 text-secondary text-sm">{success}</div>
          )}

          {tab === 'login' && (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <Input label="Email" type="email" {...loginForm.register('email')} error={loginForm.formState.errors.email?.message} />
              <Input label="Contraseña" type="password" {...loginForm.register('password')} error={loginForm.formState.errors.password?.message} />
              <Button type="submit" fullWidth loading={submitting}>Iniciar sesión</Button>
              <button
                type="button"
                onClick={() => { setTab('reset'); setError(''); setSuccess('') }}
                className="w-full text-xs text-muted hover:text-primary transition-colors mt-1"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </form>
          )}

          {tab === 'register' && (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <Input label="Nombre completo" {...registerForm.register('fullName')} error={registerForm.formState.errors.fullName?.message} />
              <Input label="Email" type="email" {...registerForm.register('email')} error={registerForm.formState.errors.email?.message} />
              <Input label="Contraseña" type="password" {...registerForm.register('password')} error={registerForm.formState.errors.password?.message} />
              <Input label="Confirmar contraseña" type="password" {...registerForm.register('confirmPassword')} error={registerForm.formState.errors.confirmPassword?.message} />
              <Button type="submit" fullWidth loading={submitting}>Crear cuenta</Button>
            </form>
          )}

          {tab === 'reset' && (
            <form onSubmit={resetForm.handleSubmit(handleReset)} className="space-y-4">
              <Input label="Email" type="email" {...resetForm.register('email')} error={resetForm.formState.errors.email?.message} />
              <Button type="submit" fullWidth loading={submitting}>Enviar instrucciones</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
