import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Tooltip,
  Stack,
  Divider
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
  Menu as MenuIcon,
  Close as CloseIcon,
  AccessTime as AccessTimeIcon,
  Assignment as AssignmentIcon,
  EmojiEvents as CertificateIcon,
  Description as DescriptionIcon,
  FolderOpen as FolderOpenIcon,
  Check as CheckSmallIcon
} from '@mui/icons-material'
import { useQueryClient } from 'react-query'
import { useStore } from '@nanostores/react'
import { userStore } from 'src/store/userStore'
import LmsVideoPlayer from '../shared/LmsVideoPlayer'
import LmsQuizPlayer from '../shared/LmsQuizPlayer'
import {
  useCompleteLesson,
  useCourse,
  useCourseProgress,
  useQuizAttempts,
  useSubmitQuiz,
  useUserCertificates
} from '../../../hooks/useLms'
import { queryKeys } from '../../../config/queryClient'
import {
  getCourseAudienceLabel,
  normalizeCourseAudience
} from '../../../utils/lmsAudience'
import { buildLessonResourceDownloadUrl } from '../../../services/lmsService'

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
    resources?: Array<{
      id: number
      title: string
      description?: string
      resourceType: 'pdf' | 'document' | 'link'
      href: string
    }>
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

const getResourceHref = (resource: any) =>
  resource.external_url ||
  resource.download_url ||
  (resource.object_key ? buildLessonResourceDownloadUrl(resource.id) : resource.file_url)

interface QuizOutcomeSummary {
  passed: boolean
  percentage: number
  score: number
  totalPoints: number
  passingPercentage: number
  attemptsRemaining: number
  completesCourse: boolean
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
  const [lessonStartTime, setLessonStartTime] = useState<Date | null>(null)
  const [latestQuizOutcome, setLatestQuizOutcome] = useState<QuizOutcomeSummary | null>(null)
  const [certificateReadyNoticeVisible, setCertificateReadyNoticeVisible] = useState(false)

  const storeUser = useStore(userStore)

  // Obtener curso real de la API
  const { data: courseData, isLoading: isLoadingCourse, error: courseError } = useCourse(
    parseInt(courseId || '0')
  )
  const { data: progressData } = useCourseProgress(parseInt(courseId || '0'), undefined, {
    enabled: !!courseId
  })
  const { data: userCertificates = [] } = useUserCertificates(undefined, {
    enabled: !!courseId
  })
  const normalizedCourseId = parseInt(courseId || '0')
  const currentCourseCertificate = useMemo(() => {
    return userCertificates.find((certificate: any) => {
      const certificateCourseId = certificate.course_id ?? certificate.courseId
      return certificateCourseId === normalizedCourseId
    }) || null
  }, [normalizedCourseId, userCertificates])
  const hasGeneratedCertificate = Boolean(currentCourseCertificate?.id)
  const hasReviewAccess = hasGeneratedCertificate
    || progressData?.progress?.isCompleted === true
    || Number(progressData?.progress?.progressPercentage ?? 0) >= 100

  // Adapter: Convert API data to expected Course interface (memoized to prevent infinite loops)
  const course: Course | null = useMemo(() => {
    if (!courseData) return null

    const completedLessonIds = new Set<number>()

    if (progressData?.modules && Array.isArray(progressData.modules)) {
      progressData.modules.forEach((module: any) => {
        if (!Array.isArray(module.lessons)) {
          return
        }

        module.lessons.forEach((lesson: any) => {
          if (lesson.progress?.status === 'completed') {
            completedLessonIds.add(lesson.id)
          }
        })
      })
    }

    let previousLessonCompleted = true
    const mappedModules = (courseData.modules || [])
      .slice()
      .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
      .map((mod: any, modIndex: number) => {
        const lessons = (mod.lessons || [])
          .slice()
          .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
          .map((lesson: any, lessonIndex: number) => {
            const completed = hasReviewAccess || completedLessonIds.has(lesson.id)
            const unlocked = hasReviewAccess || (modIndex === 0 && lessonIndex === 0
              ? true
              : previousLessonCompleted)

            previousLessonCompleted = completed

            return {
              id: lesson.id,
              title: lesson.title,
              type: lesson.type || 'text',
              duration: (lesson.estimated_minutes || lesson.duration_minutes)
                ? `${lesson.estimated_minutes || lesson.duration_minutes} min`
                : 'N/A',
              estimatedMinutes: lesson.estimated_minutes || lesson.duration_minutes || 30,
              order: lesson.order_index || lessonIndex + 1,
              completed,
              unlocked,
              content: {
                videoUrl: lesson.video_url,
                videoSource: lesson.video_source,
                text: lesson.content,
                description: lesson.description || '',
                quiz: lesson.quiz ? {
                  id: lesson.quiz.id,
                  title: lesson.quiz.title,
                  instructions: lesson.quiz.instructions || '',
                  passingPercentage: lesson.quiz.passing_percentage ?? 70,
                  maxAttempts: lesson.quiz.max_attempts ?? 10,
                  cooldownMinutes: lesson.quiz.cooldown_minutes ?? 0,
                  showCorrectAnswers: lesson.quiz.show_correct_answers ?? true,
                  randomizeQuestions: lesson.quiz.randomize_questions ?? false,
                  shuffleAnswers: lesson.quiz.shuffle_answers ?? false,
                  timeLimitMinutes: lesson.quiz.time_limit_minutes,
                  allowReview: lesson.quiz.allow_review ?? true,
                  showProgressBar: lesson.quiz.show_progress_bar ?? true,
                  questions: (lesson.quiz.questions || []).map((q: any) => ({
                    id: q.id,
                    question: q.question,
                    type: q.type === 'single' ? 'single-choice' : q.type === 'boolean' ? 'true-false' : 'multiple-choice',
                    options: q.options || [],
                    correctAnswer: q.type === 'single' || q.type === 'boolean'
                      ? (q.correct_answers?.[0] ?? 0)
                      : (q.correct_answers || []),
                    explanation: q.explanation,
                    points: q.points || 1
                  }))
                } : undefined,
                resources: (lesson.resources || [])
                  .filter((resource: any) => resource.external_url || resource.download_url || resource.object_key || resource.file_url)
                  .map((resource: any) => ({
                    id: resource.id,
                    title: resource.title,
                    description: resource.description || '',
                    resourceType: resource.resource_type,
                    href: getResourceHref(resource)
                  }))
              }
            }
          })

        return {
          id: mod.id,
          title: mod.title,
          description: mod.description || '',
          order: mod.order_index || modIndex + 1,
          completed: lessons.length > 0 && lessons.every((lesson: any) => lesson.completed),
          unlocked: lessons.some((lesson: any) => lesson.unlocked),
          lessons
        }
      })

    return {
      id: courseData.id,
      title: courseData.title,
      description: courseData.description,
      category: getCourseAudienceLabel(courseData.audience),
      instructor: courseData.creator?.nombre || 'Instructor',
      duration: courseData.estimated_duration_minutes ? `${courseData.estimated_duration_minutes} min` : 'N/A',
      audience: normalizeCourseAudience(courseData.audience),
      thumbnail: '/placeholder.svg?height=400&width=600',
      hasCertificate: courseData.has_certificate || false,
      isMandatory: courseData.is_mandatory || false,
      modules: mappedModules
    }
  }, [courseData, hasReviewAccess, progressData])

