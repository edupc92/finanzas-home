import { cn } from '../../lib/utils'

interface ProgressBarProps {
  value: number
  max: number
  className?: string
  showLabel?: boolean
}

export function ProgressBar({ value, max, className, showLabel = false }: ProgressBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const color =
    pct >= 100 ? 'bg-danger' : pct >= 75 ? 'bg-warning' : 'bg-secondary'

  return (
    <div className={cn('w-full', className)}>
      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-xs text-muted text-right">{Math.round(pct)}%</p>
      )}
    </div>
  )
}
