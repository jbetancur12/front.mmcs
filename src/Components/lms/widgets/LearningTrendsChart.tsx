import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Grid,
  IconButton,
  Tooltip,
  Alert,
  Skeleton,
  Paper
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Refresh as RefreshIcon,
  Fullscreen as FullscreenIcon,
  GetApp as ExportIcon
} from '@mui/icons-material'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { format, subDays, subMonths, subYears, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { lmsService } from '../../../services/lmsService'

// Modern color palette
const colors = {
  primary: '#10b981',
  primaryDark: '#059669',
  primaryLight: '#f0fdf4',
  success: '#059669',
  warning: '#d97706',
  error: '#dc2626',
  info: '#3b82f6',
  purple: '#8b5cf6',
  orange: '#f59e0b',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    700: '#374151',
    800: '#1f2937'
  }
}

// Chart colors for different metrics
const chartColors = [colors.primary, colors.info, colors.warning, colors.purple, colors.orange, colors.error]

interface LearningTrendsData {
  enrollments: Array<{ date: string; value: number }>
  completions: Array<{ date: string; value: number }>
  certificates: Array<{ date: string; value: number }>
  activeUsers: Array<{ date: string; value: number }>
  timeSpent: Array<{ date: string; value: number }>
  coursesByCategory: Array<{ name: string; value: number; color: string }>
  performanceMetrics: {
    completionRate: number
    averageScore: number
    retentionRate: number
    engagementScore: number
  }
  trends: {
    enrollmentTrend: number
    completionTrend: number
    engagementTrend: number
  }
}

interface LearningTrendsChartProps {
  timeRange?: 'week' | 'month' | 'quarter' | 'year'
  onTimeRangeChange?: (range: string) => void
  showComparisons?: boolean
  interactive?: boolean
  height?: number
}

