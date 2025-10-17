import { axiosPrivate } from 'src/utils/api'

// ===========================
// TypeScript Interfaces
// ===========================

export interface JobStats {
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  total: number
}

export interface FailedJob {
  id: string
  type: string
  data: any
  error: string
  stackTrace?: string[]
  attempts: number
  timestamp: number
}

export interface JobDetails {
  id: string
  type: string
  data: any
  progress: number
  attempts: number
  maxAttempts: number
  createdAt: number
  processedOn?: number
  finishedOn?: number
  failedReason?: string
}

export interface SchedulerStatus {
  isRunning: boolean
  totalJobs: number
  jobs: Record<string, {
    running: boolean
    scheduled: boolean
  }>
}

export interface ReminderJobStatus {
  isRunning: boolean
  jobs: Record<string, {
    active: boolean
    interval: number
    nextRun?: string
  }>
  startedAt?: string
}

export interface JobStatistics {
  lastRun: Record<string, string>
  totalRuns: Record<string, number>
  totalNotificationsSent: Record<string, number>
  averageExecutionTime: Record<string, number>
  errors: Record<string, number>
}

export interface JobDashboard {
  queue: JobStats
  failedJobs: FailedJob[]
  scheduler: SchedulerStatus
  reminderJobs: ReminderJobStatus
  statistics: JobStatistics
  lastUpdated: string
}

export interface TriggerJobRequest {
  certificateId?: number
  videoPath?: string
  metadata?: any
  options?: any
}

export interface CleanupJobRequest {
  cleanTempFiles?: boolean
  cleanExpiredSessions?: boolean
  cleanOldLogs?: boolean
  cleanFailedJobs?: boolean
  olderThanDays?: number
}

// ===========================
// Job Service
// ===========================

class JobService {
  private readonly baseURL = '/lms/jobs'

  // ===========================
  // Queue Management
  // ===========================

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<JobStats> {
    const response = await axiosPrivate.get(`${this.baseURL}/queue/stats`)
    return response.data.data
  }

  /**
   * Get failed jobs
   */
  async getFailedJobs(limit = 10): Promise<FailedJob[]> {
    const response = await axiosPrivate.get(`${this.baseURL}/queue/failed`, {
      params: { limit }
    })
    return response.data.data
  }

  /**
   * Retry a failed job
   */
  async retryFailedJob(jobId: string): Promise<void> {
    await axiosPrivate.post(`${this.baseURL}/queue/retry/${jobId}`)
  }

  /**
   * Clean completed jobs
   */
  async cleanCompletedJobs(olderThanHours = 24): Promise<{ cleanedCount: number }> {
    const response = await axiosPrivate.post(`${this.baseURL}/queue/clean-completed`, null, {
      params: { olderThanHours }
    })
    return response.data.data
  }

  /**
   * Pause queue
   */
  async pauseQueue(): Promise<void> {
    await axiosPrivate.post(`${this.baseURL}/queue/pause`)
  }

  /**
   * Resume queue
   */
  async resumeQueue(): Promise<void> {
    await axiosPrivate.post(`${this.baseURL}/queue/resume`)
  }

  /**
   * Get job details
   */
  async getJob(jobId: string): Promise<JobDetails> {
    const response = await axiosPrivate.get(`${this.baseURL}/queue/job/${jobId}`)
    return response.data.data
  }

  /**
   * Remove job
   */
  async removeJob(jobId: string): Promise<void> {
    await axiosPrivate.delete(`${this.baseURL}/queue/job/${jobId}`)
  }

  // ===========================
  // Manual Job Triggers
  // ===========================

  /**
   * Trigger certificate generation
   */
  async triggerCertificateGeneration(certificateId: number): Promise<{ jobId: string }> {
    const response = await axiosPrivate.post(`${this.baseURL}/trigger/certificate`, {
      certificateId
    })
    return response.data.data
  }

  /**
   * Trigger video processing
   */
  async triggerVideoProcessing(videoPath: string, metadata?: any): Promise<{ jobId: string }> {
    const response = await axiosPrivate.post(`${this.baseURL}/trigger/video`, {
      videoPath,
      metadata
    })
    return response.data.data
  }

  /**
   * Trigger cleanup job
   */
  async triggerCleanupJob(options: CleanupJobRequest = {}): Promise<{ jobId: string }> {
    const response = await axiosPrivate.post(`${this.baseURL}/trigger/cleanup`, options)
    return response.data.data
  }

  /**
   * Clean old quiz attempts
   */
  async cleanOldQuizAttempts(olderThanDays = 90): Promise<{ jobId: string }> {
    const response = await axiosPrivate.post(`${this.baseURL}/trigger/clean-quiz-attempts`, null, {
      params: { olderThanDays }
    })
    return response.data.data
  }

  // ===========================
  // Scheduler Management
  // ===========================

  /**
   * Get scheduler status
   */
  async getSchedulerStatus(): Promise<SchedulerStatus> {
    const response = await axiosPrivate.get(`${this.baseURL}/scheduler/status`)
    return response.data.data
  }

  /**
   * Start scheduler
   */
  async startScheduler(): Promise<void> {
    await axiosPrivate.post(`${this.baseURL}/scheduler/start`)
  }

  /**
   * Stop scheduler
   */
  async stopScheduler(): Promise<void> {
    await axiosPrivate.post(`${this.baseURL}/scheduler/stop`)
  }

  /**
   * Run scheduled job manually
   */
  async runScheduledJob(jobName: string): Promise<any> {
    const response = await axiosPrivate.post(`${this.baseURL}/scheduler/run/${jobName}`)
    return response.data.data
  }

  // ===========================
  // Reminder Jobs Management
  // ===========================

  /**
   * Get reminder job status
   */
  async getReminderJobStatus(): Promise<ReminderJobStatus> {
    const response = await axiosPrivate.get(`${this.baseURL}/reminders/status`)
    return response.data.data
  }

  /**
   * Start reminder jobs
   */
  async startReminderJobs(): Promise<void> {
    await axiosPrivate.post(`${this.baseURL}/reminders/start`)
  }

  /**
   * Stop reminder jobs
   */
  async stopReminderJobs(): Promise<void> {
    await axiosPrivate.post(`${this.baseURL}/reminders/stop`)
  }

  /**
   * Run specific reminder job manually
   */
  async runReminderJob(jobName: string): Promise<any> {
    const response = await axiosPrivate.post(`${this.baseURL}/reminders/run/${jobName}`)
    return response.data.data
  }

  /**
   * Get job statistics
   */
  async getJobStatistics(): Promise<JobStatistics> {
    const response = await axiosPrivate.get(`${this.baseURL}/reminders/statistics`)
    return response.data.data
  }

  // ===========================
  // Dashboard
  // ===========================

  /**
   * Get comprehensive job dashboard data
   */
  async getJobDashboard(): Promise<JobDashboard> {
    const response = await axiosPrivate.get(`${this.baseURL}/dashboard`)
    return response.data.data
  }

  /**
   * Check job system health
   */
  async checkJobHealth(): Promise<any> {
    const response = await axiosPrivate.get(`${this.baseURL}/health`)
    return response.data
  }
}

// Export singleton instance
export const jobService = new JobService()
export default jobService