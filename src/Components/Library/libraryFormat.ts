/** `yyyy-MM-dd` como "1 oct 2026", sin el desfase de zona horaria de `new Date(texto)`. */
export const formatLibraryDate = (value: string): string => {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return value
  return new Date(year, month - 1, day).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
