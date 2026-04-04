import React, { useState, useEffect, ReactNode } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Stack,
  Chip,
  CircularProgress,
  LinearProgress
} from '@mui/material'
import {
  WifiOff as WifiOffIcon,
  Refresh as RefreshIcon,
  CloudOff as CloudOffIcon,
  Error as ErrorIcon
} from '@mui/icons-material'

interface ApiError {
  status?: number
  message: string
  code?: string
  timestamp?: string
}

interface Props {
  children: ReactNode
  error: ApiError | null
  isLoading?: boolean
  onRetry?: () => void
  maxRetries?: number
  retryDelay?: number
  showRetryProgress?: boolean
  fallbackComponent?: ReactNode
}

export const ApiErrorBoundary: React.FC<Props> = ({
  children,
  error,
  isLoading = false,
  onRetry,
  maxRetries = 3,
  retryDelay = 2000,
  showRetryProgress = true,
  fallbackComponent
}) => {
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryProgress, setRetryProgress] = useState(0)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-retry logic
  useEffect(() => {
    if (error && onRetry && retryCount < maxRetries && isOnline) {
      const timer = setTimeout(() => {
        handleRetry()
      }, retryDelay)

      return () => clearTimeout(timer)
    }
  }, [error, retryCount, maxRetries, retryDelay, onRetry, isOnline])

  // Retry progress animation
  useEffect(() => {
    if (isRetrying && showRetryProgress) {
      setRetryProgress(0)
      const interval = setInterval(() => {
        setRetryProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + (100 / (retryDelay / 100))
        })
      }, 100)

      return () => clearInterval(interval)
    }
  }, [isRetrying, retryDelay, showRetryProgress])

  const handleRetry = async () => {
    if (retryCount >= maxRetries || !onRetry) return

    setIsRetrying(true)
    setRetryCount(prev => prev + 1)

    try {
      await new Promise(resolve => setTimeout(resolve, retryDelay))
      onRetry()
    } finally {
      setIsRetrying(false)
      setRetryProgress(0)
    }
  }

  const handleManualRetry = () => {
    setRetryCount(0)
    handleRetry()
  }

  const getErrorSeverity = (status?: number): 'error' | 'warning' | 'info' => {
    if (!status) return 'error'
    if (status >= 500) return 'error'
    if (status >= 400) return 'warning'
    return 'info'
  }

  const getErrorIcon = (status?: number) => {
    if (!isOnline) return <WifiOffIcon />
    if (!status) return <ErrorIcon />
    if (status >= 500) return <CloudOffIcon />
    return <ErrorIcon />
  }

  const getErrorTitle = (status?: number): string => {
    if (!isOnline) return 'Sin Conexión a Internet'
    if (!status) return 'Error de Conexión'
    if (status >= 500) return 'Error del Servidor'
    if (status >= 400) return 'Error de Solicitud'
    return 'Error de Red'
  }

  const getErrorMessage = (error: ApiError): string => {
    if (!isOnline) {
      return 'Verifique su conexión a internet e intente nuevamente.'
    }
    
    switch (error.status) {
      case 400:
        return 'La solicitud contiene datos inválidos.'
      case 401:
        return 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.'
      case 403:
        return 'No tiene permisos para acceder a esta información.'
      case 404:
        return 'La información solicitada no fue encontrada.'
      case 429:
        return 'Demasiadas solicitudes. Intente nuevamente en unos momentos.'
      case 500:
        return 'Error interno del servidor. Intente nuevamente más tarde.'
      case 502:
      case 503:
      case 504:
        return 'El servicio no está disponible temporalmente.'
      default:
        return error.message || 'Error desconocido al cargar los datos.'
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    )
  }

  // Show error state
  if (error) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>
    }

    const severity = getErrorSeverity(error.status)
    const icon = getErrorIcon(error.status)
    const title = getErrorTitle(error.status)
    const message = getErrorMessage(error)
    const canRetry = onRetry && retryCount < maxRetries && isOnline

    return (
      <Card
        sx={{
          borderRadius: '16px',
          border: `2px solid ${
            severity === 'error' ? '#fee2e2' : 
            severity === 'warning' ? '#fef3c7' : '#dbeafe'
          }`,
          bgcolor: severity === 'error' ? '#fef2f2' : 
                   severity === 'warning' ? '#fffbeb' : '#eff6ff',
          minHeight: '200px'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={3}>
            {/* Error Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                color: severity === 'error' ? '#dc2626' : 
                       severity === 'warning' ? '#d97706' : '#2563eb',
                fontSize: 32 
              }}>
                {icon}
              </Box>
              <Box>
                <Typography variant="h6" sx={{ 
                  color: severity === 'error' ? '#dc2626' : 
                         severity === 'warning' ? '#d97706' : '#2563eb',
                  fontWeight: 700 
                }}>
                  {title}
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: severity === 'error' ? '#7f1d1d' : 
                         severity === 'warning' ? '#92400e' : '#1e40af'
                }}>
                  {message}
                </Typography>
              </Box>
            </Box>

            {/* Network Status */}
            {!isOnline && (
              <Alert severity="warning" sx={{ borderRadius: '12px' }}>
                <AlertTitle>Sin Conexión</AlertTitle>
                Verifique su conexión a internet para continuar.
              </Alert>
            )}

            {/* Error Details */}
            <Alert severity={severity} sx={{ borderRadius: '12px' }}>
              <AlertTitle>Información del Error</AlertTitle>
              {error.message}
              {error.status && (
                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    size="small"
                    label={`Código: ${error.status}`}
                    sx={{ 
                      bgcolor: severity === 'error' ? '#fee2e2' : 
                               severity === 'warning' ? '#fef3c7' : '#dbeafe',
                      color: severity === 'error' ? '#dc2626' : 
                             severity === 'warning' ? '#d97706' : '#2563eb'
                    }}
                  />
                  {retryCount > 0 && (
                    <Chip
                      size="small"
                      label={`Intento ${retryCount}/${maxRetries}`}
                      sx={{ 
                        bgcolor: '#f3f4f6',
                        color: '#6b7280'
                      }}
                    />
                  )}
                </Box>
              )}
            </Alert>

            {/* Retry Progress */}
            {isRetrying && showRetryProgress && (
              <Box>
                <Typography variant="body2" sx={{ mb: 1, color: '#6b7280' }}>
                  Reintentando conexión...
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={retryProgress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: '#f3f4f6',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#10b981',
                      borderRadius: 4
                    }
                  }}
                />
              </Box>
            )}

            {/* Action Buttons */}
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {canRetry && !isRetrying && (
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={handleManualRetry}
                  disabled={!isOnline}
                  sx={{
                    bgcolor: '#10b981',
                    '&:hover': { bgcolor: '#059669' },
                    '&:disabled': { bgcolor: '#d1d5db' }
                  }}
                >
                  Reintentar
                </Button>
              )}

              {isRetrying && (
                <Button
                  variant="outlined"
                  startIcon={<CircularProgress size={16} />}
                  disabled
                  sx={{
                    borderColor: '#d1d5db',
                    color: '#6b7280'
                  }}
                >
                  Reintentando...
                </Button>
              )}

              {retryCount >= maxRetries && (
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => window.location.reload()}
                  sx={{
                    borderColor: '#6b7280',
                    color: '#6b7280',
                    '&:hover': {
                      borderColor: '#4b5563',
                      bgcolor: '#f9fafb'
                    }
                  }}
                >
                  Recargar Página
                </Button>
              )}
            </Stack>

            {/* Help Text */}
            <Alert severity="info" sx={{ borderRadius: '12px' }}>
              <Typography variant="body2">
                {!isOnline 
                  ? 'Conecte a internet para continuar usando la aplicación.'
                  : retryCount >= maxRetries
                    ? 'Si el problema persiste, contacte al administrador del sistema.'
                    : 'El sistema intentará reconectar automáticamente.'
                }
              </Typography>
            </Alert>
          </Stack>
        </CardContent>
      </Card>
    )
  }

  // Show children when no error
  return <>{children}</>
}

export default ApiErrorBoundary
