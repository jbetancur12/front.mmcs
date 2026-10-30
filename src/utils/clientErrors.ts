/**
 * Ayudas para decidir qué errores del navegador se reportan al backend y para cruzarlos con su log:
 * el backend responde `X-Request-ID` (y `requestId` en el cuerpo de los errores) en cada petición.
 */

interface ResponseLike {
  status?: number
  data?: unknown
  headers?: Record<string, unknown> | { get?: (name: string) => unknown }
}

interface ErrorLike {
  isAxiosError?: boolean
  code?: string
  message?: string
  response?: ResponseLike
}

const headerValue = (
  headers: ResponseLike['headers'],
  name: string
): string | null => {
  if (!headers) return null
  const getter = (headers as { get?: (n: string) => unknown }).get
  const value =
    typeof getter === 'function'
      ? getter.call(headers, name)
      : (headers as Record<string, unknown>)[name]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

/** `requestId` de la respuesta de un error del API (cabecera o cuerpo); null si no hubo respuesta. */
export const getRequestId = (error: unknown): string | null => {
  const response = (error as ErrorLike | null | undefined)?.response
  if (!response) return null
  const fromHeader = headerValue(response.headers, 'x-request-id')
  if (fromHeader) return fromHeader
  const fromBody = (response.data as { requestId?: unknown } | null | undefined)
    ?.requestId
  return typeof fromBody === 'string' && fromBody.trim()
    ? fromBody.trim()
    : null
}

// Avisos del navegador sin información útil ni acción posible
const BENIGN_MESSAGES = [
  'ResizeObserver loop',
  'Script error.',
  'Non-Error promise rejection captured'
]

/**
 * ¿Vale la pena reportar este error? Los de petición con respuesta 4xx son flujos normales (sesión vencida,
 * permisos, validación) y los cancelados no son fallos; solo se reportan los 5xx y los errores de código.
 */
export const shouldReportClientError = (error: unknown): boolean => {
  const message =
    (error as ErrorLike | null | undefined)?.message ?? String(error ?? '')
  if (BENIGN_MESSAGES.some((text) => message.includes(text))) return false

  const like = error as ErrorLike | null | undefined
  if (like?.code === 'ERR_CANCELED') return false
  if (like?.isAxiosError || like?.response) {
    const status = like.response?.status
    return typeof status === 'number' && status >= 500
  }
  return true
}
