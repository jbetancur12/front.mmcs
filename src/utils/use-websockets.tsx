import { useState, useEffect, useRef, useCallback } from 'react'
import { createContext, useContext, ReactNode } from 'react'
import { DeviceReadingPayload } from 'src/Components/Iot/DeviceIotMap/types'

type MessageType =
  | 'REAL_TIME_DATA'
  | 'ALARM_UPDATE'
  | 'ALARM_STATUS_UPDATE'
  | 'DEVICE_STATUS'
  | 'LABORATORY_DATA'
  | 'power'
  | 'CALIBRATION_SENSOR_UPDATE'
  | 'DEVICE_CONFIG_CONFIRMED'
  | 'DEVICE_CONFIG_TIMEOUT'

export interface WebSocketMessage {
  type: MessageType
  data: any
}

type WebSocketListener = (message: WebSocketMessage) => void

interface WebSocketContextValue {
  lastMessage: WebSocketMessage | null
  // Recibe cada mensaje; lastMessage solo conserva el último de cada render
  // y pierde los que llegan seguidos (p. ej. varios sensores a la vez).
  subscribe: (listener: WebSocketListener) => () => void
  lastDeviceReading: DeviceReadingPayload | null
  deviceReadings: Record<string, DeviceReadingPayload>
  status: 'connecting' | 'connected' | 'error' | 'closed'
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null)

interface WebSocketProviderProps {
  children: ReactNode
}

// null si no hay sesión: sin token el servidor solo responde 401/403 y el reintento
// llenaría el log (y el limitador) con `?token=null`.
const wss = (): string | null => {
  const token = localStorage.getItem('accessToken')
  if (!token) return null
  const currentHost = window.location.hostname
  const isPrivateNetworkHost =
    /^10\./.test(currentHost) ||
    /^192\.168\./.test(currentHost) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(currentHost)
  const isLocalDevelopmentHost =
    currentHost === 'localhost' ||
    currentHost === '127.0.0.1' ||
    isPrivateNetworkHost

  if (import.meta.env.VITE_ENV === 'development') {
    if (isLocalDevelopmentHost) {
      try {
        const url = new URL(import.meta.env.VITE_WS_URL)
        url.hostname = currentHost
        url.searchParams.set('token', token || '')
        return url.toString()
      } catch {
        return import.meta.env.VITE_WS_URL + '?token=' + token
      }
    }

    return import.meta.env.VITE_WS_URL_CLOUDFARE + '?token=' + token
  } else {
    return import.meta.env.VITE_WS_URL + '?token=' + token
  }
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const [deviceReadings, setDeviceReadings] = useState<
    Record<string, DeviceReadingPayload>
  >({})

  const [lastDeviceReading, setLastDeviceReading] =
    useState<DeviceReadingPayload | null>(null)
  const [status, setStatus] = useState<
    'connecting' | 'connected' | 'error' | 'closed'
  >('connecting')

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const listenersRef = useRef(new Set<WebSocketListener>())
  const unmountedRef = useRef(false)
  const reconnectDelayRef = useRef(2000)

  const subscribe = useCallback((listener: WebSocketListener) => {
    listenersRef.current.add(listener)
    return () => {
      listenersRef.current.delete(listener)
    }
  }, [])

  // Create WebSocket connection
  const connectWebSocket = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      console.log('Connecting to WebSocket...', protocol)

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected')
        return
      }

      const wsUrl = wss()
      if (!wsUrl) {
        // Sin sesión no se conecta: se vuelve a mirar en unos segundos (sin tráfico)
        setStatus('closed')
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000)
        return
      }

      const socket = new WebSocket(wsUrl)
      wsRef.current = socket

      socket.onopen = () => {
        console.log('WebSocket connected')
        setStatus('connected')
        reconnectDelayRef.current = 2000
        // Clear any reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
      }

      socket.onclose = () => {
        console.log('WebSocket closed')
        setStatus('closed')
        // Reintenta también tras un error de red, con espera creciente (2 s → 30 s)
        if (!unmountedRef.current) {
          const delay = reconnectDelayRef.current
          reconnectDelayRef.current = Math.min(delay * 2, 30000)
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect WebSocket...')
            connectWebSocket()
          }, delay)
        }
      }

      socket.onerror = (error) => {
        console.error('WebSocket error:', error)
        setStatus('error')
        socket.close()
      }

      socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          setLastMessage(message)
          listenersRef.current.forEach((listener) => {
            try {
              listener(message)
            } catch (listenerError) {
              console.error('Error in WebSocket listener:', listenerError)
            }
          })

          switch (message.type) {
            case 'LABORATORY_DATA':
              break
            case 'REAL_TIME_DATA': {
              setLastDeviceReading({ ...message.data, ts: new Date() }) // Assuming the payload has a timestamp
              const reading: DeviceReadingPayload = {
                ...message.data,
                ts: Date.now() // o new Date().getTime()
              }

              setDeviceReadings((prev) => ({
                ...prev,
                [reading.dev]: reading
              }))

              break
            }
            case 'CALIBRATION_SENSOR_UPDATE': // <--- NUEVO CASE
              // La lógica de actualización del caché de React Query se hará en un hook consumidor,
              // así que aquí solo necesitamos asegurarnos de que setLastMessage(message) se ejecute.
              break

            case 'power':
              // Update for device properties
              // (handled separately as we're using react-query for the device list)
              break
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error)
      setStatus('error')
    }
  }, [])

  // Initial connection
  useEffect(() => {
    unmountedRef.current = false
    connectWebSocket()

    // Cleanup
    return () => {
      unmountedRef.current = true
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [connectWebSocket])

  const value: WebSocketContextValue = {
    lastMessage,
    subscribe,
    deviceReadings,
    lastDeviceReading,
    status
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}

export default useWebSocket
