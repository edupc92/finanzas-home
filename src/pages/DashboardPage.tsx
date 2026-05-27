import { PageWrapper } from '../components/layout/PageWrapper'
import { SummaryCards } from '../components/dashboard/SummaryCards'
import { IncomeExpenseChart } from '../components/dashboard/IncomeExpenseChart'
import { ExpenseDonutChart } from '../components/dashboard/ExpenseDonutChart'
import { RecentTransactions } from '../components/dashboard/RecentTransactions'
import { BudgetStatusList } from '../components/dashboard/BudgetStatusList'
import { useDashboard } from '../hooks/useDashboard'
import { useBudgets } from '../hooks/useBudgets'
import { useCategories } from '../hooks/useCategories'
import { Spinner } from '../components/ui/Spinner'
import { useHouseholdStore } from '../store/householdStore'
import { useHousehold } from '../hooks/useHousehold'

export function DashboardPage() {
  const { activeHousehold } = useHousehold()
  const { summary, monthly, recent, loading } = useDashboard()
  const { budgets } = useBudgets()
  const { categories } = useCategories('expense')
  const activeHouseholdId = useHouseholdStore((s) => s.activeHouseholdId)

  if (!activeHouseholdId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" className="text-primary" />
      </div>
    )
  }

  return (
    <PageWrapper
      title={activeHousehold?.name ?? 'Dashboard'}
      subtitle={new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
    >
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <SummaryCards summary={summary} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <IncomeExpenseChart data={monthly} />
            <ExpenseDonutChart summary={summary} categories={categories} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentTransactions transactions={recent} />
            <BudgetStatusList budgets={budgets} />
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
