import { useStore } from '@nanostores/react'
import { userStore } from '../store/userStore'

export const useHasRole = (allowedRoles: string[]): boolean => {
  const $userStore = useStore(userStore)
  // Aseguramos que $userStore.rol sea un array; si no, usamos un array vacío.
  return ($userStore?.rol ?? []).some((role: string) =>
    allowedRoles.includes(role)
  )
}
