import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { wss } from 'src/utils/useWebSocket'
import {
  clearLocalSession,
  getTokenSessionId,
  rememberSessionEnded
} from 'src/utils/sessionEnd'
import { syncUserAccess } from 'src/utils/syncUserAccess'

const MAX_RETRY_MS = 60_000
// Todas las pestañas del navegador reciben el mismo aviso y comparten cookie: se escalonan para que la primera
// renueve el token y las demás ya encuentren el nuevo, en vez de renovar todas a la vez
const ROLES_CHANGED_JITTER_MS = 1_500

/**
 * Se entera al momento de que cierran esta sesión desde otro equipo (login
 * con "cerrar la otra", lista de sesiones, cambio de clave) por un canal
 * ligero del WebSocket que solo lleva ese aviso. Sin esto la pestaña se
 * enteraría en su siguiente petición al API. También avisa cuando cambian los
 * roles de esta persona (ROLES_CHANGED): se actualizan menús y permisos sin
 * cerrar la sesión. Se monta una vez, en el Header.
 */
const useSessionGuard = () => {
  const navigate = useNavigate()

  useEffect(() => {
    let socket: WebSocket | null = null
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let retryMs = 5_000
    let stopped = false

    const scheduleRetry = () => {
      if (stopped) return
      retryTimer = setTimeout(connect, retryMs)
      retryMs = Math.min(retryMs * 2, MAX_RETRY_MS)
    }

    const connect = () => {
      const token = localStorage.getItem('accessToken')
      const baseUrl = wss()
      if (stopped || !token || !baseUrl) return

      // Un token anterior a las sesiones no trae sid: el servidor lo rechazaría. Se espera a que el
      // refresh lo cambie por uno con sid (se vuelve a leer el token en cada intento).
      if (!getTokenSessionId(token)) {
        scheduleRetry()
        return
      }

      const url = new URL(baseUrl)
      url.searchParams.set('channel', 'session')
      url.searchParams.set('token', token)
      socket = new WebSocket(url.toString())

      socket.onopen = () => {
        retryMs = 5_000
      }

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          if (message.type === 'ROLES_CHANGED') {
            // La petición a /auth/validateToken recibe 401 ROLES_CHANGED con el token viejo; el interceptor
            // renueva el token (una sola vez, con cola) y la repite, así que no se renueva aquí a mano
            setTimeout(
              () => void syncUserAccess(),
              Math.random() * ROLES_CHANGED_JITTER_MS
            )
            return
          }
          if (message.type !== 'SESSION_REVOKED') return
          stopped = true
          // La sesión ya no existe en el servidor: no se llama a /auth/logout, que con la cookie
          // compartida entre pestañas podría cerrar la sesión nueva de este mismo navegador.
          clearLocalSession()
          rememberSessionEnded(message.data?.reason || 'revoked')
          navigate('/login', { replace: true })
        } catch {
          // mensaje que no es de este canal
        }
      }

      socket.onclose = scheduleRetry
    }

    connect()

    return () => {
      stopped = true
      if (retryTimer) clearTimeout(retryTimer)
      socket?.close()
    }
  }, [navigate])
}

export default useSessionGuard
