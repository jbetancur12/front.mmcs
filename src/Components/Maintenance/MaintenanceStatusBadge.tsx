import React from 'react'
import { Chip } from '@mui/material'
import {
  HourglassEmpty,
  Assignment,
  Build,
  Pause,
  Inventory,
  CheckCircle,
  Cancel
} from '@mui/icons-material'
import { MaintenanceStatus } from '../../types/maintenance'

interface MaintenanceStatusBadgeProps {
  status: MaintenanceStatus
  size?: 'small' | 'medium'
  variant?: 'filled' | 'outlined'
}

/**
 * MaintenanceStatusBadge component displays the status of a maintenance ticket
 * with appropriate colors and icons
 *
 * @param status - The maintenance status
 * @param size - Size of the badge
 * @param variant - Visual variant of the chip
 */
const MaintenanceStatusBadge: React.FC<MaintenanceStatusBadgeProps> = ({
  status,
  size = 'small',
  variant = 'filled'
}) => {
  const getStatusConfig = (status: MaintenanceStatus) => {
    switch (status) {
      case MaintenanceStatus.PENDING:
        return {
          label: 'Pendiente',
          color: 'warning' as const,
          icon: <HourglassEmpty />
        }
      case MaintenanceStatus.ASSIGNED:
        return {
          label: 'Asignado',
          color: 'info' as const,
          icon: <Assignment />
        }
      case MaintenanceStatus.IN_PROGRESS:
        return {
          label: 'En Progreso',
          color: 'primary' as const,
          icon: <Build />
        }
      case MaintenanceStatus.ON_HOLD:
        return {
          label: 'En Pausa',
          color: 'secondary' as const,
          icon: <Pause />
        }
      case MaintenanceStatus.WAITING_PARTS:
        return {
          label: 'Esperando Partes',
          color: 'default' as const,
          icon: <Inventory />
        }
      case MaintenanceStatus.COMPLETED:
        return {
          label: 'Completado',
          color: 'success' as const,
          icon: <CheckCircle />
        }
      case MaintenanceStatus.CANCELLED:
        return {
          label: 'Cancelado',
          color: 'error' as const,
          icon: <Cancel />
        }
      default:
        return {
          label: 'Desconocido',
          color: 'default' as const,
          icon: <HourglassEmpty />
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <Chip
      icon={config.icon}
      label={config.label}
      color={config.color}
      size={size}
      variant={variant}
      sx={{
        fontWeight: 'medium',
        '& .MuiChip-icon': {
          fontSize: size === 'small' ? '0.875rem' : '1rem'
        }
      }}
    />
  )
}

export default MaintenanceStatusBadge
