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
  Paper,
  Stack,
  Alert
} from '@mui/material'
import {
  School as SchoolIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  TrendingUp as AnalyticsIcon,
  Assessment as AssessmentIcon,
  EmojiEvents as CertificateIcon,
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@nanostores/react'
import { userStore } from '../../store/userStore'
import { 
  useComprehensiveDashboard,
  useQuizPerformanceAnalytics 
} from '../../hooks/useLms'
import { 
  useRoleBasedDashboard,
  useRoleBasedUserAnalytics,
  useRoleBasedCourses 
} from '../../hooks/useRoleBasedData'
import EnhancedCourseMetricsWidget from './widgets/EnhancedCourseMetricsWidget'
import UserAnalyticsWidget from './widgets/UserAnalyticsWidget'
import QuizPerformanceDashboard from './widgets/QuizPerformanceDashboard'
import { useUserLMSRole, useUserPermissions, getRoleDisplayInfo } from '../../utils/roleUtils'

// Modern color palette
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

interface TrainingManagerQuickAction {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  gradient: string
  route: string
  isNew?: boolean
}

const TrainingManagerDashboard: React.FC = () => {
  const navigate = useNavigate()
  const $userStore = useStore(userStore)
  const userRole = useUserLMSRole()
  const permissions = useUserPermissions()
  const roleInfo = getRoleDisplayInfo(userRole)

  // Fetch role-based dashboard data
  const {
    data: roleBasedData,
    isLoading: roleBasedLoading,
    error: roleBasedError
  } = useRoleBasedDashboard()

  // Fetch role-based user analytics
  const {
    data: roleBasedUserData,
    isLoading: userAnalyticsLoading,
    error: userAnalyticsError
  } = useRoleBasedUserAnalytics()

  // Fetch role-based courses
  const {
    data: roleBasedCoursesData,
    isLoading: coursesLoading,
    error: coursesError
  } = useRoleBasedCourses({ limit: 10, status: 'published' })

  // Fetch quiz performance analytics (fallback to general)
  const {
    data: quizAnalyticsData,
    isLoading: quizLoading,
    error: quizError
  } = useQuizPerformanceAnalytics()

  // Extract role-based data for training manager
  const metrics = roleBasedData?.metrics || {}
  const courseMetrics = roleBasedData?.courseMetrics || {}
  const userAnalytics = roleBasedUserData || {}
  const quizMetrics = roleBasedData?.quizAnalytics || {}
  const managedCourses = roleBasedCoursesData?.courses || []

  const currentUser = {
    id: $userStore.customer?.id || 1,
    email: $userStore.email || '',
    role: userRole,
    name: $userStore.nombre || $userStore.email || 'Gestor de Capacitación'
  }

  // Training Manager specific quick actions
  const quickActions: TrainingManagerQuickAction[] = [
    {
      id: 'create-course',
      title: 'Crear Curso',
      description: 'Nuevo curso de capacitación',
      icon: <SchoolIcon />,
      color: colors.primary,
      gradient: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      route: '/lms/admin/courses',
    },
    {
      id: 'course-management',
      title: 'Gestionar Cursos',
      description: 'Editar contenido y estructura',
      icon: <SchoolIcon />,
      color: colors.info,
      gradient: `linear-gradient(135deg, ${colors.info} 0%, #2563eb 100%)`,
      route: '/lms/admin/courses',
    },
    {
      id: 'assignments',
      title: 'Asignaciones',
      description: 'Gestionar capacitación obligatoria',
      icon: <AssignmentIcon />,
      color: colors.warning,
      gradient: `linear-gradient(135deg, ${colors.warning} 0%, #ea580c 100%)`,
      route: '/lms/admin/assignments',
    },
    {
      id: 'analytics',
      title: 'Analíticas de Cursos',
      description: 'Métricas de rendimiento',
      icon: <AnalyticsIcon />,
      color: colors.success,
      gradient: `linear-gradient(135deg, ${colors.success} 0%, #047857 100%)`,
      route: '/lms/admin/analytics',
    },
    {
      id: 'reports',
      title: 'Reportes de Capacitación',
      description: 'Informes de progreso',
      icon: <AssessmentIcon />,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      route: '/lms/admin/reports',
    },
    {
      id: 'certificates',
      title: 'Certificados',
      description: 'Gestionar certificaciones',
      icon: <CertificateIcon />,
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      route: '/lms/admin/certificate-templates',
    }
  ]

  const handleQuickAction = (route: string) => {
    navigate(route)
  }

  // Training Manager specific stats
  const trainingStats = {
    managedCourses: metrics?.totalCourses || 24,
    activeStudents: metrics?.activeUsers || 156,
    pendingAssignments: metrics?.pendingAssignments || 12,
    completionRate: metrics?.completionRate || 78,
    certificatesIssued: metrics?.totalCertificates || 89,
    overdueTraining: metrics?.overdueTraining || 5
  }

  const isLoading = roleBasedLoading || userAnalyticsLoading || coursesLoading

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: colors.gray[50],
      pb: 4
    }}>
      {/* Training Manager Header */}
      <Paper
        elevation={0}
        sx={{
          background: `linear-gradient(135deg, ${roleInfo.color} 0%, ${colors.primaryDark} 100%)`,
          color: 'white',
          borderRadius: 0,
          mb: 4
        }}
      >
        <Box sx={{ maxWidth: '1200px', mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant='h3' component='h1' sx={{
                fontWeight: 700,
                mb: 1,
                fontSize: { xs: '1.75rem', md: '2.5rem' }
              }}>
                Panel de Gestión de Capacitación
              </Typography>
              <Typography variant='h6' sx={{
                opacity: 0.9,
                fontWeight: 400,
                mb: 1
              }}>
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
            <Avatar sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              width: 64,
              height: 64,
              fontSize: '1.5rem',
              fontWeight: 600
            }}>
              {currentUser.name.charAt(0).toUpperCase()}
            </Avatar>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ maxWidth: '1200px', mx: 'auto', px: { xs: 2, sm: 3, lg: 4 } }}>
        {/* Role Information Alert */}
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          icon={<SchoolIcon />}
        >
          <Typography variant="body2">
            <strong>Acceso de Gestor de Capacitación:</strong> {roleInfo.description}
          </Typography>
        </Alert>

        {/* Error Alerts */}
        {(!!roleBasedError || !!userAnalyticsError || !!coursesError || !!quizError) && (
          <Alert
            severity="warning"
            sx={{ mb: 3 }}
          >
            Algunos datos pueden no estar actualizados. Verifique la conexión.
          </Alert>
        )}

        {/* Training Manager Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{
              borderRadius: '16px',
              border: `1px solid ${colors.gray[200]}`,
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                borderColor: colors.primary,
                boxShadow: `0 8px 25px rgba(16, 185, 129, 0.15)`,
                transform: 'translateY(-4px)'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{
                    bgcolor: colors.primaryLight,
                    color: colors.primary,
                    mr: 2,
                    width: 48,
                    height: 48
                  }}>
                    <SchoolIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color={colors.gray[500]} sx={{ fontWeight: 500 }}>
                      Cursos Gestionados
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: colors.gray[800] }}>
                      {trainingStats.managedCourses}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  icon={<AddIcon />}
                  label="Crear nuevo"
                  size="small"
                  clickable
                  onClick={() => navigate('/lms/admin/courses')}
                  sx={{
                    bgcolor: colors.primaryLight,
                    color: colors.primary,
                    fontWeight: 600,
                    fontSize: '0.75rem'
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{
              borderRadius: '16px',
              border: `1px solid ${colors.gray[200]}`,
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                borderColor: colors.info,
                boxShadow: `0 8px 25px rgba(59, 130, 246, 0.15)`,
                transform: 'translateY(-4px)'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{
                    bgcolor: '#eff6ff',
                    color: colors.info,
                    mr: 2,
                    width: 48,
                    height: 48
                  }}>
                    <PeopleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color={colors.gray[500]} sx={{ fontWeight: 500 }}>
                      Estudiantes Activos
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: colors.gray[800] }}>
                      {trainingStats.activeStudents}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  icon={<AnalyticsIcon />}
                  label="Ver progreso"
                  size="small"
                  clickable
                  onClick={() => navigate('/lms/admin/analytics')}
                  sx={{
                    bgcolor: '#eff6ff',
                    color: colors.info,
                    fontWeight: 600,
                    fontSize: '0.75rem'
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{
              borderRadius: '16px',
              border: `1px solid ${colors.gray[200]}`,
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                borderColor: colors.warning,
                boxShadow: `0 8px 25px rgba(217, 119, 6, 0.15)`,
                transform: 'translateY(-4px)'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{
                    bgcolor: '#fef3c7',
                    color: colors.warning,
                    mr: 2,
                    width: 48,
                    height: 48
                  }}>
                    <AssignmentIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color={colors.gray[500]} sx={{ fontWeight: 500 }}>
                      Asignaciones Pendientes
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: colors.gray[800] }}>
                      {trainingStats.pendingAssignments}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  icon={<WarningIcon />}
                  label="Gestionar"
                  size="small"
                  clickable
                  onClick={() => navigate('/lms/admin/assignments')}
                  sx={{
                    bgcolor: '#fef3c7',
                    color: colors.warning,
                    fontWeight: 600,
                    fontSize: '0.75rem'
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{
              borderRadius: '16px',
              border: `1px solid ${colors.gray[200]}`,
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                borderColor: colors.success,
                boxShadow: `0 8px 25px rgba(5, 150, 105, 0.15)`,
                transform: 'translateY(-4px)'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{
                    bgcolor: colors.primaryLight,
                    color: colors.success,
                    mr: 2,
                    width: 48,
                    height: 48
                  }}>
                    <CheckIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color={colors.gray[500]} sx={{ fontWeight: 500 }}>
                      Tasa de Finalización
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: colors.gray[800] }}>
                      {trainingStats.completionRate}%
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={trainingStats.completionRate}
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
          </Grid>
        </Grid>

        {/* Enhanced Widgets Section - Training Manager Scope */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} lg={4}>
            <EnhancedCourseMetricsWidget
              data={courseMetrics}
              loading={isLoading}
              error={dashboardError ? String(dashboardError) : undefined}
              onCourseClick={(courseId: number) => navigate(`/lms/admin/courses/${courseId}`)}
              onViewAll={() => navigate('/lms/admin/courses')}
              scope="training_manager"
            />
          </Grid>

          <Grid item xs={12} lg={4}>
            <UserAnalyticsWidget
              data={userAnalytics}
              loading={isLoading}
              error={dashboardError ? String(dashboardError) : undefined}
              onViewDetails={() => navigate('/lms/admin/analytics')}
              onUserTypeClick={(userType: string) => navigate(`/lms/admin/analytics?userType=${userType}`)}
              scope="training_manager"
            />
          </Grid>

          <Grid item xs={12} lg={4}>
            <QuizPerformanceDashboard
              data={quizAnalyticsData || quizMetrics}
              loading={quizLoading}
              error={quizError ? String(quizError) : undefined}
              onViewDetails={() => navigate('/lms/admin/analytics?tab=quizzes')}
              onQuestionClick={(questionId: number) => navigate(`/lms/admin/quizzes/question/${questionId}`)}
              scope="training_manager"
            />
          </Grid>
        </Grid>

        {/* Training Manager Quick Actions */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{
            fontWeight: 700,
            mb: 3,
            color: colors.gray[800]
          }}>
            Acciones de Capacitación
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
                        transform: 'scale(1.1)',
                      }
                    }
                  }}
                  onClick={() => handleQuickAction(action.route)}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar
                        className="action-icon"
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
                        <Typography variant="h6" sx={{
                          fontWeight: 700,
                          mb: 0.5,
                          color: colors.gray[800]
                        }}>
                          {action.title}
                        </Typography>
                        <Typography variant="body2" color={colors.gray[500]} sx={{ mb: 2 }}>
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

        {/* Training Manager Summary */}
        <Card sx={{
          borderRadius: '16px',
          border: `1px solid ${colors.gray[200]}`
        }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{
              fontWeight: 700,
              mb: 3,
              color: colors.gray[800]
            }}>
              Resumen de Capacitación
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: '12px',
                    bgcolor: colors.primaryLight
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CertificateIcon sx={{ color: colors.success, mr: 1 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Certificados Emitidos
                      </Typography>
                    </Box>
                    <Chip
                      label={trainingStats.certificatesIssued}
                      size="small"
                      sx={{
                        bgcolor: colors.success,
                        color: 'white',
                        fontWeight: 700
                      }}
                    />
                  </Box>

                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: '12px',
                    bgcolor: '#fef3c7'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <WarningIcon sx={{ color: colors.warning, mr: 1 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Capacitación Vencida
                      </Typography>
                    </Box>
                    <Chip
                      label={trainingStats.overdueTraining}
                      size="small"
                      sx={{
                        bgcolor: colors.warning,
                        color: 'white',
                        fontWeight: 700
                      }}
                    />
                  </Box>
                </Stack>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AssessmentIcon />}
                  onClick={() => navigate('/lms/admin/reports')}
                  sx={{
                    borderColor: colors.gray[300],
                    color: colors.gray[700],
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: '12px',
                    py: 2,
                    height: '100%',
                    '&:hover': {
                      borderColor: colors.primary,
                      color: colors.primary,
                      bgcolor: colors.primaryLight
                    }
                  }}
                >
                  Generar Reporte Completo
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

export default TrainingManagerDashboard