/**
 * Temporada navideña: del 15 de noviembre al 6 de enero. El interruptor decide
 * si se muestra; la fecha evita que quede encendido pasadas las fiestas.
 */
export const isHolidaySeason = (date: Date = new Date()): boolean => {
  const month = date.getMonth()
  const day = date.getDate()
  return (
    (month === 10 && day >= 15) || month === 11 || (month === 0 && day <= 6)
  )
}
