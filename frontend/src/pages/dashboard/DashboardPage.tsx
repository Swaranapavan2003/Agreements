import { useAuthStore } from '@/store/auth.store'
import { StatCard } from '@/components/ui/StatCard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FileText, CheckCircle, Clock, AlertTriangle, PenLine, UserPlus, Plus, Sparkles, Bell, Shield, BarChart3 } from 'lucide-react'
import { formatDate } from '@/utils/formatters'
import { useAgreements } from '@/hooks/useAgreements'
import { AgreementStatus } from '@/types/agreement.types'

export function DashboardPage() {
  const user = useAuthStore(s => s.user)
  const navigate = useNavigate()
  
  const { data: agreements = [], isLoading } = useAgreements()

  // Compute stats
  const total = agreements.length
  const active = agreements.filter(a => a.status === AgreementStatus.ACTIVE).length
  const inReview = agreements.filter(a => a.status === AgreementStatus.IN_REVIEW).length
  const signed = agreements.filter(a => a.status === AgreementStatus.SIGNED).length
  const draft = agreements.filter(a => a.status === AgreementStatus.DRAFT).length
  const expired = agreements.filter(a => a.status === AgreementStatus.EXPIRED).length

  const stats = [
    { title: 'Total Agreements', value: total, icon: <FileText />, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
    { title: 'Active Agreements', value: active, icon: <CheckCircle />, iconBg: 'bg-green-50', iconColor: 'text-green-600' },
    { title: 'In Review', value: inReview, icon: <Clock />, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    { title: 'Signed', value: signed, icon: <PenLine />, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { title: 'Draft', value: draft, icon: <PenLine />, iconBg: 'bg-gray-50', iconColor: 'text-gray-600' },
    { title: 'Expired', value: expired, icon: <AlertTriangle />, iconBg: 'bg-red-50', iconColor: 'text-red-600' },
  ]

  // Compute chart data (group by month)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthCounts = new Array(12).fill(0);
  agreements.forEach(a => {
    const d = new Date(a.created_at);
    if (!isNaN(d.getTime())) {
      monthCounts[d.getMonth()]++;
    }
  });

  const currentMonth = new Date().getMonth();
  // Get last 6 months
  const chartData = [];
  for (let i = 5; i >= 0; i--) {
    let mIndex = currentMonth - i;
    if (mIndex < 0) mIndex += 12;
    chartData.push({ month: months[mIndex], agreements: monthCounts[mIndex] });
  }

  const upcomingFeatures = [
    { icon: <Sparkles className="h-6 w-6" />, name: 'AI Analysis', desc: 'Extract key terms, detect risks, get summaries', phase: 'Phase 6' },
    { icon: <Bell className="h-6 w-6" />, name: 'Smart Reminders', desc: 'Automated renewal and expiry notifications', phase: 'Phase 5' },
    { icon: <PenLine className="h-6 w-6" />, name: 'E-Signatures', desc: 'Internal e-signature with audit trail', phase: 'Phase 5' },
    { icon: <BarChart3 className="h-6 w-6" />, name: 'Advanced Reports', desc: 'Agreement analytics and export to CSV/Excel/PDF', phase: 'Phase 7' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.first_name}! 👋</h1>
          <p className="text-sm text-gray-500 mt-0.5">{formatDate(new Date())} · {user?.roles?.[0]?.name || 'Team Member'}</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/agreements')}>
          New Agreement
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map(s => <StatCard key={s.title} {...s} />)}
      </div>

      {/* Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Agreement Volume</h2>
          </div>
          {isLoading ? (
            <div className="h-[200px] flex items-center justify-center text-gray-400">Loading...</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="agreements" stroke="#6366f1" fill="#e0e7ff" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
              {agreements.length === 0 && (
                <p className="text-xs text-gray-400 mt-2">Agreements will appear here once you start creating them.</p>
              )}
            </>
          )}
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button onClick={() => navigate('/agreements')} className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left">
              <div className="h-9 w-9 rounded-lg bg-indigo-100 flex items-center justify-center"><FileText className="h-5 w-5 text-indigo-600" /></div>
              <div><p className="text-sm font-medium text-gray-900">New Agreement</p><p className="text-xs text-gray-500">Create from template or scratch</p></div>
            </button>
            <button onClick={() => navigate('/users')} className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors text-left">
              <div className="h-9 w-9 rounded-lg bg-green-100 flex items-center justify-center"><UserPlus className="h-5 w-5 text-green-600" /></div>
              <div><p className="text-sm font-medium text-gray-900">Invite Team Member</p><p className="text-xs text-gray-500">Add users to your organization</p></div>
            </button>
            <button onClick={() => navigate('/organization/settings')} className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-left">
              <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center"><Shield className="h-5 w-5 text-purple-600" /></div>
              <div><p className="text-sm font-medium text-gray-900">Organization Settings</p><p className="text-xs text-gray-500">Configure your workspace</p></div>
            </button>
          </div>
        </Card>
      </div>

      {/* Coming Soon */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Coming Soon</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {upcomingFeatures.map(f => (
            <div key={f.name} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">{f.icon}</div>
                <Badge variant="gray" size="sm">{f.phase}</Badge>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">{f.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
