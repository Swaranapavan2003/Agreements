import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSearchParams, Link } from 'react-router-dom'
import { Lock, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { useAuth } from '@/hooks/useAuth'

const schema = z.object({
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine(d => d.new_password === d.confirm_password, { message: 'Passwords do not match', path: ['confirm_password'] })

type FormData = z.infer<typeof schema>

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const { resetPassword, isResettingPassword } = useAuth()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  if (!token) return (
    <><h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid link</h2>
    <Alert variant="error" message="This reset link is invalid or has expired." />
    <Link to="/forgot-password" className="block mt-4 text-indigo-600 font-medium">Request a new link</Link></>
  )

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Set new password</h2>
        <p className="mt-1 text-sm text-gray-600">Choose a strong password for your account</p>
      </div>
      <form onSubmit={handleSubmit(data => resetPassword({ token, new_password: data.new_password }))} className="space-y-5">
        <Input label="New password" type="password" placeholder="Min. 8 characters" leftIcon={<Lock className="h-4 w-4" />} error={errors.new_password?.message} {...register('new_password')} />
        <Input label="Confirm password" type="password" placeholder="Repeat password" leftIcon={<Lock className="h-4 w-4" />} error={errors.confirm_password?.message} {...register('confirm_password')} />
        <Button type="submit" className="w-full" size="lg" loading={isResettingPassword}>Reset password</Button>
      </form>
    </>
  )
}
