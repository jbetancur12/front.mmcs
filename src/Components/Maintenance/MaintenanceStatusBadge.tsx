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
import { neutral, intent } from 'src/theme/designTokens'

interface MaintenanceStatusBadgeProps {
  status: MaintenanceStatus
  size?: 'small' | 'medium' | 'large'
  variant?: 'filled' | 'outlined'
  tvMode?: boolean
}

const MaintenanceStatusBadge: React.FC<MaintenanceStatusBadgeProps> = ({
  status,
  size = 'small',
  variant = 'filled',
  tvMode = false
}) => {
  const getStatusConfig = (status: MaintenanceStatus) => {
    switch (status) {
      case MaintenanceStatus.PENDING:
        return {
          label: 'Pendiente',
          backgroundColor: intent.warningSoft,
          textColor: intent.dangerInk,
          borderColor: intent.warningSoft,
          icon: <HourglassEmpty />
        }
      case MaintenanceStatus.ASSIGNED:
        return {
          label: 'Asignado',
          backgroundColor: intent.infoSoft,
          textColor: intent.info,
          borderColor: intent.infoSoft,
          icon: <Assignment />
        }
      case MaintenanceStatus.IN_PROGRESS:
        return {
          label: 'En Progreso',
          backgroundColor: intent.successSoft,
          textColor: intent.successInk,
          borderColor: intent.successSoft,
          icon: <Build />
        }
      case MaintenanceStatus.ON_HOLD:
        return {
          label: 'En Pausa',
          backgroundColor: neutral.surfaceAlt,
          textColor: '#7e22ce',
          borderColor: '#e9d5ff',
          icon: <Pause />
        }
      case MaintenanceStatus.WAITING_PARTS:
        return {
          label: 'Esperando Partes',
          backgroundColor: neutral.surfaceAlt,
          textColor: neutral.textBody,
          borderColor: neutral.borderStrong,
          icon: <Inventory />
        }
      case MaintenanceStatus.COMPLETED:
        return {
          label: 'Completado',
          backgroundColor: intent.successSoft,
          textColor: intent.successInk,
          borderColor: intent.successSoft,
          icon: <CheckCircle />
        }
      case MaintenanceStatus.CANCELLED:
        return {
          label: 'Cancelado',
          backgroundColor: intent.dangerSoft,
          textColor: intent.dangerInk,
          borderColor: intent.dangerSoft,
          icon: <Cancel />
        }
      default:
        return {
          label: 'Desconocido',
          backgroundColor: neutral.surfaceAlt,
          textColor: neutral.textBody,
          borderColor: neutral.borderStrong,
          icon: <HourglassEmpty />
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <Chip
      icon={config.icon}
      label={config.label}
      size={size === 'large' ? 'medium' : size}
      variant={variant}
      sx={{
        backgroundColor:
          variant === 'filled' ? config.backgroundColor : neutral.surface,
        color: config.textColor,
        border: `1px solid ${config.borderColor}`,
        fontWeight: 600,
        borderRadius: '999px',
        fontSize: tvMode ? '1rem' : '0.8rem',
        padding: tvMode ? '0.55rem 0.75rem' : '0.2rem 0.45rem',
        minHeight: tvMode ? 40 : 28,
        boxShadow: 'none',
        '& .MuiChip-icon': {
          color: config.textColor,
          fontSize: tvMode ? '1.3rem' : '1rem',
          marginLeft: '4px'
        },
        '&:hover': {
          backgroundColor: config.backgroundColor,
          borderColor: config.textColor
        },
        transition: 'border-color 0.2s ease, background-color 0.2s ease'
      }}
    />
  )
}

export default MaintenanceStatusBadge
