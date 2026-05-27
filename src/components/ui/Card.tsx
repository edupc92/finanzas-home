import { cn } from '../../lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
}

export function Card({ children, className, padding = true }: CardProps) {
  return (
    <div className={cn('bg-surface rounded-xl shadow-sm border border-gray-100', padding && 'p-4', className)}>
      {children}
    </div>
  )
}
