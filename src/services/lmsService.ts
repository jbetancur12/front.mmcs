import { axiosPrivate, axiosPublic } from 'src/utils/api'
import type { AxiosProgressEvent } from 'axios'

// ===========================
// TypeScript Interfaces
// ===========================

/**
 * Course status enum
 */
export type CourseStatus = 'draft' | 'published' | 'archived'

/**
 * Course audience enum
 */
export type CourseAudience = 'internal' | 'client' | 'both'

/**
 * Content type enum
 */
export type ContentType = 'text' | 'video'

/**
 * Question type enum
 */
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer'

/**
 * Course interface
 */
export interface Course {
  id: number
  slug: string
  title: string
  description: string
  status: CourseStatus
  version: number
  audience: CourseAudience
  is_mandatory: boolean
  has_certificate: boolean
  estimated_duration_minutes?: number
  intro_content?: string
  intro_type?: ContentType
  created_by: number
  creator?: {
    id: number
    nombre: string
    email?: string
  }
  created_at: string
  updated_at: string
  modules?: CourseModule[]
  stats?: CourseStats
  assignments?: CourseAssignment[]
  userProgress?: UserProgress[]
  user_deadline?: string  // Deadline específico del usuario (calculado por el backend)
}

/**
 * Course module interface
 */
export interface CourseModule {
  id: number
  course_id: number
  title: string
  description?: string
  order_index: number
  lessons?: CourseLesson[]
  created_at: string
  updated_at: string
}

/**
 * Course lesson interface
 */
export interface CourseLesson {
  id: number
  module_id: number
  title: string
  content: string
  type: ContentType
  video_url?: string
  video_source?: 'youtube' | 'minio'
  duration_minutes?: number
  order_index: number
  is_mandatory: boolean
  quiz?: Quiz  // Quiz asociado a la lección (si type es 'quiz')
  created_at: string
  updated_at: string
}

/**
 * Quiz interface
 */
export interface Quiz {
  id: number
  lesson_id?: number
  course_id?: number
  title: string
  description?: string
  passing_score: number
  max_attempts?: number
  time_limit_minutes?: number
  questions?: QuizQuestion[]
  created_at: string
  updated_at: string
}

/**
 * Quiz question interface
 */
export interface QuizQuestion {
  id: number
  quiz_id: number
  question_text: string
  question_type: QuestionType
  options?: string[]
  correct_answer: string
  points: number
  order_index: number
  created_at: string
  updated_at: string
}

/**
 * Quiz attempt interface
 */
export interface QuizAttempt {
  id: number
  quiz_id: number
  user_id: number
  score: number
  passed: boolean
  answers: Record<string, any>
  started_at: string
  completed_at?: string
  created_at: string
}

/**
 * User progress interface
 */
export interface UserProgress {
  id: number
  user_id: number
  course_id: number
  lesson_id?: number
  status?: 'not_started' | 'in_progress' | 'completed'
  progress_percentage: number
  completed_lessons: number[]
  total_lessons: number
  time_spent_minutes: number
  started_at: string
  completed_at?: string
  last_accessed_at: string
  created_at: string
  updated_at: string
}

/**
 * Certificate interface
 */
export interface Certificate {
  id: number
  user_id?: number
  course_id?: number
  certificate_number?: string
  certificateNumber?: string
  issued_at?: string
  issuedAt?: string
  expires_at?: string
  file_url?: string
  pdfPath?: string | null
  courseTitle?: string
  courseDescription?: string
  certificateData?: Record<string, any>
  verificationUrl?: string
  created_at?: string
}

export interface CertificateTemplateVariable {
  name: string
  label: string
  type: 'text' | 'date' | 'number'
  required: boolean
  defaultValue?: string
  default_value?: string
  description?: string
}

export interface CertificateTemplate {
  id: number
  name: string
  templateHtml?: string
  template_html?: string
  variables: CertificateTemplateVariable[]
  isDefault?: boolean
  is_default?: boolean
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
}

export interface SaveCertificateTemplateRequest {
  name: string
  templateHtml: string
  variables: CertificateTemplateVariable[]
  isDefault?: boolean
}

export interface CertificateTemplatePreviewRequest {
  sampleData?: Record<string, string>
}

export interface CertificateTemplatePreviewResponse {
  html: string
  variables: CertificateTemplateVariable[]
  templateName: string
}

/**
 * Course assignment interface
 */
export interface CourseAssignment {
  id: number
  course_id: number
  all_employees: boolean
  role?: string
  deadline?: string
  created_by?: number
  created_at: string
  updated_at: string
  course?: {
    id: number
    title: string
    description?: string
    is_mandatory: boolean
    audience: CourseAudience
  }
  userProgress?: {
    totalLessons: number
    completedLessons: number
    completionPercentage: number
    isCompleted: boolean
    lastActivity: number | null
  }
  isOverdue?: boolean
  daysUntilDeadline?: number | null
}

