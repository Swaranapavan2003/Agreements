import api from './api'
import type { APIResponse, PaginatedData } from '@/types/common.types'
import type { Notification, UnreadCount } from '@/types/notification.types'

interface ListNotificationsParams {
  page?: number
  per_page?: number
  unread_only?: boolean
}

export const notificationService = {
  listNotifications: (params: ListNotificationsParams = {}) =>
    api.get<APIResponse<PaginatedData<Notification>>>('/notifications', { params }).then(r => r.data),

  getUnreadCount: () =>
    api.get<APIResponse<UnreadCount>>('/notifications/unread-count').then(r => r.data),

  markRead: (id: string) =>
    api.patch<APIResponse<{ message: string }>>(`/notifications/${id}/read`).then(r => r.data),

  markAllRead: () =>
    api.post<APIResponse<{ message: string }>>('/notifications/read-all').then(r => r.data),
}
