import { cn } from '@/utils/cn'
import { formatRelativeTime } from '@/utils/formatters'
import { useMarkRead } from '@/hooks/useNotifications'
import type { Notification } from '@/types/notification.types'

const typeColors: Record<string, string> = {
  info: 'bg-blue-500', success: 'bg-green-500', warning: 'bg-amber-500', error: 'bg-red-500'
}

interface NotificationItemProps {
  notification: Notification
  onClose: () => void
}

export function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const markRead = useMarkRead()
  const handleClick = () => {
    if (!notification.is_read) markRead.mutate(notification.id)
    onClose()
  }
  return (
    <div onClick={handleClick} className={cn('flex gap-3 px-4 py-3 cursor-pointer transition-colors', notification.is_read ? 'hover:bg-gray-50' : 'bg-blue-50/50 hover:bg-blue-50')}>
      <div className={cn('h-2 w-2 rounded-full mt-2 flex-shrink-0', typeColors[notification.type] || 'bg-gray-400')} />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm truncate', notification.is_read ? 'text-gray-600' : 'text-gray-900 font-medium')}>{notification.title}</p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
        <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(notification.created_at)}</p>
      </div>
    </div>
  )
}
