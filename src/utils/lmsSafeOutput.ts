// Salidas seguras del LMS: texto del servidor que se inserta en HTML y enlaces
// a recursos que reciben el token de acceso.

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}

/** Escapa texto del servidor antes de interpolarlo en un HTML armado a mano. */
export const escapeHtml = (value: unknown): string =>
  String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPES[char])

/**
 * URL para abrir un recurso del LMS. El token de acceso solo se agrega si la URL
 * es del propio API: una URL absoluta de otro origen (puesta por quien crea el
 * curso) nunca debe recibir el token. Devuelve null si no hay URL válida.
 */
export const buildLmsResourceUrl = (
  href: string | null | undefined,
  token: string | null,
  apiBase: string
): string | null => {
  if (!href) return null
  let url: URL
  let apiOrigin: string
  try {
    apiOrigin = new URL(apiBase).origin
    url = new URL(/^https?:\/\//i.test(href) ? href : `${apiBase}${href}`)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  if (token && url.origin === apiOrigin) url.searchParams.set('token', token)
  return url.toString()
}
