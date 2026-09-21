export interface Clause {
  id: string
  organization_id: string
  name: string
  text_content: string
  category: string
  is_standard: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface CreateClauseDTO {
  name: string
  text_content: string
  category: string
  is_standard?: boolean
}

export interface UpdateClauseDTO extends Partial<CreateClauseDTO> {}

export interface ClauseFilterParams {
  page?: number
  per_page?: number
  search?: string
  category?: string
  is_standard?: boolean
}
