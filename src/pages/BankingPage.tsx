import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'
import { useBanking } from '../hooks/useBanking'
import { useHouseholdStore } from '../store/householdStore'
import type { BankConnection } from '../types'

const STATUS_LABEL: Record<string, string> = {
  active: 'Activo',
  pending: 'Pendiente',
  expired: 'Expirado',
  revoked: 'Desconectado',
}

function ConnectionCard({
  conn,
  accountCount,
  onSync,
  onDisconnect,
  syncing,
}: {
  conn: BankConnection
  accountCount: number
  onSync: () => void
  onDisconnect: () => void
  syncing: boolean
}) {
  return (
    <div className="flex items-center gap-4 py-4">
      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
        🏦
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-app-text">{conn.institution_name}</p>
        <p className="text-xs text-muted">
          {accountCount} cuenta{accountCount !== 1 ? 's' : ''}
          {conn.last_sync_at && (
            <> · Última sync: {new Date(conn.last_sync_at).toLocaleDateString('es-ES')}</>
          )}
        </p>
      </div>
      <Badge variant={conn.status === 'active' ? 'owner' : 'member'}>
        {STATUS_LABEL[conn.status] ?? conn.status}
      </Badge>
      {conn.status === 'active' && (
        <Button variant="outline" size="sm" onClick={onSync} loading={syncing}>
          Sincronizar
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={onDisconnect}>
        Desconectar
      </Button>
    </div>
  )
}

export function BankingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [confirming, setConfirming] = useState(false)
  const activeHouseholdId = useHouseholdStore((s) => s.activeHouseholdId)

  const {
    connections,
    accounts,
    loading,
    syncing,
    startBankLink,
    handleCallback,
    syncTransactions,
    disconnectBank,
  } = useBanking()

  // Handle TrueLayer OAuth redirect: /bank?code=xxx&state=householdId
  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const householdId = state ?? activeHouseholdId
    if (!code || !householdId) return

    setConfirming(true)
    handleCallback(code, householdId).finally(() => {
      setConfirming(false)
      setSearchParams({}, { replace: true })
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const accountsByConnection = (connId: string) =>
    accounts.filter((a) => a.bank_connection_id === connId).length

  return (
    <PageWrapper title="Cuentas bancarias" subtitle="Open Banking via TrueLayer">
      {confirming && (
        <Card>
          <div className="flex items-center gap-3 py-4 justify-center">
            <Spinner size="sm" className="text-primary" />
            <p className="text-sm text-muted">Importando cuentas bancarias…</p>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-primary" />
        </div>
      ) : connections.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4">🏦</span>
            <h3 className="text-lg font-semibold text-app-text mb-2">Conecta tu banco</h3>
            <p className="text-sm text-muted max-w-sm mb-6">
              Vincula tus cuentas bancarias con Open Banking para importar transacciones
              automáticamente. Compatible con Santander, BBVA, CaixaBank, ING y más de
              2.000 bancos europeos.
            </p>
            <Button onClick={startBankLink}>+ Conectar banco</Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-app-text">Bancos conectados</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={syncTransactions} loading={syncing}>
                Sincronizar todo
              </Button>
              <Button size="sm" onClick={startBankLink}>+ Añadir banco</Button>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {connections.map((conn) => (
              <ConnectionCard
                key={conn.id}
                conn={conn}
                accountCount={accountsByConnection(conn.id)}
                onSync={syncTransactions}
                onDisconnect={() => disconnectBank(conn.id)}
                syncing={syncing}
              />
            ))}
          </div>
        </Card>
      )}
    </PageWrapper>
  )
}
