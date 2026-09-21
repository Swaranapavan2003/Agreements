import api from './api'
import type { APIResponse, PaginatedData } from '@/types/common.types'
import type { Clause, CreateClauseDTO, UpdateClauseDTO, ClauseFilterParams } from '@/types/clause.types'

export const clauseService = {
  getClauses: (params?: ClauseFilterParams) =>
    api.get<APIResponse<PaginatedData<Clause>>>('/clauses', { params }).then(r => r.data),

  getClause: (id: string) =>
    api.get<APIResponse<Clause>>(`/clauses/${id}`).then(r => r.data),

  createClause: (data: CreateClauseDTO) =>
    api.post<APIResponse<Clause>>('/clauses', data).then(r => r.data),

  updateClause: (id: string, data: UpdateClauseDTO) =>
    api.put<APIResponse<Clause>>(`/clauses/${id}`, data).then(r => r.data),

  deleteClause: (id: string) =>
    api.delete<APIResponse<{ message: string }>>(`/clauses/${id}`).then(r => r.data),
}
