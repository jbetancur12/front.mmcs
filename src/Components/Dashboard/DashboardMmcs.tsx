import SignalLoader from 'src/Components/Common/SignalLoader'
import React, { useState, useMemo } from 'react'
import {
  Container,
  Typography,
  Grid,
  IconButton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material'
import {
  Business as BusinessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon,
  TaskAltOutlined,
  ViewModule as ViewModuleIcon,
  TableRows as TableRowsIcon
} from '@mui/icons-material'
import { useCertificatesNextToExpireGrouped } from 'src/hooks/dashboard/useCertificatesDue'
import DashboardTable from './DashboardMmcsTable'
import DashboardCards from './DashboardMmcsCards'
import {
  applyDueFilter,
  byUrgency,
  Customer,
  DueFilter,
  summarizeCustomers
} from './dashboardCertificates'
import EmptyState from '../Common/EmptyState'
import { notify } from 'src/utils/notify'
import LmsPageHeader from '../lms/admin/LmsPageHeader'
import LmsStatCard from '../lms/admin/LmsStatCard'

/**
 * Inicio del personal interno: clientes con certificados vencidos o por
 * vencer. Los indicadores de vencidos y próximos filtran la lista, que se
 * puede ver como tabla o como tarjetas.
 */
const Dashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [dueFilter, setDueFilter] = useState<DueFilter>(null)
  const [refreshing, setRefreshing] = useState(false)

  const {
    data: rawData = [],
    isLoading,
    refetch
  } = useCertificatesNextToExpireGrouped<Customer>({
    onError: (error) => {
      console.error('Error fetching file data:', error)
      notify.error('No se pudieron cargar los datos de certificados')
    }
  })

  const customers = useMemo(
    () => summarizeCustomers(rawData).sort(byUrgency),
    [rawData]
  )
  const visibleCustomers = useMemo(
    () => applyDueFilter(customers, dueFilter),
    [customers, dueFilter]
  )

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refetch()
      notify.success('Datos actualizados')
    } finally {
      setRefreshing(false)
    }
  }

  const stats = useMemo(
    () => ({
      totalCustomers: customers.length,
      totalCertificates: customers.reduce((sum, c) => sum + c.total, 0),
      expiredCount: customers.reduce((sum, c) => sum + c.expired, 0),
      soonToExpireCount: customers.reduce((sum, c) => sum + c.upcoming, 0)
    }),
    [customers]
  )

  const toggleFilter = (filter: Exclude<DueFilter, null>) =>
    setDueFilter((current) => (current === filter ? null : filter))

  if (isLoading) {
    return <SignalLoader fullPage />
  }

  if (customers.length === 0) {
    return (
      <Container maxWidth='xl' sx={{ py: 3 }}>
        <EmptyState
          icon={<TaskAltOutlined />}
          title='Certificados al día'
          hint='Todos los certificados están vigentes: no hay vencidos ni próximos a vencer.'
        />
      </Container>
    )
  }

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Certificados por vencer'
        subtitle='Clientes con certificados vencidos o próximos a vencer, los más urgentes primero'
        icon={<AssignmentIcon />}
        actions={
          <>
            <Tooltip title='Actualizar datos'>
              <span>
                <IconButton
                  aria-label='Actualizar datos'
                  onClick={handleRefresh}
                  disabled={refreshing}
                  sx={{ border: '1px solid #e5e7eb', borderRadius: '10px' }}
                >
                  <RefreshIcon
                    sx={{
                      animation: refreshing
                        ? 'spin 1s linear infinite'
                        : 'none',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' }
                      },
                      '@media (prefers-reduced-motion: reduce)': {
                        animation: 'none'
                      }
                    }}
                  />
                </IconButton>
              </span>
            </Tooltip>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_event, next) => next && setViewMode(next)}
              aria-label='Vista de los clientes'
              size='small'
              sx={{
                bgcolor: '#fff',
                '& .MuiToggleButton-root': {
                  borderColor: '#e5e7eb',
                  color: '#374151'
                },
                '& .Mui-selected, & .Mui-selected:hover': {
                  bgcolor: '#E0F7F4 !important',
                  color: '#00695C !important'
                }
              }}
            >
              <ToggleButton value='table' aria-label='Vista de tabla'>
                <TableRowsIcon />
              </ToggleButton>
              <ToggleButton value='cards' aria-label='Vista de tarjetas'>
                <ViewModuleIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </>
        }
      />

      {/* Vencidos y próximos filtran la lista; el color aparece solo cuando hay algo */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <LmsStatCard
            label='Clientes'
            value={stats.totalCustomers}
            icon={<BusinessIcon />}
            tone='teal'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <LmsStatCard
            label='Certificados'
            value={stats.totalCertificates}
            icon={<AssignmentIcon />}
            tone='blue'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <LmsStatCard
            label='Próximos a vencer'
            value={stats.soonToExpireCount}
            icon={<WarningIcon />}
            tone='orange'
            caption={
              dueFilter === 'upcoming' ? 'Filtro activo' : 'Clic para filtrar'
            }
            active={dueFilter === 'upcoming'}
            onClick={() => toggleFilter('upcoming')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <LmsStatCard
            label='Vencidos'
            value={stats.expiredCount}
            icon={<ErrorIcon />}
            tone='red'
            caption={
              dueFilter === 'expired' ? 'Filtro activo' : 'Clic para filtrar'
            }
            active={dueFilter === 'expired'}
            onClick={() => toggleFilter('expired')}
          />
        </Grid>
      </Grid>

      {dueFilter ? (
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Mostrando los clientes con certificados{' '}
          <strong>
            {dueFilter === 'expired' ? 'vencidos' : 'próximos a vencer'}
          </strong>
          .
        </Typography>
      ) : null}

      {viewMode === 'table' ? (
        <DashboardTable customers={visibleCustomers} />
      ) : (
        <DashboardCards customers={visibleCustomers} />
      )}
    </Container>
  )
}

export default Dashboard
