/**
 * Cabecera de una respuesta de axios como texto (undefined si no viene). Desde axios 1.2x las cabeceras de respuesta se
 * tipan como una unión (string | number | boolean | string[] | AxiosHeaders) y ya no sirven directamente donde se espera
 * un string, p. ej. el `type` de un Blob.
 */
export const headerText = (
  headers: unknown,
  name: string
): string | undefined => {
  if (!headers || typeof headers !== 'object') return undefined
  const source = headers as {
    get?: (key: string) => unknown
    [key: string]: unknown
  }
  const value =
    typeof source.get === 'function' ? source.get(name) : source[name]
  if (value === undefined || value === null || value === false) return undefined
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}
