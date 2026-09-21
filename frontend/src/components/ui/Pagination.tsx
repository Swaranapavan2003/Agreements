import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'

interface PaginationProps {
  page: number
  per_page: number
  total: number
  pages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, per_page, total, pages, onPageChange }: PaginationProps) {
  const start = (page - 1) * per_page + 1
  const end = Math.min(page * per_page, total)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <p className="text-sm text-gray-600">Showing <span className="font-medium">{start}–{end}</span> of <span className="font-medium">{total}</span></p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
          className="p-1 rounded text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft className="h-5 w-5" />
        </button>
        {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
          const p = i + 1
          return (
            <button key={p} onClick={() => onPageChange(p)}
              className={cn('px-3 py-1 text-sm rounded', page === p ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100')}>
              {p}
            </button>
          )
        })}
        <button onClick={() => onPageChange(page + 1)} disabled={page >= pages}
          className="p-1 rounded text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
