import { cn } from '@/utils/cn'
import type { ReactNode } from 'react'

interface CardProps { children: ReactNode; className?: string; padding?: 'none' | 'sm' | 'md' | 'lg'; onClick?: () => void }
const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' }

export function Card({ children, className, padding = 'md', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn('bg-white rounded-lg border border-gray-200 shadow-sm', paddings[padding], onClick && 'cursor-pointer hover:shadow-md transition-shadow', className)}
    >
      {children}
    </div>
  )
}
