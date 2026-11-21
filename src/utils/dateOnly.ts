import { format, isValid } from 'date-fns'

const MIDNIGHT_UTC = /^(\d{4})-(\d{2})-(\d{2})(?:T00:00:00(?:\.000)?Z?)?$/

/**
 * Fecha de calendario (`dd/MM/yyyy`) de un valor que llega del servidor.
 * Las fechas sin hora (o a medianoche UTC) se muestran tal cual, sin
 * retroceder un día por la zona horaria; las que traen hora se pasan a hora
 * local. Devuelve `null` si el valor falta o no es una fecha.
 */
export const formatDateOnly = (value?: string | null): string | null => {
  if (!value) return null
  const match = MIDNIGHT_UTC.exec(value)
  if (match) return `${match[3]}/${match[2]}/${match[1]}`
  const date = new Date(value)
  return isValid(date) ? format(date, 'dd/MM/yyyy') : null
}

/**
 * Valor `yyyy-MM-dd` de la fecha que entrega un selector (`DatePicker`). `''` si la borraron y `null` si está a
 * medias (inválida, p. ej. mientras se teclea "05/1"): no se debe guardar, y `format` de date-fns lanzaría
 * "Invalid time value".
 */
export const pickerDateToInput = (date: Date | null): string | null => {
  if (!date) return ''
  return isValid(date) ? format(date, 'yyyy-MM-dd') : null
}

/** Igual que `pickerDateToInput`, pero con la fecha completa en ISO (`toISOString` lanzaría con una fecha inválida). */
export const pickerDateToIso = (date: Date | null): string | null => {
  if (!date) return ''
  return isValid(date) ? date.toISOString() : null
}

/**
 * Hoy en hora local (`yyyy-MM-dd`), para el valor inicial de un `<input type='date'>`.
 * `new Date().toISOString().slice(0, 10)` da el día UTC: pasadas las 19:00 en Colombia ya es «mañana» y el API
 * rechazaba la fecha como futura.
 */
export const todayInputValue = (now: Date = new Date()): string =>
  format(now, 'yyyy-MM-dd')

/**
 * Fecha de un `<input type='date'>` como instante ISO para el API. Si es hoy, va la hora actual: el mediodía de hoy,
 * por la mañana, queda en el futuro y el API responde 400 («no puede estar en el futuro»). Otro día va a mediodía
 * local, que no cambia de día con la zona horaria. `undefined` si está vacía o es inválida.
 */
export const dateInputToIso = (
  value: string | null | undefined,
  now: Date = new Date()
): string | undefined => {
  if (!value) return undefined
  if (value === todayInputValue(now)) return now.toISOString()
  const date = new Date(`${value}T12:00:00`)
  return isValid(date) ? date.toISOString() : undefined
}

/**
 * `true` si `value` cae después de hoy, comparando solo el día de calendario
 * (la hora no cuenta para decidir si una fecha es futura). Una fecha inválida
 * no se considera futura.
 */
export const isFutureDay = (value: Date, now: Date = new Date()): boolean => {
  if (!isValid(value)) return false
  const day = new Date(value.getFullYear(), value.getMonth(), value.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return day.getTime() > today.getTime()
}
