import { atom } from 'nanostores'

interface UserData {
  nombre: string
  email: string
  rol: string
  customer: {
    id: number
    nombre: string
    // Otras propiedades de User
  }
}

export const userStore = atom<UserData>({
  nombre: '',
  email: '',
  rol: '',
  customer: {
    id: 0,
    nombre: ''
  }
})