export interface AssignmentSupport {
  userType: 'internal' | 'client'
  supportsAssignments: boolean
  strategy: 'internal-role-assignment' | 'catalog-only'
  message: string
}

export interface UserAssignmentsResponse {
  userId: number
  totalAssignments: number
  mandatoryCount?: number
  optionalCount?: number
  support: AssignmentSupport
  assignments: {
    mandatory: CourseAssignment[]
    optional: CourseAssignment[]
  }
}

export interface MandatoryAssignmentsResponse {
  userId: number
  totalMandatory: number
  overdue: number
  urgent: number
  upcoming: number
  noDeadline: number
  support: AssignmentSupport
  courses: {
    overdue: CourseAssignment[]
    urgent: CourseAssignment[]
    upcoming: CourseAssignment[]
    noDeadline: CourseAssignment[]
  }
}

export interface CourseAssignmentsResponse {
  courseId: number
  totalAssignments: number
  assignments: CourseAssignment[]
}

export interface CreateAssignmentResult {
  assignment: CourseAssignment
  affectedUsersCount: number
  affectedUsers: Array<{
    id: number
    name: string
    email: string
  }>
}

export interface UpdateAssignmentResult {
  assignment: CourseAssignment
  affectedUsersCount: number
}

/**
 * Role-based filter interface
 */
export interface RoleBasedFilter {
  userRole?: string
  department?: string
  scope?: 'all' | 'department' | 'courses' | 'users'
  managedOnly?: boolean
}

/**
 * Course stats interface
 */
export interface CourseStats {
  total_enrollments: number
  active_users: number
  completion_rate: number
  average_score: number
  average_time_minutes: number
}

/**
 * Analytics data interface
 */
export interface AnalyticsData {
  total_users: number
  total_courses: number
  total_certificates: number
  completion_rate: number
  active_users_today: number
  courses_by_status: Record<CourseStatus, number>
  top_courses: Array<{
    course_id: number
    title: string
    enrollments: number
    completion_rate: number
  }>
  recent_activity: Array<{
    type: string
    description: string
    timestamp: string
  }>
}

/**
 * Notification interface
 */
export interface Notification {
  id: number
  user_id: number
  type: string
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  created_at: string
}

export interface LmsPermissions {
  userId: number
  userType: 'internal' | 'client'
  canAccessLMS: boolean
  canManageCourses: boolean
  canCreateContent: boolean
  canViewAnalytics: boolean
  canAssignCourses: boolean
  canManageUsers: boolean
  restrictedToCustomer: number | null
}

/**
 * Job queue status interface
 */
export interface JobQueueStatus {
  activeJobs: number
  completedJobs: number
  failedJobs: number
  queueHealth: 'healthy' | 'warning' | 'critical'
  processingTimes: {
    average: number
    p95: number
    p99: number
  }
  jobTypes: {
    certificateGeneration: JobTypeStatus
    videoProcessing: JobTypeStatus
    emailNotifications: JobTypeStatus
    dataCleanup: JobTypeStatus
  }
  recentJobs: Job[]
}

/**
 * Job type status interface
 */
export interface JobTypeStatus {
  active: number
  completed: number
  failed: number
  averageProcessingTime: number
  successRate: number
}

/**
 * Job interface
 */
export interface Job {
  id: string
  type: string
  status: 'pending' | 'active' | 'completed' | 'failed' | 'cancelled'
  priority: number
  data: Record<string, any>
  progress: number
  attempts: number
  maxAttempts: number
  createdAt: string
  startedAt?: string
  completedAt?: string
  failedAt?: string
  error?: string
  processingTime?: number
}

/**
 * System performance metrics interface
 */
export interface SystemPerformanceMetrics {
  storageUsage: {
    total: number
    used: number
    available: number
    percentage: number
  }
  videoStreamingStats: {
    activeStreams: number
    bandwidth: number
    errors: number
    totalStreams: number
  }
  databasePerformance: {
    connectionPool: {
      active: number
      idle: number
      total: number
    }
    queryTime: {
      average: number
      p95: number
      p99: number
    }
    slowQueries: number
  }
  errorRate: {
    current: number
    threshold: number
    last24h: number[]
  }
}

// ===========================
// Request/Response Types
// ===========================

export interface CreateCourseRequest {
  title: string
  description: string
  audience: CourseAudience
  is_mandatory?: boolean
  has_certificate?: boolean
  intro_content?: string
  intro_type?: ContentType
}

