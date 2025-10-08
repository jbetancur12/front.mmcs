import React from 'react'
import { Card, CardContent, Box, Typography, Chip } from '@mui/material'
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material'
import { useModernStyles } from '../hooks/useModernStyles'

interface EnhancedMetricCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  borderColor: string
  isUrgent?: boolean
  trend?: {
    value: number
    period: string
  }
  subtitle?: string
  contextInfo?: string
}

const EnhancedMetricCard: React.FC<EnhancedMetricCardProps> = ({
  title,
  value,
  icon,
  color,
  borderColor,
  isUrgent = false,
  trend,
  subtitle,
  contextInfo
}) => {
  const { cardStyles, iconContainerStyles, modernColors, tvTypography, tvAnimations } = useModernStyles()

  const getTrendIcon = () => {
    if (!trend) return null
    
    if (trend.value > 5) return <TrendingUp sx={{ fontSize: '1rem' }} />
    if (trend.value < -5) return <TrendingDown sx={{ fontSize: '1rem' }} />
    return <TrendingFlat sx={{ fontSize: '1rem' }} />
  }

  const getTrendColor = () => {
    if (!trend) return 'default'
    if (trend.value > 5) return 'success'
    if (trend.value < -5) return 'error'
    return 'default'
  }

  return (
    <Card
      sx={{
        ...cardStyles.base,
        ...cardStyles.metric,
        borderLeft: `8px solid ${borderColor}`, // Borde más grueso para TV
        ...(isUrgent && {
          ...cardStyles.urgent,
          ...tvAnimations.subtlePulse,
          animation: 'subtlePulse 3s infinite'
        })
      }}
    >
      <CardContent sx={{ 
        p: 4, // Más padding para TV
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center' 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box
            sx={{
              ...iconContainerStyles.base,
              ...iconContainerStyles[color as keyof typeof iconContainerStyles],
              width: '56px', // Más grande para TV
              height: '56px'
            }}
          >
            {React.cloneElement(icon as React.ReactElement, { 
              sx: { fontSize: '2rem', color: 'white' } // Icono más grande
            })}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant='h2'
              sx={{
                ...tvTypography.metricNumber,
                color: modernColors.textPrimary,
                lineHeight: 1,
                mb: 0.5
              }}
            >
              {value}
            </Typography>
            {trend && (
              <Chip
                icon={getTrendIcon()}
                label={`${trend.value > 0 ? '+' : ''}${trend.value}% ${trend.period}`}
                color={getTrendColor()}
                size="small"
                sx={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  height: '24px'
                }}
              />
            )}
          </Box>
        </Box>

        <Typography
          variant='h6'
          sx={{
            color: modernColors.textSecondary,
            fontWeight: 700,
            fontSize: '1.2rem', // Más grande para TV
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            mb: subtitle || contextInfo ? 1 : 0
          }}
        >
          {title}
        </Typography>

        {subtitle && (
          <Typography
            variant='body2'
            sx={{
              color: modernColors.textMuted,
              fontSize: '1rem',
              fontWeight: 500
            }}
          >
            {subtitle}
          </Typography>
        )}

        {contextInfo && (
          <Typography
            variant='caption'
            sx={{
              color: modernColors.textMuted,
              fontSize: '0.9rem',
              fontStyle: 'italic',
              mt: 0.5
            }}
          >
            {contextInfo}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

export default EnhancedMetricCard