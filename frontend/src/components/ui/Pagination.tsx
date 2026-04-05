import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from './cn'

interface PaginationProps {
  page: number
  pages: number
  total?: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ page, pages, total, onPageChange, className }: PaginationProps) {
  if (pages <= 1) return null

  return (
    <div className={cn('flex items-center justify-between pt-4', className)}>
      <span className="text-xs text-slate-400 tabular-nums">
        {total !== undefined ? `共 ${total} 条` : `第 ${page} / ${pages} 页`}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
          const p = i + 1
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'min-w-8 h-8 rounded-lg text-xs font-medium transition-all duration-150',
                page === p
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              {p}
            </button>
          )
        })}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
