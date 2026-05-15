import { useState, useEffect, useRef, useCallback } from 'react'
import { Notification } from '../types/notifications'
import { useRealtimeNotifications } from './useNotifications'

export type LmsWebSocketMessageType =
  | 'NOTIFICATION_NEW'
  | 'NOTIFICATION_UPDATE'
  | 'SYSTEM_ALERT'
  | 'TRAINING_ALERT'
  | 'ASSIGNMENT_UPDATE'
  | 'COURSE_UPDATE'
  | 'QUIZ_COMPLETED'
  | 'CERTIFICATE_ISSUED'
  | 'JOB_STATUS_UPDATE'
  | 'DASHBOARD_METRICS_UPDATE'

export interface LmsWebSocketMessage {
  type: LmsWebSocketMessageType
  data: any
  timestamp: string
}

export interface LmsWebSocketOptions {
  autoConnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
  enableHeartbeat?: boolean
  heartbeatInterval?: number
}

export interface LmsWebSocketState {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  lastMessage: LmsWebSocketMessage | null
  connectionAttempts: number
}

const useLmsWebSocket = (options: LmsWebSocketOptions = {}) => {
  const {
    autoConnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    enableHeartbeat = true,
    heartbeatInterval = 30000
  } = options

  const [state, setState] = useState<LmsWebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastMessage: null,
    connectionAttempts: 0
  })

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>()
  const { addRealtimeNotification } = useRealtimeNotifications()

  // Get WebSocket URL for LMS
  const getWebSocketUrl = useCallback(() => {
    const token = localStorage.getItem('accessToken')
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const baseUrl = import.meta.env.VITE_WS_URL || `${protocol}//${window.location.host}`

    return `${baseUrl}/lms/notifications?token=${token}`
  }, [])

  // Send heartbeat to keep connection alive
  const sendHeartbeat = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'HEARTBEAT',
        timestamp: new Date().toISOString()
      }))
    }
  }, [])

  // Handle incoming messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: LmsWebSocketMessage = JSON.parse(event.data)

      setState(prev => ({
        ...prev,
        lastMessage: message,
        error: null
      }))

      // Handle different message types
      switch (message.type) {
        case 'NOTIFICATION_NEW':
          if (message.data && typeof message.data === 'object') {
            const notification: Notification = {
              id: message.data.id || Date.now().toString(),
              title: message.data.title || 'Nueva notificación',
              message: message.data.message || '',
              severity: message.data.severity || 'info',
              timestamp: new Date(message.data.timestamp || message.timestamp),
              read: false,
              actionUrl: message.data.actionUrl,
              actionLabel: message.data.actionLabel,
              metadata: message.data.metadata
            }
            addRealtimeNotification(notification)
          }
          break

        case 'SYSTEM_ALERT':
          // Handle system alerts
          console.log('System Alert:', message.data)
          break

        case 'TRAINING_ALERT':
          // Handle training alerts
          console.log('Training Alert:', message.data)
          break

        case 'ASSIGNMENT_UPDATE':
          // Handle assignment updates
          console.log('Assignment Update:', message.data)
          break

        case 'COURSE_UPDATE':
          // Handle course updates
          console.log('Course Update:', message.data)
          break

        case 'QUIZ_COMPLETED':
          // Handle quiz completion
          console.log('Quiz Completed:', message.data)
          break

        case 'CERTIFICATE_ISSUED':
          // Handle certificate issuance
          console.log('Certificate Issued:', message.data)
          break

        case 'JOB_STATUS_UPDATE':
          // Handle job status updates
          console.log('Job Status Update:', message.data)
          break

        case 'DASHBOARD_METRICS_UPDATE':
          // Handle dashboard metrics updates
          console.log('Dashboard Metrics Update:', message.data)
          break

        default:
          console.log('Unknown LMS WebSocket message type:', message.type)
      }
    } catch (error) {
      console.error('Error parsing LMS WebSocket message:', error)
      setState(prev => ({
        ...prev,
        error: 'Error parsing message'
      }))
    }
  }, [addRealtimeNotification])

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return // Already connected
    }

    setState(prev => ({
      ...prev,
      isConnecting: true,
      error: null
    }))

    try {
      const wsUrl = getWebSocketUrl()
      const socket = new WebSocket(wsUrl)
      wsRef.current = socket

      socket.onopen = () => {
        console.log('LMS WebSocket connected')
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
          connectionAttempts: 0
        }))

        // Start heartbeat if enabled
        if (enableHeartbeat) {
          heartbeatIntervalRef.current = setInterval(sendHeartbeat, heartbeatInterval)
        }

        // Clear any reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
      }

      socket.onmessage = handleMessage

      socket.onclose = (event) => {
        console.log('LMS WebSocket closed:', event.code, event.reason)
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          error: event.reason || 'Connection closed'
        }))

        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
        }

        // Attempt to reconnect if not a clean close and within retry limits
        if (event.code !== 1000 && state.connectionAttempts < maxReconnectAttempts) {
          setState(prev => ({
            ...prev,
            connectionAttempts: prev.connectionAttempts + 1
          }))

          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect LMS WebSocket (${state.connectionAttempts + 1}/${maxReconnectAttempts})`)
            connect()
          }, reconnectInterval)
        }
      }

      socket.onerror = (error) => {
        console.error('LMS WebSocket error:', error)
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          error: 'Connection error'
        }))
      }

    } catch (error) {
      console.error('Failed to create LMS WebSocket connection:', error)
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: 'Failed to connect'
      }))
    }
  }, [getWebSocketUrl, handleMessage, enableHeartbeat, heartbeatInterval, sendHeartbeat, maxReconnectAttempts, reconnectInterval, state.connectionAttempts])

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect')
      wsRef.current = null
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      connectionAttempts: 0
    }))
  }, [])

  // Send message through WebSocket
  const sendMessage = useCallback((message: Omit<LmsWebSocketMessage, 'timestamp'>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const messageWithTimestamp = {
        ...message,
        timestamp: new Date().toISOString()
      }
      wsRef.current.send(JSON.stringify(messageWithTimestamp))
      return true
    }
    return false
  }, [])

  // Subscribe to specific message types
  const subscribe = useCallback((messageType: LmsWebSocketMessageType, callback: (data: any) => void) => {
    const handleSubscribedMessage = (event: MessageEvent) => {
      try {
        const message: LmsWebSocketMessage = JSON.parse(event.data)
        if (message.type === messageType) {
          callback(message.data)
        }
      } catch (error) {
        console.error('Error handling subscribed message:', error)
      }
    }

    if (wsRef.current) {
      wsRef.current.addEventListener('message', handleSubscribedMessage)

      // Return unsubscribe function
      return () => {
        if (wsRef.current) {
          wsRef.current.removeEventListener('message', handleSubscribedMessage)
        }
      }
    }

    return () => { } // No-op unsubscribe
  }, [])

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    // Cleanup on unmount
    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  // Reconnect logic removed to prevent infinite loop

  return {
    // Connection state
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    error: state.error,
    connectionAttempts: state.connectionAttempts,

    // Last message
    lastMessage: state.lastMessage,

    // Actions
    connect,
    disconnect,
    sendMessage,
    subscribe,

    // Manual refresh trigger
    refresh: connect
  }
}

export default useLmsWebSocket