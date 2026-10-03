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
