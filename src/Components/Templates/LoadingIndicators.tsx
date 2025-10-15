// Loading Indicators for Async Operations
import React from 'react'
import {
  Box,
  CircularProgress,
  LinearProgress,
  Typography,
  Backdrop,
  Fade
} from '@mui/material'
import { colors } from '../../theme/designSystem'

interface LoadingIndicatorProps {
  variant?: 'circular' | 'linear' | 'backdrop' | 'inline' | 'button'
  size?: 'small' | 'medium' | 'large'
  message?: string
  progress?: number
  open?: boolean
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  variant = 'circular',
  size = 'medium',
  message,
  progress,
  open = true
}) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return 20
      case 'large':
        return 48
      default:
        return 32
    }
  }

  if (variant === 'backdrop') {
    return (
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.7)'
        }}
        open={open}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress
            color='inherit'
            size={getSize()}
            sx={{ marginBottom: 2 }}
          />
          {message && (
            <Typography variant='body1' color='inherit'>
              {message}
            </Typography>
          )}
        </Box>
      </Backdrop>
    )
  }

  if (variant === 'linear') {
    return (
      <Box sx={{ width: '100%', marginY: 2 }}>
        {message && (
          <Typography variant='body2' color='text.secondary' gutterBottom>
            {message}
          </Typography>
        )}
        <LinearProgress
          variant={progress !== undefined ? 'determinate' : 'indeterminate'}
          value={progress}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.gray[200],
            '& .MuiLinearProgress-bar': {
              backgroundColor: colors.primary[500],
              borderRadius: 3
            }
          }}
        />
        {progress !== undefined && (
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ marginTop: 1 }}
          >
            {Math.round(progress)}%
          </Typography>
        )}
      </Box>
    )
  }

  if (variant === 'inline') {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2,
          gap: 2
        }}
      >
        <CircularProgress
          size={getSize()}
          sx={{ color: colors.primary[500] }}
        />
        {message && (
          <Typography variant='body2' color='text.secondary'>
            {message}
          </Typography>
        )}
      </Box>
    )
  }

  if (variant === 'button') {
    return (
      <CircularProgress
        size={getSize()}
        sx={{
          color: 'inherit',
          marginRight: message ? 1 : 0
        }}
      />
    )
  }

  // Default circular variant
  return (
    <Fade in={open}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 4,
          gap: 2
        }}
      >
        <CircularProgress
          size={getSize()}
          sx={{ color: colors.primary[500] }}
        />
        {message && (
          <Typography variant='body2' color='text.secondary' textAlign='center'>
            {message}
          </Typography>
        )}
      </Box>
    </Fade>
  )
}

// Specific loading components for common use cases
export const ButtonLoadingIndicator: React.FC<{ loading: boolean }> = ({
  loading
}) => {
  if (!loading) return null
  return <LoadingIndicator variant='button' size='small' />
}

export const TableLoadingIndicator: React.FC<{ message?: string }> = ({
  message
}) => (
  <LoadingIndicator variant='inline' message={message || 'Cargando datos...'} />
)

export const PageLoadingIndicator: React.FC<{ message?: string }> = ({
  message
}) => (
  <LoadingIndicator
    variant='circular'
    size='large'
    message={message || 'Cargando página...'}
  />
)

export const ProgressLoadingIndicator: React.FC<{
  progress: number
  message?: string
}> = ({ progress, message }) => (
  <LoadingIndicator
    variant='linear'
    progress={progress}
    message={message || 'Procesando...'}
  />
)

export const OverlayLoadingIndicator: React.FC<{
  open: boolean
  message?: string
}> = ({ open, message }) => (
  <LoadingIndicator
    variant='backdrop'
    open={open}
    message={message || 'Procesando solicitud...'}
  />
)

export default LoadingIndicator
