export interface Notification {
  id: string
  organization_id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  event: string
  resource_type?: string
  resource_id?: string
  is_read: boolean
  read_at?: string
  created_at: string
}

export interface UnreadCount {
  count: number
}
