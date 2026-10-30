// src/utils/useDeviceNotifications.ts
import { useEffect } from 'react'
import useWebSocket, { WebSocketMessage } from './use-websockets'
import { notify } from 'src/utils/notify'

import { logger } from 'src/utils/logger'
export const useDeviceNotifications = () => {
  const { subscribe } = useWebSocket()

  useEffect(() => {
    const handleMessage = (lastMessage: WebSocketMessage) => {
      // --- MANEJAR CONFIRMACIÓN DE ÉXITO ---
      if (lastMessage.type === 'DEVICE_CONFIG_CONFIRMED') {
        // Asumiendo que tu WebSocket envía este evento
        const payload = lastMessage.data
        notify.success(
          'Dispositivo Actualizado',
          `El dispositivo confirmó la nueva configuración para el patrón ${payload.patternId}.`
        )
      }

      // --- MANEJAR TIMEOUT ---
      if (lastMessage.type === 'DEVICE_CONFIG_TIMEOUT') {
        logger.log('Timeout de configuración del dispositivo:', lastMessage)
        const payload = lastMessage.data
        notify.warning(
          'Sin Confirmación del Dispositivo',
          `El dispositivo del patrón ${payload.patternId} no respondió.`,
          { duration: 8000 }
        )
      }
    }

    return subscribe(handleMessage)
  }, [subscribe])
}
