import React from 'react'
import { Card, CardContent, Box, Typography } from '@mui/material'
import {
  Assignment,
  Schedule,
  PersonAddAlt1,
  Build,
  CheckCircle,
  Warning,
  Description
} from '@mui/icons-material'
import { MetricsDashboardProps } from '../types'
import { useModernStyles } from '../hooks/useModernStyles'

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  metrics,
  colors
}) => {
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
      title: 'Asignados',
      value: metrics.assignedTickets,
      icon: PersonAddAlt1,
      color: 'info',
      borderColor: colors.info
    },
    {
      title: 'En Progreso',
      value: metrics.inProgressTickets,
      icon: Build,
      color: 'info',
      borderColor: colors.info,
      isActive: metrics.inProgressTickets > 0
    },
    {
      title: 'Reporte técnico',
      value: metrics.pendingTechnicalReport,
      icon: Description,
      color: 'warning',
      borderColor: colors.warning
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
    },
    {
      title: 'Por facturar',
      value: metrics.isInvoiced,
      icon: Warning,
      color: 'warning',
      borderColor: colors.warning
    }
  ]

  return (
    <Box
      sx={{
        mb: 0,
        display: 'grid',
        gridTemplateColumns: `repeat(${metricsConfig.length}, minmax(0, 1fr))`,
        gap: 1
      }}
    >
      {metricsConfig.map((metric, index) => (
        <Box key={index}>
          <Card
            sx={{
              ...cardStyles.base,
              ...cardStyles.metric,
              borderLeft: `6px solid ${metric.borderColor}`,
              ...(metric.isActive && {
                border: `2px solid ${colors.info}`,
                background:
                  'linear-gradient(135deg, rgba(23, 162, 184, 0.08), rgba(23, 162, 184, 0.02))',
                boxShadow: '0 4px 16px rgba(23, 162, 184, 0.18)'
              }),
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
            <CardContent
              sx={{
                p: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
            >
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.65 }}
              >
                <Box
                  sx={{
                    ...iconContainerStyles.base,
                    ...iconContainerStyles[
                      metric.color as keyof typeof iconContainerStyles
                    ]
                  }}
                >
                  <metric.icon sx={{ fontSize: '1.25rem', color: 'white' }} />
                </Box>
                <Typography
                  variant='h3'
                  sx={{
                    fontWeight: 800,
                    color: colors.textPrimary, // Mejor contraste
                    lineHeight: 1,
                    fontSize: '2rem'
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
                  fontSize: '0.82rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.35px'
                }}
              >
                {metric.title}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      ))}
    </Box>
  )
}

export default MetricsDashboard
