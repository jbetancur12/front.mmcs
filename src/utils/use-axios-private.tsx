// import type {
//   AxiosError,
//   AxiosResponse,
//   // AxiosRequestHeaders,
//   InternalAxiosRequestConfig
// } from 'axios'
// import { useEffect, useRef } from 'react'
// import { useNavigate } from 'react-router-dom'

// import { axiosPrivate } from './api'
// import useRefreshToken from './use-refresh-token'
// import { Toast } from 'src/Components/ExcelManipulation/Utils'

// const onRequest = (
//   config: InternalAxiosRequestConfig
// ): InternalAxiosRequestConfig => {
//   const token = localStorage.getItem('accessToken')

//   if (token && !config.headers['Authorization']) {
//     config.headers['Authorization'] = `Bearer ${token}`
//   }
//   return config
// }

// const onResponse = (response: AxiosResponse): AxiosResponse => {
//   return response
// }

// const onRequestError = (error: AxiosError): Promise<never> => {
//   return Promise.reject(error)
// }

// const useAxiosPrivate = () => {
//   const refresh = useRefreshToken()
//   const navigate = useNavigate()
//   const isRefreshing = useRef(false)
//   const failedQueue = useRef<Array<{
//     resolve: (value?: any) => void
//     reject: (error?: any) => void
//   }>>([])

//   const processQueue = (error: any, token: string | null = null) => {
//     failedQueue.current.forEach(({ resolve, reject }) => {
//       if (error) {
//         reject(error)
//       } else {
//         resolve(token)
//       }
//     })
    
//     failedQueue.current = []
//   }

//   const handleLogout = async () => {
//     try {
//       await axiosPrivate.post('/auth/logout')
//     } catch (logoutError) {
//       console.error('Error al cerrar sesión:', logoutError)
//     }

//     localStorage.clear()
//     sessionStorage.clear()
//     Toast.fire('Sesión expirada', '', 'error')
//     navigate('/login', { replace: true })
//   }

//   useEffect(() => {
//     const requestIntercept = axiosPrivate.interceptors.request.use(
//       onRequest,
//       onRequestError
//     )

//     const responseIntercept = axiosPrivate.interceptors.response.use(
//       onResponse,
//       async (error: AxiosError): Promise<AxiosResponse | Promise<never>> => {
//         const originalConfig = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

//         if (!originalConfig) {
//           return Promise.reject(error)
//         }

//         // Solo manejar 401 para refresh token, 403 puede ser permisos
//         if (error.response?.status === 401 && !originalConfig._retry) {
//           if (isRefreshing.current) {
//             // Si ya se está refrescando, agregar a la cola
//             return new Promise((resolve, reject) => {
//               failedQueue.current.push({ resolve, reject })
//             }).then(token => {
//               originalConfig.headers.Authorization = `Bearer ${token}`
//               return axiosPrivate(originalConfig)
//             }).catch(err => {
//               return Promise.reject(err)
//             })
//           }

//           originalConfig._retry = true
//           isRefreshing.current = true

//           try {
//             const newToken = await refresh()
//             localStorage.setItem('accessToken', newToken)
            
//             // Procesar cola de requests pendientes
//             processQueue(null, newToken)
            
//             // Reintentar request original
//             originalConfig.headers.Authorization = `Bearer ${newToken}`
//             return axiosPrivate(originalConfig)
//           } catch (refreshError) {
//             // Solo hacer logout si el refresh falló definitivamente
//             processQueue(refreshError, null)
//             await handleLogout()
//             return Promise.reject(refreshError)
//           } finally {
//             isRefreshing.current = false
//           }
//         }

//         // Para otros errores (403, 404, 500, etc.) no hacer logout
//         return Promise.reject(error)
//       }
//     )

//     return () => {
//       axiosPrivate.interceptors.request.eject(requestIntercept)
//       axiosPrivate.interceptors.response.eject(responseIntercept)
//     }
//   }, [refresh, navigate])

//   return axiosPrivate
// }

// export default useAxiosPrivate

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

