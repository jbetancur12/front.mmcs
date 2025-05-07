// src/Components/LaboratoryMonitor/types/index.ts

export interface SensorDataPoint {
  timestamp: number // O string si es ISO date
  temperature?: number
  humidity?: number
}

export type SensorType = 'temperature_humidity' | 'temperature_only'

export interface Sensor {
  id: string
  name: string
  type: SensorType
  showGraph: boolean
  currentTemperature?: number
  averageTemperature?: number
  currentHumidity?: number
  averageHumidity?: number
  historicalData: SensorDataPoint[]
  // Podríamos necesitar el nombre del patrón aquí para la tabla resumen
  patternId: string
}

export interface Pattern {
  id: string
  name: string
  chamberId: string
  sensors: Sensor[]
}

export interface Chamber {
  id: string
  name: string
  status: string // e.g., 'Esperando inicio...', 'Calibrando...'
  // Los patrones y sensores podrían cargarse por separado o anidados
  // patterns?: Pattern[]; // Depende de cómo lo maneje React Query
}

// Para la tabla de resumen, podríamos necesitar una estructura aplanada
export interface SensorSummaryViewData {
  sensorId: string
  patternName: string
  sensorName: string
  sensorType: SensorType
  latestTemperature?: number
  averageTemperature?: number
  latestHumidity?: number
  averageHumidity?: number
}
