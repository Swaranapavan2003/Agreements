import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

const schema = z.object({ email: z.string().email('Please enter a valid email') })
type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')
  const { forgotPassword, isSendingReset } = useAuth()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = (data: FormData) => {
    forgotPassword(data.email)
    setSent(true)
    setSentEmail(data.email)
  }

  if (sent) return (
    <>
      <div className="flex justify-center mb-6">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Check your email</h2>
      <p className="text-sm text-gray-600 text-center mb-8">We sent a password reset link to <strong>{sentEmail}</strong></p>
      <p className="text-sm text-gray-600 text-center">Didn't receive it? Check your spam folder or <button onClick={() => setSent(false)} className="text-indigo-600 font-medium">try again</button>.</p>
      <div className="mt-6 text-center">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-indigo-600 font-medium"><ArrowLeft className="h-4 w-4" /> Back to sign in</Link>
      </div>
    </>
  )

  return (
    <>
      <div className="mb-8">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">Forgot your password?</h2>
        <p className="mt-1 text-sm text-gray-600">Enter your email and we'll send you a reset link</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input label="Email address" type="email" placeholder="you@company.com" leftIcon={<Mail className="h-4 w-4" />} error={errors.email?.message} {...register('email')} />
        <Button type="submit" className="w-full" size="lg" loading={isSendingReset}>Send reset link</Button>
      </form>
    </>
  )
}
