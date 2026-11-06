/**
 * Siguiente fecha de renovación: un año después de la fecha de vencimiento o,
 * si ya venció, un año después de hoy. Ajusta el 29 de febrero al 28.
 */
export const nextRenewalDate = (
  expiresOn: string,
  today = new Date().toLocaleDateString('en-CA')
) => {
  const expires = expiresOn.slice(0, 10)
  const base = expires > today ? expires : today
  const [year, month, day] = base.split('-').map(Number)
  const nextYear = year + 1
  const lastDay = new Date(Date.UTC(nextYear, month, 0)).getUTCDate()
  return `${nextYear}-${String(month).padStart(2, '0')}-${String(
    Math.min(day, lastDay)
  ).padStart(2, '0')}`
}
