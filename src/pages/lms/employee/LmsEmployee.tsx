import React, { useState, useMemo } from 'react'
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
  Chip,
  Avatar,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  IconButton
} from '@mui/material'
import {
  MenuBook as BookOpenIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Logout as LogoutIcon,
  Warning as WarningIcon,
  Assignment as AssignmentIcon,
  Star as StarIcon,
  PlayArrow as PlayArrowIcon,
  EmojiEvents as AwardIcon,
  Error as ErrorIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@nanostores/react'
import { userStore } from '../../../store/userStore'
import LmsNotificationCenter from '../shared/LmsNotificationCenter'
import { useAvailableCourses, useUserAssignments, useUserCertificates } from '../../../hooks/useLms'
import type { Certificate, Course } from '../../../services/lmsService'
import {
  getCourseAudienceLabel,
  getLearningVisibilityLabel
} from '../../../utils/lmsAudience'
import {
  getCourseCompletedLessons,
  getCourseProgressPercentage,
  getCourseTimeSpentMinutes,
  getCourseTotalLessons
} from '../../../utils/lmsProgress'

interface User {
  id: number
  email: string
  role: string
  name: string
}

interface EmployeeDashboardProps {
  user?: User
}

// Helper para calcular días hasta deadline
const getDaysUntilDeadline = (deadline?: string): number | undefined => {
  if (!deadline) return undefined
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diff = deadlineDate.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const LmsEmployee: React.FC<EmployeeDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState(0)
  const navigate = useNavigate()
  const $userStore = useStore(userStore)

  // Fetch available courses from API
  const { data: coursesData, isLoading, error } = useAvailableCourses()
  const { data: userAssignments, isLoading: assignmentsLoading, error: assignmentsError } = useUserAssignments()
  const { data: userCertificates = [] } = useUserCertificates()

  // Usar el usuario del store si no se proporciona uno
  const currentUser = user || {
    id: $userStore.customer?.id || 1,
    email: $userStore.email || '',
    role: 'employee',
    name: $userStore.nombre || $userStore.email || 'Empleado'
  }

  // Process courses data
  const { mandatoryCourses, optionalCourses, stats } = useMemo(() => {
    if (!coursesData) {
      return {
        mandatoryCourses: [],
        optionalCourses: [],
        stats: {
          totalCourses: 0,
          completedCourses: 0,
          inProgressCourses: 0,
          averageProgress: 0,
          certificatesEarned: 0,
          totalHoursLearned: 0,
          mandatoryCourses: 0,
          mandatoryCompleted: 0,
          overdueTraining: 0
        }
      }
    }

    // Extract courses array from response
    const courses = coursesData
    const allAssignments = [
      ...(userAssignments?.mandatory || []),
      ...(userAssignments?.optional || [])
    ]
    const certificatesByCourseId = new Map(
      userCertificates.map((certificate: Certificate) => [certificate.course_id, certificate])
    )
    const assignmentsByCourseId = new Map(
      allAssignments.map((assignment: any) => [assignment.course_id, assignment])
    )

    // Separar cursos obligatorios y opcionales
    const mandatory: any[] = []
    const optional: any[] = []

    courses.forEach((course: Course) => {
      const progress = getCourseProgressPercentage(course)
      const totalLessons = getCourseTotalLessons(course)
      const completedLessons = getCourseCompletedLessons(course)
      const assignment = assignmentsByCourseId.get(course.id)
      const earnedCertificate = certificatesByCourseId.get(course.id)
      const courseIsMandatory = assignment?.course?.is_mandatory ?? course.is_mandatory ?? false
      const deadline = assignment?.deadline
      const daysUntilDeadline = getDaysUntilDeadline(deadline)
      const isOverdue = assignment?.isOverdue ?? (daysUntilDeadline !== undefined && daysUntilDeadline < 0)

      const enrichedCourse = {
        ...course,
        progress,
        totalLessons,
        completedLessons,
        category: getCourseAudienceLabel(course.audience),
        instructor: course.creator?.nombre || 'Instructor',
        duration: `${totalLessons} lecciones`,
        rating: 4.5,
        earnedCertificate,
        deadline,
        daysUntilDeadline,
        isOverdue
      }

      if (courseIsMandatory) {
        // Es un curso obligatorio
        mandatory.push({
          ...enrichedCourse,
          isMandatory: true,
          deadline,
          daysUntilDeadline,
          isOverdue
        })
      } else {
        // Es un curso opcional
        optional.push(enrichedCourse)
      }
    })

    // Calcular estadísticas
    const totalCourses = courses.length
    const completedCourses = courses.filter((c: Course) => getCourseProgressPercentage(c) === 100).length
    const inProgressCourses = courses.filter((c: Course) => {
      const prog = getCourseProgressPercentage(c)
      return prog > 0 && prog < 100
    }).length

    const totalProgress = courses.reduce((sum: number, c: Course) => sum + getCourseProgressPercentage(c), 0)
    const averageProgress = totalCourses > 0 ? Math.round(totalProgress / totalCourses) : 0

    const mandatoryCompleted = mandatory.filter(c => c.progress === 100).length
    const overdueTraining = mandatory.filter(c => c.isOverdue && c.progress < 100).length

    // Calcular certificados reales: solo cursos completados que emiten certificado
    const certificatesEarned = userCertificates.length
    const totalHoursLearned = courses.reduce((totalHours: number, course: Course) => {
      return totalHours + getCourseTimeSpentMinutes(course)
    }, 0)

    // Convertir minutos a horas
    const totalHoursLearnedRounded = Math.round(totalHoursLearned / 60)

    return {
      mandatoryCourses: mandatory,
      optionalCourses: optional,
      stats: {
        totalCourses,
        completedCourses,
        inProgressCourses,
        averageProgress,
        certificatesEarned, // ✅ Ahora usa datos reales
        totalHoursLearned: totalHoursLearnedRounded, // ✅ Ahora usa tiempo real
        mandatoryCourses: mandatory.length,
        mandatoryCompleted,
        overdueTraining
      }
    }
  }, [coursesData, userAssignments, userCertificates])

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    navigate('/')
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleCourseClick = (courseId: number) => {
    // Navegar al curso específico
    navigate(`/lms/course/${courseId}`)
  }

  // Loading state
  if (isLoading || assignmentsLoading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Cargando tus cursos...
          </Typography>
        </Box>
      </Box>
    )
  }

  // Error state
  if (error || assignmentsError) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center', maxWidth: 500 }}>
          <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" color="error" gutterBottom>
            Error al cargar los cursos
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {(error instanceof Error && error.message) ||
              (assignmentsError instanceof Error && assignmentsError.message) ||
              'No se pudieron cargar los datos del LMS'}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </Box>
      </Box>
    )
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
                Mi Aprendizaje
              </Typography>
              <Typography variant='body1' color='text.secondary'>
                Bienvenido, {currentUser.name}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {getLearningVisibilityLabel('internal')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Badge
                badgeContent='Empleado'
                color='secondary'
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
          <Tab label='Mi Progreso' />
          <Tab label='Cursos Obligatorios' />
          <Tab label='Cursos Opcionales' />
          <Tab label='Mis Certificados' />
          <Tab label='Notificaciones' />
        </Tabs>

        {activeTab === 0 && (
          <Box>
            {/* Alertas importantes */}
            {stats.overdueTraining > 0 && (
              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>¡Atención!</strong> Tienes {stats.overdueTraining} curso(s) obligatorio(s) vencido(s).
                  <Button size="small" sx={{ ml: 2 }} onClick={() => setActiveTab(1)}>
                    Ver cursos obligatorios
                  </Button>
                </Typography>
              </Alert>
            )}

            {/* Estadísticas principales */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} lg={3}>
                <Card>
                  <CardHeader
                    avatar={<AssignmentIcon color='error' />}
                    title='Cursos Obligatorios'
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
                      {stats.mandatoryCourses}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {stats.mandatoryCompleted} completados
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} lg={3}>
                <Card>
                  <CardHeader
                    avatar={<TrendingUpIcon color='success' />}
                    title='Progreso Promedio'
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
                      {stats.averageProgress}%
                    </Typography>
                    <LinearProgress
                      variant='determinate'
                      value={stats.averageProgress}
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} lg={3}>
                <Card>
                  <CardHeader
                    avatar={<AwardIcon color='warning' />}
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
                            {stats.certificatesEarned}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Obtenidos
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} lg={3}>
                <Card>
                  <CardHeader
                    avatar={<ScheduleIcon color='info' />}
                    title='Horas Aprendidas'
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
                      {stats.totalHoursLearned}h
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Este año
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Resumen de progreso */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardHeader title='Cursos en Progreso' />
                  <CardContent>
                    <List>
                      {[...mandatoryCourses, ...optionalCourses]
                        .filter((course) => course.progress > 0 && course.progress < 100)
                        .slice(0, 4)
                        .map((course) => (
                          <React.Fragment key={course.id}>
                            <ListItem 
                              button 
                              onClick={() => handleCourseClick(course.id)}
                              sx={{ px: 0 }}
                            >
                              <ListItemIcon>
                                <Avatar sx={{ bgcolor: 'isMandatory' in course && course.isMandatory ? 'error.main' : 'primary.main', width: 40, height: 40 }}>
                                  <BookOpenIcon />
                                </Avatar>
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body1" fontWeight="medium">
                                      {course.title}
                                    </Typography>
                                    {'isMandatory' in course && course.isMandatory && (
                                      <Chip label="Obligatorio" size="small" color="error" />
                                    )}
                                  </Box>
                                }
                                secondary={
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">
                                      {course.instructor} • {course.duration}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                      <LinearProgress
                                        variant="determinate"
                                        value={course.progress}
                                        sx={{ flex: 1, mr: 2, height: 6, borderRadius: 3 }}
                                      />
                                      <Typography variant="caption" color="text.secondary">
                                        {course.progress}%
                                      </Typography>
                                    </Box>
                                  </Box>
                                }
                              />
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<PlayArrowIcon />}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCourseClick(course.id)
                                }}
                              >
                                Continuar
                              </Button>
                            </ListItem>
                            <Divider />
                          </React.Fragment>
                        ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ mb: 2 }}>
                  <CardHeader title="Próximos Vencimientos" />
                  <CardContent>
                    {mandatoryCourses
                      .filter(course => course.daysUntilDeadline && course.daysUntilDeadline <= 7)
                      .map(course => (
                        <Box key={course.id} sx={{ mb: 2, p: 2, border: 1, borderColor: course.isOverdue ? 'error.main' : 'warning.main', borderRadius: 1 }}>
                          <Typography variant="body2" fontWeight="medium" color={course.isOverdue ? 'error.main' : 'warning.main'}>
                            {course.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {course.isOverdue 
                              ? `Vencido hace ${Math.abs(course.daysUntilDeadline!)} días`
                              : `Vence en ${course.daysUntilDeadline} días`
                            }
                          </Typography>
                        </Box>
                      ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader title="Logros Recientes" />
                  <CardContent>
                    <List dense>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon><AwardIcon color="warning" /></ListItemIcon>
                        <ListItemText 
                          primary="Certificado obtenido"
                          secondary="Gestión de Proyectos"
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                        <ListItemText 
                          primary="Curso completado"
                          secondary="React Fundamentals"
                        />
                      </ListItem>
                    </List>
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
                Cursos Obligatorios
              </Typography>
              <Chip
                label={`${stats.overdueTraining} vencidos`}
                color="error"
                size="small"
                sx={{ display: stats.overdueTraining > 0 ? 'flex' : 'none' }}
              />
            </Box>

            <Grid container spacing={3}>
              {mandatoryCourses.map((course) => (
                <Grid item xs={12} md={6} key={course.id}>
                  <Card 
                    variant='outlined'
                    sx={{ 
                      cursor: 'pointer',
                      border: course.isOverdue ? 2 : 1,
                      borderColor: course.isOverdue ? 'error.main' : course.daysUntilDeadline && course.daysUntilDeadline <= 7 ? 'warning.main' : 'divider'
                    }}
                    onClick={() => handleCourseClick(course.id)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                        <Avatar sx={{ bgcolor: course.isOverdue ? 'error.main' : 'warning.main', mr: 2 }}>
                          {course.isOverdue ? <WarningIcon /> : <AssignmentIcon />}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant='h6' component='div'>
                              {course.title}
                            </Typography>
                            <Chip 
                              label="OBLIGATORIO" 
                              size="small" 
                              color="error"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          </Box>
                          <Typography variant='body2' color='text.secondary'>
                            {course.instructor} • {course.duration}
                          </Typography>
                          {course.deadline && (
                            <Typography 
                              variant='caption' 
                              color={course.isOverdue ? 'error.main' : course.daysUntilDeadline && course.daysUntilDeadline <= 7 ? 'warning.main' : 'text.secondary'}
                              sx={{ fontWeight: 'medium' }}
                            >
                              {course.isOverdue 
                                ? `⚠️ Vencido hace ${Math.abs(course.daysUntilDeadline!)} días`
                                : `📅 Vence en ${course.daysUntilDeadline} días`
                              }
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      
                      <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                        {course.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant='caption' color='text.secondary'>
                          {course.completedLessons}/{course.totalLessons} lecciones
                        </Typography>
                        <Chip
                          label={`${course.progress}%`}
                          color={course.progress > 0 ? 'success' : 'default'}
                          size='small'
                        />
                      </Box>
                      
                      <LinearProgress
                        variant='determinate'
                        value={course.progress}
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          backgroundColor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: course.isOverdue ? 'error.main' : course.progress > 0 ? 'success.main' : 'warning.main'
                          }
                        }}
                      />
                      
                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Button
                          variant={course.progress > 0 ? 'outlined' : 'contained'}
                          size="small"
                          fullWidth
                          startIcon={<PlayArrowIcon />}
                          color={course.isOverdue ? 'error' : 'primary'}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCourseClick(course.id)
                          }}
                        >
                          {course.progress > 0 ? 'Continuar' : 'Comenzar'}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant='h6'>
                Cursos Opcionales
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {optionalCourses.length} cursos disponibles
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {optionalCourses.map((course) => (
                <Grid item xs={12} md={6} lg={4} key={course.id}>
                  <Card
                    variant='outlined'
                    sx={{ cursor: 'pointer', height: '100%' }}
                    onClick={() => handleCourseClick(course.id)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          <BookOpenIcon />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant='h6' component='div'>
                            {course.title}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {course.instructor}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                          <Typography variant='caption'>{course.rating}</Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                        {course.description}
                      </Typography>
                      
                      <Chip 
                        label={course.category} 
                        size="small" 
                        variant="outlined" 
                        sx={{ mb: 2 }}
                      />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant='caption' color='text.secondary'>
                          {course.completedLessons}/{course.totalLessons} lecciones
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {course.duration}
                        </Typography>
                      </Box>
                      
                      {course.progress > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant='caption'>Progreso</Typography>
                            <Typography variant='caption'>{course.progress}%</Typography>
                          </Box>
                          <LinearProgress
                            variant='determinate'
                            value={course.progress}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      )}
                      
                      <Button
                        variant={course.progress > 0 ? 'outlined' : 'contained'}
                        size="small"
                        fullWidth
                        startIcon={<PlayArrowIcon />}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCourseClick(course.id)
                        }}
                      >
                        {course.progress === 100 ? 'Revisar' : course.progress > 0 ? 'Continuar' : 'Comenzar'}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {activeTab === 3 && (
          <Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant='h6' gutterBottom>
                Mis Certificados Obtenidos
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Certificados que has obtenido al completar cursos
              </Typography>
            </Box>

            {(() => {
              if (userCertificates.length === 0) {
                return (
                  <Box
                    sx={{
                      py: 8,
                      textAlign: 'center',
                      border: '2px dashed',
                      borderColor: 'divider',
                      borderRadius: 2
                    }}
                  >
                    <AwardIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                    <Typography variant='h6' color='text.secondary' gutterBottom>
                      Aún no has obtenido certificados
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Completa cursos que otorgan certificados para verlos aquí
                    </Typography>
                  </Box>
                )
              }

              return (
                <Grid container spacing={3}>
                  {userCertificates.map((certificate: Certificate) => (
                    <Grid item xs={12} md={6} lg={4} key={certificate.id}>
                      <Card
                        variant='outlined'
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          borderColor: 'warning.main',
                          borderWidth: 2,
                          transition: 'all 0.3s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 4
                          }
                        }}
                      >
                        <CardContent sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ bgcolor: 'warning.main', mr: 2, width: 56, height: 56 }}>
                              <AwardIcon sx={{ fontSize: 32 }} />
                            </Avatar>
                            <Box>
                              <Chip
                                label='CERTIFICADO'
                                size='small'
                                color='warning'
                                sx={{ mb: 0.5, fontWeight: 'bold' }}
                              />
                              <Typography variant='caption' color='text.secondary' display='block'>
                                Emitido {new Date(certificate.issuedAt || certificate.issued_at || '').toLocaleDateString('es-ES')}
                              </Typography>
                            </Box>
                          </Box>

                          <Typography variant='h6' gutterBottom>
                            {certificate.courseTitle}
                          </Typography>

                          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                            {certificate.courseDescription}
                          </Typography>

                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                            <Chip
                              size='small'
                              icon={<VerifiedIcon />}
                              label={certificate.certificateNumber || certificate.certificate_number}
                              variant='outlined'
                            />
                            <Chip
                              size='small'
                              icon={<CheckCircleIcon />}
                              label='Verificado'
                              color='success'
                              variant='outlined'
                            />
                          </Box>
                        </CardContent>

                        <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                          <Button
                            variant='contained'
                            color='warning'
                            startIcon={<DownloadIcon />}
                            fullWidth
                            onClick={() => navigate(`/lms/certificate/${certificate.id}`)}
                          >
                            Ver Certificado
                          </Button>
                          <IconButton
                            color='primary'
                            onClick={() => {
                              if (certificate.course_id) {
                                handleCourseClick(certificate.course_id)
                              }
                            }}
                            title='Ver curso'
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )
            })()}
          </Box>
        )}

        {activeTab === 4 && (
          <Box>
            <LmsNotificationCenter userRole="employee" userId={currentUser.id} />
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default LmsEmployee
// @ts-nocheck
