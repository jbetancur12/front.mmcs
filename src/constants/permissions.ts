/**
 * Capacidades (permisos) que entrega el backend en `permissions` de /auth/validateToken.
 *
 * Espejo de api.mmcs/constants/permissions.js: mismas claves, mismos nombres de constante.
 * Si el catálogo del backend cambia, regenerar este archivo (el test del backend
 * test/permissionCatalog.test.js falla si las claves dejan de coincidir).
 *
 * Solo cosmético: la autorización real vive en el backend. Lo que muestra el front sale de
 * lo que el backend dice que el usuario puede hacer, así los menús y botones no pueden
 * desalinearse de las rutas (a diferencia de comparar roles en la interfaz).
 */
export const PERMISSIONS = {
  /** Ver tickets, su línea de tiempo, informe técnico, comentarios, archivos, PDFs y buscar herramientas */
  MAINTENANCE_TICKET_VIEW: 'maintenance:ticket:view',
  /** Crear tickets de mantenimiento */
  MAINTENANCE_TICKET_CREATE: 'maintenance:ticket:create',
  /** Editar tickets (el técnico solo ciertos campos: regla del controlador) */
  MAINTENANCE_TICKET_UPDATE: 'maintenance:ticket:update',
  /** Eliminar tickets */
  MAINTENANCE_TICKET_DELETE: 'maintenance:ticket:delete',
  /** Crear o editar el informe técnico de un ticket */
  MAINTENANCE_TECHNICAL_REPORT_EDIT: 'maintenance:technical_report:edit',
  /** Comentar tickets */
  MAINTENANCE_COMMENT_CREATE: 'maintenance:comment:create',
  /** Editar o eliminar comentarios (autor o coordinación: regla del controlador) */
  MAINTENANCE_COMMENT_MANAGE: 'maintenance:comment:manage',
  /** Subir archivos a un ticket */
  MAINTENANCE_FILE_UPLOAD: 'maintenance:file:upload',
  /** Editar o eliminar archivos de tickets */
  MAINTENANCE_FILE_MANAGE: 'maintenance:file:manage',
  /** Ver estadísticas de archivos */
  MAINTENANCE_FILE_STATISTICS: 'maintenance:file:statistics',
  /** Ver protocolos de mantenimiento */
  MAINTENANCE_PROTOCOL_VIEW: 'maintenance:protocol:view',
  /** Crear, editar y eliminar protocolos */
  MAINTENANCE_PROTOCOL_MANAGE: 'maintenance:protocol:manage',
  /** Ver ficha, métricas y bitácora de un técnico */
  MAINTENANCE_TECHNICIAN_VIEW: 'maintenance:technician:view',
  /** Listar técnicos */
  MAINTENANCE_TECHNICIAN_LIST: 'maintenance:technician:list',
  /** Dar de alta técnicos */
  MAINTENANCE_TECHNICIAN_CREATE: 'maintenance:technician:create',
  /** Editar técnicos (el técnico solo su propia ficha: regla del controlador) */
  MAINTENANCE_TECHNICIAN_UPDATE: 'maintenance:technician:update',
  /** Eliminar técnicos */
  MAINTENANCE_TECHNICIAN_DELETE: 'maintenance:technician:delete',
  /** Recalcular la carga de trabajo de los técnicos */
  MAINTENANCE_TECHNICIAN_RECALCULATE_WORKLOAD: 'maintenance:technician:recalculate_workload',
  /** Ver estadísticas, tablero y analítica de mantenimiento */
  MAINTENANCE_ANALYTICS_VIEW: 'maintenance:analytics:view',
  /** Ver tickets por facturar */
  MAINTENANCE_INVOICING_VIEW: 'maintenance:invoicing:view',
  /** Marcar tickets como facturados */
  MAINTENANCE_INVOICING_MANAGE: 'maintenance:invoicing:manage',
  /** Ver roles, capacidades y la auditoría de cambios */
  RBAC_VIEW: 'rbac:view',
  /** Crear roles y activar o desactivar capacidades */
  RBAC_MANAGE: 'rbac:manage'
} as const

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

/**
 * ¿El usuario tiene alguna de las capacidades pedidas (any-of)?
 *
 * `userPermissions === undefined` significa que el backend aún no envía capacidades (despliegue
 * del front antes que el del backend): se deja ver la interfaz y el backend responde 403 si
 * corresponde. Una lista vacía (`[]`) sí significa "ninguna capacidad".
 */
export const hasPermission = (
  userPermissions: readonly string[] | undefined,
  required: PermissionKey | readonly PermissionKey[]
): boolean => {
  if (userPermissions === undefined) return true
  const wanted = Array.isArray(required) ? required : [required]
  return wanted.some((key) => userPermissions.includes(key))
}
