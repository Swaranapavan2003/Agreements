import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { authService } from '@/services/auth.service'

export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token) { setState('error'); setErrorMsg('No verification token provided.'); return }
    authService.verifyEmail(token)
      .then(() => setState('success'))
      .catch(e => { setState('error'); setErrorMsg(e?.response?.data?.message || 'Verification failed.') })
  }, [token])

  return (
    <div className="text-center">
      {state === 'loading' && <>
        <Spinner size="lg" className="mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Verifying your email...</h2>
      </>}
      {state === 'success' && <>
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Email verified!</h2>
        <p className="text-gray-600 mb-6">Your account is ready. Sign in to get started.</p>
        <Link to="/login" className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700">Sign in</Link>
      </>}
      {state === 'error' && <>
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification failed</h2>
        <p className="text-gray-600 mb-6">{errorMsg}</p>
        <Link to="/login" className="text-indigo-600 font-medium">Back to sign in</Link>
      </>}
    </div>
  )
}
