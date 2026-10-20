// useEvents.ts
import { useEffect } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from './use-axios-private'
import { api } from 'src/config'

export interface Event {
  id: number
  createdAt: Date
  triggeredBy: 'TEMPERATURE' | 'HUMIDITY' | 'BOTH'
  temperature: number
  humidity: number
  thresholdType: 'ABOVE' | 'BELOW' | 'RANGE'
  thresholdValue: number
  rawData: Array<{
    timestamp: Date
    temperature: number
    humidity: number
  }>
  deviceIotId: number
}

export const iotEventsKeys = {
  all: ['devicesIot', 'events'] as const,
  byDevice: (deviceId: string | number) =>
    [...iotEventsKeys.all, String(deviceId)] as const
}

const useEvents = (deviceId: string | number, realTime = true) => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  const basePath = api()
  const queryKey = iotEventsKeys.byDevice(deviceId)

  const {
    data: events = [],
    isLoading: loading,
    error
  } = useQuery<Event[], Error>(
    queryKey,
    async ({ signal }) => {
      const response = await axiosPrivate.get(
        `/devicesIot/events/${deviceId}`,
        {
          signal
        }
      )
      return (response.data as Array<Record<string, unknown>>).map((event) => ({
        ...event,
        timestamp: new Date(event.timestamp as string)
      })) as unknown as Event[]
    },
    { keepPreviousData: false }
  )

  // Tiempo real (SSE): las alarmas nuevas se anteponen a la caché de la query
  useEffect(() => {
    if (!realTime) return
    let eventSource: EventSource | null = null
    let retryTimeout: ReturnType<typeof setTimeout> | null = null
    let closed = false
    const key = iotEventsKeys.byDevice(deviceId)

    const setupRealtime = () => {
      if (closed) return

      eventSource = new EventSource(
        `${basePath}/devicesIot/events/sse/${deviceId}`,
        {
          withCredentials: true // Si usas autenticación
        }
      )

      eventSource.addEventListener('new-alarm', (e) => {
        const eventData = JSON.parse((e as MessageEvent).data)
        console.log('🚀 ~ eventSource.addEventListener ~ eventData:', eventData)
        const parsedEvent: Event = {
          ...eventData,
          createdAt: new Date(eventData.createdAt),
          rawData:
            eventData.rawData?.map((d: { timestamp: string }) => ({
              ...d,
              timestamp: new Date(d.timestamp)
            })) || []
        }

        queryClient.setQueryData<Event[]>(key, (prev) => [
          parsedEvent,
          ...(prev || [])
        ])
      })

      eventSource.onerror = (e) => {
        console.error('SSE Error:', e)
        eventSource?.close()
        retryTimeout = setTimeout(setupRealtime, 5000)
      }
    }

    setupRealtime()
    return () => {
      closed = true
      if (retryTimeout) clearTimeout(retryTimeout)
      eventSource?.close()
    }
  }, [deviceId, realTime, basePath, queryClient])

  return { events, loading, error: error ?? null }
}

export default useEvents
