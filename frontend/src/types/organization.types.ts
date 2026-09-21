export interface Address {
  street?: string
  city?: string
  state?: string
  country?: string
  pincode?: string
}

export interface OrganizationSettings {
  agreement_number_prefix?: string
  agreement_number_format?: string
  default_currency?: string
  timezone?: string
  notification_preferences?: Record<string, boolean>
}

export interface Organization {
  id: string
  name: string
  slug: string
  email: string
  phone?: string
  website?: string
  address?: Address
  logo_url?: string
  is_active: boolean
  settings: OrganizationSettings
  created_at: string
}

export interface Department {
  id: string
  organization_id: string
  name: string
  description?: string
  parent_id?: string
  head_user_id?: string
  is_active: boolean
  created_at: string
}

export interface Team {
  id: string
  organization_id: string
  name: string
  description?: string
  department_id?: string
  is_active: boolean
  created_at: string
}
