import React from 'react'
import { Box, Typography, Card } from '@mui/material'
import { Build } from '@mui/icons-material'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ModernHeaderProps } from '../types'
import { useModernStyles } from '../hooks/useModernStyles'

const ModernHeader: React.FC<ModernHeaderProps> = ({
  currentTime,
  connectionStatus,
  companyName = 'MetroMedics',
  showLogo = true
}) => {
  const { modernColors } = useModernStyles()

  const getConnectionStatusText = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return 'Conectado'
      case 'connecting':
        return 'Conectando...'
      case 'disconnected':
        return 'Desconectado'
      default:
        return 'Desconocido'
    }
  }

  const getConnectionColor = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return modernColors.primary
      case 'connecting':
        return modernColors.warning
      case 'disconnected':
        return modernColors.danger
      default:
        return modernColors.textMuted
    }
  }

  return (
    <Box
      sx={{
        backgroundColor: modernColors.background,
        borderBottom: `2px solid ${modernColors.borderLight}`,
        py: 2,
        px: 4,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        minHeight: '80px'
      }}
    >
      {/* Logo and Title Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {showLogo && (
          <Box
            sx={{
              backgroundColor: modernColors.primary,
              borderRadius: '12px',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Build sx={{ fontSize: '2rem', color: 'white' }} />
          </Box>
        )}
        <Box>
          <Typography
            variant='h4'
            sx={{
              fontWeight: 800,
              color: modernColors.textPrimary,
              lineHeight: 1,
              mb: 0.5
            }}
          >
            <Box component="span" sx={{ color: modernColors.primary }}>
              {companyName.slice(0, 5)}
            </Box>
            {companyName.slice(5)}
          </Typography>
          <Typography
            variant='h6'
            sx={{
              color: modernColors.textSecondary,
              fontWeight: 500,
              lineHeight: 1
            }}
          >
            Centro de Mantenimiento
          </Typography>
        </Box>
      </Box>

      {/* Status and Time Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* Connection Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: getConnectionColor(),
              boxShadow: `0 0 12px ${getConnectionColor()}40`
            }}
          />
          <Typography
            variant='body2'
            sx={{
              color: modernColors.textSecondary,
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            {getConnectionStatusText()}
          </Typography>
        </Box>

        {/* Digital Clock */}
        <Card
          sx={{
            backgroundColor: modernColors.secondaryBackground,
            border: `1px solid ${modernColors.border}`,
            borderRadius: '12px',
            p: 2,
            minWidth: '200px',
            textAlign: 'center'
          }}
        >
          <Typography
            variant='h3'
            sx={{
              fontWeight: 700,
              color: modernColors.textPrimary,
              lineHeight: 1,
              mb: 0.5,
              fontFamily: 'monospace'
            }}
          >
            {format(currentTime, 'HH:mm:ss')}
          </Typography>
          <Typography
            variant='body2'
            sx={{
              color: modernColors.textSecondary,
              fontSize: '0.85rem',
              fontWeight: 500,
              textTransform: 'capitalize'
            }}
          >
            {format(currentTime, "EEEE, d 'de' MMMM", { locale: es })}
          </Typography>
        </Card>
      </Box>
    </Box>
  )
}

export default ModernHeader