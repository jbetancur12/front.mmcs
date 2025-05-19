import { AxiosInstance } from 'axios' // Tipo para la instancia de Axios

// Asume que estos tipos están definidos en tu archivo de tipos, ej: '../types' o '../types/index.ts'
import {
  Chamber,
  Pattern,
  Sensor,
  SensorType,
  SensorReading
  // SensorDataPoint, // Si es necesario para alguna respuesta específica
} from '../types' // Ajusta la ruta a tu archivo de tipos principal

// --- Interfaces para Payloads y Respuestas Específicas ---

// Payloads para creación/actualización
interface CreateChamberPayload {
  name: string
  status?: string
}

interface UpdateChamberPayload {
  name?: string
  status?: string
}

interface CreatePatternPayload {
  name: string
}

interface UpdatePatternPayload {
  // Si permites actualizar patrones
  name?: string
}

interface CreateSensorPayload {
  name: string
  type: SensorType // Usando el tipo SensorType definido
  showGraph?: boolean
}

interface UpdateSensorPayload {
  name?: string
  type?: SensorType
  showGraph?: boolean
}

// Respuesta común para operaciones de eliminación exitosas
interface DeleteResponse {
  message: string
}

// Para la paginación de lecturas de sensores
interface FetchSensorReadingsParams {
  limit?: number
  page?: number
}

interface PaginatedSensorReadingsResponse {
  totalItems: number
  totalPages: number
  currentPage: number
  readings: SensorReading[] // Asumiendo que SensorReading tiene la forma correcta
}

const API_BASE_URL = '/laboratory-calibration' // La base de tus rutas de calibración en el backend

// --- Funciones de Cámara ---
export const fetchChambers = async (
  axiosPrivate: AxiosInstance
): Promise<Chamber[]> => {
  const response = await axiosPrivate.get<Chamber[]>(`${API_BASE_URL}/chambers`)
  return response.data
}

export const createChamber = async (
  axiosPrivate: AxiosInstance,
  chamberData: CreateChamberPayload
): Promise<Chamber> => {
  const response = await axiosPrivate.post<Chamber>(
    `${API_BASE_URL}/chambers`,
    chamberData
  )
  return response.data
}

export const updateChamber = async (
  axiosPrivate: AxiosInstance,
  chamberId: string | number, // Asume que el ID puede ser string o number
  updateData: UpdateChamberPayload
): Promise<Chamber> => {
  const response = await axiosPrivate.put<Chamber>(
    `${API_BASE_URL}/chambers/${chamberId}`,
    updateData
  )
  return response.data
}

export const deleteChamber = async (
  axiosPrivate: AxiosInstance,
  chamberId: string | number
): Promise<DeleteResponse> => {
  const response = await axiosPrivate.delete<DeleteResponse>(
    `${API_BASE_URL}/chambers/${chamberId}`
  )
  return response.data
}

// --- Funciones de Patrón ---
export const createPattern = async (
  axiosPrivate: AxiosInstance,
  chamberId: string | number,
  patternData: CreatePatternPayload
): Promise<Pattern> => {
  const response = await axiosPrivate.post<Pattern>(
    `${API_BASE_URL}/chambers/${chamberId}/patterns`,
    patternData
  )
  return response.data
}

// Si tienes una ruta para actualizar patrones:
export const updatePattern = async (
  axiosPrivate: AxiosInstance,
  patternId: string | number,
  patternData: UpdatePatternPayload
): Promise<Pattern> => {
  const response = await axiosPrivate.put<Pattern>(
    `${API_BASE_URL}/patterns/${patternId}`,
    patternData
  )
  return response.data
}

export const deletePattern = async (
  axiosPrivate: AxiosInstance,
  patternId: string | number
): Promise<DeleteResponse> => {
  const response = await axiosPrivate.delete<DeleteResponse>(
    `${API_BASE_URL}/patterns/${patternId}`
  )
  return response.data
}

// --- Funciones de Sensor ---
export const createSensor = async (
  axiosPrivate: AxiosInstance,
  patternId: string | number,
  sensorData: CreateSensorPayload
): Promise<Sensor> => {
  const response = await axiosPrivate.post<Sensor>(
    `${API_BASE_URL}/patterns/${patternId}/sensors`,
    sensorData
  )
  return response.data
}

// Si tienes una ruta para actualizar sensores:
export const updateSensor = async (
  axiosPrivate: AxiosInstance,
  sensorId: string | number,
  sensorData: UpdateSensorPayload
): Promise<Sensor> => {
  const response = await axiosPrivate.put<Sensor>(
    `${API_BASE_URL}/sensors/${sensorId}`,
    sensorData
  )
  return response.data
}

export const deleteSensor = async (
  axiosPrivate: AxiosInstance,
  sensorId: string | number
): Promise<DeleteResponse> => {
  const response = await axiosPrivate.delete<DeleteResponse>(
    `${API_BASE_URL}/sensors/${sensorId}`
  )
  return response.data
}

// --- Funciones de Lecturas de Sensor ---
export const fetchSensorReadings = async (
  axiosPrivate: AxiosInstance,
  sensorId: string | number,
  params?: FetchSensorReadingsParams
): Promise<PaginatedSensorReadingsResponse> => {
  const response = await axiosPrivate.get<PaginatedSensorReadingsResponse>(
    `${API_BASE_URL}/sensors/${sensorId}/readings`,
    { params }
  )
  console.log(
    '%csrc/Components/LaboratoryMonitor/services/calibrationApi.ts:190 response',
    'color: #007acc;',
    response
  )
  return response.data
}
