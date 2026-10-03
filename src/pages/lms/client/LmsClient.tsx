import React, { useState, useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Tabs,
  Tab,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material'
import {
  MenuBook as BookOpenIcon,
  Search as SearchIcon,
  PlayArrow as PlayArrowIcon,
  EmojiEvents as AwardIcon,
  Error as ErrorIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@nanostores/react'
import { userStore } from '../../../store/userStore'
import { useAvailableCourses, useUserCertificates } from '../../../hooks/useLms'
import LmsNotificationCenter from '../shared/LmsNotificationCenter'
import LmsCourseGrid, { getCourseTone } from '../shared/LmsCourseGrid'
import { alpha } from '@mui/material/styles'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import SchoolIcon from '@mui/icons-material/School'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import type { Certificate, Course } from '../../../services/lmsService'
import { getCourseAudienceLabel } from '../../../utils/lmsAudience'
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

const formatLastAccess = (lastAccessedAt?: string | null) => {
  if (!lastAccessedAt) return null

  return new Date(lastAccessedAt).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

const getNextLessonLabel = (course: Course & { learningContinuity?: Course['learningContinuity'] }) => {
  const nextLesson = course.learningContinuity?.nextLesson
  if (!nextLesson) return null

  return `${nextLesson.moduleTitle}: ${nextLesson.title}`
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
  const { availableCourses, stats, categories } = useMemo(() => {
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
        categories: ['Todos']
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
        duration: `${totalLessons} lecciones`,
        nextLessonLabel: getNextLessonLabel(course),
        lastAccessLabel: formatLastAccess(course.learningContinuity?.lastAccessedAt)
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
      categories: uniqueCategories
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
      <Box
        sx={{ maxWidth: 'xl', mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: 4 }}
      >
        <LmsPageHeader
          title={`Hola, ${String(currentUser.name || '').split(' ')[0].charAt(0).toUpperCase() + String(currentUser.name || '').split(' ')[0].slice(1).toLowerCase()}`}
          subtitle='Tus cursos y los de tu empresa, en un solo lugar'
          icon={<SchoolIcon />}
          actions={
            <Button variant='outlined' startIcon={<NotificationsNoneIcon />} onClick={() => setActiveTab(3)}>
              Notificaciones
            </Button>
          }
        />

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <LmsStatCard
              label='Cursos disponibles'
              value={stats.totalCourses}
              icon={<MenuBookIcon />}
              tone='blue'
              active={activeTab === 1}
              onClick={() => setActiveTab(1)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LmsStatCard
              label='En progreso'
              value={stats.inProgressCourses}
              icon={<PlayCircleOutlineIcon />}
              tone='orange'
              onClick={() => setActiveTab(1)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LmsStatCard
              label='Completados'
              value={stats.completedCourses}
              icon={<CheckCircleOutlineIcon />}
              tone='green'
              onClick={() => setActiveTab(1)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LmsStatCard
              label='Certificados'
              value={stats.certificatesEarned}
              icon={<AwardIcon />}
              tone='teal'
              active={activeTab === 2}
              onClick={() => setActiveTab(2)}
            />
          </Grid>
        </Grid>

        <Tabs
          value={activeTab > 2 ? false : activeTab}
          onChange={handleTabChange}
          variant='scrollable'
          scrollButtons='auto'
          allowScrollButtonsMobile
          sx={{ mb: 3 }}
        >
          <Tab label='Inicio' />
          <Tab label='Mis Cursos' />
          <Tab label='Mis Certificados' />
        </Tabs>

        {activeTab === 0 && (() => {
          const pending = availableCourses.filter((course: any) => course.progress < 100)
          const hero = [...pending].sort((left: any, right: any) => right.progress - left.progress)[0]
          const others = pending.filter((course: any) => !hero || course.id !== hero.id)
          const heroTone = hero ? getCourseTone(hero) : null
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {hero && heroTone && (
                <Card
                  variant='outlined'
                  sx={(theme) => ({
                    borderRadius: 3,
                    p: { xs: 2, sm: 3 },
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    flexWrap: 'wrap',
                    bgcolor: alpha(theme.palette[heroTone.color].main, 0.08),
                    borderColor: alpha(theme.palette[heroTone.color].main, 0.35)
                  })}
                >
                  <Box sx={{ position: 'relative', width: 88, height: 88, flex: 'none' }}>
                    <CircularProgress
                      variant='determinate'
                      value={100}
                      size={88}
                      thickness={4}
                      sx={{ position: 'absolute', color: 'action.hover' }}
                    />
                    <CircularProgress
                      variant='determinate'
                      value={hero.progress || 0}
                      size={88}
                      thickness={4}
                      color={heroTone.color}
                      sx={{ position: 'absolute' }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: `${heroTone.color}.main`
                      }}
                    >
                      {hero.progress > 0 ? (
                        <Typography variant='h6'>{hero.progress}%</Typography>
                      ) : (
                        React.cloneElement(heroTone.icon, { sx: { fontSize: 38 } })
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ flex: '1 1 260px', minWidth: 0 }}>
                    <Typography variant='overline' color='text.secondary'>
                      {hero.progress > 0 ? 'Continúa donde quedaste' : 'Te recomendamos empezar'}
                    </Typography>
                    <Typography variant='h5' sx={{ fontWeight: 600, lineHeight: 1.25 }}>
                      {hero.title}
                    </Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                      {hero.completedLessons}/{hero.totalLessons} lecciones
                      {hero.nextLessonLabel ? ` · Sigue: ${hero.nextLessonLabel}` : ''}
                    </Typography>
                  </Box>
                  <Button
                    size='large'
                    variant='contained'
                    startIcon={<PlayArrowIcon />}
                    onClick={() => handleCourseClick(hero.id)}
                  >
                    {hero.progress > 0 ? 'Continuar' : 'Comenzar'}
                  </Button>
                </Card>
              )}

              {others.length > 0 && (
                <Box>
                  <Typography variant='h6' sx={{ mb: 2 }}>
                    Disponibles para ti ({others.length})
                  </Typography>
                  <LmsCourseGrid courses={others} onOpen={handleCourseClick} />
                </Box>
              )}

              {availableCourses.length === 0 && (
                <Card variant='outlined' sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                  <BookOpenIcon sx={{ fontSize: 56, color: 'info.main', mb: 1 }} />
                  <Typography variant='h6'>Aún no hay cursos para tu empresa</Typography>
                  <Typography variant='body2' color='text.secondary' sx={{ maxWidth: 480, mx: 'auto' }}>
                    Cuando Metromedics publique cursos para tu empresa aparecerán aquí. Si esperabas
                    alguno, escribe a tu contacto en Metromedics para confirmarlo.
                  </Typography>
                </Card>
              )}

              {availableCourses.length > 0 && pending.length === 0 && (
                <Card variant='outlined' sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                  <AwardIcon sx={{ fontSize: 56, color: 'success.main', mb: 1 }} />
                  <Typography variant='h6'>Completaste todos tus cursos</Typography>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                    Puedes repasar cualquiera desde Mis Cursos o descargar tus certificados.
                  </Typography>
                  <Button variant='outlined' onClick={() => setActiveTab(1)}>
                    Ver mis cursos
                  </Button>
                </Card>
              )}
            </Box>
          )
        })()}

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
              <LmsCourseGrid courses={filteredCourses} onOpen={handleCourseClick} />
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
                    Ver mis cursos
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
