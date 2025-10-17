import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Alert,
  Skeleton,
  Paper,
  Button,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Refresh as RefreshIcon,
  Fullscreen as FullscreenIcon,
  GetApp as ExportIcon,
  FilterList as FilterIcon,
  Insights as InsightsIcon
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
  Cell,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  ReferenceLine
} from 'recharts'
import { format, subDays, subMonths, parseISO } from 'date-fns'
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
  pink: '#ec4899',
  indigo: '#6366f1',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937'
  }
}

// Chart colors for different metrics
const chartColors = [
  colors.primary, colors.info, colors.warning, colors.purple, 
  colors.orange, colors.error, colors.pink, colors.indigo
]

interface AnalyticsData {
  learningTrends: Array<{
    date: string
    enrollments: number
    completions: number
    certificates: number
    activeUsers: number
    timeSpent: number
  }>
  complianceByRole: Array<{
    role: string
    compliant: number
    atRisk: number
    nonCompliant: number
    total: number
    complianceRate: number
  }>
  complianceByDepartment: Array<{
    department: string
    compliant: number
    atRisk: number
    nonCompliant: number
    total: number
    complianceRate: number
  }>
  courseEffectiveness: Array<{
    courseId: number
    courseName: string
    completionRate: number
    averageScore: number
    timeToComplete: number
    userSatisfaction: number
    retentionRate: number
  }>
  userEngagement: Array<{
    userId: number
    userName: string
    coursesEnrolled: number
    coursesCompleted: number
    timeSpent: number
    lastActivity: string
    engagementScore: number
  }>
  performanceCorrelation: Array<{
    metric1: number
    metric2: number
    courseName: string
    category: string
  }>
}

interface AdvancedAnalyticsChartsProps {
  timeRange?: 'week' | 'month' | 'quarter' | 'year'
  onTimeRangeChange?: (range: string) => void
  showFilters?: boolean
  interactive?: boolean
  height?: number
}

