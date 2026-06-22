import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Chip,
  LinearProgress,
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery,
  Fab,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Stack,
  Divider,
  Skeleton,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  SkipNext as SkipNextIcon,
  SkipPrevious as SkipPreviousIcon,
  CheckCircle as CheckIcon,
  MenuBook as BookIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  AccessTime as AccessTimeIcon,
  EmojiEvents as CertificateIcon,
  Description as DescriptionIcon,
  PlayCircleOutline as PlayCircleIcon,
  Assignment as AssignmentIcon,
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon,
  RadioButtonUnchecked as RadioUncheckedIcon,
  Shield as ShieldIcon,
  PeopleOutline as PeopleIcon,
  Download as DownloadIcon,
  OpenInNew as ExternalLinkIcon
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
import { api } from 'src/config'
import {
  getCourseAudienceLabel,
  normalizeCourseAudience
} from '../../../utils/lmsAudience'
import { buildLessonResourceDownloadUrl, buildLmsVideoStreamUrl } from '../../../services/lmsService'
import PDFViewer from 'src/Components/PDFViewer'

const fadeIn = { animation: 'fadeSlideIn 0.35s ease-out' }
const styles = `
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}`


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
    videoSource?: 'minio' | 'youtube' | 'gdrive'
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
      original_filename?: string
      external_url?: string
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
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false)
  const [pdfViewerResource, setPdfViewerResource] = useState<any>(null)
  const autoAdvance = false
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
                videoUrl:
                  lesson.video_source === 'minio'
                    ? buildLmsVideoStreamUrl(lesson.video_url || '')
                    : lesson.video_url,
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
                    href: getResourceHref(resource),
                    original_filename: resource.original_filename,
                    external_url: resource.external_url
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
      if (autoAdvance) {
        const nl = getNextLesson()
        if (nl && isLessonUnlocked(nl.moduleIndex, nl.lessonIndex)) {
          setTimeout(() => {
            setCurrentModuleIndex(nl.moduleIndex)
            setCurrentLessonIndex(nl.lessonIndex)
            setExpandedModules(prev => new Set([...prev, nl.moduleIndex]))
            if (isMobile) {
              setSidebarOpen(false)
            }
          }, 1500)
        }
      }
    } catch (error) {
      console.error('Error completing lesson:', error)
    }
  }, [lessonStartTime, updateProgressMutation, autoAdvance, getNextLesson, isLessonUnlocked, isMobile])

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
  const allLessons = getAllLessons()
  const currentLessonGlobalIndex = allLessons.findIndex(l => l.id === currentLesson?.id) + 1
  const totalLessons = allLessons.length
  const estimatedMinutesRemaining = allLessons
    .filter(l => !isLessonCompleted(l.id))
    .reduce((sum, l) => sum + (l.estimatedMinutes || 0), 0)

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

  const handleOpenResource = (resource: any) => {
    if (resource.external_url) {
      window.open(resource.external_url, '_blank', 'noopener,noreferrer')
      return
    }
    if (resource.resourceType === 'pdf') {
      setPdfViewerResource(resource)
      setPdfViewerOpen(true)
      return
    }
    const href = resource.href
    if (!href) return
    const token = localStorage.getItem('accessToken')
    const fullUrl = href.startsWith('http') ? href : `${api()}${href}`
    const url = new URL(fullUrl)
    if (token) url.searchParams.set('token', token)
    window.open(url.toString(), '_blank', 'noopener,noreferrer')
  }

  // Early return states (must be after all hooks)
  if (isLoadingCourse) {
    return (
      <>
      <style>{styles}</style>
      <Box sx={{ display: 'flex', height: '100%', minHeight: '100vh', overflow: 'hidden', bgcolor: '#f6fbf8' }}>
        <Box sx={{ width: 344, display: { xs: 'none', md: 'block' }, p: 2 }}>
          <Box sx={{ mb: 2 }}>
            <Skeleton variant="text" width={100} height={14} sx={{ mb: 1 }} />
            <Skeleton variant="text" width={180} height={24} sx={{ mb: 1 }} />
            <Skeleton variant="text" width={140} height={14} />
          </Box>
          {[1, 2, 3].map((i) => (
            <Box key={i} sx={{ mb: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'white', border: '1px solid rgba(24,49,83,0.08)' }}>
              <Skeleton variant="text" width={80} height={12} sx={{ mb: 0.5 }} />
              <Skeleton variant="text" width={160} height={18} sx={{ mb: 1 }} />
              <Skeleton variant="rounded" width="100%" height={8} />
            </Box>
          ))}
        </Box>
        <Box sx={{ flex: 1, p: 3 }}>
          <Skeleton variant="rounded" width="100%" height={120} sx={{ mb: 3, borderRadius: 4 }} />
          <Skeleton variant="rounded" width="100%" height={400} sx={{ borderRadius: 5 }} />
        </Box>
      </Box>
      </>
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

  const getLessonTypeIcon = (type: string) => {
    if (type === 'video') return <PlayCircleIcon sx={{ fontSize: 11 }} />
    if (type === 'quiz') return <AssignmentIcon sx={{ fontSize: 11 }} />
    return <BookIcon sx={{ fontSize: 11 }} />
  }

  // Sidebar content
  const sidebarContent = (
    <Box
      sx={{
        width: isMobile ? '100vw' : 272,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#0a2e1a',
        color: '#e2e8f0'
      }}
    >
      <Box
        sx={{
          px: 3,
          pt: 4,
          pb: 4,
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        {/* Badge */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1.5,
            py: 0.5,
            borderRadius: 0.5,
            bgcolor: 'rgba(13,110,138,0.3)',
            color: '#7ddfa8',
            mb: 2.5
          }}
        >
          <ShieldIcon sx={{ fontSize: 10 }} />
          <Typography variant='caption' sx={{ fontSize: '0.6rem', lineHeight: 1 }}>
            {course.category || 'Empleados'} · {course.isMandatory ? 'Obligatorio' : 'Voluntario'}
          </Typography>
        </Box>

        <Typography variant='body2' sx={{ fontWeight: 600, color: '#f0f4f8', lineHeight: 1.4, mb: 3 }}>
          {course.title}
        </Typography>

        {/* Progress */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant='caption' sx={{ color: 'rgba(240,244,248,0.5)', fontSize: '0.65rem' }}>
              Tu progreso
            </Typography>
            <Typography variant='caption' sx={{ color: '#7ddfa8', fontWeight: 700, fontSize: '0.7rem' }}>
              {Math.round(courseProgress.percentage)}%
            </Typography>
          </Box>
          <LinearProgress
            variant='determinate'
            value={courseProgress.percentage}
            sx={{
              height: 5,
              borderRadius: 999,
              bgcolor: 'rgba(255,255,255,0.08)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 999,
                bgcolor: '#00A651',
                transition: 'width 0.5s ease'
              }
            }}
          />
          <Typography variant='caption' sx={{ color: 'rgba(240,244,248,0.38)', fontSize: '0.65rem', mt: 0.5, display: 'block' }}>
            {courseProgress.completed} de {courseProgress.total} lecciones completadas
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        {course.modules.map((module, moduleIndex) => {
          const isExpanded = expandedModules.has(moduleIndex)
          const modCompleted = module.lessons.filter(l => isLessonCompleted(l.id)).length
          const modTotal = module.lessons.length

          return (
            <Box key={module.id} sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {/* Module header */}
              <Box
                onClick={() => handleToggleModule(moduleIndex)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 3,
                  py: 2,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' }
                }}
              >
                <Box>
                  <Typography
                    variant='caption'
                    sx={{
                      color: '#c8d8e8',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      lineHeight: 1.3,
                      display: 'block'
                    }}
                  >
                    {module.title}
                  </Typography>
                  <Typography variant='caption' sx={{ color: 'rgba(200,216,232,0.45)', fontSize: '0.6rem' }}>
                    {modCompleted}/{modTotal} lecciones
                  </Typography>
                </Box>
                <Box sx={{ color: 'rgba(200,216,232,0.5)', display: 'flex', flexShrink: 0 }}>
                  {isExpanded ? <ExpandMoreIcon sx={{ fontSize: 14 }} /> : <ChevronRightIcon sx={{ fontSize: 14 }} />}
                </Box>
              </Box>

              {/* Lessons */}
              {isExpanded && (
                <Box sx={{ pb: 0.5 }}>
                  {module.lessons.map((lesson, lessonIndex) => {
                    const isCompleted = isLessonCompleted(lesson.id)
                    const isUnlocked = isLessonUnlocked(moduleIndex, lessonIndex)
                    const isCurrent = currentModuleIndex === moduleIndex && currentLessonIndex === lessonIndex

                    return (
                      <Box
                        key={lesson.id}
                        onClick={() => isUnlocked && handleNavigateToLesson(moduleIndex, lessonIndex)}
                        sx={{
                          display: 'flex',
                          gap: 1.5,
                          pl: 3,
                          pr: 3,
                          py: 1.5,
                          cursor: isUnlocked ? 'pointer' : 'default',
                          transition: 'all 0.15s ease',
                          opacity: isUnlocked ? 1 : 0.45,
                          bgcolor: isCurrent ? 'rgba(13,110,138,0.18)' : 'transparent',
                          borderLeft: '2px solid',
                          borderLeftColor: isCurrent ? '#00A651' : 'transparent',
                          '&:hover': isUnlocked ? { bgcolor: isCurrent ? 'rgba(13,110,138,0.25)' : 'rgba(255,255,255,0.04)' } : {}
                        }}
                      >
                        {/* Status icon */}
                        <Box
                          sx={{
                            mt: 0.25,
                            flexShrink: 0,
                            color: isCompleted
                              ? '#4dc8e0'
                              : isCurrent
                              ? '#9de4f0'
                              : 'rgba(200,216,232,0.3)'
                          }}
                        >
                          {isCompleted ? (
                            <CheckIcon sx={{ fontSize: 14 }} />
                          ) : (
                            <RadioUncheckedIcon sx={{ fontSize: 14 }} />
                          )}
                        </Box>

                        {/* Text */}
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant='body2'
                            sx={{
                              fontSize: '0.7rem',
                              lineHeight: 1.3,
                              color: isCurrent
                                ? '#f0f4f8'
                                : isCompleted
                                ? 'rgba(240,244,248,0.55)'
                                : 'rgba(240,244,248,0.82)',
                              fontWeight: isCurrent ? 500 : 400
                            }}
                          >
                            {lesson.title}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <Box sx={{ color: 'rgba(200,216,232,0.35)', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {getLessonTypeIcon(lesson.type)}
                              <Typography variant='caption' sx={{ fontSize: '0.6rem', color: 'rgba(200,216,232,0.35)' }}>
                                {lesson.duration}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    )
                  })}
                </Box>
              )}
            </Box>
          )
        })}
      </Box>
    </Box>
  )

  return (
    <>
    <style>{styles}</style>
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        minHeight: '100vh',
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
            width: isMobile ? '100vw' : 272,
            boxSizing: 'border-box',
            position: 'relative',
            height: '100%',
            borderRight: 'none',
            background: '#0a2e1a'
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

        {/* Header nav */}
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            height: 52,
            borderBottom: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexShrink: 0
          }}
        >
          <IconButton onClick={() => navigate(-1)} size='small'>
            <ArrowBackIcon sx={{ fontSize: 18 }} />
          </IconButton>
          {!isMobile && !sidebarOpen && (
            <IconButton onClick={() => setSidebarOpen(true)} size='small'>
              <MenuIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}

          <Typography variant='caption' sx={{ fontWeight: 500, color: '#0f1117', fontSize: '0.7rem' }}>
            {course.title}
          </Typography>
          <Typography variant='caption' sx={{ color: '#94a3b8' }}>/</Typography>
          <Typography variant='caption' sx={{ color: '#00A651', fontWeight: 600, fontSize: '0.7rem' }}>
            {currentLesson?.title || 'Curso'}
          </Typography>
          <Box sx={{ flex: 1 }} />
        </Box>

        {/* Lesson content */}
        <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#f8fafc' }}>
          <Box sx={{ maxWidth: 1320, mx: 'auto', p: { xs: 2, md: 3 } }}>
          {currentLesson ? (
            <Box key={`${currentModuleIndex}-${currentLessonIndex}`} sx={{ ...fadeIn }}>
              {/* Title */}
              <Typography variant='h5' sx={{ fontWeight: 700, color: '#0f1117', mb: 2, fontSize: '1.25rem' }}>
                {currentLesson.title}
              </Typography>

              {/* Meta */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTimeIcon sx={{ fontSize: 13, color: '#6b6b72' }} />
                  <Typography variant='caption' sx={{ color: '#6b6b72', fontSize: '0.7rem' }}>
                    {currentLesson.duration} · {getContentTypeLabel(currentLesson.type)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PeopleIcon sx={{ fontSize: 13, color: '#6b6b72' }} />
                  <Typography variant='caption' sx={{ color: '#6b6b72', fontSize: '0.7rem' }}>
                    {course.category} · {course.isMandatory ? 'Obligatorio' : 'Voluntario'}
                  </Typography>
                </Box>
              </Box>

              {/* Content */}
              <Box sx={{ maxWidth: 720, mx: 'auto', mb: 4 }}>
                {/* Alerts */}
                {courseProgress.percentage === 100 && (
                  <Alert severity="success" sx={{ mb: 3, borderRadius: 2, border: '1px solid rgba(45,155,95,0.18)' }}>
                    <AlertTitle>Curso completado</AlertTitle>
                    Ya cerraste todo el recorrido de aprendizaje.
                    {course.hasCertificate && hasGeneratedCertificate && (
                      <Button variant="contained" color="success" size="small" startIcon={<CertificateIcon />} sx={{ ml: 2 }} onClick={handleOpenCurrentCertificate}>Abrir certificado</Button>
                    )}
                    {course.hasCertificate && !hasGeneratedCertificate && (
                      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label="Preparando certificado..." color="success" size="small" />
                        <Typography variant="body2" color="text.secondary">Seguiremos revisando automáticamente hasta que esté disponible.</Typography>
                      </Box>
                    )}
                  </Alert>
                )}

                {certificateReadyNoticeVisible && (
                  <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} action={<Button color="inherit" size="small" onClick={handleOpenCurrentCertificate}>Abrir certificado</Button>} onClose={() => setCertificateReadyNoticeVisible(false)}>
                    <AlertTitle>Certificado disponible</AlertTitle>
                    Tu certificado ya quedó listo.
                  </Alert>
                )}

                {currentLesson.type === 'quiz' && latestQuizOutcome && (
                  <Alert severity={latestQuizOutcome.passed ? 'success' : 'warning'} sx={{ mb: 3, borderRadius: 2 }}>
                    <AlertTitle>{latestQuizOutcome.passed ? 'Quiz aprobado' : 'Aún no alcanzas el puntaje mínimo'}</AlertTitle>
                    {latestQuizOutcome.passed ? (
                      latestQuizOutcome.completesCourse ? 'Completaste el curso.' : 'Ya puedes seguir con la siguiente lección.'
                    ) : (
                      <>Lograste <strong>{latestQuizOutcome.percentage}%</strong> y necesitas <strong>{latestQuizOutcome.passingPercentage}%</strong> para aprobar. {latestQuizOutcome.attemptsRemaining > 0 ? `Te quedan ${latestQuizOutcome.attemptsRemaining} intento(s).` : 'Ya no quedan intentos.'}</>
                    )}
                  </Alert>
                )}

                {/* Description / intro */}
                {currentLesson.content.description && (
                  <Typography variant='body2' sx={{ color: '#0f1117', lineHeight: 1.8, mb: 4, fontSize: '0.8rem' }}>
                    {currentLesson.content.description}
                  </Typography>
                )}

                {/* Video */}
                {currentLesson.type === 'video' && currentLesson.content.videoUrl && (
                  <Box sx={{ mb: 3 }}>
                    <LmsVideoPlayer
                      src={currentLesson.content.videoUrl}
                      videoSource={currentLesson.content.videoSource || 'youtube'}
                      title={currentLesson.title}
                      onComplete={() => handleLessonComplete(currentLesson.id)}
                    />
                  </Box>
                )}

                {/* Text */}
                {currentLesson.type === 'text' && currentLesson.content.text && (
                  <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e2e8f0', mb: 3, bgcolor: '#ffffff' }}>
                    <Typography
                      component='div'
                      sx={{
                        '& h1, & h2, & h3': { color: '#0f172a', mb: 2, mt: 3 },
                        '& p': { mb: 2, lineHeight: 1.8, color: '#334155', fontSize: '0.9rem' },
                        '& code': { bgcolor: '#f1f5f9', px: 1, borderRadius: 1, fontFamily: 'monospace' },
                        '& pre': { bgcolor: '#0f172a', color: '#e2e8f0', p: 2, borderRadius: 1, overflow: 'auto' },
                        '& ul, & ol': { mb: 2, pl: 3 },
                        '& li': { mb: 1, color: '#334155' }
                      }}
                      dangerouslySetInnerHTML={{ __html: currentLesson.content.text }}
                    />
                  </Paper>
                )}

                {/* Quiz */}
                {currentLesson.type === 'quiz' && currentQuizConfig && (
                  <LmsQuizPlayer
                    quizConfig={currentQuizConfig}
                    userAttempts={userQuizAttempts}
                    onComplete={handleQuizComplete}
                  />
                )}



                {/* Resources */}
                {!!currentLesson.content.resources?.length && (
                  <Box sx={{ pt: 2 }}>
                    <Typography variant='body2' sx={{ fontWeight: 600, color: '#0f1117', mb: 2, fontSize: '0.85rem' }}>
                      Recursos de apoyo
                    </Typography>
                    <Stack spacing={1.5}>
                      {currentLesson.content.resources.map((resource) => (
                        <Box
                          key={resource.id}
                          onClick={() => handleOpenResource(resource)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            px: 2,
                            py: 1.5,
                            borderRadius: 2,
                            border: '1px solid #e2e8f0',
                            bgcolor: '#ffffff',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            '&:hover': { borderColor: '#00A651', bgcolor: '#f8fbfc' },
                            '&:hover .resource-download': { color: '#00A651' }
                          }}
                        >
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: 1,
                              bgcolor: '#f0eeea',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            {resource.resourceType === 'link' ? (
                              <ExternalLinkIcon sx={{ fontSize: 14, color: '#00A651' }} />
                            ) : (
                              <DescriptionIcon sx={{ fontSize: 14, color: '#00A651' }} />
                            )}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant='body2' sx={{ fontWeight: 500, color: '#0f1117', fontSize: '0.75rem' }}>
                              {resource.title}
                            </Typography>
                            <Typography variant='caption' sx={{ color: '#6b6b72', fontSize: '0.65rem' }}>
                              {resource.resourceType === 'pdf' ? 'PDF' : resource.resourceType === 'link' ? 'Enlace' : 'Documento'}
                              {resource.description ? ` · ${resource.description}` : ''}
                            </Typography>
                          </Box>
                          <DownloadIcon sx={{ fontSize: 13, color: '#6b6b72', flexShrink: 0, transition: 'color 0.15s ease' }} className="resource-download" />
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Box>

              {/* Footer - completion toggle + CTA */}
              <Box
                sx={{
                  mt: 4,
                  pt: 3,
                  pb: 1,
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2
                }}
              >
                {/* Mark complete toggle */}
                <Box
                  onClick={() => {
                    if (!currentLessonCompleted && currentLesson && currentLesson.type !== 'quiz') {
                      handleLessonComplete(currentLesson.id)
                    }
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    cursor: currentLesson && currentLesson.type !== 'quiz' ? 'pointer' : 'default',
                    userSelect: 'none'
                  }}
                >
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: 0.5,
                      border: '2px solid',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                      borderColor: currentLessonCompleted ? '#00A651' : '#d1d5db',
                      bgcolor: currentLessonCompleted ? '#00A651' : 'transparent'
                    }}
                  >
                    {currentLessonCompleted && <CheckIcon sx={{ fontSize: 13, color: '#ffffff' }} />}
                  </Box>
                  <Typography variant='caption' sx={{ color: currentLessonCompleted ? '#00A651' : '#6b6b72', fontWeight: 500, fontSize: '0.75rem' }}>
                    {currentLessonCompleted ? 'Completado' : 'Marcar como completado'}
                  </Typography>
                </Box>

                {/* CTA */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography variant='caption' sx={{ color: '#6b6b72', fontSize: '0.65rem', display: { xs: 'none', sm: 'block' } }}>
                    Lección {currentLessonGlobalIndex} de {totalLessons}
                    {estimatedMinutesRemaining > 0 ? ` · ~${Math.max(1, estimatedMinutesRemaining)} min` : ''}
                  </Typography>
                  {currentLesson && currentLesson.type !== 'quiz' && !currentLessonCompleted && (
                    <Button
                      variant='contained'
                      size='small'
                      onClick={() => handleLessonComplete(currentLesson.id)}
                      disabled={updateProgressMutation.isLoading}
                      endIcon={<ChevronRightIcon />}
                      sx={{
                        borderRadius: 1,
                        px: 2.5,
                        py: 1,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        bgcolor: '#00A651',
                        '&:hover': { bgcolor: '#005c38', opacity: 0.9 },
                        '&:active': { transform: 'scale(0.98)' },
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {updateProgressMutation.isLoading ? 'Guardando...' : 'Completar y continuar'}
                    </Button>
                  )}
                  {currentLessonCompleted && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant='outlined'
                        size='small'
                        startIcon={<SkipPreviousIcon />}
                        onClick={handlePreviousLesson}
                        disabled={!prevLesson}
                        sx={{ borderRadius: 1, px: 2, fontSize: '0.75rem', borderColor: '#d1d5db', color: '#374151' }}
                      >
                        {isMobile ? 'Anterior' : 'Lección Anterior'}
                      </Button>
                      <Button
                        variant='contained'
                        size='small'
                        endIcon={<SkipNextIcon />}
                        onClick={handleNextLesson}
                        disabled={!nextLesson || !isLessonUnlocked(nextLesson.moduleIndex, nextLesson.lessonIndex)}
                        sx={{ borderRadius: 1, px: 2, fontSize: '0.75rem', bgcolor: '#00A651', '&:hover': { bgcolor: '#005c38' } }}
                      >
                        {isMobile ? 'Siguiente' : 'Siguiente Lección'}
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant='h6' color='text.secondary'>No hay contenido disponible</Typography>
            </Box>
          )}
          </Box>
        </Box>
      </Box>

      {/* Completion Dialog */}
      <Dialog open={showCompletionDialog} onClose={() => setShowCompletionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
          <Box sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2d9b5f 0%, #53cf89 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
            animation: 'fadeSlideIn 0.5s ease-out'
          }}>
            <CertificateIcon sx={{ fontSize: 44, color: 'white' }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#183153' }}>
            ¡Felicitaciones!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Has completado exitosamente el curso
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d9b5f', mt: 0.5 }}>
            "{course.title}"
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Paper variant='outlined' sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(248,252,249,0.8)' }}>
              <Stack direction='row' spacing={3} justifyContent='center' divider={<Divider orientation='vertical' flexItem />}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant='h4' sx={{ fontWeight: 800, color: '#2d9b5f' }}>{courseProgress.completed}</Typography>
                  <Typography variant='caption' color='text.secondary'>Lecciones</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant='h4' sx={{ fontWeight: 800, color: '#183153' }}>{Math.round(courseProgress.percentage)}%</Typography>
                  <Typography variant='caption' color='text.secondary'>Progreso</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant='h4' sx={{ fontWeight: 800, color: '#0e6ba8' }}>{course.duration}</Typography>
                  <Typography variant='caption' color='text.secondary'>Duración</Typography>
                </Box>
              </Stack>
            </Paper>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Ya puedes cerrar esta etapa del aprendizaje y revisar tu certificado o volver a tu ruta.
              </Typography>
              {course.hasCertificate && hasGeneratedCertificate && (
                <Typography variant="body2" color="success.main" sx={{ mt: 1, fontWeight: 600 }}>
                  Tu certificado está listo para descargar.
                </Typography>
              )}
              {course.hasCertificate && !hasGeneratedCertificate && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Tu certificado se está preparando y lo seguiremos revisando automáticamente en esta pantalla.
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 1 }}>
          {course.hasCertificate && hasGeneratedCertificate && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CertificateIcon />}
              sx={{ borderRadius: 999, px: 3 }}
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
              sx={{ borderRadius: 999, px: 3 }}
              onClick={() => navigate('/lms/certificates')}
            >
              Ir a mis certificados
            </Button>
          )}
          <Button
            variant="outlined"
            onClick={() => setShowCompletionDialog(false)}
            sx={{ borderRadius: 999, px: 3 }}
          >
            Continuar
          </Button>
        </DialogActions>
      </Dialog>

      {/* PDF Secure Viewer */}
      <Dialog
        open={pdfViewerOpen}
        onClose={() => setPdfViewerOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {pdfViewerResource?.title || 'Documento PDF'}
            </Typography>
            <IconButton onClick={() => setPdfViewerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, bgcolor: '#f5f5f5' }}>
          {pdfViewerResource && (
            <PDFViewer
              downloadUrl={`/lms/content/resources/${pdfViewerResource.id}/download`}
              allowDownload={false}
              allowOpen={false}
              buttons={false}
              disableContextMenu
            />
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', p: 2 }}>
          <Button
            variant="contained"
            onClick={() => setPdfViewerOpen(false)}
            sx={{ borderRadius: 999, px: 3 }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
    </>
  )
}

export default LmsCourseView
