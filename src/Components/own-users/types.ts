export interface Role {
  id: number
  name: string
  description: string
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
