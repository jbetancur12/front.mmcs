import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Rating,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery,
  Fab,
  Collapse,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Tooltip
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
  People as PeopleIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  AccessTime as AccessTimeIcon,
  Assignment as AssignmentIcon,
  EmojiEvents as CertificateIcon
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useStore } from '@nanostores/react'
import { userStore } from 'src/store/userStore'
import LmsProgressBar from '../shared/LmsProgressBar'
import LmsVideoPlayer from '../shared/LmsVideoPlayer'
import LmsQuizPlayer from '../shared/LmsQuizPlayer'

interface CourseLesson {
  id: number
  title: string
  type: 'video' | 'text' | 'quiz'
  duration: string
  order: number
  completed: boolean
  unlocked: boolean
  estimatedMinutes: number
  content: {
    videoUrl?: string
    videoSource?: 'minio' | 'youtube'
    transcript?: string
    text?: string
    quiz?: any
    description?: string
  }
}

interface CourseModule {
  id: number
  title: string
  description: string
  order: number
  lessons: CourseLesson[]
  completed: boolean
  unlocked: boolean
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
  hasCertificate: boolean
  isMandatory: boolean
  modules: CourseModule[]
}

interface UserProgress {
  courseId: number
  lessonId: number
  status: 'not_started' | 'in_progress' | 'completed'
  timeSpent: number
  completedAt?: Date
}



