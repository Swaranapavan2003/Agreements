import { format, formatDistanceToNow, parseISO } from 'date-fns'

function parseDate(date: string | Date): Date {
  if (typeof date === 'string') return parseISO(date)
  return date
}

export function formatDate(date: string | Date): string {
  try { return format(parseDate(date), 'd MMM yyyy') } catch { return '—' }
}

export function formatDateTime(date: string | Date): string {
  try { return format(parseDate(date), 'd MMM yyyy, h:mm a') } catch { return '—' }
}

export function formatRelativeTime(date: string | Date): string {
  try { return formatDistanceToNow(parseDate(date), { addSuffix: true }) } catch { return '—' }
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function getFullName(user: { first_name: string; last_name: string }): string {
  return `${user.first_name} ${user.last_name}`.trim()
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

export function getErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred'
  const axiosError = error as { response?: { data?: { message?: string; error?: string } }; message?: string }
  return axiosError?.response?.data?.message ?? axiosError?.response?.data?.error ?? axiosError?.message ?? 'An error occurred'
}
