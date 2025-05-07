// src/features/calibrationMonitor/views/mockData.ts
// (Este archivo lo crearíamos junto a CalibrationChamberView.tsx o en una subcarpeta 'data')

import {
  Chamber,
  Pattern,
  Sensor,
  SensorDataPoint,
  SensorType,
  SensorSummaryViewData
} from '../types'
import { v4 as uuidv4 } from 'uuid' // Necesitarás instalar uuid: npm install uuid @types/uuid

const generateHistoricalData = (
  points = 20,
  includeHumidity = true
): SensorDataPoint[] => {
  const data: SensorDataPoint[] = []
  const now = Date.now()
  for (let i = points - 1; i >= 0; i--) {
    const timestamp = now - i * 60000 // Datos cada minuto
    const temperature = 20 + Math.random() * 5 + Math.sin(i / 5)
    const humidity = includeHumidity
      ? 40 + Math.random() * 10 + Math.cos(i / 3)
      : undefined
    data.push({
      timestamp,
      temperature: parseFloat(temperature.toFixed(2)),
      ...(includeHumidity && { humidity: parseFloat(humidity!.toFixed(2)) })
    })
  }
  return data
}

const createSensor = (
  name: string,
  type: SensorType,
  showGraph: boolean,
  patternId: string
): Sensor => {
  const historicalData = generateHistoricalData(
    30,
    type === 'temperature_humidity'
  )
  const currentDataPoint = historicalData[historicalData.length - 1] || {
    temperature: 0,
    humidity: 0
  }
  return {
    id: uuidv4(),
    name,
    type,
    showGraph,
    patternId,
    currentTemperature: currentDataPoint.temperature,
    averageTemperature:
      historicalData.reduce((acc, curr) => acc + (curr.temperature || 0), 0) /
      historicalData.length,
    currentHumidity: currentDataPoint.humidity,
    averageHumidity:
      type === 'temperature_humidity'
        ? historicalData.reduce((acc, curr) => acc + (curr.humidity || 0), 0) /
          historicalData.length
        : undefined,
    historicalData
  }
}

const createPattern = (
  name: string,
  chamberId: string,
  sensorsData: Array<{ name: string; type: SensorType; showGraph: boolean }>
): Pattern => {
  const patternId = uuidv4()
  return {
    id: patternId,
    name,
    chamberId,
    sensors: sensorsData.map((sd) =>
      createSensor(sd.name, sd.type, sd.showGraph, patternId)
    )
  }
}

export const MOCK_CHAMBERS: Chamber[] = [
  {
    id: uuidv4(),
    name: 'Cámara Alpha',
    status: 'Esperando inicio de calibración'
    // patterns se llenarán abajo
  },
  {
    id: uuidv4(),
    name: 'Cámara Beta',
    status: 'Calibración Finalizada'
    // patterns se llenarán abajo
  }
]

export const MOCK_PATTERNS_BY_CHAMBER: Record<string, Pattern[]> = {
  [MOCK_CHAMBERS[0].id]: [
    createPattern('Patrón de Referencia A1', MOCK_CHAMBERS[0].id, [
      {
        name: 'Sensor T/H Principal',
        type: 'temperature_humidity',
        showGraph: true
      },
      {
        name: 'Sensor Temp. Secundario',
        type: 'temperature_only',
        showGraph: false
      }
    ]),
    createPattern('Patrón de Humedad Extrema A2', MOCK_CHAMBERS[0].id, [
      {
        name: 'Higrómetro Central',
        type: 'temperature_humidity',
        showGraph: true
      }
    ])
  ],
  [MOCK_CHAMBERS[1].id]: [
    createPattern('Patrón Estándar B1', MOCK_CHAMBERS[1].id, [
      { name: 'Termopar Superior', type: 'temperature_only', showGraph: true },
      {
        name: 'Sensor T/H Inferior',
        type: 'temperature_humidity',
        showGraph: true
      },
      {
        name: 'Sensor Ambiente',
        type: 'temperature_humidity',
        showGraph: false
      }
    ])
  ]
}

// Función para generar el resumen de sensores para la cámara seleccionada
export const generateSensorSummary = (
  patterns: Pattern[]
): SensorSummaryViewData[] => {
  const summary: SensorSummaryViewData[] = []
  patterns.forEach((pattern) => {
    pattern.sensors.forEach((sensor) => {
      summary.push({
        sensorId: sensor.id,
        patternName: pattern.name,
        sensorName: sensor.name,
        sensorType: sensor.type,
        latestTemperature: sensor.currentTemperature,
        averageTemperature: sensor.averageTemperature,
        latestHumidity: sensor.currentHumidity,
        averageHumidity: sensor.averageHumidity
      })
    })
  })
  return summary
}
