interface ApiErrorLike {
  response?: {
    status?: number
    data?: { error?: unknown; message?: unknown; details?: unknown }
  }
}

/**
 * Arma el mensaje de un toast de error: el texto base más el motivo que
 * devuelve el backend cuando es un rechazo de negocio (4xx). En errores de
 * servidor (5xx) o sin respuesta se deja solo el texto base.
 */
export const getApiErrorMessage = (error: unknown, fallback: string) => {
  const response = (error as ApiErrorLike)?.response
  const status = response?.status ?? 0

  if (status < 400 || status >= 500) {
    return fallback
  }

  const data = response?.data
  const reason = [data?.details, data?.error, data?.message].find(
    (value): value is string =>
      typeof value === 'string' && value.trim().length > 0
  )

  return reason ? `${fallback} ${reason.trim()}` : fallback
}

interface StructuredApiError {
  response?: {
    status?: number
    data?: { error?: { code?: string; message?: string } | string }
  }
}

/** Código de error del backend LMS (`{ error: { code, message } }`), si lo hay. */
export const getApiErrorCode = (error: unknown): string | null => {
  const payload = (error as StructuredApiError)?.response?.data?.error
  return payload && typeof payload === 'object' ? payload.code ?? null : null
}

/**
 * Como getApiErrorMessage, pero entiende las respuestas del errorHandler del
 * backend, donde el motivo viene en `error.message`. Devuelve solo el motivo
 * en rechazos 4xx y el texto base en otros casos.
 */
export const getStructuredApiErrorMessage = (error: unknown, fallback: string) => {
  const response = (error as StructuredApiError)?.response
  const status = response?.status ?? 0
  if (status < 400 || status >= 500) return fallback

  const payload = response?.data?.error
  const reason = typeof payload === 'string' ? payload : payload?.message
  return reason && reason.trim() ? reason.trim() : fallback
}
