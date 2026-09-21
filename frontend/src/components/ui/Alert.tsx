import { cn } from '@/utils/cn'
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'

interface AlertProps {
  variant: 'info' | 'success' | 'warning' | 'error'
  title?: string
  message: ReactNode
  dismissible?: boolean
}

const styles = {
  info: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', icon: <Info className="h-5 w-5 text-blue-500" /> },
  success: { bg: 'bg-green-50 border-green-200', text: 'text-green-800', icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
  warning: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', icon: <AlertCircle className="h-5 w-5 text-amber-500" /> },
  error: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', icon: <XCircle className="h-5 w-5 text-red-500" /> },
}

export function Alert({ variant, title, message, dismissible }: AlertProps) {
  const [hidden, setHidden] = useState(false)
  if (hidden) return null
  const s = styles[variant]
  return (
    <div className={cn('flex gap-3 p-4 rounded-lg border', s.bg)}>
      <div className="flex-shrink-0">{s.icon}</div>
      <div className={cn('flex-1 text-sm', s.text)}>
        {title && <p className="font-semibold mb-1">{title}</p>}
        <p>{message}</p>
      </div>
      {dismissible && <button onClick={() => setHidden(true)} className={cn('text-sm', s.text)}><X className="h-4 w-4" /></button>}
    </div>
  )
}
