import { useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from 'react-query'
import {
  MaintenanceTicket,
  MaintenanceNotification
} from '../types/maintenance'

import { logger } from 'src/utils/logger'
type MaintenanceWebSocketMessage =
  | {
      type: 'ticket_updated'
      data: MaintenanceTicket
      timestamp: string
    }
  | {
      type: 'notification'
      data: MaintenanceNotification
      timestamp: string
    }
  | {
      type: 'technician_status_changed'
      data: { technicianId?: number; status?: string }
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
  // Siempre apunta al manejador más reciente: así 'connect' no se recrea (ni
  // se reconecta el socket) cuando cambian los callbacks del padre
  const messageHandlerRef = useRef<
    ((message: MaintenanceWebSocketMessage) => void) | null
  >(null)

  const connect = useCallback(() => {
    if (!enabled) return

    const token = localStorage.getItem('token')
    if (!token) {
      logger.warn('No token found, skipping WebSocket connection')
      return
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5050'
    const wsWithToken = `${wsUrl}?token=${token}&channel=maintenance`

    try {
      wsRef.current = new WebSocket(wsWithToken)

      wsRef.current.onopen = () => {
        logger.log('Maintenance WebSocket connected')
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
          messageHandlerRef.current?.(message)
        } catch (error) {
          logger.error('Error parsing WebSocket message:', error)
        }
      }

      wsRef.current.onclose = (event) => {
        logger.log(
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

          logger.log(
            `Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`
          )

          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        }
      }

      wsRef.current.onerror = (error) => {
        logger.error('Maintenance WebSocket error:', error)
      }
    } catch (error) {
      logger.error('Error creating WebSocket connection:', error)
    }
  }, [enabled])

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
    (_data: { technicianId?: number; status?: string }) => {
      // Invalidate technicians query to get updated status
      queryClient.invalidateQueries({ queryKey: ['maintenance-technicians'] })
    },
    [queryClient]
  )

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
          logger.log('Unknown WebSocket message:', message)
      }
    },
    [handleTicketUpdate, handleNotification, handleTechnicianStatusChange]
  )
  messageHandlerRef.current = handleWebSocketMessage

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

  const sendMessage = useCallback((message: Record<string, unknown>) => {
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
