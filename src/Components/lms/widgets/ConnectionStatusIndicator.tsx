import React from 'react'
import {
  Box,
  Chip,
  Tooltip,
  IconButton,
  Typography,
  Fade,
  CircularProgress
} from '@mui/material'
import {
  Wifi as ConnectedIcon,
  WifiOff as DisconnectedIcon,
  Refresh as RefreshIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material'

interface ConnectionStatusIndicatorProps {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  connectionAttempts: number
  maxAttempts?: number
  onRefresh?: () => void
  showLabel?: boolean
  size?: 'small' | 'medium'
}

const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  isConnected,
  isConnecting,
  error,
  connectionAttempts,
  maxAttempts = 5,
  onRefresh,
  showLabel = true,
  size = 'medium'
}) => {
  const getStatusColor = () => {
    if (isConnecting) return '#f59e0b' // amber
    if (isConnected) return '#10b981' // emerald
    if (error) return '#ef4444' // red
    return '#6b7280' // gray
  }

  const getStatusIcon = () => {
    if (isConnecting) {
      return <CircularProgress size={16} sx={{ color: getStatusColor() }} />
    }
    if (isConnected) {
      return <ConnectedIcon sx={{ fontSize: size === 'small' ? 16 : 20 }} />
    }
    if (error) {
      return <ErrorIcon sx={{ fontSize: size === 'small' ? 16 : 20 }} />
    }
    return <DisconnectedIcon sx={{ fontSize: size === 'small' ? 16 : 20 }} />
  }

  const getStatusText = () => {
    if (isConnecting) {
      return connectionAttempts > 0 
        ? `Reconectando... (${connectionAttempts}/${maxAttempts})`
        : 'Conectando...'
    }
    if (isConnected) return 'Conectado'
    if (error) return 'Error de conexión'
    return 'Desconectado'
  }

  const getTooltipText = () => {
    if (isConnecting) {
      return connectionAttempts > 0 
        ? `Reintentando conexión WebSocket (${connectionAttempts}/${maxAttempts})`
        : 'Estableciendo conexión WebSocket para actualizaciones en tiempo real'
    }
    if (isConnected) {
      return 'Conexión WebSocket activa - Recibiendo actualizaciones en tiempo real'
    }
    if (error) {
      return `Error en conexión WebSocket: ${error}. Las notificaciones pueden no actualizarse automáticamente.`
    }
    return 'Sin conexión WebSocket - Las notificaciones no se actualizarán automáticamente'
  }

  const shouldShowWarning = connectionAttempts > 0 && connectionAttempts < maxAttempts
  const shouldShowError = connectionAttempts >= maxAttempts || (error && !isConnecting)

  if (size === 'small' && !showLabel) {
    return (
      <Tooltip title={getTooltipText()} arrow>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}
        >
          <Box
            sx={{
              color: getStatusColor(),
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {getStatusIcon()}
          </Box>
          {onRefresh && (shouldShowWarning || shouldShowError) && (
            <IconButton
              size="small"
              onClick={onRefresh}
              sx={{
                color: getStatusColor(),
                padding: 0.25,
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.04)'
                }
              }}
            >
              <RefreshIcon sx={{ fontSize: 14 }} />
            </IconButton>
          )}
        </Box>
      </Tooltip>
    )
  }

  return (
    <Fade in timeout={300}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <Tooltip title={getTooltipText()} arrow>
          <Chip
            icon={getStatusIcon()}
            label={showLabel ? getStatusText() : undefined}
            size={size}
            variant={isConnected ? 'filled' : 'outlined'}
            sx={{
              bgcolor: isConnected ? `${getStatusColor()}15` : 'transparent',
              borderColor: getStatusColor(),
              color: getStatusColor(),
              fontWeight: 600,
              fontSize: size === 'small' ? '0.75rem' : '0.8rem',
              '& .MuiChip-icon': {
                color: getStatusColor()
              },
              '& .MuiChip-label': {
                px: showLabel ? 1 : 0
              },
              ...(shouldShowWarning && {
                bgcolor: '#fef3c7',
                borderColor: '#f59e0b',
                color: '#d97706'
              }),
              ...(shouldShowError && {
                bgcolor: '#fee2e2',
                borderColor: '#ef4444',
                color: '#dc2626'
              })
            }}
          />
        </Tooltip>

        {/* Manual refresh button */}
        {onRefresh && (shouldShowWarning || shouldShowError || !isConnected) && (
          <Tooltip title="Reconectar manualmente" arrow>
            <IconButton
              size="small"
              onClick={onRefresh}
              disabled={isConnecting}
              sx={{
                color: getStatusColor(),
                '&:hover': {
                  bgcolor: `${getStatusColor()}10`
                },
                '&:disabled': {
                  color: '#9ca3af'
                }
              }}
            >
              <RefreshIcon sx={{ fontSize: size === 'small' ? 16 : 18 }} />
            </IconButton>
          </Tooltip>
        )}

        {/* Connection attempts warning */}
        {shouldShowWarning && (
          <Tooltip 
            title={`Reintentando conexión (${connectionAttempts}/${maxAttempts}). Si persiste el problema, verifique su conexión a internet.`}
            arrow
          >
            <WarningIcon 
              sx={{ 
                fontSize: 16, 
                color: '#f59e0b',
                animation: 'pulse 2s infinite'
              }} 
            />
          </Tooltip>
        )}

        {/* Max attempts reached error */}
        {shouldShowError && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ErrorIcon sx={{ fontSize: 16, color: '#ef4444' }} />
            {showLabel && (
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#ef4444',
                  fontWeight: 500,
                  fontSize: '0.7rem'
                }}
              >
                Sin conexión en tiempo real
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Fade>
  )
}

export default ConnectionStatusIndicator