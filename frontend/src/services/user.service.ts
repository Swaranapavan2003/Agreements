import api from './api'
import type { APIResponse, PaginatedData } from '@/types/common.types'
import type { UserListItem, Role } from '@/types/user.types'

interface ListUsersParams {
  page?: number
  per_page?: number
  search?: string
  is_active?: boolean
}

export const userService = {
  listUsers: (params: ListUsersParams = {}) =>
    api.get<APIResponse<PaginatedData<UserListItem>>>('/users', { params }).then(r => r.data),

  getMe: () =>
    api.get<APIResponse<UserListItem>>('/users/me').then(r => r.data),

  updateMe: (data: Partial<UserListItem>) =>
    api.patch<APIResponse<UserListItem>>('/users/me', data).then(r => r.data),

  getUser: (id: string) =>
    api.get<APIResponse<UserListItem>>(`/users/${id}`).then(r => r.data),

  updateUser: (id: string, data: Partial<UserListItem>) =>
    api.patch<APIResponse<UserListItem>>(`/users/${id}`, data).then(r => r.data),

  inviteUser: (data: { email: string; role_id: string }) =>
    api.post<APIResponse<{ message: string }>>('/users/invite', data).then(r => r.data),

  activateUser: (id: string) =>
    api.post<APIResponse<UserListItem>>(`/users/${id}/activate`).then(r => r.data),

  deactivateUser: (id: string) =>
    api.post<APIResponse<UserListItem>>(`/users/${id}/deactivate`).then(r => r.data),

  getUserRoles: (id: string) =>
    api.get<APIResponse<Role[]>>(`/users/${id}/roles`).then(r => r.data),

  assignRole: (userId: string, roleId: string) =>
    api.post<APIResponse<{ message: string }>>(`/users/${userId}/roles`, { role_id: roleId }).then(r => r.data),

  removeRole: (userId: string, roleId: string) =>
    api.delete<APIResponse<{ message: string }>>(`/users/${userId}/roles/${roleId}`).then(r => r.data),
}
