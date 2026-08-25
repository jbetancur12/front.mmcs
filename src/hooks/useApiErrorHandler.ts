import { useState, useCallback, useRef, useEffect } from 'react'
import { useSnackbar } from 'notistack'

interface ApiError {
  status?: number
  message: string
  code?: string
  timestamp?: string
}

interface RetryConfig {
  maxRetries?: number
  retryDelay?: number
  backoffMultiplier?: number
  retryCondition?: (error: ApiError) => boolean
}

interface UseApiErrorHandlerOptions {
  showToast?: boolean
  logErrors?: boolean
  retryConfig?: RetryConfig
  onError?: (error: ApiError) => void
}

interface UseApiErrorHandlerReturn {
  error: ApiError | null
  isRetrying: boolean
  retryCount: number
  clearError: () => void
  handleError: (error: any) => void
  executeWithRetry: <T>(
    operation: () => Promise<T>,
    config?: RetryConfig
  ) => Promise<T>
}

export const useApiErrorHandler = (
  options: UseApiErrorHandlerOptions = {}
): UseApiErrorHandlerReturn => {
  const {
    showToast = true,
    logErrors = true,
    retryConfig = {},
    onError
  } = options

  const { enqueueSnackbar } = useSnackbar()
  const [error, setError] = useState<ApiError | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const retryTimeoutRef = useRef<NodeJS.Timeout>()

  const defaultRetryConfig: Required<RetryConfig> = {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
    retryCondition: (error: ApiError) => {
      // Retry on network errors and 5xx server errors
      return !error.status || error.status >= 500
    }
  }

  const clearError = useCallback(() => {
    setError(null)
    setRetryCount(0)
    setIsRetrying(false)
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }
  }, [])

  const formatError = useCallback((error: any): ApiError => {
    // Handle different error types
    if (error?.response) {
      // Axios error with response
      return {
        status: error.response.status,
        message: error.response.data?.message || error.message || 'Error de servidor',
        code: error.response.data?.code || error.code,
        timestamp: new Date().toISOString()
      }
    } else if (error?.request) {
      // Network error
      return {
        message: 'Error de conexión. Verifique su conexión a internet.',
        code: 'NETWORK_ERROR',
        timestamp: new Date().toISOString()
      }
    } else if (error instanceof Error) {
      // Generic error
      return {
        message: error.message || 'Error desconocido',
        timestamp: new Date().toISOString()
      }
    } else {
      // Unknown error type
      return {
        message: typeof error === 'string' ? error : 'Error desconocido',
        timestamp: new Date().toISOString()
      }
    }
  }, [])

  const getErrorMessage = useCallback((error: ApiError): string => {
    switch (error.status) {
      case 400:
        return 'Datos inválidos en la solicitud'
      case 401:
        return 'Sesión expirada. Inicie sesión nuevamente'
      case 403:
        return 'No tiene permisos para esta acción'
      case 404:
        return 'Recurso no encontrado'
      case 409:
        return 'Conflicto con el estado actual del recurso'
      case 422:
        return 'Datos de entrada inválidos'
      case 429:
        return 'Demasiadas solicitudes. Intente más tarde'
      case 500:
        return 'Error interno del servidor'
      case 502:
        return 'Servidor no disponible'
      case 503:
        return 'Servicio temporalmente no disponible'
      case 504:
        return 'Tiempo de espera agotado'
      default:
        return error.message || 'Error desconocido'
    }
  }, [])

  const handleError = useCallback((rawError: any) => {
    const formattedError = formatError(rawError)
    setError(formattedError)

    // Log error if enabled
    if (logErrors) {
      console.error('API Error:', formattedError, rawError)
    }

    // Show toast notification if enabled
    if (showToast) {
      const message = getErrorMessage(formattedError)
      enqueueSnackbar(message, {
        variant: 'error',
        autoHideDuration: 5000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right'
        }
      })
    }

    // Call custom error handler if provided
    if (onError) {
      onError(formattedError)
    }
  }, [formatError, logErrors, showToast, getErrorMessage, enqueueSnackbar, onError])

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    config: RetryConfig = {}
  ): Promise<T> => {
    const finalConfig = { ...defaultRetryConfig, ...retryConfig, ...config }
    let lastError: ApiError | null = null
    
    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        setIsRetrying(attempt > 0)
        setRetryCount(attempt)
        
        const result = await operation()
        
        // Success - clear any previous errors
        clearError()
        return result
      } catch (error) {
        lastError = formatError(error)
        
        // Check if we should retry
        const shouldRetry = attempt < finalConfig.maxRetries && 
                           finalConfig.retryCondition(lastError)
        
        if (!shouldRetry) {
          break
        }
        
        // Calculate delay with exponential backoff
        const delay = finalConfig.retryDelay * 
                     Math.pow(finalConfig.backoffMultiplier, attempt)
        
        // Wait before retry
        await new Promise(resolve => {
          retryTimeoutRef.current = setTimeout(resolve, delay)
        })
      }
    }
    
    // All retries failed
    setIsRetrying(false)
    if (lastError) {
      handleError(lastError)
      throw lastError
    }
    
    throw new Error('Operation failed after retries')
  }, [defaultRetryConfig, retryConfig, clearError, formatError, handleError])

  return {
    error,
    isRetrying,
    retryCount,
    clearError,
    handleError,
    executeWithRetry
  }
}

// Hook for specific API operations with built-in error handling
export const useApiOperation = <T>(
  operation: () => Promise<T>,
  options: UseApiErrorHandlerOptions & {
    immediate?: boolean
    dependencies?: any[]
  } = {}
) => {
  const { immediate = false, dependencies = [], ...errorOptions } = options
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    error,
    isRetrying,
    retryCount,
    clearError,
    executeWithRetry
  } = useApiErrorHandler(errorOptions)

  const execute = useCallback(async (retryConfig?: RetryConfig) => {
    setIsLoading(true)
    clearError()
    
    try {
      const result = await executeWithRetry(operation, retryConfig)
      setData(result)
      return result
    } catch (error) {
      // Error is already handled by executeWithRetry
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [operation, executeWithRetry, clearError])

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute().catch(() => {
        // Error is already handled
      })
    }
  }, [immediate, execute, ...dependencies])

  return {
    data,
    isLoading,
    error,
    isRetrying,
    retryCount,
    execute,
    clearError
  }
}

export default useApiErrorHandler
