import { useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from 'react-query'
import {
  MaintenanceTicket,
  MaintenanceNotification
} from '../types/maintenance'

interface MaintenanceWebSocketMessage {
  type: 'ticket_updated' | 'notification' | 'technician_status_changed'
  data: any
  timestamp: string
}

interface UseMaintenanceWebSocketProps {
  onNotification?: (notification: MaintenanceNotification) => void
  onTicketUpdate?: (ticket: MaintenanceTicket) => void
  enabled?: boolean
}

/**
 * Custom hook for handling real-time maintenance updates via WebSocket
 *
 * @param onNotification - Callback for new notifications
 * @param onTicketUpdate - Callback for ticket updates
 * @param enabled - Whether the WebSocket connection should be active
 */
export const useMaintenanceWebSocket = ({
  onNotification,
  onTicketUpdate,
  enabled = true
}: UseMaintenanceWebSocketProps = {}) => {
  const queryClient = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    if (!enabled) return

    const token = localStorage.getItem('token')
    if (!token) {
      console.warn('No token found, skipping WebSocket connection')
      return
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5050'
    const wsWithToken = `${wsUrl}?token=${token}&channel=maintenance`

    try {
      wsRef.current = new WebSocket(wsWithToken)

      wsRef.current.onopen = () => {
        console.log('Maintenance WebSocket connected')
        reconnectAttempts.current = 0

        // Send ping to confirm connection
        wsRef.current?.send(
          JSON.stringify({
            type: 'ping',
            timestamp: new Date().toISOString()
          })
        )
      }

      wsRef.current.onmessage = (event) => {
        try {
          const message: MaintenanceWebSocketMessage = JSON.parse(event.data)
          handleWebSocketMessage(message)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      wsRef.current.onclose = (event) => {
        console.log(
          'Maintenance WebSocket connection closed:',
          event.code,
          event.reason
        )

        // Only attempt to reconnect if it wasn't a manual close
        if (
          enabled &&
          event.code !== 1000 &&
          reconnectAttempts.current < maxReconnectAttempts
        ) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttempts.current),
            30000
          )
          reconnectAttempts.current++

          console.log(
            `Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`
          )

          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('Maintenance WebSocket error:', error)
      }
    } catch (error) {
      console.error('Error creating WebSocket connection:', error)
    }
  }, [enabled])

  const handleWebSocketMessage = useCallback(
    (message: MaintenanceWebSocketMessage) => {
      switch (message.type) {
        case 'ticket_updated':
          handleTicketUpdate(message.data)
          break

        case 'notification':
          handleNotification(message.data)
          break

        case 'technician_status_changed':
          handleTechnicianStatusChange(message.data)
          break

        default:
          console.log('Unknown WebSocket message type:', message.type)
      }
    },
    [onNotification, onTicketUpdate, queryClient]
  )

  const handleTicketUpdate = useCallback(
    (ticket: MaintenanceTicket) => {
      // Update React Query cache
      queryClient.setQueryData(['maintenance-ticket', ticket.id], ticket)

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['maintenance-tickets'] })
      queryClient.invalidateQueries({ queryKey: ['maintenance-stats'] })

      // Call custom callback
      onTicketUpdate?.(ticket)
    },
    [queryClient, onTicketUpdate]
  )

  const handleNotification = useCallback(
    (notification: MaintenanceNotification) => {
      // Show notification to user
      onNotification?.(notification)

      // Update cache if needed
      queryClient.invalidateQueries({ queryKey: ['maintenance-notifications'] })
    },
    [queryClient, onNotification]
  )

  const handleTechnicianStatusChange = useCallback(
    (_data: any) => {
      // Invalidate technicians query to get updated status
      queryClient.invalidateQueries({ queryKey: ['maintenance-technicians'] })
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

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          ...message,
          timestamp: new Date().toISOString()
        })
      )
    }
  }, [])

  // Connection management
  useEffect(() => {
    if (enabled) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  // Return connection status and methods
  const isConnected = wsRef.current?.readyState === WebSocket.OPEN
  const isConnecting = wsRef.current?.readyState === WebSocket.CONNECTING

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    sendMessage
  }
}

export default useMaintenanceWebSocket
