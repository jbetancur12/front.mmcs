import { useQuery, useMutation, useQueryClient, UseMutationOptions } from 'react-query'
import { jobService } from 'src/services/jobService'
import { queryKeys } from 'src/config/queryClient'
import type {
  CleanupJobRequest
} from 'src/services/jobService'
import { Toast } from 'src/Components/ExcelManipulation/Utils'

// ===========================
// Queue Management Hooks
// ===========================

/**
 * Get queue statistics
 */
export const useQueueStats = (
  options?: any
) => {
  return useQuery(
    queryKeys.jobs.queueStats(),
    () => jobService.getQueueStats(),
    {
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 60 * 1000, // Auto-refetch every minute
      ...options
    }
  )
}

/**
 * Get failed jobs
 */
export const useFailedJobs = (
  limit = 10,
  options?: any
) => {
  return useQuery(
    queryKeys.jobs.failedJobs(limit),
    () => jobService.getFailedJobs(limit),
    {
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 2 * 60 * 1000, // Auto-refetch every 2 minutes
      ...options
    }
  )
}

/**
 * Get job details
 */
export const useJob = (
  jobId: string,
  options?: any
) => {
  return useQuery(
    queryKeys.jobs.detail(jobId),
    () => jobService.getJob(jobId),
    {
      enabled: !!jobId,
      staleTime: 10 * 1000, // 10 seconds
      refetchInterval: 5 * 1000, // Auto-refetch every 5 seconds for active jobs
      ...options
    }
  )
}

/**
 * Retry failed job
 */
