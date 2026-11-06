import axios from 'axios'
import { axiosPrivate } from '@utils/api'

/** Nombre sugerido por el backend en `Content-Disposition`, si el navegador lo deja leer. */
const filenameFromDisposition = (header?: string): string | null => {
  if (!header) return null
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header)
  if (utf8) {
    try {
      return decodeURIComponent(utf8[1])
    } catch {
      return utf8[1]
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header)
  return plain ? plain[1] : null
}

/**
 * Pide un archivo con sesión (blob) y lo descarga con un enlace temporal.
 * `fallbackName` se usa si el backend no expone el nombre.
 */
export const downloadPrivateFile = async (
  url: string,
  fallbackName: string,
  params?: Record<string, unknown>
): Promise<void> => {
  try {
    const response = await axiosPrivate.get(url, {
      responseType: 'blob',
      params
    })
    const name =
      filenameFromDisposition(response.headers?.['content-disposition']) ??
      fallbackName
    const objectUrl = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000)
  } catch (error) {
    // Con responseType 'blob' el cuerpo del error también es un Blob. Se
    // convierte de vuelta a JSON para que la pantalla muestre el motivo real
    // (permiso, ruta, validación) y no un mensaje genérico.
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      try {
        error.response.data = JSON.parse(await error.response.data.text())
      } catch {
        // Si no es JSON, se conserva el error original.
      }
    }
    throw error
  }
}
