import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, BookTemplate, BookOpen, CheckCircle, RefreshCw,
  Edit3, Folder, Sparkles, BarChart3, Shield, Users, Building2, CreditCard,
  ChevronLeft, ChevronRight, LogOut, Settings, Lock
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'
import { getFullName } from '@/utils/formatters'

interface NavItem {
  label: string
  icon: React.ComponentType<{ className?: string }>
  path?: string
  permission?: string
  comingSoon?: boolean
  separator?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Agreements', icon: FileText, path: '/agreements' },
  { label: 'Templates', icon: BookOpen, path: '/templates' },
  { label: 'Clauses', icon: BookTemplate, path: '/clauses' },
  { label: '', icon: LayoutDashboard, separator: true },
  { label: 'Approvals', icon: CheckCircle, path: '/approvals', comingSoon: true },
  { label: 'Renewals', icon: RefreshCw, path: '/renewals', comingSoon: true },
  { label: 'Amendments', icon: Edit3, path: '/amendments', comingSoon: true },
  { label: '', icon: LayoutDashboard, separator: true },
  { label: 'Documents', icon: Folder, path: '/documents', comingSoon: true },
  { label: 'AI Assistant', icon: Sparkles, path: '/ai-assistant', comingSoon: true },
  { label: '', icon: LayoutDashboard, separator: true },
  { label: 'Reports', icon: BarChart3, path: '/reports', comingSoon: true },
  { label: 'Audit Logs', icon: Shield, path: '/audit-logs', comingSoon: true },
  { label: '', icon: LayoutDashboard, separator: true },
  { label: 'Users', icon: Users, path: '/users', permission: 'user.manage' },
  { label: 'Organization', icon: Building2, path: '/organization/settings' },
  { label: 'Workflows', icon: Settings, path: '/settings/workflows' },
  { label: 'Billing & Usage', icon: CreditCard, path: '/settings/billing' },
]

export function Sidebar() {
  const { user, hasPermission } = useAuthStore()
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore()
  const { logout } = useAuth()

  return (
    <aside className={cn(
      'fixed inset-y-0 left-0 z-40 flex flex-col bg-gray-900 transition-all duration-300',
      sidebarCollapsed ? 'w-16' : 'w-64'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 h-16">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">CLM Platform</p>
              {user && <p className="text-xs text-gray-400 truncate">{user.organization_id.slice(0, 8)}...</p>}
            </div>
          </div>
        )}
        {sidebarCollapsed && <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center mx-auto"><Shield className="h-5 w-5 text-white" /></div>}
        <button onClick={toggleSidebarCollapsed} className={cn('text-gray-400 hover:text-white transition-colors', sidebarCollapsed && 'hidden')}>
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {sidebarCollapsed && (
          <button onClick={toggleSidebarCollapsed} className="flex items-center justify-center w-full p-2 mb-2 text-gray-400 hover:text-white">
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
        {NAV_ITEMS.map((item, i) => {
          if (item.separator) return <hr key={i} className="border-gray-800 my-2" />
          if (item.permission && !hasPermission(item.permission)) return null
          if (item.comingSoon) {
            return (
              <div key={item.path}
                title={sidebarCollapsed ? item.label : undefined}
                className={cn('sidebar-link sidebar-link-disabled', sidebarCollapsed && 'justify-center')}>
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    <Lock className="h-3 w-3" />
                  </>
                )}
              </div>
            )
          }
          return (
            <NavLink
              key={item.path}
              to={item.path!}
              title={sidebarCollapsed ? item.label : undefined}
              className={({ isActive }) => cn('sidebar-link', isActive ? 'sidebar-link-active' : 'sidebar-link-inactive', sidebarCollapsed && 'justify-center')}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      {user && (
        <div className="border-t border-gray-800 p-3">
          <div className={cn('flex items-center gap-3', sidebarCollapsed && 'justify-center')}>
            <Avatar name={getFullName(user)} imageUrl={user.avatar_url} size="sm" />
            {!sidebarCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{getFullName(user)}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            )}
            {!sidebarCollapsed && (
              <button onClick={() => logout()} title="Sign out" className="text-gray-400 hover:text-red-400 transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
