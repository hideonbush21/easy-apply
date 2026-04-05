import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from './cn'

interface PaginationProps {
  page: number
  pages: number
  total?: number
  onPageChange: (page: number) => void
  className?: string
}

function getPageNumbers(page: number, pages: number): (number | '...')[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
  const result: (number | '...')[] = [1]
  if (page > 3) result.push('...')
  const start = Math.max(2, page - 1)
  const end = Math.min(pages - 1, page + 1)
  for (let i = start; i <= end; i++) result.push(i)
  if (page < pages - 2) result.push('...')
  result.push(pages)
  return result
}

export function Pagination({ page, pages, total, onPageChange, className }: PaginationProps) {
  if (pages <= 1) return null
  const pageNumbers = getPageNumbers(page, pages)

  return (
    <div className={cn('flex items-center justify-between pt-4', className)}>
      <span className="text-xs text-slate-500 tabular-nums">
        {total !== undefined ? `共 ${total} 条` : `第 ${page} / ${pages} 页`}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-white/5 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        {pageNumbers.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="min-w-8 h-8 flex items-center justify-center text-xs text-slate-500">···</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'min-w-8 h-8 rounded-lg text-xs font-medium transition-all duration-150',
                page === p
                  ? 'text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              )}
              style={page === p ? {
                background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)',
              } : {}}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-white/5 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
