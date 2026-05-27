import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
}

interface UIState {
  toasts: Toast[]
  addToast: (message: string, type?: ToastType) => void
  removeToast: (id: string) => void
  sidebarOpen: boolean
  toggleSidebar: () => void
  transactionModalOpen: boolean
  openTransactionModal: () => void
  closeTransactionModal: () => void
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  addToast: (message, type = 'success') => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  transactionModalOpen: false,
  openTransactionModal: () => set({ transactionModalOpen: true }),
  closeTransactionModal: () => set({ transactionModalOpen: false }),
}))
