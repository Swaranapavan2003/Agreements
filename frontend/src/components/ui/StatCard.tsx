import { cn } from '@/utils/cn'
import type { ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  iconBg: string
  iconColor: string
  change?: { value: number; label: string; positive: boolean }
  onClick?: () => void
}

export function StatCard({ title, value, icon, iconBg, iconColor, change, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn('bg-white rounded-lg border border-gray-200 shadow-sm p-6', onClick && 'cursor-pointer hover:shadow-md transition-shadow')}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className={cn('mt-1 flex items-center gap-1 text-xs', change.positive ? 'text-green-600' : 'text-red-600')}>
              {change.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{change.label}</span>
            </div>
          )}
        </div>
        <div className={cn('h-12 w-12 rounded-full flex items-center justify-center', iconBg)}>
          <div className={cn('h-6 w-6', iconColor)}>{icon}</div>
        </div>
      </div>
    </div>
  )
}
