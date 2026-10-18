import { useCallback, useState } from 'react'

type Permission = NotificationPermission | 'unsupported'

const currentPermission = (): Permission =>
  typeof window !== 'undefined' && 'Notification' in window
    ? Notification.permission
    : 'unsupported'

/**
 * Notificaciones del sistema (Windows, macOS): aparecen aunque el navegador
 * esté minimizado o se esté usando otro programa. Piden permiso una vez,
 * desde un botón, y solo se muestran si la página no está a la vista.
 */
export const useDesktopNotifications = () => {
  const [permission, setPermission] = useState<Permission>(currentPermission)

  const request = useCallback(async () => {
    if (!('Notification' in window)) return
    try {
      setPermission(await Notification.requestPermission())
    } catch {
      setPermission(currentPermission())
    }
  }, [])

  const notify = useCallback((title: string, body: string, tag: string) => {
    if (currentPermission() !== 'granted') return
    // Con la página a la vista ya están el aviso de voz y el cuadro verde
    if (!document.hidden && document.hasFocus()) return
    try {
      const notification = new Notification(title, {
        body,
        tag, // Un mismo patrón reemplaza su aviso anterior, también entre pestañas
        requireInteraction: true // Se queda hasta que alguien lo cierre
      })
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    } catch {
      // Algunos navegadores solo permiten notificaciones desde el service worker
    }
  }, [])

  return { permission, request, notify }
}