export interface UpdateCourseRequest {
  title?: string
  description?: string
  audience?: CourseAudience
  is_mandatory?: boolean
  has_certificate?: boolean
  intro_content?: string
  intro_type?: ContentType
  status?: CourseStatus
}

export interface CourseQueryParams {
  status?: CourseStatus
  audience?: CourseAudience
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface CreateModuleRequest {
  course_id: number
  title: string
  description?: string
  order_index?: number
}

export interface CreateLessonRequest {
  module_id: number
  title: string
  content: string
  content_type: ContentType
  video_url?: string
  duration_minutes?: number
  order_index?: number
  is_mandatory?: boolean
}

export interface CreateQuizRequest {
  lesson_id?: number
  course_id?: number
  title: string
  description?: string
  passing_score: number
  max_attempts?: number
  time_limit_minutes?: number
}

export interface CreateAssignmentRequest {
  course_id: number
  role?: string
  all_employees?: boolean
  deadline?: string
}

export interface SubmitQuizRequest {
  answers: Record<string, any>
}

export interface UpdateProgressRequest {
  lesson_id: number
  completed: boolean
  time_spent_minutes?: number
}

// ===========================
// LMS Service
// ===========================

class LMSService {
  private readonly baseURL = '/lms'

  private unwrapResponse<T>(payload: any, nestedKey?: string): T {
    if (payload?.data !== undefined) {
      return payload.data as T
    }

    if (nestedKey && payload?.[nestedKey] !== undefined) {
      return payload[nestedKey] as T
    }

    return payload as T
  }

  // ===========================
  // Course Management
  // ===========================

  /**
   * Get all courses (Admin/Training Manager)
   */
  async getCourses(params?: CourseQueryParams): Promise<{ courses: Course[]; total: number }> {
    const response = await axiosPrivate.get(`${this.baseURL}/courses`, { params })
    return response.data
  }

  /**
   * Get available courses for current user
   */
  async getAvailableCourses(): Promise<Course[]> {
    const response = await axiosPrivate.get(`${this.baseURL}/courses/available`)
    return this.unwrapResponse<Course[]>(response.data, 'courses')
  }

  /**
   * Get current user's LMS permissions and type context
   */
  async getMyPermissions(): Promise<LmsPermissions> {
    const response = await axiosPrivate.get(`${this.baseURL}/training-manager/my-permissions`)
    return this.unwrapResponse<LmsPermissions>(response.data)
  }

  /**
   * Get course by ID
   */
  async getCourse(id: number): Promise<Course> {
    const response = await axiosPrivate.get(`${this.baseURL}/courses/${id}`)
    return this.unwrapResponse<Course>(response.data, 'course')
  }

  /**
   * Get course preview (no auth required)
   */
  async getCoursePreview(id: number): Promise<Course> {
    const response = await axiosPublic.get(`${this.baseURL}/courses/preview/${id}`)
    return this.unwrapResponse<Course>(response.data, 'course')
  }

  /**
   * Create a new course
   */
  async createCourse(data: CreateCourseRequest): Promise<Course> {
    const response = await axiosPrivate.post(`${this.baseURL}/courses`, data)
    return this.unwrapResponse<Course>(response.data, 'course')
  }

  /**
   * Update a course
   */
  async updateCourse(id: number, data: UpdateCourseRequest): Promise<Course> {
    const response = await axiosPrivate.put(`${this.baseURL}/courses/${id}`, data)
    return this.unwrapResponse<Course>(response.data, 'course')
  }

  /**
   * Delete a course
   */
  async deleteCourse(id: number): Promise<void> {
    await axiosPrivate.delete(`${this.baseURL}/courses/${id}`)
  }

  /**
   * Publish a course
   */
  async publishCourse(id: number): Promise<Course> {
    const response = await axiosPrivate.post(`${this.baseURL}/courses/${id}/publish`)
    return this.unwrapResponse<Course>(response.data, 'course')
  }

  /**
   * Archive a course
   */
  async archiveCourse(id: number): Promise<Course> {
    const response = await axiosPrivate.post(`${this.baseURL}/courses/${id}/archive`)
    return this.unwrapResponse<Course>(response.data, 'course')
  }

  /**
   * Duplicate a course
   */
  async duplicateCourse(id: number, newTitle?: string): Promise<Course> {
    const response = await axiosPrivate.post(`${this.baseURL}/courses/${id}/duplicate`, {
      title: newTitle
    })
    return this.unwrapResponse<Course>(response.data, 'course')
  }

