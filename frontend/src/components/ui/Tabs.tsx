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
      style={{ background: '#f3f4f6', border: '1px solid #e5e7eb' }}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer',
            active === tab.key
              ? 'text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-800 hover:bg-white'
          )}
          style={active === tab.key ? {
            background: 'linear-gradient(135deg, #1dd3b0 0%, #10b981 100%)',
            boxShadow: '0 2px 8px rgba(29,211,176,0.3)',
          } : {}}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
