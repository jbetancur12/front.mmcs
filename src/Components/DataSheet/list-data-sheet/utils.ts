export const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0
})

export const validateRequired = (value: string) => !!value.length

/** Formatea un string ISO como "YYYY-MM-DD" para un input de tipo date. */
export const toDateInputValue = (rawValue: string): string =>
  rawValue ? new Date(rawValue).toISOString().split('T')[0] : ''

/** Descarga un blob en el navegador con el nombre indicado. */
export const downloadBlob = (data: BlobPart, fileName: string) => {
  const url = window.URL.createObjectURL(new Blob([data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link) // Eliminar el enlace después de la descarga
}
