import { useEffect } from 'react'
import { DeviceAlarm } from 'src/Components/Iot/DeviceIotMap/types'

import {
  hasAlarms,
  updateDeviceAlarms,
  updateDeviceAlarmStatus,
  updateDeviceIotStatus
} from 'src/store/deviceIotStore'

export const wss = () => {
  const currentHost = window.location.hostname
  const isPrivateNetworkHost =
    /^10\./.test(currentHost) ||
    /^192\.168\./.test(currentHost) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(currentHost)
  const isLocalDevelopmentHost =
    currentHost === 'localhost' ||
    currentHost === '127.0.0.1' ||
    isPrivateNetworkHost

  if (import.meta.env.VITE_ENV === 'development') {
    if (isLocalDevelopmentHost) {
      try {
        const url = new URL(import.meta.env.VITE_WS_URL)
        url.hostname = currentHost
        return url.toString()
      } catch {
        return import.meta.env.VITE_WS_URL
      }
    }

    return import.meta.env.VITE_WS_URL_CLOUDFARE
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
          // const data: DataPayload = message
          // const deviceIotId = data.data.dev
          // const gps = data.data.gps // Ejemplo: [lat, lng]
          // const timestamp = data.timestamp // Ejemplo: timestamp en segundos
          // const sen = data.data.sen
          // const src = data.data.pwr.src // Ejemplo: { t: valor, h: valor }
          // updateDeviceIotLocation(deviceIotId, gps)
          // updateDeviceIotSensorData(deviceIotId, timestamp, sen)
          // addRealTimeData(data)
          // setLatestRealTimeData(data)
          // updateDeviceIotStatus(deviceIotId, 'online', true, src)
        }
        if (type === 'ALARM_UPDATE') {
          updateDeviceAlarmStatus(message.data.deviceId, message.data.isInAlarm)
        }
        if (type === 'LABORATORY_DATA') {
          console.log(message)
        }
        if (type === 'ALARM_STATUS_UPDATE') {
          const { deviceId, alarms } = message.data

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