  /**
   * Get course statistics
   */
  async getCourseStats(id: number): Promise<CourseStats> {
    const response = await axiosPrivate.get(`${this.baseURL}/courses/${id}/stats`)
    return this.unwrapResponse<CourseStats>(response.data, 'stats')
  }

  // ===========================
  // Content Management
  // ===========================

  /**
   * Create a module
   */
  async createModule(data: CreateModuleRequest): Promise<CourseModule> {
    const response = await axiosPrivate.post(
      `${this.baseURL}/content/courses/${data.course_id}/modules`,
      data
    )
    return this.unwrapResponse<CourseModule>(response.data, 'module')
  }

  /**
   * Update a module
   */
  async updateModule(id: number, data: Partial<CreateModuleRequest>): Promise<CourseModule> {
    const response = await axiosPrivate.put(`${this.baseURL}/content/modules/${id}`, data)
    return this.unwrapResponse<CourseModule>(response.data, 'module')
  }

  /**
   * Delete a module
   */
  async deleteModule(id: number): Promise<void> {
    await axiosPrivate.delete(`${this.baseURL}/content/modules/${id}`)
  }

  /**
   * Create a lesson
   */
  async createLesson(data: CreateLessonRequest): Promise<CourseLesson> {
    const response = await axiosPrivate.post(
      `${this.baseURL}/content/modules/${data.module_id}/lessons`,
      data
    )
    return this.unwrapResponse<CourseLesson>(response.data, 'lesson')
  }

  /**
   * Update a lesson
   */
  async updateLesson(id: number, data: Partial<CreateLessonRequest>): Promise<CourseLesson> {
    const response = await axiosPrivate.put(`${this.baseURL}/content/lessons/${id}`, data)
    return this.unwrapResponse<CourseLesson>(response.data, 'lesson')
  }

  /**
   * Delete a lesson
   */
  async deleteLesson(id: number): Promise<void> {
    await axiosPrivate.delete(`${this.baseURL}/content/lessons/${id}`)
  }

  // ===========================
  // Progress Tracking
  // ===========================

  /**
   * Get user progress for a course
   */
  async getCourseProgress(courseId: number, userId?: number): Promise<UserProgress> {
    const url = userId
      ? `${this.baseURL}/progress/course/${courseId}/user/${userId}`
      : `${this.baseURL}/progress/course/${courseId}`
    const response = await axiosPrivate.get(url)
    return response.data.progress || response.data
  }

  /**
   * Get all progress for a user
   */
  async getUserProgress(userId?: number): Promise<UserProgress[]> {
    const url = userId
      ? `${this.baseURL}/progress/user/${userId}`
      : `${this.baseURL}/progress/user/me`
    const response = await axiosPrivate.get(url)
    return response.data.progress || response.data
  }

  /**
   * Update progress (mark lesson as completed)
   */
  async updateProgress(data: UpdateProgressRequest): Promise<UserProgress> {
    const response = await axiosPrivate.post(`${this.baseURL}/progress/update`, data)
    return response.data.progress || response.data
  }

  /**
   * Complete a lesson
   */
  async completeLesson(lessonId: number, timeSpent?: number): Promise<UserProgress> {
    return this.updateProgress({
      lesson_id: lessonId,
      completed: true,
      time_spent_minutes: timeSpent
    })
  }

  // ===========================
  // Quizzes
  // ===========================

  /**
   * Get quiz by ID
   */
  async getQuiz(id: number): Promise<Quiz> {
    const response = await axiosPrivate.get(`${this.baseURL}/quizzes/${id}`)
    return response.data.quiz || response.data
  }

  /**
   * Create a quiz
   */
  async createQuiz(data: CreateQuizRequest): Promise<Quiz> {
    const response = await axiosPrivate.post(`${this.baseURL}/quizzes`, data)
    return response.data.quiz || response.data
  }

  /**
   * Update a quiz
   */
  async updateQuiz(id: number, data: Partial<CreateQuizRequest>): Promise<Quiz> {
    const response = await axiosPrivate.put(`${this.baseURL}/quizzes/${id}`, data)
    return response.data.quiz || response.data
  }

  /**
   * Delete a quiz
   */
  async deleteQuiz(id: number): Promise<void> {
    await axiosPrivate.delete(`${this.baseURL}/quizzes/${id}`)
  }

  /**
   * Submit quiz attempt
   */
  async submitQuiz(quizId: number, data: SubmitQuizRequest): Promise<QuizAttempt> {
    const response = await axiosPrivate.post(`${this.baseURL}/quizzes/${quizId}/submit`, data)
    return response.data.attempt || response.data
  }

