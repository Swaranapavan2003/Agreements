import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { approvalService } from '@/services/approval.service'
import { ApprovalWorkflow, ApprovalRequest } from '@/types/approval.types'
import { PaginationParams } from '@/types/common.types'

export const useWorkflows = (params?: PaginationParams) => {
  return useQuery({
    queryKey: ['workflows', params],
    queryFn: async () => {
      const res = await approvalService.getWorkflows(params)
      return res.data.data
    },
  })
}

export const useWorkflow = (id: string) => {
  return useQuery({
    queryKey: ['workflows', id],
    queryFn: async () => {
      const res = await approvalService.getWorkflow(id)
      return res.data.data
    },
    enabled: !!id,
  })
}

export const useCreateWorkflow = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<ApprovalWorkflow>) => {
      const res = await approvalService.createWorkflow(data)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
  })
}

export const useAgreementApprovals = (agreementId: string) => {
  return useQuery({
    queryKey: ['agreements', agreementId, 'approvals'],
    queryFn: async () => {
      const res = await approvalService.getAgreementApprovals(agreementId)
      return res.data.data
    },
    enabled: !!agreementId,
  })
}

export const useStartApprovalProcess = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ agreementId, workflowId }: { agreementId: string; workflowId?: string }) => {
      const res = await approvalService.startApprovalProcess(agreementId, workflowId)
      return res.data.data
    },
    onSuccess: (_, { agreementId }) => {
      queryClient.invalidateQueries({ queryKey: ['agreements', agreementId, 'approvals'] })
      queryClient.invalidateQueries({ queryKey: ['agreements', agreementId] })
    },
  })
}

export const useApproveStep = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ requestId, stepId, comments }: { requestId: string; stepId: string; comments?: string }) => {
      const res = await approvalService.approveStep(requestId, stepId, comments)
      return res.data.data
    },
    onSuccess: (_, { requestId }) => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] })
    },
  })
}

export const useRejectStep = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ requestId, stepId, comments }: { requestId: string; stepId: string; comments: string }) => {
      const res = await approvalService.rejectStep(requestId, stepId, comments)
      return res.data.data
    },
    onSuccess: (_, { requestId }) => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] })
    },
  })
}
