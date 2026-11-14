/** Entero con separador de miles colombiano: 1908 pasa a "1.908". */
export const formatInt = (value: number | null | undefined) =>
  value === null || value === undefined
    ? 'Sin dato'
    : value.toLocaleString('es-CO')