  /**
   * Get quiz attempts for a user
   */
  async getQuizAttempts(quizId: number, userId?: number): Promise<QuizAttempt[]> {
    const url = userId
      ? `${this.baseURL}/quizzes/${quizId}/attempts/user/${userId}`
      : `${this.baseURL}/quizzes/${quizId}/attempts`
    const response = await axiosPrivate.get(url)
    return response.data.attempts || response.data
  }

  // ===========================
  // Certificates
  // ===========================

  /**
   * Get user certificates
   */
  async getUserCertificates(userId?: number): Promise<Certificate[]> {
    const url = userId
      ? `${this.baseURL}/certificates/users/${userId}`
      : `${this.baseURL}/certificates/my-certificates`
    const response = await axiosPrivate.get(url)
    // Backend returns { success: true, data: [...] } where data is the array
    return response.data.data || response.data.certificates || response.data
  }

  /**
   * Get certificate by ID
   */
  async getCertificate(id: number): Promise<Certificate> {
    const response = await axiosPrivate.get(`${this.baseURL}/certificates/${id}`)
    return this.unwrapResponse<Certificate>(response.data, 'certificate')
  }

  /**
   * Generate certificate for a course
   */
  async generateCertificate(courseId: number, userId?: number): Promise<Certificate> {
    const response = await axiosPrivate.post(`${this.baseURL}/certificates/generate`, {
      course_id: courseId,
      user_id: userId
    })
    return response.data.certificate || response.data
  }

  /**
   * Download certificate PDF
   */
  async downloadCertificate(certificateId: number): Promise<Blob> {
    const response = await axiosPrivate.get(
      `${this.baseURL}/certificates/${certificateId}/download`,
      {
        responseType: 'blob'
      }
    )
    return response.data
  }

  /**
   * Verify certificate by certificate number
   */
  async verifyCertificate(certificateNumber: string): Promise<{ isValid: boolean; certificate?: Certificate; error?: string }> {
    try {
      const response = await axiosPublic.get(`${this.baseURL}/certificates/verify/${certificateNumber}`)
      return {
        isValid: response.data.data?.valid ?? response.data.valid ?? response.data.success ?? response.data.isValid,
        certificate: response.data.data?.certificate || response.data.certificate
      }
    } catch (error: any) {
      return {
        isValid: false,
        error: error.response?.data?.message || 'Error al verificar el certificado'
      }
    }
  }

  async getCertificateTemplates(): Promise<CertificateTemplate[]> {
    const response = await axiosPrivate.get(`${this.baseURL}/certificates/templates`)
    return this.unwrapResponse<CertificateTemplate[]>(response.data)
  }

  async createCertificateTemplate(
    data: SaveCertificateTemplateRequest
  ): Promise<CertificateTemplate> {
    const response = await axiosPrivate.post(`${this.baseURL}/certificates/templates`, {
      name: data.name,
      templateHtml: data.templateHtml,
      variables: data.variables,
      isDefault: data.isDefault ?? false
    })
    return this.unwrapResponse<CertificateTemplate>(response.data)
  }

  async updateCertificateTemplate(
    id: number,
    data: SaveCertificateTemplateRequest
  ): Promise<CertificateTemplate> {
    const response = await axiosPrivate.put(`${this.baseURL}/certificates/templates/${id}`, {
      name: data.name,
      templateHtml: data.templateHtml,
      variables: data.variables,
      isDefault: data.isDefault ?? false
    })
    return this.unwrapResponse<CertificateTemplate>(response.data)
  }

  async deleteCertificateTemplate(id: number): Promise<void> {
    await axiosPrivate.delete(`${this.baseURL}/certificates/templates/${id}`)
  }

  async previewCertificateTemplate(
    id: number,
    data?: CertificateTemplatePreviewRequest
  ): Promise<CertificateTemplatePreviewResponse> {
    const response = await axiosPrivate.post(`${this.baseURL}/certificates/templates/${id}/preview`, data || {})
    return this.unwrapResponse<CertificateTemplatePreviewResponse>(response.data)
  }

  async validateCertificateTemplate(data: SaveCertificateTemplateRequest): Promise<{
    isValid: boolean
    errors: string[]
  }> {
    const response = await axiosPrivate.post(`${this.baseURL}/certificates/templates/validate`, {
      templateHtml: data.templateHtml,
      variables: data.variables
    })
    return this.unwrapResponse<{ isValid: boolean; errors: string[] }>(response.data)
  }

  // ===========================
  // Assignments
  // ===========================

  /**
   * Get course assignments
   */
  async getCourseAssignments(courseId: number): Promise<CourseAssignmentsResponse> {
    const response = await axiosPrivate.get(`${this.baseURL}/assignments/courses/${courseId}/assignments`)
    return this.unwrapResponse<CourseAssignmentsResponse>(response.data)
  }

