import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import Swal from 'sweetalert2'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  IconButton,
  Paper
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  SkipNext as SkipNextIcon,
  SkipPrevious as SkipPreviousIcon,
  CheckCircle as CheckIcon,
  Lock as LockIcon,
  MenuBook as BookIcon,
  VideoLibrary as VideoIcon,
  Quiz as QuizIcon,
  Schedule as ScheduleIcon,
  Edit as EditIcon,
  Visibility as ViewIcon
} from '@mui/icons-material'
import { useQueryClient } from 'react-query'
import { useStore } from '@nanostores/react'
import { userStore } from 'src/store/userStore'
import LmsQuizComponent from '../components/LmsQuizComponent'
import {
  useCompleteLesson,
  useCoursePreview,
  useCourseProgress,
  useSubmitQuiz
} from 'src/hooks/useLms'
import { queryKeys } from 'src/config/queryClient'
import { createSafeHtmlRenderer } from 'src/utils/htmlSanitizer'
import {
  getCourseAudienceLabel,
  normalizeCourseAudience
} from 'src/utils/lmsAudience'

interface CourseUnit {
  id: number
  title: string
  type: 'video' | 'text' | 'quiz'
  duration: string
  order: number
  completed: boolean
  unlocked: boolean
  content: {
    videoUrl?: string
    transcript?: string
    text?: string
    quizId?: number
    maxAttempts?: number
    currentAttempt?: number
    questions?: any[]
    description?: string
  }
}

interface Course {
  id: number
  title: string
  description: string
  category: string
  instructor: string
  duration: string
  audience: string
  thumbnail: string
  units: CourseUnit[]
  status: 'draft' | 'published' | 'archived'
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Mapea tipos de quiz del backend al formato del frontend
 */
const mapQuizType = (backendType: string): 'single-choice' | 'multiple-choice' | 'true-false' => {
  switch (backendType) {
    case 'single':
      return 'single-choice'
    case 'multiple':
      return 'multiple-choice'
    case 'boolean':
      return 'true-false'
    default:
      return 'single-choice'
  }
}

/**
 * Convierte URL de YouTube a formato embebible
 */
const convertToEmbedUrl = (url: string): string => {
  if (!url || url.includes('/embed/')) return url

  // Detectar formato watch?v=
  const watchMatch = url.match(/[?&]v=([^&]+)/)
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`
  }

  // Detectar formato youtu.be/
  const shortMatch = url.match(/youtu\.be\/([^?]+)/)
  if (shortMatch) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`
  }

  return url
}

/**
 * Transforma datos de preview (modo admin) al formato Course
 */
const transformPreviewDataToCourse = (previewData: any): Course => {
  const units = previewData.modules.flatMap((module: any, moduleIndex: number) =>
    module.lessons.map((lesson: any, lessonIndex: number) => {
      // Transformar quiz questions si existen
      let questions: any[] = []
      if (lesson.quiz && lesson.quiz.questions && Array.isArray(lesson.quiz.questions)) {
        questions = lesson.quiz.questions.map((q: any) => ({
          id: q.id,
          question: q.question,
          type: mapQuizType(q.type),
          options: q.options || [],
          correctAnswer: q.type === 'multiple' ? q.correct_answers : q.correct_answers[0],
          explanation: q.explanation,
          points: q.points
        }))
      }

      return {
        id: lesson.id,
        title: lesson.title,
        type: lesson.type === 'video' ? 'video' : lesson.type === 'quiz' ? 'quiz' : 'text',
        duration: `${lesson.estimated_minutes || 30} min`,
        order: moduleIndex * 100 + lessonIndex + 1,
        completed: false, // Nada completado en preview admin
        unlocked: true, // Todo desbloqueado en preview admin
        content: {
          videoUrl: convertToEmbedUrl(lesson.video_url),
          text: lesson.content,
          quizId: lesson.quiz?.id,
          maxAttempts: lesson.quiz?.max_attempts,
          currentAttempt: lesson.quiz?.current_attempt,
          description: lesson.description,
          questions: questions
        }
      }
    })
  )

  return {
    id: previewData.id,
    title: previewData.title,
    description: previewData.description,
    category: getCourseAudienceLabel(previewData.audience),
    instructor: previewData.instructor || 'Instructor',
    duration: previewData.duration || '8 horas',
    audience: normalizeCourseAudience(previewData.audience),
    thumbnail: previewData.thumbnail || '/placeholder.svg?height=400&width=600',
    status: previewData.status,
    units
  }
}

