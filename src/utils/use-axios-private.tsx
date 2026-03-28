import type {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig
} from 'axios'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { axiosPrivate } from './api'
import useRefreshToken from './use-refresh-token'
import { Toast } from 'src/Components/ExcelManipulation/Utils'

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

  const handleLogout = async () => {
    try {
      await axiosPrivate.post('/auth/logout', {})
    } catch (logoutError) {
      console.error('Error al cerrar sesión:', logoutError)
    }

    localStorage.removeItem('sessionExpiresAt')
    localStorage.clear()
    sessionStorage.clear()
    Toast.fire('Sesión expirada', '', 'error')
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
            processQueue(refreshError, null)
            await handleLogout()
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
