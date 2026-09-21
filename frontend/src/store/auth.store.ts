import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/types/auth.types'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isInitialized: boolean
  setUser: (user: User) => void
  setAccessToken: (token: string) => void
  setAuth: (user: User, token: string) => void
  logout: () => void
  setInitialized: (value: boolean) => void
  hasPermission: (permission: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isInitialized: false,
      setUser: (user) => set({ user }),
      setAccessToken: (token) => set({ accessToken: token }),
      setAuth: (user, token) => set({ user, accessToken: token, isAuthenticated: true }),
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
      setInitialized: (value) => set({ isInitialized: value }),
      hasPermission: (permission) => {
        const { user } = get()
        if (!user) return false
        if (user.is_superadmin) return true
        return user.roles.some(role =>
          role.permissions.some(p => p.name === permission)
        )
      },
    }),
    {
      name: 'clm-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
