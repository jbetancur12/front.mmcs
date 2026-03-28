import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Paper,
  Tabs,
  Tab,
  TextField,
  Autocomplete,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  MenuBook as BookOpenIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  BarChart as BarChartIcon,
  Visibility as VisibilityIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  TrendingDown as TrendingDownIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Assessment as ReportIcon
} from '@mui/icons-material'
import { useQuery } from 'react-query'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { es } from 'date-fns/locale'

interface AnalyticsData {
  totalUsers: number
  activeUsers: number
  totalCourses: number
  completedCourses: number
  totalCertificates: number
  averageCompletionRate: number
  mandatoryCompletionRate: number
  averageTimeToComplete: number
  totalQuizAttempts: number
  averageQuizScore: number
  topCourses: Array<{
    id: number
    title: string
    enrolledStudents: number
    completionRate: number
    rating: number
    category: string
    averageTimeToComplete: number
    totalQuizAttempts: number
    averageScore: number
  }>
  userGrowth: Array<{
    date: string
    newUsers: number
    activeUsers: number
    completions: number
    certificates: number
  }>
  coursePerformance: Array<{
    category: string
    totalCourses: number
    averageRating: number
    totalEnrollments: number
    completionRate: number
    averageTimeToComplete: number
  }>
  quizPerformance: Array<{
    courseId: number
    courseTitle: string
    totalAttempts: number
    averageScore: number
    passRate: number
    difficultQuestions: Array<{
      questionId: number
      question: string
      failureRate: number
    }>
  }>
  userEngagement: Array<{
    userId: number
    userName: string
    coursesEnrolled: number
    coursesCompleted: number
    totalTimeSpent: number
    lastActivity: string
    certificatesEarned: number
  }>
  complianceData: Array<{
    role: string
    totalUsers: number
    mandatoryCoursesAssigned: number
    mandatoryCoursesCompleted: number
    complianceRate: number
    overdueUsers: number
  }>
  realTimeMetrics: {
    activeUsersNow: number
    coursesInProgress: number
    quizzesBeingTaken: number
    certificatesIssuedToday: number
    lastUpdated: string
  }
}

interface FilterOptions {
  dateRange: {
    start: Date | null
    end: Date | null
  }
  courseCategories: string[]
  userRoles: string[]
  courseStatus: string[]
  userTypes: string[]
}

interface DrillDownData {
  type: 'course' | 'user' | 'category' | 'quiz'
  id: string | number
  title: string
  data: any
}

const LmsAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [timeRange, setTimeRange] = useState('30')
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    },
    courseCategories: [],
    userRoles: [],
    courseStatus: [],
    userTypes: []
  })
  const [drillDownOpen, setDrillDownOpen] = useState(false)
  const [drillDownData, setDrillDownData] = useState<DrillDownData | null>(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Colors for charts
  const chartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff', '#00ffff']

  // Mock data para analíticas
  const mockAnalyticsData: AnalyticsData = {
    totalUsers: 2547,
    activeUsers: 1834,
    totalCourses: 156,
    completedCourses: 89,
    totalCertificates: 1203,
    averageCompletionRate: 87,
    mandatoryCompletionRate: 92,
    averageTimeToComplete: 4.2,
    totalQuizAttempts: 5678,
    averageQuizScore: 84.5,
    topCourses: [
      {
        id: 1,
        title: 'JavaScript Avanzado',
        enrolledStudents: 234,
        completionRate: 92,
        rating: 4.8,
        category: 'Programación',
        averageTimeToComplete: 3.5,
        totalQuizAttempts: 456,
        averageScore: 87.2
      },
      {
        id: 2,
        title: 'React Fundamentals',
        enrolledStudents: 189,
        completionRate: 88,
        rating: 4.6,
        category: 'Programación',
        averageTimeToComplete: 4.1,
        totalQuizAttempts: 378,
        averageScore: 85.1
      },
      {
        id: 3,
        title: 'Gestión de Proyectos',
        enrolledStudents: 156,
        completionRate: 95,
        rating: 4.9,
        category: 'Gestión',
        averageTimeToComplete: 5.2,
        totalQuizAttempts: 312,
        averageScore: 91.3
      },
      {
        id: 4,
        title: 'Excel Avanzado',
        enrolledStudents: 145,
        completionRate: 85,
        rating: 4.5,
        category: 'Ofimática',
        averageTimeToComplete: 3.8,
        totalQuizAttempts: 290,
        averageScore: 82.7
      },
      {
        id: 5,
        title: 'Comunicación Efectiva',
        enrolledStudents: 123,
        completionRate: 90,
        rating: 4.7,
        category: 'Habilidades Blandas',
        averageTimeToComplete: 2.9,
        totalQuizAttempts: 246,
        averageScore: 88.9
      }
    ],
    userGrowth: [
      { date: '2024-01-01', newUsers: 45, activeUsers: 120, completions: 23, certificates: 18 },
      { date: '2024-02-01', newUsers: 52, activeUsers: 135, completions: 31, certificates: 25 },
      { date: '2024-03-01', newUsers: 38, activeUsers: 142, completions: 28, certificates: 22 },
      { date: '2024-04-01', newUsers: 67, activeUsers: 158, completions: 42, certificates: 35 },
      { date: '2024-05-01', newUsers: 73, activeUsers: 165, completions: 48, certificates: 41 },
      { date: '2024-06-01', newUsers: 89, activeUsers: 178, completions: 56, certificates: 47 },
      { date: '2024-07-01', newUsers: 94, activeUsers: 192, completions: 61, certificates: 52 },
      { date: '2024-08-01', newUsers: 87, activeUsers: 205, completions: 58, certificates: 49 },
      { date: '2024-09-01', newUsers: 102, activeUsers: 218, completions: 67, certificates: 58 },
      { date: '2024-10-01', newUsers: 115, activeUsers: 234, completions: 74, certificates: 63 }
    ],
    coursePerformance: [
      {
        category: 'Programación',
        totalCourses: 45,
        averageRating: 4.7,
        totalEnrollments: 1234,
        completionRate: 89,
        averageTimeToComplete: 4.1
      },
      {
        category: 'Gestión',
        totalCourses: 32,
        averageRating: 4.6,
        totalEnrollments: 987,
        completionRate: 92,
        averageTimeToComplete: 5.3
      },
      {
        category: 'Ofimática',
        totalCourses: 28,
        averageRating: 4.5,
        totalEnrollments: 756,
        completionRate: 85,
        averageTimeToComplete: 3.2
      },
      {
        category: 'Habilidades Blandas',
        totalCourses: 23,
        averageRating: 4.8,
        totalEnrollments: 654,
        completionRate: 94,
        averageTimeToComplete: 2.8
      },
      {
        category: 'Marketing',
        totalCourses: 18,
        averageRating: 4.4,
        totalEnrollments: 432,
        completionRate: 78,
        averageTimeToComplete: 4.7
      },
      {
        category: 'Seguridad',
        totalCourses: 15,
        averageRating: 4.9,
        totalEnrollments: 1456,
        completionRate: 96,
        averageTimeToComplete: 2.1
      }
    ],
    quizPerformance: [
      {
        courseId: 1,
        courseTitle: 'JavaScript Avanzado',
        totalAttempts: 456,
        averageScore: 87.2,
        passRate: 92,
        difficultQuestions: [
          { questionId: 1, question: 'Closures en JavaScript', failureRate: 35 },
          { questionId: 2, question: 'Async/Await vs Promises', failureRate: 28 }
        ]
      },
      {
        courseId: 2,
        courseTitle: 'React Fundamentals',
        totalAttempts: 378,
        averageScore: 85.1,
        passRate: 88,
        difficultQuestions: [
          { questionId: 3, question: 'React Hooks', failureRate: 42 },
          { questionId: 4, question: 'State Management', failureRate: 31 }
        ]
      }
    ],
    userEngagement: [
      {
        userId: 1,
        userName: 'Ana García',
        coursesEnrolled: 8,
        coursesCompleted: 6,
        totalTimeSpent: 24.5,
        lastActivity: '2024-10-15',
        certificatesEarned: 5
      },
      {
        userId: 2,
        userName: 'Carlos López',
        coursesEnrolled: 12,
        coursesCompleted: 10,
        totalTimeSpent: 45.2,
        lastActivity: '2024-10-14',
        certificatesEarned: 8
      }
    ],
    complianceData: [
      {
        role: 'Desarrollador',
        totalUsers: 45,
        mandatoryCoursesAssigned: 3,
        mandatoryCoursesCompleted: 2.8,
        complianceRate: 93,
        overdueUsers: 3
      },
      {
        role: 'Gerente',
        totalUsers: 12,
        mandatoryCoursesAssigned: 5,
        mandatoryCoursesCompleted: 4.6,
        complianceRate: 92,
        overdueUsers: 1
      },
      {
        role: 'Analista',
        totalUsers: 28,
        mandatoryCoursesAssigned: 4,
        mandatoryCoursesCompleted: 3.2,
        complianceRate: 80,
        overdueUsers: 6
      }
    ],
    realTimeMetrics: {
      activeUsersNow: 47,
      coursesInProgress: 123,
      quizzesBeingTaken: 8,
      certificatesIssuedToday: 12,
      lastUpdated: new Date().toISOString()
    }
  }

  // Auto-refresh functionality
  useEffect(() => {
    if (activeTab === 0) { // Only auto-refresh on overview tab
      const interval = setInterval(() => {
        setLastRefresh(new Date())
        // Trigger data refresh here
      }, 30000) // Refresh every 30 seconds
      
      return () => {
        if (interval) clearInterval(interval)
      }
    }
  }, [activeTab])

  // Query para obtener datos de analíticas (usando mock data por ahora)
  const { data: analyticsData = mockAnalyticsData, isLoading, refetch } =
    useQuery<AnalyticsData>(['lms-analytics', timeRange, filters], async () => {
      // En el futuro, esto hará una llamada real a la API
      // const response = await axiosPrivate.get(`/lms/analytics`, {
      //   params: {
      //     timeRange,
      //     startDate: filters.dateRange.start?.toISOString(),
      //     endDate: filters.dateRange.end?.toISOString(),
      //     categories: filters.courseCategories,
      //     roles: filters.userRoles,
      //     courseStatus: filters.courseStatus,
      //     userTypes: filters.userTypes
      //   }
      // })
      // return response.data
      return mockAnalyticsData
    })

  // Helper functions
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleDrillDown = (type: DrillDownData['type'], id: string | number, title: string, data: any) => {
    setDrillDownData({ type, id, title, data })
    setDrillDownOpen(true)
  }

  const handleExportData = async (format: 'csv' | 'pdf') => {
    try {
      // Show loading state
      console.log(`Exporting analytics data in ${format} format`)
      
      // Prepare export data based on current tab and filters
      if (format === 'csv') {
        // Generate CSV data
        let csvContent = ''
        
        switch (activeTab) {
          case 0: // Overview
            csvContent = generateOverviewCSV(analyticsData)
            break
          case 1: // Course Performance
            csvContent = generateCoursePerformanceCSV(analyticsData.topCourses)
            break
          case 2: // Quiz Analytics
            csvContent = generateQuizAnalyticsCSV(analyticsData.quizPerformance)
            break
          case 3: // User Engagement
            csvContent = generateUserEngagementCSV(analyticsData.userEngagement)
            break
          case 4: // Compliance
            csvContent = generateComplianceCSV(analyticsData.complianceData)
            break
        }
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `lms-analytics-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
      } else if (format === 'pdf') {
        // For PDF, we would typically use a library like jsPDF or send to backend
        // For now, we'll simulate the process
        console.log('PDF export would be implemented here')
        
        // In a real implementation:
        // const response = await axiosPrivate.post('/api/lms/analytics/export/pdf', exportData, {
        //   responseType: 'blob'
        // })
        // const blob = new Blob([response.data], { type: 'application/pdf' })
        // const url = window.URL.createObjectURL(blob)
        // const link = document.createElement('a')
        // link.href = url
        // link.download = `lms-analytics-${new Date().toISOString().split('T')[0]}.pdf`
        // link.click()
      }
      
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  // Helper functions for CSV generation
  const generateOverviewCSV = (data: AnalyticsData) => {
    const headers = ['Métrica', 'Valor', 'Descripción']
    const rows = [
      ['Total Usuarios', data.totalUsers.toString(), 'Número total de usuarios registrados'],
      ['Usuarios Activos', data.activeUsers.toString(), 'Usuarios que han accedido recientemente'],
      ['Total Cursos', data.totalCourses.toString(), 'Número total de cursos disponibles'],
      ['Cursos Completados', data.completedCourses.toString(), 'Número de cursos completados'],
      ['Certificados Emitidos', data.totalCertificates.toString(), 'Total de certificados generados'],
      ['Tasa de Finalización Promedio', `${data.averageCompletionRate}%`, 'Porcentaje promedio de finalización'],
      ['Tasa de Finalización Obligatorios', `${data.mandatoryCompletionRate}%`, 'Porcentaje de finalización de cursos obligatorios'],
      ['Tiempo Promedio de Finalización', `${data.averageTimeToComplete} días`, 'Tiempo promedio para completar un curso'],
      ['Total Intentos de Quiz', data.totalQuizAttempts.toString(), 'Número total de intentos de quiz'],
      ['Puntuación Promedio Quiz', `${data.averageQuizScore}%`, 'Puntuación promedio en quizzes']
    ]
    
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  const generateCoursePerformanceCSV = (courses: AnalyticsData['topCourses']) => {
    const headers = ['Curso', 'Categoría', 'Estudiantes Inscritos', 'Tasa de Finalización (%)', 'Rating', 'Tiempo Promedio (días)', 'Intentos de Quiz', 'Puntuación Promedio (%)']
    const rows = courses.map(course => [
      course.title,
      course.category,
      course.enrolledStudents.toString(),
      course.completionRate.toString(),
      course.rating.toString(),
      course.averageTimeToComplete.toString(),
      course.totalQuizAttempts.toString(),
      course.averageScore.toString()
    ])
    
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  const generateQuizAnalyticsCSV = (quizzes: AnalyticsData['quizPerformance']) => {
    const headers = ['Curso', 'Total Intentos', 'Puntuación Promedio (%)', 'Tasa de Aprobación (%)', 'Preguntas Difíciles']
    const rows = quizzes.map(quiz => [
      quiz.courseTitle,
      quiz.totalAttempts.toString(),
      quiz.averageScore.toString(),
      quiz.passRate.toString(),
      quiz.difficultQuestions.length.toString()
    ])
    
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  const generateUserEngagementCSV = (users: AnalyticsData['userEngagement']) => {
    const headers = ['Usuario', 'Cursos Inscritos', 'Cursos Completados', 'Tiempo Total (horas)', 'Certificados Obtenidos', 'Última Actividad', 'Tasa de Finalización (%)']
    const rows = users.map(user => [
      user.userName,
      user.coursesEnrolled.toString(),
      user.coursesCompleted.toString(),
      user.totalTimeSpent.toString(),
      user.certificatesEarned.toString(),
      user.lastActivity,
      Math.round((user.coursesCompleted / user.coursesEnrolled) * 100).toString()
    ])
    
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  const generateComplianceCSV = (compliance: AnalyticsData['complianceData']) => {
    const headers = ['Rol', 'Total Usuarios', 'Cursos Obligatorios Asignados', 'Cursos Obligatorios Completados', 'Tasa de Cumplimiento (%)', 'Usuarios con Cursos Vencidos']
    const rows = compliance.map(role => [
      role.role,
      role.totalUsers.toString(),
      role.mandatoryCoursesAssigned.toString(),
      role.mandatoryCoursesCompleted.toString(),
      role.complianceRate.toString(),
      role.overdueUsers.toString()
    ])
    
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  const handleRefresh = () => {
    setLastRefresh(new Date())
    refetch()
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return `hace ${diffInSeconds}s`
    if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)}h`
    return `hace ${Math.floor(diffInSeconds / 86400)}d`
  }

  const getComplianceColor = (rate: number) => {
    if (rate >= 95) return 'success'
    if (rate >= 85) return 'warning'
    return 'error'
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUpIcon color="success" fontSize="small" />
    if (current < previous) return <TrendingDownIcon color="error" fontSize="small" />
    return <TrendingUpIcon color="disabled" fontSize="small" />
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh'
        }}
      >
        <Typography>Cargando analíticas...</Typography>
      </Box>
    )
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2
            }}
          >
            <Box>
              <Typography variant='h4' component='h1' sx={{ fontWeight: 'bold' }}>
                Analíticas del Sistema LMS
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Última actualización: {formatTimeAgo(lastRefresh)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Actualizar datos">
                <IconButton onClick={handleRefresh} color="primary">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleExportData('csv')}
              >
                Exportar CSV
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleExportData('pdf')}
              >
                Exportar PDF
              </Button>
              <Button
                variant="contained"
                startIcon={<ReportIcon />}
                onClick={() => window.open('/lms/admin/reporting', '_blank')}
              >
                Reportes Avanzados
              </Button>
            </Box>
          </Box>

          {/* Filters */}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Período</InputLabel>
                <Select
                  value={timeRange}
                  label='Período'
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <MenuItem value='7'>Últimos 7 días</MenuItem>
                  <MenuItem value='30'>Últimos 30 días</MenuItem>
                  <MenuItem value='90'>Últimos 90 días</MenuItem>
                  <MenuItem value='365'>Último año</MenuItem>
                  <MenuItem value='custom'>Personalizado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {timeRange === 'custom' && (
              <>
                <Grid item xs={12} sm={6} md={2}>
                  <DatePicker
                    label="Fecha inicio"
                    value={filters.dateRange.start}
                    onChange={(date) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: date }
                    }))}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <DatePicker
                    label="Fecha fin"
                    value={filters.dateRange.end}
                    onChange={(date) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: date }
                    }))}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12} sm={6} md={2}>
              <Autocomplete
                multiple
                size="small"
                options={['Programación', 'Gestión', 'Ofimática', 'Habilidades Blandas', 'Marketing', 'Seguridad']}
                value={filters.courseCategories}
                onChange={(_, value) => setFilters(prev => ({ ...prev, courseCategories: value }))}
                renderInput={(params) => <TextField {...params} label="Categorías" />}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Autocomplete
                multiple
                size="small"
                options={['Desarrollador', 'Gerente', 'Analista', 'Admin']}
                value={filters.userRoles}
                onChange={(_, value) => setFilters(prev => ({ ...prev, userRoles: value }))}
                renderInput={(params) => <TextField {...params} label="Roles" />}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Autocomplete
                multiple
                size="small"
                options={['Interno', 'Cliente']}
                value={filters.userTypes}
                onChange={(_, value) => setFilters(prev => ({ ...prev, userTypes: value }))}
                renderInput={(params) => <TextField {...params} label="Tipo Usuario" />}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Real-time metrics alert */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">
              <strong>En tiempo real:</strong> {analyticsData.realTimeMetrics.activeUsersNow} usuarios activos, 
              {analyticsData.realTimeMetrics.coursesInProgress} cursos en progreso, 
              {analyticsData.realTimeMetrics.quizzesBeingTaken} quizzes siendo tomados
            </Typography>
            <Badge badgeContent={analyticsData.realTimeMetrics.certificatesIssuedToday} color="success">
              <SchoolIcon />
            </Badge>
          </Box>
        </Alert>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Resumen General" icon={<BarChartIcon />} />
          <Tab label="Rendimiento de Cursos" icon={<BookOpenIcon />} />
          <Tab label="Análisis de Quizzes" icon={<AssignmentIcon />} />
          <Tab label="Engagement de Usuarios" icon={<PeopleIcon />} />
          <Tab label="Cumplimiento" icon={<CheckCircleIcon />} />
        </Tabs>

        {/* Tab 0: Resumen General */}
        {activeTab === 0 && (
          <Box>
            {/* Estadísticas principales */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} lg={3}>
                <Card sx={{ cursor: 'pointer' }} onClick={() => handleDrillDown('user', 'all', 'Todos los Usuarios', analyticsData.userEngagement)}>
                  <CardHeader
                    avatar={<PeopleIcon color='primary' />}
                    title='Total Usuarios'
                    titleTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                    action={
                      <IconButton size="small">
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    }
                  />
                  <CardContent>
                    <Typography
                      variant='h4'
                      component='div'
                      sx={{ fontWeight: 'bold' }}
                    >
                      {analyticsData.totalUsers.toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant='body2' color='text.secondary'>
                        {analyticsData.activeUsers} activos
                      </Typography>
                      {getTrendIcon(analyticsData.activeUsers, 1750)}
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(analyticsData.activeUsers / analyticsData.totalUsers) * 100} 
                      sx={{ mt: 1, height: 4 }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} lg={3}>
                <Card sx={{ cursor: 'pointer' }} onClick={() => handleDrillDown('course', 'all', 'Todos los Cursos', analyticsData.topCourses)}>
                  <CardHeader
                    avatar={<BookOpenIcon color='success' />}
                    title='Cursos Activos'
                    titleTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                    action={
                      <IconButton size="small">
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    }
                  />
                  <CardContent>
                    <Typography
                      variant='h4'
                      component='div'
                      sx={{ fontWeight: 'bold' }}
                    >
                      {analyticsData.totalCourses}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant='body2' color='text.secondary'>
                        {analyticsData.completedCourses} completados
                      </Typography>
                      {getTrendIcon(analyticsData.completedCourses, 82)}
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(analyticsData.completedCourses / analyticsData.totalCourses) * 100} 
                      sx={{ mt: 1, height: 4 }}
                      color="success"
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} lg={3}>
                <Card>
                  <CardHeader
                    avatar={<SchoolIcon color='warning' />}
                    title='Certificados'
                    titleTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                  <CardContent>
                    <Typography
                      variant='h4'
                      component='div'
                      sx={{ fontWeight: 'bold' }}
                    >
                      {analyticsData.totalCertificates.toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant='body2' color='text.secondary'>
                        {analyticsData.realTimeMetrics.certificatesIssuedToday} hoy
                      </Typography>
                      {getTrendIcon(analyticsData.realTimeMetrics.certificatesIssuedToday, 8)}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} lg={3}>
                <Card>
                  <CardHeader
                    avatar={<TrendingUpIcon color='info' />}
                    title='Tasa de Finalización'
                    titleTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                  <CardContent>
                    <Typography
                      variant='h4'
                      component='div'
                      sx={{ fontWeight: 'bold' }}
                    >
                      {analyticsData.averageCompletionRate}%
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant='body2' color='text.secondary'>
                        Obligatorios: {analyticsData.mandatoryCompletionRate}%
                      </Typography>
                      {getTrendIcon(analyticsData.mandatoryCompletionRate, 89)}
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={analyticsData.averageCompletionRate} 
                      sx={{ mt: 1, height: 4 }}
                      color="info"
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} lg={3}>
                <Card>
                  <CardHeader
                    avatar={<ScheduleIcon color='secondary' />}
                    title='Tiempo Promedio'
                    titleTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                  <CardContent>
                    <Typography
                      variant='h4'
                      component='div'
                      sx={{ fontWeight: 'bold' }}
                    >
                      {analyticsData.averageTimeToComplete}d
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Para completar
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} lg={3}>
                <Card>
                  <CardHeader
                    avatar={<AssignmentIcon color='primary' />}
                    title='Quizzes'
                    titleTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                  <CardContent>
                    <Typography
                      variant='h4'
                      component='div'
                      sx={{ fontWeight: 'bold' }}
                    >
                      {analyticsData.totalQuizAttempts.toLocaleString()}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Intentos totales
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} lg={3}>
                <Card>
                  <CardHeader
                    avatar={<StarIcon color='warning' />}
                    title='Puntuación Promedio'
                    titleTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                  <CardContent>
                    <Typography
                      variant='h4'
                      component='div'
                      sx={{ fontWeight: 'bold' }}
                    >
                      {analyticsData.averageQuizScore}%
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      En quizzes
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} lg={3}>
                <Card>
                  <CardHeader
                    avatar={<GroupIcon color='success' />}
                    title='Usuarios Activos'
                    titleTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                  <CardContent>
                    <Typography
                      variant='h4'
                      component='div'
                      sx={{ fontWeight: 'bold' }}
                    >
                      {analyticsData.realTimeMetrics.activeUsersNow}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Ahora mismo
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* User Growth Chart */}
              <Grid item xs={12} lg={8}>
                <Card>
                  <CardHeader 
                    title="Crecimiento de Usuarios y Completaciones" 
                    action={
                      <IconButton onClick={() => handleDrillDown('user', 'growth', 'Crecimiento de Usuarios', analyticsData.userGrowth)}>
                        <VisibilityIcon />
                      </IconButton>
                    }
                  />
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analyticsData.userGrowth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { month: 'short' })} />
                        <YAxis />
                        <RechartsTooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES')}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="newUsers" stackId="1" stroke={chartColors[0]} fill={chartColors[0]} name="Nuevos Usuarios" />
                        <Area type="monotone" dataKey="completions" stackId="1" stroke={chartColors[1]} fill={chartColors[1]} name="Completaciones" />
                        <Area type="monotone" dataKey="certificates" stackId="1" stroke={chartColors[2]} fill={chartColors[2]} name="Certificados" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Course Performance Pie Chart */}
              <Grid item xs={12} lg={4}>
                <Card>
                  <CardHeader 
                    title="Distribución por Categoría" 
                    action={
                      <IconButton onClick={() => handleDrillDown('category', 'all', 'Rendimiento por Categoría', analyticsData.coursePerformance)}>
                        <VisibilityIcon />
                      </IconButton>
                    }
                  />
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={analyticsData.coursePerformance}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="totalEnrollments"
                        >
                          {analyticsData.coursePerformance.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Tab 1: Rendimiento de Cursos */}
        {activeTab === 1 && (
          <Box>
            <Grid container spacing={3}>
              {/* Top Cursos */}
              <Grid item xs={12} lg={8}>
                <Card>
                  <CardHeader 
                    title='Top Cursos por Rendimiento' 
                    action={
                      <Button size="small" onClick={() => handleDrillDown('course', 'top', 'Top Cursos', analyticsData.topCourses)}>
                        Ver Detalles
                      </Button>
                    }
                  />
                  <CardContent>
                    <TableContainer>
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell>Curso</TableCell>
                            <TableCell>Categoría</TableCell>
                            <TableCell align='right'>Estudiantes</TableCell>
                            <TableCell align='right'>Finalización</TableCell>
                            <TableCell align='right'>Tiempo Prom.</TableCell>
                            <TableCell align='right'>Rating</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {analyticsData.topCourses.map((course) => (
                            <TableRow 
                              key={course.id} 
                              hover 
                              sx={{ cursor: 'pointer' }}
                              onClick={() => handleDrillDown('course', course.id, course.title, course)}
                            >
                              <TableCell>
                                <Typography variant='subtitle2' fontWeight='bold'>
                                  {course.title}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={course.category} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell align='right'>
                                {course.enrolledStudents}
                              </TableCell>
                              <TableCell align='right'>
                                <Chip
                                  label={`${course.completionRate}%`}
                                  color={
                                    course.completionRate > 90 ? 'success' : 
                                    course.completionRate > 75 ? 'warning' : 'error'
                                  }
                                  size='small'
                                />
                              </TableCell>
                              <TableCell align='right'>
                                {course.averageTimeToComplete}d
                              </TableCell>
                              <TableCell align='right'>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end'
                                  }}
                                >
                                  <StarIcon
                                    sx={{
                                      fontSize: 'small',
                                      color: 'warning.main',
                                      mr: 0.5
                                    }}
                                  />
                                  {course.rating}
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Course Performance Chart */}
              <Grid item xs={12} lg={4}>
                <Card>
                  <CardHeader title="Completación por Categoría" />
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsBarChart data={analyticsData.coursePerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="completionRate" fill={chartColors[1]} name="% Completación" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Rendimiento por Categoría */}
              <Grid item xs={12}>
                <Card>
                  <CardHeader title='Análisis Detallado por Categoría' />
                  <CardContent>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Categoría</TableCell>
                            <TableCell align='right'>Cursos</TableCell>
                            <TableCell align='right'>Inscripciones</TableCell>
                            <TableCell align='right'>Completación</TableCell>
                            <TableCell align='right'>Tiempo Prom.</TableCell>
                            <TableCell align='right'>Rating Prom.</TableCell>
                            <TableCell align='center'>Tendencia</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {analyticsData.coursePerformance.map((category) => (
                            <TableRow 
                              key={category.category}
                              hover
                              sx={{ cursor: 'pointer' }}
                              onClick={() => handleDrillDown('category', category.category, category.category, category)}
                            >
                              <TableCell>
                                <Typography variant='subtitle2' fontWeight='bold'>
                                  {category.category}
                                </Typography>
                              </TableCell>
                              <TableCell align='right'>
                                {category.totalCourses}
                              </TableCell>
                              <TableCell align='right'>
                                {category.totalEnrollments.toLocaleString()}
                              </TableCell>
                              <TableCell align='right'>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={category.completionRate} 
                                    sx={{ width: 60, height: 6 }}
                                    color={category.completionRate > 90 ? 'success' : 'warning'}
                                  />
                                  <Typography variant="body2">{category.completionRate}%</Typography>
                                </Box>
                              </TableCell>
                              <TableCell align='right'>
                                {category.averageTimeToComplete}d
                              </TableCell>
                              <TableCell align='right'>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end'
                                  }}
                                >
                                  <StarIcon
                                    sx={{
                                      fontSize: 'small',
                                      color: 'warning.main',
                                      mr: 0.5
                                    }}
                                  />
                                  {category.averageRating}
                                </Box>
                              </TableCell>
                              <TableCell align='center'>
                                {getTrendIcon(category.completionRate, 85)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Tab 2: Análisis de Quizzes */}
        {activeTab === 2 && (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Rendimiento de Quizzes por Curso" />
                  <CardContent>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Curso</TableCell>
                            <TableCell align='right'>Total Intentos</TableCell>
                            <TableCell align='right'>Puntuación Prom.</TableCell>
                            <TableCell align='right'>Tasa de Aprobación</TableCell>
                            <TableCell align='right'>Preguntas Difíciles</TableCell>
                            <TableCell align='center'>Acciones</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {analyticsData.quizPerformance.map((quiz) => (
                            <TableRow key={quiz.courseId}>
                              <TableCell>
                                <Typography variant='subtitle2' fontWeight='bold'>
                                  {quiz.courseTitle}
                                </Typography>
                              </TableCell>
                              <TableCell align='right'>
                                {quiz.totalAttempts.toLocaleString()}
                              </TableCell>
                              <TableCell align='right'>
                                <Chip
                                  label={`${quiz.averageScore}%`}
                                  color={quiz.averageScore > 85 ? 'success' : quiz.averageScore > 70 ? 'warning' : 'error'}
                                  size='small'
                                />
                              </TableCell>
                              <TableCell align='right'>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={quiz.passRate} 
                                    sx={{ width: 60, height: 6 }}
                                    color={quiz.passRate > 90 ? 'success' : 'warning'}
                                  />
                                  <Typography variant="body2">{quiz.passRate}%</Typography>
                                </Box>
                              </TableCell>
                              <TableCell align='right'>
                                <Badge badgeContent={quiz.difficultQuestions.length} color="error">
                                  <WarningIcon color="warning" />
                                </Badge>
                              </TableCell>
                              <TableCell align='center'>
                                <Button 
                                  size="small" 
                                  onClick={() => handleDrillDown('quiz', quiz.courseId, quiz.courseTitle, quiz)}
                                >
                                  Analizar
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Distribución de Puntuaciones" />
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsBarChart data={[
                        { range: '0-50%', count: 45 },
                        { range: '51-70%', count: 123 },
                        { range: '71-85%', count: 234 },
                        { range: '86-95%', count: 345 },
                        { range: '96-100%', count: 156 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="count" fill={chartColors[3]} name="Número de Intentos" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Preguntas con Mayor Dificultad" />
                  <CardContent>
                    <List>
                      {analyticsData.quizPerformance.flatMap(quiz => 
                        quiz.difficultQuestions.map(q => (
                          <ListItem key={q.questionId}>
                            <ListItemIcon>
                              <WarningIcon color="error" />
                            </ListItemIcon>
                            <ListItemText
                              primary={q.question}
                              secondary={`Tasa de fallo: ${q.failureRate}%`}
                            />
                            <Chip 
                              label={`${q.failureRate}%`} 
                              color="error" 
                              size="small" 
                            />
                          </ListItem>
                        ))
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Tab 3: Engagement de Usuarios */}
        {activeTab === 3 && (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Usuarios Más Activos" />
                  <CardContent>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Usuario</TableCell>
                            <TableCell align='right'>Cursos Inscritos</TableCell>
                            <TableCell align='right'>Cursos Completados</TableCell>
                            <TableCell align='right'>Tiempo Total</TableCell>
                            <TableCell align='right'>Certificados</TableCell>
                            <TableCell align='right'>Última Actividad</TableCell>
                            <TableCell align='center'>Engagement</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {analyticsData.userEngagement.map((user) => (
                            <TableRow 
                              key={user.userId}
                              hover
                              sx={{ cursor: 'pointer' }}
                              onClick={() => handleDrillDown('user', user.userId, user.userName, user)}
                            >
                              <TableCell>
                                <Typography variant='subtitle2' fontWeight='bold'>
                                  {user.userName}
                                </Typography>
                              </TableCell>
                              <TableCell align='right'>
                                {user.coursesEnrolled}
                              </TableCell>
                              <TableCell align='right'>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={(user.coursesCompleted / user.coursesEnrolled) * 100} 
                                    sx={{ width: 60, height: 6 }}
                                  />
                                  <Typography variant="body2">{user.coursesCompleted}</Typography>
                                </Box>
                              </TableCell>
                              <TableCell align='right'>
                                {user.totalTimeSpent}h
                              </TableCell>
                              <TableCell align='right'>
                                <Badge badgeContent={user.certificatesEarned} color="success">
                                  <SchoolIcon />
                                </Badge>
                              </TableCell>
                              <TableCell align='right'>
                                {new Date(user.lastActivity).toLocaleDateString('es-ES')}
                              </TableCell>
                              <TableCell align='center'>
                                <Chip
                                  label={`${Math.round((user.coursesCompleted / user.coursesEnrolled) * 100)}%`}
                                  color={(user.coursesCompleted / user.coursesEnrolled) > 0.8 ? 'success' : 'warning'}
                                  size='small'
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Actividad por Día de la Semana" />
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsBarChart data={[
                        { day: 'Lun', activity: 234 },
                        { day: 'Mar', activity: 345 },
                        { day: 'Mié', activity: 456 },
                        { day: 'Jue', activity: 378 },
                        { day: 'Vie', activity: 289 },
                        { day: 'Sáb', activity: 123 },
                        { day: 'Dom', activity: 89 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="activity" fill={chartColors[4]} name="Actividad" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Tiempo de Estudio por Hora" />
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={[
                        { hour: '8:00', users: 45 },
                        { hour: '10:00', users: 123 },
                        { hour: '12:00', users: 89 },
                        { hour: '14:00', users: 156 },
                        { hour: '16:00', users: 234 },
                        { hour: '18:00', users: 178 },
                        { hour: '20:00', users: 67 },
                        { hour: '22:00', users: 23 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <RechartsTooltip />
                        <Line type="monotone" dataKey="users" stroke={chartColors[5]} strokeWidth={2} name="Usuarios Activos" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Tab 4: Cumplimiento */}
        {activeTab === 4 && (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Atención:</strong> {analyticsData.complianceData.reduce((acc, role) => acc + role.overdueUsers, 0)} usuarios tienen entrenamientos obligatorios vencidos.
                  </Typography>
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Estado de Cumplimiento por Rol" />
                  <CardContent>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Rol</TableCell>
                            <TableCell align='right'>Total Usuarios</TableCell>
                            <TableCell align='right'>Cursos Asignados</TableCell>
                            <TableCell align='right'>Cursos Completados</TableCell>
                            <TableCell align='right'>Tasa de Cumplimiento</TableCell>
                            <TableCell align='right'>Usuarios Vencidos</TableCell>
                            <TableCell align='center'>Estado</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {analyticsData.complianceData.map((role) => (
                            <TableRow key={role.role}>
                              <TableCell>
                                <Typography variant='subtitle2' fontWeight='bold'>
                                  {role.role}
                                </Typography>
                              </TableCell>
                              <TableCell align='right'>
                                {role.totalUsers}
                              </TableCell>
                              <TableCell align='right'>
                                {role.mandatoryCoursesAssigned}
                              </TableCell>
                              <TableCell align='right'>
                                {role.mandatoryCoursesCompleted}
                              </TableCell>
                              <TableCell align='right'>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={role.complianceRate} 
                                    sx={{ width: 80, height: 8 }}
                                    color={getComplianceColor(role.complianceRate) as any}
                                  />
                                  <Typography variant="body2">{role.complianceRate}%</Typography>
                                </Box>
                              </TableCell>
                              <TableCell align='right'>
                                {role.overdueUsers > 0 ? (
                                  <Badge badgeContent={role.overdueUsers} color="error">
                                    <WarningIcon color="error" />
                                  </Badge>
                                ) : (
                                  <CheckCircleIcon color="success" />
                                )}
                              </TableCell>
                              <TableCell align='center'>
                                <Chip
                                  label={role.complianceRate >= 95 ? 'Excelente' : role.complianceRate >= 85 ? 'Bueno' : 'Requiere Atención'}
                                  color={getComplianceColor(role.complianceRate) as any}
                                  size='small'
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Cumplimiento General" />
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={[
                            { name: 'Completo', value: analyticsData.complianceData.reduce((acc, role) => acc + (role.totalUsers * role.complianceRate / 100), 0) },
                            { name: 'Pendiente', value: analyticsData.complianceData.reduce((acc, role) => acc + (role.totalUsers * (100 - role.complianceRate) / 100), 0) }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill={chartColors[1]} />
                          <Cell fill={chartColors[3]} />
                        </Pie>
                        <RechartsTooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Tendencia de Cumplimiento" />
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={[
                        { month: 'Ene', compliance: 85 },
                        { month: 'Feb', compliance: 87 },
                        { month: 'Mar', compliance: 89 },
                        { month: 'Abr', compliance: 91 },
                        { month: 'May', compliance: 88 },
                        { month: 'Jun', compliance: 92 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis domain={[80, 100]} />
                        <RechartsTooltip />
                        <Line type="monotone" dataKey="compliance" stroke={chartColors[1]} strokeWidth={3} name="% Cumplimiento" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Drill-down Dialog */}
        <Dialog open={drillDownOpen} onClose={() => setDrillDownOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle>
            Análisis Detallado: {drillDownData?.title}
          </DialogTitle>
          <DialogContent>
            {drillDownData && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Tipo: {drillDownData.type}
                </Typography>
                <pre>{JSON.stringify(drillDownData.data, null, 2)}</pre>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDrillDownOpen(false)}>Cerrar</Button>
            <Button variant="contained" onClick={() => handleExportData('csv')}>
              Exportar Datos
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  )
}

export default LmsAnalytics
