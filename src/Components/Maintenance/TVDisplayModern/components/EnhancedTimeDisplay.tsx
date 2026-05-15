import React from 'react'
import { Box, Typography, Chip } from '@mui/material'
import { AccessTime, Warning } from '@mui/icons-material'
import { formatDistanceToNow, differenceInHours, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { useModernStyles } from '../hooks/useModernStyles'

interface EnhancedTimeDisplayProps {
  createdAt: string
  priority?: string
  size?: 'small' | 'medium' | 'large'
}

const EnhancedTimeDisplay: React.FC<EnhancedTimeDisplayProps> = ({
  createdAt,
  priority = 'medium',
  size = 'medium'
}) => {
  const { modernColors, tvTypography } = useModernStyles()
  
  const createdDate = new Date(createdAt)
  const now = new Date()
  const hoursElapsed = differenceInHours(now, createdDate)
  const daysElapsed = differenceInDays(now, createdDate)
  
  // Determinar si está vencido basado en prioridad
  const getOverdueStatus = () => {
    switch (priority) {
      case 'urgent':
        return hoursElapsed > 4 // 4 horas para urgentes
      case 'high':
        return hoursElapsed > 24 // 1 día para alta
      case 'medium':
        return daysElapsed > 3 // 3 días para media
      case 'low':
        return daysElapsed > 7 // 1 semana para baja
      default:
        return false
    }
  }

  const isOverdue = getOverdueStatus()
  const timeText = formatDistanceToNow(createdDate, { locale: es, addSuffix: false })

  const getTimeColor = () => {
    if (isOverdue) return modernColors.danger
    if (priority === 'urgent' && hoursElapsed > 2) return '#ff9800'
    return modernColors.textSecondary
  }

  const getIconSize = () => {
    switch (size) {
      case 'small': return '1.2rem'
      case 'large': return '2rem'
      default: return '1.5rem'
    }
  }

  const getTextSize = () => {
    switch (size) {
      case 'small': return '1rem'
      case 'large': return tvTypography.timeElapsed.fontSize
      default: return '1.2rem'
    }
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      flexWrap: 'wrap'
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 0.8,
        color: getTimeColor()
      }}>
        <AccessTime sx={{ 
          fontSize: getIconSize(),
          color: getTimeColor()
        }} />
        <Typography
          variant={size === 'large' ? 'h6' : 'body1'}
          sx={{
            fontWeight: 700,
            fontSize: getTextSize(),
            color: getTimeColor(),
            textShadow: size === 'large' ? '1px 1px 2px rgba(0,0,0,0.2)' : 'none'
          }}
        >
          {timeText}
        </Typography>
      </Box>
      
      {isOverdue && (
        <Chip
          icon={<Warning sx={{ fontSize: '1rem' }} />}
          label="VENCIDO"
          color="error"
          size={size === 'large' ? 'medium' : 'small'}
          sx={{
            fontWeight: 700,
            fontSize: size === 'large' ? '0.9rem' : '0.75rem',
            animation: 'pulse 2s infinite',
            '& .MuiChip-icon': {
              fontSize: size === 'large' ? '1.2rem' : '1rem'
            }
          }}
        />
      )}
      
      {priority === 'urgent' && hoursElapsed > 2 && !isOverdue && (
        <Chip
          label="ATENCIÓN"
          color="warning"
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: '0.7rem'
          }}
        />
      )}
    </Box>
  )
}

export default EnhancedTimeDisplay