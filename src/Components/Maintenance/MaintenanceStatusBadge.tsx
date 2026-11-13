import React from 'react'
import { Chip } from '@mui/material'
import {
  HourglassEmpty,
  Assignment,
  Build,
  Pause,
  Inventory,
  SupportAgent,
  CheckCircle,
  Cancel
} from '@mui/icons-material'
import { MaintenanceStatus } from '../../types/maintenance'
import { MAINTENANCE_STATUS_LABELS } from './maintenanceLabels'
import { brand, neutral, intent, accent } from 'src/theme/designTokens'

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
          label: MAINTENANCE_STATUS_LABELS[status],
          backgroundColor: intent.warningSoft,
          textColor: intent.dangerInk,
          borderColor: intent.warningSoft,
          icon: <HourglassEmpty />
        }
      case MaintenanceStatus.ASSIGNED:
        return {
          label: MAINTENANCE_STATUS_LABELS[status],
          backgroundColor: intent.infoSoft,
          textColor: intent.info,
          borderColor: intent.infoSoft,
          icon: <Assignment />
        }
      case MaintenanceStatus.IN_PROGRESS:
        return {
          label: MAINTENANCE_STATUS_LABELS[status],
          backgroundColor: brand.soft,
          textColor: brand.ink,
          borderColor: brand.soft,
          icon: <Build />
        }
      case MaintenanceStatus.ON_HOLD:
        return {
          label: MAINTENANCE_STATUS_LABELS[status],
          backgroundColor: neutral.surfaceAlt,
          textColor: accent.ink,
          borderColor: accent.soft,
          icon: <Pause />
        }
      case MaintenanceStatus.WAITING_PARTS:
        return {
          label: MAINTENANCE_STATUS_LABELS[status],
          backgroundColor: neutral.surfaceAlt,
          textColor: neutral.textBody,
          borderColor: neutral.borderStrong,
          icon: <Inventory />
        }
      case MaintenanceStatus.WAITING_CUSTOMER:
        return {
          label: MAINTENANCE_STATUS_LABELS[status],
          backgroundColor: neutral.surfaceAlt,
          textColor: neutral.textBody,
          borderColor: neutral.borderStrong,
          icon: <SupportAgent />
        }
      case MaintenanceStatus.COMPLETED:
        return {
          label: MAINTENANCE_STATUS_LABELS[status],
          backgroundColor: brand.soft,
          textColor: brand.ink,
          borderColor: brand.soft,
          icon: <CheckCircle />
        }
      case MaintenanceStatus.CANCELLED:
        return {
          label: MAINTENANCE_STATUS_LABELS[status],
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
