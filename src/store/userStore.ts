import { atom } from 'nanostores'

export interface Module {
  id: number
  name: string
  description: string
  label: string
  customerModules: {
    isActive: boolean
  }
}
export interface UserData {
  nombre: string
  email: string
  rol: string
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
  rol: '',
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
