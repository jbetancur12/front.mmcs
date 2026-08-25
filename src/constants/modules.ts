/**
 * Espejo del catálogo de módulos (api.mmcs, migración
 * 20260825120000-add-module-audience-and-catalog.js).
 *
 * audience define quién usa el módulo:
 *   - internal: solo personal interno
 *   - client:   solo usuarios de clientes
 *   - both:     ambos
 *
 * Los items de menú sin moduleName o con moduleName fuera de este catálogo
 * se consideran "core" y siempre visibles (mismo criterio que 'Basic').
 */
export const MODULE_AUDIENCE = {
  calibration: 'internal',
  maintenance: 'internal',
  fleet: 'internal',
  iot: 'internal',
  purchases: 'internal',
  quality: 'both',
  lms: 'both',
} as const

export type ModuleName = keyof typeof MODULE_AUDIENCE

export type Audience = 'internal' | 'client' | 'both'

// Match case-insensitive: el sidebar tiene variantes legacy ('Fleet', 'Iot')
export const getModuleAudience = (moduleName?: string): Audience | undefined => {
  if (!moduleName) return undefined
  const key = moduleName.toLowerCase() as ModuleName
  return MODULE_AUDIENCE[key]
}

/**
 * ¿La audiencia del módulo incluye este tipo de usuario?
 * userType: 'internal' | 'client' (derivado de customerId en el backend)
 */
export const audienceIncludes = (
  moduleName: string | undefined,
  userType: 'internal' | 'client'
): boolean => {
  const audience = getModuleAudience(moduleName)
  if (!audience) return true // core / desconocido → siempre visible
  if (audience === 'both') return true
  return audience === userType
}
