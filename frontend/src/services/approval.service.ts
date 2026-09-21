import { APIResponse, PaginatedData, PaginationParams } from '@/types/common.types'
import { ApprovalWorkflow, ApprovalRequest, ApprovalStep } from '@/types/approval.types'
import api from './api'

export const approvalService = {
  getWorkflows: (params?: PaginationParams) => 
    api.get<APIResponse<PaginatedData<ApprovalWorkflow>>>('/approvals/workflows', { params }),
    
  getWorkflow: (id: string) => 
    api.get<APIResponse<ApprovalWorkflow>>(`/approvals/workflows/${id}`),

  createWorkflow: (data: Partial<ApprovalWorkflow>) => 
    api.post<APIResponse<ApprovalWorkflow>>('/approvals/workflows', data),

  updateWorkflow: (id: string, data: Partial<ApprovalWorkflow>) => 
    api.put<APIResponse<ApprovalWorkflow>>(`/approvals/workflows/${id}`, data),

  deleteWorkflow: (id: string) => 
    api.delete<APIResponse<void>>(`/approvals/workflows/${id}`),

  getAgreementApprovals: (agreementId: string) => 
    api.get<APIResponse<ApprovalRequest[]>>(`/agreements/${agreementId}/approvals`),

  startApprovalProcess: (agreementId: string, workflowId?: string) => 
    api.post<APIResponse<ApprovalRequest>>(`/agreements/${agreementId}/approvals/start`, { workflowId }),

  approveStep: (requestId: string, stepId: string, comments?: string) => 
    api.post<APIResponse<ApprovalRequest>>(`/approvals/requests/${requestId}/steps/${stepId}/approve`, { comments }),

  rejectStep: (requestId: string, stepId: string, comments: string) => 
    api.post<APIResponse<ApprovalRequest>>(`/approvals/requests/${requestId}/steps/${stepId}/reject`, { comments }),
}