const LearningTrendsChart: React.FC<LearningTrendsChartProps> = ({
  timeRange = 'month',
  onTimeRangeChange,
  showComparisons = true,
  interactive = true,
  height = 400
}) => {
  const [data, setData] = useState<LearningTrendsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<string>('enrollments')
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line')
  const [currentTimeRange, setCurrentTimeRange] = useState(timeRange)

  // Time range options
  const timeRangeOptions = [
    { value: 'week', label: 'Última Semana', days: 7 },
    { value: 'month', label: 'Último Mes', days: 30 },
    { value: 'quarter', label: 'Último Trimestre', days: 90 },
    { value: 'year', label: 'Último Año', days: 365 }
  ]

  // Metric options
  const metricOptions = [
    { value: 'enrollments', label: 'Inscripciones', color: colors.primary },
    { value: 'completions', label: 'Finalizaciones', color: colors.success },
    { value: 'certificates', label: 'Certificados', color: colors.warning },
    { value: 'activeUsers', label: 'Usuarios Activos', color: colors.info },
    { value: 'timeSpent', label: 'Tiempo Invertido', color: colors.purple }
  ]

  // Chart type options
  const chartTypeOptions = [
    { value: 'line', label: 'Líneas' },
    { value: 'area', label: 'Área' },
    { value: 'bar', label: 'Barras' }
  ]

  // Fetch learning trends data
  const fetchTrendsData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const endDate = new Date()
      const startDate = subDays(endDate, timeRangeOptions.find(t => t.value === currentTimeRange)?.days || 30)
      
      const trendsData = await lmsService.getAnalytics({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })

      // Transform data for charts
      const transformedData: LearningTrendsData = {
        enrollments: generateTimeSeriesData(startDate, endDate, 'enrollments'),
        completions: generateTimeSeriesData(startDate, endDate, 'completions'),
        certificates: generateTimeSeriesData(startDate, endDate, 'certificates'),
        activeUsers: generateTimeSeriesData(startDate, endDate, 'activeUsers'),
        timeSpent: generateTimeSeriesData(startDate, endDate, 'timeSpent'),
        coursesByCategory: [
          { name: 'Técnicos', value: 35, color: colors.primary },
          { name: 'Seguridad', value: 25, color: colors.info },
          { name: 'Compliance', value: 20, color: colors.warning },
          { name: 'Soft Skills', value: 15, color: colors.purple },
          { name: 'Otros', value: 5, color: colors.gray[400] }
        ],
        performanceMetrics: {
          completionRate: 87.5,
          averageScore: 82.3,
          retentionRate: 91.2,
          engagementScore: 78.9
        },
        trends: {
          enrollmentTrend: 12.5,
          completionTrend: 8.3,
          engagementTrend: -2.1
        }
      }

      setData(transformedData)
    } catch (err) {
      console.error('Error fetching trends data:', err)
      setError('Error al cargar datos de tendencias')
    } finally {
      setLoading(false)
    }
  }

  // Generate mock time series data (replace with real API data)
  const generateTimeSeriesData = (startDate: Date, endDate: Date, metric: string) => {
    const data = []
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      
      let value = 0
      switch (metric) {
        case 'enrollments':
          value = Math.floor(Math.random() * 50) + 20
          break
        case 'completions':
          value = Math.floor(Math.random() * 30) + 10
          break
        case 'certificates':
          value = Math.floor(Math.random() * 20) + 5
          break
        case 'activeUsers':
          value = Math.floor(Math.random() * 100) + 50
          break
        case 'timeSpent':
          value = Math.floor(Math.random() * 300) + 100
          break
      }
      
      data.push({
        date: format(date, 'yyyy-MM-dd'),
        value,
        formattedDate: format(date, 'dd/MM', { locale: es })
      })
    }
    
    return data
  }

  useEffect(() => {
    fetchTrendsData()
  }, [currentTimeRange])

  // Handle time range change
  const handleTimeRangeChange = (newRange: string) => {
    setCurrentTimeRange(newRange as any)
    onTimeRangeChange?.(newRange)
  }

  // Calculate trend indicator
  const getTrendIndicator = (trend: number) => {
    if (trend > 5) return { icon: <TrendingUpIcon />, color: colors.success, text: 'Crecimiento' }
    if (trend < -5) return { icon: <TrendingDownIcon />, color: colors.error, text: 'Decrecimiento' }
    return { icon: <TrendingFlatIcon />, color: colors.gray[500], text: 'Estable' }
  }

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!data) return []
    
    const selectedData = data[selectedMetric as keyof LearningTrendsData] as Array<{ date: string; value: number; formattedDate?: string }>
    return selectedData || []
  }, [data, selectedMetric])

  // Render chart based on type
  const renderChart = () => {
    if (!chartData.length) return null

    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    }

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={metricOptions.find(m => m.value === selectedMetric)?.color} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={metricOptions.find(m => m.value === selectedMetric)?.color} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.gray[200]} />
            <XAxis 
              dataKey="formattedDate" 
              stroke={colors.gray[500]}
              fontSize={12}
            />
            <YAxis stroke={colors.gray[500]} fontSize={12} />
            <RechartsTooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: `1px solid ${colors.gray[200]}`,
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={metricOptions.find(m => m.value === selectedMetric)?.color}
              fillOpacity={1}
              fill="url(#colorMetric)"
              strokeWidth={2}
            />
          </AreaChart>
        )
      
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.gray[200]} />
            <XAxis 
              dataKey="formattedDate" 
              stroke={colors.gray[500]}
              fontSize={12}
            />
            <YAxis stroke={colors.gray[500]} fontSize={12} />
            <RechartsTooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: `1px solid ${colors.gray[200]}`,
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar 
              dataKey="value" 
              fill={metricOptions.find(m => m.value === selectedMetric)?.color}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        )
      
      default: // line
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.gray[200]} />
            <XAxis 
              dataKey="formattedDate" 
              stroke={colors.gray[500]}
              fontSize={12}
            />
            <YAxis stroke={colors.gray[500]} fontSize={12} />
            <RechartsTooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: `1px solid ${colors.gray[200]}`,
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={metricOptions.find(m => m.value === selectedMetric)?.color}
              strokeWidth={3}
              dot={{ fill: metricOptions.find(m => m.value === selectedMetric)?.color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: metricOptions.find(m => m.value === selectedMetric)?.color, strokeWidth: 2 }}
            />
          </LineChart>
        )
    }
  }

  if (loading) {
    return (
      <Card sx={{ borderRadius: '16px', border: `1px solid ${colors.gray[200]}` }}>
        <CardContent sx={{ p: 3 }}>
          <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" width="100%" height={height} />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card sx={{ borderRadius: '16px', border: `1px solid ${colors.gray[200]}` }}>
        <CardContent sx={{ p: 3 }}>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card sx={{ borderRadius: '16px', border: `1px solid ${colors.gray[200]}` }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: colors.gray[800] }}>
            Tendencias de Aprendizaje
          </Typography>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Actualizar">
              <IconButton size="small" onClick={fetchTrendsData}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Pantalla completa">
              <IconButton size="small">
                <FullscreenIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Exportar">
              <IconButton size="small">
                <ExportIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* Controls */}
        {interactive && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Período</InputLabel>
                <Select
                  value={currentTimeRange}
                  label="Período"
                  onChange={(e) => handleTimeRangeChange(e.target.value)}
                >
                  {timeRangeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Métrica</InputLabel>
                <Select
                  value={selectedMetric}
                  label="Métrica"
                  onChange={(e) => setSelectedMetric(e.target.value)}
                >
                  {metricOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: option.color,
                            mr: 1
                          }}
                        />
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Gráfico</InputLabel>
                <Select
                  value={chartType}
                  label="Tipo de Gráfico"
                  onChange={(e) => setChartType(e.target.value as any)}
                >
                  {chartTypeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}

        {/* Performance Metrics */}
        {data && showComparisons && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: colors.gray[50] }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: colors.primary }}>
                  {data.performanceMetrics.completionRate}%
                </Typography>
                <Typography variant="caption" color={colors.gray[500]}>
                  Tasa de Finalización
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: colors.gray[50] }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: colors.success }}>
                  {data.performanceMetrics.averageScore}%
                </Typography>
                <Typography variant="caption" color={colors.gray[500]}>
                  Puntuación Promedio
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: colors.gray[50] }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: colors.info }}>
                  {data.performanceMetrics.retentionRate}%
                </Typography>
                <Typography variant="caption" color={colors.gray[500]}>
                  Tasa de Retención
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: colors.gray[50] }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: colors.warning }}>
                  {data.performanceMetrics.engagementScore}%
                </Typography>
                <Typography variant="caption" color={colors.gray[500]}>
                  Índice de Compromiso
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Trend Indicators */}
        {data && showComparisons && (
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            {Object.entries(data.trends).map(([key, value]) => {
              const trend = getTrendIndicator(value)
              return (
                <Chip
                  key={key}
                  icon={trend.icon}
                  label={`${key === 'enrollmentTrend' ? 'Inscripciones' : key === 'completionTrend' ? 'Finalizaciones' : 'Compromiso'}: ${value > 0 ? '+' : ''}${value}%`}
                  sx={{
                    color: trend.color,
                    borderColor: trend.color,
                    '& .MuiChip-icon': { color: trend.color }
                  }}
                  variant="outlined"
                />
              )
            })}
          </Stack>
        )}

        {/* Main Chart */}
        <Box sx={{ height, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart() || <div>No chart data available</div>}
          </ResponsiveContainer>
        </Box>

        {/* Course Distribution Pie Chart */}
        {data && showComparisons && (
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Distribución por Categoría
              </Typography>
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.coursesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.coursesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Resumen de Categorías
              </Typography>
              <Stack spacing={1}>
                {data.coursesByCategory.map((category) => (
                  <Box key={category.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: category.color,
                          mr: 1
                        }}
                      />
                      <Typography variant="body2">{category.name}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {category.value}%
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  )
}

export default LearningTrendsChart