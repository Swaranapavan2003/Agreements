import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { notificationService } from '@/services/notification.service'
import { getErrorMessage } from '@/utils/formatters'

export function useNotifications(params: { page?: number; per_page?: number; unread_only?: boolean } = {}) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationService.listNotifications(params).then(r => r.data),
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => notificationService.getUnreadCount().then(r => r.data.count),
    refetchInterval: 30_000, // Poll every 30s
  })
}

export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications-count'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}
