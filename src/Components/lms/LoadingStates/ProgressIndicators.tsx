import React, { useState, useEffect } from 'react'
import {
  Box,
  LinearProgress,
  CircularProgress,
  Typography,
  Card,
  CardContent,
  Fade,
  Backdrop,
  Modal,
  Stack,
  Chip
} from '@mui/material'
import {
  Sync as SyncIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material'

interface ProgressIndicatorProps {
  progress: number
  label?: string
  showPercentage?: boolean
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size?: 'small' | 'medium' | 'large'
  variant?: 'linear' | 'circular'
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  label,
  showPercentage = true,
  color = 'primary',
  size = 'medium',
  variant = 'linear'
}) => {
  const getSize = () => {
    switch (size) {
      case 'small': return variant === 'circular' ? 24 : 4
      case 'large': return variant === 'circular' ? 60 : 12
      default: return variant === 'circular' ? 40 : 8
    }
  }

  if (variant === 'circular') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ position: 'relative' }}>
          <CircularProgress
            variant="determinate"
            value={progress}
            size={getSize()}
            color={color}
          />
          {showPercentage && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography
                variant="caption"
                component="div"
                color="text.secondary"
                sx={{ fontSize: size === 'small' ? '0.6rem' : '0.75rem' }}
              >
                {`${Math.round(progress)}%`}
              </Typography>
            </Box>
          )}
        </Box>
        {label && (
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        )}
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%' }}>
      {label && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          {showPercentage && (
            <Typography variant="body2" color="text.secondary">
              {`${Math.round(progress)}%`}
            </Typography>
          )}
        </Box>
      )}
      <LinearProgress
        variant="determinate"
        value={progress}
        color={color}
        sx={{
          height: getSize(),
          borderRadius: getSize() / 2,
          bgcolor: 'rgba(0,0,0,0.1)',
          '& .MuiLinearProgress-bar': {
            borderRadius: getSize() / 2
          }
        }}
      />
    </Box>
  )
}

interface AnimatedProgressProps {
  duration?: number
  onComplete?: () => void
  label?: string
  steps?: string[]
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  duration = 3000,
  onComplete,
  label = 'Cargando...',
  steps = []
}) => {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (duration / 100))
        
        if (steps.length > 0) {
          const stepIndex = Math.floor((newProgress / 100) * steps.length)
          setCurrentStep(Math.min(stepIndex, steps.length - 1))
        }
        
        if (newProgress >= 100) {
          clearInterval(interval)
          if (onComplete) {
            setTimeout(onComplete, 500)
          }
          return 100
        }
        
        return newProgress
      })
    }, 100)

    return () => clearInterval(interval)
  }, [duration, onComplete, steps.length])

  return (
    <Box sx={{ width: '100%' }}>
      <ProgressIndicator
        progress={progress}
        label={steps.length > 0 ? steps[currentStep] : label}
        showPercentage={true}
        color="primary"
      />
    </Box>
  )
}

interface LoadingOverlayProps {
  open: boolean
  message?: string
  progress?: number
  showProgress?: boolean
  onClose?: () => void
  backdrop?: boolean
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  open,
  message = 'Cargando...',
  progress,
  showProgress = false,
  onClose,
  backdrop = true
}) => {
  if (backdrop) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
          sx: { bgcolor: 'rgba(0,0,0,0.7)' }
        }}
      >
        <Fade in={open}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 400,
              maxWidth: '90vw'
            }}
          >
            <Card sx={{ borderRadius: '16px' }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Stack spacing={3} alignItems="center">
                  {showProgress && typeof progress === 'number' ? (
                    <ProgressIndicator
                      progress={progress}
                      variant="circular"
                      size="large"
                      showPercentage={true}
                    />
                  ) : (
                    <CircularProgress size={60} />
                  )}
                  <Typography variant="h6" color="text.primary">
                    {message}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Fade>
      </Modal>
    )
  }

  return (
    <Fade in={open}>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(255,255,255,0.9)',
          zIndex: 1000
        }}
      >
        <Card sx={{ borderRadius: '12px', minWidth: 200 }}>
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Stack spacing={2} alignItems="center">
              {showProgress && typeof progress === 'number' ? (
                <ProgressIndicator
                  progress={progress}
                  variant="circular"
                  showPercentage={true}
                />
              ) : (
                <CircularProgress />
              )}
              <Typography variant="body1" color="text.primary">
                {message}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Fade>
  )
}

interface OperationProgressProps {
  operations: {
    id: string
    label: string
    status: 'pending' | 'running' | 'completed' | 'error'
    progress?: number
    error?: string
  }[]
  title?: string
}

export const OperationProgress: React.FC<OperationProgressProps> = ({
  operations,
  title = 'Operaciones en Progreso'
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckIcon sx={{ color: '#10b981' }} />
      case 'error':
        return <ErrorIcon sx={{ color: '#dc2626' }} />
      case 'running':
        return <CircularProgress size={20} />
      default:
        return <SyncIcon sx={{ color: '#6b7280' }} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981'
      case 'error':
        return '#dc2626'
      case 'running':
        return '#3b82f6'
      default:
        return '#6b7280'
    }
  }

  return (
    <Card sx={{ borderRadius: '16px' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          {title}
        </Typography>
        
        <Stack spacing={2}>
          {operations.map((operation) => (
            <Box key={operation.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {getStatusIcon(operation.status)}
                <Typography
                  variant="body2"
                  sx={{ ml: 2, flex: 1, fontWeight: 500 }}
                >
                  {operation.label}
                </Typography>
                <Chip
                  size="small"
                  label={operation.status === 'running' ? 'En progreso' : 
                         operation.status === 'completed' ? 'Completado' :
                         operation.status === 'error' ? 'Error' : 'Pendiente'}
                  sx={{
                    bgcolor: `${getStatusColor(operation.status)}20`,
                    color: getStatusColor(operation.status),
                    fontWeight: 600,
                    fontSize: '0.7rem'
                  }}
                />
              </Box>
              
              {operation.status === 'running' && typeof operation.progress === 'number' && (
                <ProgressIndicator
                  progress={operation.progress}
                  showPercentage={true}
                  size="small"
                />
              )}
              
              {operation.status === 'error' && operation.error && (
                <Typography
                  variant="caption"
                  sx={{ color: '#dc2626', ml: 4, display: 'block' }}
                >
                  {operation.error}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}

// Hook for managing loading states
export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')

  const startLoading = (msg = 'Cargando...') => {
    setIsLoading(true)
    setProgress(0)
    setMessage(msg)
  }

  const updateProgress = (newProgress: number, newMessage?: string) => {
    setProgress(Math.min(100, Math.max(0, newProgress)))
    if (newMessage) setMessage(newMessage)
  }

  const stopLoading = () => {
    setIsLoading(false)
    setProgress(0)
    setMessage('')
  }

  return {
    isLoading,
    progress,
    message,
    startLoading,
    updateProgress,
    stopLoading
  }
}

export default {
  ProgressIndicator,
  AnimatedProgress,
  LoadingOverlay,
  OperationProgress,
  useLoadingState
}
