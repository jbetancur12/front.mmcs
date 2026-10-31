const isEnabled = (value: string | undefined) =>
  value?.trim().toLowerCase() === 'true'

/**
 * El módulo Biblioteca está terminado en código pero oculto hasta darlo por listo: sin menú, sin buscador (Ctrl+K) y
 * sin ruta. Para mostrarlo: `VITE_LIBRARY_ENABLED=true` en `.env.production` (y en `.env.development` para verlo en
 * local) y volver a construir. La migración y las rutas del backend existen aunque esté oculto.
 */
export const libraryEnabled = isEnabled(import.meta.env.VITE_LIBRARY_ENABLED)
