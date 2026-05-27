import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useHouseholdStore } from '../store/householdStore'
import { useUIStore } from '../store/uiStore'
import type { BankConnection, BankAccount } from '../types'

async function callEdge(fnName: string, body: object) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fnName}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token ?? ''}`,
      },
      body: JSON.stringify(body),
    }
  )
  return res.json()
}

export function useBanking() {
  const activeHouseholdId = useHouseholdStore((s) => s.activeHouseholdId)
  const addToast = useUIStore((s) => s.addToast)

  const [connections, setConnections] = useState<BankConnection[]>([])
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const fetchConnections = useCallback(async () => {
    if (!activeHouseholdId) return
    setLoading(true)

    const { data: conns } = await supabase
      .from('bank_connections')
      .select('*')
      .eq('household_id', activeHouseholdId)
      .order('created_at', { ascending: false })

    const connList = (conns ?? []) as BankConnection[]
    setConnections(connList)

    if (connList.length) {
      const { data: accts } = await supabase
        .from('bank_accounts')
        .select('*')
        .in('bank_connection_id', connList.map((c) => c.id))
      setAccounts((accts ?? []) as BankAccount[])
    } else {
      setAccounts([])
    }

    setLoading(false)
  }, [activeHouseholdId])

  useEffect(() => {
    fetchConnections()
  }, [fetchConnections])

  async function startBankLink() {
    if (!activeHouseholdId) return
    const redirectUri = `${window.location.origin}/bank`
    const data = await callEdge('bank-connect', {
      action: 'link',
      redirectUri,
      householdId: activeHouseholdId,
    })
    if (data.url) {
      window.location.href = data.url
    } else {
      addToast(data.error ?? 'Error al iniciar la conexión', 'error')
    }
  }

  async function handleCallback(code: string, householdId: string) {
    const redirectUri = `${window.location.origin}/bank`
    const data = await callEdge('bank-connect', {
      action: 'callback',
      code,
      redirectUri,
      householdId,
    })
    if (data.success) {
      addToast(`Banco conectado — ${data.accountCount} cuenta${data.accountCount !== 1 ? 's' : ''} importada${data.accountCount !== 1 ? 's' : ''}`)
      await fetchConnections()
    } else {
      addToast(data.error ?? 'Error al confirmar la conexión', 'error')
    }
  }

  async function syncTransactions() {
    if (!activeHouseholdId) return
    setSyncing(true)
    try {
      const data = await callEdge('bank-sync', { householdId: activeHouseholdId })
      if (data.error) {
        addToast(data.error, 'error')
      } else {
        addToast(`Sincronizadas ${data.synced} transacciones nuevas`)
        await fetchConnections()
      }
    } finally {
      setSyncing(false)
    }
  }

  async function disconnectBank(connectionId: string) {
    const { error } = await supabase
      .from('bank_connections')
      .update({ status: 'revoked' })
      .eq('id', connectionId)
    if (error) {
      addToast('Error al desconectar', 'error')
    } else {
      addToast('Banco desconectado')
      await fetchConnections()
    }
  }

  return {
    connections,
    accounts,
    loading,
    syncing,
    startBankLink,
    handleCallback,
    syncTransactions,
    disconnectBank,
    refetch: fetchConnections,
  }
}
