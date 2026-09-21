import { Menu, Search } from 'lucide-react'
import { useUIStore } from '@/store/ui.store'
import { useAuthStore } from '@/store/auth.store'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'
import { Dropdown } from '@/components/ui/Dropdown'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { getFullName } from '@/utils/formatters'
import { useNavigate } from 'react-router-dom'

export function Topbar() {
  const { setSidebarMobileOpen } = useUIStore()
  const { user } = useAuthStore()
  const { logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const userMenuItems = [
    { label: 'My Profile', icon: null, onClick: () => navigate('/users/me') },
    { label: 'Organization', icon: null, onClick: () => navigate('/organization/settings') },
    { separator: true, label: '', icon: null, onClick: () => {} },
    { label: 'Sign Out', icon: null, onClick: () => logout(), variant: 'danger' as const },
  ]

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 gap-4">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button onClick={() => setSidebarMobileOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-900">
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Center - Search */}
      <div className="flex-1 max-w-lg hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            disabled
            placeholder="Search agreements, parties, dates... (coming soon)"
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <NotificationBell />
        <Dropdown
          trigger={
            <div className="flex items-center gap-2 cursor-pointer">
              <Avatar name={getFullName(user)} imageUrl={user.avatar_url} size="sm" />
              <span className="hidden md:block text-sm font-medium text-gray-700">{user.first_name}</span>
            </div>
          }
          items={userMenuItems}
          align="right"
        />
      </div>
    </header>
  )
}
