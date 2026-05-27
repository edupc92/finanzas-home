import { PageWrapper } from '../components/layout/PageWrapper'
import { Card } from '../components/ui/Card'

export function BankingPage() {
  return (
    <PageWrapper title="Cuentas bancarias" subtitle="Próximamente">
      <Card>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-5xl mb-4">🏦</span>
          <h3 className="text-lg font-semibold text-app-text mb-2">Open Banking — Fase 2</h3>
          <p className="text-sm text-muted max-w-sm">
            Próximamente podrás conectar tus cuentas bancarias con GoCardless para importar
            transacciones automáticamente. Compatible con Santander, BBVA, CaixaBank, ING y más.
          </p>
        </div>
      </Card>
    </PageWrapper>
  )
}