  // Adapt progress data to UserProgress[] format
  const userProgress: UserProgress[] = useMemo(() => {
    if (!courseData?.modules) return []

    if (hasReviewAccess) {
      const reviewProgress = progressData?.progress as {
        completedAt?: string
        completed_at?: string
      } | undefined
      const completedAt = reviewProgress?.completedAt
        || reviewProgress?.completed_at
        || new Date().toISOString()

      return (courseData.modules || []).flatMap((module: any) =>
        (module.lessons || []).map((lesson: any) => ({
          courseId: normalizedCourseId,
          lessonId: lesson.id,
          status: 'completed' as const,
          timeSpent: lesson.estimated_minutes || lesson.duration_minutes || 0,
          completedAt: new Date(completedAt)
        }))
      )
    }

    if (!progressData || !progressData.modules) return []

    const lessons: UserProgress[] = []
    progressData.modules.forEach((module: any) => {
      if (module.lessons && Array.isArray(module.lessons)) {
        module.lessons.forEach((lesson: any) => {
          if (lesson.progress && lesson.progress.status === 'completed') {
            lessons.push({
              courseId: normalizedCourseId,
              lessonId: lesson.id,
              status: lesson.progress.status,
              timeSpent: lesson.progress.time_spent_minutes || 0,
              completedAt: lesson.progress.completed_at ? new Date(lesson.progress.completed_at) : undefined
            })
          }
        })
      }
    })
    return lessons
  }, [courseData?.modules, hasReviewAccess, normalizedCourseId, progressData])

  // Mutation para completar lección
  const updateProgressMutation = useCompleteLesson({
    onSuccess: async () => {
      await queryClient.invalidateQueries(queryKeys.certificates.user(undefined))
    },
    onError: (error: any) => {
      console.error('Error al completar lección:', error)
    }
  })

  // Mutation para completar quiz
  const completeQuizMutation = useSubmitQuiz({
    onSuccess: async () => {
      await queryClient.invalidateQueries(queryKeys.certificates.user(undefined))
    },
    onError: (error: any) => {
      console.error('Error al completar quiz:', error)
    }
  })

  // Memoize quiz config and empty arrays to prevent infinite loop in LmsQuizPlayer
  const currentQuizConfig = useMemo(() => {
    if (!course || !course.modules || !course.modules[currentModuleIndex]) return null
    const currentModule = course.modules[currentModuleIndex]
    if (!currentModule.lessons || !currentModule.lessons[currentLessonIndex]) return null
    const lesson = currentModule.lessons[currentLessonIndex]
    if (lesson.type !== 'quiz' || !lesson.content.quiz) return null
    return lesson.content.quiz
  }, [course, currentModuleIndex, currentLessonIndex])

  // Query para obtener intentos del quiz actual
  const { data: quizAttemptsData } = useQuizAttempts(currentQuizConfig?.id || 0, undefined, {
    enabled: !!currentQuizConfig?.id,
    staleTime: 30000
  })

  // Adaptador de intentos del quiz
  const userQuizAttempts = useMemo(() => {
    if (!quizAttemptsData) return []

    return quizAttemptsData.map((attempt: any) => ({
      attemptNumber: attempt.attempt_number,
      startedAt: new Date(attempt.started_at),
      answers: attempt.answers,
      timeSpent: Math.round((new Date(attempt.completed_at).getTime() - new Date(attempt.started_at).getTime()) / 1000),
      score: attempt.score,
      totalPoints: attempt.total_points,
      passed: attempt.passed
    }))
  }, [quizAttemptsData])

  // Helper functions
  const getAllLessons = useCallback(() => {
    if (!course || !course.modules) return []
    return course.modules.flatMap(module =>
      module.lessons.map(lesson => ({
        ...lesson,
        moduleId: module.id,
        moduleTitle: module.title
      }))
    )
  }, [course])

