import { useEffect, useRef, useState } from 'react'
import { cn } from '@/utils/cn'

interface DropdownItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
  separator?: boolean
}

interface DropdownProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
}

export function Dropdown({ trigger, items, align = 'right' }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative inline-block" ref={ref}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">{trigger}</div>
      {open && (
        <div className={cn('absolute z-50 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black/5 focus:outline-none', align === 'right' ? 'right-0' : 'left-0')}>
          <div className="py-1">
            {items.map((item, i) => (
              item.separator
                ? <hr key={i} className="my-1 border-gray-100" />
                : <button
                    key={i}
                    onClick={() => { item.onClick(); setOpen(false) }}
                    disabled={item.disabled}
                    className={cn(
                      'flex items-center gap-2 w-full px-4 py-2 text-sm text-left transition-colors',
                      item.variant === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50',
                      item.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
