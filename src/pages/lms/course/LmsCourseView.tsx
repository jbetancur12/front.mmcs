import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  Avatar,
  Divider,
  Alert,
  IconButton
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  SkipNext as SkipNextIcon,
  SkipPrevious as SkipPreviousIcon,
  CheckCircle as CheckIcon,
  Lock as LockIcon,
  MenuBook as BookIcon,
  VideoLibrary as VideoIcon,
  Quiz as QuizIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  Star as StarIcon
} from '@mui/icons-material'
import { useQuery } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import { useStore } from '@nanostores/react'
import { userStore } from 'src/store/userStore'
import LmsQuizComponent from '../components/LmsQuizComponent'

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
}

const LmsCourseView: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [currentUnit, setCurrentUnit] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showCertificate, setShowCertificate] = useState(false)

  const axiosPrivate = useAxiosPrivate()
  const storeUser = useStore(userStore)

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

  // Query para obtener el curso
  const { data: course = mockCourse, isLoading } = useQuery<Course>(
    ['lms-course', courseId],
    async () => {
      // En el futuro, esto hará una llamada real a la API
      // const response = await axiosPrivate.get(`/lms/courses/${courseId}`)
      // return response.data
      return mockCourse
    }
  )

  useEffect(() => {
    // Verificar autenticación
    if (!storeUser.email) {
      navigate('/login')
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
        <Typography>Cargando curso...</Typography>
      </Box>
    )
  }

  const completedUnits = course.units.filter((unit) => unit.completed).length
  const progressPercentage = (completedUnits / course.units.length) * 100
  const currentUnitData = course.units[currentUnit]

  const handleUnitComplete = (unitId: number) => {
    // Aquí se actualizaría el progreso en la API
    console.log('Unidad completada:', unitId)

    // Marcar la unidad como completada
    const updatedUnits = course.units.map((unit) =>
      unit.id === unitId ? { ...unit, completed: true } : unit
    )

    // Desbloquear la siguiente unidad si existe
    const currentUnitIndex = course.units.findIndex(
      (unit) => unit.id === unitId
    )
    if (currentUnitIndex < course.units.length - 1) {
      updatedUnits[currentUnitIndex + 1].unlocked = true
    }

    // En una implementación real, esto se guardaría en la API
    console.log('Progreso actualizado:', updatedUnits)
  }

  const handleQuizComplete = (
    unitId: number,
    score: number,
    totalPoints: number
  ) => {
    console.log('Quiz completado:', { unitId, score, totalPoints })
    handleUnitComplete(unitId)
  }

  const handleNextUnit = () => {
    if (currentUnit < course.units.length - 1) {
      const nextUnit = course.units[currentUnit + 1]
      if (nextUnit.unlocked) {
        setCurrentUnit(currentUnit + 1)
      } else {
        console.log(
          'La siguiente unidad está bloqueada. Completa la unidad actual primero.'
        )
      }
    }
  }

  const handlePreviousUnit = () => {
    if (currentUnit > 0) {
      setCurrentUnit(currentUnit - 1)
    }
  }

  const canNavigateToUnit = (unitIndex: number) => {
    return course.units[unitIndex].unlocked
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
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant='h4' component='h1'>
            {course.title}
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            {course.description}
          </Typography>
        </Box>
      </Box>

      {/* Información del curso */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={12} md={8}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}
              >
                <Chip label={course.category} color='primary' />
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
                {progressPercentage === 100 && (
                  <Button
                    variant='contained'
                    color='success'
                    startIcon={<CheckIcon />}
                    onClick={() => setShowCertificate(true)}
                  >
                    Obtener Certificado
                  </Button>
                )}
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
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        component='div'
                        sx={{
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'monospace',
                          backgroundColor: 'grey.50',
                          p: 2,
                          borderRadius: 1
                        }}
                      >
                        {currentUnitData.content.text}
                      </Typography>
                    </Box>
                  )}

                {currentUnitData.type === 'quiz' &&
                  currentUnitData.content.questions && (
                    <LmsQuizComponent
                      questions={currentUnitData.content.questions}
                      onComplete={(score, totalPoints) =>
                        handleQuizComplete(
                          currentUnitData.id,
                          score,
                          totalPoints
                        )
                      }
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
                        Marcar como Completado
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
                    onClick={() => unit.unlocked && setCurrentUnit(index)}
                    sx={{
                      border: '1px solid',
                      borderColor:
                        currentUnit === index
                          ? 'primary.main'
                          : unit.unlocked
                            ? 'divider'
                            : 'grey.300',
                      borderRadius: 1,
                      mb: 1,
                      opacity: unit.unlocked ? 1 : 0.6,
                      cursor: unit.unlocked ? 'pointer' : 'not-allowed',
                      position: 'relative'
                    }}
                  >
                    <ListItemIcon>
                      {unit.unlocked ? getUnitIcon(unit.type) : <LockIcon />}
                    </ListItemIcon>
                    <ListItemText
                      primary={unit.title}
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
                          {!unit.unlocked && (
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              (Bloqueado)
                            </Typography>
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

export default LmsCourseView
