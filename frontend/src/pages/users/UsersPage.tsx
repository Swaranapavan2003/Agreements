import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, MoreVertical, UserCheck, UserX, Eye } from 'lucide-react'
import { useUsers, useInviteUser, useActivateUser, useDeactivateUser } from '@/hooks/useUsers'
import { useRoles } from '@/hooks/useRoles'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/ui/EmptyState'
import { Dropdown } from '@/components/ui/Dropdown'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { UserListItem } from '@/types/user.types'
import { getFullName, formatRelativeTime } from '@/utils/formatters'
import { useAuthStore } from '@/store/auth.store'

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  role_id: z.string().min(1, 'Please select a role'),
})
type InviteFormData = z.infer<typeof inviteSchema>

export function UsersPage() {
  const navigate = useNavigate()
  const hasPermission = useAuthStore(s => s.hasPermission)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState<UserListItem | null>(null)

  const { data: usersData, isLoading } = useUsers({ page, per_page: 20, search: search || undefined, is_active: statusFilter === '' ? undefined : statusFilter === 'active' })
  const { data: roles = [] } = useRoles()
  const inviteUser = useInviteUser()
  const activateUser = useActivateUser()
  const deactivateUser = useDeactivateUser()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteFormData>({ resolver: zodResolver(inviteSchema) })

  const handleInvite = (data: InviteFormData) => {
    inviteUser.mutate(data, { onSuccess: () => { setShowInvite(false); reset() } })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
          <p className="text-sm text-gray-500 mt-0.5">{usersData?.total ?? 0} members</p>
        </div>
        {hasPermission('user.manage') && (
          <Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setShowInvite(true)}>Invite User</Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email..." className="w-64" />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="All Status"
          options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
          className="w-40"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : !usersData?.items.length ? (
          <EmptyState
            icon={<UserPlus className="h-8 w-8" />}
            title="No team members yet"
            description="Invite your first team member to get started"
            action={hasPermission('user.manage') ? { label: 'Invite User', onClick: () => setShowInvite(true), icon: <UserPlus className="h-4 w-4" /> } : undefined}
          />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Roles</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Last Login</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usersData.items.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={getFullName(user)} imageUrl={user.avatar_url} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900">{getFullName(user)}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.slice(0, 2).map(r => <Badge key={r.id} variant="indigo" size="sm">{r.name}</Badge>)}
                        {user.roles.length > 2 && <Badge variant="gray" size="sm">+{user.roles.length - 2}</Badge>}
                        {user.roles.length === 0 && <span className="text-gray-400 text-xs">No roles</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-500 text-xs">
                      {user.last_login_at ? formatRelativeTime(user.last_login_at) : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.is_active ? 'success' : 'gray'} dot>{user.is_active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Dropdown
                        trigger={<button className="p-1 rounded hover:bg-gray-100 text-gray-400"><MoreVertical className="h-4 w-4" /></button>}
                        items={[
                          { label: 'View Profile', icon: <Eye className="h-4 w-4" />, onClick: () => navigate(`/users/${user.id}`) },
                          ...(hasPermission('user.manage') ? [
                            user.is_active
                              ? { label: 'Deactivate', icon: <UserX className="h-4 w-4" />, onClick: () => setConfirmDeactivate(user), variant: 'danger' as const }
                              : { label: 'Activate', icon: <UserCheck className="h-4 w-4" />, onClick: () => activateUser.mutate(user.id) }
                          ] : [])
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {usersData && <Pagination page={usersData.page} per_page={usersData.per_page} total={usersData.total} pages={usersData.pages} onPageChange={setPage} />}
          </>
        )}
      </div>

      {/* Invite Modal */}
      <Modal open={showInvite} onClose={() => { setShowInvite(false); reset() }} title="Invite Team Member" size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => { setShowInvite(false); reset() }}>Cancel</Button>
            <Button form="invite-form" type="submit" loading={inviteUser.isPending}>Send Invitation</Button>
          </>
        }
      >
        <form id="invite-form" onSubmit={handleSubmit(handleInvite)} className="space-y-4">
          <Input label="Email address" type="email" placeholder="colleague@company.com" error={errors.email?.message} required {...register('email')} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role <span className="text-red-500">*</span></label>
            <select className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" {...register('role_id')}>
              <option value="">Select a role</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            {errors.role_id && <p className="mt-1 text-sm text-red-600">{errors.role_id.message}</p>}
          </div>
        </form>
      </Modal>

      {/* Deactivate Confirm */}
      <ConfirmDialog
        open={!!confirmDeactivate}
        onClose={() => setConfirmDeactivate(null)}
        onConfirm={() => { if (confirmDeactivate) deactivateUser.mutate(confirmDeactivate.id, { onSuccess: () => setConfirmDeactivate(null) }) }}
        title="Deactivate User"
        message={`Are you sure you want to deactivate ${confirmDeactivate ? getFullName(confirmDeactivate) : ''}? They will lose access immediately.`}
        confirmLabel="Deactivate"
        variant="danger"
        loading={deactivateUser.isPending}
      />
    </div>
  )
}
