import React, { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import {
  ArrowBack,
  Assessment,
  Download,
  Engineering,
  Refresh
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import {
  useMaintenanceAnalytics,
  useMaintenanceTechnicians
} from '../../hooks/useMaintenance'
import { MaintenanceAnalyticsFilters } from '../../types/maintenance'

const getDefaultDateRange = () => {
  const today = new Date()
  const start = new Date()
  start.setDate(today.getDate() - 29)

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: today.toISOString().slice(0, 10)
  }
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(value || 0)

const formatHours = (value: number) => {
  if (!value) return '0 h'
  return value >= 24 ? `${(value / 24).toFixed(1)} d` : `${value.toFixed(1)} h`
}

const surfaceSx = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  border: '1px solid #e5e7eb',
  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)'
}

const MaintenanceAnalytics: React.FC = () => {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<MaintenanceAnalyticsFilters>(
    getDefaultDateRange()
  )

  const {
    data: analytics,
    isLoading,
    refetch,
    isFetching
  } = useMaintenanceAnalytics(filters)
  const { data: technicians = [] } = useMaintenanceTechnicians(true)

  const topTechnicians = useMemo(() => {
    return [...(analytics?.technicianPerformance || [])]
      .sort((a, b) => b.completedTickets - a.completedTickets)
      .slice(0, 5)
  }, [analytics?.technicianPerformance])

  const exportToExcel = async () => {
    if (!analytics) return

    const XLSX = await import('xlsx')

    const workbook = XLSX.utils.book_new()

    const summarySheet = XLSX.utils.json_to_sheet([
      {
        'Fecha inicial': filters.startDate || 'Sin filtro',
        'Fecha final': filters.endDate || 'Sin filtro',
        'Tecnico': technicians.find((tech) => String(tech.id) === filters.technicianId)
          ?.name || 'Todos',
        'Total tickets': analytics.overview.totalTickets,
        'Tickets abiertos': analytics.overview.openTickets,
        'Tickets completados': analytics.overview.completedTickets,
        'Tickets cancelados': analytics.overview.cancelledTickets,
        'Urgentes abiertos': analytics.overview.urgentOpenTickets,
        'Tiempo medio resolucion (h)': analytics.overview.avgResolutionTimeHours,
        'Costo promedio': analytics.overview.avgActualCost,
        'Satisfaccion promedio': analytics.overview.avgCustomerSatisfaction,
        'Completados facturados': analytics.overview.invoicedCompletedTickets,
        'Completados pendientes de facturar':
          analytics.overview.notInvoicedCompletedTickets
      }
    ])
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen')

    const techniciansSheet = XLSX.utils.json_to_sheet(
      analytics.technicianPerformance.map((tech) => ({
        Tecnico: tech.name,
        Email: tech.email,
        Estado: tech.status,
        Disponibilidad: tech.isAvailable ? 'Disponible' : 'No disponible',
        Pendientes: tech.pendingTickets,
        'Tickets asignados': tech.assignedTickets,
        'Tickets abiertos': tech.openTickets,
        'Tickets cerrados': tech.completedTickets,
        'Tickets cancelados': tech.cancelledTickets,
        'Tickets gestionados en rango': tech.totalAssignedTickets,
        'Tasa cierre (%)': tech.completionRate,
        'Tiempo medio resolucion (h)': tech.avgResolutionTimeHours,
        'Satisfaccion promedio': tech.avgCustomerSatisfaction,
        'Costo total registrado': tech.totalActualCost,
        'Carga actual': `${tech.workload}/${tech.maxWorkload}`,
        'Historico completados': tech.historicalCompletedTickets
      }))
    )
    XLSX.utils.book_append_sheet(workbook, techniciansSheet, 'Tecnicos')

    const trendSheet = XLSX.utils.json_to_sheet(
      analytics.dailyTrend.map((point) => ({
        Fecha: point.date,
        Creados: point.created,
        Completados: point.completed
      }))
    )
    XLSX.utils.book_append_sheet(workbook, trendSheet, 'Tendencia')

    const fileName = `analiticas_mantenimiento_${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`

    XLSX.writeFile(workbook, fileName)
  }

  const handleFilterChange =
    (field: keyof MaintenanceAnalyticsFilters) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value
      setFilters((prev) => ({
        ...prev,
        [field]: value || undefined
      }))
    }

  return (
    <Container maxWidth={false} sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
      <Box
        display='flex'
        flexDirection={{ xs: 'column', md: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', md: 'center' }}
        gap={2}
        mb={3}
        sx={{
          ...surfaceSx,
          p: { xs: 2, sm: 3 }
        }}
      >
        <Box display='flex' alignItems='center' gap={2}>
          <Box
            sx={{
              background: 'linear-gradient(135deg, #0f766e 0%, #2f7d32 100%)',
              borderRadius: '12px',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Assessment sx={{ color: '#fff', fontSize: 30 }} />
          </Box>
          <Box>
            <Typography variant='h4' sx={{ fontWeight: 700, color: '#0f172a' }}>
              Analíticas de Mantenimiento
            </Typography>
            <Typography variant='body1' color='text.secondary'>
              Desempeño por técnico, volumen de tickets y métricas operativas.
            </Typography>
          </Box>
        </Box>

        <Stack direction='row' spacing={1} flexWrap='wrap'>
          <Button
            variant='outlined'
            startIcon={<ArrowBack />}
            onClick={() => navigate('/maintenance')}
          >
            Volver
          </Button>
          <Button
            variant='outlined'
            startIcon={<Refresh />}
            onClick={() => refetch()}
            disabled={isFetching}
          >
            Actualizar
          </Button>
          <Button
            variant='contained'
            startIcon={<Download />}
            onClick={exportToExcel}
            disabled={!analytics}
            sx={{
              backgroundColor: '#2f7d32',
              '&:hover': {
                backgroundColor: '#27672a'
              }
            }}
          >
            Descargar Excel
          </Button>
        </Stack>
      </Box>

      <Paper sx={{ ...surfaceSx, p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label='Fecha inicial'
              type='date'
              value={filters.startDate || ''}
              onChange={handleFilterChange('startDate')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label='Fecha final'
              type='date'
              value={filters.endDate || ''}
              onChange={handleFilterChange('endDate')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label='Técnico'
              value={filters.technicianId || ''}
              onChange={handleFilterChange('technicianId')}
            >
              <MenuItem value=''>Todos los técnicos</MenuItem>
              {technicians.map((technician) => (
                <MenuItem key={technician.id} value={technician.id}>
                  {technician.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant='text'
              sx={{ height: '100%' }}
              onClick={() => setFilters(getDefaultDateRange())}
            >
              Ultimos 30 dias
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {(isLoading || isFetching) && <LinearProgress sx={{ mb: 2, borderRadius: 999 }} />}

      {!analytics ? (
        <Alert severity='info'>Cargando analíticas de mantenimiento...</Alert>
      ) : (
        <>
          <Grid container spacing={2.5} mb={3}>
            {[
              {
                title: 'Tickets Totales',
                value: analytics.overview.totalTickets,
                hint: 'Dentro del rango filtrado'
              },
              {
                title: 'Tickets Abiertos',
                value: analytics.overview.openTickets,
                hint: `${analytics.overview.urgentOpenTickets} urgentes abiertos`
              },
              {
                title: 'Tickets Cerrados',
                value: analytics.overview.completedTickets,
                hint: `${analytics.overview.cancelledTickets} cancelados`
              },
              {
                title: 'Tiempo Medio de Resolución',
                value: formatHours(analytics.overview.avgResolutionTimeHours),
                hint: 'Promedio de tickets completados'
              },
              {
                title: 'Costo Promedio',
                value: formatCurrency(analytics.overview.avgActualCost),
                hint: 'Basado en costo real registrado'
              },
              {
                title: 'Satisfacción Promedio',
                value: analytics.overview.avgCustomerSatisfaction.toFixed(2),
                hint: 'Escala 1 a 5'
              }
            ].map((item) => (
              <Grid item xs={12} sm={6} lg={4} xl={2} key={item.title}>
                <Card sx={surfaceSx}>
                  <CardContent>
                    <Typography variant='overline' sx={{ color: '#64748b', fontWeight: 700 }}>
                      {item.title}
                    </Typography>
                    <Typography variant='h4' sx={{ color: '#0f172a', fontWeight: 700, mt: 0.5 }}>
                      {item.value}
                    </Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                      {item.hint}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Paper sx={{ ...surfaceSx, p: 0, overflow: 'hidden' }}>
                <Box sx={{ p: 2.5 }}>
                  <Typography variant='h6' sx={{ fontWeight: 700, color: '#0f172a' }}>
                    Desempeño por técnico
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Asignados incluye tickets legacy en pendiente que ya tenían técnico; abiertos queda para estados operativos en curso.
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size='small'>
                    <TableHead>
                        <TableRow>
                          <TableCell>Técnico</TableCell>
                          <TableCell align='right'>Pendientes</TableCell>
                          <TableCell align='right'>Asignados</TableCell>
                          <TableCell align='right'>Abiertos</TableCell>
                          <TableCell align='right'>Cerrados</TableCell>
                          <TableCell align='right'>Gestionados</TableCell>
                          <TableCell align='right'>Cierre</TableCell>
                          <TableCell align='right'>Tiempo medio</TableCell>
                          <TableCell align='right'>Satisfacción</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analytics.technicianPerformance.map((technician) => (
                        <TableRow key={technician.technicianId} hover>
                          <TableCell>
                            <Stack spacing={0.25}>
                              <Typography variant='body2' sx={{ fontWeight: 700 }}>
                                {technician.name}
                              </Typography>
                              <Stack direction='row' spacing={0.75} alignItems='center'>
                                <Chip
                                  size='small'
                                  label={`Carga actual ${technician.workload}/${technician.maxWorkload}`}
                                  color={technician.isAvailable ? 'success' : 'default'}
                                  variant='outlined'
                                />
                                <Typography variant='caption' color='text.secondary'>
                                  {technician.status}
                                </Typography>
                              </Stack>
                            </Stack>
                          </TableCell>
                          <TableCell align='right'>{technician.pendingTickets}</TableCell>
                          <TableCell align='right'>{technician.assignedTickets}</TableCell>
                          <TableCell align='right'>{technician.openTickets}</TableCell>
                          <TableCell align='right'>{technician.completedTickets}</TableCell>
                          <TableCell align='right'>{technician.totalAssignedTickets}</TableCell>
                          <TableCell align='right'>{technician.completionRate}%</TableCell>
                          <TableCell align='right'>
                            {formatHours(technician.avgResolutionTimeHours)}
                          </TableCell>
                          <TableCell align='right'>
                            {technician.avgCustomerSatisfaction.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Stack spacing={3}>
                <Paper sx={{ ...surfaceSx, p: 2.5 }}>
                  <Typography variant='h6' sx={{ fontWeight: 700, color: '#0f172a', mb: 1.5 }}>
                    Top técnicos por tickets cerrados
                  </Typography>
                  <Stack spacing={1.5}>
                    {topTechnicians.map((technician) => {
                      const maxValue = topTechnicians[0]?.completedTickets || 1
                      return (
                        <Box key={technician.technicianId}>
                          <Box
                            display='flex'
                            justifyContent='space-between'
                            alignItems='center'
                            mb={0.75}
                          >
                            <Typography variant='body2' sx={{ fontWeight: 600 }}>
                              {technician.name}
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              {technician.completedTickets}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant='determinate'
                            value={(technician.completedTickets / maxValue) * 100}
                            sx={{
                              height: 8,
                              borderRadius: 999,
                              backgroundColor: '#e2e8f0',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: '#2f7d32',
                                borderRadius: 999
                              }
                            }}
                          />
                        </Box>
                      )
                    })}
                  </Stack>
                </Paper>

                <Paper sx={{ ...surfaceSx, p: 2.5 }}>
                  <Typography variant='h6' sx={{ fontWeight: 700, color: '#0f172a', mb: 1.5 }}>
                    Estado de tickets
                  </Typography>
                  <Stack spacing={1.25}>
                    {analytics.statusBreakdown.map((item) => {
                      const percentage = analytics.overview.totalTickets
                        ? (item.count / analytics.overview.totalTickets) * 100
                        : 0
                      return (
                        <Box key={item.label}>
                          <Box display='flex' justifyContent='space-between' mb={0.5}>
                            <Typography variant='body2'>{item.label}</Typography>
                            <Typography variant='body2' color='text.secondary'>
                              {item.count}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant='determinate'
                            value={percentage}
                            sx={{
                              height: 7,
                              borderRadius: 999,
                              backgroundColor: '#e2e8f0',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: '#0f766e',
                                borderRadius: 999
                              }
                            }}
                          />
                        </Box>
                      )
                    })}
                  </Stack>
                </Paper>
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ ...surfaceSx, p: 2.5 }}>
                <Typography variant='h6' sx={{ fontWeight: 700, color: '#0f172a', mb: 1.5 }}>
                  Tendencia diaria
                </Typography>
                <Stack spacing={1}>
                  {analytics.dailyTrend.slice(-10).map((point) => (
                    <Box
                      key={point.date}
                      display='flex'
                      justifyContent='space-between'
                      alignItems='center'
                    >
                      <Typography variant='body2'>{point.date}</Typography>
                      <Stack direction='row' spacing={1.5}>
                        <Chip size='small' label={`Creados ${point.created}`} variant='outlined' />
                        <Chip size='small' label={`Cerrados ${point.completed}`} color='success' />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ ...surfaceSx, p: 2.5 }}>
                <Typography variant='h6' sx={{ fontWeight: 700, color: '#0f172a', mb: 1.5 }}>
                  Equipos más frecuentes
                </Typography>
                <Stack spacing={1.25}>
                  {analytics.topEquipmentTypes.map((item) => (
                    <Box key={item.equipmentType}>
                      <Box display='flex' justifyContent='space-between' mb={0.5}>
                        <Typography variant='body2'>{item.equipmentType}</Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {item.count} tickets
                        </Typography>
                      </Box>
                      <Typography variant='caption' color='text.secondary'>
                        {item.completedCount} completados
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ ...surfaceSx, p: 2.5 }}>
                <Box display='flex' alignItems='center' gap={1} mb={1.5}>
                  <Engineering sx={{ color: '#0f766e' }} />
                  <Typography variant='h6' sx={{ fontWeight: 700, color: '#0f172a' }}>
                    Envejecimiento y facturación
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  {analytics.agingBuckets.map((bucket) => (
                    <Grid item xs={12} sm={6} md={3} key={bucket.bucket}>
                      <Card sx={{ backgroundColor: '#f8fafc', borderRadius: '14px', boxShadow: 'none' }}>
                        <CardContent>
                          <Typography variant='overline' sx={{ color: '#64748b', fontWeight: 700 }}>
                            {bucket.bucket}
                          </Typography>
                          <Typography variant='h5' sx={{ fontWeight: 700, color: '#0f172a' }}>
                            {bucket.count}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            tickets abiertos
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ backgroundColor: '#f8fafc', borderRadius: '14px', boxShadow: 'none' }}>
                      <CardContent>
                        <Typography variant='overline' sx={{ color: '#64748b', fontWeight: 700 }}>
                          Facturación
                        </Typography>
                        <Typography variant='h5' sx={{ fontWeight: 700, color: '#0f172a' }}>
                          {analytics.overview.notInvoicedCompletedTickets}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          completados pendientes de facturar
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  )
}

export default MaintenanceAnalytics
