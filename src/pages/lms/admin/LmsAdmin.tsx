import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  Paper,
  Alert
} from '@mui/material'
import {
  School as SchoolIcon,
  People as PeopleIcon,
  EmojiEvents as CertificateIcon,
  TrendingUp as AnalyticsIcon,
  Assignment as AssignmentIcon,
  Assessment as AssessmentIcon,
  Add as AddIcon,
  Warning as WarningIcon,
  VideoLibrary as VideoIcon,
  Logout as LogoutIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@nanostores/react'
import { userStore } from '../../../store/userStore'
import {
  useCourses,
  useComprehensiveDashboard,
  useQuizPerformanceAnalytics
} from '../../../hooks/useLms'
import EnhancedCourseMetricsWidget from '../../../Components/lms/widgets/EnhancedCourseMetricsWidget'
import UserAnalyticsWidget from '../../../Components/lms/widgets/UserAnalyticsWidget'
import QuizPerformanceDashboard from '../../../Components/lms/widgets/QuizPerformanceDashboard'
import {
  useUserLMSRole,
  getFilteredQuickActions,
  getRoleDisplayInfo
} from '../../../utils/roleUtils'
import { getLmsDashboardScope } from '../../../utils/lmsIdentity'
import RoleBasedDataFilter from '../../../Components/lms/widgets/RoleBasedDataFilter'
import {
  DashboardErrorBoundary,
  MetricsErrorBoundary,
  QuickActionsErrorBoundary,
  WidgetErrorBoundary
} from '../../../Components/lms/ErrorBoundary/DashboardErrorBoundaries'
import { useErrorReporting } from '../../../services/errorReportingService'
import { MetricCardSkeleton } from '../../../Components/lms/LoadingStates/SkeletonComponents'
import { useToast } from '../../../Components/lms/Notifications/ToastNotifications'
import { MetricHelp, LMSMetricHelp } from '../../../Components/lms/Help/ContextualHelp'

// Modern color palette following design system
const colors = {
  primary: '#10b981',
  primaryDark: '#059669',
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
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  }
}

