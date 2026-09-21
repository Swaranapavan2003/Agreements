import { cn } from '@/utils/cn'
import type { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'gray' | 'indigo'
  children: ReactNode
  dot?: boolean
  size?: 'sm' | 'md'
}

const variants = {
  success: 'bg-green-50 text-green-700 ring-green-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  error: 'bg-red-50 text-red-700 ring-red-600/20',
  info: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  gray: 'bg-gray-50 text-gray-700 ring-gray-600/20',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
}

const dotColors = {
  success: 'bg-green-500', warning: 'bg-amber-500', error: 'bg-red-500',
  info: 'bg-blue-500', gray: 'bg-gray-500', indigo: 'bg-indigo-500',
}

const sizes = { sm: 'px-2 py-0.5 text-xs', md: 'px-2.5 py-1 text-xs' }

export function Badge({ variant = 'gray', children, dot, size = 'md' }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset', variants[variant], sizes[size])}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  )
}
