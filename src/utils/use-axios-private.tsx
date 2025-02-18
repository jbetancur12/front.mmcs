import type {
  AxiosError,
  AxiosResponse,
  // AxiosRequestHeaders,
  InternalAxiosRequestConfig
} from 'axios'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { axiosPrivate } from './api'
import useRefreshToken from './use-refresh-token'
import { Toast } from 'src/Components/ExcelManipulation/Utils'

const onRequest = (
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig => {
  const token = localStorage.getItem('accessToken')

  if (token && !config.headers['Authorization']) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
}

const onResponse = (response: AxiosResponse): AxiosResponse => {
  return response
}

const onRequestError = (error: AxiosError): Promise<never> => {
  return Promise.reject(error)
}

const useAxiosPrivate = () => {
  const refresh = useRefreshToken()
  const navigate = useNavigate()
  const sent = useRef(false) // Usar useRef para mantener el estado

  useEffect(() => {
    const requestIntercept = axiosPrivate.interceptors.request.use(
      onRequest,
      onRequestError
    )

    const responseIntercept = axiosPrivate.interceptors.response.use(
      onResponse,
      async (error: AxiosError): Promise<AxiosResponse | Promise<never>> => {
        const originalConfig = error.config

        if (!originalConfig) {
          return Promise.reject(error)
        }

        // Manejar error 403 (token expirado)
        if (error.response?.status === 403 && !sent.current) {
          sent.current = true
          try {
            const newToken = await refresh()
            localStorage.setItem('accessToken', newToken)

            originalConfig.headers.Authorization = `Bearer ${newToken}`
            return axiosPrivate(originalConfig)
          } catch (refreshError) {
            // Eliminar refresh token del backend y limpiar frontend
            try {
              await axiosPrivate.post('/auth/logout')
            } catch (logoutError) {
              console.error('Error al cerrar sesión:', logoutError)
            }

            localStorage.clear()
            sessionStorage.clear()

            Toast.fire('Sesión expirada', '', 'error')
            navigate('/login', { replace: true })

            return Promise.reject(refreshError)
          } finally {
            sent.current = false
          }
        }

        // Manejar error 401 (no autorizado)
        if (error.response?.status === 401) {
          try {
            await axiosPrivate.post('/auth/logout')
          } catch (logoutError) {
            console.error('Error al cerrar sesión:', logoutError)
          }

          localStorage.clear()
          sessionStorage.clear()

          Toast.fire('Sesión expirada', '', 'error')
          navigate('/login', { replace: true })
        }

        return Promise.reject(error)
      }
    )

    return () => {
      axiosPrivate.interceptors.request.eject(requestIntercept)
      axiosPrivate.interceptors.response.eject(responseIntercept)
    }
  }, [refresh, navigate])

  return axiosPrivate
}

export default useAxiosPrivate
