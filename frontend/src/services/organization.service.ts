import api from './api'
import type { APIResponse } from '@/types/common.types'
import type { Organization, Department, Team, OrganizationSettings } from '@/types/organization.types'

export const organizationService = {
  getMe: () =>
    api.get<APIResponse<Organization>>('/organizations/me').then(r => r.data),

  updateMe: (data: Partial<Organization>) =>
    api.patch<APIResponse<Organization>>('/organizations/me', data).then(r => r.data),

  getDepartments: (includeInactive = false) =>
    api.get<APIResponse<Department[]>>('/organizations/me/departments', { params: { include_inactive: includeInactive } }).then(r => r.data),

  createDepartment: (data: { name: string; description?: string; parent_id?: string }) =>
    api.post<APIResponse<Department>>('/organizations/me/departments', data).then(r => r.data),

  updateDepartment: (id: string, data: Partial<Department>) =>
    api.patch<APIResponse<Department>>(`/organizations/me/departments/${id}`, data).then(r => r.data),

  deleteDepartment: (id: string) =>
    api.delete<APIResponse<{ message: string }>>(`/organizations/me/departments/${id}`).then(r => r.data),

  getSettings: () =>
    api.get<APIResponse<OrganizationSettings>>('/organizations/me/settings').then(r => r.data),

  updateSettings: (data: Partial<OrganizationSettings>) =>
    api.patch<APIResponse<OrganizationSettings>>('/organizations/me/settings', data).then(r => r.data),

  getTeams: (departmentId?: string) =>
    api.get<APIResponse<Team[]>>('/organizations/me/teams', { params: departmentId ? { department_id: departmentId } : {} }).then(r => r.data),

  createTeam: (data: { name: string; description?: string; department_id?: string }) =>
    api.post<APIResponse<Team>>('/organizations/me/teams', data).then(r => r.data),
}
