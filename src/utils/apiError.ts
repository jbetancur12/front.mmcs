/**
 * Lector único de errores del API. El backend responde en varios formatos:
 *  - estándar (errorHandler): { error: { code, message, details? } }
 *  - viejo:                   { error: 'texto' } o { message: 'texto' }
 *  - con detalle suelto:      { details: 'texto' | [{ field, message }] }
 * Toda pantalla debe leerlos con estas funciones y no con `response.data.error`.
 */

export interface ApiErrorDetail {
  field?: string
  message: string
}

export interface ParsedApiError {
  /** 0 si no hubo respuesta (red, timeout) */
  status: number
  code: string | null
  /** Motivo legible, o null si el servidor no dio ninguno */
  message: string | null
  details: ApiErrorDetail[]
}

interface ApiErrorLike {
  response?: {
    status?: number
    data?: unknown
  }
}

const asText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null

const asDetails = (value: unknown): ApiErrorDetail[] => {
  if (typeof value === 'string') {
    const text = asText(value)
    return text ? [{ message: text }] : []
  }
  if (!Array.isArray(value)) return []
  return value.flatMap((item): ApiErrorDetail[] => {
    if (typeof item === 'string') {
      const text = asText(item)
      return text ? [{ message: text }] : []
    }
    const message = asText((item as { message?: unknown })?.message)
    if (!message) return []
    const field = asText((item as { field?: unknown })?.field)
    return [field ? { field, message } : { message }]
  })
}

export const parseApiError = (error: unknown): ParsedApiError => {
  const response = (error as ApiErrorLike)?.response
  const status = response?.status ?? 0
  const data = (response?.data ?? {}) as Record<string, unknown>
  const apiError = data.error

  if (apiError && typeof apiError === 'object') {
    const structured = apiError as Record<string, unknown>
    return {
      status,
      code: asText(structured.code),
      message: asText(structured.message),
      details: asDetails(structured.details)
    }
  }

  return {
    status,
    code: null,
    message: asText(apiError) ?? asText(data.message),
    details: asDetails(data.details)
  }
}

/**
 * Motivo del error para mostrar al usuario, sin importar el estado HTTP:
 * el detalle por campo si lo hay (validación), si no el mensaje. Null si el
 * servidor no dio ninguno.
 */
export const getApiErrorReason = (error: unknown): string | null => {
  const { message, details } = parseApiError(error)
  if (details.length) return details.map((d) => d.message).join('. ')
  return message
}

/**
 * Arma el mensaje de un toast de error: el texto base más el motivo que
 * devuelve el backend cuando es un rechazo de negocio (4xx). En errores de
 * servidor (5xx) o sin respuesta se deja solo el texto base.
 */
export const getApiErrorMessage = (error: unknown, fallback: string) => {
  const { status } = parseApiError(error)
  if (status < 400 || status >= 500) return fallback
  const reason = getApiErrorReason(error)
  return reason ? `${fallback} ${reason}` : fallback
}

/** Código de error del backend (`{ error: { code } }`), si lo hay. */
export const getApiErrorCode = (error: unknown): string | null =>
  parseApiError(error).code

/**
 * Como getApiErrorMessage, pero devuelve solo el motivo en rechazos 4xx y el
 * texto base en otros casos.
 */
export const getStructuredApiErrorMessage = (
  error: unknown,
  fallback: string
) => {
  const { status } = parseApiError(error)
  if (status < 400 || status >= 500) return fallback
  return getApiErrorReason(error) ?? fallback
}
