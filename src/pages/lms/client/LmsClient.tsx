import React, { useState, useEffect, useMemo } from 'react'
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
  CircularProgress
} from '@mui/material'
import {
  MenuBook as BookOpenIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Logout as LogoutIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Star as StarIcon,
  PlayArrow as PlayArrowIcon,
  EmojiEvents as AwardIcon,
  Whatshot as WhatshotIcon,
  NewReleases as NewReleasesIcon,
  Error as ErrorIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@nanostores/react'
import { userStore } from '../../../store/userStore'
import { useAvailableCourses } from '../../../hooks/useLms'
import type { Course } from '../../../services/lmsService'

interface User {
  id: number
  email: string
  role: string
  name: string
}

interface ClientDashboardProps {
  user?: User
}

// Helper para calcular el progreso de un curso
const calculateCourseProgress = (course: Course): number => {
  if (course.userProgress && course.userProgress.length > 0) {
    return course.userProgress[0].progress_percentage || 0
  }
  return 0
}

// Helper para contar lecciones completadas
const countCompletedLessons = (course: Course): number => {
  if (course.userProgress && course.userProgress.length > 0) {
    return course.userProgress[0].completed_lessons?.length || 0
  }
  return 0
}

// Helper para contar total de lecciones
const countTotalLessons = (course: Course): number => {
  let total = 0
  course.modules?.forEach(module => {
    total += module.lessons?.length || 0
  })
  return total
}

const LmsClient: React.FC<ClientDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const navigate = useNavigate()
  const $userStore = useStore(userStore)

  // Fetch available courses from API
  const { data: coursesData, isLoading, error } = useAvailableCourses()

  // Usar el usuario del store si no se proporciona uno
  const currentUser = user || {
    id: $userStore.customer?.id || 1,
    email: $userStore.email || '',
    role: 'client',
    name: $userStore.nombre || $userStore.email || 'Cliente'
  }

  // Process courses data
  const { availableCourses, stats, categories, popularCourses, newCourses } = useMemo(() => {
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
        popularCourses: [],
        newCourses: []
      }
    }

    // Extract courses array from response
    const courses = Array.isArray(coursesData) ? coursesData : coursesData.data || []

    // Enriquecer cursos con datos calculados
    const enrichedCourses = courses.map((course: Course) => {
      const progress = calculateCourseProgress(course)
      const totalLessons = countTotalLessons(course)
      const completedLessons = countCompletedLessons(course)

      return {
        ...course,
        progress,
        totalLessons,
        completedLessons,
        category: course.audience || 'General',
        instructor: course.creator?.nombre || 'Instructor',
        duration: `${totalLessons} lecciones`,
        rating: 4.5,
        isPublic: true
      }
    })

    // Calcular estadísticas
    const totalCourses = enrichedCourses.length
    const completedCourses = enrichedCourses.filter(c => c.progress === 100).length
    const inProgressCourses = enrichedCourses.filter(c => c.progress > 0 && c.progress < 100).length
    const totalProgress = enrichedCourses.reduce((sum, c) => sum + c.progress, 0)
    const averageProgress = totalCourses > 0 ? Math.round(totalProgress / totalCourses) : 0

    // Extraer categorías únicas
    const uniqueCategories = ['Todos', ...Array.from(new Set(enrichedCourses.map(c => c.category)))]

    // Calcular cursos populares (por ahora, cursos con mayor progreso)
    const popular = enrichedCourses
      .filter(c => c.progress > 0)
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 3)
      .map((c, index) => ({
        id: c.id,
        title: c.title,
        enrollments: 100 + (index * 50), // Mock data
        rating: c.rating,
        category: c.category
      }))

    // Cursos nuevos (últimos cursos creados)
    const newest = [...enrichedCourses]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 2)
      .map(c => ({
        id: c.id,
        title: c.title,
        releaseDate: c.created_at,
        rating: c.rating,
        category: c.category
      }))

    return {
      availableCourses: enrichedCourses,
      stats: {
        totalCourses,
        completedCourses,
        inProgressCourses,
        averageProgress,
        certificatesEarned: completedCourses,
        totalHoursLearned: Math.round(totalCourses * 3)
      },
      categories: uniqueCategories,
      popularCourses: popular,
      newCourses: newest
    }
  }, [coursesData])

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
                Cursos Públicos
              </Typography>
              <Typography variant='body1' color='text.secondary'>
                Bienvenido, {currentUser.name}
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
          <Tab label='Explorar Cursos' />
          <Tab label='Mis Certificados' />
          <Tab label='Populares' />
        </Tabs>

        {activeTab === 0 && (
          <Box>
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
                      Este año
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Mis cursos inscritos */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardHeader title='Mis Cursos Inscritos' />
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
                                  variant={course.progress === 100 ? 'outlined' : 'contained'}
                                  size="small"
                                  startIcon={course.progress === 100 ? <AwardIcon /> : <PlayArrowIcon />}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleCourseClick(course.id)
                                  }}
                                >
                                  {course.progress === 100 ? 'Ver Certificado' : 'Continuar'}
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
                          No tienes cursos inscritos
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Explora nuestros cursos y comienza tu aprendizaje
                        </Typography>
                        <Button variant="contained" onClick={() => setActiveTab(1)}>
                          Explorar Cursos
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ mb: 2 }}>
                  <CardHeader title="Cursos Populares" />
                  <CardContent>
                    {popularCourses.length > 0 ? (
                      <List dense>
                        {popularCourses.map((course) => (
                          <ListItem key={course.id} sx={{ px: 0 }}>
                            <ListItemIcon><WhatshotIcon color="warning" /></ListItemIcon>
                            <ListItemText
                              primary={course.title}
                              secondary={`${course.enrollments} inscritos • ${course.rating}⭐`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No hay datos disponibles
                      </Typography>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader title="Nuevos Cursos" />
                  <CardContent>
                    {newCourses.length > 0 ? (
                      <List dense>
                        {newCourses.map((course) => (
                          <ListItem key={course.id} sx={{ px: 0 }}>
                            <ListItemIcon><NewReleasesIcon color="info" /></ListItemIcon>
                            <ListItemText
                              primary={course.title}
                              secondary={`Nuevo • ${course.rating}⭐`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No hay cursos nuevos
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
                              <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                              <Typography variant='caption'>{course.rating}</Typography>
                              <Typography variant='caption' color='text.secondary'>
                                • {course.duration}
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
                          {course.progress > 0 ? 'Continuar' : 'Inscribirse'}
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

            {availableCourses.filter(course => course.progress === 100).length > 0 ? (
              <Grid container spacing={3}>
                {availableCourses
                  .filter(course => course.progress === 100)
                  .map((course) => (
                    <Grid item xs={12} md={6} lg={4} key={course.id}>
                      <Card variant='outlined'>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                              <AwardIcon />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant='h6' component='div'>
                                {course.title}
                              </Typography>
                              <Typography variant='body2' color='text.secondary'>
                                Completado
                              </Typography>
                            </Box>
                          </Box>

                          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                            Instructor: {course.instructor}
                          </Typography>

                          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <Chip
                              label={course.category}
                              size="small"
                              color="success"
                            />
                            <Chip
                              label={`${course.duration}`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>

                          <Button
                            variant='outlined'
                            size="small"
                            fullWidth
                            startIcon={<AwardIcon />}
                            onClick={() => handleCourseClick(course.id)}
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
                <Button variant="contained" onClick={() => setActiveTab(1)}>
                  Explorar Cursos
                </Button>
              </Box>
            )}
          </Box>
        )}

        {activeTab === 3 && (
          <Box>
            <Typography variant='h6' sx={{ mb: 3 }}>
              Cursos Populares y Destacados
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader
                    title="Más Populares"
                    avatar={<WhatshotIcon color="warning" />}
                  />
                  <CardContent>
                    {popularCourses.length > 0 ? (
                      <List>
                        {popularCourses.map((course, index) => (
                          <React.Fragment key={course.id}>
                            <ListItem
                              button
                              onClick={() => handleCourseClick(course.id)}
                              sx={{ px: 0 }}
                            >
                              <ListItemIcon>
                                <Typography variant="h6" color="warning.main">
                                  #{index + 1}
                                </Typography>
                              </ListItemIcon>
                              <ListItemText
                                primary={course.title}
                                secondary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="caption">
                                      {course.enrollments} inscritos
                                    </Typography>
                                    <Chip
                                      label={course.category}
                                      size="small"
                                      variant="outlined"
                                    />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <StarIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                                      <Typography variant="caption">{course.rating}</Typography>
                                    </Box>
                                  </Box>
                                }
                              />
                              <Button size="small" variant="outlined">
                                Ver Curso
                              </Button>
                            </ListItem>
                            {index < popularCourses.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No hay datos disponibles
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader
                    title="Recién Agregados"
                    avatar={<NewReleasesIcon color="info" />}
                  />
                  <CardContent>
                    {newCourses.length > 0 ? (
                      <List>
                        {newCourses.map((course, index) => (
                          <React.Fragment key={course.id}>
                            <ListItem
                              button
                              onClick={() => handleCourseClick(course.id)}
                              sx={{ px: 0 }}
                            >
                              <ListItemIcon>
                                <NewReleasesIcon color="info" />
                              </ListItemIcon>
                              <ListItemText
                                primary={course.title}
                                secondary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="caption">
                                      Agregado el {new Date(course.releaseDate).toLocaleDateString()}
                                    </Typography>
                                    <Chip
                                      label={course.category}
                                      size="small"
                                      variant="outlined"
                                    />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <StarIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                                      <Typography variant="caption">{course.rating}</Typography>
                                    </Box>
                                  </Box>
                                }
                              />
                              <Button size="small" variant="contained">
                                Inscribirse
                              </Button>
                            </ListItem>
                            {index < newCourses.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No hay cursos nuevos
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant='h6' sx={{ mb: 2 }}>
                ¿Buscas algo específico?
              </Typography>
              <Button
                variant='contained'
                size="large"
                onClick={() => setActiveTab(1)}
                startIcon={<SearchIcon />}
              >
                Explorar Todos los Cursos
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default LmsClient
