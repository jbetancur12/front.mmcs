import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Badge,
  LinearProgress,
  Grid,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  Divider
} from '@mui/material'
import {
  People as PeopleIcon,
  MenuBook as BookOpenIcon,
  EmojiEvents as AwardIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  BarChart as BarChartIcon,
  Logout as LogoutIcon,
  LocalOffer as LocalOfferIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@nanostores/react'
import { userStore } from '../../../store/userStore'
import { useLmsAnalytics, useCourses } from '../../../hooks/useLms'
import { CircularProgress } from '@mui/material'

interface User {
  id: number
  email: string
  role: string
  name: string
}

interface AdminDashboardProps {
  user?: User
}

// Mock data para estadísticas
const mockStats = {
  totalUsers: 2547,
  totalCourses: 156,
  totalCertificates: 1203,
  completionRate: 87,
  activeUsers: 1834,
  newUsersThisMonth: 234,
  pendingAssignments: 45,
  overdueTraining: 12,
  recentCompletions: 89
}

// Mock data para cursos recomendados y actividad reciente
const mockRecommendedCourses = [
  {
    id: 1,
    title: 'Seguridad en el Trabajo',
    description: 'Curso obligatorio de seguridad laboral',
    category: 'Seguridad',
    priority: 'high',
    assignedUsers: 234,
    completionRate: 78
  },
  {
    id: 2,
    title: 'Nuevas Tecnologías 2024',
    description: 'Actualización en tecnologías emergentes',
    category: 'Tecnología',
    priority: 'medium',
    assignedUsers: 156,
    completionRate: 65
  },
  {
    id: 3,
    title: 'Comunicación Efectiva',
    description: 'Mejora tus habilidades de comunicación',
    category: 'Habilidades Blandas',
    priority: 'low',
    assignedUsers: 89,
    completionRate: 92
  }
]

const mockRecentActivity = [
  {
    id: 1,
    type: 'course_created',
    title: 'Nuevo curso creado',
    description: 'JavaScript Avanzado',
    timestamp: '2 horas',
    user: 'Dr. Carlos Méndez'
  },
  {
    id: 2,
    type: 'user_registered',
    title: 'Usuario registrado',
    description: 'Ana López se registró',
    timestamp: '4 horas',
    user: 'Ana López'
  },
  {
    id: 3,
    type: 'certificate_issued',
    title: 'Certificado emitido',
    description: 'React Fundamentals',
    timestamp: '6 horas',
    user: 'María García'
  },
  {
    id: 4,
    type: 'assignment_created',
    title: 'Curso asignado',
    description: 'Seguridad Laboral asignado a Desarrollo',
    timestamp: '1 día',
    user: 'Sistema'
  }
]

const mockQuickActions = [
  {
    id: 'create-course',
    title: 'Crear Curso',
    description: 'Crear un nuevo curso de capacitación',
    icon: <AddIcon />,
    color: 'primary'
  },
  {
    id: 'assign-course',
    title: 'Asignar Curso',
    description: 'Asignar cursos a usuarios o roles',
    icon: <AssignmentIcon />,
    color: 'secondary'
  },
  {
    id: 'add-user',
    title: 'Agregar Usuario',
    description: 'Registrar nuevo usuario en el sistema',
    icon: <PersonIcon />,
    color: 'info'
  },
  {
    id: 'analytics',
    title: 'Ver Analíticas',
    description: 'Analizar métricas y progreso',
    icon: <BarChartIcon />,
    color: 'success'
  },
  {
    id: 'reporting',
    title: 'Reportes',
    description: 'Generar y programar reportes',
    icon: <AssignmentIcon />,
    color: 'info'
  },
  {
    id: 'notifications',
    title: 'Notificaciones',
    description: 'Gestionar notificaciones del sistema',
    icon: <NotificationsIcon />,
    color: 'warning'
  },
  {
    id: 'jobs',
    title: 'Gestión de Jobs',
    description: 'Monitorear procesos asíncronos',
    icon: <SettingsIcon />,
    color: 'warning'
  },
  {
    id: 'settings',
    title: 'Configuración',
    description: 'Configurar parámetros del sistema',
    icon: <SettingsIcon />,
    color: 'inherit'
  }
]

const LmsAdmin: React.FC<AdminDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState(0)
  const navigate = useNavigate()
  const $userStore = useStore(userStore)

  // Usar el usuario del store si no se proporciona uno
  const currentUser = user || {
    id: $userStore.customer?.id || 1,
    email: $userStore.email || '',
    role: 'admin',
    name: $userStore.nombre || $userStore.email || 'Administrador'
  }

  // Fetch real analytics data
  const {
    data: analytics,
    isLoading: analyticsLoading,
    error: analyticsError
  } = useLmsAnalytics()

  // Fetch recommended courses (published, limited to 3)
  const {
    data: coursesData,
    isLoading: coursesLoading,
    error: coursesError
  } = useCourses({
    limit: 3,
    status: 'published',
    sortBy: 'enrollments',
    sortOrder: 'desc'
  })

  // Use real data or fallback to mock data
  const stats = analytics || mockStats
  const recommendedCourses = coursesData?.courses || mockRecommendedCourses

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    navigate('/')
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create-course':
        navigate('/lms/admin/courses')
        break
      case 'assign-course':
        navigate('/lms/admin/assignments')
        break
      case 'add-user':
        navigate('/lms/admin/users')
        break
      case 'analytics':
        navigate('/lms/admin/analytics')
        break
      case 'reporting':
        navigate('/lms/admin/reporting')
        break
      case 'notifications':
        // Navegar a notificaciones cuando se implemente
        break
      case 'jobs':
        navigate('/lms/admin/jobs')
        break
      case 'settings':
        // Navegar a configuración cuando se implemente
        break
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error'
      case 'medium':
        return 'warning'
      case 'low':
        return 'success'
      default:
        return 'default'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'course_created':
        return <BookOpenIcon color="success" />
      case 'user_registered':
        return <PersonIcon color="primary" />
      case 'certificate_issued':
        return <AwardIcon color="warning" />
      case 'assignment_created':
        return <AssignmentIcon color="info" />
      default:
        return <CheckCircleIcon />
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <Paper elevation={1} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Box
          sx={{
            maxWidth: 'xl',
            mx: 'auto',
            px: { xs: 2, sm: 3, lg: 4 },
            py: 2
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
                variant='h4'
                component='h1'
                sx={{ fontWeight: 'bold', color: 'text.primary' }}
              >
                Panel de Administración LMS
              </Typography>
              <Typography variant='body1' color='text.secondary'>
                Bienvenido, {currentUser.name}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Badge
                badgeContent='Administrador'
                color='primary'
                sx={{ '& .MuiBadge-badge': { fontSize: '0.75rem' } }}
              />
              <Button
                variant='outlined'
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                size='small'
              >
                Cerrar Sesión
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Box
        sx={{ maxWidth: 'xl', mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: 4 }}
      >
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 4 }}>
          <Tab label='Resumen' />
          <Tab label='Gestión de Cursos' />
          <Tab label='Asignaciones' />
          <Tab label='Analíticas' />
        </Tabs>

        {activeTab === 0 && (
          <Box>
            {/* Error alerts */}
            {analyticsError && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => {}}>
                Error al cargar analíticas: {analyticsError.message}
              </Alert>
            )}
            {coursesError && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => {}}>
                Error al cargar cursos: {coursesError.message}
              </Alert>
            )}

            {/* Alertas importantes */}
            {stats.overdueTraining > 0 && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>{stats.overdueTraining} usuarios</strong> tienen entrenamientos obligatorios vencidos.
                  <Button size="small" sx={{ ml: 2 }} onClick={() => navigate('/lms/admin/analytics')}>
                    Ver detalles
                  </Button>
                </Typography>
              </Alert>
            )}

            {/* Estadísticas principales */}
            {analyticsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} lg={3}>
                  <Card>
                    <CardHeader
                      avatar={<PeopleIcon color='primary' />}
                      title='Total Usuarios'
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
                        {stats.totalUsers?.toLocaleString() || '0'}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        +{stats.newUsersThisMonth || 0} este mes
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} lg={3}>
                  <Card>
                    <CardHeader
                      avatar={<BookOpenIcon color='success' />}
                      title='Cursos Activos'
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
                        {stats.totalCourses || 0}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {stats.newCoursesThisMonth || 0} nuevos este mes
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} lg={3}>
                  <Card>
                    <CardHeader
                      avatar={<AssignmentIcon color='warning' />}
                      title='Asignaciones Pendientes'
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
                        {stats.pendingAssignments || 0}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Requieren atención
                      </Typography>
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
                        {stats.completionRate || 0}%
                      </Typography>
                      <LinearProgress
                        variant='determinate'
                        value={stats.completionRate || 0}
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* Contenido principal del dashboard */}
            <Grid container spacing={3}>
              {/* Actividad reciente */}
              <Grid item xs={12} lg={4}>
                <Card sx={{ height: '100%' }}>
                  <CardHeader 
                    title='Actividad Reciente' 
                    action={
                      <Button size="small" onClick={() => navigate('/lms/admin/analytics')}>
                        Ver todo
                      </Button>
                    }
                  />
                  <CardContent>
                    <List dense>
                      {mockRecentActivity.map((activity, index) => (
                        <ListItem key={activity.id} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            {getActivityIcon(activity.type)}
                          </ListItemIcon>
                          <ListItemText
                            primary={activity.title}
                            secondary={`${activity.description} - hace ${activity.timestamp}`}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Cursos recomendados */}
              <Grid item xs={12} lg={4}>
                <Card sx={{ height: '100%' }}>
                  <CardHeader
                    title='Cursos Recomendados'
                    action={
                      <Button size="small" onClick={() => navigate('/lms/admin/courses')}>
                        Gestionar
                      </Button>
                    }
                  />
                  <CardContent>
                    {coursesLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={40} />
                      </Box>
                    ) : (
                      <Box sx={{ space: 2 }}>
                        {recommendedCourses.map((course: any) => (
                          <Box key={course.id} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Typography variant='body2' fontWeight='medium'>
                                {course.title}
                              </Typography>
                              <Chip
                                label={course.priority || 'medium'}
                                size="small"
                                color={getPriorityColor(course.priority || 'medium') as any}
                              />
                            </Box>
                            <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
                              {course.description}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant='caption'>
                                {course.assignedUsers || 0} asignados
                              </Typography>
                              <Typography variant='caption' color='success.main'>
                                {course.completionRate || 0}% completado
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Acciones rápidas */}
              <Grid item xs={12} lg={4}>
                <Card sx={{ height: '100%' }}>
                  <CardHeader title='Acciones Rápidas' />
                  <CardContent>
                    <Grid container spacing={2}>
                      {mockQuickActions.map((action) => (
                        <Grid item xs={6} key={action.id}>
                          <Button
                            variant={action.id === 'create-course' ? 'contained' : 'outlined'}
                            fullWidth
                            sx={{ 
                              height: 80, 
                              flexDirection: 'column',
                              gap: 1
                            }}
                            onClick={() => handleQuickAction(action.id)}
                            color={action.color as any}
                          >
                            {action.icon}
                            <Typography variant="caption" textAlign="center">
                              {action.title}
                            </Typography>
                          </Button>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant='h6'>
                Gestión de Cursos
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => navigate('/lms/admin/courses')}
              >
                Crear Curso
              </Button>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Cursos por Estado" />
                  <CardContent>
                    <Box sx={{ space: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Publicados</Typography>
                        <Typography variant="body2" fontWeight="bold">124</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Borradores</Typography>
                        <Typography variant="body2" fontWeight="bold">23</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Archivados</Typography>
                        <Typography variant="body2" fontWeight="bold">9</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Acciones de Curso" />
                  <CardContent>
                    <List dense>
                      <ListItem button onClick={() => navigate('/lms/admin/courses')}>
                        <ListItemIcon><BookOpenIcon /></ListItemIcon>
                        <ListItemText primary="Gestionar Cursos" secondary="Ver y editar cursos existentes" />
                      </ListItem>
                      <ListItem button onClick={() => navigate('/lms/admin/quiz-management')}>
                        <ListItemIcon><AssignmentIcon /></ListItemIcon>
                        <ListItemText primary="Gestión de Quizzes" secondary="Crear y administrar evaluaciones" />
                      </ListItem>
                      <ListItem button onClick={() => navigate('/lms/admin/question-bank')}>
                        <ListItemIcon><LocalOfferIcon /></ListItemIcon>
                        <ListItemText primary="Banco de Preguntas" secondary="Administrar preguntas reutilizables" />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant='h6'>
                Asignaciones y Notificaciones
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AssignmentIcon />}
                onClick={() => navigate('/lms/admin/assignments')}
              >
                Nueva Asignación
              </Button>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardHeader title="Asignaciones Recientes" />
                  <CardContent>
                    <List>
                      <ListItem>
                        <ListItemIcon><AssignmentIcon color="primary" /></ListItemIcon>
                        <ListItemText 
                          primary="Seguridad Laboral - Departamento de Producción"
                          secondary="Asignado hace 2 días • 45 usuarios • Vence en 15 días"
                        />
                        <Chip label="Activo" color="success" size="small" />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemIcon><WarningIcon color="warning" /></ListItemIcon>
                        <ListItemText 
                          primary="Capacitación en Nuevas Tecnologías - Desarrollo"
                          secondary="Asignado hace 1 semana • 23 usuarios • Vence en 3 días"
                        />
                        <Chip label="Próximo a vencer" color="warning" size="small" />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                        <ListItemText 
                          primary="Comunicación Efectiva - Todos los empleados"
                          secondary="Completado hace 3 días • 156 usuarios • 98% completado"
                        />
                        <Chip label="Completado" color="success" size="small" />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card sx={{ mb: 2 }}>
                  <CardHeader title="Estadísticas de Asignación" />
                  <CardContent>
                    <Box sx={{ space: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">Asignaciones Activas</Typography>
                        <Typography variant="h6" color="primary.main">45</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">Próximas a Vencer</Typography>
                        <Typography variant="h6" color="warning.main">12</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">Vencidas</Typography>
                        <Typography variant="h6" color="error.main">3</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader title="Notificaciones Pendientes" />
                  <CardContent>
                    <Box sx={{ space: 1 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        • 23 recordatorios de curso pendientes
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        • 8 notificaciones de vencimiento
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        • 15 confirmaciones de completado
                      </Typography>
                      <Button size="small" fullWidth sx={{ mt: 2 }}>
                        Gestionar Notificaciones
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 3 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant='h6'>
                Analíticas y Reportes
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<BarChartIcon />}
                onClick={() => navigate('/lms/admin/analytics')}
              >
                Ver Reportes Completos
              </Button>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Métricas de Rendimiento" />
                  <CardContent>
                    <Box sx={{ space: 3 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Tasa de Finalización Global</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>87%</Typography>
                        <LinearProgress variant="determinate" value={87} sx={{ height: 8, borderRadius: 4 }} />
                      </Box>
                      
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="body2" color="text.secondary">Tiempo Promedio de Finalización</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>4.2 días</Typography>
                      </Box>
                      
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="body2" color="text.secondary">Satisfacción Promedio</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>4.6/5</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Cursos Más Populares" />
                  <CardContent>
                    <List dense>
                      <ListItem>
                        <ListItemText 
                          primary="Seguridad en el Trabajo"
                          secondary="234 inscripciones • 4.8/5"
                        />
                        <Typography variant="body2" color="success.main">↑ 15%</Typography>
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="JavaScript Avanzado"
                          secondary="189 inscripciones • 4.7/5"
                        />
                        <Typography variant="body2" color="success.main">↑ 8%</Typography>
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Comunicación Efectiva"
                          secondary="156 inscripciones • 4.9/5"
                        />
                        <Typography variant="body2" color="success.main">↑ 12%</Typography>
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default LmsAdmin
