import { useMutation, useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'

type Id = number | string | null | undefined

const hasId = (id: Id) => id !== undefined && id !== null && id !== ''

/**
 * Hojas de vida de equipos (`/dataSheet`) y sus registros relacionados
 * (calibraciones, mantenimientos, entradas/salidas, préstamos).
 */
export const DATASHEET_QUERY_KEYS = {
  all: ['dataSheets'] as const,
  details: () => [...DATASHEET_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: Id) => [...DATASHEET_QUERY_KEYS.details(), String(id ?? '')] as const,
  status: (id: Id) => [...DATASHEET_QUERY_KEYS.all, 'status', String(id ?? '')] as const,
  inOutReport: (id: Id) =>
    [...DATASHEET_QUERY_KEYS.all, 'in-out-report', String(id ?? '')] as const,
  devicesOnLoan: () => [...DATASHEET_QUERY_KEYS.all, 'devices-on-loan'] as const,
  calibration: (id: Id) =>
    [...DATASHEET_QUERY_KEYS.all, 'calibration', String(id ?? '')] as const,
  inspectionMaintenance: (id: Id) =>
    [...DATASHEET_QUERY_KEYS.all, 'inspection-maintenance', String(id ?? '')] as const
}

/**
 * Opciones para datos que precargan un formulario editable: no se vuelven a
 * pedir al enfocar la ventana para no pisar lo que el usuario está editando.
 */
const formPrefillOptions = {
  staleTime: 0,
  refetchOnWindowFocus: false,
  keepPreviousData: false
}

/**
 * Detalle de una hoja de vida (incluye `calibrationHistories`). Siempre fresco
 * al montar (`staleTime: 0`): otras pantallas la modifican sin react-query.
 */
export const useDataSheet = <T = unknown>(
  id: Id,
  options: { refetchOnWindowFocus?: boolean } = {}
) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(
    DATASHEET_QUERY_KEYS.detail(id),
    async () => {
      const response = await axiosPrivate.get(`/dataSheet/${id}`, {})
      return response.data as T
    },
    {
      enabled: hasId(id),
      staleTime: 0,
      keepPreviousData: false,
      ...options
    }
  )
}

export interface DataSheetStatus {
  status?: 'busy' | 'available' | string
  lastRecord?: Record<string, unknown>[]
  [key: string]: unknown
}

/** Estado de préstamo (entrada/salida) de un equipo. */
export const useDataSheetStatus = (id: Id) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(
    DATASHEET_QUERY_KEYS.status(id),
    async () => {
      const response = await axiosPrivate.get(`/dataSheet/${id}/status`, {})
      return response.data as DataSheetStatus
    },
    { enabled: hasId(id), ...formPrefillOptions }
  )
}

/** Reporte de entradas/salidas de un equipo. */
export const useEquipmentInOutReport = <T = unknown>(id: Id) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(
    DATASHEET_QUERY_KEYS.inOutReport(id),
    async () => {
      const response = await axiosPrivate.get(`/dataSheet/${id}/in-out-report`, {})
      return response.data as T
    },
    { enabled: hasId(id), staleTime: 0, keepPreviousData: false }
  )
}

/** Equipos actualmente prestados (`/reports/devices-on-loan`). */
export const useDevicesOnLoan = <T = unknown>() => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(
    DATASHEET_QUERY_KEYS.devicesOnLoan(),
    async () => {
      const response = await axiosPrivate.get('/reports/devices-on-loan')
      return (Array.isArray(response.data) ? response.data : []) as T[]
    },
    { staleTime: 0 }
  )
}

/** Registro de calibración para editar. */
export const useCalibrationRecord = <T = unknown>(id: Id) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(
    DATASHEET_QUERY_KEYS.calibration(id),
    async () => {
      const response = await axiosPrivate.get(`/calibration/${id}`)
      return response.data as T
    },
    { enabled: hasId(id), ...formPrefillOptions }
  )
}

/** Registro de inspección/mantenimiento para editar. */
export const useInspectionMaintenanceRecord = <T = unknown>(id: Id) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(
    DATASHEET_QUERY_KEYS.inspectionMaintenance(id),
    async () => {
      const response = await axiosPrivate.get(`/inspectionMaintenance/${id}`)
      return response.data as T
    },
    { enabled: hasId(id), ...formPrefillOptions }
  )
}

const useInvalidateDataSheets = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries(DATASHEET_QUERY_KEYS.all)
}

/** Crea (POST) o actualiza (PUT) un registro de calibración. */
export const useSaveCalibration = () => {
  const axiosPrivate = useAxiosPrivate()
  const invalidate = useInvalidateDataSheets()
  return useMutation(
    ({ id, payload }: { id?: number | null; payload: object }) =>
      id
        ? axiosPrivate.put(`/calibration/${id}`, payload, {})
        : axiosPrivate.post('/calibration', payload, {}),
    { onSuccess: () => invalidate() }
  )
}

/** Crea (POST) o actualiza (PUT) un registro de inspección/mantenimiento. */
export const useSaveInspectionMaintenance = () => {
  const axiosPrivate = useAxiosPrivate()
  const invalidate = useInvalidateDataSheets()
  return useMutation(
    ({ id, payload }: { id?: number | null; payload: object }) =>
      id
        ? axiosPrivate.put(`/inspectionMaintenance/${id}`, payload, {})
        : axiosPrivate.post('/inspectionMaintenance', payload, {}),
    { onSuccess: () => invalidate() }
  )
}

/**
 * Elimina un registro del historial de una hoja de vida. `endpoint` es
 * `/calibration/:id` o `/inspectionMaintenance/:id`.
 */
export const useDeleteDataSheetRecord = () => {
  const axiosPrivate = useAxiosPrivate()
  const invalidate = useInvalidateDataSheets()
  return useMutation((endpoint: string) => axiosPrivate.delete(endpoint), {
    onSuccess: () => invalidate()
  })
}

/** Registra la salida (POST) o la entrada (PUT) de un equipo. */
export const useSaveEquipmentInOut = () => {
  const axiosPrivate = useAxiosPrivate()
  const invalidate = useInvalidateDataSheets()
  return useMutation(
    ({ method, data }: { method: 'post' | 'put'; data: object }) =>
      axiosPrivate({
        method,
        url: '/equipmentInOut',
        data
      }),
    { onSuccess: () => invalidate() }
  )
}
