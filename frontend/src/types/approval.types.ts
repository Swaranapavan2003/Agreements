export interface ApprovalStep {
  id: string
  workflow_id: string
  step_order: number
  role_id?: string
  user_id?: string
  is_parallel: boolean
  created_at: string
  updated_at: string
}

export interface ApprovalWorkflow {
  id: string
  organization_id: string
  name: string
  description?: string
  is_active: boolean
  steps: ApprovalStep[]
  created_at: string
  updated_at: string
}

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED'

export interface ApprovalRequestStep {
  id: string
  request_id: string
  step_order: number
  role_id?: string
  user_id?: string
  status: ApprovalStatus
  comments?: string
  acted_by?: string
  acted_at?: string
  created_at: string
  updated_at: string
}

export interface ApprovalRequest {
  id: string
  agreement_id: string
  workflow_id?: string
  status: ApprovalStatus
  steps: ApprovalRequestStep[]
  created_at: string
  updated_at: string
}
