import { CheckCircle, Devices, Schedule, Warning } from '@mui/icons-material'
import { Grid } from '@mui/material'

import ProfileStatCard from '../Common/ProfileStatCard'
import { CustomerStats, StatusFilter } from './types'
import { intent } from 'src/theme/designTokens'

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
}: CustomerStatsCardsProps) => (
  <Grid container spacing={3} sx={{ mb: 4 }}>
    <Grid item xs={6} md={3}>
      <ProfileStatCard
        label='Total Equipos'
        value={stats.total}
        icon={<Devices />}
        color={intent.info}
        background={intent.infoSoft}
        valueColor='primary.main'
        help='Número total de equipos registrados para este cliente'
      />
    </Grid>
    <Grid item xs={6} md={3}>
      <ProfileStatCard
        label='Vencidos'
        value={stats.expired}
        icon={<Warning />}
        color={intent.danger}
        background={intent.dangerSoft}
        valueColor='error.main'
        help='Calibraciones que ya han vencido y requieren atención inmediata'
        selected={statusFilter === 'expired'}
        onClick={() => handleStatusFilter('expired')}
      />
    </Grid>
    <Grid item xs={6} md={3}>
      <ProfileStatCard
        label='Próximos'
        value={stats.upcoming}
        icon={<Schedule />}
        color={intent.warning}
        background={intent.warningSoft}
        valueColor='warning.main'
        help='Calibraciones próximas a vencer (dentro de 30 días) que requieren programación'
        selected={statusFilter === 'upcoming'}
        onClick={() => handleStatusFilter('upcoming')}
      />
    </Grid>
    <Grid item xs={6} md={3}>
      <ProfileStatCard
        label='Activos'
        value={stats.active}
        icon={<CheckCircle />}
        color={intent.successInk}
        background={intent.successSoft}
        valueColor='success.main'
        help='Calibraciones vigentes con más de 30 días restantes hasta su vencimiento'
        selected={statusFilter === 'active'}
        onClick={() => handleStatusFilter('active')}
      />
    </Grid>
  </Grid>
)

export default CustomerStatsCards
