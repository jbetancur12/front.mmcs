import { useQuery, useMutation, useQueryClient, UseMutationOptions } from 'react-query'
import { useStore } from '@nanostores/react'
import { lmsService } from 'src/services/lmsService'
import { queryKeys } from 'src/config/queryClient'
import { userStore } from 'src/store/userStore'
import type {
  Course,
  CourseQueryParams,
  CreateCourseRequest,
  UpdateCourseRequest,
  OverallUserProgressResponse,
  ProgressUpdateResult,
  UpdateProgressRequest,
  Quiz,
  QuizSubmissionResult,
  SubmitQuizRequest,
  Certificate,
  CertificateTemplate,
  SaveCertificateTemplateRequest,
  CertificateTemplatePreviewResponse,
  CreateAssignmentRequest,
  CreateAssignmentResult,
  CreateQuizRequest,
  LmsPermissions,
  UpdateAssignmentResult,
  CourseProgressResponse
} from 'src/services/lmsService'
import { Toast } from 'src/Components/ExcelManipulation/Utils'

// ===========================
// Course Hooks
// ===========================

/**
 * Get all courses (Admin/Training Manager)
 */
export const useCourses = (
  params?: CourseQueryParams,
  options?: any
) => {
  return useQuery(
    queryKeys.courses.list(params),
    () => lmsService.getCourses(params),
    {
      staleTime: 3 * 60 * 1000, // 3 minutes
      ...options
    }
  )
}

/**
 * Get available courses for current user
 */
export const useAvailableCourses = (
  options?: any
) => {
  const $userStore = useStore(userStore)
  const scopeKey = `${$userStore.email || 'anonymous'}-${$userStore.customer?.id || 'internal'}-${$userStore.userType || 'unknown'}`

  return useQuery<Course[]>(
    queryKeys.courses.available(scopeKey),
    () => lmsService.getAvailableCourses(),
    {
      staleTime: 0,
      refetchOnMount: 'always',
      ...options
    }
  )
}

/**
 * Get current user's LMS permissions and user type context
 */
export const useLmsPermissions = (
  options?: any
) => {
  return useQuery<LmsPermissions>(
    queryKeys.lms.permissions(),
    () => lmsService.getMyPermissions(),
    {
      staleTime: 5 * 60 * 1000,
      ...options
    }
  )
}

/**
 * Get single course by ID
 */
export const useCourse = (
  id: number,
  options?: any
) => {
  return useQuery(
    queryKeys.courses.detail(id),
    () => lmsService.getCourse(id),
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000, // 5 minutes
      ...options
    }
  )
}

/**
 * Get course preview (no auth)
 */
export const useCoursePreview = (
  id: number,
  options?: any
) => {
  return useQuery(
    queryKeys.courses.preview(id),
    () => lmsService.getCoursePreview(id),
    {
      enabled: !!id,
      staleTime: 10 * 60 * 1000, // 10 minutes (public data)
      ...options
    }
  )
}

/**
 * Get course statistics
 */
export const useCourseStats = (
  id: number,
  options?: any
) => {
  return useQuery(
    queryKeys.courses.stats(id),
    () => lmsService.getCourseStats(id),
    {
      enabled: !!id,
      staleTime: 2 * 60 * 1000, // 2 minutes
      ...options
    }
  )
}

/**
 * Create a new course
 */
