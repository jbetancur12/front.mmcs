const isEnabled = (value: string | undefined) =>
  value?.trim().toLowerCase() === 'true'

/**
 * El módulo Certificados a liberar está en construcción: sin menú, sin buscador (Ctrl+K) y sin ruta hasta darlo por
 * listo. Para mostrarlo: `VITE_RELEASE_CERTIFICATES_ENABLED=true` en `.env.production` (y en `.env.development` para
 * verlo en local) y volver a construir. La migración y las rutas del backend existen aunque esté oculto.
 */
export const releaseCertificatesEnabled = isEnabled(
  import.meta.env.VITE_RELEASE_CERTIFICATES_ENABLED
)
