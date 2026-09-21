import api from './api'
import type { APIResponse } from '@/types/common.types'
import type { Role, Permission } from '@/types/user.types'

export const roleService = {
  listRoles: () =>
    api.get<APIResponse<Role[]>>('/roles').then(r => r.data),

  listPermissions: () =>
    api.get<APIResponse<Permission[]>>('/roles/permissions').then(r => r.data),

  createRole: (data: { name: string; description?: string; permission_ids: string[] }) =>
    api.post<APIResponse<Role>>('/roles', data).then(r => r.data),

  getRole: (id: string) =>
    api.get<APIResponse<Role>>(`/roles/${id}`).then(r => r.data),
}
