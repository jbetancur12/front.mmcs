import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import {
  Alert,
  AlertTitle,
  IconButton,
  Box,
  Typography,
  Slide,
  Fade,
  Stack,
  Chip
} from '@mui/material'
import {
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Notifications as NotificationIcon
} from '@mui/icons-material'
import { TransitionProps } from '@mui/material/transitions'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title?: string
  message: string
  duration?: number
  persistent?: boolean
  action?: {
    label: string
    onClick: () => void
  }
  metadata?: Record<string, any>
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => string
  hideToast: (id: string) => void
  clearAllToasts: () => void
  showSuccess: (message: string, options?: Partial<Toast>) => string
  showError: (message: string, options?: Partial<Toast>) => string
  showWarning: (message: string, options?: Partial<Toast>) => string
  showInfo: (message: string, options?: Partial<Toast>) => string
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
  maxToasts?: number
  defaultDuration?: number
  position?: {
    vertical: 'top' | 'bottom'
    horizontal: 'left' | 'center' | 'right'
  }
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = 5,
  defaultDuration = 5000,
  position = { vertical: 'top', horizontal: 'right' }
}) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const showToast = useCallback((toast: Omit<Toast, 'id'>): string => {
    const id = generateId()
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? defaultDuration
    }

    setToasts(prev => {
      const updated = [newToast, ...prev]
      return updated.slice(0, maxToasts)
    })

    // Auto-hide non-persistent toasts
    if (!newToast.persistent && newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        hideToast(id)
      }, newToast.duration)
    }

    return id
  }, [defaultDuration, maxToasts])

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  const showSuccess = useCallback((message: string, options?: Partial<Toast>) => {
    return showToast({ ...options, type: 'success', message })
  }, [showToast])

  const showError = useCallback((message: string, options?: Partial<Toast>) => {
    return showToast({ 
      ...options, 
      type: 'error', 
      message,
      duration: options?.duration ?? 8000, // Longer duration for errors
      persistent: options?.persistent ?? false
    })
  }, [showToast])

  const showWarning = useCallback((message: string, options?: Partial<Toast>) => {
    return showToast({ ...options, type: 'warning', message })
  }, [showToast])

  const showInfo = useCallback((message: string, options?: Partial<Toast>) => {
    return showToast({ ...options, type: 'info', message })
  }, [showToast])

  const contextValue: ToastContextType = {
    showToast,
    hideToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer 
        toasts={toasts} 
        onClose={hideToast}
        position={position}
      />
    </ToastContext.Provider>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onClose: (id: string) => void
  position: {
    vertical: 'top' | 'bottom'
    horizontal: 'left' | 'center' | 'right'
  }
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose, position }) => {
  const getPositionStyles = () => {
    const styles: any = {
      position: 'fixed',
      zIndex: 9999,
      pointerEvents: 'none'
    }

    // Vertical positioning
    if (position.vertical === 'top') {
      styles.top = 24
    } else {
      styles.bottom = 24
    }

    // Horizontal positioning
    if (position.horizontal === 'left') {
      styles.left = 24
    } else if (position.horizontal === 'right') {
      styles.right = 24
    } else {
      styles.left = '50%'
      styles.transform = 'translateX(-50%)'
    }

    return styles
  }

  return (
    <Box sx={getPositionStyles()}>
      <Stack spacing={2} sx={{ width: 400, maxWidth: 'calc(100vw - 48px)' }}>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => onClose(toast.id)}
          />
        ))}
      </Stack>
    </Box>
  )
}

interface ToastItemProps {
  toast: Toast
  onClose: () => void
}



const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <SuccessIcon />
      case 'error':
        return <ErrorIcon />
      case 'warning':
        return <WarningIcon />
      case 'info':
        return <InfoIcon />
      default:
        return <NotificationIcon />
    }
  }

  const getSeverity = () => {
    return toast.type === 'info' ? 'info' : toast.type
  }

  return (
    <Fade in timeout={300}>
      <Box sx={{ pointerEvents: 'auto' }}>
        <Alert
          severity={getSeverity()}
          icon={getIcon()}
          sx={{
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(8px)',
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
          action={
            <Stack direction="row" spacing={1} alignItems="center">
              {toast.action && (
                <Chip
                  label={toast.action.label}
                  size="small"
                  onClick={toast.action.onClick}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.2)'
                    }
                  }}
                />
              )}
              <IconButton
                size="small"
                onClick={onClose}
                sx={{ color: 'inherit' }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          }
        >
          {toast.title && (
            <AlertTitle sx={{ fontWeight: 600, mb: 0.5 }}>
              {toast.title}
            </AlertTitle>
          )}
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {toast.message}
          </Typography>
          
          {toast.metadata && Object.keys(toast.metadata).length > 0 && (
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {Object.entries(toast.metadata).map(([key, value]) => (
                <Chip
                  key={key}
                  size="small"
                  label={`${key}: ${value}`}
                  variant="outlined"
                  sx={{
                    fontSize: '0.7rem',
                    height: 20,
                    bgcolor: 'rgba(255,255,255,0.1)',
                    borderColor: 'rgba(255,255,255,0.3)'
                  }}
                />
              ))}
            </Box>
          )}
        </Alert>
      </Box>
    </Fade>
  )
}

// Predefined toast configurations for common scenarios
export const ToastPresets = {
  // Success messages
  dataSaved: (entityName = 'Datos') => ({
    type: 'success' as ToastType,
    title: 'Guardado Exitoso',
    message: `${entityName} guardados correctamente`,
    duration: 3000
  }),

  dataDeleted: (entityName = 'Elemento') => ({
    type: 'success' as ToastType,
    title: 'Eliminación Exitosa',
    message: `${entityName} eliminado correctamente`,
    duration: 3000
  }),

  operationCompleted: (operation = 'Operación') => ({
    type: 'success' as ToastType,
    title: 'Operación Completada',
    message: `${operation} completada exitosamente`,
    duration: 4000
  }),

  // Error messages
  networkError: () => ({
    type: 'error' as ToastType,
    title: 'Error de Conexión',
    message: 'No se pudo conectar al servidor. Verifique su conexión a internet.',
    duration: 8000,
    persistent: false
  }),

  validationError: (field = 'campo') => ({
    type: 'error' as ToastType,
    title: 'Error de Validación',
    message: `Por favor, verifique el ${field} ingresado`,
    duration: 6000
  }),

  permissionError: () => ({
    type: 'error' as ToastType,
    title: 'Acceso Denegado',
    message: 'No tiene permisos para realizar esta acción',
    duration: 6000
  }),

  // Warning messages
  unsavedChanges: () => ({
    type: 'warning' as ToastType,
    title: 'Cambios sin Guardar',
    message: 'Tiene cambios sin guardar que se perderán',
    duration: 6000
  }),

  sessionExpiring: () => ({
    type: 'warning' as ToastType,
    title: 'Sesión por Expirar',
    message: 'Su sesión expirará en 5 minutos',
    duration: 10000,
    action: {
      label: 'Extender',
      onClick: () => {
        // Handle session extension
      }
    }
  }),

  // Info messages
  dataRefreshed: () => ({
    type: 'info' as ToastType,
    title: 'Datos Actualizados',
    message: 'Los datos han sido actualizados automáticamente',
    duration: 3000
  }),

  newFeature: (featureName: string) => ({
    type: 'info' as ToastType,
    title: 'Nueva Funcionalidad',
    message: `Ahora disponible: ${featureName}`,
    duration: 8000
  })
}

export default {
  ToastProvider,
  useToast,
  ToastPresets
}