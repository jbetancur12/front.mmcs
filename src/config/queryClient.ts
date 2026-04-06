import { QueryClient } from 'react-query'

/**
 * React Query configuration
 *
 * Default options for queries and mutations across the application.
 * Optimized for LMS and general API usage.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Refetch on window focus (good for real-time data)
      refetchOnWindowFocus: true,

      // Refetch on reconnect (network recovery)
      refetchOnReconnect: true,

      // Retry failed requests (3 times with exponential backoff)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Stale time: Data considered fresh for 5 minutes
      // After this, data is marked stale and will refetch on next access
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Cache time: Keep unused data in cache for 10 minutes
      // After this, data is garbage collected
      cacheTime: 10 * 60 * 1000, // 10 minutes

      // Suspense mode disabled by default (can be enabled per-query)
      suspense: false,

      // Don't refetch on mount if data is fresh
      refetchOnMount: true,

      // Keep previous data while fetching new data (better UX)
      keepPreviousData: true
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      retryDelay: 1000
    }
  }
})

/**
 * Query keys factory for LMS
 *
 * Centralized query keys for better cache management and invalidation.
 * Use these constants to ensure consistency across the application.
 */
export const queryKeys = {
  // Courses
  courses: {
    all: ['courses'] as const,
    lists: () => [...queryKeys.courses.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.courses.lists(), filters] as const,
    available: (scope?: string) => [...queryKeys.courses.all, 'available', scope] as const,
    details: () => [...queryKeys.courses.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.courses.details(), id] as const,
    stats: (id: number) => [...queryKeys.courses.detail(id), 'stats'] as const,
    preview: (id: number) => [...queryKeys.courses.all, 'preview', id] as const
  },

  // Progress
  progress: {
    all: ['progress'] as const,
    user: (userId?: number) => [...queryKeys.progress.all, 'user', userId] as const,
    course: (courseId: number, userId?: number) =>
      [...queryKeys.progress.all, 'course', courseId, userId] as const
  },

  // Certificates
  certificates: {
    all: ['certificates'] as const,
    user: (userId?: number) => [...queryKeys.certificates.all, 'user', userId] as const,
    detail: (id: number) => [...queryKeys.certificates.all, 'detail', id] as const,
    templates: () => [...queryKeys.certificates.all, 'templates'] as const,
    templatePreview: (id: number) => [...queryKeys.certificates.all, 'templates', id, 'preview'] as const
  },

  // Assignments
  assignments: {
    all: ['assignments'] as const,
    user: (userId?: number) => [...queryKeys.assignments.all, 'user', userId] as const,
    course: (courseId: number) => [...queryKeys.assignments.all, 'course', courseId] as const
  },

  // Quizzes
  quizzes: {
    all: ['quizzes'] as const,
    detail: (id: number) => [...queryKeys.quizzes.all, 'detail', id] as const,
    attempts: (quizId: number, userId?: number) =>
      [...queryKeys.quizzes.detail(quizId), 'attempts', userId] as const
  },

  // Analytics
  analytics: {
    all: ['analytics'] as const,
    dashboard: (filters?: any) => [...queryKeys.analytics.all, 'dashboard', filters] as const,
    course: (courseId: number) => [...queryKeys.analytics.all, 'course', courseId] as const,
    user: (userId?: number) => [...queryKeys.analytics.all, 'user', userId] as const
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: () => [...queryKeys.notifications.all, 'list'] as const
  },

  // LMS context
  lms: {
    all: ['lms'] as const,
    permissions: () => [...queryKeys.lms.all, 'permissions'] as const
  },

  // Content
  content: {
    all: ['content'] as const,
    modules: (courseId: number) => [...queryKeys.content.all, 'modules', courseId] as const,
    lessons: (moduleId: number) => [...queryKeys.content.all, 'lessons', moduleId] as const
  },

  // Jobs
  jobs: {
    all: ['jobs'] as const,
    queueStats: () => [...queryKeys.jobs.all, 'queue', 'stats'] as const,
    failedJobs: (limit?: number) => [...queryKeys.jobs.all, 'failed', limit] as const,
    detail: (jobId: string) => [...queryKeys.jobs.all, 'detail', jobId] as const,
    schedulerStatus: () => [...queryKeys.jobs.all, 'scheduler', 'status'] as const,
    reminderStatus: () => [...queryKeys.jobs.all, 'reminders', 'status'] as const,
    statistics: () => [...queryKeys.jobs.all, 'statistics'] as const,
    dashboard: () => [...queryKeys.jobs.all, 'dashboard'] as const,
    health: () => [...queryKeys.jobs.all, 'health'] as const
  }
}

export default queryClient
