interface AppConfig {
  VERSION: string
  BUILD_DATE: string
  ENVIRONMENT: string
  CHANGELOG: Record<string, string>
  CLEAR_TOKENS_ON_VERSION_CHANGE: boolean
  CLEAR_CACHE_ON_VERSION_CHANGE: boolean
}

export const APP_CONFIG: AppConfig = {
  VERSION: '1.5.3',
  BUILD_DATE: '2026-07-15',
  ENVIRONMENT:
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_ENV || 'development'
      : 'development',

  // Changelog para tracking
  CHANGELOG: {
    '1.2.1': 'Fix token authentication + LMS content editor',
    '1.2.0': 'LMS module improvements',
    '1.5.3': 'Version update'
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
