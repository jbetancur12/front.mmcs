import { useState, useEffect, useCallback } from 'react'
import { Notification } from '../types/notifications'
import useLmsWebSocket from './useLmsWebSocket'
import useNotificationPolling from './useNotificationPolling'
import useNotifications from './useNotifications'

interface HybridNotificationOptions {
  enableWebSocket?: boolean
  enablePolling?: boolean
  pollingInterval?: number
  fallbackToPolling?: boolean
  onNewNotification?: (notification: Notification) => void
}

export const useHybridNotifications = (
  options: HybridNotificationOptions = {}
) => {
  const {
    enableWebSocket = true,
    enablePolling = false, // Disabled by default to prevent infinite requests
    pollingInterval = 300000, // 5 minutes for fallback
    fallbackToPolling = true,
    onNewNotification
  } = options

  const [connectionMethod, setConnectionMethod] = useState<
    'websocket' | 'polling' | 'none'
  >('none')
  const [lastNotificationTime, setLastNotificationTime] = useState<Date | null>(
    null
  )

  // WebSocket connection
  const {
    isConnected: wsConnected,
    isConnecting: wsConnecting,
    error: wsError,
    lastMessage: wsLastMessage,
    connectionAttempts: wsAttempts
  } = useLmsWebSocket({
    autoConnect: enableWebSocket
  })

  // Polling fallback
  const {
    isPolling,
    error: pollingError,
    lastPollTime,
    pollCount
  } = useNotificationPolling({
    enabled: enablePolling && (!enableWebSocket || !wsConnected),
    interval: pollingInterval,
    onNewNotification: (notification) => {
      setLastNotificationTime(new Date())
      if (onNewNotification) {
        onNewNotification(notification)
      }
    },
    onError: (error) => {
      console.error('Polling error:', error)
    }
  })

  // Main notifications hook
  const notificationsHook = useNotifications({
    autoRefresh: false, // We handle refresh manually
    refreshInterval: 0
  })

  // Determine active connection method
  useEffect(() => {
    if (enableWebSocket && wsConnected) {
      setConnectionMethod('websocket')
    } else if (enablePolling && isPolling) {
      setConnectionMethod('polling')
    } else {
      setConnectionMethod('none')
    }
  }, [enableWebSocket, wsConnected, enablePolling, isPolling])

  // Handle WebSocket messages
  useEffect(() => {
    if (wsLastMessage && wsLastMessage.type === 'NOTIFICATION_NEW') {
      setLastNotificationTime(new Date())
      if (onNewNotification && wsLastMessage.data) {
        const notification: Notification = {
          id: wsLastMessage.data.id || Date.now().toString(),
          title: wsLastMessage.data.title || 'Nueva notificación',
          message: wsLastMessage.data.message || '',
          severity: wsLastMessage.data.severity || 'info',
          timestamp: new Date(
            wsLastMessage.data.timestamp || wsLastMessage.timestamp
          ),
          read: false,
          actionUrl: wsLastMessage.data.actionUrl,
          actionLabel: wsLastMessage.data.actionLabel,
          metadata: wsLastMessage.data.metadata
        }
        onNewNotification(notification)
      }
      // Refresh notifications data
      notificationsHook.refresh()
    }
  }, [wsLastMessage, onNewNotification, notificationsHook])

  // Connection status
  const getConnectionStatus = useCallback(() => {
    if (connectionMethod === 'websocket') {
      return {
        method: 'websocket' as const,
        connected: wsConnected,
        connecting: wsConnecting,
        error: wsError,
        lastActivity: lastNotificationTime,
        details: `WebSocket activo (${wsAttempts} intentos)`
      }
    } else if (connectionMethod === 'polling') {
      return {
        method: 'polling' as const,
        connected: isPolling,
        connecting: false,
        error: pollingError?.message || null,
        lastActivity: lastPollTime,
        details: `Polling activo (${pollCount} consultas)`
      }
    } else {
      return {
        method: 'none' as const,
        connected: false,
        connecting: false,
        error: 'Sin conexión en tiempo real',
        lastActivity: null,
        details: 'Actualizaciones manuales únicamente'
      }
    }
  }, [
    connectionMethod,
    wsConnected,
    wsConnecting,
    wsError,
    wsAttempts,
    isPolling,
    pollingError,
    lastPollTime,
    pollCount,
    lastNotificationTime
  ])

  // Manual refresh
  const refresh = useCallback(() => {
    notificationsHook.refresh()
  }, [notificationsHook])

  // Get real-time capability status
  const isRealTimeEnabled =
    connectionMethod === 'websocket' || connectionMethod === 'polling'
  const isOptimalConnection = connectionMethod === 'websocket'

  return {
    // Notification data (from main hook)
    ...notificationsHook,

    // Connection status
    connectionStatus: getConnectionStatus(),
    connectionMethod,
    isRealTimeEnabled,
    isOptimalConnection,

    // Manual actions
    refresh,

    // Last activity
    lastNotificationTime,

    // Detailed status for debugging
    debug: {
      websocket: {
        connected: wsConnected,
        connecting: wsConnecting,
        error: wsError,
        attempts: wsAttempts,
        lastMessage: wsLastMessage
      },
      polling: {
        active: isPolling,
        error: pollingError,
        lastPoll: lastPollTime,
        count: pollCount
      }
    }
  }
}

export default useHybridNotifications
