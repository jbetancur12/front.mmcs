// src/utils/useCalibrationRealtimeUpdates.ts
import { useEffect } from 'react'
import { useQueryClient, QueryClient, QueryKey } from 'react-query'
import {
  CalibrationSensorUpdatePayload,
  Chamber,
  SensorDataPoint
} from 'src/Components/LaboratoryMonitor/types'
import useWebSocket, { WebSocketMessage } from './use-websockets'

const chambersQueryKey: QueryKey = ['chambers']

/**
 * Aplica una lectura de calibración al caché de cámaras. Es el mismo camino
 * que sigue un mensaje real del WebSocket; el simulador de pruebas lo reutiliza.
 */
export const applyCalibrationSensorUpdate = (
  queryClient: QueryClient,
  updatePayload: CalibrationSensorUpdatePayload
) => {
  queryClient.setQueryData<Chamber[]>(chambersQueryKey, (oldData) => {
    if (!oldData) {
      console.warn('No existing chamber data in cache to update.')
      return []
    }
    // Crear una nueva copia para asegurar la inmutabilidad y el re-render
    let dataWasUpdated = false
    const newData = oldData.map((chamber) => {
      if (chamber.id !== updatePayload.chamberId) {
        return chamber
      }
      dataWasUpdated = true // Marcamos que al menos la cámara coincidió
      return {
        ...chamber,
        patterns: (chamber.patterns || []).map((pattern) => {
          if (pattern.id !== updatePayload.patternId) {
            return pattern
          }
          return {
            ...pattern,
            sensors: (pattern.sensors || []).map((sensor) => {
              if (sensor.id !== updatePayload.sensorId) {
                return sensor
              }
              const newReadingDataPoint: SensorDataPoint = {
                timestamp: new Date(
                  updatePayload.newReading.timestamp
                ).getTime(),
                temperature: updatePayload.newReading.temperature,
                humidity: updatePayload.newReading.humidity
              }
              let updatedHistoricalData = [
                ...(sensor.historicalData || []),
                newReadingDataPoint
              ]

              const { dataMode, dataValue } = pattern
              if (dataMode === 'LAST_POINTS' && dataValue > 0) {
                // MODO PUNTOS: Recortar el array para mantener solo los últimos 'dataValue' puntos
                while (updatedHistoricalData.length > dataValue) {
                  updatedHistoricalData.shift() // Elimina el punto más antiguo (del principio del array)
                }
              } else if (dataMode === 'LAST_MINUTES' && dataValue > 0) {
                // MODO TIEMPO: Filtrar el array para mantener solo los puntos de los últimos 'dataValue' minutos
                const cutoffTimestamp = Date.now() - dataValue * 60 * 1000
                updatedHistoricalData = updatedHistoricalData.filter(
                  (point) => point.timestamp >= cutoffTimestamp
                )
              }
              return {
                ...sensor,
                lastTemperature: updatePayload.lastTemperature ?? undefined,
                lastHumidity: updatePayload.lastHumidity ?? undefined,
                lastSeen: updatePayload.lastSeen,
                currentTemperature:
                  updatePayload.newReading.temperature ?? undefined,
                currentHumidity: updatePayload.newReading.humidity ?? undefined,
                historicalData: updatedHistoricalData,
                stabilityStatus: updatePayload.stabilityStatus || {
                  temperatureStable: false,
                  humidityStable: false
                }
              }
            })
          }
        })
      }
    })
    // Solo retorna newData si realmente hubo una actualización para evitar re-renders innecesarios
    // si el mensaje era para un chamberId/patternId/sensorId que no está en el caché.
    return dataWasUpdated ? newData : oldData
  })
}

export const useCalibrationRealtimeUpdates = () => {
  const { subscribe } = useWebSocket()
  const queryClient = useQueryClient()

  // Se procesa cada mensaje al llegar (no lastMessage), para no perder
  // lecturas cuando varios sensores reportan casi al mismo tiempo.
  useEffect(() => {
    const handleMessage = (message: WebSocketMessage) => {
      if (message.type !== 'CALIBRATION_SENSOR_UPDATE') return

      const updatePayload = message.data as CalibrationSensorUpdatePayload

      if (!updatePayload || !updatePayload.sensorId) {
        console.warn(
          'Received CALIBRATION_SENSOR_UPDATE without valid payload data.',
          updatePayload
        )
        return
      }

      applyCalibrationSensorUpdate(queryClient, updatePayload)
    }

    return subscribe(handleMessage)
  }, [subscribe, queryClient])
}
