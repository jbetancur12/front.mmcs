import { useState, useEffect } from 'react'
import {
  Bar,
  Line,
  ComposedChart,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { Container, Grid, Box, CircularProgress, Alert, Button, Card, CardContent, LinearProgress, Paper, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { BarChart as BarChart, DateRange, ErrorOutline, FactCheck, HourglassEmpty, ListAlt, ReceiptLong, RemoveShoppingCart } from '@mui/icons-material'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import useAxiosPrivate from '@utils/use-axios-private'
import { format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'

interface PurchaseStatistics {
  overview: {
    totalRequests: number
    totalOrders: number
    totalVerifications: number
    requestsWithoutOrders: number
    ordersWithoutVerification: number
    pendingVerifications: number
  }
  requestsByStatus: Array<{
    status: string
    count: number
  }>
  timeSeriesData: {
    daily: Array<{
      date: string
      orderCount: number
      totalAmount: number
    }>
    monthly: Array<{
      month: string
      orderCount: number
      totalAmount: number
    }>
    yearly: Array<{
      year: string
      orderCount: number
      totalAmount: number
    }>
  }
}

// const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

const PurchaseStatistics = () => {
  const [statistics, setStatistics] = useState<PurchaseStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'daily' | 'monthly' | 'yearly'>('monthly')
  const [dateFilter, setDateFilter] = useState({
    startDate: subDays(new Date(), 30),
    endDate: new Date()
  })
  const [customDateRange, setCustomDateRange] = useState(false)
  
  const axiosPrivate = useAxiosPrivate()

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await axiosPrivate.get('/purchase-statistics')
      setStatistics(response.data)
      
    } catch (err: any) {
      console.error('Error fetching purchase statistics:', err)
      setError(err.response?.data?.details || 'Error al cargar las estadísticas')
    } finally {
      setLoading(false)
    }
  }

  const fetchStatisticsByDateRange = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {
        startDate: format(dateFilter.startDate, 'yyyy-MM-dd'),
        endDate: format(dateFilter.endDate, 'yyyy-MM-dd')
      }
      
      const response = await axiosPrivate.get('/purchase-statistics/date-range', { params })
      // Handle date range specific response here if needed
      console.log('Date range statistics:', response.data)
      
    } catch (err: any) {
      console.error('Error fetching date range statistics:', err)
      setError(err.response?.data?.error || 'Error al cargar las estadísticas por fecha')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatistics()
  }, [])

  const handleDateRangeFilter = () => {
    fetchStatisticsByDateRange()
  }

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'pendiente': '#f59e0b',
      'pre-aprobado': '#3b82f6',
      'aprobado': '#00BFA5',
      'aceptada': '#00BFA5',
      'rechazado': '#ef4444'
    }
    return statusColors[String(status).toLowerCase()] || '#9ca3af'
  }

  const formatCurrency = (value: number) => {
    if (!value || isNaN(value)) return '$0';
    
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMM dd', { locale: es });
    } catch (error) {
      return dateString;
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    )
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={fetchStatistics}>
            Reintentar
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    )
  }

  if (!statistics) {
    return (
      <Box p={3}>
        <Alert severity="info">No hay datos disponibles</Alert>
      </Box>
    )
  }

  const timeSeriesData = statistics.timeSeriesData[timeRange].map(item => {
    let formattedDate = '';
    try {
      if (timeRange === 'yearly') {
        const dateValue = 'date' in item ? item.date : 'year' in item ? item.year : '';
        formattedDate = format(new Date(dateValue), 'yyyy');
      } else if (timeRange === 'monthly') {
        const dateValue = 'date' in item ? item.date : 'month' in item ? item.month : '';
        formattedDate = format(new Date(dateValue), 'MMM yyyy', { locale: es });
      } else {
        const dateValue = 'date' in item ? item.date : '';
        formattedDate = formatDate(dateValue);
      }
    } catch (error) {
      const fallbackDate = 'date' in item ? item.date : 'month' in item ? item.month : 'year' in item ? item.year : '';
      formattedDate = fallbackDate;
    }
    
    return {
      ...item,
      date: formattedDate
    };
  })

  const compactCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
    return `${value}`
  }

  const { totalRequests, totalOrders, totalVerifications, requestsWithoutOrders, ordersWithoutVerification } = statistics.overview
  const percentOf = (part: number, whole: number) => (whole ? Math.round((part / whole) * 1000) / 10 : 0)
  const funnel = [
    { label: 'Solicitudes', value: totalRequests, rate: null as number | null, color: '#3b82f6' },
    { label: 'Órdenes de compra', value: totalOrders, rate: percentOf(totalOrders, totalRequests), color: '#00BFA5' },
    { label: 'Verificaciones', value: totalVerifications, rate: percentOf(totalVerifications, totalOrders), color: '#00695C' }
  ]
  const funnelMax = Math.max(...funnel.map((step) => step.value), 0)
  const stuckTotal = requestsWithoutOrders + ordersWithoutVerification
  const statusTotal = statistics.requestsByStatus.reduce((acc, entry) => acc + entry.count, 0)

  const chartPaperSx = { p: { xs: 2, md: 3 }, borderRadius: 2 }
  const toggleSx = {
    '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 600, px: 2 },
    '& .Mui-selected': { bgcolor: '#E0F7F4 !important', color: '#00695C' }
  }

  return (
    <Container maxWidth='xl' sx={{ py: 3 }} className='space-y-6'>
      <LmsPageHeader
        title='Estadísticas de Compras'
        subtitle='Solicitudes, órdenes y verificaciones del módulo de compras'
        icon={<BarChart />}
        actions={
          <Button
            variant={customDateRange ? 'outlined' : 'contained'}
            startIcon={<DateRange />}
            onClick={() => setCustomDateRange(!customDateRange)}
            sx={
              customDateRange
                ? { color: '#00897B', borderColor: '#00BFA5', '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' } }
                : { bgcolor: '#00BFA5', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#00ACC1' } }
            }
          >
            {customDateRange ? 'Ocultar filtros' : 'Filtro por fechas'}
          </Button>
        }
      />

      {/* Custom Date Range Filter */}
      {customDateRange && (
        <Card>
          <CardContent>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <div className="flex gap-4 items-center">
                <DatePicker
                  label="Fecha Inicio"
                  value={dateFilter.startDate}
                  onChange={(date) => date && setDateFilter(prev => ({ ...prev, startDate: date }))}
                  slotProps={{ textField: { size: 'small' } }}
                />
                <DatePicker
                  label="Fecha Fin"
                  value={dateFilter.endDate}
                  onChange={(date) => date && setDateFilter(prev => ({ ...prev, endDate: date }))}
                  slotProps={{ textField: { size: 'small' } }}
                />
                <Button variant="contained" onClick={handleDateRangeFilter}>
                  Aplicar Filtro
                </Button>
              </div>
            </LocalizationProvider>
          </CardContent>
        </Card>
      )}

      {/* Overview Cards */}
      <Grid container spacing={3}>
        <Grid item xs={6} sm={4} lg={2}>
          <LmsStatCard label='Total solicitudes' value={statistics.overview.totalRequests} icon={<ListAlt />} tone='blue' />
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <LmsStatCard label='Total órdenes' value={statistics.overview.totalOrders} icon={<ReceiptLong />} tone='teal' />
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <LmsStatCard label='Verificaciones' value={statistics.overview.totalVerifications} icon={<FactCheck />} tone='green' />
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <LmsStatCard label='Sin orden' value={statistics.overview.requestsWithoutOrders} icon={<RemoveShoppingCart />} tone='orange' />
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <LmsStatCard label='Sin verificar' value={statistics.overview.ordersWithoutVerification} icon={<ErrorOutline />} tone='red' />
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <LmsStatCard label='Pendientes' value={statistics.overview.pendingVerifications} icon={<HourglassEmpty />} tone='orange' />
        </Grid>
      </Grid>

      {/* Tendencia y proceso */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper elevation={2} sx={{ ...chartPaperSx, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <Box>
                <Typography variant='h6' fontWeight={700}>
                  Órdenes y monto comprado
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Las barras son órdenes emitidas; la línea es el monto en pesos.
                </Typography>
              </Box>
              <ToggleButtonGroup
                size='small'
                exclusive
                value={timeRange}
                onChange={(_, value) => value && setTimeRange(value)}
                aria-label='Período de la gráfica'
                sx={toggleSx}
              >
                <ToggleButton value='daily'>Diario</ToggleButton>
                <ToggleButton value='monthly'>Mensual</ToggleButton>
                <ToggleButton value='yearly'>Anual</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            {timeSeriesData.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
                No hay órdenes en este período. Cambia el rango para ver otras fechas.
              </Box>
            ) : (
              <ResponsiveContainer width='100%' height={320}>
                <ComposedChart data={timeSeriesData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke='#e5e7eb' />
                  <XAxis dataKey='date' tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis yAxisId='left' allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} width={32} />
                  <YAxis
                    yAxisId='right'
                    orientation='right'
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    width={56}
                    tickFormatter={compactCurrency}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0, 191, 165, 0.06)' }}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(value: number, name: string) => [
                      name === 'Monto' ? formatCurrency(value) : `${value} órdenes`,
                      name
                    ]}
                  />
                  <Legend iconType='circle' wrapperStyle={{ fontSize: 13 }} />
                  <Bar yAxisId='left' dataKey='orderCount' name='Órdenes' fill='#00BFA5' radius={[6, 6, 0, 0]} maxBarSize={36} />
                  <Line yAxisId='right' dataKey='totalAmount' name='Monto' stroke='#00695C' strokeWidth={2.5} dot={{ r: 3, fill: '#00695C' }} activeDot={{ r: 5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper elevation={2} sx={{ ...chartPaperSx, height: '100%' }}>
            <Typography variant='h6' fontWeight={700}>
              Del pedido a la verificación
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
              Cuántas solicitudes llegan a orden y cuántas órdenes se verifican.
            </Typography>
            {funnel.map((step, index) => (
              <Box key={step.label} sx={{ mb: index === funnel.length - 1 ? 0 : 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.75 }}>
                  <Typography variant='body2' fontWeight={600}>
                    {step.label}
                  </Typography>
                  <Typography variant='body2' fontWeight={700}>
                    {step.value}
                  </Typography>
                </Box>
                <LinearProgress
                  variant='determinate'
                  value={funnelMax ? (step.value / funnelMax) * 100 : 0}
                  sx={{ height: 12, borderRadius: 6, bgcolor: '#E0F7F4', '& .MuiLinearProgress-bar': { borderRadius: 6, bgcolor: step.color } }}
                />
                {step.rate !== null && (
                  <Typography variant='caption' color='text.secondary'>
                    {step.rate}% de la etapa anterior
                  </Typography>
                )}
              </Box>
            ))}
            <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: stuckTotal > 0 ? '#fff7ed' : '#E0F7F4' }}>
              <Typography variant='body2' fontWeight={600}>
                {stuckTotal > 0
                  ? `${stuckTotal} pendientes por atender`
                  : 'No hay pendientes por atender'}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {stuckTotal > 0
                  ? `${statistics.overview.requestsWithoutOrders} solicitudes sin orden y ${statistics.overview.ordersWithoutVerification} órdenes sin verificar.`
                  : 'Todas las solicitudes tienen orden y todas las órdenes están verificadas.'}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={2} sx={chartPaperSx}>
            <Typography variant='h6' fontWeight={700}>
              Estado de las solicitudes
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2.5 }}>
              {statusTotal} solicitudes en total.
            </Typography>
            {statusTotal === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>Aún no hay solicitudes registradas.</Box>
            ) : (
              <>
                <Box sx={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden', mb: 2.5 }} role='img' aria-label='Reparto de solicitudes por estado'>
                  {statistics.requestsByStatus.map((entry) => (
                    <Box key={entry.status} title={`${entry.status}: ${entry.count}`} sx={{ width: `${(entry.count / statusTotal) * 100}%`, bgcolor: getStatusColor(entry.status) }} />
                  ))}
                </Box>
                <Grid container spacing={2}>
                  {statistics.requestsByStatus.map((entry) => (
                    <Grid item xs={12} sm={6} md={4} key={entry.status}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: getStatusColor(entry.status), flexShrink: 0 }} />
                        <Typography variant='body2' sx={{ textTransform: 'capitalize', flexGrow: 1 }}>
                          {entry.status}
                        </Typography>
                        <Typography variant='body2' fontWeight={700}>
                          {entry.count}
                        </Typography>
                        <Typography variant='body2' color='text.secondary' sx={{ minWidth: 44, textAlign: 'right' }}>
                          {Math.round((entry.count / statusTotal) * 100)}%
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export default PurchaseStatistics