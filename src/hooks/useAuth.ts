import { useAuthStore } from '../store/authStore'
import { useHouseholdStore } from '../store/householdStore'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const { user, session, loading } = useAuthStore()
  const clearHousehold = useHouseholdStore((s) => s.clear)
  const clearAuth = useAuthStore((s) => s.clear)

  async function signUp(email: string, password: string, fullName: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    clearAuth()
    clearHousehold()
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    })
    if (error) throw error
  }

  async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  return { user, session, loading, signUp, signIn, signOut, resetPassword, updatePassword }
}
