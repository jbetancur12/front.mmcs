import { useState, useEffect } from 'react'
import {
  Bar,
  Line,
  ComposedChart,
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { Container, Grid, Box, CircularProgress, Alert, Button, Select, MenuItem, FormControl, InputLabel, Card, CardContent, CardHeader } from '@mui/material'
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
      'pendiente': '#FF8042',
      'pre-aprobado': '#FFBB28',
      'aprobado': '#00C49F',
      'aceptada': '#00C49F',
      'rechazado': '#FF4444'
    }
    return statusColors[status] || '#8884D8'
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

  // Helper para formatear valores en tooltips
  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'totalAmount' || name.toLowerCase().includes('monto') || name.toLowerCase().includes('total')) {
      return formatCurrency(value);
    }
    if (name === 'orderCount' || name.toLowerCase().includes('orden')) {
      return `${value} órdenes`;
    }
    return value;
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

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* Time Series Chart */}
        <Grid item xs={12} lg={9}>
          <Card>
            <CardHeader 
              title="Tendencia de Órdenes y Montos"
              action={
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Período</InputLabel>
                  <Select
                    value={timeRange}
                    label="Período"
                    onChange={(e) => setTimeRange(e.target.value as 'daily' | 'monthly' | 'yearly')}
                  >
                    <MenuItem value="daily">Diario</MenuItem>
                    <MenuItem value="monthly">Mensual</MenuItem>
                    <MenuItem value="yearly">Anual</MenuItem>
                  </Select>
                </FormControl>
              }
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
                      return `$${value}`;
                    }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      formatTooltipValue(value, name),
                      name === 'totalAmount' ? 'Monto Total' : 'Número de Órdenes'
                    ]}
                    labelFormatter={(label) => `Fecha: ${label}`}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="orderCount" fill="#8884d8" name="Número de Órdenes" />
                  <Line yAxisId="right" dataKey="totalAmount" stroke="#82ca9d" name="Monto Total" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Request Status Pie Chart */}
        <Grid item xs={12} lg={3}>
          <Card>
            <CardHeader title="Estados de Solicitudes" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statistics.requestsByStatus}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    nameKey="status"
                    label={({ status, count, percent }) => 
                      `${status}: ${count} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {statistics.requestsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} solicitudes`, 'Cantidad']}
                    labelFormatter={(label) => `Estado: ${label}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Container>
  )
}

export default PurchaseStatistics