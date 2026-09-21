import api from './api'
import type { APIResponse } from '@/types/common.types'
import type { TokenResponse, LoginData, RegisterData, User } from '@/types/auth.types'

export const authService = {
  register: (data: RegisterData) =>
    api.post<APIResponse<{ message: string; user_id: string }>>('/auth/register', data).then(r => r.data),

  login: (data: LoginData) =>
    api.post<APIResponse<TokenResponse>>('/auth/login', data).then(r => r.data),

  refresh: () =>
    api.post<APIResponse<{ access_token: string }>>('/auth/refresh').then(r => r.data),

  logout: () =>
    api.post('/auth/logout').then(r => r.data),

  getMe: () =>
    api.get<APIResponse<User>>('/auth/me').then(r => r.data),

  changePassword: (data: { current_password: string; new_password: string }) =>
    api.patch<APIResponse<{ message: string }>>('/auth/me/password', data).then(r => r.data),

  verifyEmail: (token: string) =>
    api.post<APIResponse<{ message: string }>>(`/auth/verify-email?token=${encodeURIComponent(token)}`).then(r => r.data),

  forgotPassword: (email: string) =>
    api.post<APIResponse<{ message: string }>>('/auth/forgot-password', { email }).then(r => r.data),

  resetPassword: (data: { token: string; new_password: string }) =>
    api.post<APIResponse<{ message: string }>>('/auth/reset-password', data).then(r => r.data),

  acceptInvitation: (data: { token: string; password: string; first_name: string; last_name: string }) =>
    api.post<APIResponse<TokenResponse>>('/auth/accept-invitation', data).then(r => r.data),
}
