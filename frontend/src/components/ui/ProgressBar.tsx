import { cn } from './cn'

interface ProgressBarProps {
  value: number
  size?: 'sm' | 'md'
  color?: 'primary' | 'success' | 'warning' | 'danger'
  className?: string
  showLabel?: boolean
}

const heights = { sm: 'h-1.5', md: 'h-2' }
const colors = {
  primary: 'bg-primary-600',
  success: 'bg-success-600',
  warning: 'bg-warning-600',
  danger:  'bg-danger-600',
}

export function ProgressBar({
  value,
  size = 'md',
  color = 'primary',
  className,
  showLabel,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-slate-500">进度</span>
          <span className="text-xs font-semibold text-slate-700 tabular-nums">{Math.round(pct)}%</span>
        </div>
      )}
      <div className={cn('w-full bg-slate-100 rounded-full overflow-hidden', heights[size])}>
        <div
          className={cn(colors[color], heights[size], 'rounded-full transition-all duration-500 ease-out')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