export const useCreateCourse = (
  options?: UseMutationOptions<Course, Error, CreateCourseRequest>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    (data: CreateCourseRequest) => lmsService.createCourse(data),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate courses list to refetch
        queryClient.invalidateQueries(queryKeys.courses.lists())

        Toast.fire({
          icon: 'success',
          title: 'Curso creado exitosamente'
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al crear curso',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

/**
 * Update a course
 */
export const useUpdateCourse = (
  options?: UseMutationOptions<Course, Error, { id: number; data: UpdateCourseRequest }>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    ({ id, data }: { id: number; data: UpdateCourseRequest }) =>
      lmsService.updateCourse(id, data),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate specific course and lists
        queryClient.invalidateQueries(queryKeys.courses.detail(variables.id))
        queryClient.invalidateQueries(queryKeys.courses.lists())

        Toast.fire({
          icon: 'success',
          title: 'Curso actualizado exitosamente'
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al actualizar curso',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

/**
 * Delete a course
 */
export const useDeleteCourse = (
  options?: UseMutationOptions<void, Error, number>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    (id: number) => lmsService.deleteCourse(id),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate courses list
        queryClient.invalidateQueries(queryKeys.courses.lists())

        Toast.fire({
          icon: 'success',
          title: 'Curso eliminado exitosamente'
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al eliminar curso',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

/**
 * Publish a course
 */
export const usePublishCourse = (
  options?: UseMutationOptions<Course, Error, number>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    (id: number) => lmsService.publishCourse(id),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate specific course and lists
        queryClient.invalidateQueries(queryKeys.courses.detail(variables))
        queryClient.invalidateQueries(queryKeys.courses.lists())

        Toast.fire({
          icon: 'success',
          title: 'Curso publicado exitosamente'
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al publicar curso',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

/**
 * Archive a course
 */
export const useArchiveCourse = (
  options?: UseMutationOptions<Course, Error, number>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    (id: number) => lmsService.archiveCourse(id),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate specific course and lists
        queryClient.invalidateQueries(queryKeys.courses.detail(variables))
        queryClient.invalidateQueries(queryKeys.courses.lists())

        Toast.fire({
          icon: 'success',
          title: 'Curso archivado exitosamente'
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al archivar curso',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

/**
 * Duplicate a course
 */
export const useDuplicateCourse = (
  options?: UseMutationOptions<Course, Error, { id: number; newTitle?: string }>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    ({ id, newTitle }: { id: number; newTitle?: string }) =>
      lmsService.duplicateCourse(id, newTitle),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate courses list
        queryClient.invalidateQueries(queryKeys.courses.lists())

        Toast.fire({
          icon: 'success',
          title: 'Curso duplicado exitosamente'
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al duplicar curso',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

// ===========================
// Progress Hooks
// ===========================

/**
 * Get user progress for all courses
 */
export const useUserProgress = (
  userId?: number,
  options?: any
) => {
  return useQuery<OverallUserProgressResponse>(
    queryKeys.progress.user(userId),
    () => lmsService.getUserProgress(userId),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      ...options
    }
  )
}

/**
 * Get course progress for a user
 */
export const useCourseProgress = (
  courseId: number,
  userId?: number,
  options?: any
) => {
  return useQuery<CourseProgressResponse>(
    queryKeys.progress.course(courseId, userId),
    () => lmsService.getCourseProgress(courseId, userId),
    {
      enabled: !!courseId,
      staleTime: 1 * 60 * 1000, // 1 minute (frequently updated)
      ...options
    }
  )
}

/**
 * Update progress (mark lesson as completed)
 */
export const useUpdateProgress = (
  options?: UseMutationOptions<ProgressUpdateResult, Error, UpdateProgressRequest>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    (data: UpdateProgressRequest) => lmsService.updateProgress(data),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate progress queries
        queryClient.invalidateQueries(queryKeys.progress.all)

        // Optionally show success message
        if (variables.action === 'complete') {
          Toast.fire({
            icon: 'success',
            title: 'Progreso actualizado',
            timer: 2000
          })
        }

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al actualizar progreso',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

/**
 * Complete a lesson
 */
export const useCompleteLesson = (
  options?: UseMutationOptions<ProgressUpdateResult, Error, { lessonId: number; timeSpent?: number }>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    ({ lessonId, timeSpent }: { lessonId: number; timeSpent?: number }) =>
      lmsService.completeLesson(lessonId, timeSpent),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate progress queries
        queryClient.invalidateQueries(queryKeys.progress.all)

        Toast.fire({
          icon: 'success',
          title: 'Lección completada',
          timer: 2000
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al completar lección',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

// ===========================
// Quiz Hooks
// ===========================

/**
 * Get quiz by ID
 */
export const useQuiz = (
  id: number,
  options?: any
) => {
  return useQuery(
    queryKeys.quizzes.detail(id),
    () => lmsService.getQuiz(id),
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000, // 5 minutes
      ...options
    }
  )
}

/**
 * Create a quiz
 */
export const useCreateQuiz = (
  options?: UseMutationOptions<Quiz, Error, CreateQuizRequest>
) => {
  return useMutation(
    (data: CreateQuizRequest) => lmsService.createQuiz(data),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        Toast.fire({
          icon: 'success',
          title: 'Quiz creado exitosamente'
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al crear quiz',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

/**
 * Update a quiz
 */
export const useUpdateQuiz = (
  options?: UseMutationOptions<Quiz, Error, { id: number; data: Partial<CreateQuizRequest> }>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    ({ id, data }: { id: number; data: Partial<CreateQuizRequest> }) =>
      lmsService.updateQuiz(id, data),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries(queryKeys.quizzes.detail(variables.id))

        Toast.fire({
          icon: 'success',
          title: 'Quiz actualizado exitosamente'
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al actualizar quiz',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

/**
 * Delete a quiz
 */
export const useDeleteQuiz = (
  options?: UseMutationOptions<void, Error, number>
) => {
  return useMutation(
    (id: number) => lmsService.deleteQuiz(id),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        Toast.fire({
          icon: 'success',
          title: 'Quiz eliminado exitosamente'
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al eliminar quiz',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

/**
 * Submit quiz attempt
 */
export const useSubmitQuiz = (
  options?: UseMutationOptions<QuizSubmissionResult, Error, { quizId: number; data: SubmitQuizRequest }>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    ({ quizId, data }: { quizId: number; data: SubmitQuizRequest }) =>
      lmsService.submitQuiz(quizId, data),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate quiz attempts
        queryClient.invalidateQueries(queryKeys.quizzes.attempts(variables.quizId))
        queryClient.invalidateQueries(queryKeys.progress.all)

        const passed = data.results.passed
        Toast.fire({
          icon: passed ? 'success' : 'warning',
          title: passed ? '¡Quiz aprobado!' : 'Quiz no aprobado',
          text: `Puntuación: ${data.results.percentage}%`
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al enviar quiz',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

/**
 * Get quiz attempts
 */
export const useQuizAttempts = (
  quizId: number,
  userId?: number,
  options?: any
) => {
  return useQuery(
    queryKeys.quizzes.attempts(quizId, userId),
    () => lmsService.getQuizAttempts(quizId, userId),
    {
      enabled: !!quizId,
      staleTime: 2 * 60 * 1000, // 2 minutes
      ...options
    }
  )
}

// ===========================
// Certificate Hooks
// ===========================

/**
 * Get user certificates
 */
export const useUserCertificates = (
  userId?: number,
  options?: any
) => {
  return useQuery(
    queryKeys.certificates.user(userId),
    () => lmsService.getUserCertificates(userId),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      ...options
    }
  )
}

/**
 * Get single certificate
 */
export const useCertificate = (
  id: number,
  options?: any
) => {
  return useQuery(
    queryKeys.certificates.detail(id),
    () => lmsService.getCertificate(id),
    {
      enabled: !!id,
      staleTime: 10 * 60 * 1000, // 10 minutes (rarely changes)
      ...options
    }
  )
}

/**
 * Generate certificate
 */
export const useGenerateCertificate = (
  options?: UseMutationOptions<Certificate, Error, { courseId: number; userId?: number }>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    ({ courseId, userId }: { courseId: number; userId?: number }) =>
      lmsService.generateCertificate(courseId, userId),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate certificates
        queryClient.invalidateQueries(queryKeys.certificates.user(variables.userId))

        Toast.fire({
          icon: 'success',
          title: 'Certificado generado exitosamente'
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al generar certificado',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

/**
 * Download certificate
 */
export const useDownloadCertificate = (
  options?: UseMutationOptions<Blob, Error, number>
) => {
  return useMutation(
    (certificateId: number) => lmsService.downloadCertificate(certificateId),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Create download link
        const url = window.URL.createObjectURL(data)
        const link = document.createElement('a')
        link.href = url
        link.download = `certificado-${variables}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        Toast.fire({
          icon: 'success',
          title: 'Certificado descargado',
          timer: 2000
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al descargar certificado',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

export const useCertificateTemplates = (options?: any) => {
  return useQuery(
    queryKeys.certificates.templates(),
    () => lmsService.getCertificateTemplates(),
    {
      staleTime: 2 * 60 * 1000,
      ...options
    }
  )
}

export const useCreateCertificateTemplate = (
  options?: UseMutationOptions<CertificateTemplate, Error, SaveCertificateTemplateRequest>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    (data: SaveCertificateTemplateRequest) => lmsService.createCertificateTemplate(data),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries(queryKeys.certificates.templates())
        Toast.fire({
          icon: 'success',
          title: 'Plantilla creada exitosamente'
        })
        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al crear plantilla',
          text: error.message
        })
        options?.onError?.(error, variables, context)
      }
    }
  )
}

export const useUpdateCertificateTemplate = (
  options?: UseMutationOptions<
    CertificateTemplate,
    Error,
    { id: number; data: SaveCertificateTemplateRequest }
  >
) => {
  const queryClient = useQueryClient()

  return useMutation(
    ({ id, data }: { id: number; data: SaveCertificateTemplateRequest }) =>
      lmsService.updateCertificateTemplate(id, data),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries(queryKeys.certificates.templates())
        queryClient.invalidateQueries(queryKeys.certificates.templatePreview(variables.id))
        Toast.fire({
          icon: 'success',
          title: 'Plantilla actualizada exitosamente'
        })
        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al actualizar plantilla',
          text: error.message
        })
        options?.onError?.(error, variables, context)
      }
    }
  )
}

export const useDeleteCertificateTemplate = (
  options?: UseMutationOptions<void, Error, number>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    (id: number) => lmsService.deleteCertificateTemplate(id),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries(queryKeys.certificates.templates())
        Toast.fire({
          icon: 'success',
          title: 'Plantilla eliminada exitosamente'
        })
        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al eliminar plantilla',
          text: error.message
        })
        options?.onError?.(error, variables, context)
      }
    }
  )
}

export const usePreviewCertificateTemplate = (
  id?: number,
  options?: any
) => {
  return useQuery<CertificateTemplatePreviewResponse>(
    queryKeys.certificates.templatePreview(id || 0),
    () => lmsService.previewCertificateTemplate(id || 0),
    {
      enabled: !!id,
      staleTime: 60 * 1000,
      ...options
    }
  )
}

// ===========================
// Assignment Hooks
// ===========================

/**
 * Get course assignments
 */
export const useCourseAssignments = (
  courseId: number,
  options?: any
) => {
  return useQuery(
    queryKeys.assignments.course(courseId),
    async () => (await lmsService.getCourseAssignments(courseId)).assignments,
    {
      enabled: !!courseId,
      staleTime: 3 * 60 * 1000, // 3 minutes
      ...options
    }
  )
}

/**
 * Get user assignments
 */
export const useUserAssignments = (
  userId?: number,
  options?: any
) => {
  return useQuery(
    queryKeys.assignments.user(userId),
    async () => (await lmsService.getUserAssignments(userId)).assignments,
    {
      staleTime: 3 * 60 * 1000, // 3 minutes
      ...options
    }
  )
}

/**
 * Create assignment
 */
export const useCreateAssignment = (
  options?: UseMutationOptions<CreateAssignmentResult, Error, CreateAssignmentRequest>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    (data: CreateAssignmentRequest) => lmsService.createAssignment(data),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate assignments
        queryClient.invalidateQueries(queryKeys.assignments.course(variables.course_id))
        queryClient.invalidateQueries(queryKeys.assignments.all)

        Toast.fire({
          icon: 'success',
          title: 'Asignación creada exitosamente'
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al crear asignación',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

/**
 * Update assignment
 */
export const useUpdateAssignment = (
  options?: UseMutationOptions<UpdateAssignmentResult, Error, { id: number; data: Partial<CreateAssignmentRequest> }>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    ({ id, data }: { id: number; data: Partial<CreateAssignmentRequest> }) =>
      lmsService.updateAssignment(id, data),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate all assignments
        queryClient.invalidateQueries(queryKeys.assignments.all)

        Toast.fire({
          icon: 'success',
          title: 'Asignación actualizada exitosamente'
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al actualizar asignación',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

/**
 * Delete assignment
 */
export const useDeleteAssignment = (
  options?: UseMutationOptions<void, Error, number>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    (id: number) => lmsService.deleteAssignment(id),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate all assignments
        queryClient.invalidateQueries(queryKeys.assignments.all)

        Toast.fire({
          icon: 'success',
          title: 'Asignación eliminada exitosamente'
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al eliminar asignación',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

// ===========================
// Analytics Hooks
// ===========================

/**
 * Get LMS analytics dashboard data
 */
export const useLmsAnalytics = (
  params?: { startDate?: string; endDate?: string },
  options?: any
) => {
  return useQuery(
    queryKeys.analytics.dashboard(params),
    () => lmsService.getAnalytics(params),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      ...options
    }
  )
}

/**
 * Get comprehensive dashboard analytics with enhanced metrics
 */
export const useComprehensiveDashboard = (
  params?: { 
    startDate?: string; 
    endDate?: string; 
    userType?: string;
    courseStatus?: string;
  },
  options?: any
) => {
  return useQuery(
    ['analytics', 'comprehensive-dashboard', params],
    () => lmsService.getComprehensiveDashboard(params),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes for real-time data
      refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
      ...options
    }
  )
}

/**
 * Get quiz performance analytics
 */
export const useQuizPerformanceAnalytics = (
  params?: {
    courseId?: number;
    quizId?: number;
    startDate?: string;
    endDate?: string;
    includeQuestionAnalysis?: boolean;
  },
  options?: any
) => {
  return useQuery(
    ['analytics', 'quiz-performance', params],
    () => lmsService.getQuizPerformanceAnalytics(params),
    {
      staleTime: 3 * 60 * 1000, // 3 minutes
      ...options
    }
  )
}

/**
 * Get mandatory training analytics with enhanced tracking
 */
export const useMandatoryTrainingAnalytics = (
  params?: {
    courseId?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    includeEscalation?: boolean;
  },
  options?: any
) => {
  return useQuery(
    ['analytics', 'mandatory-training-analytics', params],
    () => lmsService.getMandatoryTrainingAnalytics(params),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes for real-time tracking
      refetchInterval: 3 * 60 * 1000, // Auto-refresh every 3 minutes
      ...options
    }
  )
}

/**
 * Trigger manual reminders
 */
export const useTriggerManualReminders = (
  options?: UseMutationOptions<any, Error, { assignmentIds: number[]; customMessage?: string }>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    (data: { assignmentIds: number[]; customMessage?: string }) =>
      lmsService.triggerManualReminders(data),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate related queries
        queryClient.invalidateQueries(['analytics', 'reminder-analytics'])
        queryClient.invalidateQueries(['analytics', 'pending-notifications'])
        queryClient.invalidateQueries(['analytics', 'mandatory-training-analytics'])
        queryClient.invalidateQueries(['analytics', 'mandatory-training'])
        queryClient.invalidateQueries(queryKeys.assignments.all)

        Toast.fire({
          icon: 'success',
          title: 'Recordatorios enviados exitosamente',
          text: `${data.totalNotifications} notificaciones enviadas`
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al enviar recordatorios',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

/**
 * Get assignment management analytics
 */
export const useAssignmentManagementAnalytics = (
  params?: {
    role?: string;
    department?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    includeOverdue?: boolean;
  },
  options?: any
) => {
  return useQuery(
    ['analytics', 'assignment-management', params],
    () => lmsService.getAssignmentManagementAnalytics(params),
    {
      staleTime: 3 * 60 * 1000, // 3 minutes
      ...options
    }
  )
}

/**
 * Get mandatory training status
 */
export const useMandatoryTrainingStatus = (
  params?: {
    role?: string;
    userId?: number;
    includeCompleted?: boolean;
    sortBy?: string;
    sortOrder?: string;
  },
  options?: any
) => {
  return useQuery(
    ['analytics', 'mandatory-training', params],
    () => lmsService.getMandatoryTrainingStatus(params),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      ...options
    }
  )
}

/**
 * Get course analytics
 */
export const useCourseAnalytics = (
  courseId: number,
  options?: any
) => {
  return useQuery(
    queryKeys.analytics.course(courseId),
    () => lmsService.getCourseAnalytics(courseId),
    {
      enabled: !!courseId,
      staleTime: 3 * 60 * 1000, // 3 minutes
      ...options
    }
  )
}

/**
 * Get user analytics
 */
export const useUserAnalytics = (
  userId?: number,
  options?: any
) => {
  return useQuery(
    queryKeys.analytics.user(userId),
    () => lmsService.getUserAnalytics(userId),
    {
      staleTime: 3 * 60 * 1000, // 3 minutes
      ...options
    }
  )
}

// ===========================
// Notification Hooks
// ===========================

/**
 * Get user notifications
 */
export const useNotifications = (
  options?: any
) => {
  return useQuery(
    queryKeys.notifications.list(),
    () => lmsService.getNotifications(),
    {
      staleTime: 1 * 60 * 1000, // 1 minute (frequently updated)
      refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
      ...options
    }
  )
}

/**
 * Mark notification as read
 */
export const useMarkNotificationAsRead = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    (id: string) => lmsService.markNotificationAsRead(id),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate notifications
        queryClient.invalidateQueries(queryKeys.notifications.list())

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        console.error('Error marking notification as read:', error)
        options?.onError?.(error, variables, context)
      }
    }
  )
}

/**
 * Mark all notifications as read
 */
export const useMarkAllNotificationsAsRead = (
  options?: UseMutationOptions<void, Error, void>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    () => lmsService.markAllNotificationsAsRead(),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate notifications
        queryClient.invalidateQueries(queryKeys.notifications.list())

        Toast.fire({
          icon: 'success',
          title: 'Todas las notificaciones marcadas como leídas',
          timer: 2000
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al marcar notificaciones',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

// ===========================
// Export all hooks
// ===========================

export default {
  // Courses
  useCourses,
  useAvailableCourses,
  useCourse,
  useCoursePreview,
  useCourseStats,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
  usePublishCourse,
  useArchiveCourse,
  useDuplicateCourse,

  // Progress
  useUserProgress,
  useCourseProgress,
  useUpdateProgress,
  useCompleteLesson,

  // Quizzes
  useQuiz,
  useCreateQuiz,
  useUpdateQuiz,
  useDeleteQuiz,
  useSubmitQuiz,
  useQuizAttempts,

  // Certificates
  useUserCertificates,
  useCertificate,
  useGenerateCertificate,
  useDownloadCertificate,

  // Assignments
  useCourseAssignments,
  useUserAssignments,
  useCreateAssignment,
  useUpdateAssignment,
  useDeleteAssignment,

  // Analytics
  useLmsAnalytics,
  useCourseAnalytics,
  useUserAnalytics,

  // Notifications
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead
}
