import { getApiErrorPayload } from './apiError'

const SESSION_ENDED_KEY = 'sessionEndedReason'

/** Motivos con que el API cierra una sesión (services/sessionService.js). */
const MESSAGES: Record<string, string> = {
  replaced: 'Tu sesión se cerró porque ingresaste desde otro equipo.',
  manual: 'Cerraron esta sesión desde otro equipo.',
  password_changed: 'Cambiaron tu contraseña. Ingresa de nuevo.',
  deactivated: 'Tu cuenta fue desactivada. Contacta al administrador.'
}

/** Motivo de cierre si el error es un SESSION_REVOKED del API; si no, null. */
export const getSessionRevokedReason = (error: unknown): string | null => {
  const data = getApiErrorPayload(error)
  return data.code === 'SESSION_REVOKED' ? data.reason || 'revoked' : null
}

/** El API avisa que los roles del usuario cambiaron: el token es viejo, se renueva y se repite la petición. */
export const isRolesChangedError = (error: unknown): boolean =>
  getApiErrorPayload(error).code === 'ROLES_CHANGED'

/** El API pide confirmar la contraseña porque la sesión cumplió su tope de días. */
export const isReauthRequired = (error: unknown): boolean =>
  getApiErrorPayload(error).code === 'SESSION_REAUTH_REQUIRED'

/**
 * Recuerda por qué se cerró la sesión para decírselo en el login. Va en
 * sessionStorage: sobrevive a la navegación y no a la pestaña. Un cierre
 * normal (`logout`) no deja mensaje.
 */
export const rememberSessionEnded = (reason: string) => {
  if (reason === 'logout') return
  try {
    sessionStorage.setItem(SESSION_ENDED_KEY, reason)
  } catch {
    // sin almacenamiento el login solo pierde el aviso
  }
}

/** Mensaje pendiente para el login. No lo borra: React lo lee dos veces en desarrollo. */
export const peekSessionEndedMessage = (): string | null => {
  try {
    const reason = sessionStorage.getItem(SESSION_ENDED_KEY)
    return reason ? MESSAGES[reason] || 'Tu sesión se cerró.' : null
  } catch {
    return null
  }
}

/** Se llama al intentar ingresar de nuevo: el aviso ya cumplió. */
export const clearSessionEnded = () => {
  try {
    sessionStorage.removeItem(SESSION_ENDED_KEY)
  } catch {
    // nada que limpiar
  }
}

/** `sid` del access token (solo lectura del payload, sin verificar la firma); null si no trae. */
export const getTokenSessionId = (token: string): string | null => {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const sid = JSON.parse(atob(payload)).sid
    return typeof sid === 'string' ? sid : null
  } catch {
    return null
  }
}

/** Limpia lo que deja una sesión local (la cookie del refresh es del servidor). */
export const clearLocalSession = () => {
  localStorage.clear()
  sessionStorage.clear()
}
