import {
  CheckCircle,
  Devices,
  HelpOutline,
  Schedule,
  Warning
} from '@mui/icons-material'
import {
  Box,
  Card,
  CardContent,
  Grid,
  SxProps,
  Theme,
  Tooltip,
  Typography
} from '@mui/material'
import React from 'react'

import { CustomerStats, StatusFilter } from './types'

interface StatCardProps {
  icon: React.ReactNode
  iconBg: string
  value: number
  valueColor: string
  label: string
  tooltip: string
  sx: SxProps<Theme>
  onClick?: () => void
}

const StatCard = ({
  icon,
  iconBg,
  value,
  valueColor,
  label,
  tooltip,
  sx,
  onClick
}: StatCardProps) => (
  <Card elevation={0} onClick={onClick} sx={sx}>
    <CardContent sx={{ textAlign: 'center', py: 3 }}>
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '12px',
          backgroundColor: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2
        }}
      >
        {icon}
      </Box>
      <Typography variant='h4' fontWeight='bold' color={valueColor}>
        {value}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5
        }}
      >
        <Typography variant='body2' color='text.secondary'>
          {label}
        </Typography>
        <Tooltip title={tooltip} arrow>
          <HelpOutline
            sx={{
              fontSize: 16,
              color: 'text.secondary',
              cursor: 'help'
            }}
          />
        </Tooltip>
      </Box>
    </CardContent>
  </Card>
)

interface CustomerStatsCardsProps {
  stats: CustomerStats
  statusFilter: StatusFilter | null
  handleStatusFilter: (status: StatusFilter) => void
}

/** Indicadores de equipos; los de estado filtran la lista de equipos. */
const CustomerStatsCards = ({
  stats,
  statusFilter,
  handleStatusFilter
}: CustomerStatsCardsProps) => {
  const statusCardSx = (status: StatusFilter, color: string) => ({
    borderRadius: '16px',
    border:
      statusFilter === status ? `2px solid ${color}` : '1px solid #e5e7eb',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s, transform 0.2s',
    boxShadow: statusFilter === status ? `0 0 0 3px ${color}22` : 'none',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      transform: 'translateY(-2px)'
    }
  })

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={6} md={3}>
        <StatCard
          sx={{ borderRadius: '16px', border: '1px solid #e5e7eb' }}
          iconBg='#e3f2fd'
          icon={<Devices sx={{ color: '#1976d2', fontSize: 24 }} />}
          value={stats.total}
          valueColor='primary'
          label='Total Equipos'
          tooltip='Número total de equipos registrados para este cliente'
        />
      </Grid>

      <Grid item xs={6} md={3}>
        <StatCard
          onClick={() => handleStatusFilter('expired')}
          sx={statusCardSx('expired', '#d32f2f')}
          iconBg='#ffebee'
          icon={<Warning sx={{ color: '#d32f2f', fontSize: 24 }} />}
          value={stats.expired}
          valueColor='error'
          label='Vencidos'
          tooltip='Calibraciones que ya han vencido y requieren atención inmediata'
        />
      </Grid>

      <Grid item xs={6} md={3}>
        <StatCard
          onClick={() => handleStatusFilter('upcoming')}
          sx={statusCardSx('upcoming', '#f57c00')}
          iconBg='#fff3e0'
          icon={<Schedule sx={{ color: '#f57c00', fontSize: 24 }} />}
          value={stats.upcoming}
          valueColor='warning.main'
          label='Próximos'
          tooltip='Calibraciones próximas a vencer (dentro de 30 días) que requieren programación'
        />
      </Grid>

      <Grid item xs={6} md={3}>
        <StatCard
          onClick={() => handleStatusFilter('active')}
          sx={statusCardSx('active', '#2e7d32')}
          iconBg='#e8f5e8'
          icon={<CheckCircle sx={{ color: '#2e7d32', fontSize: 24 }} />}
          value={stats.active}
          valueColor='success.main'
          label='Activos'
          tooltip='Calibraciones vigentes con más de 30 días restantes hasta su vencimiento'
        />
      </Grid>
    </Grid>
  )
}

export default CustomerStatsCards
