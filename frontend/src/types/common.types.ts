export interface APIResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface ErrorResponse {
  success: false
  error: string
  message: string
  details?: Record<string, unknown>
}

export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  pages: number
}

export interface PaginationParams {
  page?: number
  per_page?: number
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}
