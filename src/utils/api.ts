import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { api } from 'src/config'

// Extend AxiosRequestConfig to include _retry flag
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean
  }
}

// ===========================
// Public Axios Instance
// ===========================
export const axiosPublic = axios.create({
  baseURL: api(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Response interceptor for error handling (public instance)
axiosPublic.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error('API Error:', error)
    handleApiError(error)
    return Promise.reject(error)
  }
)

// ===========================
// Private Axios Instance
// ===========================
export const axiosPrivate = axios.create({
  baseURL: api(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - Add JWT token automatically
axiosPrivate.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken')

    if (token && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors and refresh token
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (error?: any) => void
}> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })

  failedQueue = []
}

axiosPrivate.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig

    if (!originalRequest) {
      return Promise.reject(error)
    }

    // Handle 401 errors (Unauthorized - token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`
            return axiosPrivate(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Call refresh token endpoint
        const response = await axiosPublic.get('/auth/refresh-token', {
          withCredentials: true
        })

        const newToken = response.data.accessToken

        if (newToken) {
          localStorage.setItem('accessToken', newToken)

          // Update authorization header
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`

          // Process queued requests
          processQueue(null, newToken)

          // Retry original request
          return axiosPrivate(originalRequest)
        }
      } catch (refreshError) {
        // Refresh token failed - clear auth and redirect to login
        processQueue(refreshError, null)
        handleAuthFailure()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Handle 403 errors (Forbidden - insufficient permissions)
    if (error.response?.status === 403) {
      console.error('Forbidden: Insufficient permissions')
      handleApiError(error)
    }

    // Handle other errors
    handleApiError(error)
    return Promise.reject(error)
  }
)

// ===========================
// Helper Functions
// ===========================

/**
 * Centralized error handling function
 */
export const handleApiError = (error: AxiosError) => {
  if (!error.response) {
    // Network error
    console.error('Network Error:', error.message)
    return
  }

  const status = error.response.status
  const data = error.response.data as any

  switch (status) {
    case 400:
      console.error('Bad Request:', data?.message || 'Invalid request')
      break
    case 401:
      console.error('Unauthorized:', data?.message || 'Authentication required')
      break
    case 403:
      console.error('Forbidden:', data?.message || 'Insufficient permissions')
      break
    case 404:
      console.error('Not Found:', data?.message || 'Resource not found')
      break
    case 422:
      console.error('Validation Error:', data?.message || 'Validation failed')
      break
    case 429:
      console.error('Too Many Requests:', data?.message || 'Rate limit exceeded')
      break
    case 500:
      console.error('Server Error:', data?.message || 'Internal server error')
      break
    case 503:
      console.error('Service Unavailable:', data?.message || 'Service temporarily unavailable')
      break
    default:
      console.error(`HTTP Error ${status}:`, data?.message || 'Unknown error')
  }
}

/**
 * Handle authentication failure - clear tokens and redirect
 */
const handleAuthFailure = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('user')

  // Only redirect if not already on login page
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}
