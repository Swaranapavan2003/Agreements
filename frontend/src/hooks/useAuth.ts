import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/auth.store'
import { authService } from '@/services/auth.service'
import type { LoginData, RegisterData } from '@/types/auth.types'
import { getErrorMessage } from '@/utils/formatters'

export function useAuth() {
  const store = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const loginMutation = useMutation({
    mutationFn: (data: LoginData) => authService.login(data),
    onSuccess: (response) => {
      store.setAuth(response.data.user, response.data.access_token)
      queryClient.clear()
      navigate('/dashboard')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: () => {
      toast.success('Registration successful! Please check your email to verify your account.')
      navigate('/login')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      store.logout()
      queryClient.clear()
      navigate('/login')
    },
  })

  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
    onSuccess: () => toast.success('Reset link sent! Check your email.'),
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const resetPasswordMutation = useMutation({
    mutationFn: (data: { token: string; new_password: string }) => authService.resetPassword(data),
    onSuccess: () => {
      toast.success('Password reset successfully!')
      navigate('/login')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    hasPermission: store.hasPermission,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    forgotPassword: forgotPasswordMutation.mutate,
    isSendingReset: forgotPasswordMutation.isPending,
    resetPassword: resetPasswordMutation.mutate,
    isResettingPassword: resetPasswordMutation.isPending,
  }
}
