import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useHouseholdStore } from '../store/householdStore'
import { useUIStore } from '../store/uiStore'
import type { BankConnection, BankAccount } from '../types'

interface Institution {
  id: string
  name: string
  bic: string
  countries: string[]
  logo: string
}

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
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingInstitutions, setLoadingInstitutions] = useState(false)
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

  // Called on mount if URL has ?ref= (GoCardless redirect back)
  async function confirmConnection(requisitionId: string) {
    if (!activeHouseholdId) return
    const data = await callEdge('bank-connect', {
      action: 'confirm',
      requisitionId,
      householdId: activeHouseholdId,
    })
    if (data.success) {
      addToast(`Banco conectado — ${data.accountCount} cuenta${data.accountCount !== 1 ? 's' : ''} importada${data.accountCount !== 1 ? 's' : ''}`)
      await fetchConnections()
    } else {
      addToast(data.error ?? 'Error al confirmar la conexión', 'error')
    }
  }

  async function loadInstitutions(country = 'ES') {
    setLoadingInstitutions(true)
    const data = await callEdge('bank-connect', { action: 'institutions', country })
    setInstitutions(Array.isArray(data) ? data : [])
    setLoadingInstitutions(false)
  }

  async function connectBank(institution: Institution) {
    if (!activeHouseholdId) return
    const redirectUrl = `${window.location.origin}/bank`
    const data = await callEdge('bank-connect', {
      action: 'create',
      institutionId: institution.id,
      institutionName: institution.name,
      householdId: activeHouseholdId,
      redirectUrl,
    })
    if (data.link) {
      window.location.href = data.link
    } else {
      addToast(data.error ?? 'Error al iniciar la conexión', 'error')
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
    institutions,
    loading,
    loadingInstitutions,
    syncing,
    loadInstitutions,
    connectBank,
    confirmConnection,
    syncTransactions,
    disconnectBank,
    refetch: fetchConnections,
  }
}
