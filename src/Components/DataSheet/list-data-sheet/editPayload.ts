/** Entero a partir de lo que escribió la persona: sin signos ni decimales, y vacío es 0. */
export const toNumber = (value: unknown) => {
  const digits = String(value ?? '')
    .split('.')[0]
    .replace(/[^0-9]/g, '')
  return digits ? parseInt(digits, 10) : 0
}

/**
 * Columnas enteras del equipo que el formulario maneja como texto. El backend compara tipos: mandar "12" donde ya hay 12
 * cuenta como cambio, así que cada edición reescribía estos campos y los marcaba como modificados sin haberlos tocado.
 */
export const NUMERIC_KEYS = ['maintenanceCycle', 'calibrationCycle'] as const

/** Copia del cuerpo a enviar con las columnas enteras convertidas a número. */
export const withNumericFields = (
  payload: Record<string, unknown>
): Record<string, unknown> => {
  const result = { ...payload }
  NUMERIC_KEYS.forEach((key) => {
    if (key in result) result[key] = toNumber(result[key])
  })
  return result
}
