import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useHouseholdStore } from '../store/householdStore'
import { useUIStore } from '../store/uiStore'
import type { Household, HouseholdMember, Invitation } from '../types'

export function useHousehold() {
  const user = useAuthStore((s) => s.user)
  const { households, activeHouseholdId, members, setHouseholds, setActiveHousehold, setMembers } =
    useHouseholdStore()
  const addToast = useUIStore((s) => s.addToast)
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([])

  const fetchHouseholds = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('household_members')
      .select('household_id, households(*)')
      .eq('user_id', user.id)

    if (error || !data) return

    const hh = data
      .map((row: any) => row.households as Household)
      .filter(Boolean)

    setHouseholds(hh, user.id)
  }, [user, setHouseholds])

  const fetchMembers = useCallback(async (householdId: string) => {
    const { data, error } = await supabase
      .from('household_members')
      .select('*, profile:profiles(*)')
      .eq('household_id', householdId)

    if (!error && data) setMembers(data as HouseholdMember[])
  }, [setMembers])

  const fetchPendingInvitations = useCallback(async (householdId: string) => {
    const { data } = await supabase
      .from('invitations')
      .select('*')
      .eq('household_id', householdId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    setPendingInvitations((data as Invitation[]) ?? [])
  }, [])

  useEffect(() => {
    fetchHouseholds()
  }, [fetchHouseholds])

  useEffect(() => {
    if (activeHouseholdId) fetchMembers(activeHouseholdId)
  }, [activeHouseholdId, fetchMembers])

  const activeHousehold = households.find((h) => h.id === activeHouseholdId)
  const isOwner = activeHousehold?.owner_id === user?.id

  useEffect(() => {
    if (activeHouseholdId && isOwner) fetchPendingInvitations(activeHouseholdId)
  }, [activeHouseholdId, isOwner, fetchPendingInvitations])

  async function updateHouseholdName(name: string) {
    if (!activeHouseholdId) return
    const { error } = await supabase
      .from('households')
      .update({ name })
      .eq('id', activeHouseholdId)
    if (error) throw error
    await fetchHouseholds()
    addToast('Nombre del hogar actualizado')
  }

  async function removeMember(userId: string) {
    if (!activeHouseholdId) return
    const { error } = await supabase
      .from('household_members')
      .delete()
      .eq('household_id', activeHouseholdId)
      .eq('user_id', userId)
    if (error) throw error
    await fetchMembers(activeHouseholdId)
    addToast('Miembro eliminado')
  }

  async function createInvitation(email: string): Promise<string> {
    if (!activeHouseholdId || !user) throw new Error('No hay hogar activo')
    const { data, error } = await supabase
      .from('invitations')
      .upsert(
        {
          household_id: activeHouseholdId,
          email,
          created_by: user.id,
          accepted_at: null,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: 'household_id,email', ignoreDuplicates: false }
      )
      .select('token')
      .single()

    if (error) throw error
    await fetchPendingInvitations(activeHouseholdId)
    addToast(`Invitación creada para ${email}`)
    return `${window.location.origin}/accept-invite?token=${data.token}`
  }

  async function revokeInvitation(id: string) {
    if (!activeHouseholdId) return
    const { error } = await supabase.from('invitations').delete().eq('id', id)
    if (error) throw error
    await fetchPendingInvitations(activeHouseholdId)
    addToast('Invitación cancelada')
  }

  function switchHousehold(id: string) {
    if (!user) return
    setActiveHousehold(id, user.id)
  }

  return {
    households,
    activeHousehold,
    activeHouseholdId,
    members,
    pendingInvitations,
    isOwner,
    switchHousehold,
    updateHouseholdName,
    removeMember,
    createInvitation,
    revokeInvitation,
    refetch: fetchHouseholds,
  }
}
