import { cn } from './cn'

interface TabsProps {
  tabs: { key: string; label: string }[]
  active: string
  onChange: (key: string) => void
  className?: string
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn('inline-flex rounded-xl p-1 gap-0.5', className)}
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer',
            active === tab.key
              ? 'text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          )}
          style={active === tab.key ? {
            background: 'linear-gradient(135deg, rgba(124,58,237,0.6) 0%, rgba(14,165,233,0.6) 100%)',
          } : {}}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
