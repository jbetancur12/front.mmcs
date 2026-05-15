// useEvents.ts
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
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

const useEvents = (deviceId: string | number, realTime = true) => {
  const axiosPrivate = useAxiosPrivate()
  const basePath = api()

  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const hasFetchedData = useRef(false)

  useEffect(() => {
    if (hasFetchedData.current || events.length > 0) {
      setLoading(false)
      return
    }
    const abortController = new AbortController()
    let eventSource: EventSource | null = null
    const fetchEvents = async () => {
      try {
        const response = await axiosPrivate.get(
          `/devicesIot/events/${deviceId}`,
          {
            signal: abortController.signal
          }
        )
        setEvents(
          response.data.map((event: any) => ({
            ...event,
            timestamp: new Date(event.timestamp)
          }))
        )
        hasFetchedData.current = true
      } catch (err) {
        if (!axios.isCancel(err)) {
          setError(err as Error)
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    const setupRealtime = () => {
      if (!realTime) return

      eventSource = new EventSource(
        `${basePath}/devicesIot/events/sse/${deviceId}`,
        {
          withCredentials: true // Si usas autenticación
        }
      )

      eventSource.addEventListener('new-alarm', (e) => {
        const eventData = JSON.parse(e.data)
        console.log('🚀 ~ eventSource.addEventListener ~ eventData:', eventData)
        const parsedEvent: Event = {
          ...eventData,
          createdAt: new Date(eventData.createdAt),
          rawData:
            eventData.rawData?.map((d: any) => ({
              ...d,
              timestamp: new Date(d.timestamp)
            })) || []
        }

        setEvents((prev) => [parsedEvent, ...prev])
      })

      eventSource.onerror = (e) => {
        console.error('SSE Error:', e)
        eventSource?.close()
        setTimeout(setupRealtime, 5000)
      }
    }

    fetchEvents()
    setupRealtime()
    return () => {
      abortController.abort()
      eventSource?.close()
    }
  }, [deviceId, realTime])

  return { events, loading, error }
}

export default useEvents
