import React from 'react'
import { Grid, Card, CardContent, Box, Typography } from '@mui/material'
import {
  Assignment,
  Schedule,
  Build,
  CheckCircle,
  Warning
} from '@mui/icons-material'
import { MetricsDashboardProps } from '../types'
import { useModernStyles } from '../hooks/useModernStyles'

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ metrics, colors }) => {
  const { cardStyles, iconContainerStyles } = useModernStyles()

  const metricsConfig = [
    {
      title: 'Total Activos',
      value: metrics.totalTickets,
      icon: Assignment,
      color: 'primary',
      borderColor: colors.primary
    },
    {
      title: 'Pendientes',
      value: metrics.pendingTickets,
      icon: Schedule,
      color: 'warning',
      borderColor: colors.warning
    },
    {
      title: 'En Progreso',
      value: metrics.inProgressTickets,
      icon: Build,
      color: 'info',
      borderColor: colors.info
    },
    {
      title: 'Completados Hoy',
      value: metrics.completedTickets,
      icon: CheckCircle,
      color: 'success',
      borderColor: colors.success
    },
    {
      title: 'Urgentes',
      value: metrics.urgentTickets,
      icon: Warning,
      color: 'danger',
      borderColor: colors.danger,
      isUrgent: metrics.urgentTickets > 0
    }
  ]

  return (
    <Grid container spacing={1.5} sx={{ mb: 0 }}>
      {metricsConfig.map((metric, index) => (
        <Grid item xs={2.4} key={index}>
          <Card
            sx={{
              ...cardStyles.base,
              ...cardStyles.metric,
              borderLeft: `6px solid ${metric.borderColor}`,
              ...(metric.isUrgent && {
                border: `2px solid ${colors.danger}`,
                backgroundColor: 'rgba(220, 53, 69, 0.02)',
                boxShadow: '0 4px 16px rgba(220, 53, 69, 0.15)',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(220, 53, 69, 0.25)',
                  transform: 'translateY(-2px)'
                }
              })
            }}
          >
            <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box
                  sx={{
                    ...iconContainerStyles.base,
                    ...iconContainerStyles[metric.color as keyof typeof iconContainerStyles]
                  }}
                >
                  <metric.icon sx={{ fontSize: '1.5rem', color: 'white' }} />
                </Box>
                <Typography
                  variant='h3'
                  sx={{
                    fontWeight: 800,
                    color: colors.textPrimary, // Mejor contraste
                    lineHeight: 1
                  }}
                >
                  {metric.value}
                </Typography>
              </Box>
              <Typography
                variant='body1'
                sx={{
                  color: colors.textSecondary, // Mejor contraste
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {metric.title}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

export default MetricsDashboard