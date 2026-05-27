import { useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useHouseholdStore } from '../../store/householdStore'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setLoading, clear } = useAuthStore()
  const clearHousehold = useHouseholdStore((s) => s.clear)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setLoading(false)
      if (event === 'SIGNED_OUT') {
        clear()
        clearHousehold()
      }
    })

    return () => subscription.unsubscribe()
  }, [setSession, setLoading, clear, clearHousehold])

  return <>{children}</>
}