interface QuickActionCard {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  gradient: string
  route: string
  isNew?: boolean
}
const LmsAdmin: React.FC = () => {
  const navigate = useNavigate()
  const $userStore = useStore(userStore)
  const userRole = useUserLMSRole()

  const roleInfo = getRoleDisplayInfo(userRole)
  const { reportError } = useErrorReporting()
  const { showError, showSuccess, showWarning } = useToast()

  // Fetch comprehensive dashboard data
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError
  } = useComprehensiveDashboard()

  // Fetch quiz performance analytics
  const {
    data: quizAnalyticsData,
    isLoading: quizLoading,
    error: quizError
  } = useQuizPerformanceAnalytics()

  // Fetch courses data for fallback
  const { data: coursesData, error: coursesError } = useCourses({
    limit: 5,
    status: 'published',
    sortBy: 'created_at',
    sortOrder: 'DESC'
  })

  // Use courses data for recent courses display
  const recentCourses = coursesData?.courses || []

  // Extract data from comprehensive dashboard
  const metrics = dashboardData?.metrics || {}
  const courseMetrics = dashboardData?.courseMetrics || {}
  const userAnalytics = dashboardData?.userAnalytics || {}
  const quizMetrics = dashboardData?.quizAnalytics || {}
  const currentUser = {
    id: $userStore.customer?.id || 1,
    email: $userStore.email || '',
    role: userRole,
    name: $userStore.nombre || $userStore.email || 'Administrador'
  }

  // Role-based quick actions
  const allQuickActions: QuickActionCard[] = [
    {
      id: 'course-management',
      title: 'Cursos',
      description: 'Crear, editar y organizar el catalogo',
      icon: <VideoIcon />,
      color: colors.info,
      gradient: `linear-gradient(135deg, ${colors.info} 0%, #2563eb 100%)`,
      route: '/lms/admin/courses'
    },
    {
      id: 'assignments',
      title: 'Asignaciones',
      description: 'Cursos obligatorios y roles',
      icon: <AssignmentIcon />,
      color: colors.warning,
      gradient: `linear-gradient(135deg, ${colors.warning} 0%, #ea580c 100%)`,
      route: '/lms/admin/assignments'
    },
    {
      id: 'analytics',
      title: 'Analíticas',
      description: 'Reportes y métricas',
      icon: <AnalyticsIcon />,
      color: colors.success,
      gradient: `linear-gradient(135deg, ${colors.success} 0%, #047857 100%)`,
      route: '/lms/admin/analytics'
    },
    {
      id: 'reports',
      title: 'Reportes',
      description: 'Generación y análisis de reportes',
      icon: <AssessmentIcon />,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      route: '/lms/admin/reporting',
      isNew: true
    },
    {
      id: 'certificates',
      title: 'Certificados',
      description: 'Plantillas y emisión',
      icon: <CertificateIcon />,
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      route: '/lms/admin/certificate-templates'
    }
  ]

  // Filter quick actions based on user role
  const quickActions = getFilteredQuickActions(userRole, allQuickActions)
  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    navigate('/')
  }

  const handleQuickAction = (route: string, actionName?: string) => {
    navigate(route)
    if (actionName) {
      showSuccess(`Navegando a ${actionName}`, {
        duration: 2000
      })
    }
  }

  const toNumber = (value: unknown, fallback = 0) => {
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  // Real data with honest fallbacks
  const dashboardStats = {
    totalUsers: toNumber(metrics?.totalUsers),
    totalCourses: toNumber(metrics?.totalCourses),
    totalCertificates: toNumber(metrics?.totalCertificates),
    completionRate: toNumber(metrics?.completionRate),
    activeUsers: toNumber(metrics?.activeUsers),
    pendingAssignments: toNumber(metrics?.pendingAssignments),
    overdueTraining: toNumber(metrics?.overdueTraining)
  }

  // Loading state for the entire dashboard
  const isLoading = dashboardLoading

  // Handle API errors with toast notifications
  React.useEffect(() => {
    if (dashboardError) {
      showError('Error al cargar datos del dashboard', {
        title: 'Error de Conexión',
        metadata: { section: 'dashboard' }
      })
    }
    if (coursesError) {
      showWarning('No se pudieron cargar algunos cursos', {
        title: 'Advertencia',
        metadata: { section: 'courses' }
      })
    }
    if (quizError) {
      showError('Error al cargar analíticas de quizzes', {
        title: 'Error de Datos',
        metadata: { section: 'quizzes' }
      })
    }
  }, [dashboardError, coursesError, quizError, showError, showWarning])



  return (
    <DashboardErrorBoundary
      onError={(error, errorInfo) => {
        reportError(error, {
          section: 'lms_dashboard',
          severity: 'critical',
          componentStack: errorInfo.componentStack,
          tags: {
            userRole: userRole,
            userId: currentUser.id.toString()
          }
        })
      }}
    >
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: colors.gray[50],
          pb: 4
        }}
      >
        {/* Modern Header */}
        <Paper
          elevation={0}
          sx={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
            color: 'white',
            borderRadius: 0,
            mb: 4
          }}
        >
          <Box
            sx={{
              maxWidth: '1200px',
              mx: 'auto',
              px: { xs: 2, sm: 3, lg: 4 },
              py: 4
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Box>
                <Typography
                  variant='h3'
                  component='h1'
                  sx={{
                    fontWeight: 700,
                    mb: 1,
                    fontSize: { xs: '1.75rem', md: '2.5rem' }
                  }}
                >
                  Sistema de Gestión de Aprendizaje
                </Typography>
                <Typography
                  variant='h6'
                  sx={{
                    opacity: 0.9,
                    fontWeight: 400,
                    mb: 1
                  }}
                >
                  Bienvenido, {currentUser.name}
                </Typography>
                <Chip
                  label={roleInfo.label}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    width: 48,
                    height: 48,
                    fontSize: '1.25rem',
                    fontWeight: 600
                  }}
                >
                  {currentUser.name.charAt(0).toUpperCase()}
                </Avatar>
                <IconButton
                  onClick={handleLogout}
                  sx={{
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <LogoutIcon />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Paper>
        <Box
          sx={{ maxWidth: '1200px', mx: 'auto', px: { xs: 2, sm: 3, lg: 4 } }}
        >
          {/* Role-based Data Filter */}
          <RoleBasedDataFilter
              scope={getLmsDashboardScope(userRole)}
            department={$userStore.customer?.nombre}
            showAlert={userRole !== 'admin'}
            showFilterIcon={false}
          />

          {/* Error Alerts */}
          {(!!dashboardError || !!coursesError || !!quizError) && (
            <Alert severity='warning' sx={{ mb: 3 }}>
              Algunos datos pueden no estar actualizados. Verifique la conexión.
            </Alert>
          )}

          {/* Enhanced Widgets Section */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Enhanced Course Metrics Widget */}
            <Grid item xs={12} lg={4}>
              <WidgetErrorBoundary
                widgetName='Métricas de Cursos'
                onError={(error, errorInfo) => {
                  reportError(error, {
                    section: 'course_metrics_widget',
                    severity: 'medium',
                    componentStack: errorInfo.componentStack,
                    tags: { widget: 'course_metrics' }
                  })
                }}
              >
                <EnhancedCourseMetricsWidget
                  data={courseMetrics}
                  loading={isLoading}
                  error={dashboardError ? String(dashboardError) : undefined}
                  onCourseClick={(courseId: number) =>
                    navigate(`/lms/admin/courses/${courseId}`)
                  }
                  onViewAll={() => navigate('/lms/admin/courses')}
                />
              </WidgetErrorBoundary>
            </Grid>

            {/* User Analytics Widget */}
            <Grid item xs={12} lg={4}>
              <WidgetErrorBoundary
                widgetName='Analíticas de Usuarios'
                onError={(error, errorInfo) => {
                  reportError(error, {
                    section: 'user_analytics_widget',
                    severity: 'medium',
                    componentStack: errorInfo.componentStack,
                    tags: { widget: 'user_analytics' }
                  })
                }}
              >
                <UserAnalyticsWidget
                  data={userAnalytics}
                  loading={isLoading}
                  error={dashboardError ? String(dashboardError) : undefined}
                  onViewDetails={() => navigate('/lms/admin/analytics')}
                  onUserTypeClick={(userType: string) =>
                    navigate(`/lms/admin/analytics?userType=${userType}`)
                  }
                />
              </WidgetErrorBoundary>
            </Grid>

            {/* Quiz Performance Dashboard */}
            <Grid item xs={12} lg={4}>
              <WidgetErrorBoundary
                widgetName='Dashboard de Quizzes'
                onError={(error, errorInfo) => {
                  reportError(error, {
                    section: 'quiz_performance_widget',
                    severity: 'medium',
                    componentStack: errorInfo.componentStack,
                    tags: { widget: 'quiz_performance' }
                  })
                }}
              >
                <QuizPerformanceDashboard
                  data={quizAnalyticsData || quizMetrics}
                  loading={quizLoading}
                  error={quizError ? String(quizError) : undefined}
                  onViewDetails={() =>
                    navigate('/lms/admin/analytics?tab=quizzes')
                  }
                  onQuestionClick={(questionId: number) =>
                    navigate(`/lms/admin/quizzes/question/${questionId}`)
                  }
                />
              </WidgetErrorBoundary>
            </Grid>
          </Grid>

          {/* Key Metrics Cards */}
          <MetricsErrorBoundary
            onError={(error, errorInfo) => {
              reportError(error, {
                section: 'key_metrics_cards',
                severity: 'medium',
                componentStack: errorInfo.componentStack,
                tags: { section: 'metrics' }
              })
            }}
          >
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} lg={3}>
                {isLoading ? (
                  <MetricCardSkeleton />
                ) : (
                  <Card
                    sx={{
                      borderRadius: '16px',
                      border: `1px solid ${colors.gray[200]}`,
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        borderColor: colors.primary,
                        boxShadow: `0 8px 25px rgba(16, 185, 129, 0.15)`,
                        transform: 'translateY(-4px)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: colors.primaryLight,
                            color: colors.primary,
                            mr: 2,
                            width: 48,
                            height: 48
                          }}
                        >
                          <PeopleIcon />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}
                          >
                            <Typography
                              variant='body2'
                              color={colors.gray[500]}
                              sx={{ fontWeight: 500 }}
                            >
                              Total Usuarios
                            </Typography>
                            <MetricHelp
                              metric='Total Usuarios'
                              value={dashboardStats.totalUsers.toLocaleString()}
                              description='Número total de usuarios registrados en la plataforma LMS, incluyendo empleados internos y clientes externos'
                              calculation='Suma de todos los usuarios activos e inactivos'
                              interpretation={{
                                good: 'Crecimiento constante indica adopción exitosa',
                                warning:
                                  'Estancamiento puede indicar problemas de acceso',
                                critical:
                                  'Disminución sugiere problemas graves de usabilidad'
                              }}
                              relatedMetrics={[
                                'Usuarios Activos',
                                'Tasa de Registro',
                                'Retención'
                              ]}
                              size='small'
                            />
                          </Box>
                          <Typography
                            variant='h4'
                            sx={{ fontWeight: 700, color: colors.gray[800] }}
                          >
                            {dashboardStats.totalUsers.toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip
                          icon={<PeopleIcon />}
                          label={`${dashboardStats.activeUsers.toLocaleString()} activos`}
                          size='small'
                          sx={{
                            bgcolor: colors.primaryLight,
                            color: colors.primary,
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </Grid>

              <Grid item xs={12} sm={6} lg={3}>
                {isLoading ? (
                  <MetricCardSkeleton />
                ) : (
                  <Card
                    sx={{
                      borderRadius: '16px',
                      border: `1px solid ${colors.gray[200]}`,
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        borderColor: colors.info,
                        boxShadow: `0 8px 25px rgba(59, 130, 246, 0.15)`,
                        transform: 'translateY(-4px)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: '#eff6ff',
                            color: colors.info,
                            mr: 2,
                            width: 48,
                            height: 48
                          }}
                        >
                          <SchoolIcon />
                        </Avatar>
                        <Box>
                          <Typography
                            variant='body2'
                            color={colors.gray[500]}
                            sx={{ fontWeight: 500 }}
                          >
                            Cursos Activos
                          </Typography>
                          <Typography
                            variant='h4'
                            sx={{ fontWeight: 700, color: colors.gray[800] }}
                          >
                            {dashboardStats.totalCourses}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip
                          icon={<AddIcon />}
                          label={`${recentCourses.length} recientes`}
                          size='small'
                          sx={{
                            bgcolor: '#eff6ff',
                            color: colors.info,
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                {isLoading ? (
                  <MetricCardSkeleton />
                ) : (
                  <Card
                    sx={{
                      borderRadius: '16px',
                      border: `1px solid ${colors.gray[200]}`,
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        borderColor: colors.warning,
                        boxShadow: `0 8px 25px rgba(217, 119, 6, 0.15)`,
                        transform: 'translateY(-4px)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: '#fef3c7',
                            color: colors.warning,
                            mr: 2,
                            width: 48,
                            height: 48
                          }}
                        >
                          <AssignmentIcon />
                        </Avatar>
                        <Box>
                          <Typography
                            variant='body2'
                            color={colors.gray[500]}
                            sx={{ fontWeight: 500 }}
                          >
                            Asignaciones Pendientes
                          </Typography>
                          <Typography
                            variant='h4'
                            sx={{ fontWeight: 700, color: colors.gray[800] }}
                          >
                            {dashboardStats.pendingAssignments}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip
                          icon={<WarningIcon />}
                          label='Requieren atención'
                          size='small'
                          sx={{
                            bgcolor: '#fef3c7',
                            color: colors.warning,
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </Grid>

              <Grid item xs={12} sm={6} lg={3}>
                {isLoading ? (
                  <MetricCardSkeleton />
                ) : (
                  <Card
                    sx={{
                      borderRadius: '16px',
                      border: `1px solid ${colors.gray[200]}`,
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        borderColor: colors.success,
                        boxShadow: `0 8px 25px rgba(5, 150, 105, 0.15)`,
                        transform: 'translateY(-4px)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: colors.primaryLight,
                            color: colors.success,
                            mr: 2,
                            width: 48,
                            height: 48
                          }}
                        >
                          <AnalyticsIcon />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}
                          >
                            <Typography
                              variant='body2'
                              color={colors.gray[500]}
                              sx={{ fontWeight: 500 }}
                            >
                              Tasa de Finalización
                            </Typography>
                            <MetricHelp
                              {...LMSMetricHelp.completionRate}
                              value={`${dashboardStats.completionRate}%`}
                              size='small'
                            />
                          </Box>
                          <Typography
                            variant='h4'
                            sx={{ fontWeight: 700, color: colors.gray[800] }}
                          >
                            {dashboardStats.completionRate}%
                          </Typography>
                        </Box>
                      </Box>
                      <LinearProgress
                        variant='determinate'
                        value={dashboardStats.completionRate}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: colors.gray[200],
                          '& .MuiLinearProgress-bar': {
                            bgcolor: colors.success,
                            borderRadius: 4
                          }
                        }}
                      />
                    </CardContent>
                  </Card>
                )}
              </Grid>
            </Grid>
          </MetricsErrorBoundary>

          {/* Quick Actions Grid */}
          <QuickActionsErrorBoundary
            onError={(error, errorInfo) => {
              reportError(error, {
                section: 'quick_actions',
                severity: 'low',
                componentStack: errorInfo.componentStack,
                tags: { section: 'actions' }
              })
            }}
          >
            <Box sx={{ mb: 4 }}>
              <Typography
                variant='h5'
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  color: colors.gray[800]
                }}
              >
                Acciones Rápidas
              </Typography>
              <Grid container spacing={3}>
                {quickActions.map((action) => (
                  <Grid item xs={12} sm={6} lg={4} key={action.id}>
                    <Card
                      sx={{
                        borderRadius: '16px',
                        border: `1px solid ${colors.gray[200]}`,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease-in-out',
                        position: 'relative',
                        overflow: 'visible',
                        '&:hover': {
                          borderColor: action.color,
                          boxShadow: `0 12px 30px rgba(0,0,0,0.1)`,
                          transform: 'translateY(-6px)',
                          '& .action-icon': {
                            transform: 'scale(1.1)'
                          }
                        }
                      }}
                      onClick={() =>
                        handleQuickAction(action.route, action.title)
                      }
                    >
                      {action.isNew && (
                        <Chip
                          label='NUEVO'
                          size='small'
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: 16,
                            bgcolor: colors.error,
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            zIndex: 1
                          }}
                        />
                      )}
                      <CardContent sx={{ p: 3 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            mb: 2
                          }}
                        >
                          <Avatar
                            className='action-icon'
                            sx={{
                              background: action.gradient,
                              color: 'white',
                              width: 56,
                              height: 56,
                              mr: 2,
                              transition: 'transform 0.3s ease-in-out'
                            }}
                          >
                            {action.icon}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant='h6'
                              sx={{
                                fontWeight: 700,
                                mb: 0.5,
                                color: colors.gray[800]
                              }}
                            >
                              {action.title}
                            </Typography>
                            <Typography
                              variant='body2'
                              color={colors.gray[500]}
                              sx={{ mb: 2 }}
                            >
                              {action.description}
                            </Typography>
                            <Button
                              endIcon={<ArrowForwardIcon />}
                              sx={{
                                color: action.color,
                                fontWeight: 600,
                                textTransform: 'none',
                                p: 0,
                                minWidth: 'auto',
                                '&:hover': {
                                  bgcolor: 'transparent',
                                  '& .MuiButton-endIcon': {
                                    transform: 'translateX(4px)'
                                  }
                                },
                                '& .MuiButton-endIcon': {
                                  transition: 'transform 0.2s ease-in-out'
                                }
                              }}
                            >
                              Acceder
                            </Button>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </QuickActionsErrorBoundary>

        </Box>
      </Box>
    </DashboardErrorBoundary>
  )
}

export default LmsAdmin
