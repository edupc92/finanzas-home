import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useHouseholdStore } from '../store/householdStore'
import { currentMonth, lastDayOfMonth } from '../lib/utils'
import type { Transaction, MonthlyData, DashboardSummary } from '../types'

function last6Months(): string[] {
  const months: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

export function useDashboard() {
  const activeHouseholdId = useHouseholdStore((s) => s.activeHouseholdId)
  const month = currentMonth()
  const [summary, setSummary] = useState<DashboardSummary>({ totalIncome: 0, totalExpense: 0, byCategory: [] })
  const [monthly, setMonthly] = useState<MonthlyData[]>([])
  const [recent, setRecent] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!activeHouseholdId) return
    setLoading(true)

    const months = last6Months()
    const earliest = months[0]

    const [{ data: txs }, { data: recentTxs }] = await Promise.all([
      supabase
        .from('transactions')
        .select('amount, type, date, category_id')
        .eq('household_id', activeHouseholdId)
        .gte('date', `${earliest}-01`)
        .lte('date', lastDayOfMonth(month)),
      supabase
        .from('transactions')
        .select('*, category:categories(*), profile:profiles(*)')
        .eq('household_id', activeHouseholdId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    const allTxs = (txs ?? []) as Array<{ amount: number; type: string; date: string; category_id: string }>

    const thisMonthTxs = allTxs.filter((t) => t.date >= `${month}-01` && t.date <= lastDayOfMonth(month))
    const totalIncome = thisMonthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
    const totalExpense = thisMonthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
    const catMap: Record<string, number> = {}
    thisMonthTxs.filter((t) => t.type === 'expense').forEach((t) => {
      if (t.category_id) catMap[t.category_id] = (catMap[t.category_id] ?? 0) + Number(t.amount)
    })
    setSummary({
      totalIncome,
      totalExpense,
      byCategory: Object.entries(catMap).map(([category_id, total]) => ({ category_id, total })),
    })

    const monthlyData: MonthlyData[] = months.map((m) => {
      const monthTxs = allTxs.filter((t) => t.date >= `${m}-01` && t.date <= lastDayOfMonth(m))
      return {
        month: m,
        income: monthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
        expense: monthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
      }
    })
    setMonthly(monthlyData)
    setRecent((recentTxs ?? []) as Transaction[])
    setLoading(false)
  }, [activeHouseholdId, month])

  useEffect(() => { fetch() }, [fetch])

  return { summary, monthly, recent, loading, month, refetch: fetch }
}
