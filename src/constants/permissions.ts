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
  /** Ver solicitudes de compra */
  PURCHASES_REQUEST_VIEW: 'purchases:request:view',
  /** Crear solicitudes de compra */
  PURCHASES_REQUEST_CREATE: 'purchases:request:create',
  /** Editar solicitudes de compra */
  PURCHASES_REQUEST_UPDATE: 'purchases:request:update',
  /** Pre-aprobar, aprobar o rechazar solicitudes de compra */
  PURCHASES_REQUEST_DECIDE: 'purchases:request:decide',
  /** Asignar proveedores a los ítems de una solicitud */
  PURCHASES_REQUEST_ASSIGN_SUPPLIERS: 'purchases:request:assign_suppliers',
  /** Fijar el consecutivo inicial de solicitudes */
  PURCHASES_REQUEST_SET_INITIAL_ID: 'purchases:request:set_initial_id',
  /** Ver cotizaciones de compra */
  PURCHASES_QUOTATION_VIEW: 'purchases:quotation:view',
  /** Registrar cotizaciones de compra */
  PURCHASES_QUOTATION_CREATE: 'purchases:quotation:create',
  /** Aceptar una cotización de compra */
  PURCHASES_QUOTATION_ACCEPT: 'purchases:quotation:accept',
  /** Ver órdenes de compra y el historial de compras por proveedor */
  PURCHASES_ORDER_VIEW: 'purchases:order:view',
  /** Generar órdenes de compra */
  PURCHASES_ORDER_CREATE: 'purchases:order:create',
  /** Ver verificaciones de compra */
  PURCHASES_VERIFICATION_VIEW: 'purchases:verification:view',
  /** Crear verificaciones de compra */
  PURCHASES_VERIFICATION_CREATE: 'purchases:verification:create',
  /** Editar verificaciones de compra */
  PURCHASES_VERIFICATION_UPDATE: 'purchases:verification:update',
  /** Ver proveedores, sus documentos y el estado de sus evaluaciones */
  PURCHASES_SUPPLIER_VIEW: 'purchases:supplier:view',
  /** Registrar proveedores */
  PURCHASES_SUPPLIER_CREATE: 'purchases:supplier:create',
  /** Editar los datos de un proveedor */
  PURCHASES_SUPPLIER_UPDATE: 'purchases:supplier:update',
  /** Cambiar la retención de un proveedor */
  PURCHASES_SUPPLIER_RETENTION: 'purchases:supplier:retention',
  /** Subir documentos de un proveedor */
  PURCHASES_SUPPLIER_DOCUMENT_UPLOAD: 'purchases:supplier:document_upload',
  /** Ver la selección de proveedores */
  PURCHASES_SUPPLIER_SELECTION_VIEW: 'purchases:supplier_selection:view',
  /** Crear y editar la selección de proveedores */
  PURCHASES_SUPPLIER_SELECTION_MANAGE: 'purchases:supplier_selection:manage',
  /** Ver evaluaciones de proveedores */
  PURCHASES_EVALUATION_VIEW: 'purchases:evaluation:view',
  /** Crear y editar evaluaciones de proveedores */
  PURCHASES_EVALUATION_MANAGE: 'purchases:evaluation:manage',
  /** Ver las estadísticas de compras */
  PURCHASES_STATISTICS_VIEW: 'purchases:statistics:view',
  /** Descargar los informes PDF de compras (proveedores, solicitudes, órdenes, verificaciones, evaluaciones y cotizaciones) */
  PURCHASES_REPORT_VIEW: 'purchases:report:view',
  /** Descargar el informe de selección de proveedores (FOG-MMCS-10) */
  PURCHASES_REPORT_SELECTION: 'purchases:report:selection',
  /** Ver el personal de compras */
  PURCHASES_PERSONNEL_VIEW: 'purchases:personnel:view',
  /** Crear, editar y eliminar personal de compras */
  PURCHASES_PERSONNEL_MANAGE: 'purchases:personnel:manage',
  /** Gestionar los parámetros fiscales (listar todos, crear, editar y eliminar) */
  PURCHASES_FISCAL_PARAMETER_MANAGE: 'purchases:fiscal_parameter:manage',
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
