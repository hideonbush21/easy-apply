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
          <span className="text-xs text-slate-400">进度</span>
          <span className="text-xs font-semibold text-slate-300 tabular-nums">{Math.round(pct)}%</span>
        </div>
      )}
      <div
        className={cn('w-full rounded-full overflow-hidden', heights[size])}
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        <div
          className={cn(heights[size], 'rounded-full transition-all duration-700 ease-out')}
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #7c3aed 0%, #0ea5e9 100%)',
            boxShadow: pct > 0 ? '0 0 8px rgba(139,92,246,0.5)' : 'none',
          }}
        />
      </div>
    </div>
  )
}
