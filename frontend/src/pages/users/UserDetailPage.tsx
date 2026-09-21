import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, Building2, Calendar, Clock } from 'lucide-react'
import { useUser } from '@/hooks/useUsers'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useState } from 'react'
import { getFullName, formatDate, formatRelativeTime } from '@/utils/formatters'
import { Activity } from 'lucide-react'

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'roles', label: 'Roles & Permissions' },
  { id: 'activity', label: 'Activity' },
]

export function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')
  const { data: user, isLoading } = useUser(userId!)

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!user) return <div className="text-center py-20 text-gray-500">User not found</div>

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/users')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Back to Users
      </button>

      {/* Header */}
      <Card>
        <div className="flex items-center gap-4">
          <Avatar name={getFullName(user)} imageUrl={user.avatar_url} size="xl" />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{getFullName(user)}</h1>
              <Badge variant={user.is_active ? 'success' : 'gray'} dot>{user.is_active ? 'Active' : 'Inactive'}</Badge>
              {user.is_superadmin && <Badge variant="indigo">Super Admin</Badge>}
            </div>
            <p className="text-gray-500 mt-0.5">{user.email}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {user.roles.map(r => <Badge key={r.id} variant="indigo" size="sm">{r.name}</Badge>)}
            </div>
          </div>
        </div>
      </Card>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Email</span>
                <span className="font-medium text-gray-900 ml-auto">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Phone</span>
                <span className="font-medium text-gray-900 ml-auto">{user.phone || '—'}</span>
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Account Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Joined</span>
                <span className="font-medium text-gray-900 ml-auto">{formatDate(user.created_at)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Last Login</span>
                <span className="font-medium text-gray-900 ml-auto">{user.last_login_at ? formatRelativeTime(user.last_login_at) : 'Never'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Email Verified</span>
                <Badge variant={user.is_verified ? 'success' : 'warning'} size="sm">{user.is_verified ? 'Verified' : 'Pending'}</Badge>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="space-y-4">
          {user.roles.length === 0 ? (
            <Card><EmptyState icon={<Building2 className="h-8 w-8" />} title="No roles assigned" description="Assign a role to give this user access" /></Card>
          ) : user.roles.map(role => (
            <Card key={role.id}>
              <div className="flex items-center justify-between mb-3">
                <div><h3 className="text-sm font-semibold text-gray-900">{role.name}</h3>{role.description && <p className="text-xs text-gray-500">{role.description}</p>}</div>
                {role.is_system && <Badge variant="gray" size="sm">System</Badge>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.map(p => <span key={p.id} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">{p.name}</span>)}
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'activity' && (
        <Card>
          <EmptyState icon={<Activity className="h-8 w-8" />} title="Activity log coming soon" description="Detailed user activity will be available in Phase 6" />
        </Card>
      )}
    </div>
  )
}
