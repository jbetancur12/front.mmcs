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
