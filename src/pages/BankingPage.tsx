import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Spinner } from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'
import { useBanking } from '../hooks/useBanking'
import type { BankConnection } from '../types'

const STATUS_LABEL: Record<string, string> = {
  active: 'Activo',
  pending: 'Pendiente',
  expired: 'Expirado',
  revoked: 'Desconectado',
}

const STATUS_VARIANT: Record<string, 'owner' | 'member'> = {
  active: 'owner',
  pending: 'member',
  expired: 'member',
  revoked: 'member',
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
      <Badge variant={STATUS_VARIANT[conn.status] ?? 'member'}>
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
  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [confirming, setConfirming] = useState(false)

  const {
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
  } = useBanking()

  // Handle GoCardless redirect back with ?ref=
  useEffect(() => {
    const ref = searchParams.get('ref')
    if (!ref) return
    setConfirming(true)
    confirmConnection(ref).finally(() => {
      setConfirming(false)
      setSearchParams({}, { replace: true })
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleOpenAdd() {
    setAddOpen(true)
    if (!institutions.length) loadInstitutions()
  }

  const filtered = institutions.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )

  const accountsByConnection = (connId: string) =>
    accounts.filter((a) => a.bank_connection_id === connId).length

  return (
    <PageWrapper title="Cuentas bancarias" subtitle="Conexiones Open Banking">
      {confirming && (
        <Card>
          <div className="flex items-center gap-3 py-4 justify-center">
            <Spinner size="sm" className="text-primary" />
            <p className="text-sm text-muted">Confirmando conexión con el banco…</p>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-primary" />
        </div>
      ) : (
        <>
          {connections.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-5xl mb-4">🏦</span>
                <h3 className="text-lg font-semibold text-app-text mb-2">
                  Conecta tu banco
                </h3>
                <p className="text-sm text-muted max-w-sm mb-6">
                  Vincula tus cuentas bancarias con Open Banking para importar
                  transacciones automáticamente. Compatible con Santander, BBVA,
                  CaixaBank, ING y más de 2.000 bancos europeos.
                </p>
                <Button onClick={handleOpenAdd}>+ Añadir banco</Button>
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
                  <Button size="sm" onClick={handleOpenAdd}>+ Añadir banco</Button>
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
        </>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Selecciona tu banco" size="lg">
        <div className="space-y-4">
          <Input
            placeholder="Buscar banco… (Santander, BBVA, ING…)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {loadingInstitutions ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" className="text-primary" />
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-1">
              {filtered.length === 0 && (
                <p className="text-sm text-muted text-center py-8">
                  {search ? 'No se encontraron resultados' : 'No hay bancos disponibles'}
                </p>
              )}
              {filtered.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => {
                    setAddOpen(false)
                    connectBank(inst)
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  {inst.logo ? (
                    <img
                      src={inst.logo}
                      alt={inst.name}
                      className="w-8 h-8 rounded-lg object-contain"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-base">
                      🏦
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-app-text truncate">{inst.name}</p>
                    {inst.bic && <p className="text-xs text-muted">{inst.bic}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </PageWrapper>
  )
}
