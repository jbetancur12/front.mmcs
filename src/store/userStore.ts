import { atom } from 'nanostores'

interface UserData {
  nombre: string
  email: string
  rol: string
}

export const userStore = atom<UserData>({
  nombre: '',
  email: '',
  rol: ''
})
