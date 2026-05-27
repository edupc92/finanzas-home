import { useUIStore } from '../../store/uiStore'
import { cn } from '../../lib/utils'

const typeStyles = {
  success: 'bg-secondary text-white',
  error: 'bg-danger text-white',
  info: 'bg-primary text-white',
}

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium',
            'animate-in slide-in-from-right duration-300',
            typeStyles[toast.type]
          )}
        >
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
