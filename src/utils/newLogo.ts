import { ROLES, hasAnyRole } from 'src/constants/roles'

/**
 * Roles que ven el logo nuevo mientras está en revisión. `developer` se asigna
 * por código en la API y no hace parte de ROLES.
 */
const NEW_LOGO_ROLES: string[] = [ROLES.ADMIN, 'developer']

export const canSeeNewLogo = (
  userRoles: readonly string[] | null | undefined
): boolean => hasAnyRole(userRoles, NEW_LOGO_ROLES)
