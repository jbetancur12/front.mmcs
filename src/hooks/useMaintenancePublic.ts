import { useQuery, useQueryClient } from 'react-query'
import { axiosPublic } from '../utils/api'
import { MaintenanceTicket } from '../types/maintenance'
import { useEffect, useRef, useCallback } from 'react'

// Interface for TV display data - matches actual API response
interface TVDisplayData {
  lastUpdated: string
  updateFrequency: number
  metrics: {
    totalActive: number
    pending: number
    inProgress: number
    completedToday: number
    urgent: number
    overdue: number
    techniciansAvailable: string
    averageWorkload: number
    avgResolutionTimeHours: number
    completedLast30Days: number
    isInvoiced: number
  }
  tickets: {
    urgent: MaintenanceTicket[]
    high: MaintenanceTicket[]
    medium: MaintenanceTicket[]
    low: MaintenanceTicket[]
  }
  technicians: Array<{
    id: string
    name: string
    isAvailable: boolean
    workload: number
    maxWorkload: number
  }>
  systemStatus: {
    operationalStatus: string
    lastSystemUpdate: string
    queueHealth: string
    averageResponseTime: string
    overdueStatus: string
    technicianUtilization: number
  }
}

// Public API functions for TV display (no auth required)
const maintenancePublicAPI = {
  // Get TV display data - single endpoint with all data
  getTVDisplayData: async (): Promise<TVDisplayData> => {
    const response = await axiosPublic.get<TVDisplayData>(
      `/public/maintenance/tv-display`
    )
    return response.data
  }
}

// WebSocket hook for TV display with real-time updates
export const useTVDisplayDataWithWebSocket = () => {
  const queryClient = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  // Initial data fetch
  const queryResult = useQuery({
    queryKey: ['tv-display-data'],
    queryFn: maintenancePublicAPI.getTVDisplayData,
    staleTime: Infinity, // Don't auto-refetch, rely on WebSocket updates
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: 1000
  })

  const connectWebSocket = useCallback(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5050'
    const wsWithChannel = `${wsUrl}?channel=tv-display&public=true`

    try {
      wsRef.current = new WebSocket(wsWithChannel)

      wsRef.current.onopen = () => {
        console.log('TV Display WebSocket connected')
        reconnectAttempts.current = 0

        // Send subscription message for TV display updates
        wsRef.current?.send(
          JSON.stringify({
            type: 'subscribe',
            channel: 'tv-display',
            timestamp: new Date().toISOString()
          })
        )
      }

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          handleWebSocketMessage(message)
        } catch (error) {
          console.error('Error parsing TV Display WebSocket message:', error)
        }
      }

      wsRef.current.onclose = (event) => {
        console.log(
          'TV Display WebSocket connection closed:',
          event.code,
          event.reason
        )

        // Only attempt to reconnect if it wasn't a manual close
        if (
          event.code !== 1000 &&
          reconnectAttempts.current < maxReconnectAttempts
        ) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttempts.current),
            30000
          )
          reconnectAttempts.current++

          console.log(
            `Reconnecting TV Display WebSocket in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`
          )

          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket()
          }, delay)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('TV Display WebSocket error:', error)
      }
    } catch (error) {
      console.error('Error creating TV Display WebSocket connection:', error)
    }
  }, [])

  const handleWebSocketMessage = useCallback(
    (message: any) => {
      switch (message.type) {
        case 'tv_display_update':
          // Update the cache with new data
          queryClient.setQueryData(['tv-display-data'], message.data)
          break
        case 'ticket_updated':
        case 'ticket_created':
        case 'ticket_assigned':
        case 'ticket_status_changed':
          // Invalidate and refetch when tickets change
          queryClient.invalidateQueries({ queryKey: ['tv-display-data'] })
          break
        default:
          console.log(
            'Unknown TV Display WebSocket message type:',
            message.type
          )
      }
    },
    [queryClient]
  )

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close(1000, 'Manual disconnect')
    }

    wsRef.current = null
    reconnectAttempts.current = 0
  }, [])

  // Connect WebSocket on mount
  useEffect(() => {
    connectWebSocket()
    return () => {
      disconnect()
    }
  }, [connectWebSocket, disconnect])

  const isWebSocketConnected = wsRef.current?.readyState === WebSocket.OPEN

  return {
    ...queryResult,
    isWebSocketConnected
  }
}

// Legacy hook for backward compatibility (with polling)
export const useTVDisplayData = () => {
  return useQuery({
    queryKey: ['tv-display-data'],
    queryFn: maintenancePublicAPI.getTVDisplayData,
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: 1000
  })
}
