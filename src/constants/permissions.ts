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
  /** Ver las cotizaciones de venta de equipos, sus documentos y descargarlos */
  SALES_QUOTATION_VIEW: 'sales:quotation:view',
  /** Crear cotizaciones de venta de equipos */
  SALES_QUOTATION_CREATE: 'sales:quotation:create',
  /** Editar cotizaciones de venta de equipos */
  SALES_QUOTATION_UPDATE: 'sales:quotation:update',
  /** Mover una cotización por el flujo: enviar al cliente, registrar aprobación, rechazo o cambios, dejarla lista para facturar y cancelarla */
  SALES_QUOTATION_WORKFLOW: 'sales:quotation:workflow',
  /** Facturar una cotización que está lista para facturar */
  SALES_QUOTATION_INVOICE: 'sales:quotation:invoice',
  /** Subir documentos y evidencias a una cotización */
  SALES_QUOTATION_DOCUMENT_UPLOAD: 'sales:quotation:document_upload',
  /** Generar el PDF de una cotización */
  SALES_QUOTATION_PDF: 'sales:quotation:pdf',
  /** Ver el catálogo de productos de venta de equipos */
  SALES_PRODUCT_VIEW: 'sales:product:view',
  /** Crear, editar y desactivar productos de venta de equipos */
  SALES_PRODUCT_MANAGE: 'sales:product:manage',
  /** Ver y editar el consecutivo y la plantilla de términos de las cotizaciones (cambiar un consecutivo ya iniciado sigue siendo solo de admin y super_admin: regla del controlador) */
  SALES_CONFIG_MANAGE: 'sales:config:manage',
  /** Consultar el catálogo de empresas y sus sedes (lo usan los selectores de cotizaciones, servicios y mapas) */
  CUSTOMERS_CUSTOMER_CATALOG: 'customers:customer:catalog',
  /** Ver la ficha de una empresa (el usuario de una empresa cliente solo ve la suya: regla del controlador) */
  CUSTOMERS_CUSTOMER_VIEW: 'customers:customer:view',
  /** Crear empresas */
  CUSTOMERS_CUSTOMER_CREATE: 'customers:customer:create',
  /** Editar empresas (datos, estado activo y perfil de certificados) */
  CUSTOMERS_CUSTOMER_UPDATE: 'customers:customer:update',
  /** Eliminar empresas */
  CUSTOMERS_CUSTOMER_DELETE: 'customers:customer:delete',
  /** Gestionar empresas: pantalla de empresas, archivos, usuarios, correos de notificación y empresas con módulo IoT */
  CUSTOMERS_CUSTOMER_MANAGE: 'customers:customer:manage',
  /** Cambiar la imagen de una empresa */
  CUSTOMERS_CUSTOMER_AVATAR: 'customers:customer:avatar',
  /** Agregar, editar y eliminar las sedes de una empresa */
  CUSTOMERS_SITE_MANAGE: 'customers:site:manage',
  /** Ver los módulos contratados por una empresa */
  CUSTOMERS_MODULE_VIEW: 'customers:module:view',
  /** Activar o desactivar módulos a una empresa */
  CUSTOMERS_MODULE_ASSIGN: 'customers:module:assign',
  /** Ver, asignar y quitar los cursos de la academia de una empresa */
  CUSTOMERS_LMS_COURSE_MANAGE: 'customers:lms_course:manage',
  /** Ver el catálogo de módulos del sistema */
  CUSTOMERS_MODULE_CATALOG_VIEW: 'customers:module_catalog:view',
  /** Crear módulos en el catálogo del sistema */
  CUSTOMERS_MODULE_CATALOG_MANAGE: 'customers:module_catalog:manage',
  /** Ver los sensores de condiciones del laboratorio y su histórico */
  LABORATORY_DEVICE_VIEW: 'laboratory:device:view',
  /** Crear, editar y eliminar los sensores de condiciones del laboratorio */
  LABORATORY_DEVICE_MANAGE: 'laboratory:device:manage',
  /** Ver cámaras, patrones, sensores y lecturas de calibración del laboratorio */
  LABORATORY_CALIBRATION_VIEW: 'laboratory:calibration:view',
  /** Crear, editar y eliminar cámaras, patrones y sensores, y configurar un patrón */
  LABORATORY_CALIBRATION_MANAGE: 'laboratory:calibration:manage',
  /** Listar dispositivos IoT (el usuario de una empresa solo ve los suyos: regla del controlador) */
  IOT_DEVICE_LIST: 'iot:device:list',
  /** Ver dispositivos IoT por id o cliente, su histórico, energía, alarmas, eventos y datos agregados */
  IOT_DEVICE_VIEW: 'iot:device:view',
  /** Crear, editar y eliminar dispositivos IoT y configurar sus módulos */
  IOT_DEVICE_MANAGE: 'iot:device:manage',
  /** Crear y editar alarmas de dispositivos IoT */
  IOT_ALARM_MANAGE: 'iot:alarm:manage',
  /** Ver los informes de trabajo no conforme, sus alertas y verificar códigos */
  NONCONFORM_REPORT_VIEW: 'nonconform:report:view',
  /** Crear, editar y eliminar informes de trabajo no conforme */
  NONCONFORM_REPORT_MANAGE: 'nonconform:report:manage',
  /** Listar los usuarios y los usuarios internos */
  USERS_USER_LIST: 'users:user:list',
  /** Ver un usuario y sus archivos (el usuario de una empresa cliente solo el suyo: regla del controlador) */
  USERS_USER_VIEW: 'users:user:view',
  /** Crear usuarios (registro), con sus roles */
  USERS_USER_CREATE: 'users:user:create',
  /** Editar un usuario de una empresa (datos y estado activo) */
  USERS_USER_UPDATE: 'users:user:update',
  /** Editar usuarios internos, incluidos sus roles */
  USERS_USER_UPDATE_INTERNAL: 'users:user:update_internal',
  /** Eliminar usuarios */
  USERS_USER_DELETE: 'users:user:delete',
  /** Cambiar la contraseña de otro usuario */
  USERS_USER_PASSWORD_RESET: 'users:user:password_reset',
  /** Generar y reenviar el enlace de activación de un usuario */
  USERS_USER_ACTIVATION: 'users:user:activation',
  /** Listar los roles (para asignarlos a personas y a cursos) */
  USERS_ROLE_LIST: 'users:role:list',
  /** Cambiar el rol de un usuario (endpoint sin uso en la interfaz) */
  USERS_ROLE_ASSIGN: 'users:role:assign',
  /** Suplantar a otro usuario y ver la lista de candidatos */
  USERS_IMPERSONATION_USE: 'users:impersonation:use',
  /** Crear, editar y eliminar perfiles de biomédicos, su imagen y su hoja de vida */
  USERS_PROFILE_MANAGE: 'users:profile:manage',
  /** Ver la configuración general del sistema */
  SYSTEM_SETTINGS_VIEW: 'system:settings:view',
  /** Crear, editar y eliminar la configuración general del sistema */
  SYSTEM_SETTINGS_MANAGE: 'system:settings:manage',
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
