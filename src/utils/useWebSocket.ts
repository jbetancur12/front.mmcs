import { useEffect } from 'react'
import { DeviceAlarm } from 'src/Components/Iot/DeviceIotMap/types'
import { DataPayload } from 'src/Components/Iot/types'
import {
  addRealTimeData,
  hasAlarms,
  setLatestRealTimeData,
  updateDeviceAlarms,
  updateDeviceAlarmStatus,
  updateDeviceIotLocation,
  updateDeviceIotSensorData,
  updateDeviceIotStatus
} from 'src/store/deviceIotStore'

export const wss = () => {
  if (import.meta.env.VITE_ENV === 'development') {
    return window.location.hostname.includes('localhost') ||
      window.location.hostname.includes('127.0.0.1')
      ? import.meta.env.VITE_WS_URL // Usar localhost si estás en casa
      : import.meta.env.VITE_WS_URL_CLOUDFARE // Usar Cloudflare si estás fuera
  } else {
    return import.meta.env.VITE_WS_URL
  }
}

const useWebSocket = () => {
  useEffect(() => {
    // Asegúrate de que la URL en VITE_WS_URL apunte a tu servidor WebSocket
    const socket = new WebSocket(wss())

    socket.onopen = () => {
      console.log('Conexión establecida con el servidor WebSocket')
    }

    socket.onmessage = (event) => {
      try {
        // Parseamos el mensaje recibido asumiendo que es JSON

        const message = JSON.parse(event.data)

        const type = message.type // Aquí se obtiene el tipo del mensaje

        // updateDeviceIotStatus(deviceIotId, 'online');
        if (type === 'REAL_TIME_DATA') {
          // Se asume que el payload para sensor data tiene esta estructura:
          // { type: "data", data: { dev, gps, ts, sen } }
          const data: DataPayload = message
          const deviceIotId = data.data.dev
          const gps = data.data.gps // Ejemplo: [lat, lng]
          const timestamp = data.timestamp // Ejemplo: timestamp en segundos

          const sen = data.data.sen
          const src = data.data.pwr.src // Ejemplo: { t: valor, h: valor }

          updateDeviceIotLocation(deviceIotId, gps)
          updateDeviceIotSensorData(deviceIotId, timestamp, sen)
          addRealTimeData(data)
          setLatestRealTimeData(data)
          updateDeviceIotStatus(deviceIotId, 'online', true, src)
        }
        if (type === 'ALARM_UPDATE') {
          updateDeviceAlarmStatus(message.data.deviceId, message.data.isInAlarm)
        }
        if (type === 'ALARM_STATUS_UPDATE') {
          const { deviceId, alarms } = message.data
          console.log('🚀 ~ useEffect ~ alarms:', alarms)

          // Convertir a tipos correctos
          const formattedAlarms: DeviceAlarm[] = alarms.map(
            (alarm: DeviceAlarm) => ({
              ...alarm,
              deviceId: Number(deviceId),
              createdAt: new Date(alarm.createdAt), // Asumiendo que viene de backend
              lastTriggered: alarm.lastTriggered
                ? new Date(alarm.lastTriggered)
                : null
            })
          )

          updateDeviceAlarms(deviceId, formattedAlarms)

          if (message.data.alarms.length > 0) {
            hasAlarms(true)
          } else {
            hasAlarms(false)
          }
        }

        if (type === 'power') {
        }
        if (type === 'DEVICE_STATUS') {
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
