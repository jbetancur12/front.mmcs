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