  /**
   * Get user assignments
   */
  async getUserAssignments(userId?: number): Promise<UserAssignmentsResponse> {
    const url = userId
      ? `${this.baseURL}/assignments/users/${userId}/assignments`
      : `${this.baseURL}/assignments/my-assignments`
    const response = await axiosPrivate.get(url)
    return this.unwrapResponse<UserAssignmentsResponse>(response.data)
  }

  /**
   * Get mandatory assignments for current user
   */
  async getMandatoryAssignments(): Promise<MandatoryAssignmentsResponse> {
    const response = await axiosPrivate.get(`${this.baseURL}/assignments/my-mandatory-courses`)
    return this.unwrapResponse<MandatoryAssignmentsResponse>(response.data)
  }

  /**
   * Create assignment
   */
  async createAssignment(data: CreateAssignmentRequest): Promise<CreateAssignmentResult> {
    const response = await axiosPrivate.post(
      `${this.baseURL}/assignments/courses/${data.course_id}/assign`,
      {
        role: data.role,
        all_employees: data.all_employees,
        deadline: data.deadline ?? null
      }
    )
    return this.unwrapResponse<CreateAssignmentResult>(response.data)
  }

  /**
   * Update assignment
   */
  async updateAssignment(
    id: number,
    data: Partial<CreateAssignmentRequest>
  ): Promise<UpdateAssignmentResult> {
    const response = await axiosPrivate.put(`${this.baseURL}/assignments/assignments/${id}`, data)
    return this.unwrapResponse<UpdateAssignmentResult>(response.data)
  }

  /**
   * Delete assignment
   */
  async deleteAssignment(id: number): Promise<void> {
    await axiosPrivate.delete(`${this.baseURL}/assignments/assignments/${id}`)
  }

  // ===========================
  // Analytics
  // ===========================

  /**
   * Get LMS analytics dashboard data
   */
  async getAnalytics(params?: { startDate?: string; endDate?: string }): Promise<AnalyticsData> {
    const response = await axiosPrivate.get(`${this.baseURL}/analytics/dashboard`, { params })
    return response.data.analytics || response.data
  }

