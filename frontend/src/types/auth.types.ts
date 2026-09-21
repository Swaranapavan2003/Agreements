import type { Role } from './user.types'

export interface User {
  id: string
  organization_id: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  is_verified: boolean
  is_superadmin: boolean
  avatar_url?: string
  phone?: string
  department_id?: string
  last_login_at?: string
  created_at: string
  roles: Role[]
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  first_name: string
  last_name: string
  organization_name: string
}
