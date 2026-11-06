import { useState, useEffect, useRef, useCallback } from 'react'
import { createContext, useContext, ReactNode } from 'react'
import { DeviceReadingPayload } from 'src/Components/Iot/DeviceIotMap/types'

import { logger } from 'src/utils/logger'
import { isTokenExpired } from 'src/utils/sessionEnd'
import {
  GIVE_UP_FAILURES,
  nextRetryMs,
  shouldGiveUp
} from 'src/utils/sessionGuardRetry'
import { syncUserAccess } from 'src/utils/syncUserAccess'
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
  data: unknown
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
  // Intentos seguidos que se cerraron sin llegar a abrir (el servidor rechazó el handshake o no hay red)
  const failuresRef = useRef(0)
  // Token con el que se dejó de insistir; se retoma si cambia o si la pestaña vuelve a verse
  const gaveUpWithRef = useRef<string | null>(null)

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
      logger.log('Connecting to WebSocket...', protocol)

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        logger.log('WebSocket already connected')
        return
      }

      const wsUrl = wss()
      if (!wsUrl) {
        // Sin sesión no se conecta: se vuelve a mirar en unos segundos (sin tráfico)
        setStatus('closed')
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000)
        return
      }

      // Una pestaña oculta no reintenta: lo hace al volver a verse
      if (document.hidden) {
        gaveUpWithRef.current = localStorage.getItem('accessToken')
        return
      }

      const token = localStorage.getItem('accessToken')
      const socket = new WebSocket(wsUrl)
      wsRef.current = socket
      let opened = false

      socket.onopen = () => {
        opened = true
        failuresRef.current = 0
        logger.log('WebSocket connected')
        setStatus('connected')
        // Clear any reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
      }

      socket.onclose = () => {
        logger.log('WebSocket closed')
        setStatus('closed')
        if (unmountedRef.current) return

        if (!opened) {
          failuresRef.current += 1
          // El servidor responde 403 si el token venció. En una pestaña inactiva nadie lo renueva, y reintentar con
          // el mismo token fallaría para siempre: una petición autenticada lo renueva por el interceptor.
          if (token && isTokenExpired(token)) void syncUserAccess()
        }

        // Tras varios cierres seguidos sin abrir (token vencido, o una cuenta sin empresa que el servidor rechaza con
        // 404) reintentar solo llena el log del servidor: se espera a que cambie el token o la pestaña se vea
        if (shouldGiveUp(failuresRef.current)) {
          gaveUpWithRef.current = token
          return
        }
        // Reintenta también tras un error de red, con espera creciente (5 s → 5 min)
        reconnectTimeoutRef.current = setTimeout(() => {
          logger.log('Attempting to reconnect WebSocket...')
          connectWebSocket()
        }, nextRetryMs(failuresRef.current))
      }

      socket.onerror = (error) => {
        logger.error('WebSocket error:', error)
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
              logger.error('Error in WebSocket listener:', listenerError)
            }
          })

          switch (message.type) {
            case 'LABORATORY_DATA':
              break
            case 'REAL_TIME_DATA': {
              // El payload llega como JSON del socket; se valida su forma al tiparlo.
              const payload = message.data as DeviceReadingPayload
              const reading: DeviceReadingPayload = {
                ...payload,
                ts: Date.now()
              }

              setLastDeviceReading(reading)
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
          logger.error('Error parsing WebSocket message:', error)
        }
      }
    } catch (error) {
      logger.error('Failed to connect to WebSocket:', error)
      setStatus('error')
    }
  }, [])

  // Initial connection
  useEffect(() => {
    unmountedRef.current = false
    connectWebSocket()

    // Retoma tras rendirse u ocultarse: con token nuevo desde cero, con el mismo token un solo intento más
    const resume = () => {
      if (unmountedRef.current || gaveUpWithRef.current === null) return
      if (document.hidden) return
      const token = localStorage.getItem('accessToken')
      if (token !== gaveUpWithRef.current) failuresRef.current = 0
      else if (failuresRef.current >= GIVE_UP_FAILURES) {
        failuresRef.current = GIVE_UP_FAILURES - 1
      }
      gaveUpWithRef.current = null
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      connectWebSocket()
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'accessToken') resume()
    }
    document.addEventListener('visibilitychange', resume)
    window.addEventListener('storage', onStorage)

    // Cleanup
    return () => {
      unmountedRef.current = true
      document.removeEventListener('visibilitychange', resume)
      window.removeEventListener('storage', onStorage)
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
