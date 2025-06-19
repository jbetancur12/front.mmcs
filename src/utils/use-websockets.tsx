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

interface WebSocketContextValue {
  lastMessage: WebSocketMessage | null
  lastDeviceReading: DeviceReadingPayload | null
  deviceReadings: Record<string, DeviceReadingPayload>
  status: 'connecting' | 'connected' | 'error' | 'closed'
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null)

interface WebSocketProviderProps {
  children: ReactNode
}

const token = localStorage.getItem('accessToken')

const wss = () => {
  if (import.meta.env.VITE_ENV === 'development') {
    return window.location.hostname.includes('localhost') ||
      window.location.hostname.includes('127.0.0.1')
      ? import.meta.env.VITE_WS_URL + '?token=' + token // Usar localhost si estás en casa
      : import.meta.env.VITE_WS_URL_CLOUDFARE + '?token=' + token // Usar Cloudflare si estás fuera
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

  // Create WebSocket connection
  const connectWebSocket = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      console.log('Connecting to WebSocket...', protocol)

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected')
        return
      }

      const socket = new WebSocket(wss())
      wsRef.current = socket
      let shouldReconnect = true

      socket.onopen = () => {
        console.log('WebSocket connected')
        setStatus('connected')
        // Clear any reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
      }

      socket.onclose = () => {
        console.log('WebSocket closed')
        setStatus('closed')
        // Attempt to reconnect after 2 seconds
        if (shouldReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect WebSocket...')
            connectWebSocket()
          }, 2000)
        }
      }

      socket.onerror = (error) => {
        console.error('WebSocket error:', error)
        setStatus('error')
        shouldReconnect = false
        socket.close()
      }

      socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          setLastMessage(message)

          switch (message.type) {
            case 'LABORATORY_DATA':
              console.log(message)
              break
            case 'REAL_TIME_DATA':
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
    connectWebSocket()

    // Cleanup
    return () => {
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
