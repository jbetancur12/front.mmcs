import React from 'react'
import { Chip } from '@mui/material'
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  PriorityHigh,
  Warning
} from '@mui/icons-material'
import { MaintenancePriority } from '../../types/maintenance'

interface MaintenancePriorityBadgeProps {
  priority: MaintenancePriority
  size?: 'small' | 'medium'
  variant?: 'filled' | 'outlined'
}

/**
 * Muestra la prioridad de un ticket de mantenimiento con colores e íconos.
 * Optimizado para dashboards (pantallas grandes o TV).
 */
const MaintenancePriorityBadge: React.FC<MaintenancePriorityBadgeProps> = ({
  priority,
  size = 'small',
  variant = 'filled'
}) => {
  const PRIORITY_STYLES = {
    [MaintenancePriority.LOW]: {
      label: 'Baja',
      backgroundColor: '#ecfdf5',
      textColor: '#166534',
      borderColor: '#bbf7d0',
      icon: <KeyboardArrowDown />
    },
    [MaintenancePriority.MEDIUM]: {
      label: 'Media',
      backgroundColor: '#fff7ed',
      textColor: '#c2410c',
      borderColor: '#fed7aa',
      icon: <KeyboardArrowUp />
    },
    [MaintenancePriority.HIGH]: {
      label: 'Alta',
      backgroundColor: '#fef2f2',
      textColor: '#b91c1c',
      borderColor: '#fecaca',
      icon: <PriorityHigh />
    },
    [MaintenancePriority.URGENT]: {
      label: 'Urgente',
      backgroundColor: '#ffe4e6',
      textColor: '#be123c',
      borderColor: '#fb7185',
      icon: <Warning />
    }
  }

  const config = PRIORITY_STYLES[priority] || {
    label: 'Desconocida',
    backgroundColor: '#f8fafc',
    textColor: '#475569',
    borderColor: '#cbd5e1',
    icon: <KeyboardArrowUp />
  }
  const isUrgent = priority === MaintenancePriority.URGENT

  return (
    <Chip
      icon={config.icon}
      label={config.label}
      size={size}
      variant={variant}
      sx={{
        fontWeight: 600,
        borderRadius: '999px',
        height: size === 'small' ? 24 : 30,
        fontSize: size === 'small' ? '0.72rem' : '0.8rem',
        transition: 'border-color 0.2s ease, background-color 0.2s ease',
        backgroundColor:
          variant === 'filled' ? config.backgroundColor : '#ffffff',
        color: config.textColor,
        border: `1px solid ${config.borderColor}`,
        boxShadow: isUrgent ? '0 0 0 1px rgba(225, 29, 72, 0.08)' : 'none',
        '& .MuiChip-icon': {
          fontSize: size === 'small' ? '0.95rem' : '1.05rem',
          color: config.textColor
        },
        '&:hover': {
          backgroundColor: config.backgroundColor,
          borderColor: config.textColor,
          boxShadow: isUrgent ? '0 4px 10px rgba(190, 18, 60, 0.12)' : 'none'
        },
        ...(isUrgent && {
          fontWeight: 700
        })
      }}
    />
  )
}

export default MaintenancePriorityBadge
