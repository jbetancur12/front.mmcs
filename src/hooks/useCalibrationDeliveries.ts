import { useMutation, useQuery, useQueryClient } from 'react-query'
import { axiosPrivate } from '@utils/api'

export interface CalibrationDeliveryCard {
  serviceId: number
  serviceCode: string
  customerName: string
  siteName: string | null
  address: string | null
  city: string | null
  contactName: string | null
  contactPhone: string | null
  items: Array<{ name: string; serial: string | null }>
  status: 'ready' | 'in_transit' | 'delivered' | null
  readyAt: string | null
  readyNotes: string | null
  lastFailureReason: string | null
  takenByName: string | null
  takenAt: string | null
  isMine: boolean
  deliveredAt: string | null
  receivedByName: string | null
}

export interface CalibrationDeliveriesResponse {
  available: CalibrationDeliveryCard[]
  inTransit: CalibrationDeliveryCard[]
  delivered: CalibrationDeliveryCard[]
}

const DELIVERIES_KEY = ['calibration-deliveries']

/** Entregas listas, en camino y las firmadas por quien consulta en los últimos 7 días; se refresca cada minuto. */
export const useCalibrationDeliveries = () =>
  useQuery({
    queryKey: DELIVERIES_KEY,
    queryFn: async () => {
      const { data } = await axiosPrivate.get<CalibrationDeliveriesResponse>(
        '/calibration-services/deliveries'
      )
      return data
    },
    refetchInterval: 60 * 1000,
    staleTime: 15 * 1000,
    retry: 1
  })

export interface CompleteDeliveryPayload {
  serviceId: number
  signatureData: string
  receivedByName: string
  receivedByRole?: string
  notes?: string
}

export const useCalibrationDeliveryMutations = () => {
  const queryClient = useQueryClient()
  const refresh = () => {
    void queryClient.invalidateQueries(DELIVERIES_KEY)
    void queryClient.invalidateQueries(['calibration-services'])
  }
  const post = (serviceId: number, action: string, body?: unknown) =>
    axiosPrivate.post(
      `/calibration-services/${serviceId}/delivery/${action}`,
      body
    )

  const take = useMutation((serviceId: number) => post(serviceId, 'take'), {
    onSuccess: refresh,
    onError: refresh
  })
  const release = useMutation(
    (serviceId: number) => post(serviceId, 'release'),
    {
      onSuccess: refresh
    }
  )
  const fail = useMutation(
    ({ serviceId, reason }: { serviceId: number; reason: string }) =>
      post(serviceId, 'fail', { reason }),
    { onSuccess: refresh }
  )
  const complete = useMutation(
    ({ serviceId, ...body }: CompleteDeliveryPayload) =>
      post(serviceId, 'complete', body),
    { onSuccess: refresh }
  )
  const setReady = useMutation(
    ({
      serviceId,
      ready,
      notes
    }: {
      serviceId: number
      ready: boolean
      notes?: string
    }) => post(serviceId, 'ready', { ready, notes }),
    { onSuccess: refresh }
  )

  return { take, release, fail, complete, setReady }
}