export const useRetryFailedJob = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    (jobId: string) => jobService.retryFailedJob(jobId),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate failed jobs and queue stats
        queryClient.invalidateQueries(queryKeys.jobs.failedJobs())
        queryClient.invalidateQueries(queryKeys.jobs.queueStats())

        Toast.fire({
          icon: 'success',
          title: 'Job reintentado exitosamente'
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al reintentar job',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

/**
 * Clean completed jobs
 */
export const useCleanCompletedJobs = (
  options?: UseMutationOptions<{ cleanedCount: number }, Error, number>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    (olderThanHours: number = 24) => jobService.cleanCompletedJobs(olderThanHours),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate queue stats
        queryClient.invalidateQueries(queryKeys.jobs.queueStats())

        Toast.fire({
          icon: 'success',
          title: `${data.cleanedCount} jobs completados limpiados`
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al limpiar jobs completados',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

/**
 * Pause queue
 */
export const usePauseQueue = (
  options?: UseMutationOptions<void, Error, void>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    () => jobService.pauseQueue(),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate queue stats
        queryClient.invalidateQueries(queryKeys.jobs.queueStats())

        Toast.fire({
          icon: 'warning',
          title: 'Cola de jobs pausada'
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al pausar cola',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

/**
 * Resume queue
 */
export const useResumeQueue = (
  options?: UseMutationOptions<void, Error, void>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    () => jobService.resumeQueue(),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate queue stats
        queryClient.invalidateQueries(queryKeys.jobs.queueStats())

        Toast.fire({
          icon: 'success',
          title: 'Cola de jobs reanudada'
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al reanudar cola',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

/**
 * Remove job
 */
export const useRemoveJob = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    (jobId: string) => jobService.removeJob(jobId),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate related queries
        queryClient.invalidateQueries(queryKeys.jobs.failedJobs())
        queryClient.invalidateQueries(queryKeys.jobs.queueStats())
        queryClient.removeQueries(queryKeys.jobs.detail(variables))

        Toast.fire({
          icon: 'success',
          title: 'Job eliminado exitosamente'
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al eliminar job',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

// ===========================
// Manual Job Trigger Hooks
// ===========================

/**
 * Trigger certificate generation
 */
export const useTriggerCertificateGeneration = (
  options?: UseMutationOptions<{ jobId: string }, Error, number>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    (certificateId: number) => jobService.triggerCertificateGeneration(certificateId),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate queue stats
        queryClient.invalidateQueries(queryKeys.jobs.queueStats())

        Toast.fire({
          icon: 'success',
          title: 'Generación de certificado iniciada',
          text: `Job ID: ${data.jobId}`
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
 * Trigger video processing
 */
export const useTriggerVideoProcessing = (
  options?: UseMutationOptions<{ jobId: string }, Error, { videoPath: string; metadata?: any }>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    ({ videoPath, metadata }: { videoPath: string; metadata?: any }) =>
      jobService.triggerVideoProcessing(videoPath, metadata),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate queue stats
        queryClient.invalidateQueries(queryKeys.jobs.queueStats())

        Toast.fire({
          icon: 'success',
          title: 'Procesamiento de video iniciado',
          text: `Job ID: ${data.jobId}`
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al procesar video',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

/**
 * Trigger cleanup job
 */
export const useTriggerCleanupJob = (
  options?: UseMutationOptions<{ jobId: string }, Error, CleanupJobRequest>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    (cleanupOptions: CleanupJobRequest) => jobService.triggerCleanupJob(cleanupOptions),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate queue stats
        queryClient.invalidateQueries(queryKeys.jobs.queueStats())

        Toast.fire({
          icon: 'success',
          title: 'Job de limpieza iniciado',
          text: `Job ID: ${data.jobId}`
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al iniciar limpieza',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

/**
 * Clean old quiz attempts
 */
export const useCleanOldQuizAttempts = (
  options?: UseMutationOptions<{ jobId: string }, Error, number>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    (olderThanDays: number = 90) => jobService.cleanOldQuizAttempts(olderThanDays),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate queue stats
        queryClient.invalidateQueries(queryKeys.jobs.queueStats())

        Toast.fire({
          icon: 'success',
          title: 'Limpieza de intentos de quiz iniciada',
          text: `Job ID: ${data.jobId}`
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al limpiar intentos de quiz',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

// ===========================
// Scheduler Management Hooks
// ===========================

/**
 * Get scheduler status
 */
export const useSchedulerStatus = (
  options?: any
) => {
  return useQuery(
    queryKeys.jobs.schedulerStatus(),
    () => jobService.getSchedulerStatus(),
    {
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 60 * 1000, // Auto-refetch every minute
      ...options
    }
  )
}

/**
 * Start scheduler
 */
export const useStartScheduler = (
  options?: UseMutationOptions<void, Error, void>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    () => jobService.startScheduler(),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate scheduler status
        queryClient.invalidateQueries(queryKeys.jobs.schedulerStatus())

        Toast.fire({
          icon: 'success',
          title: 'Programador de jobs iniciado'
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al iniciar programador',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

/**
 * Stop scheduler
 */
export const useStopScheduler = (
  options?: UseMutationOptions<void, Error, void>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    () => jobService.stopScheduler(),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate scheduler status
        queryClient.invalidateQueries(queryKeys.jobs.schedulerStatus())

        Toast.fire({
          icon: 'warning',
          title: 'Programador de jobs detenido'
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al detener programador',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

/**
 * Run scheduled job manually
 */
export const useRunScheduledJob = (
  options?: UseMutationOptions<any, Error, string>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    (jobName: string) => jobService.runScheduledJob(jobName),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate related queries
        queryClient.invalidateQueries(queryKeys.jobs.queueStats())
        queryClient.invalidateQueries(queryKeys.jobs.statistics())

        Toast.fire({
          icon: 'success',
          title: `Job "${variables}" ejecutado manualmente`
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al ejecutar job',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

// ===========================
// Reminder Jobs Hooks
// ===========================

/**
 * Get reminder job status
 */
export const useReminderJobStatus = (
  options?: any
) => {
  return useQuery(
    queryKeys.jobs.reminderStatus(),
    () => jobService.getReminderJobStatus(),
    {
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 60 * 1000, // Auto-refetch every minute
      ...options
    }
  )
}

/**
 * Start reminder jobs
 */
export const useStartReminderJobs = (
  options?: UseMutationOptions<void, Error, void>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    () => jobService.startReminderJobs(),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate reminder status
        queryClient.invalidateQueries(queryKeys.jobs.reminderStatus())

        Toast.fire({
          icon: 'success',
          title: 'Jobs de recordatorio iniciados'
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al iniciar recordatorios',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

/**
 * Stop reminder jobs
 */
export const useStopReminderJobs = (
  options?: UseMutationOptions<void, Error, void>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    () => jobService.stopReminderJobs(),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate reminder status
        queryClient.invalidateQueries(queryKeys.jobs.reminderStatus())

        Toast.fire({
          icon: 'warning',
          title: 'Jobs de recordatorio detenidos'
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al detener recordatorios',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

/**
 * Run reminder job manually
 */
export const useRunReminderJob = (
  options?: UseMutationOptions<any, Error, string>
) => {
  const queryClient = useQueryClient()

  return useMutation(
    (jobName: string) => jobService.runReminderJob(jobName),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate related queries
        queryClient.invalidateQueries(queryKeys.jobs.statistics())

        Toast.fire({
          icon: 'success',
          title: `Recordatorio "${variables}" ejecutado`
        })

        options?.onSuccess?.(data, variables, context)
      },
      onError: (error, variables, context) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al ejecutar recordatorio',
          text: error.message
        })

        options?.onError?.(error, variables, context)
      }
    }
  )
}

/**
 * Get job statistics
 */
export const useJobStatistics = (
  options?: any
) => {
  return useQuery(
    queryKeys.jobs.statistics(),
    () => jobService.getJobStatistics(),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
      ...options
    }
  )
}

// ===========================
// Dashboard Hook
// ===========================

/**
 * Get comprehensive job dashboard data
 */
export const useJobDashboard = (
  options?: any
) => {
  return useQuery(
    queryKeys.jobs.dashboard(),
    () => jobService.getJobDashboard(),
    {
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 60 * 1000, // Auto-refetch every minute
      ...options
    }
  )
}

/**
 * Check job system health
 */
export const useJobHealth = (
  options?: any
) => {
  return useQuery(
    queryKeys.jobs.health(),
    () => jobService.checkJobHealth(),
    {
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 2 * 60 * 1000, // Auto-refetch every 2 minutes
      ...options
    }
  )
}

// ===========================
// Export all hooks
// ===========================

export default {
  // Queue Management
  useQueueStats,
  useFailedJobs,
  useJob,
  useRetryFailedJob,
  useCleanCompletedJobs,
  usePauseQueue,
  useResumeQueue,
  useRemoveJob,

  // Manual Job Triggers
  useTriggerCertificateGeneration,
  useTriggerVideoProcessing,
  useTriggerCleanupJob,
  useCleanOldQuizAttempts,

  // Scheduler Management
  useSchedulerStatus,
  useStartScheduler,
  useStopScheduler,
  useRunScheduledJob,

  // Reminder Jobs
  useReminderJobStatus,
  useStartReminderJobs,
  useStopReminderJobs,
  useRunReminderJob,
  useJobStatistics,

  // Dashboard
  useJobDashboard,
  useJobHealth
}