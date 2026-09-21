import api from './api'
import type { APIResponse, PaginatedData } from '@/types/common.types'
import type { Template, CreateTemplateDTO, UpdateTemplateDTO, TemplateFilterParams } from '@/types/template.types'

export const templateService = {
  getTemplates: (params?: TemplateFilterParams) =>
    api.get<APIResponse<PaginatedData<Template>>>('/templates', { params }).then(r => r.data),

  getTemplate: (id: string) =>
    api.get<APIResponse<Template>>(`/templates/${id}`).then(r => r.data),

  createTemplate: (data: CreateTemplateDTO) =>
    api.post<APIResponse<Template>>('/templates', data).then(r => r.data),

  updateTemplate: (id: string, data: UpdateTemplateDTO) =>
    api.put<APIResponse<Template>>(`/templates/${id}`, data).then(r => r.data),

  deleteTemplate: (id: string) =>
    api.delete<APIResponse<{ message: string }>>(`/templates/${id}`).then(r => r.data),
}
