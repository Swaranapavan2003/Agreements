import { Bell, Check } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useUnreadCount, useNotifications, useMarkAllRead, useMarkRead } from '@/hooks/useNotifications'
import { NotificationItem } from './NotificationItem'
import { cn } from '@/utils/cn'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { data: count = 0 } = useUnreadCount()
  const { data: notifications } = useNotifications({ per_page: 5 })
  const markAllRead = useMarkAllRead()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl ring-1 ring-black/5 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {count > 0 && (
              <button onClick={() => markAllRead.mutate()} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications?.items.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No notifications</p>
              </div>
            ) : (
              notifications?.items.map(n => <NotificationItem key={n.id} notification={n} onClose={() => setOpen(false)} />)
            )}
          </div>
          <div className="px-4 py-3 border-t">
            <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View all notifications</button>
          </div>
        </div>
      )}
    </div>
  )
}
