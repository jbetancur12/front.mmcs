// src/utils/useDeviceNotifications.ts
import { useEffect, useRef } from 'react'
import useWebSocket, { WebSocketMessage } from './use-websockets'
import Swal from 'sweetalert2'

export const useDeviceNotifications = () => {
  const { lastMessage } = useWebSocket()
  const processedMessageRef = useRef<WebSocketMessage | null>(null)

  useEffect(() => {
    if (!lastMessage || processedMessageRef.current === lastMessage) return
    processedMessageRef.current = lastMessage

    // --- MANEJAR CONFIRMACIÓN DE ÉXITO ---
    if (lastMessage.type === 'DEVICE_CONFIG_CONFIRMED') {
      // Asumiendo que tu WebSocket envía este evento
      const payload = lastMessage.data
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Dispositivo Actualizado',
        text: `El dispositivo confirmó la nueva configuración para el patrón ${payload.patternId}.`,
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true
      })
    }

    // --- MANEJAR TIMEOUT ---
    if (lastMessage.type === 'DEVICE_CONFIG_TIMEOUT') {
      console.log('Timeout de configuración del dispositivo:', lastMessage)
      const payload = lastMessage.data
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Sin Confirmación del Dispositivo',
        text: `El dispositivo del patrón ${payload.patternId} no respondió.`,
        showConfirmButton: false,
        timer: 8000, // Un poco más de tiempo para leer
        timerProgressBar: true
      })
    }
  }, [lastMessage])
}
