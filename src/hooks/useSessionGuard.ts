import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { wss } from 'src/utils/useWebSocket'
import {
  clearLocalSession,
  getTokenSessionId,
  isTokenExpired,
  rememberSessionEnded
} from 'src/utils/sessionEnd'
import {
  GIVE_UP_FAILURES,
  nextRetryMs,
  shouldGiveUp
} from 'src/utils/sessionGuardRetry'
import { syncUserAccess } from 'src/utils/syncUserAccess'

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
    // Intentos seguidos que se cerraron sin llegar a abrir (el servidor rechazó el handshake o no hay red)
    let failures = 0
    let stopped = false

    // Token con el que se dejó de insistir; se retoma si cambia o si la pestaña vuelve a verse
    let gaveUpWith: string | null = null

    const scheduleRetry = () => {
      if (stopped) return
      if (shouldGiveUp(failures)) {
        gaveUpWith = localStorage.getItem('accessToken')
        return
      }
      retryTimer = setTimeout(connect, nextRetryMs(failures))
    }

    const connect = () => {
      const token = localStorage.getItem('accessToken')
      const baseUrl = wss()
      if (stopped || !token || !baseUrl) return
      // Una pestaña oculta no reintenta: lo hace al volver a verse
      if (document.hidden) {
        gaveUpWith = token
        return
      }

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
      let opened = false

      socket.onopen = () => {
        opened = true
        failures = 0
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

      socket.onclose = () => {
        if (!opened) {
          failures += 1
          // El servidor responde 403 si el token venció. En una pestaña inactiva nadie lo renueva (solo consulta
          // /version.json), y reintentar con el mismo token fallaría para siempre. Una petición autenticada pasa por
          // el interceptor, que renueva el token con la cookie de refresh, o cierra la sesión si ya terminó.
          if (isTokenExpired(token)) void syncUserAccess()
        }
        scheduleRetry()
      }
    }

    // Retoma tras rendirse u ocultarse: con token nuevo desde cero, con el mismo token un solo intento más
    const resume = () => {
      if (stopped || gaveUpWith === null || document.hidden) return
      const token = localStorage.getItem('accessToken')
      if (token !== gaveUpWith) failures = 0
      else if (failures >= GIVE_UP_FAILURES) failures = GIVE_UP_FAILURES - 1
      gaveUpWith = null
      if (retryTimer) clearTimeout(retryTimer)
      connect()
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'accessToken') resume()
    }
    document.addEventListener('visibilitychange', resume)
    window.addEventListener('storage', onStorage)

    connect()

    return () => {
      stopped = true
      document.removeEventListener('visibilitychange', resume)
      window.removeEventListener('storage', onStorage)
      if (retryTimer) clearTimeout(retryTimer)
      socket?.close()
    }
  }, [navigate])
}

export default useSessionGuard
