import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { organizationService } from '@/services/organization.service'
import { getErrorMessage } from '@/utils/formatters'

export function useOrganization() {
  return useQuery({
    queryKey: ['organization'],
    queryFn: () => organizationService.getMe().then(r => r.data),
  })
}

export function useUpdateOrganization() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof organizationService.updateMe>[0]) => organizationService.updateMe(data),
    onSuccess: () => { toast.success('Organization updated'); qc.invalidateQueries({ queryKey: ['organization'] }) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => organizationService.getDepartments().then(r => r.data),
  })
}

export function useCreateDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof organizationService.createDepartment>[0]) => organizationService.createDepartment(data),
    onSuccess: () => { toast.success('Department created'); qc.invalidateQueries({ queryKey: ['departments'] }) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}

export function useDeleteDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => organizationService.deleteDepartment(id),
    onSuccess: () => { toast.success('Department deleted'); qc.invalidateQueries({ queryKey: ['departments'] }) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}

export function useOrganizationSettings() {
  return useQuery({
    queryKey: ['org-settings'],
    queryFn: () => organizationService.getSettings().then(r => r.data),
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof organizationService.updateSettings>[0]) => organizationService.updateSettings(data),
    onSuccess: () => { toast.success('Settings saved'); qc.invalidateQueries({ queryKey: ['org-settings'] }) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}
