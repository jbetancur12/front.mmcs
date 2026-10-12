import { useStore } from '@nanostores/react'
import { userStore } from '../store/userStore'
import { hasPermission, PermissionKey } from '../constants/permissions'

// Internal-only roles that require userType validation
/* const INTERNAL_ONLY_ROLES = [
  'admin',
  'super_admin',
  'metrologist',
  'purchasing',
  'secretary',
  'employee',
  'mantenimiento',
  'maintenance_coordinator'
] */

/**
 * ¿El usuario tiene alguna de las capacidades pedidas? Lee `permissions` de la sesión, que
 * entrega el backend en cada navegación: un cambio hecho en el panel se ve al navegar.
 */
export const useCan = (
  permission: PermissionKey | readonly PermissionKey[]
): boolean => {
  const $userStore = useStore(userStore)
  return hasPermission($userStore?.permissions, permission)
}

export const useHasRole = (allowedRoles: string[]): boolean => {
  const $userStore = useStore(userStore)
  // Aseguramos que $userStore.rol sea un array; si no, usamos un array vacío.
  return ($userStore?.rol ?? []).some((role: string) =>
    allowedRoles.includes(role)
  )
}