/**
 * Transforma datos de progreso (modo estudiante) al formato Course
 */
const transformProgressDataToCourse = (progressData: any): Course => {
  const units = progressData.modules.flatMap((module: any, moduleIndex: number) =>
    module.lessons.map((lesson: any, lessonIndex: number) => {
      const isCompleted = lesson.progress?.status === 'completed'
      const hasProgress = lesson.progress !== null && lesson.progress !== undefined

      // Primera lección siempre desbloqueada, o si tiene progreso
      const isUnlocked = lessonIndex === 0 || hasProgress

      // Transformar quiz questions si existen
      let questions: any[] = []
      if (lesson.quiz && lesson.quiz.questions && Array.isArray(lesson.quiz.questions)) {
        questions = lesson.quiz.questions.map((q: any) => ({
          id: q.id,
          question: q.question,
          type: mapQuizType(q.type),
          options: q.options || [],
          correctAnswer: q.type === 'multiple' ? q.correct_answers : q.correct_answers[0],
          explanation: q.explanation,
          points: q.points
        }))
      }

      return {
        id: lesson.id,
        title: lesson.title,
        type: lesson.type === 'video' ? 'video' : lesson.type === 'quiz' ? 'quiz' : 'text',
        duration: `${lesson.estimated_minutes || 30} min`,
        order: moduleIndex * 100 + lessonIndex + 1,
        completed: isCompleted,
        unlocked: isUnlocked,
        content: {
          videoUrl: convertToEmbedUrl(lesson.video_url),
          text: lesson.content,
          quizId: lesson.quiz?.id,
          maxAttempts: lesson.quiz?.max_attempts,
          currentAttempt: lesson.quiz?.current_attempt,
          description: lesson.description,
          questions: questions
        }
      }
    })
  )

  return {
    id: progressData.course?.id || progressData.id,
    title: progressData.course?.title || progressData.title,
    description: progressData.course?.description || progressData.description,
    category: getCourseAudienceLabel(progressData.course?.audience),
    instructor: 'Instructor',
    duration: `${Math.ceil((progressData.progress?.totalTimeSpent || 0) / 60)} horas`,
    audience: normalizeCourseAudience(progressData.course?.audience),
    thumbnail: '/placeholder.svg?height=400&width=600',
    status: 'published',
    units
  }
}

