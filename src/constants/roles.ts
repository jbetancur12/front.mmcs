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
  TECHNICAL_DIRECTOR: 'technical_director'
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
}

/** Label en español o el nombre crudo si no está mapeado. */
export const getRoleLabelEs = (roleName?: string | null): string => {
  if (!roleName) return ''
  return ROLE_LABELS_ES[roleName] ?? roleName
}
