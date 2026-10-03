import React, { useState, useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Grid,
  Tabs,
  Tab,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  EmojiEvents as AwardIcon,
  EventBusy as EventBusyIcon,
  Schedule as ScheduleIcon,
  MenuBook as BookOpenIcon,
  WorkspacePremium as PremiumIcon,
  AutoStories as StoriesIcon,
  Error as ErrorIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import SearchIcon from '@mui/icons-material/Search'
import SchoolIcon from '@mui/icons-material/School'
import AssignmentIcon from '@mui/icons-material/Assignment'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import { alpha } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@nanostores/react'
import { userStore } from '../../../store/userStore'
import LmsNotificationCenter from '../shared/LmsNotificationCenter'
import { useAvailableCourses, useUserAssignments, useUserCertificates } from '../../../hooks/useLms'
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

const getMandatoryPriority = (course: { isOverdue?: boolean; daysUntilDeadline?: number; progress?: number }) => {
  if (course.progress === 100) return 4
  if (course.isOverdue) return 0
  if (typeof course.daysUntilDeadline === 'number' && course.daysUntilDeadline <= 7) return 1
  if (typeof course.daysUntilDeadline === 'number') return 2
  return 3
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

const getAssignmentBackedProgress = (
  course: Course,
  assignment?: {
    userProgress?: {
      totalLessons: number
      completedLessons: number
      completionPercentage: number
      isCompleted: boolean
    }
  } | null,
  earnedCertificate?: Certificate
) => {
  const courseProgress = getCourseProgressPercentage(course)
  const courseTotalLessons = getCourseTotalLessons(course)
  const courseCompletedLessons = getCourseCompletedLessons(course)
  const assignmentProgress = assignment?.userProgress

  const progress = assignmentProgress?.isCompleted
    ? 100
    : assignmentProgress?.completionPercentage ?? courseProgress

  const totalLessons = assignmentProgress?.totalLessons || courseTotalLessons
  const completedLessons = assignmentProgress?.isCompleted
    ? totalLessons
    : assignmentProgress?.completedLessons ?? courseCompletedLessons

  if (earnedCertificate && progress === 0) {
    return {
      progress: 100,
      totalLessons,
      completedLessons: totalLessons
    }
  }

  return {
    progress,
    totalLessons,
    completedLessons
  }
}

type CourseTone = {
  color: 'error' | 'warning' | 'success' | 'primary' | 'secondary'
  icon: React.ReactElement
}

const getCourseTone = (course: any): CourseTone => {
  if (course.progress === 100) return { color: 'success', icon: <CheckCircleIcon /> }
  if (course.isOverdue) return { color: 'error', icon: <EventBusyIcon /> }
  if (typeof course.daysUntilDeadline === 'number' && course.daysUntilDeadline <= 7) {
    return { color: 'warning', icon: <ScheduleIcon /> }
  }
  if (course.progress > 0) return { color: 'primary', icon: <BookOpenIcon /> }
  if (course.has_certificate) return { color: 'secondary', icon: <PremiumIcon /> }
  return { color: 'secondary', icon: <StoriesIcon /> }
}

const getCourseKind = (course: any) =>
  course.isMandatory ? 'Obligatorio' : course.isAssigned ? 'Asignado' : 'Opcional'

const formatLearnedTime = (minutes: number) => {
  if (!minutes || minutes < 1) return '0 min'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

const LmsEmployee: React.FC<EmployeeDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState(0)
  const [courseSearch, setCourseSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState<'all' | 'mandatory' | 'optional' | 'completed'>('all')
  const normalizedSearch = courseSearch.trim().toLowerCase()
  const matchesSearch = (course: any) =>
    !normalizedSearch || String(course.title || '').toLowerCase().includes(normalizedSearch)
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
  const { mandatoryCourses, optionalCourses, assignedOptionalCourses, completedCourses, stats } = useMemo(() => {
    if (!coursesData) {
      return {
        mandatoryCourses: [],
        optionalCourses: [],
        assignedOptionalCourses: [],
        completedCourses: [],
        stats: {
          totalCourses: 0,
          completedCourses: 0,
          inProgressCourses: 0,
          averageProgress: 0,
          certificatesEarned: 0,
          totalMinutesLearned: 0,
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
    // Un curso puede tener varias asignaciones (rol + usuario): se usa la de fecha límite más próxima
    const assignmentsByCourseId = new Map<number, any>()
    allAssignments.forEach((assignment: any) => {
      const current = assignmentsByCourseId.get(assignment.course_id)
      const time = (value?: string | null) =>
        value ? new Date(value).getTime() : Number.MAX_SAFE_INTEGER
      if (!current || time(assignment.deadline) < time(current.deadline)) {
        assignmentsByCourseId.set(assignment.course_id, assignment)
      }
    })

    // Separar cursos obligatorios y opcionales
    const mandatory: any[] = []
    const optional: any[] = []

    courses.forEach((course: Course) => {
      const assignment = assignmentsByCourseId.get(course.id)
      const earnedCertificate = certificatesByCourseId.get(course.id)
      const { progress, totalLessons, completedLessons } = getAssignmentBackedProgress(
        course,
        assignment,
        earnedCertificate
      )
      const courseIsMandatory = assignment?.course?.is_mandatory ?? course.is_mandatory ?? false
      const deadline = assignment?.deadline
      const daysUntilDeadline = getDaysUntilDeadline(deadline)
      const isOverdue =
        progress < 100 &&
        Boolean(assignment?.isOverdue ?? (daysUntilDeadline !== undefined && daysUntilDeadline < 0))

      const enrichedCourse = {
        ...course,
        progress,
        totalLessons,
        completedLessons,
        category: getCourseAudienceLabel(course.audience),
        instructor: course.creator?.nombre || 'Instructor',
        duration: `${totalLessons} lecciones`,
        earnedCertificate,
        isAssigned: Boolean(assignment),
        deadline,
        daysUntilDeadline,
        isOverdue,
        nextLessonLabel: getNextLessonLabel(course),
        lastAccessLabel: formatLastAccess(course.learningContinuity?.lastAccessedAt),
        completedAt: course.learningContinuity?.completedAt || earnedCertificate?.completionDate || null
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
    mandatory.sort((a, b) => {
      const priorityDifference = getMandatoryPriority(a) - getMandatoryPriority(b)
      if (priorityDifference !== 0) return priorityDifference

      const aDeadline = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER
      const bDeadline = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER
      return aDeadline - bDeadline
    })

    const totalCourses = courses.length
    const allEnrichedCourses = [...mandatory, ...optional]
    const completedCourses = allEnrichedCourses.filter((course) => course.progress === 100).length
    const inProgressCourses = allEnrichedCourses.filter((course) => course.progress > 0 && course.progress < 100).length

    const totalProgress = allEnrichedCourses.reduce((sum: number, course) => sum + course.progress, 0)
    const averageProgress = totalCourses > 0 ? Math.round(totalProgress / totalCourses) : 0

    const mandatoryCompleted = mandatory.filter(c => c.progress === 100).length
    const overdueTraining = mandatory.filter(c => c.isOverdue && c.progress < 100).length

    // Calcular certificados reales: solo cursos completados que emiten certificado
    const certificatesEarned = userCertificates.length
    const totalHoursLearned = courses.reduce((totalHours: number, course: Course) => {
      return totalHours + getCourseTimeSpentMinutes(course)
    }, 0)

    return {
      mandatoryCourses: mandatory,
      optionalCourses: optional,
      assignedOptionalCourses: optional.filter(
        (course) => course.isAssigned && course.progress < 100
      ),
      completedCourses: allEnrichedCourses.filter((course) => course.progress === 100),
      stats: {
        totalCourses,
        completedCourses,
        inProgressCourses,
        averageProgress,
        certificatesEarned, // ✅ Ahora usa datos reales
        totalMinutesLearned: Math.round(totalHoursLearned), // minutos reales registrados
        mandatoryCourses: mandatory.length,
        mandatoryCompleted,
        overdueTraining
      }
    }
  }, [coursesData, userAssignments, userCertificates])

  const recentRecognitions = useMemo(() => {
    const certificateRecognitions = userCertificates.slice(0, 3).map((certificate: Certificate) => ({
      id: `certificate-${certificate.id}`,
      icon: <AwardIcon color="warning" />,
      primary: 'Certificado obtenido',
      secondary: certificate.courseTitle
    }))

    if (certificateRecognitions.length > 0) {
      return certificateRecognitions
    }

    const completedCourseRecognitions = [...mandatoryCourses, ...optionalCourses]
      .filter((course) => course.progress === 100)
      .slice(0, 3)
      .map((course) => ({
        id: `course-${course.id}`,
        icon: <CheckCircleIcon color="success" />,
        primary: 'Curso completado',
        secondary: course.title
      }))

    return completedCourseRecognitions
  }, [mandatoryCourses, optionalCourses, userCertificates])

  // Inicio: una sola lista de prioridad (sin repetir cursos entre bloques)
  const homeFeed = useMemo(() => {
    const urgency = (course: any) => {
      if (course.isOverdue) return 0
      if (typeof course.daysUntilDeadline === 'number' && course.daysUntilDeadline <= 7) return 1
      return 2
    }
    const deadlineTime = (course: any) =>
      typeof course.daysUntilDeadline === 'number' ? course.daysUntilDeadline : Number.MAX_SAFE_INTEGER

    const attention = [
      ...mandatoryCourses
        .filter((course: any) => course.progress < 100)
        .map((course: any) => ({ ...course, homeKind: 'mandatory' as const })),
      ...assignedOptionalCourses.map((course: any) => ({ ...course, homeKind: 'assigned' as const }))
    ].sort((left: any, right: any) => {
      const byUrgency = urgency(left) - urgency(right)
      if (byUrgency !== 0) return byUrgency
      const byMandatory = Number(right.homeKind === 'mandatory') - Number(left.homeKind === 'mandatory')
      if (byMandatory !== 0) return byMandatory
      return deadlineTime(left) - deadlineTime(right)
    })

    const attentionIds = new Set(attention.map((course: any) => course.id))
    const resume = optionalCourses
      .filter((course: any) => course.progress > 0 && course.progress < 100 && !attentionIds.has(course.id))
      .sort((left: any, right: any) => right.progress - left.progress)
      .slice(0, 3)

    return { attention, resume }
  }, [mandatoryCourses, optionalCourses, assignedOptionalCourses])

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

  const renderCourseGrid = (list: any[], options: { showKind?: boolean } = {}) => (
    <Grid container spacing={2.5}>
      {list.map((course: any) => {
        const tone = getCourseTone(course)
        const done = course.progress === 100
        const overdue = !done && Boolean(course.isOverdue)
        const soon =
          !done &&
          !overdue &&
          typeof course.daysUntilDeadline === 'number' &&
          course.daysUntilDeadline <= 7
        return (
          <Grid item xs={12} sm={6} lg={4} key={course.id}>
            <Card
              variant='outlined'
              onClick={() => handleCourseClick(course.id)}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform .15s ease, box-shadow .15s ease',
                '&:hover': { transform: 'translateY(-3px)', boxShadow: 4 }
              }}
            >
              <Box
                sx={(theme) => ({
                  height: 84,
                  px: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  bgcolor: alpha(theme.palette[tone.color].main, 0.12),
                  color: `${tone.color}.main`
                })}
              >
                {React.cloneElement(tone.icon, { sx: { fontSize: 38 } })}
                {done && <Chip size='small' color='success' label='Completado' />}
                {overdue && (
                  <Chip
                    size='small'
                    color='error'
                    label={`Vencido hace ${Math.abs(course.daysUntilDeadline)} d`}
                  />
                )}
                {soon && (
                  <Chip size='small' color='warning' label={`Vence en ${course.daysUntilDeadline} d`} />
                )}
                {!done && !overdue && !soon && options.showKind && (
                  <Chip size='small' variant='outlined' color={tone.color} label={getCourseKind(course)} />
                )}
              </Box>
              <CardContent sx={{ flex: 1, pb: 1 }}>
                <Typography
                  variant='subtitle1'
                  sx={{
                    fontWeight: 600,
                    lineHeight: 1.3,
                    minHeight: '2.6em',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {course.title}
                </Typography>
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.75 }}>
                  {course.isMandatory ? 'Obligatorio' : getCourseKind(course)} · {course.completedLessons}/
                  {course.totalLessons} lecciones
                  {!done &&
                    !overdue &&
                    !soon &&
                    typeof course.daysUntilDeadline === 'number' &&
                    ` · vence en ${course.daysUntilDeadline} días`}
                </Typography>
                {course.progress > 0 && !done ? (
                  <Box sx={{ mt: 1.5 }}>
                    <LinearProgress
                      variant='determinate'
                      value={course.progress}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.5 }}>
                      {course.progress}% completado
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ height: 36 }} />
                )}
              </CardContent>
              <Box sx={{ p: 2, pt: 1 }}>
                <Button
                  fullWidth
                  variant={course.progress === 0 ? 'contained' : 'outlined'}
                  color={done ? 'success' : 'primary'}
                  startIcon={done ? <CheckCircleIcon /> : <PlayArrowIcon />}
                  onClick={(event) => {
                    event.stopPropagation()
                    handleCourseClick(course.id)
                  }}
                >
                  {done ? 'Repasar' : course.progress > 0 ? 'Retomar' : 'Comenzar'}
                </Button>
              </Box>
            </Card>
          </Grid>
        )
      })}
    </Grid>
  )

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Box
        sx={{ maxWidth: 'xl', mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 2, md: 3 } }}
      >
        <LmsPageHeader
          title={`Hola, ${String(currentUser.name || '').split(' ')[0].charAt(0).toUpperCase() + String(currentUser.name || '').split(' ')[0].slice(1).toLowerCase()}`}
          subtitle={`Llevas ${formatLearnedTime(stats.totalMinutesLearned)} de aprendizaje registrado`}
          icon={<SchoolIcon />}
          actions={
            <Button variant='outlined' startIcon={<NotificationsNoneIcon />} onClick={() => setActiveTab(4)}>
              Notificaciones
            </Button>
          }
        />

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <LmsStatCard
              label='Obligatorios'
              value={stats.mandatoryCourses}
              icon={<AssignmentIcon />}
              tone='blue'
              active={activeTab === 1}
              onClick={() => setActiveTab(1)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LmsStatCard
              label='Vencidos'
              value={stats.overdueTraining}
              icon={<WarningAmberIcon />}
              tone={stats.overdueTraining > 0 ? 'red' : 'green'}
              onClick={() => setActiveTab(1)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LmsStatCard
              label='En progreso'
              value={stats.inProgressCourses}
              icon={<PlayCircleOutlineIcon />}
              tone='orange'
              active={activeTab === 2}
              onClick={() => setActiveTab(2)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LmsStatCard
              label='Certificados'
              value={stats.certificatesEarned}
              icon={<AwardIcon />}
              tone='teal'
              active={activeTab === 3}
              onClick={() => setActiveTab(3)}
            />
          </Grid>
        </Grid>

        <Tabs
          value={activeTab > 3 ? false : activeTab}
          onChange={handleTabChange}
          variant='scrollable'
          scrollButtons='auto'
          allowScrollButtonsMobile
          sx={{ mb: 3 }}
        >
          <Tab label='Inicio' />
          <Tab label='Cursos Obligatorios' />
          <Tab label='Mis Cursos' />
          <Tab label='Mis Certificados' />
        </Tabs>

        {activeTab === 0 && (() => {
          const hero = homeFeed.attention[0] || homeFeed.resume[0]
          const restAttention = homeFeed.attention.slice(hero && homeFeed.attention[0] ? 1 : 0)
          const heroTone = hero ? getCourseTone(hero) : null
          const heroDone = hero ? hero.progress === 100 : false
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {stats.mandatoryCourses > 0 && (() => {
                const missing = stats.mandatoryCourses - stats.mandatoryCompleted
                const percent = Math.round((stats.mandatoryCompleted / stats.mandatoryCourses) * 100)
                return (
                  <Card variant='outlined' sx={{ borderRadius: 3, p: 2.5 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        flexWrap: 'wrap',
                        gap: 1,
                        mb: 1.5
                      }}
                    >
                      <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                        {missing === 0
                          ? '¡Estás al día con tus cursos obligatorios!'
                          : missing === 1
                            ? 'Te falta 1 curso obligatorio para estar al día'
                            : `Te faltan ${missing} cursos obligatorios para estar al día`}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {stats.mandatoryCompleted} de {stats.mandatoryCourses} completados
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant='determinate'
                      value={percent}
                      color={stats.overdueTraining > 0 ? 'error' : 'success'}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                    {stats.overdueTraining > 0 && (
                      <Typography variant='caption' color='error.main' sx={{ display: 'block', mt: 1 }}>
                        {stats.overdueTraining === 1
                          ? '1 está vencido: empieza por ese.'
                          : `${stats.overdueTraining} están vencidos: empieza por esos.`}
                      </Typography>
                    )}
                  </Card>
                )
              })()}

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
                      {hero.progress > 0 ? 'Continúa donde quedaste' : 'Tu siguiente paso'}
                    </Typography>
                    <Typography variant='h5' sx={{ fontWeight: 600, lineHeight: 1.25 }}>
                      {hero.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                      {hero.isOverdue && !heroDone && (
                        <Chip
                          size='small'
                          color='error'
                          label={`Vencido hace ${Math.abs(hero.daysUntilDeadline)} d`}
                        />
                      )}
                      {!hero.isOverdue &&
                        typeof hero.daysUntilDeadline === 'number' &&
                        hero.daysUntilDeadline <= 7 && (
                          <Chip size='small' color='warning' label={`Vence en ${hero.daysUntilDeadline} d`} />
                        )}
                      <Typography variant='body2' color='text.secondary'>
                        {hero.homeKind === 'assigned' ? 'Asignado' : hero.isMandatory ? 'Obligatorio' : 'Opcional'}
                        {hero.nextLessonLabel ? ` · Sigue: ${hero.nextLessonLabel}` : ''}
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    size='large'
                    variant='contained'
                    color={heroTone.color === 'secondary' ? 'primary' : heroTone.color}
                    startIcon={<PlayArrowIcon />}
                    onClick={() => handleCourseClick(hero.id)}
                  >
                    {hero.progress > 0 ? 'Retomar' : 'Comenzar'}
                  </Button>
                </Card>
              )}

              {restAttention.length > 0 && (
                <Box>
                  <Typography variant='h6' sx={{ mb: 2 }}>
                    Pendientes ({restAttention.length})
                  </Typography>
                  {renderCourseGrid(restAttention, { showKind: true })}
                </Box>
              )}

              {homeFeed.attention.length > 0 && homeFeed.resume.length > 0 && (
                <Box>
                  <Typography variant='h6' sx={{ mb: 2 }}>
                    Continúa donde quedaste
                  </Typography>
                  {renderCourseGrid(homeFeed.resume, { showKind: true })}
                </Box>
              )}

              {!hero && (
                <Card variant='outlined' sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                  <CheckCircleIcon sx={{ fontSize: 56, color: 'success.main', mb: 1 }} />
                  <Typography variant='h6'>Estás al día</Typography>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                    No tienes cursos pendientes ni en progreso por ahora.
                  </Typography>
                  <Button variant='outlined' onClick={() => setActiveTab(2)}>
                    Ver todos mis cursos
                  </Button>
                </Card>
              )}

              {recentRecognitions[0] && (
                <Typography variant='caption' color='text.secondary'>
                  Último logro: {recentRecognitions[0].secondary}
                </Typography>
              )}
            </Box>
          )
        })()}

        {activeTab === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Typography variant='h6'>Cursos Obligatorios</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {stats.overdueTraining > 0 && (
                  <Chip label={`${stats.overdueTraining} vencidos`} color='error' size='small' />
                )}
                <Chip
                  label={`${mandatoryCourses.filter(course => typeof course.daysUntilDeadline === 'number' && course.daysUntilDeadline <= 7 && course.progress < 100 && !course.isOverdue).length} próximos`}
                  color='warning'
                  size='small'
                  variant='outlined'
                />
                <Chip
                  label={`${stats.mandatoryCompleted} completados`}
                  color='success'
                  size='small'
                  variant='outlined'
                />
              </Box>
            </Box>

            {mandatoryCourses.length === 0 ? (
              <Alert severity='success'>No tienes cursos obligatorios activos en este momento.</Alert>
            ) : (
              renderCourseGrid(mandatoryCourses)
            )}
          </Box>
        )}

        {activeTab === 2 && (
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              flexWrap: 'wrap',
              mb: 3
            }}
          >
            <TextField
              size='small'
              placeholder='Buscar curso...'
              value={courseSearch}
              onChange={(event) => setCourseSearch(event.target.value)}
              sx={{ minWidth: { xs: '100%', sm: 280 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon fontSize='small' />
                  </InputAdornment>
                )
              }}
            />
            <ToggleButtonGroup
              size='small'
              exclusive
              value={courseFilter}
              onChange={(_event, value) => value && setCourseFilter(value)}
              sx={{ flexWrap: 'wrap' }}
            >
              <ToggleButton value='all'>Todos</ToggleButton>
              <ToggleButton value='mandatory'>Obligatorios</ToggleButton>
              <ToggleButton value='optional'>Opcionales</ToggleButton>
              <ToggleButton value='completed'>
                Finalizados ({completedCourses.length})
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}

        {activeTab === 2 && courseFilter !== 'completed' && (() => {
          const pool =
            courseFilter === 'mandatory'
              ? mandatoryCourses
              : courseFilter === 'optional'
                ? optionalCourses
                : [...mandatoryCourses, ...optionalCourses]
          const visible = pool.filter((course: any) => course.progress < 100).filter(matchesSearch)

          if (visible.length === 0) {
            return (
              <Alert severity='info'>
                {normalizedSearch
                  ? `No hay cursos que coincidan con «${courseSearch.trim()}».`
                  : 'No tienes cursos pendientes en esta categoría. Si esperabas un curso, escribe al área de Gestión Humana para confirmar que te lo asignaron y que está publicado.'}
              </Alert>
            )
          }

          return renderCourseGrid(visible, { showKind: courseFilter === 'all' })
        })()}

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
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Button variant='contained' onClick={() => setActiveTab(2)}>
                        Ver mis cursos
                      </Button>
                    </Box>
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
                          borderRadius: 3,
                          overflow: 'hidden',
                          transition: 'transform .15s ease, box-shadow .15s ease',
                          '&:hover': { transform: 'translateY(-3px)', boxShadow: 4 }
                        }}
                      >
                        <Box
                          sx={(theme) => ({
                            height: 84,
                            px: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            bgcolor: alpha(theme.palette.warning.main, 0.14),
                            color: 'warning.main'
                          })}
                        >
                          <PremiumIcon sx={{ fontSize: 40 }} />
                          <Chip size='small' color='success' icon={<VerifiedIcon />} label='Verificado' />
                        </Box>
                        <CardContent sx={{ flex: 1 }}>
                          <Typography
                            variant='subtitle1'
                            sx={{
                              fontWeight: 600,
                              lineHeight: 1.3,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {certificate.courseTitle}
                          </Typography>
                          <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.75 }}>
                            Emitido {new Date(certificate.issuedAt || certificate.issued_at || '').toLocaleDateString('es-ES')}
                            {' · '}
                            {certificate.certificateNumber || certificate.certificate_number}
                          </Typography>
                        </CardContent>
                        <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                          <Button
                            variant='contained'
                            color='warning'
                            startIcon={<DownloadIcon />}
                            fullWidth
                            onClick={() => navigate(`/lms/certificate/${certificate.id}`)}
                          >
                            Ver certificado
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

        {activeTab === 2 && courseFilter === 'completed' && (() => {
          const visible = completedCourses.filter(matchesSearch)
          if (visible.length === 0) {
            return (
              <Card variant='outlined' sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                <CheckCircleIcon sx={{ fontSize: 56, color: 'success.main', mb: 1 }} />
                <Typography variant='h6' color='text.secondary'>
                  {normalizedSearch ? 'Ningún curso finalizado coincide con la búsqueda' : 'Aún no tienes cursos finalizados'}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Cuando completes un curso aparecerá aquí.
                </Typography>
              </Card>
            )
          }
          return renderCourseGrid(visible, { showKind: true })
        })()}
      </Box>
    </Box>
  )
}

export default LmsEmployee
// @ts-nocheck
