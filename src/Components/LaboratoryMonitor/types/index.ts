// src/Components/LaboratoryMonitor/types/index.ts

export const CHAMBER_STATUS = {
  IDLE: 'IDLE', // O el valor exacto que uses en el backend (ej: 'Esperando Calibración')
  CALIBRATING: 'CALIBRATING' // O el valor exacto (ej: 'Calibración Iniciada')
} as const // 'as const' para tipos más estrictos

export type ChamberStatus = (typeof CHAMBER_STATUS)[keyof typeof CHAMBER_STATUS]

export interface SensorReading {
  id: number
  sensorId: number
  chamberId: number
  temperature: number
  humidity: number
  timestamp: string | Date
}

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
  dataMode: 'LAST_MINUTES' | 'LAST_POINTS' // Modo de visualización
  dataValue: number // Cantidad de minutos o puntos a mostrar
}

export interface Chamber {
  id: string
  name: string
  status: ChamberStatus // e.g., 'Esperando inicio...', 'Calibrando...'
  calibrationStartTime?: string | Date | null
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
