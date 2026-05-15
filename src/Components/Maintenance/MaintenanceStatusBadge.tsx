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
          backgroundColor: '#fff7ed',
          textColor: '#c2410c',
          borderColor: '#fed7aa',
          icon: <HourglassEmpty />
        }
      case MaintenanceStatus.ASSIGNED:
        return {
          label: 'Asignado',
          backgroundColor: '#eff6ff',
          textColor: '#1d4ed8',
          borderColor: '#bfdbfe',
          icon: <Assignment />
        }
      case MaintenanceStatus.IN_PROGRESS:
        return {
          label: 'En Progreso',
          backgroundColor: '#ecfdf5',
          textColor: '#047857',
          borderColor: '#a7f3d0',
          icon: <Build />
        }
      case MaintenanceStatus.ON_HOLD:
        return {
          label: 'En Pausa',
          backgroundColor: '#faf5ff',
          textColor: '#7e22ce',
          borderColor: '#e9d5ff',
          icon: <Pause />
        }
      case MaintenanceStatus.WAITING_PARTS:
        return {
          label: 'Esperando Partes',
          backgroundColor: '#f8fafc',
          textColor: '#475569',
          borderColor: '#cbd5e1',
          icon: <Inventory />
        }
      case MaintenanceStatus.COMPLETED:
        return {
          label: 'Completado',
          backgroundColor: '#ecfdf5',
          textColor: '#166534',
          borderColor: '#bbf7d0',
          icon: <CheckCircle />
        }
      case MaintenanceStatus.CANCELLED:
        return {
          label: 'Cancelado',
          backgroundColor: '#fef2f2',
          textColor: '#b91c1c',
          borderColor: '#fecaca',
          icon: <Cancel />
        }
      default:
        return {
          label: 'Desconocido',
          backgroundColor: '#f8fafc',
          textColor: '#475569',
          borderColor: '#cbd5e1',
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
          variant === 'filled' ? config.backgroundColor : '#ffffff',
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
