interface AppConfig {
  VERSION: string
  BUILD_DATE: string
  ENVIRONMENT: string
  CHANGELOG: Record<string, string>
  CLEAR_TOKENS_ON_VERSION_CHANGE: boolean
  CLEAR_CACHE_ON_VERSION_CHANGE: boolean
}

export const APP_CONFIG: AppConfig = {
  VERSION: '1.6.5',
  BUILD_DATE: '2026-10-03',
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
    '1.6.5': 'Calibración: mensajes de error claros, botones con motivo y documentos vigentes'
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
