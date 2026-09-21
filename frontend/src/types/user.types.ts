export interface Permission {
  id: string
  name: string
  description?: string
  category: string
}

export interface Role {
  id: string
  name: string
  description?: string
  is_system: boolean
  permissions: Permission[]
}

export interface UserListItem {
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
