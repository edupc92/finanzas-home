import { cn } from '../../lib/utils'

type Variant = 'income' | 'expense' | 'owner' | 'member' | 'default'

interface BadgeProps {
  variant?: Variant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<Variant, string> = {
  income: 'bg-secondary/10 text-secondary',
  expense: 'bg-danger/10 text-danger',
  owner: 'bg-primary/10 text-primary',
  member: 'bg-gray-100 text-muted',
  default: 'bg-gray-100 text-muted',
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
