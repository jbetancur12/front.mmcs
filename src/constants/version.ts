interface AppConfig {
  VERSION: string
  BUILD_DATE: string
  ENVIRONMENT: string
  CHANGELOG: Record<string, string>
  CLEAR_TOKENS_ON_VERSION_CHANGE: boolean
  CLEAR_CACHE_ON_VERSION_CHANGE: boolean
}

export const APP_CONFIG: AppConfig = {
  VERSION: '1.8.0',
  BUILD_DATE: '2026-10-16',
  ENVIRONMENT:
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_ENV || 'development'
      : 'development',

  // Changelog para tracking
  CHANGELOG: {
    '1.2.1': 'Fix token authentication + LMS content editor',
    '1.2.0': 'LMS module improvements',
    '1.6.2': 'Rol analista de datos: envio de certificado',
    '1.6.3': 'Usuarios y roles: encabezado, estado de activación y menú de acciones',
    '1.6.4': 'Anexo PDF de avance técnico en calibración',
    '1.6.5': 'Calibración: mensajes de error claros, botones con motivo y documentos vigentes',
    '1.6.6': 'Calibración: chips de estado, tabla de bandeja y ajustes de operación',
    '1.6.7': 'Calibración: acceso del director técnico y ajustes de chips y documentos',
    '1.6.9': 'Filtro por estado en equipos del cliente',
    '1.6.10': 'Compras: control de envío de la orden de compra',
    '1.8.0': 'Compras: control de envío de órdenes y rediseño de tablas, acciones y modales'
  } as Record<string, string>,

  // Configuración de limpieza
  CLEAR_TOKENS_ON_VERSION_CHANGE: true,
  CLEAR_CACHE_ON_VERSION_CHANGE: true
}

// Helper para logging
export const logVersionUpdate = (from: string | null, to: string): void => {
  console.log(`🔄 App version updated: ${from || 'unknown'} → ${to}`)
  if (APP_CONFIG.CHANGELOG[to]) {
    console.log(`📝 Changes: ${APP_CONFIG.CHANGELOG[to]}`)
  }
}
