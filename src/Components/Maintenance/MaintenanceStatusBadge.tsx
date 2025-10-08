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
        return { label: 'Pendiente', color: '#FFB300', icon: <HourglassEmpty /> }
      case MaintenanceStatus.ASSIGNED:
        return { label: 'Asignado', color: '#1E88E5', icon: <Assignment /> }
      case MaintenanceStatus.IN_PROGRESS:
        return { label: 'En Progreso', color: '#00E676', icon: <Build /> }
      case MaintenanceStatus.ON_HOLD:
        return { label: 'En Pausa', color: '#9C27B0', icon: <Pause /> }
      case MaintenanceStatus.WAITING_PARTS:
        return { label: 'Esperando Partes', color: '#757575', icon: <Inventory /> }
      case MaintenanceStatus.COMPLETED:
        return { label: 'Completado', color: '#4CAF50', icon: <CheckCircle /> }
      case MaintenanceStatus.CANCELLED:
        return { label: 'Cancelado', color: '#E53935', icon: <Cancel /> }
      default:
        return { label: 'Desconocido', color: '#BDBDBD', icon: <HourglassEmpty /> }
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
        backgroundColor: variant === 'filled' ? config.color : 'transparent',
        color: variant === 'filled' ? '#fff' : config.color,
        borderColor: config.color,
        fontWeight: 600,
        borderRadius: '12px',
        fontSize: tvMode ? '1.1rem' : '0.85rem',
        padding: tvMode ? '0.6rem 0.8rem' : '0.25rem 0.5rem',
        minHeight: tvMode ? 40 : 28,
        boxShadow: variant === 'filled'
          ? '0 3px 10px rgba(0, 0, 0, 0.25)'
          : 'none',
        '& .MuiChip-icon': {
          color: variant === 'filled' ? '#fff' : config.color,
          fontSize: tvMode ? '1.3rem' : '1rem',
          marginLeft: '4px'
        },
        '&:hover': {
          transform: tvMode ? 'none' : 'translateY(-1px)',
          opacity: tvMode ? 1 : 0.9
        },
        transition: 'all 0.2s ease-in-out'
      }}
    />
  )
}

export default MaintenanceStatusBadge
