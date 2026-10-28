import { ROLES } from 'src/constants/roles'
import { moduleLabel } from '../Rbac/PermissionMatrix'
import { AssignableRole } from './types'

/** Capacidades por módulo, de más a menos: [{ module, label, count }]. */
export const moduleCounts = (permissions: string[]) => {
  const counts = new Map<string, number>()
  for (const key of permissions) {
    const module = key.split(':')[0]
    counts.set(module, (counts.get(module) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([module, count]) => ({ module, label: moduleLabel(module), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'))
}

/** "Calibración, Compras y 2 más": en qué módulos trabaja un rol (los más grandes primero). */
export const roleModulesText = (
  role: Pick<AssignableRole, 'permissions'>,
  max = 3
) => {
  const modules = moduleCounts(role.permissions ?? [])
  if (modules.length === 0) return 'Sin capacidades propias'
  const shown = modules.slice(0, max).map((m) => m.label)
  const rest = modules.length - shown.length
  return rest > 0 ? `${shown.join(', ')} y ${rest} más` : shown.join(', ')
}

/** Por qué quien asigna no puede dar un rol, en palabras de todos los días. */
export const unassignableText = (role: AssignableRole): string | null => {
  switch (role.reason) {
    case 'inactive':
      return 'Rol desactivado'
    case 'super_admin_only':
      return 'Solo un super administrador puede dar este rol'
    case 'missing_permissions': {
      const modules = moduleCounts(role.missing ?? []).map((m) => m.label)
      return `No disponible: incluye capacidades que tú no tienes (${modules.slice(0, 3).join(', ')}${
        modules.length > 3 ? '…' : ''
      })`
    }
    default:
      return null
  }
}

// Roles con vista comercial de los servicios de calibración. El API (constants/calibrationService.constants.js)
// aún decide la vista limitada del metrólogo por el nombre del rol, no por una capacidad: mientras siga así, la
// combinación se avisa aquí. Cuando esa regla pase a capacidades, este aviso sale de este archivo.
const COMMERCIAL_VIEW_ROLES: string[] = [
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
  ROLES.COMP_ADMIN,
  ROLES.COMP_REQUESTER,
  ROLES.INVOICING,
  ROLES.CALIBRATION_COORDINATOR
]

/** Avisos sobre combinaciones de roles cuyo efecto no se ve en la lista de capacidades. */
export const combinationNotes = (roleNames: string[]): string[] => {
  const notes: string[] = []
  const hasMetrologist = roleNames.includes(ROLES.METROLOGIST)
  const commercial = roleNames.filter((name) =>
    COMMERCIAL_VIEW_ROLES.includes(name)
  )
  if (hasMetrologist && commercial.length > 0) {
    notes.push(
      'Con Metrólogo y un rol comercial o de coordinación a la vez, la persona deja de tener la vista limitada de servicios de calibración (solo los asignados a ella, desde la ODS) y ve todos.'
    )
  }
  return notes
}
