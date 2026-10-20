import { useMutation, useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import {
  InspectionHistory,
  MaintenanceRecord
} from 'src/Components/Fleet/types'

export const FLEET_QUERY_KEYS = {
  inspections: (vehicleId: number | string | undefined) =>
    ['fleet', 'inspections', vehicleId] as const,
  maintenanceRecords: (vehicleId: number | string | undefined) =>
    ['fleet', 'maintenanceRecords', vehicleId] as const,
  calibrationTimelinePdf: (customerId: string | undefined) =>
    ['fleet', 'calibrationTimelinePdf', customerId] as const
}

/** Inspecciones preoperacionales de un vehículo */
export const useVehicleInspections = (vehicleId?: number | string) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(
    FLEET_QUERY_KEYS.inspections(vehicleId),
    async (): Promise<InspectionHistory[]> => {
      const { data } = await axiosPrivate.get(
        `/vehicles/${Number(vehicleId)}/inspections`,
        {}
      )
      return data
    },
    {
      enabled: !!vehicleId,
      // Las inspecciones se registran desde otros flujos: refrescar al montar
      staleTime: 0,
      keepPreviousData: false,
      onError: (error) => {
        console.error('Error fetching inspections:', error)
      }
    }
  )
}

/** Registros de mantenimiento de un vehículo */
export const useVehicleMaintenanceRecords = (vehicleId?: number | string) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(
    FLEET_QUERY_KEYS.maintenanceRecords(vehicleId),
    async (): Promise<MaintenanceRecord[]> => {
      const response = await axiosPrivate.get(
        `/maintenanceRecord?vehicleId=${vehicleId}`,
        {}
      )
      return response.status === 200 ? response.data : []
    },
    {
      enabled: vehicleId !== undefined && vehicleId !== null,
      // Otros componentes de flota agregan registros sin pasar por esta caché
      staleTime: 0,
      keepPreviousData: false,
      onError: (error) => {
        console.error('Error fetching maintenance records:', error)
      }
    }
  )
}

/** Crea un registro de mantenimiento (con su recordatorio) */
export const useCreateMaintenanceRecord = (vehicleId?: number | string) => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation(
    async (newRecord: unknown): Promise<MaintenanceRecord> => {
      const { data } = await axiosPrivate.post(
        `/maintenanceRecord`,
        newRecord,
        {}
      )
      return data
    },
    {
      // Sin reintentos: evita duplicar el registro si el POST falla
      retry: false,
      onSuccess: () => {
        queryClient.invalidateQueries(
          FLEET_QUERY_KEYS.maintenanceRecords(vehicleId)
        )
      }
    }
  )
}

/** PDF de la línea de tiempo de calibraciones de un cliente (data URI base64) */
export const useCalibrationTimelinePdf = (customerId?: string) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(
    FLEET_QUERY_KEYS.calibrationTimelinePdf(customerId),
    async (): Promise<string> => {
      const response = await axiosPrivate.get(
        `/files/customer/${customerId}/generate-pdf`,
        {
          responseType: 'arraybuffer' // Especifica que esperamos un archivo binario
        }
      )
      // Convierte el archivo binario a una cadena base64
      const base64PDF = Buffer.from(response.data, 'binary').toString('base64')
      return `data:application/pdf;base64,${base64PDF}`
    },
    {
      // El PDF se genera en cada visita: no se reutiliza de caché
      staleTime: 0,
      cacheTime: 0,
      keepPreviousData: false,
      refetchOnWindowFocus: false,
      retry: false,
      onError: (error) => {
        console.error('Error al obtener el PDF:', error)
      }
    }
  )
}
