import React, { useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  LinearProgress,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Skeleton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab
} from '@mui/material'
import {
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Star as StarIcon,
  AccessTime as AccessTimeIcon,
  People as PeopleIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material'
import { LmsDashboardScope } from '../../../utils/lmsIdentity'

// Modern color palette
const colors = {
  primary: '#10b981',
  primaryLight: '#f0fdf4',
  success: '#059669',
  warning: '#d97706',
  error: '#dc2626',
  info: '#3b82f6',
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

interface CourseMetrics {
  totalCourses?: number
  publishedCourses?: number
  draftCourses?: number
  averageCompletionRate?: number
  averageTimeSpent?: number
  completionTrend?: {
    current: number
    previous: number
    change: number
    direction: 'up' | 'down' | 'stable'
  }
  popularityCourses?: Array<{
    courseId: number
    title: string
    completionRate: number
    totalUsers: number
    enrollmentCount: number
    averageRating: number
    isMandatory: boolean
    timeToComplete: number
    trend: 'up' | 'down' | 'stable'
  }>
  topPerformingCourses?: Array<{
    courseId: number
    title: string
    completionRate: number
    totalUsers: number
    isMandatory: boolean
    timeToComplete: number
    trend: 'up' | 'down' | 'stable'
  }>
  underperformingCourses?: Array<{
    courseId: number
    title: string
    completionRate: number
    totalUsers: number
    isMandatory: boolean
    timeToComplete: number
    trend: 'up' | 'down' | 'stable'
  }>
  timeToCompletionAnalytics?: {
    average: number
    fastest: number
    slowest: number
    distribution: Array<{
      range: string
      count: number
      percentage: number
    }>
  }
}

interface EnhancedCourseMetricsWidgetProps {
  data?: CourseMetrics
  loading?: boolean
  error?: string
  onCourseClick?: (courseId: number) => void
  onViewAll?: () => void
  onDrillDown?: (type: 'performance' | 'popularity' | 'time-analysis', courseId?: number) => void
  scope?: LmsDashboardScope
  userRole?: string
  department?: string
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`course-metrics-tabpanel-${index}`}
      aria-labelledby={`course-metrics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  )
}

const EnhancedCourseMetricsWidget: React.FC<EnhancedCourseMetricsWidgetProps> = ({
  data,
  loading = false,
  error,
  scope = 'admin',
  department,
  onCourseClick,
  onViewAll,
  onDrillDown
}) => {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState(0)
  if (loading) {
    return (
      <Card sx={{ borderRadius: '16px', border: `1px solid ${colors.gray[200]}` }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="40%" height={20} />
            </Box>
          </Box>
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card sx={{ borderRadius: '16px', border: `1px solid ${colors.error}` }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', color: colors.error }}>
            <WarningIcon sx={{ mr: 1 }} />
            <Typography variant="body2">Error loading course metrics</Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  // Role-based data filtering and display logic
  const getScopeLabel = () => {
    switch (scope) {
      case 'training_manager':
        return 'Cursos Gestionados'
      case 'limited':
        return `Cursos - ${department || 'Vista Operativa'}`
      default:
        return 'Métricas de Cursos'
    }
  }

  const getScopeDescription = () => {
    switch (scope) {
      case 'training_manager':
        return 'Cursos bajo su gestión'
      case 'limited':
        return 'Cursos visibles para la operación actual'
      default:
        return 'Vista completa del sistema'
    }
  }

  const completionTrend = data.completionTrend?.direction || 
    ((data.averageCompletionRate || 0) >= 80 ? 'up' : 
     (data.averageCompletionRate || 0) >= 60 ? 'stable' : 'down')

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue)
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon sx={{ color: colors.success, fontSize: 16 }} />
      case 'down':
        return <TrendingDownIcon sx={{ color: colors.error, fontSize: 16 }} />
      default:
        return <TimelineIcon sx={{ color: colors.warning, fontSize: 16 }} />
    }
  }

  return (
    <Card sx={{
      borderRadius: '16px',
      border: `1px solid ${colors.gray[200]}`,
      transition: 'all 0.3s ease-in-out',
      '&:hover': {
        borderColor: colors.primary,
        boxShadow: `0 8px 25px rgba(16, 185, 129, 0.15)`,
        transform: 'translateY(-2px)'
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{
            bgcolor: colors.primaryLight,
            color: colors.primary,
            mr: 2,
            width: 48,
            height: 48
          }}>
            <SchoolIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: colors.gray[800] }}>
              {getScopeLabel()}
            </Typography>
            <Typography variant="body2" color={colors.gray[500]}>
              {getScopeDescription()}
            </Typography>
            {scope !== 'admin' && (
              <Chip
                label={scope === 'training_manager' ? 'Gestor' : 'Vista Acotada'}
                size="small"
                sx={{
                  mt: 0.5,
                  bgcolor: colors.primaryLight,
                  color: colors.primary,
                  fontSize: '0.7rem',
                  height: 20
                }}
              />
            )}
          </Box>
          <Tooltip title="Ver detalles completos">
            <IconButton onClick={onViewAll} size="small">
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Main Metrics */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: colors.gray[50], borderRadius: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: colors.gray[800] }}>
                {data.totalCourses || 0}
              </Typography>
              <Typography variant="body2" color={colors.gray[500]}>
                Total Cursos
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: colors.primaryLight, borderRadius: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: colors.primary }}>
                {data.publishedCourses || 0}
              </Typography>
              <Typography variant="body2" color={colors.primary}>
                Publicados
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Completion Rate with Trend */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: colors.gray[700] }}>
              Tasa de Finalización Promedio
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {getTrendIcon(completionTrend)}
              <Typography variant="body2" sx={{ fontWeight: 700, color: colors.gray[800], ml: 0.5 }}>
                {data.averageCompletionRate || 0}%
              </Typography>
              {data.completionTrend && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    ml: 1, 
                    color: data.completionTrend.direction === 'up' ? colors.success : 
                           data.completionTrend.direction === 'down' ? colors.error : colors.warning,
                    fontWeight: 600
                  }}
                >
                  {data.completionTrend.change > 0 ? '+' : ''}{data.completionTrend.change}%
                </Typography>
              )}
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={data.averageCompletionRate || 0}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: colors.gray[200],
              '& .MuiLinearProgress-bar': {
                bgcolor: (data.averageCompletionRate || 0) >= 80 ? colors.success : 
                        (data.averageCompletionRate || 0) >= 60 ? colors.warning : colors.error,
                borderRadius: 4
              }
            }}
          />
        </Box>

        {/* Course Rankings with Performance Metrics */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: colors.gray[700] }}>
              Ranking de Cursos
            </Typography>
            <Button
              size="small"
              startIcon={<BarChartIcon />}
              onClick={() => setDetailsOpen(true)}
              sx={{ 
                color: colors.primary,
                fontSize: '0.75rem',
                textTransform: 'none'
              }}
            >
              Ver Análisis
            </Button>
          </Box>

          {/* Top Performing Courses */}
          {data.topPerformingCourses && data.topPerformingCourses.length > 0 && (
            <>
              <Typography variant="caption" sx={{ color: colors.success, fontWeight: 600, mb: 1, display: 'block' }}>
                🏆 Mejor Rendimiento
              </Typography>
              {data.topPerformingCourses.slice(0, 2).map((course, index) => (
                <Box
                  key={course.courseId}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    mb: 1,
                    bgcolor: colors.gray[50],
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    border: index === 0 ? `2px solid ${colors.success}` : 'none',
                    '&:hover': {
                      bgcolor: colors.primaryLight,
                      transform: 'translateX(4px)'
                    }
                  }}
                  onClick={() => onCourseClick?.(course.courseId)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                    {index === 0 && <StarIcon sx={{ color: colors.warning, fontSize: 16, mr: 0.5 }} />}
                    <CheckCircleIcon sx={{ color: colors.success, fontSize: 20 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: colors.gray[800] }}>
                        {course.title.length > 25 ? `${course.title.substring(0, 25)}...` : course.title}
                      </Typography>
                      {getTrendIcon(course.trend || 'stable')}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color={colors.gray[500]}>
                        {course.totalUsers} usuarios • {course.completionRate}%
                      </Typography>
                      <Chip
                        label={formatTime(course.timeToComplete || 0)}
                        size="small"
                        icon={<AccessTimeIcon />}
                        sx={{
                          height: 16,
                          fontSize: '0.6rem',
                          bgcolor: colors.info,
                          color: 'white'
                        }}
                      />
                    </Box>
                  </Box>
                  {course.isMandatory && (
                    <Chip
                      label="Obligatorio"
                      size="small"
                      sx={{
                        bgcolor: colors.warning,
                        color: 'white',
                        fontSize: '0.7rem',
                        height: 20
                      }}
                    />
                  )}
                </Box>
              ))}
            </>
          )}

          {/* Popular Courses */}
          {data.popularityCourses && data.popularityCourses.length > 0 && (
            <>
              <Typography variant="caption" sx={{ color: colors.info, fontWeight: 600, mb: 1, mt: 2, display: 'block' }}>
                🔥 Más Populares
              </Typography>
              {data.popularityCourses.slice(0, 1).map((course) => (
                <Box
                  key={course.courseId}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    mb: 1,
                    bgcolor: colors.gray[50],
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    border: `2px solid ${colors.info}`,
                    '&:hover': {
                      bgcolor: colors.primaryLight,
                      transform: 'translateX(4px)'
                    }
                  }}
                  onClick={() => onCourseClick?.(course.courseId)}
                >
                  <PeopleIcon sx={{ color: colors.info, mr: 2, fontSize: 20 }} />
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: colors.gray[800] }}>
                        {course.title.length > 25 ? `${course.title.substring(0, 25)}...` : course.title}
                      </Typography>
                      {getTrendIcon(course.trend || 'stable')}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color={colors.gray[500]}>
                        {course.enrollmentCount} inscripciones
                      </Typography>
                      <Typography variant="caption" color={colors.warning}>
                        ⭐ {course.averageRating?.toFixed(1) || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </>
          )}
        </Box>

        {/* Underperforming Courses Alert */}
        {data.underperformingCourses && data.underperformingCourses.length > 0 && (
          <Box sx={{
            p: 2,
            bgcolor: '#fef3c7',
            borderRadius: 2,
            border: `1px solid ${colors.warning}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <WarningIcon sx={{ color: colors.warning, mr: 1, fontSize: 16 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: colors.warning }}>
                Cursos que Requieren Atención
              </Typography>
            </Box>
            <Typography variant="caption" color={colors.gray[600]}>
              {data.underperformingCourses.length} curso(s) con baja tasa de finalización
            </Typography>
          </Box>
        )}

        {/* Enhanced Stats with Time Analytics */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, pt: 2, borderTop: `1px solid ${colors.gray[200]}` }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: colors.gray[800] }}>
              {formatTime(data.averageTimeSpent || 0)}
            </Typography>
            <Typography variant="caption" color={colors.gray[500]}>
              Tiempo Promedio
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: colors.gray[800] }}>
              {data.draftCourses || 0}
            </Typography>
            <Typography variant="caption" color={colors.gray[500]}>
              En Borrador
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: colors.primary }}>
              {data.topPerformingCourses?.length || 0}
            </Typography>
            <Typography variant="caption" color={colors.gray[500]}>
              Destacados
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: colors.info }}>
              {data.timeToCompletionAnalytics?.fastest ? formatTime(data.timeToCompletionAnalytics.fastest) : 'N/A'}
            </Typography>
            <Typography variant="caption" color={colors.gray[500]}>
              Más Rápido
            </Typography>
          </Box>
        </Box>
      </CardContent>

      {/* Detailed Analytics Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px' }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BarChartIcon sx={{ mr: 2, color: colors.primary }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Análisis Detallado de Cursos
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="Rendimiento" />
            <Tab label="Popularidad" />
            <Tab label="Tiempo de Finalización" />
          </Tabs>

          {/* Performance Analysis Tab */}
          <TabPanel value={selectedTab} index={0}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Análisis de Rendimiento por Curso
            </Typography>
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: colors.gray[50] }}>
                    <TableCell sx={{ fontWeight: 600 }}>Curso</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Usuarios</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Finalización</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Tendencia</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Tiempo Promedio</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.topPerformingCourses?.map((course) => (
                    <TableRow key={course.courseId} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {course.title}
                          </Typography>
                          {course.isMandatory && (
                            <Chip label="Obligatorio" size="small" sx={{ mt: 0.5, height: 16, fontSize: '0.6rem' }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">{course.totalUsers}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: colors.success }}>
                            {course.completionRate}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        {getTrendIcon(course.trend || 'stable')}
                      </TableCell>
                      <TableCell align="center">
                        {formatTime(course.timeToComplete || 0)}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => {
                            onDrillDown?.('performance', course.courseId)
                            setDetailsOpen(false)
                          }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Popularity Analysis Tab */}
          <TabPanel value={selectedTab} index={1}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Ranking de Popularidad
            </Typography>
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: colors.gray[50] }}>
                    <TableCell sx={{ fontWeight: 600 }}>Ranking</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Curso</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Inscripciones</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Calificación</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Tendencia</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.popularityCourses?.map((course, index) => (
                    <TableRow key={course.courseId} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: colors.primary, mr: 1 }}>
                            #{index + 1}
                          </Typography>
                          {index === 0 && <StarIcon sx={{ color: colors.warning, fontSize: 16 }} />}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {course.title}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontWeight: 600, color: colors.info }}>
                          {course.enrollmentCount}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="body2" sx={{ mr: 0.5 }}>
                            ⭐ {course.averageRating?.toFixed(1) || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        {getTrendIcon(course.trend || 'stable')}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => {
                            onDrillDown?.('popularity', course.courseId)
                            setDetailsOpen(false)
                          }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Time Analysis Tab */}
          <TabPanel value={selectedTab} index={2}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Análisis de Tiempo de Finalización
            </Typography>
            
            {data.timeToCompletionAnalytics && (
              <>
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ p: 2, textAlign: 'center', bgcolor: colors.primaryLight }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: colors.primary }}>
                        {formatTime(data.timeToCompletionAnalytics.average)}
                      </Typography>
                      <Typography variant="body2" color={colors.gray[600]}>
                        Tiempo Promedio
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ p: 2, textAlign: 'center', bgcolor: colors.gray[50] }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: colors.success }}>
                        {formatTime(data.timeToCompletionAnalytics.fastest)}
                      </Typography>
                      <Typography variant="body2" color={colors.gray[600]}>
                        Más Rápido
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ p: 2, textAlign: 'center', bgcolor: colors.gray[50] }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: colors.warning }}>
                        {formatTime(data.timeToCompletionAnalytics.slowest)}
                      </Typography>
                      <Typography variant="body2" color={colors.gray[600]}>
                        Más Lento
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>

                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  Distribución de Tiempos
                </Typography>
                <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: colors.gray[50] }}>
                        <TableCell sx={{ fontWeight: 600 }}>Rango de Tiempo</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Cantidad de Cursos</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Porcentaje</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.timeToCompletionAnalytics.distribution?.map((item, index) => (
                        <TableRow key={index} hover>
                          <TableCell>{item.range}</TableCell>
                          <TableCell align="center">{item.count}</TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Typography variant="body2" sx={{ mr: 1 }}>
                                {item.percentage}%
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={item.percentage}
                                sx={{
                                  width: 60,
                                  height: 6,
                                  borderRadius: 3,
                                  bgcolor: colors.gray[200],
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: colors.primary,
                                    borderRadius: 3
                                  }
                                }}
                              />
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button
                    variant="outlined"
                    startIcon={<TimelineIcon />}
                    onClick={() => {
                      onDrillDown?.('time-analysis')
                      setDetailsOpen(false)
                    }}
                    sx={{ borderRadius: 2 }}
                  >
                    Ver Análisis Completo de Tiempos
                  </Button>
                </Box>
              </>
            )}
          </TabPanel>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDetailsOpen(false)} sx={{ borderRadius: 2 }}>
            Cerrar
          </Button>
          <Button
            variant="contained"
            onClick={onViewAll}
            sx={{
              borderRadius: 2,
              bgcolor: colors.primary,
              '&:hover': { bgcolor: colors.success }
            }}
          >
            Ver Dashboard Completo
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default EnhancedCourseMetricsWidget
