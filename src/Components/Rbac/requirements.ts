import { getPermissionHelp } from 'src/constants/permissionHelp'
import { RbacPermission } from '../../types/rbac'

/** Nombre sencillo de una capacidad (el de la guía); si falta, su clave. */
export const requirementName = (key: string) =>
  getPermissionHelp(key)?.name ?? key

/** Capacidades que `permission` necesita y que el rol aún no tiene (`has` dice si las tiene). */
export const missingRequirements = (
  permission: RbacPermission,
  has: (key: string) => boolean
): string[] => (permission.requires ?? []).filter((key) => !has(key))
