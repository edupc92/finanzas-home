import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useHouseholdStore } from '../store/householdStore'
import { useUIStore } from '../store/uiStore'
import { lastDayOfMonth } from '../lib/utils'
import type { Transaction, TransactionFilters } from '../types'

const PAGE_SIZE = 20

export function useTransactions(initialFilters: TransactionFilters = {}) {
  const activeHouseholdId = useHouseholdStore((s) => s.activeHouseholdId)
  const addToast = useUIStore((s) => s.addToast)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const fetch = useCallback(async (f: TransactionFilters, p: number) => {
    if (!activeHouseholdId) return
    setLoading(true)

    let query = supabase
      .from('transactions')
      .select('*, category:categories(*), profile:profiles(*)', { count: 'exact' })
      .eq('household_id', activeHouseholdId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (f.month) {
      query = query
        .gte('date', `${f.month}-01`)
        .lte('date', lastDayOfMonth(f.month))
    }
    if (f.categoryId) query = query.eq('category_id', f.categoryId)
    if (f.type) query = query.eq('type', f.type)
    if (f.userId) query = query.eq('user_id', f.userId)
    if (f.search) query = query.ilike('description', `%${f.search}%`)

    query = query.range(p * PAGE_SIZE, (p + 1) * PAGE_SIZE - 1)

    const { data, count: total, error } = await query
    if (!error) {
      setTransactions(p === 0 ? (data as Transaction[]) : (prev) => [...prev, ...(data as Transaction[])])
      setCount(total ?? 0)
      setHasMore((p + 1) * PAGE_SIZE < (total ?? 0))
    }
    setLoading(false)
  }, [activeHouseholdId])

  useEffect(() => {
    setPage(0)
    fetch(filters, 0)
  }, [filters, fetch])

  function updateFilter(key: keyof TransactionFilters, value: string | undefined) {
    if (key === 'search') {
      clearTimeout(searchTimer.current)
      searchTimer.current = setTimeout(() => {
        setFilters((f) => ({ ...f, search: value }))
      }, 300)
    } else {
      setFilters((f) => ({ ...f, [key]: value }))
    }
  }

  function loadMore() {
    const next = page + 1
    setPage(next)
    fetch(filters, next)
  }

  async function createTransaction(payload: {
    amount: number
    type: 'income' | 'expense'
    category_id: string | null
    description: string
    date: string
  }) {
    if (!activeHouseholdId) return
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return
    const { error } = await supabase.from('transactions').insert({
      ...payload,
      household_id: activeHouseholdId,
      user_id: user.id,
      source: 'manual',
    })
    if (error) throw error
    addToast('Transacción registrada')
    setFilters((f) => ({ ...f }))
  }

  async function updateTransaction(id: string, payload: Partial<Transaction>) {
    const { error } = await supabase.from('transactions').update(payload).eq('id', id)
    if (error) throw error
    addToast('Transacción actualizada')
    setFilters((f) => ({ ...f }))
  }

  async function deleteTransaction(id: string) {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) throw error
    addToast('Transacción eliminada')
    setFilters((f) => ({ ...f }))
  }

  return {
    transactions,
    filters,
    loading,
    hasMore,
    count,
    updateFilter,
    loadMore,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: () => fetch(filters, page),
  }
}
