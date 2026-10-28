/**
 * Espejo de api.mmcs/constants/roles.constants.js — nombres canónicos de la
 * tabla `roles`. Mantener sincronizado con el backend.
 *
 * Solo cosmético: el frontend usa estos valores para filtrar menús y rutas
 * (ProtectedRoute). La autorización real vive en el backend.
 */
export const ROLES = {
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
  USER: 'user',
  METROLOGIST: 'metrologist',
  EMPLOYEE: 'employee',
  LMS_ONLY: 'lms_only',
  INVOICING: 'invoicing',
  TRAINING_MANAGER: 'Training Manager',
  // Mantenimiento
  MANTENIMIENTO: 'mantenimiento',
  TECHNICIAN: 'technician',
  MAINTENANCE_COORDINATOR: 'maintenance_coordinator',
  // Comercial / cotizaciones
  COMP_ADMIN: 'comp_admin',
  COMP_REQUESTER: 'comp_requester',
  // Calibración
  CALIBRATION_COORDINATOR: 'calibration_coordinator',
  TECHNICAL_DIRECTOR: 'technical_director',
  ANALISTA_DATOS: 'analista_datos',
  ENTREGAS: 'entregas'
} as const

export type RoleName = (typeof ROLES)[keyof typeof ROLES]

/**
 * Etiquetas en español para mostrar roles en UI (asignación de usuarios,
 * chips, tablas). Única fuente: no duplicar mapas locales en componentes.
 * Clave = nombre EXACTO en la tabla `roles` ('Training Manager' lleva
 * espacio y mayúsculas).
 */
export const ROLE_LABELS_ES: Record<string, string> = {
  admin: 'Administrador',
  super_admin: 'Super admin',
  user: 'Usuario',
  metrologist: 'Metrólogo',
  employee: 'Empleado',
  lms_only: 'Solo LMS',
  invoicing: 'Facturación',
  'Training Manager': 'Gestor de Capacitación',
  mantenimiento: 'Mantenimiento',
  technician: 'Técnico',
  maintenance_coordinator: 'Coord. de mantenimiento',
  comp_admin: 'Admin comercial',
  comp_requester: 'Solicitante comercial',
  calibration_coordinator: 'Coord. de calibración',
  technical_director: 'Director técnico',
  analista_datos: 'Analista de Datos',
  entregas: 'Entregas',
}

/** Label en español o el nombre crudo si no está mapeado. */
export const getRoleLabelEs = (roleName?: string | null): string => {
  if (!roleName) return ''
  return ROLE_LABELS_ES[roleName] ?? roleName
}

/**
 * Grupos de roles repetidos en menús, rutas y chequeos de UI. Los cuatro primeros
 * espejan ROLE_GROUPS de api.mmcs/constants/roles.constants.js (mismo nombre, mismos
 * roles); el resto son combinaciones que solo usa el front. Tipados como string[]
 * para poder pasarlos a useHasRole, ProtectedRoute y `roles` de los menús.
 *
 * Solo cosmético: la autorización real vive en el backend.
 */
export const ROLE_GROUPS = {
  /** Administración con separación de funciones (admin + super_admin) */
  ADMINS: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  /** Flujo comercial y de compras */
  COMMERCIAL_STAFF: [ROLES.ADMIN, ROLES.COMP_ADMIN, ROLES.COMP_REQUESTER],
  /** Personal de metrología (datasheets, certificados, archivos) */
  METROLOGY_STAFF: [ROLES.ADMIN, ROLES.METROLOGIST],
  /** Todo el personal que ve/opera tickets de mantenimiento */
  MAINTENANCE_STAFF: [
    ROLES.ADMIN,
    ROLES.MANTENIMIENTO,
    ROLES.TECHNICIAN,
    ROLES.MAINTENANCE_COORDINATOR
  ],
  /** Quienes asignan, priorizan y eliminan en mantenimiento */
  MAINTENANCE_MANAGERS: [ROLES.ADMIN, ROLES.MAINTENANCE_COORDINATOR],
  /** Comercial con edición (calibración y venta de equipos) */
  COMMERCIAL_EDITORS: [
    ROLES.ADMIN,
    ROLES.SUPER_ADMIN,
    ROLES.COMP_ADMIN,
    ROLES.COMP_REQUESTER
  ],
  /** Alta y edición de clientes */
  CUSTOMER_WRITE: [
    ROLES.ADMIN,
    ROLES.SUPER_ADMIN,
    ROLES.COMP_ADMIN,
    ROLES.METROLOGIST
  ],
  /** Pantallas que ve un admin y también el usuario de una empresa cliente */
  ADMIN_AND_CLIENT: [ROLES.ADMIN, ROLES.USER]
}

/** ¿Alguno de los roles del usuario está en la lista permitida? */
export const hasAnyRole = (
  userRoles: readonly string[] | null | undefined,
  allowedRoles: readonly string[]
): boolean => (userRoles ?? []).some((role) => allowedRoles.includes(role))
