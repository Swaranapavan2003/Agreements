import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Mail, Lock, User, Building2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

const schema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email'),
  organization_name: z.string().min(2, 'Organization name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, { message: 'Passwords do not match', path: ['confirm_password'] })

type FormData = z.infer<typeof schema>

export function RegisterPage() {
  const { register: registerUser, isRegistering } = useAuth()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = (data: FormData) => {
    const { confirm_password, ...submitData } = data
    registerUser(submitData)
  }

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
        <p className="mt-1 text-sm text-gray-600">Start managing agreements with intelligence</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="First name" placeholder="John" leftIcon={<User className="h-4 w-4" />} error={errors.first_name?.message} {...register('first_name')} />
          <Input label="Last name" placeholder="Doe" error={errors.last_name?.message} {...register('last_name')} />
        </div>
        <Input label="Email address" type="email" placeholder="you@company.com" leftIcon={<Mail className="h-4 w-4" />} error={errors.email?.message} {...register('email')} />
        <Input label="Organization name" placeholder="Acme Corp" leftIcon={<Building2 className="h-4 w-4" />} error={errors.organization_name?.message} {...register('organization_name')} />
        <Input label="Password" type="password" placeholder="Min. 8 characters" leftIcon={<Lock className="h-4 w-4" />} error={errors.password?.message} helperText="At least 8 characters" {...register('password')} />
        <Input label="Confirm password" type="password" placeholder="Repeat password" leftIcon={<Lock className="h-4 w-4" />} error={errors.confirm_password?.message} {...register('confirm_password')} />
        <Button type="submit" className="w-full" size="lg" loading={isRegistering}>Create account</Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">Sign in</Link>
      </p>
    </>
  )
}