const LmsCourseView: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const queryClient = useQueryClient()
  
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0)
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([0]))
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [showSnackbar, setShowSnackbar] = useState(false)
  const [lessonStartTime, setLessonStartTime] = useState<Date | null>(null)

  const storeUser = useStore(userStore)

  // Mock data para el curso con estructura modular
  const mockCourse: Course = {
    id: 1,
    title: 'JavaScript Avanzado para Desarrollo Web',
    description: 'Aprende conceptos avanzados de JavaScript para desarrollo web moderno, incluyendo ES6+, programación asíncrona y mejores prácticas.',
    instructor: 'Dr. Carlos Méndez',
    duration: '12 horas',
    rating: 4.8,
    enrolledUsers: 245,
    category: 'Programación',
    audience: 'employee',
    thumbnail: '/placeholder.svg?height=400&width=600',
    hasCertificate: true,
    isMandatory: false,
    modules: [
      {
        id: 1,
        title: 'Fundamentos de JavaScript',
        description: 'Conceptos básicos y fundamentos del lenguaje',
        order: 1,
        completed: false,
        unlocked: true,
        lessons: [
          {
            id: 1,
            title: 'Introducción a JavaScript',
            type: 'video',
            duration: '45 min',
            estimatedMinutes: 45,
            order: 1,
            completed: true,
            unlocked: true,
            content: {
              videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              videoSource: 'youtube',
              transcript: 'En esta lección exploraremos los fundamentos básicos de JavaScript, su historia y evolución...',
              description: 'Introducción a los conceptos fundamentales de JavaScript'
            }
          },
          {
            id: 2,
            title: 'Variables y Tipos de Datos',
            type: 'text',
            duration: '30 min',
            estimatedMinutes: 30,
            order: 2,
            completed: true,
            unlocked: true,
            content: {
              text: `# Variables y Tipos de Datos

## Declaración de Variables
En JavaScript, puedes declarar variables usando \`var\`, \`let\` o \`const\`:

### var
- Tiene scope de función
- Puede ser redeclarada
- Se eleva (hoisting)

### let
- Tiene scope de bloque
- No puede ser redeclarada en el mismo scope
- Se eleva pero no se inicializa

### const
- Tiene scope de bloque
- Debe ser inicializada al declararse
- No puede ser reasignada

## Tipos de Datos Primitivos
- **String**: Para texto
- **Number**: Para números enteros y decimales
- **Boolean**: Para valores true/false
- **Undefined**: Variable sin valor asignado
- **Null**: Valor nulo intencional
- **Symbol**: Identificador único
- **BigInt**: Para números enteros grandes

## Ejemplos Prácticos
\`\`\`javascript
// Declaración de variables
let nombre = "Juan";
const edad = 25;
var esEstudiante = true;

// Tipos de datos
let texto = "Hola mundo";
let numero = 42;
let booleano = true;
let indefinido;
let nulo = null;
\`\`\`

## Verificación de Tipos
Usa \`typeof\` para verificar el tipo de una variable:

\`\`\`javascript
console.log(typeof "Hola"); // "string"
console.log(typeof 42); // "number"
console.log(typeof true); // "boolean"
\`\`\``,
              description: 'Aprende sobre variables y tipos de datos en JavaScript'
            }
          },
          {
            id: 3,
            title: 'Quiz: Fundamentos Básicos',
            type: 'quiz',
            duration: '15 min',
            estimatedMinutes: 15,
            order: 3,
            completed: false,
            unlocked: true,
            content: {
              quiz: {
                id: 1,
                title: 'Quiz: Fundamentos de JavaScript',
                instructions: 'Responde las siguientes preguntas sobre los fundamentos de JavaScript.',
                passingPercentage: 70,
                maxAttempts: 3,
                cooldownMinutes: 5,
                showCorrectAnswers: true,
                randomizeQuestions: false,
                shuffleAnswers: true,
                timeLimitMinutes: 15,
                allowReview: true,
                showProgressBar: true,
                questions: [
                  {
                    id: 1,
                    question: '¿Cuál es la forma correcta de declarar una variable constante en JavaScript?',
                    type: 'single-choice',
                    options: [
                      'var nombre = "Juan"',
                      'let nombre = "Juan"',
                      'const nombre = "Juan"',
                      'constant nombre = "Juan"'
                    ],
                    correctAnswer: 2,
                    explanation: 'const es la palabra clave correcta para declarar constantes en JavaScript.',
                    points: 2
                  },
                  {
                    id: 2,
                    question: '¿Qué tipos de datos primitivos existen en JavaScript?',
                    type: 'multiple-choice',
                    options: [
                      'String',
                      'Number',
                      'Boolean',
                      'Object',
                      'Undefined',
                      'Null'
                    ],
                    correctAnswer: [0, 1, 2, 4, 5],
                    explanation: 'Object no es un tipo primitivo, es un tipo de referencia.',
                    points: 3
                  }
                ]
              },
              description: 'Evalúa tu conocimiento sobre los fundamentos de JavaScript'
            }
          }
        ]
      },
      {
        id: 2,
        title: 'Programación Asíncrona',
        description: 'Callbacks, Promises y async/await',
        order: 2,
        completed: false,
        unlocked: false,
        lessons: [
          {
            id: 4,
            title: 'Introducción a la Programación Asíncrona',
            type: 'video',
            duration: '50 min',
            estimatedMinutes: 50,
            order: 1,
            completed: false,
            unlocked: false,
            content: {
              videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              videoSource: 'youtube',
              transcript: 'La programación asíncrona es fundamental para el desarrollo web moderno...',
              description: 'Aprende los conceptos básicos de la programación asíncrona'
            }
          },
          {
            id: 5,
            title: 'Promises y async/await',
            type: 'text',
            duration: '35 min',
            estimatedMinutes: 35,
            order: 2,
            completed: false,
            unlocked: false,
            content: {
              text: '# Promises y async/await\n\nLas Promises son una forma moderna de manejar operaciones asíncronas...',
              description: 'Explora Promises y la sintaxis async/await'
            }
          },
          {
            id: 6,
            title: 'Quiz: Programación Asíncrona',
            type: 'quiz',
            duration: '20 min',
            estimatedMinutes: 20,
            order: 3,
            completed: false,
            unlocked: false,
            content: {
              quiz: {
                id: 2,
                title: 'Quiz: Programación Asíncrona',
                instructions: 'Evalúa tu comprensión de la programación asíncrona en JavaScript.',
                passingPercentage: 75,
                maxAttempts: 3,
                cooldownMinutes: 10,
                showCorrectAnswers: true,
                randomizeQuestions: true,
                shuffleAnswers: true,
                timeLimitMinutes: 20,
                allowReview: true,
                showProgressBar: true,
                questions: [
                  {
                    id: 3,
                    question: '¿Qué es una Promise en JavaScript?',
                    type: 'single-choice',
                    options: [
                      'Una función que se ejecuta inmediatamente',
                      'Un objeto que representa la eventual finalización de una operación asíncrona',
                      'Un tipo de variable',
                      'Un método de array'
                    ],
                    correctAnswer: 1,
                    explanation: 'Una Promise es un objeto que representa la eventual finalización (o falla) de una operación asíncrona.',
                    points: 3
                  }
                ]
              },
              description: 'Evalúa tu conocimiento sobre programación asíncrona'
            }
          }
        ]
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

  // Query para obtener el progreso del usuario
  const { data: userProgress = [] } = useQuery<UserProgress[]>(
    ['lms-progress', courseId, storeUser.email],
    async () => {
      // En el futuro, esto hará una llamada real a la API
      // const response = await axiosPrivate.get(`/lms/progress/${storeUser.email}/${courseId}`)
      // return response.data
      return []
    },
    { enabled: !!storeUser.email && !!courseId }
  )

  // Mutation para actualizar progreso
  const updateProgressMutation = useMutation(
    async (data: { lessonId: number; status: string; timeSpent: number }) => {
      // En el futuro, esto hará una llamada real a la API
      // const response = await axiosPrivate.post('/lms/progress', data)
      // return response.data
      console.log('Actualizando progreso:', data)
      return data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['lms-progress', courseId, storeUser.email])
        setSnackbarMessage('Progreso guardado correctamente')
        setShowSnackbar(true)
      }
    }
  )

  // Mutation para completar quiz
  const completeQuizMutation = useMutation(
    async (data: { quizId: number; answers: any; score: number; totalPoints: number }) => {
      // En el futuro, esto hará una llamada real a la API
      // const response = await axiosPrivate.post('/lms/quiz/attempt', data)
      // return response.data
      console.log('Completando quiz:', data)
      return data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['lms-progress', courseId, storeUser.email])
      }
    }
  )

  // Helper functions
  const getAllLessons = useCallback(() => {
    return course.modules.flatMap(module => 
      module.lessons.map(lesson => ({
        ...lesson,
        moduleId: module.id,
        moduleTitle: module.title
      }))
    )
  }, [course])

  const getCurrentLesson = useCallback(() => {
    if (!course.modules[currentModuleIndex]) return null
    return course.modules[currentModuleIndex].lessons[currentLessonIndex] || null
  }, [course, currentModuleIndex, currentLessonIndex])

  const getNextLesson = useCallback(() => {
    const currentModule = course.modules[currentModuleIndex]
    if (!currentModule) return null

    // Check if there's a next lesson in current module
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      return {
        moduleIndex: currentModuleIndex,
        lessonIndex: currentLessonIndex + 1,
        lesson: currentModule.lessons[currentLessonIndex + 1]
      }
    }

    // Check if there's a next module
    if (currentModuleIndex < course.modules.length - 1) {
      const nextModule = course.modules[currentModuleIndex + 1]
      if (nextModule.lessons.length > 0) {
        return {
          moduleIndex: currentModuleIndex + 1,
          lessonIndex: 0,
          lesson: nextModule.lessons[0]
        }
      }
    }

    return null
  }, [course, currentModuleIndex, currentLessonIndex])

  const getPreviousLesson = useCallback(() => {
    // Check if there's a previous lesson in current module
    if (currentLessonIndex > 0) {
      return {
        moduleIndex: currentModuleIndex,
        lessonIndex: currentLessonIndex - 1,
        lesson: course.modules[currentModuleIndex].lessons[currentLessonIndex - 1]
      }
    }

    // Check if there's a previous module
    if (currentModuleIndex > 0) {
      const prevModule = course.modules[currentModuleIndex - 1]
      if (prevModule.lessons.length > 0) {
        return {
          moduleIndex: currentModuleIndex - 1,
          lessonIndex: prevModule.lessons.length - 1,
          lesson: prevModule.lessons[prevModule.lessons.length - 1]
        }
      }
    }

    return null
  }, [course, currentModuleIndex, currentLessonIndex])

  const isLessonCompleted = useCallback((lessonId: number) => {
    return userProgress.some(p => p.lessonId === lessonId && p.status === 'completed')
  }, [userProgress])

  const isLessonUnlocked = useCallback((moduleIndex: number, lessonIndex: number) => {
    // First lesson of first module is always unlocked
    if (moduleIndex === 0 && lessonIndex === 0) return true

    // Check if previous lesson is completed
    const prevLesson = getPreviousLessonByIndex(moduleIndex, lessonIndex)
    if (prevLesson) {
      return isLessonCompleted(prevLesson.id)
    }

    return false
  }, [userProgress])

  const getPreviousLessonByIndex = (moduleIndex: number, lessonIndex: number) => {
    if (lessonIndex > 0) {
      return course.modules[moduleIndex].lessons[lessonIndex - 1]
    }
    if (moduleIndex > 0) {
      const prevModule = course.modules[moduleIndex - 1]
      return prevModule.lessons[prevModule.lessons.length - 1]
    }
    return null
  }

  const getCourseProgress = useCallback(() => {
    const allLessons = getAllLessons()
    const completedLessons = allLessons.filter(lesson => isLessonCompleted(lesson.id))
    return {
      completed: completedLessons.length,
      total: allLessons.length,
      percentage: allLessons.length > 0 ? (completedLessons.length / allLessons.length) * 100 : 0
    }
  }, [getAllLessons, isLessonCompleted])

  const getModuleProgress = useCallback((moduleIndex: number) => {
    const module = course.modules[moduleIndex]
    if (!module) return { completed: 0, total: 0, percentage: 0 }

    const completedLessons = module.lessons.filter(lesson => isLessonCompleted(lesson.id))
    return {
      completed: completedLessons.length,
      total: module.lessons.length,
      percentage: module.lessons.length > 0 ? (completedLessons.length / module.lessons.length) * 100 : 0
    }
  }, [course, isLessonCompleted])

  // Effects
  useEffect(() => {
    // Verificar autenticación
    if (!storeUser.email) {
      navigate('/login')
      return
    }
  }, [navigate, storeUser])

  useEffect(() => {
    // Auto-close sidebar on mobile when lesson changes
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [currentModuleIndex, currentLessonIndex, isMobile])

  useEffect(() => {
    // Start lesson timer
    setLessonStartTime(new Date())
  }, [currentModuleIndex, currentLessonIndex])

  useEffect(() => {
    // Update sidebar state based on screen size
    setSidebarOpen(!isMobile)
  }, [isMobile])

  // Event handlers
  const handleLessonComplete = useCallback(async (lessonId: number) => {
    const timeSpent = lessonStartTime 
      ? Math.round((new Date().getTime() - lessonStartTime.getTime()) / 1000 / 60)
      : 0

    try {
      await updateProgressMutation.mutateAsync({
        lessonId,
        status: 'completed',
        timeSpent
      })

      // Check if course is completed
      const progress = getCourseProgress()
      if (progress.percentage === 100) {
        setShowCompletionDialog(true)
      } else {
        // Auto-navigate to next lesson if available
        const nextLesson = getNextLesson()
        if (nextLesson && isLessonUnlocked(nextLesson.moduleIndex, nextLesson.lessonIndex)) {
          setCurrentModuleIndex(nextLesson.moduleIndex)
          setCurrentLessonIndex(nextLesson.lessonIndex)
          
          // Expand next module if needed
          setExpandedModules(prev => new Set([...prev, nextLesson.moduleIndex]))
        }
      }
    } catch (error) {
      console.error('Error completing lesson:', error)
      setSnackbarMessage('Error al guardar el progreso')
      setShowSnackbar(true)
    }
  }, [lessonStartTime, updateProgressMutation, getCourseProgress, getNextLesson, isLessonUnlocked])

  const handleQuizComplete = useCallback(async (attempt: any) => {
    const currentLesson = getCurrentLesson()
    if (!currentLesson || !currentLesson.content.quiz) return

    try {
      await completeQuizMutation.mutateAsync({
        quizId: currentLesson.content.quiz.id,
        answers: attempt.answers,
        score: attempt.score,
        totalPoints: attempt.totalPoints
      })

      if (attempt.passed) {
        await handleLessonComplete(currentLesson.id)
      }
    } catch (error) {
      console.error('Error completing quiz:', error)
    }
  }, [getCurrentLesson, completeQuizMutation, handleLessonComplete])

  const handleNavigateToLesson = useCallback((moduleIndex: number, lessonIndex: number) => {
    if (isLessonUnlocked(moduleIndex, lessonIndex)) {
      setCurrentModuleIndex(moduleIndex)
      setCurrentLessonIndex(lessonIndex)
      setExpandedModules(prev => new Set([...prev, moduleIndex]))
      
      if (isMobile) {
        setSidebarOpen(false)
      }
    }
  }, [isLessonUnlocked, isMobile])

  const handleNextLesson = useCallback(() => {
    const nextLesson = getNextLesson()
    if (nextLesson && isLessonUnlocked(nextLesson.moduleIndex, nextLesson.lessonIndex)) {
      handleNavigateToLesson(nextLesson.moduleIndex, nextLesson.lessonIndex)
    }
  }, [getNextLesson, isLessonUnlocked, handleNavigateToLesson])

  const handlePreviousLesson = useCallback(() => {
    const prevLesson = getPreviousLesson()
    if (prevLesson) {
      handleNavigateToLesson(prevLesson.moduleIndex, prevLesson.lessonIndex)
    }
  }, [getPreviousLesson, handleNavigateToLesson])

  const handleToggleModule = useCallback((moduleIndex: number) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moduleIndex)) {
        newSet.delete(moduleIndex)
      } else {
        newSet.add(moduleIndex)
      }
      return newSet
    })
  }, [])

  const getContentIcon = (type: string) => {
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

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'video':
        return 'Video'
      case 'text':
        return 'Texto'
      case 'quiz':
        return 'Quiz'
      default:
        return 'Contenido'
    }
  }

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

  const currentLesson = getCurrentLesson()
  const courseProgress = getCourseProgress()
  const nextLesson = getNextLesson()
  const prevLesson = getPreviousLesson()

  // Sidebar content
  const sidebarContent = (
    <Box sx={{ width: isMobile ? '100vw' : 350, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          Contenido del Curso
        </Typography>
        <LmsProgressBar
          steps={getAllLessons().map(lesson => ({
            id: lesson.id.toString(),
            title: lesson.title,
            type: lesson.type,
            completed: isLessonCompleted(lesson.id),
            current: lesson.id === currentLesson?.id
          }))}
          currentStepId={currentLesson?.id.toString()}
          variant="vertical"
          showLabels={true}
        />
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        <Stepper orientation="vertical" nonLinear>
          {course.modules.map((module, moduleIndex) => {
            const moduleProgress = getModuleProgress(moduleIndex)
            const isExpanded = expandedModules.has(moduleIndex)
            
            return (
              <Step key={module.id} expanded={isExpanded}>
                <StepLabel
                  onClick={() => handleToggleModule(moduleIndex)}
                  sx={{ cursor: 'pointer' }}
                  icon={
                    <Box sx={{ 
                      width: 24, 
                      height: 24, 
                      borderRadius: '50%', 
                      backgroundColor: moduleProgress.percentage === 100 ? 'success.main' : 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem'
                    }}>
                      {moduleProgress.percentage === 100 ? <CheckIcon fontSize="small" /> : moduleIndex + 1}
                    </Box>
                  }
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                      {module.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {moduleProgress.completed}/{moduleProgress.total} lecciones
                    </Typography>
                  </Box>
                </StepLabel>
                
                <StepContent>
                  <List dense>
                    {module.lessons.map((lesson, lessonIndex) => {
                      const isCompleted = isLessonCompleted(lesson.id)
                      const isUnlocked = isLessonUnlocked(moduleIndex, lessonIndex)
                      const isCurrent = currentModuleIndex === moduleIndex && currentLessonIndex === lessonIndex
                      
                      return (
                        <ListItem
                          key={lesson.id}
                          button
                          selected={isCurrent}
                          onClick={() => handleNavigateToLesson(moduleIndex, lessonIndex)}
                          disabled={!isUnlocked}
                          sx={{
                            borderRadius: 1,
                            mb: 0.5,
                            opacity: isUnlocked ? 1 : 0.6,
                            backgroundColor: isCurrent ? 'action.selected' : 'transparent'
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {isCompleted ? (
                              <CheckIcon color="success" fontSize="small" />
                            ) : isUnlocked ? (
                              getContentIcon(lesson.type)
                            ) : (
                              <LockIcon color="disabled" fontSize="small" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: isCurrent ? 'medium' : 'normal',
                                  color: isCompleted ? 'success.main' : 'text.primary'
                                }}
                              >
                                {lesson.title}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Chip
                                  label={getContentTypeLabel(lesson.type)}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 16, fontSize: '0.6rem' }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {lesson.duration}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      )
                    })}
                  </List>
                </StepContent>
              </Step>
            )
          })}
        </Stepper>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Mobile FAB for sidebar */}
      {isMobile && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            zIndex: 1200
          }}
          onClick={() => setSidebarOpen(true)}
        >
          <MenuIcon />
        </Fab>
      )}

      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        anchor="left"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: isMobile ? '100vw' : 350,
            boxSizing: 'border-box',
            position: 'relative',
            height: '100%'
          }
        }}
      >
        {isMobile && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
            <IconButton onClick={() => setSidebarOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        )}
        {sidebarContent}
      </Drawer>

      {/* Main content */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        marginLeft: !isMobile && sidebarOpen ? 0 : 0
      }}>
        {/* Header */}
        <Paper sx={{ p: 2, borderRadius: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            {!isMobile && !sidebarOpen && (
              <IconButton onClick={() => setSidebarOpen(true)} sx={{ mr: 2 }}>
                <MenuIcon />
              </IconButton>
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant={isMobile ? 'h6' : 'h5'} component='h1' gutterBottom>
                {course.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Chip label={course.category} color='primary' size="small" />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PeopleIcon fontSize='small' />
                  <Typography variant='caption'>
                    {course.enrolledUsers} estudiantes
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccessTimeIcon fontSize='small' />
                  <Typography variant='caption'>{course.duration}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Rating value={course.rating} readOnly size='small' />
                  <Typography variant='caption'>({course.rating})</Typography>
                </Box>
                {course.hasCertificate && (
                  <Chip 
                    icon={<CertificateIcon />} 
                    label="Con certificado" 
                    color="secondary" 
                    size="small" 
                  />
                )}
                {course.isMandatory && (
                  <Chip 
                    icon={<AssignmentIcon />} 
                    label="Obligatorio" 
                    color="warning" 
                    size="small" 
                  />
                )}
              </Box>
            </Box>
          </Box>

          {/* Progress bar */}
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant='body2' color='text.secondary'>
                Progreso del curso
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {courseProgress.completed} de {courseProgress.total} lecciones ({Math.round(courseProgress.percentage)}%)
              </Typography>
            </Box>
            <LinearProgress
              variant='determinate'
              value={courseProgress.percentage}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          {courseProgress.percentage === 100 && (
            <Alert severity="success" sx={{ mt: 1 }}>
              <Typography variant="body2">
                ¡Felicitaciones! Has completado el curso.
                {course.hasCertificate && (
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<CertificateIcon />}
                    sx={{ ml: 2 }}
                    onClick={() => window.open('/lms/certificate/1', '_blank')}
                  >
                    Ver Certificado
                  </Button>
                )}
              </Typography>
            </Alert>
          )}
        </Paper>

        {/* Lesson content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {currentLesson ? (
            <Card sx={{ height: 'fit-content' }}>
              <CardHeader
                title={currentLesson.title}
                subheader={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={getContentIcon(currentLesson.type)}
                      label={getContentTypeLabel(currentLesson.type)}
                      size='small'
                      color="primary"
                    />
                    <Typography variant='body2'>
                      {currentLesson.duration}
                    </Typography>
                    {isLessonCompleted(currentLesson.id) && (
                      <Chip
                        icon={<CheckIcon />}
                        label='Completado'
                        color='success'
                        size='small'
                      />
                    )}
                    <Typography variant='caption' color='text.secondary'>
                      Módulo: {course.modules[currentModuleIndex].title}
                    </Typography>
                  </Box>
                }
                action={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Lección anterior">
                      <IconButton
                        onClick={handlePreviousLesson}
                        disabled={!prevLesson}
                      >
                        <SkipPreviousIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={
                      nextLesson && !isLessonUnlocked(nextLesson.moduleIndex, nextLesson.lessonIndex)
                        ? 'Completa la lección actual primero'
                        : 'Siguiente lección'
                    }>
                      <IconButton
                        onClick={handleNextLesson}
                        disabled={!nextLesson || !isLessonUnlocked(nextLesson.moduleIndex, nextLesson.lessonIndex)}
                      >
                        <SkipNextIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              />
              <CardContent>
                {/* Video content */}
                {currentLesson.type === 'video' && currentLesson.content.videoUrl && (
                  <Box sx={{ mb: 3 }}>
                    <LmsVideoPlayer
                      src={currentLesson.content.videoUrl}
                      videoSource={currentLesson.content.videoSource || 'youtube'}
                      title={currentLesson.title}
                      onComplete={() => handleLessonComplete(currentLesson.id)}
                      onProgress={(currentTime, duration) => {
                        // Track video progress
                        if (duration > 0 && currentTime / duration >= 0.9) {
                          // Consider video completed at 90%
                        }
                      }}
                    />
                    {currentLesson.content.transcript && (
                      <Collapse in={true}>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant='h6' gutterBottom>
                            Transcripción
                          </Typography>
                          <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                            <Typography variant='body2' color='text.secondary'>
                              {currentLesson.content.transcript}
                            </Typography>
                          </Paper>
                        </Box>
                      </Collapse>
                    )}
                  </Box>
                )}

                {/* Text content */}
                {currentLesson.type === 'text' && currentLesson.content.text && (
                  <Box sx={{ mb: 3 }}>
                    <Paper sx={{ p: 3, backgroundColor: 'background.paper' }}>
                      <Typography
                        component='div'
                        sx={{
                          '& h1, & h2, & h3, & h4, & h5, & h6': {
                            color: 'primary.main',
                            mb: 2,
                            mt: 3
                          },
                          '& p': {
                            mb: 2,
                            lineHeight: 1.7
                          },
                          '& code': {
                            backgroundColor: 'grey.100',
                            padding: '2px 4px',
                            borderRadius: 1,
                            fontFamily: 'monospace'
                          },
                          '& pre': {
                            backgroundColor: 'grey.900',
                            color: 'white',
                            p: 2,
                            borderRadius: 1,
                            overflow: 'auto',
                            '& code': {
                              backgroundColor: 'transparent',
                              color: 'inherit'
                            }
                          },
                          '& ul, & ol': {
                            mb: 2,
                            pl: 3
                          },
                          '& li': {
                            mb: 1
                          }
                        }}
                        dangerouslySetInnerHTML={{
                          __html: currentLesson.content.text.replace(/\n/g, '<br>')
                        }}
                      />
                    </Paper>
                  </Box>
                )}

                {/* Quiz content */}
                {currentLesson.type === 'quiz' && currentLesson.content.quiz && (
                  <LmsQuizPlayer
                    quizConfig={currentLesson.content.quiz}
                    onComplete={handleQuizComplete}
                  />
                )}

                {/* Completion button for non-quiz content */}
                {!isLessonCompleted(currentLesson.id) && currentLesson.type !== 'quiz' && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Button
                      variant='contained'
                      size="large"
                      startIcon={<CheckIcon />}
                      onClick={() => handleLessonComplete(currentLesson.id)}
                      disabled={updateProgressMutation.isLoading}
                    >
                      {updateProgressMutation.isLoading ? 'Guardando...' : 'Marcar como Completado'}
                    </Button>
                  </Box>
                )}

                {/* Navigation buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Button
                    variant="outlined"
                    startIcon={<SkipPreviousIcon />}
                    onClick={handlePreviousLesson}
                    disabled={!prevLesson}
                  >
                    {isMobile ? 'Anterior' : 'Lección Anterior'}
                  </Button>

                  <Button
                    variant="contained"
                    endIcon={<SkipNextIcon />}
                    onClick={handleNextLesson}
                    disabled={!nextLesson || !isLessonUnlocked(nextLesson.moduleIndex, nextLesson.lessonIndex)}
                  >
                    {isMobile ? 'Siguiente' : 'Siguiente Lección'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary">
                  No hay contenido disponible
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>

      {/* Completion Dialog */}
      <Dialog open={showCompletionDialog} onClose={() => setShowCompletionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center' }}>
          <CertificateIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
          <Typography variant="h5">¡Felicitaciones!</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="body1" gutterBottom>
            Has completado exitosamente el curso "{course.title}".
          </Typography>
          {course.hasCertificate && (
            <Typography variant="body2" color="text.secondary">
              Tu certificado está listo para descargar.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          {course.hasCertificate && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CertificateIcon />}
              sx={{ mr: 1 }}
              onClick={() => {
                // Navigate to certificate view - in a real app, this would use the actual certificate ID
                window.open('/lms/certificate/1', '_blank')
              }}
            >
              Ver Certificado
            </Button>
          )}
          <Button
            variant="outlined"
            onClick={() => setShowCompletionDialog(false)}
          >
            Continuar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSnackbar(false)}
        message={snackbarMessage}
      />
    </Box>
  )
}

export default LmsCourseView
