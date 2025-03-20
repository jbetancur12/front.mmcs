import { useEffect } from 'react'
import { DataPayload } from 'src/Components/Iot/types'
import {
  addRealTimeData,
  updateDeviceIotLocation,
  updateDeviceIotStatus
} from 'src/store/deviceIotStore'

const useWebSocket = () => {
  useEffect(() => {
    // Asegúrate de que la URL en VITE_WS_URL apunte a tu servidor WebSocket
    const socket = new WebSocket(import.meta.env.VITE_WS_URL)

    socket.onopen = () => {
      console.log('Conexión establecida con el servidor WebSocket')
    }

    socket.onmessage = (event) => {
      try {
        // Parseamos el mensaje recibido asumiendo que es JSON

        const message = JSON.parse(event.data)
        const type = message.type // Aquí se obtiene el tipo del mensaje

        // updateDeviceIotStatus(deviceIotId, 'online');
        if (type === 'data') {
          // Se asume que el payload para sensor data tiene esta estructura:
          // { type: "data", data: { dev, gps, ts, sen } }
          const data: DataPayload = message
          const deviceIotId = data.data.dev
          const gps = data.data.gps // Ejemplo: [lat, lng]
          const timestamp = data.data.ts // Ejemplo: timestamp en segundos
          const sen = data.data.sen
          const src = data.data.pwr.src // Ejemplo: { t: valor, h: valor }

          updateDeviceIotLocation(deviceIotId, gps, timestamp, sen)
          addRealTimeData(data)
          updateDeviceIotStatus(deviceIotId, 'online', true, src)
        }
        if (type === 'power') {
          const data = message
        }
        if (type === 'status') {
          const statusData = message.data
          if (
            statusData.offlineDeviceIds &&
            statusData.offlineDeviceIds.length > 0
          ) {
            statusData.offlineDeviceIds.forEach((deviceId: string | number) => {
              updateDeviceIotStatus(
                deviceId.toString(),
                'offline',
                false,
                'main'
              )
            })
          }
        }
      } catch (error) {
        console.error('Error al procesar el mensaje:', error)
      }
    }

    socket.onerror = (error) => {
      console.error('Error en WebSocket:', error)
    }

    socket.onclose = () => {
      console.log('Conexión WebSocket cerrada')
    }

    // Cleanup: cierra la conexión cuando se desmonta el componente
    return () => {
      socket.close()
    }
  }, [])

  return null
}

export default useWebSocket
