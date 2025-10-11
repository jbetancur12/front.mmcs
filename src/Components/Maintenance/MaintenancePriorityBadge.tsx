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
      color: '#66BB6A',
      icon: <KeyboardArrowDown />
    },
    [MaintenancePriority.MEDIUM]: {
      label: 'Media',
      color: '#FFA726',
      icon: <KeyboardArrowUp />
    },
    [MaintenancePriority.HIGH]: {
      label: 'Alta',
      color: '#EF5350',
      icon: <PriorityHigh />
    },
    [MaintenancePriority.URGENT]: {
      label: 'Urgente',
      color: '#D32F2F',
      icon: <Warning />
    }
  }

  const config = PRIORITY_STYLES[priority] || {
    label: 'Desconocida',
    color: '#9E9E9E',
    icon: <KeyboardArrowUp />
  }

  const isUrgent = priority === MaintenancePriority.URGENT

  return (
    <>
      <Chip
        icon={config.icon}
        label={config.label}
        size={size}
        variant={variant}
        sx={{
          fontWeight: 500,
          borderRadius: '8px',
          transition: 'all 0.25s ease-in-out',
          backgroundColor: variant === 'filled' ? config.color : 'transparent',
          color: variant === 'filled' ? '#fff' : config.color,
          borderColor: variant === 'outlined' ? config.color : undefined,
          boxShadow:
            variant === 'filled'
              ? '0 0 10px rgba(0,0,0,0.25)'
              : '0 2px 6px rgba(0,0,0,0.1)',
          '& .MuiChip-icon': {
            fontSize: size === 'small' ? '1rem' : '1.2rem',
            color: variant === 'filled' ? '#fff' : config.color
          },
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow:
              variant === 'filled'
                ? '0 4px 12px rgba(0,0,0,0.35)'
                : '0 3px 8px rgba(0,0,0,0.15)'
          },
          ...(isUrgent && {
            animation: 'pulse 2s infinite'
          })
        }}
      />

      {/* Animación para prioridad URGENTE */}
      {isUrgent && (
        <style>
          {`
            @keyframes pulse {
              0% {
                transform: scale(1);
                box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.6);
              }
              70% {
                transform: scale(1.05);
                box-shadow: 0 0 0 10px rgba(211, 47, 47, 0);
              }
              100% {
                transform: scale(1);
                box-shadow: 0 0 0 0 rgba(211, 47, 47, 0);
              }
            }
          `}
        </style>
      )}
    </>
  )
}

export default MaintenancePriorityBadge
