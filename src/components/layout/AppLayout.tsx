import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { ToastContainer } from '../ui/Toast'
import { TransactionModal } from '../transactions/TransactionModal'
import { useUIStore } from '../../store/uiStore'
import { useHousehold } from '../../hooks/useHousehold'

export function AppLayout() {
  useHousehold()
  const { transactionModalOpen, closeTransactionModal } = useUIStore()

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <main className="md:ml-60 pb-20 md:pb-0 min-h-screen">
        <Outlet />
      </main>
      <BottomNav />
      <ToastContainer />
      <TransactionModal open={transactionModalOpen} onClose={closeTransactionModal} />
    </div>
  )
}
