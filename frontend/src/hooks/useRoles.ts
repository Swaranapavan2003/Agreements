import { useQuery } from '@tanstack/react-query'
import { roleService } from '@/services/role.service'

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => roleService.listRoles().then(r => r.data),
  })
}

export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => roleService.listPermissions().then(r => r.data),
  })
}
