import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useHouseholdStore } from '../store/householdStore'
import { useUIStore } from '../store/uiStore'
import type { Category, CategoryType } from '../types'

export function useCategories(typeFilter?: CategoryType) {
  const activeHouseholdId = useHouseholdStore((s) => s.activeHouseholdId)
  const addToast = useUIStore((s) => s.addToast)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!activeHouseholdId) return
    setLoading(true)
    let query = supabase
      .from('categories')
      .select('*')
      .eq('household_id', activeHouseholdId)
      .order('type')
      .order('name')

    if (typeFilter) query = query.eq('type', typeFilter)

    const { data } = await query
    setCategories((data as Category[]) ?? [])
    setLoading(false)
  }, [activeHouseholdId, typeFilter])

  useEffect(() => { fetch() }, [fetch])

  async function createCategory(payload: Omit<Category, 'id' | 'household_id' | 'is_default'>) {
    if (!activeHouseholdId) return
    const { error } = await supabase
      .from('categories')
      .insert({ ...payload, household_id: activeHouseholdId, is_default: false })
    if (error) throw error
    addToast('Categoría creada')
    await fetch()
  }

  async function updateCategory(id: string, payload: Partial<Pick<Category, 'name' | 'icon' | 'color'>>) {
    const { error } = await supabase.from('categories').update(payload).eq('id', id)
    if (error) throw error
    addToast('Categoría actualizada')
    await fetch()
  }

  async function deleteCategory(id: string) {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) {
      if (error.code === '23503') {
        throw new Error('Esta categoría tiene transacciones asociadas y no puede eliminarse.')
      }
      throw error
    }
    addToast('Categoría eliminada')
    await fetch()
  }

  return { categories, loading, createCategory, updateCategory, deleteCategory, refetch: fetch }
}
