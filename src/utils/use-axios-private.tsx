import type {
  AxiosError,
  AxiosResponse,
  AxiosRequestHeaders,
  InternalAxiosRequestConfig
} from 'axios'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { axiosPrivate } from './api'
import useRefreshToken from './use-refresh-token'
import { Toast } from 'src/Components/ExcelManipulation/Utils'

const onRequest = (
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig => {
  const token = localStorage.getItem('accessToken')

  // if (!config.headers) {
  //   config.headers = {} as AxiosRequestHeaders
  // }

  if (!config.headers['Authorization']) {
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

  let sent = false

  useEffect(() => {
    const requestIntercept = axiosPrivate.interceptors.request.use(
      onRequest,
      onRequestError
    )

    const responseIntercept = axiosPrivate.interceptors.response.use(
      onResponse,
      async (error: AxiosError): Promise<AxiosResponse | Promise<never>> => {
        if (!error.config) {
          throw new Error('Config must be existing...')
        }

        const previousRequest = error.config

        if (error.response?.status === 403 && !sent) {
          sent = true
          try {
            const newToken = await refresh()

            localStorage.setItem('accessToken', newToken)

            if (!previousRequest.headers) {
              previousRequest.headers = {} as AxiosRequestHeaders
            }

            previousRequest.headers['Authorization'] = `Bearer ${newToken}`
            return axiosPrivate(previousRequest)
          } catch (refreshError) {
            // Token inválido o expirado
            localStorage.removeItem('accessToken')
            localStorage.removeItem('columnFiltersCustomers') // Limpiar filtros
            localStorage.removeItem('columnFiltersHV') // Limpiar filtros
            Toast.fire('Sesión expirada', '', 'error')
            setTimeout(() => {
              navigate('/login')
            }, 2000)
            return Promise.reject(refreshError)
          }
        }

        if (error.response?.status === 401) {
          // Token inválido o expirado
          Toast.fire('Sesión expirada', '', 'error')
          localStorage.removeItem('accessToken')
          localStorage.removeItem('columnFiltersCustomers') // Limpiar filtros
          localStorage.removeItem('columnFiltersHV') // Limpiar filtros
          setTimeout(() => {
            navigate('/login')
          }, 2000)
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