const LmsCoursePreview: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [currentUnit, setCurrentUnit] = useState(0)

  const [previewMode, setPreviewMode] = useState<'student' | 'admin'>('student')

  const storeUser = useStore(userStore)
  const queryClient = useQueryClient()
  const parsedCourseId = parseInt(courseId || '0')
  const previewQuery = useCoursePreview(parsedCourseId, {
    enabled: !!courseId && previewMode === 'admin',
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false
  })
  const studentProgressQuery = useCourseProgress(parsedCourseId, undefined, {
    enabled: !!courseId && previewMode === 'student',
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false
  })
  const completeLessonMutation = useCompleteLesson()
  const submitQuizMutation = useSubmitQuiz()

  const isLoading = previewMode === 'admin'
    ? previewQuery.isLoading
    : studentProgressQuery.isLoading

  const courseData = previewMode === 'admin'
    ? (previewQuery.data
      ? { course: transformPreviewDataToCourse(previewQuery.data), isPreview: true }
      : null)
    : (studentProgressQuery.data
      ? { course: transformProgressDataToCourse(studentProgressQuery.data), isPreview: false }
      : null)

  useEffect(() => {
    // Verificar que el usuario está autenticado
    if (!storeUser.email) {
      navigate('/login')
      return
    }

    // Verificar que el usuario es admin
    if (!storeUser.rol.includes('admin')) {
      navigate('/lms')
      return
    }
  }, [navigate, storeUser])

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
        <Typography>Cargando vista previa...</Typography>
      </Box>
    )
  }

  const course = courseData?.course;
  const isPreview = courseData?.isPreview || false;

  if (!course) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='error' sx={{ mb: 2 }}>
          No se pudo cargar la vista previa real del curso.
        </Alert>
        <Button variant='outlined' onClick={() => navigate(-1)}>
          Volver
        </Button>
      </Box>
    )
  }
  
  const completedUnits = course.units.filter((unit) => unit.completed).length
  const progressPercentage = (completedUnits / course.units.length) * 100
  const currentUnitData = course.units[currentUnit]

  const handleUnitComplete = async (unitId: number) => {
    if (isPreview || previewMode === 'admin') {
      // En modo preview admin, solo simular
      console.log('✅ Unidad completada (preview):', unitId);
      Swal.fire({
        icon: 'info',
        title: 'Modo Preview',
        text: 'En modo administrador el progreso no se guarda',
        timer: 2000,
        showConfirmButton: false
      });
      return;
    }

    try {
      // Mostrar loading
      Swal.fire({
        title: 'Guardando progreso...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Marcar lección como completada en el backend
      await completeLessonMutation.mutateAsync({
        lessonId: unitId,
        timeSpent: 30
      })

      // Refrescar datos para actualizar el progreso y desbloqueos
      await queryClient.invalidateQueries(queryKeys.progress.course(parsedCourseId, undefined))
      await queryClient.invalidateQueries(queryKeys.certificates.user(undefined))

      console.log('✅ Lección completada exitosamente');

      // Mostrar éxito
      Swal.fire({
        icon: 'success',
        title: '¡Lección completada!',
        text: 'Tu progreso ha sido guardado. La siguiente lección está desbloqueada.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error: any) {
      console.error('❌ Error al completar lección:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error al guardar progreso',
        text: error.response?.data?.error?.message || 'No se pudo marcar la lección como completada',
        confirmButtonText: 'OK'
      });
    }
  }

  const handleNextUnit = () => {
    if (currentUnit < course.units.length - 1) {
      const nextUnit = course.units[currentUnit + 1]

      // Validar que nextUnit existe
      if (!nextUnit) {
        console.error('❌ La siguiente unidad no existe');
        return;
      }

      if (nextUnit.unlocked || isPreview || previewMode === 'admin') {
        setCurrentUnit(currentUnit + 1)
      } else {
        console.log('⚠️ La siguiente unidad está bloqueada. Completa la unidad actual primero.');
        Swal.fire({
          icon: 'warning',
          title: 'Lección bloqueada',
          text: 'Completa la lección actual antes de continuar',
          confirmButtonText: 'Entendido'
        });
      }
    }
  }

  const handlePreviousUnit = () => {
    if (currentUnit > 0) {
      setCurrentUnit(currentUnit - 1)
    }
  }

  const canNavigateToUnit = (unitIndex: number) => {
    // Validar que el índice esté dentro del rango
    if (unitIndex < 0 || unitIndex >= course.units.length) {
      return false;
    }

    // En modo preview admin, permitir navegación libre
    if (isPreview || previewMode === 'admin') {
      return true;
    }

    // Verificar que la unidad existe y está desbloqueada
    const unit = course.units[unitIndex];
    return unit && unit.unlocked;
  }

  const getUnitIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <VideoIcon />
      case 'text':
        return <BookIcon />
      case 'quiz':
        return <QuizIcon />
      default:
        return <BookIcon />
    }
  }

  const getUnitTypeLabel = (type: string) => {
    switch (type) {
      case 'video':
        return 'Video'
      case 'text':
        return 'Texto'
      case 'quiz':
        return 'Quiz'
      default:
        return 'Texto'
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header con modo preview */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: 'warning.light' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/lms/admin/courses')}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography
                variant='h6'
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <ViewIcon />
                Vista Previa del Curso
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Modo:{' '}
                {previewMode === 'student' ? 'Estudiante' : 'Administrador'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={previewMode === 'student' ? 'contained' : 'outlined'}
              size='small'
              onClick={() => setPreviewMode('student')}
            >
              Modo Estudiante
            </Button>
            <Button
              variant={previewMode === 'admin' ? 'contained' : 'outlined'}
              size='small'
              onClick={() => setPreviewMode('admin')}
            >
              Modo Admin
            </Button>
            <Button
              variant='outlined'
              size='small'
              startIcon={<EditIcon />}
              onClick={() => navigate(`/lms/admin/courses/${courseId}/content`)}
            >
              Editar Contenido
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Información del curso */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={12} md={8}>
              <Typography variant='h4' gutterBottom>
                {course.title}
              </Typography>
              <Typography variant='body1' color='text.secondary' sx={{ mb: 2 }}>
                {course.description}
              </Typography>

              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}
              >
                <Chip label={course.category} color='primary' />
                <Chip
                  label={course.status}
                  color={course.status === 'published' ? 'success' : 'warning'}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon fontSize='small' />
                  <Typography variant='body2'>{course.duration}</Typography>
                </Box>
                <Chip label={`Instructor: ${course.instructor}`} variant='outlined' />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1
                  }}
                >
                  <Typography variant='body2'>Progreso del curso</Typography>
                  <Typography variant='body2'>
                    {completedUnits} de {course.units.length} unidades
                  </Typography>
                </Box>
                <LinearProgress
                  variant='determinate'
                  value={progressPercentage}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant='h6' gutterBottom>
                  {Math.round(progressPercentage)}% Completado
                </Typography>
                <Alert severity={isPreview ? 'info' : 'success'} sx={{ mb: 2 }}>
                  {isPreview 
                    ? 'Modo de vista previa - Los cambios no se guardan'
                    : 'Progreso real del estudiante'
                  }
                </Alert>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Contenido principal */}
        <Grid item xs={12} md={8}>
          {currentUnitData && (
            <Card>
              <CardHeader
                title={currentUnitData.title}
                subheader={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      icon={getUnitIcon(currentUnitData.type)}
                      label={getUnitTypeLabel(currentUnitData.type)}
                      size='small'
                    />
                    <Typography variant='body2'>
                      {currentUnitData.duration}
                    </Typography>
                    {currentUnitData.completed && (
                      <Chip
                        icon={<CheckIcon />}
                        label='Completado'
                        color='success'
                        size='small'
                      />
                    )}
                    {(previewMode === 'admin' || isPreview) && (
                      <Chip label='Vista Admin' color='warning' size='small' />
                    )}
                  </Box>
                }
                action={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      onClick={handlePreviousUnit}
                      disabled={currentUnit === 0}
                    >
                      <SkipPreviousIcon />
                    </IconButton>
                    <IconButton
                      onClick={handleNextUnit}
                      disabled={
                        currentUnit === course.units.length - 1 ||
                        !canNavigateToUnit(currentUnit + 1)
                      }
                      title={
                        !canNavigateToUnit(currentUnit + 1)
                          ? 'Completa la unidad actual primero'
                          : ''
                      }
                    >
                      <SkipNextIcon />
                    </IconButton>
                  </Box>
                }
              />
              <CardContent>
                {currentUnitData.type === 'video' &&
                  currentUnitData.content.videoUrl && (
                    <Box sx={{ mb: 3 }}>
                      <Box
                        component='iframe'
                        src={currentUnitData.content.videoUrl}
                        sx={{
                          width: '100%',
                          height: 400,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1
                        }}
                      />
                      {currentUnitData.content.transcript && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant='h6' gutterBottom>
                            Transcripción
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {currentUnitData.content.transcript}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                {currentUnitData.type === 'text' &&
                  currentUnitData.content.text && (
                    <Box
                      sx={{
                        mb: 3,
                        p: 3,
                        backgroundColor: 'grey.50',
                        borderRadius: 1,
                        '& h1': { fontSize: '2rem', fontWeight: 'bold', mt: 2, mb: 1 },
                        '& h2': { fontSize: '1.5rem', fontWeight: 'bold', mt: 2, mb: 1 },
                        '& h3': { fontSize: '1.25rem', fontWeight: 'bold', mt: 2, mb: 1 },
                        '& p': { mb: 1, lineHeight: 1.7 },
                        '& ul, & ol': { pl: 3, mb: 2 },
                        '& li': { mb: 0.5 },
                        '& code': {
                          backgroundColor: 'grey.200',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          fontSize: '0.9em'
                        },
                        '& pre': {
                          backgroundColor: 'grey.800',
                          color: 'white',
                          p: 2,
                          borderRadius: 1,
                          overflowX: 'auto',
                          mb: 2
                        },
                        '& pre code': {
                          backgroundColor: 'transparent',
                          color: 'white',
                          padding: 0
                        },
                        '& blockquote': {
                          borderLeft: '4px solid',
                          borderColor: 'primary.main',
                          pl: 2,
                          ml: 0,
                          fontStyle: 'italic'
                        }
                      }}
                    >
                      {/<[a-z][\s\S]*>/i.test(currentUnitData.content.text) ? (
                        <Box
                          dangerouslySetInnerHTML={createSafeHtmlRenderer(
                            currentUnitData.content.text,
                            'richText'
                          )}
                        />
                      ) : (
                        <ReactMarkdown>{currentUnitData.content.text}</ReactMarkdown>
                      )}
                    </Box>
                  )}

                {currentUnitData.type === 'quiz' &&
                  currentUnitData.content.questions && (
                    <LmsQuizComponent
                      questions={currentUnitData.content.questions}
                      isPreview={isPreview || previewMode === 'admin'}
                      maxAttempts={currentUnitData.content.maxAttempts || 3}
                      currentAttempt={currentUnitData.content.currentAttempt || 1}
                      onComplete={async (score, totalPoints, answers) => {
                        const percentage = Math.round((score / totalPoints) * 100);

                        if (isPreview || previewMode === 'admin') {
                          console.log('✅ Quiz completado en preview:', { score, totalPoints, percentage });
                          Swal.fire({
                            icon: 'info',
                            title: 'Quiz Completado (Preview)',
                            html: `<p>Puntuación: <strong>${score}/${totalPoints}</strong> (${percentage}%)</p>
                                   <p><em>Modo administrador - El progreso no se guarda</em></p>`,
                            confirmButtonText: 'OK'
                          });
                          return;
                        }

                        // Completar quiz real
                        try {
                          if (!currentUnitData.content.quizId) {
                            throw new Error('No se encontró la configuración del quiz para esta lección')
                          }

                          Swal.fire({
                            title: 'Guardando resultados del quiz...',
                            allowOutsideClick: false,
                            didOpen: () => {
                              Swal.showLoading();
                            }
                          });

                          const formattedAnswers = (currentUnitData.content.questions ?? []).reduce(
                            (acc: Record<number, number[]>, question: any, index: number) => {
                              const answer = answers[index]

                              if (answer !== undefined) {
                                acc[question.id] = Array.isArray(answer) ? answer : [answer]
                              }

                              return acc
                            },
                            {}
                          )

                          const quizResult = await submitQuizMutation.mutateAsync({
                            quizId: currentUnitData.content.quizId,
                            data: {
                              answers: formattedAnswers,
                              timeSpent: 15 * 60
                            }
                          })

                          const passed = quizResult.results.passed
                          const backendPercentage = quizResult.results.percentage ?? percentage

                          if (passed) {
                            await completeLessonMutation.mutateAsync({
                              lessonId: currentUnitData.id,
                              timeSpent: 15
                            })
                          }

                          await queryClient.invalidateQueries(queryKeys.progress.course(parsedCourseId, undefined))
                          await queryClient.invalidateQueries(queryKeys.certificates.user(undefined))

                          console.log('✅ Quiz completado exitosamente', {
                            passed,
                            percentage: backendPercentage
                          });

                          Swal.fire({
                            icon: passed ? 'success' : 'warning',
                            title: passed ? '¡Quiz Aprobado!' : 'Quiz Completado',
                            html: `<p>Puntuación: <strong>${score}/${totalPoints}</strong> (${backendPercentage}%)</p>
                                   <p>${passed ? 'La siguiente lección está desbloqueada' : 'Necesitas 70% o más para aprobar'}</p>`,
                            confirmButtonText: 'OK'
                          });
                        } catch (error: any) {
                          console.error('❌ Error al completar quiz:', error);

                          Swal.fire({
                            icon: 'error',
                            title: 'Error al guardar resultados',
                            text: error.response?.data?.error?.message || 'No se pudo guardar el quiz',
                            confirmButtonText: 'OK'
                          });
                        }
                      }}
                    />
                  )}

                {!currentUnitData.completed &&
                  currentUnitData.type !== 'quiz' && (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        mt: 2
                      }}
                    >
                      <Button
                        variant='contained'
                        onClick={() => handleUnitComplete(currentUnitData.id)}
                      >
                        {isPreview || previewMode === 'admin' 
                          ? 'Marcar como Completado (Preview)'
                          : 'Marcar como Completado'
                        }
                      </Button>
                    </Box>
                  )}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Sidebar con índice del curso */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              title='Contenido del Curso'
              subheader={`${completedUnits} de ${course.units.length} unidades completadas`}
            />
            <CardContent>
              <List>
                {course.units.map((unit, index) => (
                  <ListItem
                    key={unit.id}
                    button
                    selected={currentUnit === index}
                    onClick={() => {
                      if (canNavigateToUnit(index)) {
                        setCurrentUnit(index);
                      } else if (!isPreview && previewMode !== 'admin') {
                        // Solo mostrar alerta en modo estudiante
                        Swal.fire({
                          icon: 'warning',
                          title: 'Lección bloqueada',
                          text: 'Completa las lecciones anteriores para desbloquear esta lección',
                          confirmButtonText: 'Entendido'
                        });
                      }
                    }}
                    sx={{
                      border: '1px solid',
                      borderColor:
                        currentUnit === index
                          ? 'primary.main'
                          : canNavigateToUnit(index)
                            ? 'divider'
                            : 'grey.300',
                      borderRadius: 1,
                      mb: 1,
                      opacity: canNavigateToUnit(index) ? 1 : 0.6,
                      cursor: canNavigateToUnit(index) ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <ListItemIcon>
                      {canNavigateToUnit(index) ? getUnitIcon(unit.type) : <LockIcon />}
                    </ListItemIcon>
                    <ListItemText
                      disableTypography
                      primary={
                        <Typography variant='body1'>{unit.title}</Typography>
                      }
                      secondary={
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <Chip
                            label={getUnitTypeLabel(unit.type)}
                            size='small'
                            variant='outlined'
                          />
                          <Typography variant='caption'>
                            {unit.duration}
                          </Typography>
                          {unit.completed && (
                            <CheckIcon fontSize='small' color='success' />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default LmsCoursePreview
