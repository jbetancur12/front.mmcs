import { atom } from 'nanostores'

export interface Module {
  id: number
  name: string
  description: string
  label: string
  customerModules: {
    isActive: boolean
    /** Solo en /customers/:id/modules: último cambio y quién lo hizo. */
    updatedAt?: string
    updater?: { id: number; nombre: string } | null
  }
}
export interface UserData {
  nombre: string
  email: string
  rol: string[]
  /**
   * Capacidades que el backend entrega en /auth/validateToken (ver constants/permissions.ts).
   * `undefined` = el backend aún no las envía.
   */
  permissions?: string[]
  userType?: 'internal' | 'client'
  lmsOnly?: boolean
  customer: {
    id: number
    nombre: string
    modules: Module[]
    // Otras propiedades de User
  }
}

export const userStore = atom<UserData>({
  nombre: '',
  email: '',
  rol: [''],
  permissions: [],
  userType: 'internal',
  lmsOnly: false,
  customer: {
    id: 0,
    nombre: '',
    modules: [
      {
        id: 1,
        name: 'Basic',
        description: '',
        label: 'Basic',
        customerModules: {
          isActive: true
        }
      }
    ]
  }
})
