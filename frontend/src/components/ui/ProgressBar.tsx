import { cn } from './cn'

interface ProgressBarProps {
  value: number
  size?: 'sm' | 'md'
  color?: 'primary' | 'success' | 'warning' | 'danger'
  className?: string
  showLabel?: boolean
}

const heights = { sm: 'h-1', md: 'h-2' }

export function ProgressBar({
  value,
  size = 'md',
  className,
  showLabel,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500">进度</span>
          <span className="text-xs font-semibold text-gray-700 tabular-nums">{Math.round(pct)}%</span>
        </div>
      )}
      <div
        className={cn('w-full rounded-full overflow-hidden', heights[size])}
        style={{ background: '#f3f4f6' }}
      >
        <div
          className={cn(heights[size], 'rounded-full transition-all duration-700 ease-out')}
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #1dd3b0 0%, #10b981 100%)',
            boxShadow: pct > 0 ? '0 0 8px rgba(29,211,176,0.4)' : 'none',
          }}
        />
      </div>
    </div>
  )
}