  /**
   * Get course analytics
   */
  async getCourseAnalytics(courseId: number): Promise<any> {
    const response = await axiosPrivate.get(`${this.baseURL}/analytics/course/${courseId}`)
    return response.data.analytics || response.data
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(userId?: number): Promise<any> {
    const url = userId
      ? `${this.baseURL}/analytics/user/${userId}`
      : `${this.baseURL}/analytics/user/me`
    const response = await axiosPrivate.get(url)
    return response.data.analytics || response.data
  }

  /**
   * Get comprehensive dashboard analytics
   */
  async getComprehensiveDashboard(params?: { 
    startDate?: string; 
    endDate?: string; 
    userType?: string;
    courseStatus?: string;
  }): Promise<any> {
    const response = await axiosPrivate.get(`${this.baseURL}/analytics/dashboard`, { params })
    return response.data.data || response.data
  }

  /**
   * Get quiz performance analytics
   */
  async getQuizPerformanceAnalytics(params?: {
    courseId?: number;
    quizId?: number;
    startDate?: string;
    endDate?: string;
    includeQuestionAnalysis?: boolean;
  }): Promise<any> {
    const response = await axiosPrivate.get(`${this.baseURL}/analytics/quizzes/performance`, { params })
    return response.data.data || response.data
  }

  /**
   * Get assignment management analytics
   */
  async getAssignmentManagementAnalytics(params?: {
    role?: string;
    department?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    includeOverdue?: boolean;
  }): Promise<any> {
    const response = await axiosPrivate.get(`${this.baseURL}/analytics/assignments/management`, { params })
    return response.data.data || response.data
  }

  /**
   * Get mandatory training status
   */
  async getMandatoryTrainingStatus(params?: {
    role?: string;
    userId?: number;
    includeCompleted?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<any> {
    const response = await axiosPrivate.get(`${this.baseURL}/analytics/assignments/mandatory`, { params })
    return response.data.data || response.data
  }

  /**
   * Get mandatory training analytics with enhanced tracking
   */
  async getMandatoryTrainingAnalytics(params?: {
    courseId?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    includeEscalation?: boolean;
  }): Promise<any> {
    const response = await axiosPrivate.get(`${this.baseURL}/analytics/assignments/mandatory-training`, { params })
    return response.data.data || response.data
  }

  /**
   * Get role-based dashboard data
   */
  async getRoleBasedDashboard(filters: RoleBasedFilter): Promise<any> {
    const response = await axiosPrivate.get(`${this.baseURL}/analytics/role-based-dashboard`, { 
      params: filters 
    })
    return response.data.data || response.data
  }

  /**
   * Get filtered courses based on user role
   */
  async getFilteredCourses(filters: RoleBasedFilter & {
    limit?: number;
    offset?: number;
    status?: CourseStatus;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{
    courses: Course[];
    total: number;
    hasMore: boolean;
  }> {
    const response = await axiosPrivate.get(`${this.baseURL}/courses/filtered`, { 
      params: filters 
    })
    return response.data.data || response.data
  }

  /**
   * Get filtered user analytics based on role scope
   */
  async getFilteredUserAnalytics(filters: RoleBasedFilter): Promise<any> {
    const response = await axiosPrivate.get(`${this.baseURL}/analytics/users/filtered`, { 
      params: filters 
    })
    return response.data.data || response.data
  }

  /**
   * Get department-specific analytics for managers
   */
  async getDepartmentAnalytics(department: string, filters?: {
    dateRange?: string;
    includeSubDepartments?: boolean;
  }): Promise<any> {
    const response = await axiosPrivate.get(`${this.baseURL}/analytics/department/${department}`, { 
      params: filters 
    })
    return response.data.data || response.data
  }

  /**
   * Get enhanced course metrics with trends, popularity rankings, and time analytics
   */
  async getEnhancedCourseMetrics(params?: {
    startDate?: string;
    endDate?: string;
    includePopularity?: boolean;
    includeTimeAnalytics?: boolean;
  }): Promise<any> {
    const response = await axiosPrivate.get(`${this.baseURL}/analytics/courses/enhanced-metrics`, { params })
    return response.data.data || response.data
  }

  /**
   * Get reminder system analytics and effectiveness metrics
   */
  async getReminderAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    type?: string;
    priority?: string;
  }): Promise<any> {
    const response = await axiosPrivate.get(`${this.baseURL}/analytics/reminders/analytics`, { params })
    return response.data.data || response.data
  }

  /**
   * Get pending notification counts and delivery status
   */
  async getPendingNotificationStatus(userId?: number): Promise<any> {
    const params = userId ? { userId } : {}
    const response = await axiosPrivate.get(`${this.baseURL}/analytics/reminders/pending-status`, { params })
    return response.data.data || response.data
  }

  /**
   * Trigger manual reminders for assignments
   */
  async triggerManualReminders(data: {
    assignmentIds: number[];
    customMessage?: string;
  }): Promise<any> {
    const response = await axiosPrivate.post(`${this.baseURL}/analytics/reminders/trigger-manual`, data)
    return response.data.data || response.data
  }

  // ===========================
  // Notifications
  // ===========================

  /**
   * Get user notifications with filtering and pagination
   */
  async getNotifications(params?: {
    limit?: number;
    severity?: string;
    unreadOnly?: boolean;
    type?: string;
  }): Promise<{
    notifications: any[];
    summary: any;
    systemAlerts: any[];
    trainingAlerts: any[];
  }> {
    const response = await axiosPrivate.get(`${this.baseURL}/notifications`, { params })
    return response.data
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(id: string): Promise<void> {
    await axiosPrivate.patch(`${this.baseURL}/notifications/${id}/read`)
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(): Promise<void> {
    await axiosPrivate.patch(`${this.baseURL}/notifications/read-all`)
  }

  /**
   * Create a new notification (for testing or manual creation)
   */
  async createNotification(data: {
    title: string;
    message: string;
    severity: 'critical' | 'warning' | 'info' | 'system';
    actionUrl?: string;
    actionLabel?: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    const response = await axiosPrivate.post(`${this.baseURL}/notifications`, data)
    return response.data
  }

  /**
   * Dismiss (soft delete) a notification
   */
  async dismissNotification(id: string): Promise<void> {
    await axiosPrivate.delete(`${this.baseURL}/notifications/${id}`)
  }

  /**
   * Get system alerts
   */
  async getSystemAlerts(params?: {
    resolved?: boolean;
    severity?: string;
    type?: string;
  }): Promise<any[]> {
    const response = await axiosPrivate.get(`${this.baseURL}/notifications/system-alerts`, { params })
    return response.data.alerts || response.data
  }

  /**
   * Get training alerts
   */
  async getTrainingAlerts(params?: {
    type?: string;
    severity?: string;
    userId?: number;
    courseId?: number;
  }): Promise<any[]> {
    const response = await axiosPrivate.get(`${this.baseURL}/notifications/training-alerts`, { params })
    return response.data.alerts || response.data
  }

  /**
   * Resolve a system alert
   */
  async resolveSystemAlert(alertId: string): Promise<void> {
    await axiosPrivate.patch(`${this.baseURL}/notifications/system-alerts/${alertId}/resolve`)
  }

  // ===========================
  // File Uploads
  // ===========================

  /**
   * Upload video file
   */
  async uploadVideo(
    file: File,
    onProgress?: (progressEvent: AxiosProgressEvent) => void
  ): Promise<{ url: string; filename: string }> {
    const formData = new FormData()
    formData.append('video', file)

    const response = await axiosPrivate.post(`${this.baseURL}/uploads/video`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onProgress
    })

    return response.data
  }

  /**
   * Upload image file
   */
  async uploadImage(
    file: File,
    onProgress?: (progressEvent: AxiosProgressEvent) => void
  ): Promise<{ url: string; filename: string }> {
    const formData = new FormData()
    formData.append('image', file)

    const response = await axiosPrivate.post(`${this.baseURL}/uploads/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onProgress
    })

    return response.data
  }

  /**
   * Upload document file
   */
  async uploadDocument(
    file: File,
    onProgress?: (AxiosProgressEvent: AxiosProgressEvent) => void
  ): Promise<{ url: string; filename: string }> {
    const formData = new FormData()
    formData.append('document', file)

    const response = await axiosPrivate.post(`${this.baseURL}/uploads/document`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onProgress
    })

    return response.data
  }

  // ===========================
  // Reports
  // ===========================

  /**
   * Generate comprehensive report with enhanced filtering
   */
  async generateReport(type: string, params?: any): Promise<Blob> {
    const response = await axiosPrivate.post(
      `${this.baseURL}/analytics/reports/generate`,
      { type, ...params },
      {
        responseType: 'blob'
      }
    )
    return response.data
  }

  /**
   * Get learning trends analytics with time range selection
   */
  async getLearningTrendsAnalytics(params?: {
    timeRange?: 'week' | 'month' | 'quarter' | 'year'
    startDate?: string
    endDate?: string
    courseId?: number
    userType?: string
    includeComparisons?: boolean
  }): Promise<any> {
    const response = await axiosPrivate.get(`${this.baseURL}/analytics/trends/learning`, { params })
    return response.data.data || response.data
  }

  /**
   * Get compliance reporting data
   */
  async getComplianceReporting(params?: {
    status?: string
    priority?: string
    department?: string
    role?: string
    regulatoryBody?: string
  }): Promise<any> {
    const response = await axiosPrivate.get(`${this.baseURL}/analytics/compliance/reporting`, { params })
    return response.data.data || response.data
  }

  /**
   * Export data to CSV
   */
  async exportToCSV(type: string, params?: any): Promise<Blob> {
    const response = await axiosPrivate.post(
      `${this.baseURL}/reports/export-csv`,
      { type, ...params },
      {
        responseType: 'blob'
      }
    )
    return response.data
  }

  // ===========================
  // System Health & Job Monitoring
  // ===========================

  /**
   * Get job queue monitoring data
   */
  async getJobQueueStatus(params?: {
    jobType?: string;
    status?: string;
    limit?: number;
  }): Promise<any> {
    const response = await axiosPrivate.get(`${this.baseURL}/system/jobs/status`, { params })
    return response.data.data || response.data
  }

  /**
   * Get system performance metrics
   */
  async getSystemPerformanceMetrics(): Promise<any> {
    const response = await axiosPrivate.get(`${this.baseURL}/system/performance`)
    return response.data.data || response.data
  }

  /**
   * Retry failed job
   */
  async retryJob(jobId: string): Promise<any> {
    const response = await axiosPrivate.post(`${this.baseURL}/system/jobs/${jobId}/retry`)
    return response.data
  }

  /**
   * Cancel job
   */
  async cancelJob(jobId: string): Promise<any> {
    const response = await axiosPrivate.post(`${this.baseURL}/system/jobs/${jobId}/cancel`)
    return response.data
  }

  /**
   * Get job details
   */
  async getJobDetails(jobId: string): Promise<any> {
    const response = await axiosPrivate.get(`${this.baseURL}/system/jobs/${jobId}`)
    return response.data.data || response.data
  }

  // ===========================
  // Health & Info
  // ===========================

  /**
   * Check LMS health
   */
  async checkHealth(): Promise<{ success: boolean; message: string; timestamp: string }> {
    const response = await axiosPublic.get(`${this.baseURL}/health`)
    return response.data
  }

  /**
   * Get LMS system info
   */
  async getSystemInfo(): Promise<any> {
    const response = await axiosPublic.get(`${this.baseURL}/info`)
    return response.data
  }
}

// Export singleton instance
export const lmsService = new LMSService()
export default lmsService
