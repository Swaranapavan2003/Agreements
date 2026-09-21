import { Outlet } from 'react-router-dom'
import { Shield } from 'lucide-react'

export function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:flex-col lg:w-1/2 bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-900 px-12 py-16 justify-between">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">CLM Platform</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Manage Agreements<br />With Intelligence
          </h1>
          <p className="text-indigo-200 text-lg mb-10">
            Complete agreement lifecycle management powered by AI. From draft to signature and beyond.
          </p>
          <div className="space-y-4">
            {[
              'AI-powered agreement analysis & risk detection',
              'Complete lifecycle from draft to expiry',
              'Multi-party collaboration & e-signatures',
              'Automated renewal reminders & workflows',
              'Secure multi-tenant architecture'
            ].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M3.707 5.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L5 6.586 3.707 5.293z" />
                  </svg>
                </div>
                <span className="text-indigo-100 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-indigo-400 text-sm">© 2026 CLM Platform. All rights reserved.</p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Shield className="h-7 w-7 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">CLM Platform</span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