  const getCurrentLesson = useCallback(() => {
    if (!course || !course.modules || !course.modules[currentModuleIndex]) return null
    return course.modules[currentModuleIndex].lessons[currentLessonIndex] || null
  }, [course, currentModuleIndex, currentLessonIndex])

  const getNextLesson = useCallback(() => {
    if (!course || !course.modules) return null
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
    if (!course || !course.modules) return null

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

  const getPreviousLessonByIndex = useCallback((moduleIndex: number, lessonIndex: number) => {
    if (!course || !course.modules) return null

    if (lessonIndex > 0) {
      return course.modules[moduleIndex].lessons[lessonIndex - 1]
    }
    if (moduleIndex > 0) {
      const prevModule = course.modules[moduleIndex - 1]
      return prevModule.lessons[prevModule.lessons.length - 1]
    }
    return null
  }, [course])

  const isLessonUnlocked = useCallback((moduleIndex: number, lessonIndex: number) => {
    if (hasReviewAccess) return true

    // First lesson of first module is always unlocked
    if (moduleIndex === 0 && lessonIndex === 0) return true

    // Check if previous lesson is completed
    const prevLesson = getPreviousLessonByIndex(moduleIndex, lessonIndex)
    if (prevLesson) {
      return isLessonCompleted(prevLesson.id)
    }

    return false
  }, [getPreviousLessonByIndex, hasReviewAccess, isLessonCompleted])

  const getCourseProgress = useCallback(() => {
    const allLessons = getAllLessons()
    const completedLessons = allLessons.filter(lesson => isLessonCompleted(lesson.id))
    return {
      completed: completedLessons.length,
      total: allLessons.length,
      percentage: allLessons.length > 0 ? (completedLessons.length / allLessons.length) * 100 : 0
    }
  }, [getAllLessons, isLessonCompleted])

  const handleOpenCurrentCertificate = useCallback(() => {
    if (!currentCourseCertificate?.id) {
      return
    }

    navigate(`/lms/certificate/${currentCourseCertificate.id}`)
  }, [currentCourseCertificate, navigate])

  const getModuleProgress = useCallback((moduleIndex: number) => {
    if (!course || !course.modules) return { completed: 0, total: 0, percentage: 0 }
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
    setLatestQuizOutcome(null)
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
        timeSpent
      })
    } catch (error) {
      console.error('Error completing lesson:', error)
    }
  }, [lessonStartTime, updateProgressMutation])

  const handleQuizComplete = useCallback(async (attempt: any) => {
    if (!currentQuizConfig || !course || !course.modules[currentModuleIndex]) return
    const currentLesson = course.modules[currentModuleIndex].lessons[currentLessonIndex]
    if (!currentLesson) return

    try {
      // Transform answers to service schema: object with questionId as key, answer array as value
      const formattedAnswers: Record<number, number[]> = {}
      attempt.answers.forEach((answer: any, index: number) => {
        const questionId = attempt.questionIds?.[index] ?? currentQuizConfig.questions[index].id
        // Ensure answer is always an array
        formattedAnswers[questionId] = Array.isArray(answer) ? answer : [answer]
      })

      const result = await completeQuizMutation.mutateAsync({
        quizId: currentQuizConfig.id,
        data: {
          answers: formattedAnswers,
          timeSpent: attempt.timeSpent || 0
        }
      })

      const allLessons = getAllLessons()
      const completedLessonsCount = allLessons.filter((lesson) => isLessonCompleted(lesson.id)).length
      const completesCourse =
        !isLessonCompleted(currentLesson.id) &&
        completedLessonsCount + 1 >= allLessons.length

      setLatestQuizOutcome({
        passed: result.results.passed,
        percentage: result.results.percentage,
        score: result.results.score,
        totalPoints: result.results.totalPoints,
        passingPercentage: currentQuizConfig.passingPercentage,
        attemptsRemaining: Math.max(
          0,
          (currentQuizConfig.maxAttempts || 0) - (userQuizAttempts.length + 1)
        ),
        completesCourse
      })

      // Use backend result to determine if quiz was passed
      if (result.results.passed) {
        await handleLessonComplete(currentLesson.id)
      }
    } catch (error) {
      console.error('Error completing quiz:', error)
    }
  }, [
    currentQuizConfig,
    course,
    currentModuleIndex,
    currentLessonIndex,
    completeQuizMutation,
    handleLessonComplete,
    userQuizAttempts.length,
    getAllLessons,
    isLessonCompleted
  ])

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

  const currentLesson = getCurrentLesson()
  const courseProgress = getCourseProgress()
  const nextLesson = getNextLesson()
  const prevLesson = getPreviousLesson()
  const currentLessonCompleted = currentLesson ? isLessonCompleted(currentLesson.id) : false
  const nextUnlockedLesson =
    nextLesson && isLessonUnlocked(nextLesson.moduleIndex, nextLesson.lessonIndex)
      ? nextLesson
      : null

  useEffect(() => {
    if (courseProgress.percentage === 100) {
      setShowCompletionDialog(true)
    }
  }, [courseProgress.percentage])

  useEffect(() => {
    if (!course?.hasCertificate || courseProgress.percentage !== 100 || hasGeneratedCertificate) {
      return
    }

    const interval = window.setInterval(() => {
      void queryClient.invalidateQueries(queryKeys.certificates.user(undefined))
    }, 5000)

    return () => window.clearInterval(interval)
  }, [course?.hasCertificate, courseProgress.percentage, hasGeneratedCertificate, queryClient])

  useEffect(() => {
    if (course && courseProgress.percentage === 100 && course.hasCertificate && hasGeneratedCertificate) {
      setCertificateReadyNoticeVisible(true)
    }
  }, [course, courseProgress.percentage, hasGeneratedCertificate])

  // Early return states (must be after all hooks)
  if (isLoadingCourse) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Typography>Cargando curso...</Typography>
      </Box>
    )
  }

  if (courseError || !course) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Error al cargar el curso. Por favor, intenta nuevamente.</Alert>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>Volver</Button>
      </Box>
    )
  }

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

  // Sidebar content
  const sidebarContent = (
    <Box
      sx={{
        width: isMobile ? '100vw' : 344,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background:
          'linear-gradient(180deg, rgba(248,252,249,0.98) 0%, rgba(239,247,243,0.98) 100%)'
      }}
    >
      <Box
        sx={{
          p: 2.5,
          borderBottom: '1px solid',
          borderColor: 'rgba(24, 49, 83, 0.08)',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.3) 100%)'
        }}
      >
        <Typography
          variant='overline'
          sx={{ letterSpacing: '0.18em', color: '#2d9b5f', fontWeight: 700 }}
        >
          Ruta de aprendizaje
        </Typography>
        <Typography variant='h6' sx={{ mt: 0.5, fontWeight: 700, color: '#183153' }}>
          Contenido del curso
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 0.75 }}>
          Avanza por módulos, completa lecciones y desbloquea el certificado al final.
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 1.75 }}>
        <Stepper
          orientation='vertical'
          nonLinear
          sx={{
            '& .MuiStepConnector-line': {
              borderColor: 'rgba(24,49,83,0.12)'
            }
          }}
        >
          {course.modules.map((module, moduleIndex) => {
            const moduleProgress = getModuleProgress(moduleIndex)
            const isExpanded = expandedModules.has(moduleIndex)
            
            return (
              <Step key={module.id} expanded={isExpanded}>
                <StepLabel
                  onClick={() => handleToggleModule(moduleIndex)}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 4,
                    px: 1.35,
                    py: 1.1,
                    mx: 0.5,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    border: '1px solid rgba(24,49,83,0.08)',
                    boxShadow: isExpanded ? '0 18px 34px rgba(24, 49, 83, 0.08)' : '0 10px 24px rgba(24, 49, 83, 0.04)',
                    transition: 'all 0.2s ease'
                  }}
                  icon={
                    <Box sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background:
                        moduleProgress.percentage === 100
                          ? 'linear-gradient(135deg, #2d9b5f 0%, #43c77f 100%)'
                          : 'linear-gradient(135deg, #183153 0%, #0e6ba8 100%)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      boxShadow: '0 8px 18px rgba(24, 49, 83, 0.16)'
                    }}>
                      {moduleProgress.percentage === 100 ? <CheckIcon fontSize='small' /> : moduleIndex + 1}
                    </Box>
                  }
                >
                  <Box>
                    <Typography variant='overline' sx={{ color: '#5b6b7d', fontSize: '0.62rem' }}>
                      Módulo {moduleIndex + 1}
                    </Typography>
                    <Typography variant='subtitle1' sx={{ fontWeight: 800, color: '#183153', lineHeight: 1.2 }}>
                      {module.title}
                    </Typography>
                    <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.35 }}>
                      {moduleProgress.completed}/{moduleProgress.total} lecciones
                    </Typography>
                    {!isExpanded ? (
                      <Box sx={{ mt: 1.25, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant='determinate'
                          value={moduleProgress.percentage}
                          sx={{
                            flex: 1,
                            height: 8,
                            borderRadius: 999,
                            bgcolor: 'rgba(24,49,83,0.08)',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 999,
                              background: 'linear-gradient(90deg, #2d9b5f 0%, #53cf89 100%)'
                            }
                          }}
                        />
                        <Typography variant='caption' sx={{ color: '#5b6b7d', minWidth: 28 }}>
                          {Math.round(moduleProgress.percentage)}%
                        </Typography>
                      </Box>
                    ) : null}
                  </Box>
                </StepLabel>
                
                <StepContent>
                  <List dense sx={{ pl: 0.5, pt: 0.5 }}>
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
                            borderRadius: 3,
                            mb: 1,
                            px: 1.1,
                            py: 0.9,
                            opacity: isUnlocked ? 1 : 0.6,
                            border: '1px solid',
                            borderColor: isCurrent
                              ? 'rgba(45, 155, 95, 0.18)'
                              : 'rgba(24, 49, 83, 0.06)',
                            background: isCurrent
                              ? 'linear-gradient(135deg, rgba(45,155,95,0.12) 0%, rgba(255,255,255,0.96) 100%)'
                              : 'rgba(255,255,255,0.72)',
                            boxShadow: isCurrent ? '0 14px 28px rgba(24, 49, 83, 0.08)' : 'none'
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {isCompleted ? (
                              <CheckIcon color='success' fontSize='small' />
                            ) : isUnlocked ? (
                              <Box
                                sx={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: 'rgba(24,49,83,0.06)',
                                  color: '#355c7d'
                                }}
                              >
                                {getContentIcon(lesson.type)}
                              </Box>
                            ) : (
                              <LockIcon color='disabled' fontSize='small' />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                                <Typography
                                  variant='body2'
                                  sx={{
                                    fontWeight: isCurrent ? 700 : 500,
                                    color: isCompleted ? 'success.main' : 'text.primary',
                                    lineHeight: 1.2
                                  }}
                                >
                                  {lesson.title}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Chip
                                  label={getContentTypeLabel(lesson.type)}
                                  size='small'
                                  variant='outlined'
                                  sx={{
                                    height: 20,
                                    fontSize: '0.62rem',
                                    borderColor: 'rgba(45,155,95,0.28)',
                                    color: '#2d9b5f',
                                    bgcolor: 'rgba(255,255,255,0.9)'
                                  }}
                                />
                                <Typography variant='caption' color='text.secondary'>
                                  {lesson.duration}
                                </Typography>
                                {isCompleted ? <CheckSmallIcon sx={{ fontSize: 16, color: '#2d9b5f' }} /> : null}
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
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background:
          'radial-gradient(circle at top left, rgba(67,199,127,0.12), transparent 30%), linear-gradient(180deg, #f6fbf8 0%, #edf5f1 100%)'
      }}
    >
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
            width: isMobile ? '100vw' : 344,
            boxSizing: 'border-box',
            position: 'relative',
            height: '100%',
            borderRight: '1px solid rgba(24, 49, 83, 0.08)',
            background: 'transparent'
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
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, md: 2.25 },
            borderRadius: 0,
            borderBottom: '1px solid',
            borderColor: 'rgba(24, 49, 83, 0.08)',
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(244,250,247,0.96) 52%, rgba(229,242,235,0.96) 100%)'
          }}
        >
          <Box sx={{ maxWidth: 1320, mx: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.25 }}>
            <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            {!isMobile && !sidebarOpen && (
              <IconButton onClick={() => setSidebarOpen(true)} sx={{ mr: 2 }}>
                <MenuIcon />
              </IconButton>
            )}
            <Box sx={{ flex: 1 }}>
              <Typography
                variant='overline'
                sx={{ letterSpacing: '0.18em', color: '#2d9b5f', fontWeight: 700 }}
              >
                Experiencia activa
              </Typography>
              <Typography
                variant={isMobile ? 'h5' : 'h4'}
                component='h1'
                gutterBottom
                sx={{ fontWeight: 800, color: '#183153', maxWidth: 980, mb: 0.5 }}
              >
                {course.title}
              </Typography>
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ maxWidth: 900, mb: 1.1, lineHeight: 1.6 }}
              >
                {course.description}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={course.category}
                  size='small'
                  sx={{
                    bgcolor: 'rgba(45,155,95,0.14)',
                    color: '#12704a',
                    fontWeight: 700
                  }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccessTimeIcon fontSize='small' />
                  <Typography variant='caption'>{course.duration}</Typography>
                </Box>
                <Chip label={`Instructor: ${course.instructor}`} size='small' variant='outlined' />
                {course.hasCertificate && (
                  <Chip 
                    icon={<CertificateIcon />} 
                    label="Con certificado" 
                    size='small'
                    sx={{
                      bgcolor: 'rgba(14,107,168,0.14)',
                      color: '#0e6ba8',
                      fontWeight: 700
                    }}
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

          <Box
            sx={{
              p: 1.5,
              borderRadius: 4,
              border: '1px solid rgba(24, 49, 83, 0.08)',
              bgcolor: 'rgba(255,255,255,0.74)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 16px 30px rgba(24, 49, 83, 0.05)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant='body2' color='text.secondary'>
                Progreso del curso
              </Typography>
              <Typography variant='body2' sx={{ color: '#5b6b7d', fontWeight: 700 }}>
                {courseProgress.completed} de {courseProgress.total} lecciones ({Math.round(courseProgress.percentage)}%)
              </Typography>
            </Box>
            <LinearProgress
              variant='determinate'
              value={courseProgress.percentage}
              sx={{
                height: 8,
                borderRadius: 999,
                bgcolor: 'rgba(24,49,83,0.08)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, #2d9b5f 0%, #53cf89 100%)'
                }
              }}
            />
            <Typography variant='caption' color='text.secondary' sx={{ mt: 0.75, display: 'block' }}>
              {courseProgress.percentage === 100
                ? 'Ruta completada. Ya puedes revisar el resultado final y tu certificado.'
                : 'Completa cada lección para mantener el avance desbloqueado.'}
            </Typography>
          </Box>
          </Box>

                {courseProgress.percentage === 100 && (
                  <Box sx={{ maxWidth: 1320, mx: 'auto', px: { xs: 2, md: 3 }, pt: 1.5 }}>
                  <Alert
                    severity="success"
                    sx={{
                      borderRadius: 4,
                      border: '1px solid rgba(45,155,95,0.18)',
                      background: 'linear-gradient(135deg, rgba(232,251,239,0.96) 0%, rgba(244,255,248,0.98) 100%)',
                      boxShadow: '0 14px 32px rgba(45,155,95,0.08)'
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      ¡Felicitaciones! Has completado el curso.
                      {course.hasCertificate && hasGeneratedCertificate && (
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<CertificateIcon />}
                          sx={{ ml: 2 }}
                          onClick={handleOpenCurrentCertificate}
                        >
                          Ver Certificado
                        </Button>
                      )}
                      {course.hasCertificate && !hasGeneratedCertificate && (
                        <Box sx={{ ml: 2, display: 'inline-flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Chip
                            label="Generando certificado..."
                            color="success"
                            size="small"
                          />
                          <Typography variant="caption" color="text.secondary">
                            Esto puede tardar unos segundos.
                          </Typography>
                        </Box>
                      )}
                    </Typography>
                  </Alert>
                  </Box>
                )}
        </Paper>

        {/* Lesson content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 1.5, md: 3 } }}>
          <Box sx={{ maxWidth: 1320, mx: 'auto' }}>
          {currentLesson ? (
            <Card
              sx={{
                height: 'fit-content',
                borderRadius: 5,
                border: '1px solid rgba(24, 49, 83, 0.08)',
                boxShadow: '0 32px 70px rgba(24, 49, 83, 0.08)',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.76)',
                backdropFilter: 'blur(12px)',
                position: 'relative'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  background:
                    'radial-gradient(circle at top right, rgba(45,155,95,0.10), transparent 22%), radial-gradient(circle at bottom left, rgba(14,107,168,0.08), transparent 26%)'
                }}
              />
              <CardHeader
                sx={{
                  position: 'relative',
                  pb: 0,
                  background:
                    'linear-gradient(180deg, rgba(248,252,249,0.96) 0%, rgba(255,255,255,0.96) 100%)'
                }}
                title={
                  <Box>
                    <Typography
                      variant='overline'
                      sx={{ letterSpacing: '0.16em', color: '#2d9b5f', fontWeight: 700 }}
                    >
                      Lección activa
                    </Typography>
                    <Typography variant='h5' sx={{ fontWeight: 800, color: '#183153', mt: 0.5 }}>
                      {currentLesson.title}
                    </Typography>
                  </Box>
                }
                subheader={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap', mt: 1 }}>
                    <Chip
                      icon={getContentIcon(currentLesson.type)}
                      label={getContentTypeLabel(currentLesson.type)}
                      size='small'
                      sx={{
                        bgcolor: 'rgba(45,155,95,0.12)',
                        color: '#12704a',
                        fontWeight: 700,
                        '& .MuiChip-icon': {
                          color: '#12704a'
                        }
                      }}
                    />
                    <Chip
                      icon={<AccessTimeIcon />}
                      label={currentLesson.duration}
                      size='small'
                      variant='outlined'
                      sx={{
                        borderColor: 'rgba(24,49,83,0.1)',
                        color: '#183153',
                        fontWeight: 600
                      }}
                    />
                    <Typography variant='body2' sx={{ color: '#5b6b7d' }}>
                      Etapa:
                    </Typography>
                    <Chip
                      label={course.modules[currentModuleIndex].title}
                      size='small'
                      variant='outlined'
                      sx={{
                        borderColor: 'rgba(14,107,168,0.18)',
                        color: '#0e6ba8',
                        bgcolor: 'rgba(255,255,255,0.7)'
                      }}
                    />
                    {isLessonCompleted(currentLesson.id) && (
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
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Tooltip title="Lección anterior">
                      <IconButton
                        onClick={handlePreviousLesson}
                        disabled={!prevLesson}
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.86)',
                          border: '1px solid rgba(24,49,83,0.08)',
                          boxShadow: '0 10px 22px rgba(24,49,83,0.05)'
                        }}
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
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.86)',
                          border: '1px solid rgba(24,49,83,0.08)',
                          boxShadow: '0 10px 22px rgba(24,49,83,0.05)'
                        }}
                      >
                        <SkipNextIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              />
              <CardContent sx={{ p: { xs: 2, md: 3 }, position: 'relative' }}>
                <Divider sx={{ mb: 2.5, borderColor: 'rgba(24,49,83,0.08)' }} />
                {courseProgress.percentage === 100 ? (
                  <Alert
                    severity="success"
                    sx={{
                      mb: 3,
                      borderRadius: 3.5,
                      border: '1px solid rgba(45,155,95,0.16)',
                      background: 'linear-gradient(135deg, rgba(240,252,244,0.98) 0%, rgba(250,255,252,0.98) 100%)'
                    }}
                  >
                    <AlertTitle>Curso completado</AlertTitle>
                    Ya cerraste todo el recorrido de aprendizaje.
                    {course.hasCertificate && hasGeneratedCertificate && (
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<CertificateIcon />}
                        sx={{ ml: 2, mt: { xs: 2, sm: 0 } }}
                        onClick={handleOpenCurrentCertificate}
                      >
                        Abrir certificado
                      </Button>
                    )}
                    {course.hasCertificate && !hasGeneratedCertificate && (
                      <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label="Preparando certificado..."
                          color="success"
                          size="small"
                        />
                        <Typography variant="body2" color="text.secondary">
                          Seguiremos revisando automáticamente hasta que esté disponible.
                        </Typography>
                        <Button
                          variant="text"
                          color="success"
                          size="small"
                          onClick={() => navigate('/lms/certificates')}
                        >
                          Ir a mis certificados
                        </Button>
                      </Box>
                    )}
                  </Alert>
                ) : certificateReadyNoticeVisible ? (
                  <Alert
                    severity="success"
                    sx={{
                      mb: 3,
                      borderRadius: 3.5,
                      border: '1px solid rgba(45,155,95,0.16)',
                      background: 'linear-gradient(135deg, rgba(240,252,244,0.98) 0%, rgba(250,255,252,0.98) 100%)'
                    }}
                    action={course.hasCertificate ? (
                      <Button color="inherit" size="small" onClick={handleOpenCurrentCertificate}>
                        Abrir certificado
                      </Button>
                    ) : undefined}
                    onClose={() => setCertificateReadyNoticeVisible(false)}
                  >
                    <AlertTitle>Certificado disponible</AlertTitle>
                    Tu certificado ya quedó listo y puedes abrirlo desde aquí o desde la sección de certificados.
                  </Alert>
                ) : currentLesson.type === 'quiz' && latestQuizOutcome ? (
                  <Alert
                    severity={latestQuizOutcome.passed ? 'success' : 'warning'}
                    sx={{
                      mb: 3,
                      borderRadius: 3.5,
                      border: latestQuizOutcome.passed
                        ? '1px solid rgba(45,155,95,0.16)'
                        : '1px solid rgba(214,145,0,0.16)',
                      background: latestQuizOutcome.passed
                        ? 'linear-gradient(135deg, rgba(240,252,244,0.98) 0%, rgba(250,255,252,0.98) 100%)'
                        : 'linear-gradient(135deg, rgba(255,248,232,0.98) 0%, rgba(255,252,244,0.98) 100%)'
                    }}
                    action={
                      latestQuizOutcome.passed ? (
                        latestQuizOutcome.completesCourse ? (
                          course.hasCertificate && hasGeneratedCertificate ? (
                            <Button color="inherit" size="small" onClick={handleOpenCurrentCertificate}>
                              Abrir certificado
                            </Button>
                          ) : (
                            <Button color="inherit" size="small" onClick={() => navigate('/lms/certificates')}>
                              Ver certificados
                            </Button>
                          )
                        ) : nextUnlockedLesson ? (
                          <Button color="inherit" size="small" onClick={handleNextLesson}>
                            Continuar
                          </Button>
                        ) : undefined
                      ) : undefined
                    }
                  >
                    <AlertTitle>
                      {latestQuizOutcome.passed ? 'Quiz aprobado' : 'Aún no alcanzas el puntaje mínimo'}
                    </AlertTitle>
                    {latestQuizOutcome.passed ? (
                      latestQuizOutcome.completesCourse ? (
                        <>
                          Obtuviste <strong>{latestQuizOutcome.percentage}%</strong> y con eso completaste el curso.
                          {course.hasCertificate
                            ? hasGeneratedCertificate
                              ? ' Tu certificado ya está disponible.'
                              : ' Tu certificado se está preparando.'
                            : ' Ya puedes revisar tu progreso final.'}
                        </>
                      ) : (
                        <>
                          Obtuviste <strong>{latestQuizOutcome.percentage}%</strong> y ya puedes seguir con
                          {' '}
                          <strong>{nextUnlockedLesson?.lesson.title || 'la siguiente lección'}</strong>.
                        </>
                      )
                    ) : (
                      <>
                        Lograste <strong>{latestQuizOutcome.percentage}%</strong> y necesitas
                        {' '}
                        <strong>{latestQuizOutcome.passingPercentage}%</strong> para aprobar.
                        {latestQuizOutcome.attemptsRemaining > 0
                          ? ` Aún te quedan ${latestQuizOutcome.attemptsRemaining} intento${latestQuizOutcome.attemptsRemaining === 1 ? '' : 's'}.`
                          : ' Ya no quedan intentos disponibles para esta evaluación.'}
                      </>
                    )}
                  </Alert>
                ) : currentLessonCompleted && nextUnlockedLesson ? (
                  <Alert
                    severity="success"
                    sx={{
                      mb: 3,
                      borderRadius: 3.5,
                      border: '1px solid rgba(45,155,95,0.16)',
                      background: 'linear-gradient(135deg, rgba(240,252,244,0.98) 0%, rgba(250,255,252,0.98) 100%)'
                    }}
                    action={
                      <Button color="inherit" size="small" onClick={handleNextLesson}>
                        Continuar
                      </Button>
                    }
                  >
                    <AlertTitle>Lección completada</AlertTitle>
                    Siguiente paso: continúa con <strong>{nextUnlockedLesson.lesson.title}</strong>.
                  </Alert>
                ) : currentLesson.type === 'quiz' ? (
                  <Alert
                    severity="info"
                    sx={{
                      mb: 3,
                      borderRadius: 3.5,
                      border: '1px solid rgba(14,107,168,0.12)',
                      background: 'linear-gradient(135deg, rgba(239,248,255,0.98) 0%, rgba(250,253,255,0.98) 100%)'
                    }}
                  >
                    <AlertTitle>Evaluación de la lección</AlertTitle>
                    Para avanzar necesitas aprobar este quiz. Si no alcanzas el puntaje mínimo, puedes volver a intentarlo.
                  </Alert>
                ) : (
                  <Alert
                    severity="info"
                    sx={{
                      mb: 3,
                      borderRadius: 3.5,
                      border: '1px solid rgba(14,107,168,0.12)',
                      background: 'linear-gradient(135deg, rgba(239,248,255,0.98) 0%, rgba(250,253,255,0.98) 100%)'
                    }}
                  >
                    <AlertTitle>Siguiente paso</AlertTitle>
                    Completa esta lección para desbloquear la siguiente parte del curso.
                  </Alert>
                )}

                {currentLesson.content.description && (
                  <Paper
                    sx={{
                      p: 2,
                      mb: 3,
                      borderRadius: 3,
                      border: '1px solid rgba(24,49,83,0.08)',
                      background: 'rgba(255,255,255,0.76)',
                      maxWidth: 980,
                      mx: 'auto'
                    }}
                  >
                    <Typography variant='body1' sx={{ color: '#4f5d6d', lineHeight: 1.7 }}>
                      {currentLesson.content.description}
                    </Typography>
                  </Paper>
                )}

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
                    <Paper
                      sx={{
                        p: { xs: 2.5, md: 3.5 },
                        borderRadius: 4,
                        background:
                          'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,252,249,0.98) 100%)',
                        border: '1px solid rgba(24, 49, 83, 0.06)',
                        boxShadow: '0 18px 45px rgba(24, 49, 83, 0.05)',
                        maxWidth: 980,
                        mx: 'auto'
                      }}
                    >
                      <Stack direction='row' spacing={1.25} alignItems='center' sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            width: 42,
                            height: 42,
                            borderRadius: 2.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'rgba(45,155,95,0.10)',
                            color: '#224b33'
                          }}
                        >
                          <CertificateIcon />
                        </Box>
                        <Typography variant='h4' sx={{ fontWeight: 800, color: '#1a2e22', fontSize: { xs: '1.5rem', md: '2rem' } }}>
                          Objetivo del curso
                        </Typography>
                      </Stack>
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
                            lineHeight: 1.8,
                            color: '#243b53',
                            fontSize: '1rem'
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
                            pl: 0,
                            listStyle: 'none'
                          },
                          '& li': {
                            mb: 1,
                            position: 'relative',
                            pl: 3,
                            '&::before': {
                              content: '"✓"',
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              color: '#7b8374',
                              fontWeight: 700
                            }
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
                {currentLesson.type === 'quiz' && currentQuizConfig && (
                  <LmsQuizPlayer
                    quizConfig={currentQuizConfig}
                    userAttempts={userQuizAttempts}
                    onComplete={handleQuizComplete}
                  />
                )}

                {!!currentLesson.content.resources?.length && (
                  <Paper
                    variant='outlined'
                    sx={{
                      p: 2.5,
                      mb: 3,
                      borderRadius: 4,
                      borderColor: 'rgba(24, 49, 83, 0.08)',
                      background: 'rgba(248,252,249,0.78)',
                      maxWidth: 980,
                      mx: 'auto'
                    }}
                  >
                    <Stack direction='row' spacing={1.25} alignItems='center' sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: 2.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'rgba(24,49,83,0.06)',
                          color: '#1f2f45'
                        }}
                      >
                        <FolderOpenIcon />
                      </Box>
                      <Typography variant='h5' sx={{ fontWeight: 800, color: '#1f2f45' }}>
                        Recursos de apoyo
                      </Typography>
                    </Stack>
                    <Stack spacing={1.5}>
                      {currentLesson.content.resources.map((resource) => (
                        <Box
                          key={resource.id}
                          sx={{
                            p: 1.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: { xs: 'flex-start', sm: 'center' },
                              gap: 1,
                              flexDirection: { xs: 'column', sm: 'row' }
                            }}
                          >
                            <Box>
                              <Stack direction='row' spacing={1.25} alignItems='center'>
                                <DescriptionIcon sx={{ color: '#1f2f45' }} />
                                <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
                                  {resource.title}
                                </Typography>
                              </Stack>
                              {resource.description && (
                                <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                                  {resource.description}
                                </Typography>
                              )}
                            </Box>
                            <Button
                              size='small'
                              variant='outlined'
                              href={resource.href}
                              target='_blank'
                              rel='noopener noreferrer'
                              sx={{ borderRadius: 999, px: 2 }}
                            >
                              Abrir recurso
                            </Button>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                )}

                {/* Completion button for non-quiz content */}
                {!isLessonCompleted(currentLesson.id) && currentLesson.type !== 'quiz' && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3.5 }}>
                    <Button
                      variant='contained'
                      size='large'
                      onClick={() => handleLessonComplete(currentLesson.id)}
                      disabled={updateProgressMutation.isLoading}
                      sx={{
                        minWidth: 280,
                        borderRadius: 3,
                        py: 1.25,
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        background: 'linear-gradient(90deg, #16a34a 0%, #2ecb73 100%)',
                        boxShadow: '0 18px 34px rgba(22,163,74,0.22)'
                      }}
                    >
                      {updateProgressMutation.isLoading ? 'Guardando...' : 'Completar y continuar'}
                    </Button>
                  </Box>
                )}

                {/* Navigation buttons */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mt: 4,
                    pt: 2.5,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    position: 'sticky',
                    bottom: 0,
                    zIndex: 2,
                    mx: { xs: -2, md: -3 },
                    px: { xs: 2, md: 3 },
                    pb: { xs: 2, md: 2.5 },
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.92) 16%, rgba(255,255,255,0.98) 100%)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<SkipPreviousIcon />}
                    onClick={handlePreviousLesson}
                    disabled={!prevLesson}
                    sx={{ borderRadius: 999, px: 2.5 }}
                  >
                    {isMobile ? 'Anterior' : 'Lección Anterior'}
                  </Button>

                  <Button
                    variant="contained"
                    endIcon={<SkipNextIcon />}
                    onClick={handleNextLesson}
                    disabled={!nextLesson || !isLessonUnlocked(nextLesson.moduleIndex, nextLesson.lessonIndex)}
                    sx={{
                      borderRadius: 999,
                      px: 2.75,
                      background: 'linear-gradient(90deg, #2d9b5f 0%, #43c77f 100%)',
                      boxShadow: '0 14px 26px rgba(45,155,95,0.22)'
                    }}
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ya puedes cerrar esta etapa del aprendizaje y revisar tu certificado o volver a tu ruta.
          </Typography>
          {course.hasCertificate && hasGeneratedCertificate && (
            <Typography variant="body2" color="text.secondary">
              Tu certificado está listo para descargar.
            </Typography>
          )}
          {course.hasCertificate && !hasGeneratedCertificate && (
            <Typography variant="body2" color="text.secondary">
              Tu certificado se está preparando y lo seguiremos revisando automáticamente en esta pantalla.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          {course.hasCertificate && hasGeneratedCertificate && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CertificateIcon />}
              sx={{ mr: 1 }}
              disabled={!hasGeneratedCertificate}
              onClick={handleOpenCurrentCertificate}
            >
              Ver Certificado
            </Button>
          )}
          {course.hasCertificate && !hasGeneratedCertificate && (
            <Button
              variant="contained"
              color="success"
              sx={{ mr: 1 }}
              onClick={() => navigate('/lms/certificates')}
            >
              Ir a mis certificados
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

    </Box>
  )
}

export default LmsCourseView
