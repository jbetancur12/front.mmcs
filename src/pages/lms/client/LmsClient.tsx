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
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material'
import {
  MenuBook as BookOpenIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Logout as LogoutIcon,
  Search as SearchIcon,
  PlayArrow as PlayArrowIcon,
  EmojiEvents as AwardIcon,
  NewReleases as NewReleasesIcon,
  Error as ErrorIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@nanostores/react'
import { userStore } from '../../../store/userStore'
import { useAvailableCourses, useUserCertificates } from '../../../hooks/useLms'
import LmsNotificationCenter from '../shared/LmsNotificationCenter'
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

interface ClientDashboardProps {
  user?: User
}

const LmsClient: React.FC<ClientDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const navigate = useNavigate()
  const $userStore = useStore(userStore)

  // Fetch available courses from API
  const { data: coursesData, isLoading, error } = useAvailableCourses()
  const { data: userCertificates = [] } = useUserCertificates()

  // Usar el usuario del store si no se proporciona uno
  const currentUser = user || {
    id: $userStore.customer?.id || 1,
    email: $userStore.email || '',
    role: 'client',
    name: $userStore.nombre || $userStore.email || 'Cliente'
  }

  // Process courses data
  const { availableCourses, stats, categories, continueCourses, newCourses } = useMemo(() => {
    if (!coursesData) {
      return {
        availableCourses: [],
        stats: {
          totalCourses: 0,
          completedCourses: 0,
          inProgressCourses: 0,
          averageProgress: 0,
          certificatesEarned: 0,
          totalHoursLearned: 0
        },
        categories: ['Todos'],
        continueCourses: [],
        newCourses: []
      }
    }

    // Extract courses array from response
    const courses = coursesData
    const certificatesByCourseId = new Map(
      userCertificates.map((certificate: Certificate) => [
        certificate.course_id,
        certificate
      ])
    )

    // Enriquecer cursos con datos calculados
    const enrichedCourses = courses.map((course: Course) => {
      const progress = getCourseProgressPercentage(course)
      const totalLessons = getCourseTotalLessons(course)
      const completedLessons = getCourseCompletedLessons(course)
      const earnedCertificate = certificatesByCourseId.get(course.id)

      return {
        ...course,
        progress,
        totalLessons,
        completedLessons,
        earnedCertificate,
        category: getCourseAudienceLabel(course.audience),
        instructor: course.creator?.nombre || 'Instructor',
        duration: `${totalLessons} lecciones`
      }
    })

    // Calcular estadísticas
    const totalCourses = enrichedCourses.length
    const completedCourses = enrichedCourses.filter(c => c.progress === 100).length
    const inProgressCourses = enrichedCourses.filter(c => c.progress > 0 && c.progress < 100).length
    const totalProgress = enrichedCourses.reduce((sum, c) => sum + c.progress, 0)
    const averageProgress = totalCourses > 0 ? Math.round(totalProgress / totalCourses) : 0

    // Extraer categorías únicas
    const uniqueCategories: string[] = ['Todos', ...Array.from(new Set(enrichedCourses.map(c => c.category)))]

    const continueLearning = enrichedCourses
      .filter(c => c.progress > 0 && c.progress < 100)
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 3)
      .map((c) => ({
        id: c.id,
        title: c.title,
        progress: c.progress,
        category: c.category
      }))

    const newest = [...enrichedCourses]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 2)
      .map(c => ({
        id: c.id,
        title: c.title,
        releaseDate: c.created_at,
        category: c.category
      }))

    return {
      availableCourses: enrichedCourses,
      stats: {
        totalCourses,
        completedCourses,
        inProgressCourses,
        averageProgress,
        certificatesEarned: userCertificates.length,
        totalHoursLearned: Math.round(
          enrichedCourses.reduce((sum, course) => sum + getCourseTimeSpentMinutes(course), 0) / 60
        )
      },
      categories: uniqueCategories,
      continueCourses: continueLearning,
      newCourses: newest
    }
  }, [coursesData, userCertificates])

  // Filtrar cursos basado en búsqueda y categoría
  const filteredCourses = useMemo(() => {
    let filtered = availableCourses

    if (selectedCategory !== 'Todos') {
      filtered = filtered.filter(course => course.category === selectedCategory)
    }

    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }, [availableCourses, selectedCategory, searchTerm])

  const nextLearningAction = useMemo(() => {
    const inProgress = availableCourses
      .filter((course) => course.progress > 0 && course.progress < 100)
      .sort((left, right) => right.progress - left.progress)[0]

    if (inProgress) {
      return {
        title: inProgress.title,
        description: `Ya avanzaste ${inProgress.progress}% en este curso. Retomarlo es la forma más rápida de seguir aprendiendo.`,
        cta: 'Continuar curso',
        courseId: inProgress.id,
        section: 0
      }
    }

    const recommended = availableCourses[0]
    if (recommended) {
      return {
        title: recommended.title,
        description: 'Aún no tienes cursos en progreso. Este es un buen punto para comenzar.',
        cta: 'Comenzar curso',
        courseId: recommended.id,
        section: 1
      }
    }

    return null
  }, [availableCourses])

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
  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Cargando cursos disponibles...
          </Typography>
        </Box>
      </Box>
    )
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center', maxWidth: 500 }}>
          <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" color="error" gutterBottom>
            Error al cargar los cursos
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {error instanceof Error ? error.message : 'No se pudieron cargar los cursos disponibles'}
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
                {getLearningVisibilityLabel('client')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Badge
                badgeContent='Cliente'
                color='info'
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
          <Tab label='Mis Cursos' />
          <Tab label='Mis Certificados' />
          <Tab label='Notificaciones' />
        </Tabs>

        {activeTab === 0 && (
          <Box>
            <Alert severity='info' sx={{ mb: 3 }}>
              Como usuario cliente, aquí verás los cursos disponibles para tu empresa y los cursos
              compartidos. No manejas asignaciones obligatorias: avanzas desde catálogo y
              certificados obtenidos.
            </Alert>
            {nextLearningAction && (
              <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Typography variant='overline' color='text.secondary'>
                    Siguiente paso recomendado
                  </Typography>
                  <Typography variant='h6' sx={{ mt: 0.5 }}>
                    {nextLearningAction.title}
                  </Typography>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                    {nextLearningAction.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant='contained'
                      startIcon={<PlayArrowIcon />}
                      onClick={() => handleCourseClick(nextLearningAction.courseId)}
                    >
                      {nextLearningAction.cta}
                    </Button>
                    <Button
                      variant='outlined'
                      onClick={() => setActiveTab(nextLearningAction.section)}
                    >
                      Ver esta sección
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}
            {/* Estadísticas principales */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} lg={3}>
                <Card>
                  <CardHeader
                    avatar={<BookOpenIcon color='primary' />}
                    title='Cursos Totales'
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
                      {stats.totalCourses}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {stats.completedCourses} completados
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
                    avatar={<CheckCircleIcon color='warning' />}
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
                      Tiempo registrado
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Cursos con progreso */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardHeader title='Cursos con progreso' />
                  <CardContent>
                    {availableCourses.filter(course => course.progress > 0).length > 0 ? (
                      <List>
                        {availableCourses
                          .filter(course => course.progress > 0)
                          .map((course) => (
                            <React.Fragment key={course.id}>
                              <ListItem
                                button
                                onClick={() => handleCourseClick(course.id)}
                                sx={{ px: 0 }}
                              >
                                <ListItemIcon>
                                  <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                                    <BookOpenIcon />
                                  </Avatar>
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body1" fontWeight="medium">
                                        {course.title}
                                      </Typography>
                                      <Chip
                                        label={course.category}
                                        size="small"
                                        variant="outlined"
                                      />
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
                                  variant={course.progress === 100 && course.earnedCertificate ? 'outlined' : 'contained'}
                                  size="small"
                                  startIcon={course.progress === 100 ? <AwardIcon /> : <PlayArrowIcon />}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (course.progress === 100 && course.earnedCertificate) {
                                      navigate(`/lms/certificate/${course.earnedCertificate.id}`)
                                      return
                                    }

                                    handleCourseClick(course.id)
                                  }}
                                >
                                  {course.progress === 100 && course.earnedCertificate ? 'Ver Certificado' : 'Continuar'}
                                </Button>
                              </ListItem>
                              <Divider />
                            </React.Fragment>
                          ))}
                      </List>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <BookOpenIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                          Aún no tienes cursos con progreso
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Revisa tus cursos disponibles y comienza tu aprendizaje
                        </Typography>
                        <Button variant="contained" onClick={() => setActiveTab(1)}>
                          Ver mis cursos
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ mb: 2 }}>
                  <CardHeader title="Continuar aprendiendo" />
                  <CardContent>
                    {continueCourses.length > 0 ? (
                      <List dense>
                        {continueCourses.map((course) => (
                          <ListItem key={course.id} sx={{ px: 0 }}>
                            <ListItemIcon><PlayArrowIcon color="primary" /></ListItemIcon>
                            <ListItemText
                              primary={course.title}
                              secondary={`${course.progress}% completado • ${course.category}`}
                            />
                            <Button size="small" onClick={() => handleCourseClick(course.id)}>
                              Retomar
                            </Button>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Aún no tienes cursos en progreso.
                      </Typography>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader title="Para seguir aprendiendo" />
                  <CardContent>
                    {newCourses.length > 0 ? (
                      <List dense>
                        {newCourses.map((course) => (
                          <ListItem key={course.id} sx={{ px: 0 }}>
                            <ListItemIcon><NewReleasesIcon color="info" /></ListItemIcon>
                            <ListItemText
                              primary={course.title}
                              secondary={`Agregado el ${new Date(course.releaseDate).toLocaleDateString('es-CO')} • ${course.category}`}
                            />
                            <Button size="small" onClick={() => handleCourseClick(course.id)}>
                              Ver curso
                            </Button>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No hay cursos nuevos para este momento
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            {/* Barra de búsqueda y filtros */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder="Buscar cursos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Categoría</InputLabel>
                    <Select
                      value={selectedCategory}
                      label="Categoría"
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      {categories.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    {filteredCourses.length} cursos encontrados
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            {/* Lista de cursos */}
            {filteredCourses.length > 0 ? (
              <Grid container spacing={3}>
                {filteredCourses.map((course) => (
                  <Grid item xs={12} md={6} lg={4} key={course.id}>
                    <Card
                      variant='outlined'
                      sx={{ cursor: 'pointer', height: '100%' }}
                      onClick={() => handleCourseClick(course.id)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                            <BookOpenIcon />
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant='h6' component='div' sx={{ mb: 0.5 }}>
                              {course.title}
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              {course.instructor}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                              <Typography variant='caption' color='text.secondary'>
                                {course.duration}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                          {course.description}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          <Chip
                            label={course.category}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={`${course.totalLessons} lecciones`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>

                        {course.progress > 0 ? (
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant='caption'>Tu progreso</Typography>
                              <Typography variant='caption'>{course.progress}%</Typography>
                            </Box>
                            <LinearProgress
                              variant='determinate'
                              value={course.progress}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        ) : null}

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
                          {course.progress > 0 ? 'Continuar' : 'Comenzar'}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No se encontraron cursos
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Intenta con otros términos de búsqueda o cambia la categoría
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant='h6'>
                Mis Certificados
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {stats.certificatesEarned} certificados obtenidos
              </Typography>
            </Box>

            {userCertificates.length > 0 ? (
              <Grid container spacing={3}>
                {userCertificates.map((certificate: Certificate) => (
                    <Grid item xs={12} md={6} lg={4} key={certificate.id}>
                      <Card variant='outlined'>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                              <AwardIcon />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant='h6' component='div'>
                                {certificate.courseTitle}
                              </Typography>
                              <Typography variant='body2' color='text.secondary'>
                                Emitido {new Date(certificate.issuedAt || certificate.issued_at || '').toLocaleDateString('es-ES')}
                              </Typography>
                            </Box>
                          </Box>

                          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                            Certificado N°: {certificate.certificateNumber || certificate.certificate_number}
                          </Typography>

                          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <Chip
                              label='Certificado'
                              size="small"
                              color="success"
                            />
                          </Box>

                          <Button
                            variant='outlined'
                            size="small"
                            fullWidth
                            startIcon={<AwardIcon />}
                            onClick={() => navigate(`/lms/certificate/${certificate.id}`)}
                          >
                            Ver Certificado
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <AwardIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  Aún no tienes certificados
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Completa cursos para obtener certificados
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Button variant="contained" onClick={() => setActiveTab(1)}>
                    Ver mi aprendizaje
                  </Button>
                  <Button variant="outlined" onClick={() => navigate('/lms/certificates')}>
                    Ir a certificados
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        )}

        {activeTab === 3 && (
          <Box>
            <LmsNotificationCenter userRole="client" userId={currentUser.id} />
          </Box>
        )}

      </Box>
    </Box>
  )
}

export default LmsClient
