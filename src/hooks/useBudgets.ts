import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useHouseholdStore } from '../store/householdStore'
import { useUIStore } from '../store/uiStore'
import { currentMonth, prevMonth, lastDayOfMonth } from '../lib/utils'
import type { Budget } from '../types'

export function useBudgets() {
  const activeHouseholdId = useHouseholdStore((s) => s.activeHouseholdId)
  const addToast = useUIStore((s) => s.addToast)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const month = currentMonth()

  const fetch = useCallback(async () => {
    if (!activeHouseholdId) return
    setLoading(true)

    const { data: current } = await supabase
      .from('budgets')
      .select('*, category:categories(*)')
      .eq('household_id', activeHouseholdId)
      .eq('month', month)

    if (current && current.length === 0) {
      const { data: prev } = await supabase
        .from('budgets')
        .select('*')
        .eq('household_id', activeHouseholdId)
        .eq('month', prevMonth(month))

      if (prev && prev.length > 0) {
        await supabase.from('budgets').upsert(
          prev.map(({ id: _id, month: _m, ...rest }) => ({ ...rest, month })),
          { onConflict: 'household_id,category_id,month', ignoreDuplicates: true }
        )
        const { data: refetched } = await supabase
          .from('budgets')
          .select('*, category:categories(*)')
          .eq('household_id', activeHouseholdId)
          .eq('month', month)
        await enrichWithSpent(refetched as Budget[])
        setLoading(false)
        return
      }
    }

    await enrichWithSpent((current as Budget[]) ?? [])
    setLoading(false)
  }, [activeHouseholdId, month])

  async function enrichWithSpent(items: Budget[]) {
    if (items.length === 0) { setBudgets([]); return }

    const { data: txs } = await supabase
      .from('transactions')
      .select('category_id, amount')
      .eq('household_id', activeHouseholdId)
      .eq('type', 'expense')
      .gte('date', `${month}-01`)
      .lte('date', lastDayOfMonth(month))

    const spentMap: Record<string, number> = {}
    ;(txs ?? []).forEach((t: any) => {
      spentMap[t.category_id] = (spentMap[t.category_id] ?? 0) + Number(t.amount)
    })

    setBudgets(items.map((b) => ({ ...b, spent: spentMap[b.category_id] ?? 0 })))
  }

  useEffect(() => { fetch() }, [fetch])

  async function createBudget(categoryId: string, amount: number) {
    if (!activeHouseholdId) return
    const { error } = await supabase.from('budgets').upsert(
      { household_id: activeHouseholdId, category_id: categoryId, amount, month },
      { onConflict: 'household_id,category_id,month' }
    )
    if (error) throw error
    addToast('Presupuesto guardado')
    await fetch()
  }

  async function deleteBudget(id: string) {
    const { error } = await supabase.from('budgets').delete().eq('id', id)
    if (error) throw error
    addToast('Presupuesto eliminado')
    await fetch()
  }

  return { budgets, loading, month, createBudget, deleteBudget, refetch: fetch }
}
