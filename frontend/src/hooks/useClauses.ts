import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clauseService } from '@/services/clause.service'
import type { ClauseFilterParams, CreateClauseDTO, UpdateClauseDTO } from '@/types/clause.types'
import toast from 'react-hot-toast'

export function useClauses(params?: ClauseFilterParams) {
  return useQuery({
    queryKey: ['clauses', params],
    queryFn: () => clauseService.getClauses(params),
  })
}

export function useClause(id: string) {
  return useQuery({
    queryKey: ['clauses', id],
    queryFn: () => clauseService.getClause(id),
    enabled: !!id,
  })
}

export function useCreateClause() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateClauseDTO) => clauseService.createClause(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clauses'] })
      toast.success('Clause created successfully')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create clause')
    }
  })
}

export function useUpdateClause() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClauseDTO }) => clauseService.updateClause(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clauses'] })
      queryClient.invalidateQueries({ queryKey: ['clauses', variables.id] })
      toast.success('Clause updated successfully')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update clause')
    }
  })
}

export function useDeleteClause() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => clauseService.deleteClause(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clauses'] })
      toast.success('Clause deleted successfully')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete clause')
    }
  })
}
