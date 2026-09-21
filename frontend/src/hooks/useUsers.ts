import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { userService } from '@/services/user.service'
import { getErrorMessage } from '@/utils/formatters'
import { useAuthStore } from '@/store/auth.store'

export function useUsers(params: { page?: number; per_page?: number; search?: string; is_active?: boolean } = {}) {
  const orgId = useAuthStore(getState => getState.user?.organization_id)
  return useQuery({
    queryKey: ['users', orgId, params],
    queryFn: () => userService.listUsers(params).then(r => r.data),
    enabled: !!orgId,
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => userService.getUser(id).then(r => r.data),
    enabled: !!id,
  })
}

export function useInviteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { email: string; role_id: string }) => userService.inviteUser(data),
    onSuccess: () => { toast.success('Invitation sent!'); qc.invalidateQueries({ queryKey: ['users'] }) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}

export function useActivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => userService.activateUser(id),
    onSuccess: () => { toast.success('User activated'); qc.invalidateQueries({ queryKey: ['users'] }) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}

export function useDeactivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => userService.deactivateUser(id),
    onSuccess: () => { toast.success('User deactivated'); qc.invalidateQueries({ queryKey: ['users'] }) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}

export function useAssignRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) => userService.assignRole(userId, roleId),
    onSuccess: () => { toast.success('Role assigned'); qc.invalidateQueries({ queryKey: ['users'] }) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}

export function useRemoveRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) => userService.removeRole(userId, roleId),
    onSuccess: () => { toast.success('Role removed'); qc.invalidateQueries({ queryKey: ['users'] }) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
}
