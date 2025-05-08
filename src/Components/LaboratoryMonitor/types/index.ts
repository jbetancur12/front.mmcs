// src/Components/LaboratoryMonitor/types/index.ts

export interface SensorDataPoint {
  timestamp: number // O string si es ISO date
  temperature?: number | null
  humidity?: number | null
}

export type SensorType = 'temperature_humidity' | 'temperature_only'

export interface Sensor {
  id: string
  name: string
  type: SensorType
  showGraph: boolean
  lastTemperature?: number
  averageTemperature?: number
  lastHumidity?: number
  averageHumidity?: number
  historicalData: SensorDataPoint[]
  lastSeen: string
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
  patterns: Pattern[]
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

export interface CalibrationSensorUpdatePayload {
  chamberId: string | number
  chamberName?: string
  patternId: string | number
  patternName?: string
  sensorId: string | number
  sensorName?: string
  sensorType: SensorType // Es importante tener el tipo para la lógica de UI si es necesario
  lastTemperature?: number | null
  lastHumidity?: number | null
  lastSeen: string // ISO Date string
  newReading: {
    // La lectura específica que disparó la actualización
    temperature?: number | null
    humidity?: number | null
    timestamp: string // ISO Date string
  }
}