const AdvancedAnalyticsCharts: React.FC<AdvancedAnalyticsChartsProps> = ({
  timeRange = 'month',
  onTimeRangeChange,
  showFilters = true,
  interactive = true,
  height = 400
}) => {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedChart, setSelectedChart] = useState<string>('learning_trends')
  const [currentTimeRange, setCurrentTimeRange] = useState(timeRange)
  const [showComparison, setShowComparison] = useState(true)
  const [drillDownLevel, setDrillDownLevel] = useState<string>('overview')

  // Chart type options
  const chartOptions = [
    { value: 'learning_trends', label: 'Tendencias de Aprendizaje', icon: <TrendingUpIcon /> },
    { value: 'compliance_dashboard', label: 'Dashboard de Cumplimiento', icon: <AssessmentIcon /> },
    { value: 'course_effectiveness', label: 'Efectividad de Cursos', icon: <SchoolIcon /> },
    { value: 'user_engagement', label: 'Compromiso de Usuarios', icon: <PersonIcon /> },
    { value: 'performance_correlation', label: 'Correlación de Rendimiento', icon: <InsightsIcon /> }
  ]

  // Time range options
  const timeRangeOptions = [
    { value: 'week', label: 'Última Semana' },
    { value: 'month', label: 'Último Mes' },
    { value: 'quarter', label: 'Último Trimestre' },
    { value: 'year', label: 'Último Año' }
  ]

  // Drill-down options
  const drillDownOptions = [
    { value: 'overview', label: 'Vista General' },
    { value: 'department', label: 'Por Departamento' },
    { value: 'role', label: 'Por Rol' },
    { value: 'course', label: 'Por Curso' }
  ]

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const endDate = new Date()
      const startDate = (() => {
        switch (currentTimeRange) {
          case 'week': return subDays(endDate, 7)
          case 'month': return subMonths(endDate, 1)
          case 'quarter': return subMonths(endDate, 3)
          case 'year': return subMonths(endDate, 12)
          default: return subMonths(endDate, 1)
        }
      })()

      // Fetch different types of analytics data
      const [trendsData, complianceData, courseData] = await Promise.all([
        lmsService.getLearningTrendsAnalytics({
          timeRange: currentTimeRange,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          includeComparisons: showComparison
        }),
        lmsService.getAssignmentManagementAnalytics({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }),
        lmsService.getEnhancedCourseMetrics({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          includePopularity: true,
          includeTimeAnalytics: true
        })
      ])

      // Transform and combine data
      const transformedData: AnalyticsData = {
        learningTrends: generateLearningTrendsData(startDate, endDate),
        complianceByRole: generateComplianceByRoleData(),
        complianceByDepartment: generateComplianceByDepartmentData(),
        courseEffectiveness: generateCourseEffectivenessData(),
        userEngagement: generateUserEngagementData(),
        performanceCorrelation: generatePerformanceCorrelationData()
      }

      setData(transformedData)
    } catch (err) {
      console.error('Error fetching analytics data:', err)
      setError('Error al cargar datos analíticos')
    } finally {
      setLoading(false)
    }
  }

  // Generate mock data functions (replace with real API data)
  const generateLearningTrendsData = (startDate: Date, endDate: Date) => {
    const data = []
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      
      data.push({
        date: format(date, 'yyyy-MM-dd'),
        enrollments: Math.floor(Math.random() * 50) + 20,
        completions: Math.floor(Math.random() * 30) + 10,
        certificates: Math.floor(Math.random() * 20) + 5,
        activeUsers: Math.floor(Math.random() * 100) + 50,
        timeSpent: Math.floor(Math.random() * 300) + 100
      })
    }
    
    return data
  }

  const generateComplianceByRoleData = () => [
    { role: 'Administrador', compliant: 10, atRisk: 2, nonCompliant: 0, total: 12, complianceRate: 83 },
    { role: 'Gerente', compliant: 25, atRisk: 8, nonCompliant: 5, total: 38, complianceRate: 66 },
    { role: 'Empleado', compliant: 180, atRisk: 45, nonCompliant: 25, total: 250, complianceRate: 72 },
    { role: 'Contratista', compliant: 15, atRisk: 3, nonCompliant: 2, total: 20, complianceRate: 75 }
  ]

  const generateComplianceByDepartmentData = () => [
    { department: 'Desarrollo', compliant: 45, atRisk: 8, nonCompliant: 2, total: 55, complianceRate: 82 },
    { department: 'Ventas', compliant: 35, atRisk: 10, nonCompliant: 5, total: 50, complianceRate: 70 },
    { department: 'Marketing', compliant: 28, atRisk: 5, nonCompliant: 2, total: 35, complianceRate: 80 },
    { department: 'RRHH', compliant: 18, atRisk: 4, nonCompliant: 3, total: 25, complianceRate: 72 },
    { department: 'Operaciones', compliant: 95, atRisk: 15, nonCompliant: 10, total: 120, complianceRate: 79 }
  ]

  const generateCourseEffectivenessData = () => [
    { courseId: 1, courseName: 'Seguridad Laboral', completionRate: 95, averageScore: 88, timeToComplete: 120, userSatisfaction: 4.5, retentionRate: 92 },
    { courseId: 2, courseName: 'Protección de Datos', completionRate: 78, averageScore: 82, timeToComplete: 180, userSatisfaction: 4.2, retentionRate: 85 },
    { courseId: 3, courseName: 'Liderazgo', completionRate: 65, averageScore: 79, timeToComplete: 240, userSatisfaction: 4.0, retentionRate: 78 },
    { courseId: 4, courseName: 'Ciberseguridad', completionRate: 88, averageScore: 85, timeToComplete: 150, userSatisfaction: 4.3, retentionRate: 89 },
    { courseId: 5, courseName: 'Comunicación', completionRate: 72, averageScore: 81, timeToComplete: 90, userSatisfaction: 4.1, retentionRate: 82 }
  ]

  const generateUserEngagementData = () => [
    { userId: 1, userName: 'Juan Pérez', coursesEnrolled: 8, coursesCompleted: 6, timeSpent: 480, lastActivity: '2024-01-15', engagementScore: 85 },
    { userId: 2, userName: 'María García', coursesEnrolled: 12, coursesCompleted: 10, timeSpent: 720, lastActivity: '2024-01-14', engagementScore: 92 },
    { userId: 3, userName: 'Carlos López', coursesEnrolled: 5, coursesCompleted: 2, timeSpent: 180, lastActivity: '2024-01-10', engagementScore: 45 },
    { userId: 4, userName: 'Ana Martín', coursesEnrolled: 15, coursesCompleted: 12, timeSpent: 900, lastActivity: '2024-01-16', engagementScore: 88 },
    { userId: 5, userName: 'Luis Rodríguez', coursesEnrolled: 6, coursesCompleted: 4, timeSpent: 360, lastActivity: '2024-01-12', engagementScore: 72 }
  ]

  const generatePerformanceCorrelationData = () => [
    { metric1: 95, metric2: 88, courseName: 'Seguridad Laboral', category: 'Compliance' },
    { metric1: 78, metric2: 82, courseName: 'Protección de Datos', category: 'Compliance' },
    { metric1: 65, metric2: 79, courseName: 'Liderazgo', category: 'Soft Skills' },
    { metric1: 88, metric2: 85, courseName: 'Ciberseguridad', category: 'Technical' },
    { metric1: 72, metric2: 81, courseName: 'Comunicación', category: 'Soft Skills' }
  ]

  useEffect(() => {
    fetchAnalyticsData()
  }, [currentTimeRange, showComparison, drillDownLevel])

  // Handle time range change
  const handleTimeRangeChange = (newRange: string) => {
    setCurrentTimeRange(newRange as any)
    onTimeRangeChange?.(newRange)
  }

  // Render different chart types
  const renderChart = () => {
    if (!data) return null

    switch (selectedChart) {
      case 'learning_trends':
        return renderLearningTrendsChart()
      case 'compliance_dashboard':
        return renderComplianceDashboard()
      case 'course_effectiveness':
        return renderCourseEffectivenessChart()
      case 'user_engagement':
        return renderUserEngagementChart()
      case 'performance_correlation':
        return renderPerformanceCorrelationChart()
      default:
        return null
    }
  }

  const renderLearningTrendsChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data!.learningTrends}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.gray[200]} />
        <XAxis 
          dataKey="date" 
          stroke={colors.gray[500]}
          fontSize={12}
          tickFormatter={(value) => format(parseISO(value), 'dd/MM')}
        />
        <YAxis yAxisId="left" stroke={colors.gray[500]} fontSize={12} />
        <YAxis yAxisId="right" orientation="right" stroke={colors.gray[500]} fontSize={12} />
        <RechartsTooltip 
          contentStyle={{
            backgroundColor: 'white',
            border: `1px solid ${colors.gray[200]}`,
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Legend />
        <Bar yAxisId="left" dataKey="enrollments" fill={colors.primary} name="Inscripciones" />
        <Bar yAxisId="left" dataKey="completions" fill={colors.success} name="Finalizaciones" />
        <Line yAxisId="right" type="monotone" dataKey="activeUsers" stroke={colors.info} strokeWidth={3} name="Usuarios Activos" />
        <Area yAxisId="right" type="monotone" dataKey="timeSpent" fill={colors.purple} fillOpacity={0.3} stroke={colors.purple} name="Tiempo Invertido" />
      </ComposedChart>
    </ResponsiveContainer>
  )

  const renderComplianceDashboard = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          Cumplimiento por Rol
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data!.complianceByRole}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.gray[200]} />
            <XAxis dataKey="role" stroke={colors.gray[500]} fontSize={12} />
            <YAxis stroke={colors.gray[500]} fontSize={12} />
            <RechartsTooltip />
            <Legend />
            <Bar dataKey="compliant" stackId="a" fill={colors.success} name="Cumpliendo" />
            <Bar dataKey="atRisk" stackId="a" fill={colors.warning} name="En Riesgo" />
            <Bar dataKey="nonCompliant" stackId="a" fill={colors.error} name="No Cumpliendo" />
          </BarChart>
        </ResponsiveContainer>
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          Cumplimiento por Departamento
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data!.complianceByDepartment}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="complianceRate"
              nameKey="department"
            >
              {data!.complianceByDepartment.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <RechartsTooltip formatter={(value) => [`${value}%`, 'Tasa de Cumplimiento']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Grid>
    </Grid>
  )

  const renderCourseEffectivenessChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data!.courseEffectiveness}>
        <PolarGrid />
        <PolarAngleAxis dataKey="courseName" />
        <PolarRadiusAxis angle={90} domain={[0, 100]} />
        <Radar name="Tasa de Finalización" dataKey="completionRate" stroke={colors.primary} fill={colors.primary} fillOpacity={0.3} />
        <Radar name="Puntuación Promedio" dataKey="averageScore" stroke={colors.info} fill={colors.info} fillOpacity={0.3} />
        <Radar name="Satisfacción del Usuario" dataKey="userSatisfaction" stroke={colors.success} fill={colors.success} fillOpacity={0.3} />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  )

  const renderUserEngagementChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart data={data!.userEngagement}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.gray[200]} />
        <XAxis dataKey="coursesEnrolled" name="Cursos Inscritos" stroke={colors.gray[500]} />
        <YAxis dataKey="coursesCompleted" name="Cursos Completados" stroke={colors.gray[500]} />
        <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
        <Scatter name="Usuarios" dataKey="engagementScore" fill={colors.primary} />
        <ReferenceLine x={5} stroke={colors.warning} strokeDasharray="5 5" />
        <ReferenceLine y={3} stroke={colors.warning} strokeDasharray="5 5" />
      </ScatterChart>
    </ResponsiveContainer>
  )

  const renderPerformanceCorrelationChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart data={data!.performanceCorrelation}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.gray[200]} />
        <XAxis dataKey="metric1" name="Tasa de Finalización" stroke={colors.gray[500]} />
        <YAxis dataKey="metric2" name="Puntuación Promedio" stroke={colors.gray[500]} />
        <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
        <Scatter name="Cursos" dataKey="metric2" fill={colors.primary} />
        <ReferenceLine x={75} stroke={colors.warning} strokeDasharray="5 5" />
        <ReferenceLine y={80} stroke={colors.warning} strokeDasharray="5 5" />
      </ScatterChart>
    </ResponsiveContainer>
  )

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
            Análisis Avanzado de Datos
          </Typography>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Actualizar">
              <IconButton size="small" onClick={fetchAnalyticsData}>
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
        {showFilters && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Análisis</InputLabel>
                <Select
                  value={selectedChart}
                  label="Tipo de Análisis"
                  onChange={(e) => setSelectedChart(e.target.value)}
                >
                  {chartOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {option.icon}
                        <Typography sx={{ ml: 1 }}>{option.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
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
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Nivel de Detalle</InputLabel>
                <Select
                  value={drillDownLevel}
                  label="Nivel de Detalle"
                  onChange={(e) => setDrillDownLevel(e.target.value)}
                >
                  {drillDownOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showComparison}
                    onChange={(e) => setShowComparison(e.target.checked)}
                    color="primary"
                  />
                }
                label="Mostrar Comparaciones"
              />
            </Grid>
          </Grid>
        )}

        {/* Chart Description */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color={colors.gray[600]}>
            {chartOptions.find(c => c.value === selectedChart)?.label}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Main Chart */}
        <Box sx={{ height, width: '100%' }}>
          {renderChart()}
        </Box>

        {/* Interactive Features */}
        {interactive && (
          <Box sx={{ mt: 3 }}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                icon={<FilterIcon />}
                label="Filtros Avanzados"
                onClick={() => {/* Open advanced filters */}}
                variant="outlined"
                sx={{ '&:hover': { bgcolor: colors.primaryLight } }}
              />
              <Chip
                icon={<InsightsIcon />}
                label="Generar Insights"
                onClick={() => {/* Generate AI insights */}}
                variant="outlined"
                sx={{ '&:hover': { bgcolor: colors.primaryLight } }}
              />
              <Chip
                icon={<ExportIcon />}
                label="Exportar Datos"
                onClick={() => {/* Export chart data */}}
                variant="outlined"
                sx={{ '&:hover': { bgcolor: colors.primaryLight } }}
              />
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default AdvancedAnalyticsCharts