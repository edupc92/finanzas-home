import { create } from 'zustand'
import type { Household, HouseholdMember } from '../types'

const STORAGE_KEY = (uid: string) => `finanzas_active_household_${uid}`

interface HouseholdState {
  households: Household[]
  activeHouseholdId: string | null
  members: HouseholdMember[]
  setHouseholds: (households: Household[], userId: string) => void
  setActiveHousehold: (id: string, userId: string) => void
  setMembers: (members: HouseholdMember[]) => void
  clear: () => void
}

export const useHouseholdStore = create<HouseholdState>((set) => ({
  households: [],
  activeHouseholdId: null,
  members: [],

  setHouseholds: (households, userId) => {
    const saved = localStorage.getItem(STORAGE_KEY(userId))
    const valid = saved && households.some((h) => h.id === saved)
    const activeId = valid ? saved : (households[0]?.id ?? null)
    set({ households, activeHouseholdId: activeId })
    if (activeId) localStorage.setItem(STORAGE_KEY(userId), activeId)
  },

  setActiveHousehold: (id, userId) => {
    set({ activeHouseholdId: id })
    localStorage.setItem(STORAGE_KEY(userId), id)
  },

  setMembers: (members) => set({ members }),

  clear: () => {
    set({ households: [], activeHouseholdId: null, members: [] })
  },
}))

export function getActiveHousehold(state: HouseholdState): Household | undefined {
  return state.households.find((h) => h.id === state.activeHouseholdId)
}
