export const APP_CONFIG = {
  VERSION: '1.4.0',
  BUILD_DATE: '2025-10-20',
  ENVIRONMENT:
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_ENV || 'development'
      : 'development',

  // Changelog para tracking
  CHANGELOG: {
    '1.2.1': 'Fix token authentication + LMS content editor',
    '1.2.0': 'LMS module improvements',
    '1.4.0': '--commit'
  },

  // Configuración de limpieza
  CLEAR_TOKENS_ON_VERSION_CHANGE: true,
  CLEAR_CACHE_ON_VERSION_CHANGE: true
}

// Helper para logging
export const logVersionUpdate = (from: string | null, to: string) => {
  console.log(`🔄 App version updated: ${from || 'unknown'} → ${to}`)
  if (APP_CONFIG.CHANGELOG[to]) {
    console.log(`📝 Changes: ${APP_CONFIG.CHANGELOG[to]}`)
  }
}
