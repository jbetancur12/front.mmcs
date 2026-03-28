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
  Rating,
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
  People as PeopleIcon,
  Edit as EditIcon,
  Visibility as ViewIcon
} from '@mui/icons-material'
import { useQuery, useQueryClient } from 'react-query'
import { useStore } from '@nanostores/react'
import { userStore } from 'src/store/userStore'
import LmsQuizComponent from '../components/LmsQuizComponent'
import useAxiosPrivate from '@utils/use-axios-private'
import { createSafeHtmlRenderer } from 'src/utils/htmlSanitizer'

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
  rating: number
  enrolledUsers: number
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
    category: previewData.category || 'Programación',
    instructor: previewData.instructor || 'Instructor',
    duration: previewData.duration || '8 horas',
    rating: previewData.rating || 4.5,
    enrolledUsers: previewData.enrolledUsers || 0,
    audience: previewData.audience,
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
    category: 'Programación',
    instructor: 'Instructor',
    duration: `${Math.ceil((progressData.progress?.totalTimeSpent || 0) / 60)} horas`,
    rating: 4.5,
    enrolledUsers: 0,
    audience: 'employee',
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

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const storeUser = useStore(userStore)
  const queryClient = useQueryClient()

  const axiosPrivate = useAxiosPrivate()


  // Mock data para el curso
  const mockCourse: Course = {
    id: 1,
    title: 'JavaScript Avanzado',
    description:
      'Aprende conceptos avanzados de JavaScript para desarrollo web moderno',
    instructor: 'Dr. Carlos Méndez',
    duration: '8 horas',
    rating: 4.8,
    enrolledUsers: 245,
    category: 'Programación',
    audience: 'employee',
    thumbnail: '/placeholder.svg?height=400&width=600',
    status: 'published',
    units: [
      {
        id: 1,
        title: 'Introducción a JavaScript',
        type: 'video',
        duration: '45 min',
        order: 1,
        completed: true,
        unlocked: true,
        content: {
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          transcript:
            'En esta unidad exploraremos los fundamentos básicos de JavaScript...',
          description:
            'Introducción a los conceptos fundamentales de JavaScript'
        }
      },
      {
        id: 2,
        title: 'Variables y Tipos de Datos',
        type: 'text',
        duration: '30 min',
        order: 2,
        completed: true,
        unlocked: true,
        content: {
          text: `# Variables y Tipos de Datos

## Declaración de Variables
En JavaScript, puedes declarar variables usando var, let o const...

## Tipos de Datos Primitivos
- **String**: Para texto
- **Number**: Para números
- **Boolean**: Para valores true/false
- **Undefined**: Variable sin valor asignado
- **Null**: Valor nulo intencional

## Ejemplos Prácticos
\`\`\`javascript
let nombre = "Juan";
const edad = 25;
let esEstudiante = true;
\`\`\``,
          description: 'Aprende sobre variables y tipos de datos en JavaScript'
        }
      },
      {
        id: 3,
        title: 'Quiz: Fundamentos de JavaScript',
        type: 'quiz',
        duration: '15 min',
        order: 3,
        completed: false,
        unlocked: true,
        content: {
          questions: [
            {
              id: 1,
              question:
                '¿Cuál es la forma correcta de declarar una variable en JavaScript?',
              type: 'single-choice',
              options: [
                'var nombre = "Juan"',
                'let nombre = "Juan"',
                'const nombre = "Juan"',
                'Todas las anteriores'
              ],
              correctAnswer: 3,
              explanation: 'Todas las formas son válidas en JavaScript moderno',
              points: 2
            }
          ],
          description:
            'Evalúa tu conocimiento sobre los fundamentos de JavaScript'
        }
      },
      {
        id: 4,
        title: 'Comunicación Efectiva',
        type: 'video',
        duration: '50 min',
        order: 4,
        completed: false,
        unlocked: false,
        content: {
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          transcript: 'La comunicación es fundamental para el desarrollo...',
          description: 'Aprende sobre comunicación efectiva en desarrollo'
        }
      },
      {
        id: 5,
        title: 'Técnicas Avanzadas',
        type: 'text',
        duration: '35 min',
        order: 5,
        completed: false,
        unlocked: false,
        content: {
          text: '# Técnicas Avanzadas\n\nLas técnicas avanzadas son clave para el desarrollo...',
          description: 'Explora técnicas avanzadas de JavaScript'
        }
      }
    ]
  }

  // Query para obtener el curso con progreso real
const { data: courseData, isLoading, error } = useQuery(
  ['lms-course-preview', courseId, previewMode],
  async () => {
    if (previewMode === 'admin') {
      // En modo admin, obtener estructura completa del curso (preview)
      const response = await axiosPrivate.get(`/lms/courses/preview/${courseId}`);
      const previewData = response.data.data;

      console.log('📊 Preview data (admin):', previewData);

      const transformedCourse = transformPreviewDataToCourse(previewData);
      console.log('✅ Transformed preview course:', transformedCourse);

      return { course: transformedCourse, isPreview: true };
    } else {
      // Para modo estudiante, obtener progreso real
      const response = await axiosPrivate.get(`/lms/progress/courses/${courseId}`);
      const progressData = response.data.data;

      console.log('📊 Progress data (student):', progressData);

      const transformedCourse = transformProgressDataToCourse(progressData);
      console.log('✅ Transformed progress course:', transformedCourse);

      return { course: transformedCourse, isPreview: false };
    }
  },
  {
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    onError: (err: any) => {
      console.error('❌ Error fetching course:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error al cargar el curso',
        text: err.response?.data?.error?.message || 'No se pudo cargar el curso'
      });
    }
  }
)

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

  const course = courseData?.course || mockCourse;
  const isPreview = courseData?.isPreview || false;
  
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
      await axiosPrivate.post(`/lms/progress/lessons/${unitId}/complete`, {
        timeSpentMinutes: 30 // Tiempo estimado por defecto
      });

      // Refrescar datos para actualizar el progreso y desbloqueos
      await queryClient.invalidateQueries(['lms-course-preview', courseId]);

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
            <IconButton onClick={() => navigate('/lms/admin/dashboard')}>
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
                  <PeopleIcon fontSize='small' />
                  <Typography variant='body2'>
                    {course.enrolledUsers} estudiantes
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon fontSize='small' />
                  <Typography variant='body2'>{course.duration}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Rating value={course.rating} readOnly size='small' />
                  <Typography variant='body2'>({course.rating})</Typography>
                </Box>
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

                          const quizResult = await axiosPrivate.post(
                            `/lms/quizzes/${currentUnitData.content.quizId}/attempt`,
                            {
                              answers: formattedAnswers,
                              timeSpent: 15 * 60
                            }
                          )

                          const passed = quizResult.data?.data?.results?.passed
                          const backendPercentage = quizResult.data?.data?.results?.percentage ?? percentage

                          if (passed) {
                            await axiosPrivate.post(`/lms/progress/lessons/${currentUnitData.id}/complete`, {
                              timeSpentMinutes: 15
                            })
                          }

                          await queryClient.invalidateQueries(['lms-course-preview', courseId])

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
