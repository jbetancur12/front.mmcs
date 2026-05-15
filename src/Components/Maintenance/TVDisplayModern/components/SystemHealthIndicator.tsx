import React from 'react'
import { Box, Card, Typography, Chip, LinearProgress } from '@mui/material'
import { CheckCircle, Error, Wifi, Update } from '@mui/icons-material'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useModernStyles } from '../hooks/useModernStyles'

interface SystemHealthIndicatorProps {
  connectionStatus: 'connected' | 'disconnected' | 'connecting'
  lastUpdate: Date
  totalTickets: number
  systemLoad?: number
}

const SystemHealthIndicator: React.FC<SystemHealthIndicatorProps> = ({
  connectionStatus,
  lastUpdate,
  totalTickets,
  systemLoad = 0
}) => {
  const { modernColors } = useModernStyles()

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: <CheckCircle sx={{ fontSize: '1.8rem' }} />,
          label: 'SISTEMA OPERATIVO',
          color: 'success',
          bgColor: 'rgba(40, 167, 69, 0.1)',
          borderColor: modernColors.success
        }
      case 'connecting':
        return {
          icon: <Update sx={{ fontSize: '1.8rem' }} />,
          label: 'CONECTANDO...',
          color: 'warning',
          bgColor: 'rgba(255, 193, 7, 0.1)',
          borderColor: modernColors.warning
        }
      case 'disconnected':
        return {
          icon: <Error sx={{ fontSize: '1.8rem' }} />,
          label: 'SISTEMA DESCONECTADO',
          color: 'error',
          bgColor: 'rgba(220, 53, 69, 0.1)',
          borderColor: modernColors.danger
        }
    }
  }

  const statusConfig = getStatusConfig()

  return (
    <Card sx={{ 
      p: 3, 
      mb: 3, 
      backgroundColor: statusConfig.bgColor,
      border: `3px solid ${statusConfig.borderColor}`,
      borderRadius: '16px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2
      }}>
        {/* Estado Principal */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ color: statusConfig.borderColor }}>
            {statusConfig.icon}
          </Box>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 800,
              color: modernColors.textPrimary,
              fontSize: '1.5rem',
              textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            {statusConfig.label}
          </Typography>
        </Box>

        {/* Información del Sistema */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 3,
          flexWrap: 'wrap'
        }}>
          {/* Conexión */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Wifi sx={{ 
              fontSize: '1.3rem', 
              color: connectionStatus === 'connected' ? modernColors.success : modernColors.danger 
            }} />
            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
              {connectionStatus === 'connected' ? 'En Línea' : 'Fuera de Línea'}
            </Typography>
          </Box>

          {/* Total de Tickets */}
          <Chip
            label={`${totalTickets} Tickets Activos`}
            color={totalTickets > 20 ? 'warning' : 'default'}
            sx={{
              fontSize: '1rem',
              fontWeight: 700,
              height: '36px'
            }}
          />

          {/* Última Actualización */}
          <Typography 
            variant="body2" 
            sx={{ 
              color: modernColors.textSecondary,
              fontSize: '1rem',
              fontWeight: 500
            }}
          >
            Actualizado: {format(lastUpdate, 'HH:mm:ss', { locale: es })}
          </Typography>
        </Box>
      </Box>

      {/* Barra de Carga del Sistema (si está disponible) */}
      {systemLoad > 0 && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Carga del Sistema
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {systemLoad}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={systemLoad}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: systemLoad > 80 ? modernColors.danger : 
                               systemLoad > 60 ? modernColors.warning : 
                               modernColors.success,
                borderRadius: 4
              }
            }}
          />
        </Box>
      )}
    </Card>
  )
}

export default SystemHealthIndicator