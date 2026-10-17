/** Formato es-CO de los indicadores: "1.000", "64 %", "5 de octubre de 2026". */
export const formatCount = (value: number): string =>
  value.toLocaleString('es-CO')

export const formatPct = (value: number | null, decimals = 0): string =>
  value === null
    ? 'Sin meta'
    : `${value.toLocaleString('es-CO', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })} %`

/** "—" cuando no hay base para calcular el porcentaje. */
export const formatPctOrDash = (value: number | null, decimals = 0): string =>
  value === null ? '—' : formatPct(value, decimals)

const parseDate = (value: string): Date => {
  // "2026-10-14" (solo fecha) se lee como día local para no correrlo por zona horaria.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return dateOnly
    ? new Date(
        Number(dateOnly[1]),
        Number(dateOnly[2]) - 1,
        Number(dateOnly[3])
      )
    : new Date(value)
}

export const formatDate = (value: string | null | undefined): string =>
  value
    ? parseDate(value).toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: /^\d{4}-\d{2}-\d{2}$/.test(value)
          ? undefined
          : 'America/Bogota'
      })
    : '—'

export const formatShortDate = (value: string | null | undefined): string =>
  value
    ? parseDate(value).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: /^\d{4}-\d{2}-\d{2}$/.test(value)
          ? undefined
          : 'America/Bogota'
      })
    : '—'

/** Novedad neta con signo: "+5", "−3" o "0". */
export const formatSigned = (value: number): string =>
  value > 0
    ? `+${formatCount(value)}`
    : value < 0
      ? `−${formatCount(Math.abs(value))}`
      : '0'

/** Quita el prefijo "Calibración de/del" de las etiquetas que vienen de la ODS. */
export const cleanTypeLabel = (label: string): string =>
  label
    .replace(/^calibraci[oó]n\s+(del?\s+)?/i, '')
    .replace(/^./, (c) => c.toUpperCase())

export const TEAL_TEXT = '#00695c'
export const TEAL = '#00BFA5'
export const EMERALD_GRADIENT = 'linear-gradient(135deg, #10b981, #059669)'

/** Botón primario del perfil (degradado esmeralda); apagado se ve gris, no verde. */
export const emeraldButtonSx = {
  textTransform: 'none',
  fontWeight: 600,
  background: EMERALD_GRADIENT,
  '&.Mui-disabled': { background: '#e5e7eb', color: '#9ca3af' }
} as const
