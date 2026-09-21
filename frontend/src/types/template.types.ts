export interface Template {
  id: string
  organization_id: string
  name: string
  description?: string
  html_content: string
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface CreateTemplateDTO {
  name: string
  description?: string
  html_content: string
  is_active?: boolean
}

export interface UpdateTemplateDTO extends Partial<CreateTemplateDTO> {}

export interface TemplateFilterParams {
  page?: number
  per_page?: number
  search?: string
  is_active?: boolean
}
