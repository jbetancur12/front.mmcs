import type {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig
} from 'axios'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { axiosPrivate, axiosPublic } from './api'
import useRefreshToken, { storeSessionExpiry } from './use-refresh-token'
import { promptDialog } from './confirm'
import { notify } from './notify'
import {
  clearLocalSession,
  getSessionRevokedReason,
  isReauthRequired,
  rememberSessionEnded
} from './sessionEnd'

type QueuedRequest = {
  reject: (error?: unknown) => void
  resolve: (token: string) => void
}

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

let lastRevokedLogoutAt = 0

const MAX_REAUTH_TRIES = 3

/**
 * La sesión cumplió su tope de días: se pide la contraseña sin salir de la pantalla.
 * Devuelve el access token nuevo, o null si cancela, falla tres veces o está bloqueado.
 */
const askPasswordToContinue = async (): Promise<string | null> => {
  for (let attempt = 0; attempt < MAX_REAUTH_TRIES; attempt += 1) {
    const answer = await promptDialog({
      title: 'Confirma tu contraseña',
      label: 'Contraseña',
      type: 'password',
      helperText:
        'Por seguridad la sesión la pide cada cierto tiempo. No pierdes lo que estás haciendo.',
      confirmLabel: 'Continuar'
    })
    if (!answer.isConfirmed || !answer.value) return null

    try {
      const response = await axiosPublic.post(
        '/auth/reauthenticate',
        { contraseña: answer.value },
        { withCredentials: true }
      )
      storeSessionExpiry(response.data.expiresIn)
      return (response.data.accessToken as string) || null
    } catch (error) {
      const status = (error as AxiosError)?.response?.status
      if (status !== 401) return null
      notify.error('Contraseña incorrecta')
    }
  }
  return null
}

const useAxiosPrivate = () => {
  const refresh = useRefreshToken()
  const navigate = useNavigate()
  const isRefreshing = useRef(false)
  const failedQueue = useRef<QueuedRequest[]>([])

  const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.current.forEach(({ resolve, reject }) => {
      if (error || !token) {
        reject(error)
      } else {
        resolve(token)
      }
    })

    failedQueue.current = []
  }

  // `revokedReason`: la sesión la cerraron desde otro equipo. No se llama a /auth/logout: la sesión
  // ya no existe y la cookie puede ser la de una sesión nueva de este mismo navegador.
  const handleLogout = async (revokedReason: string | null = null) => {
    // Varias peticiones en vuelo (y varios hooks con su interceptor) fallan a la vez: se cierra una sola vez
    if (revokedReason) {
      if (Date.now() - lastRevokedLogoutAt < 5_000) return
      lastRevokedLogoutAt = Date.now()
    }

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
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    const requestIntercept = axiosPrivate.interceptors.request.use(
      onRequest,
      onRequestError
    )

    const responseIntercept = axiosPrivate.interceptors.response.use(
      onResponse,
      async (error: AxiosError): Promise<AxiosResponse | Promise<never>> => {
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
          if (isRefreshing.current) {
            return new Promise((resolve, reject) => {
              failedQueue.current.push({
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
          isRefreshing.current = true

          try {
            const refreshResult = await refresh()
            const newToken = refreshResult.accessToken

            if (!newToken) {
              throw new Error('No se pudo renovar el access token')
            }

            localStorage.setItem('accessToken', newToken)
            processQueue(null, newToken)

            originalConfig.headers = originalConfig.headers || {}
            originalConfig.headers.Authorization = `Bearer ${newToken}`
            return axiosPrivate(originalConfig)
          } catch (refreshError) {
            if (isReauthRequired(refreshError)) {
              const newToken = await askPasswordToContinue()
              if (newToken) {
                localStorage.setItem('accessToken', newToken)
                processQueue(null, newToken)
                originalConfig.headers = originalConfig.headers || {}
                originalConfig.headers.Authorization = `Bearer ${newToken}`
                return axiosPrivate(originalConfig)
              }
            }
            processQueue(refreshError, null)
            await handleLogout(getSessionRevokedReason(refreshError))
            return Promise.reject(refreshError)
          } finally {
            isRefreshing.current = false
          }
        }

        return Promise.reject(error)
      }
    )

    return () => {
      axiosPrivate.interceptors.request.eject(requestIntercept)
      axiosPrivate.interceptors.response.eject(responseIntercept)
    }
  }, [navigate, refresh])

  return axiosPrivate
}

export default useAxiosPrivate
// @ts-nocheck
