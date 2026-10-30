import type {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig
} from 'axios'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { NavigateFunction } from 'react-router-dom'

import { axiosPrivate } from './api'
import { refreshSession } from './use-refresh-token'
import { notify } from './notify'
import {
  clearLocalSession,
  getSessionRevokedReason,
  isRolesChangedError,
  rememberSessionEnded
} from './sessionEnd'
import { syncUserAccess } from './syncUserAccess'

type QueuedRequest = {
  reject: (error?: unknown) => void
  resolve: (token: string) => void
}

/**
 * Los interceptores se registran UNA sola vez para toda la app. Antes cada
 * componente que llamaba al hook sumaba su propio par: con N montados, un fallo
 * del refresh disparaba N renovaciones y N logouts, y cada uno tenía su propia
 * cola, así que no se coordinaban entre sí.
 */
let isRefreshing = false
let failedQueue: QueuedRequest[] = []
let lastRevokedLogoutAt = 0
let isLoggingOut = false
// Lo actualiza el hook: es lo único que los interceptores necesitan de React
let navigateRef: NavigateFunction | null = null

const onRequest = (
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig => {
  const token = localStorage.getItem('accessToken')

  if (token && !config.headers['Authorization']) {
    config.headers['Authorization'] = `Bearer ${token}`
  }

  return config
}

const onResponse = (response: AxiosResponse): AxiosResponse => response

const onRequestError = (error: AxiosError): Promise<never> =>
  Promise.reject(error)

/** Fallo del refresh que no prueba que la sesión terminó: límite de peticiones, error del servidor o sin red. */
const isTransientRefreshFailure = (error: unknown): boolean => {
  const status = (error as AxiosError)?.response?.status
  return status === undefined || status === 429 || status >= 500
}

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error || !token) {
      reject(error)
    } else {
      resolve(token)
    }
  })

  failedQueue = []
}

// `revokedReason`: la sesión la cerraron desde otro equipo. No se llama a /auth/logout: la sesión
// ya no existe y la cookie puede ser la de una sesión nueva de este mismo navegador.
const handleLogout = async (revokedReason: string | null = null) => {
  // Varias peticiones en vuelo fallan a la vez: se cierra una sola vez
  if (revokedReason) {
    if (Date.now() - lastRevokedLogoutAt < 5_000) return
    lastRevokedLogoutAt = Date.now()
  }
  if (isLoggingOut) return
  isLoggingOut = true

  try {
    if (!revokedReason) {
      try {
        await axiosPrivate.post('/auth/logout', {})
      } catch (logoutError) {
        console.error('Error al cerrar sesión:', logoutError)
      }
    }

    localStorage.removeItem('sessionExpiresAt')
    clearLocalSession()
    if (revokedReason) {
      rememberSessionEnded(revokedReason)
      notify.info('Tu sesión se cerró')
    } else {
      notify.error('Sesión expirada')
    }
    if (navigateRef) navigateRef('/login', { replace: true })
    else window.location.replace('/login')
  } finally {
    isLoggingOut = false
  }
}

const onResponseError = async (
  error: AxiosError
): Promise<AxiosResponse | Promise<never>> => {
  const originalConfig = error.config as
    | (InternalAxiosRequestConfig & { _retry?: boolean })
    | undefined

  if (!originalConfig) {
    return Promise.reject(error)
  }

  // Sesión cerrada desde otro equipo: renovar el token no sirve, se cierra aquí
  const revokedReason = getSessionRevokedReason(error)
  if (revokedReason) {
    await handleLogout(revokedReason)
    return Promise.reject(error)
  }

  if (error.response?.status === 401 && !originalConfig._retry) {
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => resolve(token),
          reject
        })
      })
        .then((token) => {
          originalConfig.headers = originalConfig.headers || {}
          originalConfig.headers.Authorization = `Bearer ${token}`
          return axiosPrivate(originalConfig)
        })
        .catch((queueError) => Promise.reject(queueError))
    }

    originalConfig._retry = true
    isRefreshing = true
    // Cambiaron los roles del usuario: además de renovar el token hay que actualizar menús y permisos
    const rolesChanged = isRolesChangedError(error)

    try {
      const refreshResult = await refreshSession()
      const newToken = refreshResult.accessToken

      if (!newToken) {
        throw new Error('No se pudo renovar el access token')
      }

      localStorage.setItem('accessToken', newToken)
      processQueue(null, newToken)
      if (rolesChanged) void syncUserAccess()

      originalConfig.headers = originalConfig.headers || {}
      originalConfig.headers.Authorization = `Bearer ${newToken}`
      return axiosPrivate(originalConfig)
    } catch (refreshError) {
      processQueue(refreshError, null)
      // Un 429, un 5xx o la red caída no significan sesión vencida: la sesión del servidor
      // sigue viva. No se cierra; la siguiente petición vuelve a intentar renovar.
      if (isTransientRefreshFailure(refreshError)) {
        return Promise.reject(refreshError)
      }
      await handleLogout(getSessionRevokedReason(refreshError))
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }

  return Promise.reject(error)
}

// Con HMR el módulo se evalúa de nuevo: se quitan los interceptores de la evaluación anterior
const instance = axiosPrivate as typeof axiosPrivate & {
  __authInterceptors?: { request: number; response: number }
}
if (instance.__authInterceptors) {
  axiosPrivate.interceptors.request.eject(instance.__authInterceptors.request)
  axiosPrivate.interceptors.response.eject(instance.__authInterceptors.response)
}
instance.__authInterceptors = {
  request: axiosPrivate.interceptors.request.use(onRequest, onRequestError),
  response: axiosPrivate.interceptors.response.use(onResponse, onResponseError)
}

const useAxiosPrivate = () => {
  const navigate = useNavigate()

  useEffect(() => {
    navigateRef = navigate
  }, [navigate])

  return axiosPrivate
}

export default useAxiosPrivate
