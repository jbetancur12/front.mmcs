export interface Role {
  id: number
  name: string
  description: string
}

/** Rol del selector de usuarios (`GET /roles/for-assignment`): con sus capacidades y si quien asigna puede darlo. */
export interface AssignableRole extends Role {
  isActive: boolean
  isSystem: boolean
  /** Claves de las capacidades del rol */
  permissions: string[]
  assignable: boolean
  reason: 'inactive' | 'super_admin_only' | 'missing_permissions' | null
  /** Capacidades del rol que quien asigna no tiene (solo si reason es missing_permissions) */
  missing: string[]
}

export interface UserData {
  id: number
  nombre: string
  roles: Role[]
  email: string
  phone?: string | null
  createdAt: string
  active?: boolean
  activationUrl?: string
  emailSent?: boolean
  emailError?: string | null
}

/** Valores que editan los formularios de crear/editar usuario. */
export interface UserFormValues {
  nombre: string
  email: string
  phone?: string | null
  roles: Role[]
}

export type UserFormField = 'nombre' | 'email' | 'phone' | 'roles'
