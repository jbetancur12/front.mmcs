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
 * MaintenancePriorityBadge component displays the priority of a maintenance ticket
 * with appropriate colors and icons
 *
 * @param priority - The maintenance priority
 * @param size - Size of the badge
 * @param variant - Visual variant of the chip
 */
const MaintenancePriorityBadge: React.FC<MaintenancePriorityBadgeProps> = ({
  priority,
  size = 'small',
  variant = 'filled'
}) => {
  const getPriorityConfig = (priority: MaintenancePriority) => {
    switch (priority) {
      case MaintenancePriority.LOW:
        return {
          label: 'Baja',
          color: 'success' as const,
          icon: <KeyboardArrowDown />,
          sx: {
            backgroundColor: variant === 'filled' ? '#4caf50' : undefined,
            color: variant === 'filled' ? 'white' : '#4caf50',
            borderColor: variant === 'outlined' ? '#4caf50' : undefined
          }
        }
      case MaintenancePriority.MEDIUM:
        return {
          label: 'Media',
          color: 'warning' as const,
          icon: <KeyboardArrowUp />,
          sx: {
            backgroundColor: variant === 'filled' ? '#ff9800' : undefined,
            color: variant === 'filled' ? 'white' : '#ff9800',
            borderColor: variant === 'outlined' ? '#ff9800' : undefined
          }
        }
      case MaintenancePriority.HIGH:
        return {
          label: 'Alta',
          color: 'error' as const,
          icon: <PriorityHigh />,
          sx: {
            backgroundColor: variant === 'filled' ? '#f44336' : undefined,
            color: variant === 'filled' ? 'white' : '#f44336',
            borderColor: variant === 'outlined' ? '#f44336' : undefined
          }
        }
      case MaintenancePriority.URGENT:
        return {
          label: 'Urgente',
          color: 'error' as const,
          icon: <Warning />,
          sx: {
            backgroundColor: variant === 'filled' ? '#d32f2f' : undefined,
            color: variant === 'filled' ? 'white' : '#d32f2f',
            borderColor: variant === 'outlined' ? '#d32f2f' : undefined,
            animation: 'pulse 2s infinite'
          }
        }
      default:
        return {
          label: 'Desconocida',
          color: 'default' as const,
          icon: <KeyboardArrowUp />,
          sx: {}
        }
    }
  }

  const config = getPriorityConfig(priority)

  return (
    <>
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
          },
          ...config.sx
        }}
      />

      {/* Add keyframes for urgent priority animation */}
      {priority === MaintenancePriority.URGENT && (
        <style>
          {`
            @keyframes pulse {
              0% {
                opacity: 1;
              }
              50% {
                opacity: 0.7;
              }
              100% {
                opacity: 1;
              }
            }
          `}
        </style>
      )}
    </>
  )
}

export default MaintenancePriorityBadge
