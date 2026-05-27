import { cn } from '../../lib/utils'

interface AvatarProps {
  name?: string | null
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-11 w-11 text-base' }

function initials(name?: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'Avatar'}
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    )
  }
  return (
    <div
      className={cn(
        'rounded-full bg-primary text-white flex items-center justify-center font-semibold',
        sizes[size],
        className
      )}
    >
      {initials(name)}
    </div>
  )
}
