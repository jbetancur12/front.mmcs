import { useMutation, useQuery, useQueryClient } from 'react-query'
import { axiosPrivate } from '@utils/api'
import { getApiErrorMessage } from '../utils/apiError'
import { notify } from '../utils/notify'
import { CALIBRATION_SERVICE_QUERY_KEYS } from './useCalibrationServices'
import {
  CalendarVisit,
  DeliveryResult,
  PendingDelivery,
  CalibrationVisitsResponse,
  ServiceProgressResponse,
  UploadLagResponse,
  VisitBoardResponse,
  VisitIndicatorsResponse
} from '../types/calibrationVisit'

const BASE = '/calibration-services'
// Bajo la clave general del módulo: cualquier cambio de un servicio también refresca sus visitas.
const KEY = [CALIBRATION_SERVICE_QUERY_KEYS.all, 'visits'] as const

const get = async <T>(url: string, params?: Record<string, string>) =>
  (await axiosPrivate.get<T>(url, { params })).data

export const useServiceVisits = (serviceId: number, enabled = true) =>
  useQuery(
    [...KEY, 'service', serviceId],
    () => get<CalibrationVisitsResponse>(`${BASE}/${serviceId}/visits`),
    { enabled }
  )

export const useServiceProgress = (serviceId: number, enabled = true) =>
  useQuery(
    [...KEY, 'progress', serviceId],
    () => get<ServiceProgressResponse>(`${BASE}/${serviceId}/progress`),
    { enabled }
  )

export const useVisitCalendar = (from: string, to: string) =>
  useQuery([...KEY, 'calendar', from, to], () =>
    get<{ visits: CalendarVisit[] }>(`${BASE}/visits/calendar`, { from, to })
  )

export const useVisitBoard = () =>
  useQuery([...KEY, 'board'], () =>
    get<VisitBoardResponse>(`${BASE}/visits/board`)
  )

export const useVisitIndicators = (enabled: boolean) =>
  useQuery(
    [...KEY, 'indicators'],
    () => get<VisitIndicatorsResponse>(`${BASE}/visits/indicators`),
    { enabled }
  )

export const useUploadLag = (enabled: boolean) =>
  useQuery(
    [...KEY, 'upload-lag'],
    () => get<UploadLagResponse>(`${BASE}/visits/upload-lag`),
    { enabled }
  )

export interface VisitMutation {
  method: 'post' | 'put'
  /** Ruta después de `/calibration-services/:id/`. */
  path: string
  body: unknown
  success: string
}

export const useVisitMutation = (serviceId: number) => {
  const queryClient = useQueryClient()
  return useMutation(
    async ({ method, path, body }: VisitMutation) =>
      (await axiosPrivate[method](`${BASE}/${serviceId}/${path}`, body)).data,
    {
      onSuccess: (_data, variables) => {
        notify.success(variables.success)
        queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.all])
        queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.detail])
      },
      onError: (error) => {
        notify.error(getApiErrorMessage(error, 'No se pudo guardar el cambio.'))
      }
    }
  )
}

export const usePendingDeliveries = (enabled: boolean) =>
  useQuery(
    [...KEY, 'pending-deliveries'],
    () =>
      get<{ certificates: PendingDelivery[] }>(
        '/release-certificates/deliveries/pending'
      ),
    { enabled }
  )

export const useRegisterDeliveries = () => {
  const queryClient = useQueryClient()
  return useMutation(
    async (data: FormData) =>
      (
        await axiosPrivate.post<{ results: DeliveryResult[] }>(
          '/release-certificates/deliveries',
          data
        )
      ).data,
    {
      onSuccess: ({ results }) => {
        const done = results.filter((r) => r.ok).length
        const failed = results.filter((r) => !r.ok)
        if (done)
          notify.success(
            done === 1 ? 'Entrega registrada' : `${done} entregas registradas`
          )
        if (failed.length)
          notify.error(
            `${failed.length} sin registrar. ${failed[0].documentNumber || ''}: ${failed[0].error}`
          )
        queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.all])
        queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.detail])
      },
      onError: (error) => {
        notify.error(
          getApiErrorMessage(error, 'No se pudo registrar la entrega.')
        )
      }
    }
  )
}
