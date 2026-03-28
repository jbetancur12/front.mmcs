import { axiosPrivate } from '@utils/api'

const API_BASE = '/lms/quizzes'

// ============================================================================
// DTOs (Data Transfer Objects) - Para enviar al backend
// ============================================================================

export interface CreateQuizDTO {
  title: string
  instructions: string
  passing_percentage: number
  max_attempts: number
  cooldown_minutes: number
  show_correct_answers: boolean
  randomize_questions: boolean
  shuffle_answers: boolean
  time_limit_minutes: number | null
  questions: QuestionDTO[]
}

export interface QuestionDTO {
  type: 'single' | 'multiple' | 'boolean'
  question: string
  options: string[]
  correct_answers: number[]
  points: number
  order_index: number
  explanation?: string
}

// ============================================================================
// Response Interfaces - Lo que devuelve el backend
// ============================================================================

export interface Quiz {
  id: number
  lesson_id: number
  title: string
  instructions: string
  passing_percentage: number
  max_attempts: number
  cooldown_minutes: number
  show_correct_answers: boolean
  randomize_questions: boolean
  shuffle_answers: boolean
  time_limit_minutes: number | null
  created_at: string
  updated_at: string
  questions: QuizQuestion[]
}

export interface QuizQuestion {
  id: number
  quiz_id: number
  type: 'single' | 'multiple' | 'boolean'
  question: string
  options: string[]
  correct_answers: number[]
  points: number
  order_index: number
  explanation: string | null
  created_at: string
  updated_at: string
}

export interface QuizStatistics {
  totalAttempts: number
  uniqueUsers: number
  averageScore: number // 0-100 percentage
  passRate: number // 0-100 percentage
  averageTimeMinutes: number
  suspiciousAttempts: number
}

export interface QuizAnalytics {
  quiz: {
    id: number
    title: string
    totalQuestions: number
  }
  statistics: QuizStatistics
  questionAnalytics: QuestionAnalytics[]
}

export interface QuestionAnalytics {
  questionId: number
  question: string
  type: 'single' | 'multiple' | 'boolean'
  points: number
  // Note: Detailed analytics (correctAnswerRate, commonWrongAnswers)
  // are not yet implemented in backend
}

export interface QuizAttempt {
  id: number
  user_id: number
  quiz_id: number
  answers: Record<number, number[]> // { questionId: [optionIndices] }
  score: number
  total_points: number
  passed: boolean
  attempt_number: number
  started_at: string
  completed_at: string | null
  created_at: string
}

export interface QuizAttemptResult {
  attempt: QuizAttempt
  quiz: {
    id: number
    title: string
    passing_percentage: number
    show_correct_answers: boolean
  }
  results: {
    score: number
    totalPoints: number
    passed: boolean
    percentage: number
    timeSpentMinutes: number
    correctAnswers: Record<number, {
      correct_answers: number[]
      explanation: string | null
    }> | null
  }
}

export interface QuizForTaking {
  id: number
  title: string
  instructions: string
  time_limit_minutes: number | null
  questions: QuizQuestionForTaking[]
  userInfo: {
    attemptsUsed: number
    maxAttempts: number
    canTake: boolean
    cooldownRemaining: number // minutes
    bestScore: number | null // percentage
  }
}

export interface QuizQuestionForTaking {
  id: number
  type: 'single' | 'multiple' | 'boolean'
  question: string
  options: string[]
  points: number
  order_index: number
  shuffleMap?: number[] // Present if shuffle_answers is enabled
}

export interface QuizSession {
  quizId: number
  userId: number
  startedAt: string
  timeLimit: number | null // milliseconds
  expiresAt: string | null
}

// ============================================================================
// API Error Response
// ============================================================================

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

export interface QuizValidationResult {
  valid: boolean
  message: string
  errorCode?: string
  details?: any
}

// ============================================================================
// Quiz Service
// ============================================================================

class QuizService {
  /**
   * Create a new quiz for a lesson
   * POST /api/lms/quizzes/lessons/:lessonId/quiz
   */
  async createQuiz(lessonId: number, quizData: CreateQuizDTO): Promise<Quiz> {
    try {
      const response = await axiosPrivate.post(`${API_BASE}/lessons/${lessonId}/quiz`, quizData)
      return response.data.data
    } catch (error: any) {
      console.error('Error creating quiz:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Get quiz by ID (for editing/management - includes correct answers)
   * GET /api/lms/quizzes/:quizId/manage
   */
  async getQuizById(quizId: number): Promise<Quiz> {
    try {
      const response = await axiosPrivate.get(`${API_BASE}/${quizId}/manage`)
      return response.data.data
    } catch (error: any) {
      console.error('Error fetching quiz:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Update an existing quiz
   * PUT /api/lms/quizzes/:quizId
   */
  async updateQuiz(quizId: number, quizData: CreateQuizDTO): Promise<Quiz> {
    try {
      const response = await axiosPrivate.put(`${API_BASE}/${quizId}`, quizData)
      return response.data.data
    } catch (error: any) {
      console.error('Error updating quiz:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Delete a quiz
   * DELETE /api/lms/quizzes/:quizId
   */
  async deleteQuiz(quizId: number): Promise<void> {
    try {
      await axiosPrivate.delete(`${API_BASE}/${quizId}`)
    } catch (error: any) {
      console.error('Error deleting quiz:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Preview quiz (for instructors - includes correct answers)
   * GET /api/lms/quizzes/:quizId/preview
   */
  async previewQuiz(quizId: number): Promise<Quiz> {
    try {
      const response = await axiosPrivate.get(`${API_BASE}/${quizId}/preview`)
      return response.data.data
    } catch (error: any) {
      console.error('Error previewing quiz:', error)
      throw this.handleError(error)
    }
  }

  // ==========================================================================
  // Quiz Taking APIs (For students/users)
  // ==========================================================================

  /**
   * Get quiz for taking (without correct answers, with randomization/shuffle)
   * GET /api/lms/quizzes/:quizId
   */
  async getQuizForTaking(quizId: number): Promise<QuizForTaking> {
    try {
      const response = await axiosPrivate.get(`${API_BASE}/${quizId}`)
      return response.data.data
    } catch (error: any) {
      console.error('Error fetching quiz for taking:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Start a quiz session (for timing tracking)
   * POST /api/lms/quizzes/:quizId/start
   */
  async startQuizSession(quizId: number): Promise<QuizSession> {
    try {
      const response = await axiosPrivate.post(`${API_BASE}/${quizId}/start`)
      return response.data.data
    } catch (error: any) {
      console.error('Error starting quiz session:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Submit quiz attempt
   * POST /api/lms/quizzes/:quizId/attempt
   */
  async submitQuizAttempt(
    quizId: number,
    answers: Record<number, number[]>,
    timeSpentSeconds: number
  ): Promise<QuizAttemptResult> {
    try {
      const response = await axiosPrivate.post(`${API_BASE}/${quizId}/attempt`, {
        answers,
        timeSpent: timeSpentSeconds
      })
      return response.data.data
    } catch (error: any) {
      console.error('Error submitting quiz attempt:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Get user's quiz attempts
   * GET /api/lms/quizzes/:quizId/attempts
   */
  async getUserQuizAttempts(quizId: number): Promise<QuizAttempt[]> {
    try {
      const response = await axiosPrivate.get(`${API_BASE}/${quizId}/attempts`)
      return response.data.data
    } catch (error: any) {
      console.error('Error fetching user quiz attempts:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Get specific quiz attempt details
   * GET /api/lms/quizzes/:quizId/attempts/:attemptId
   */
  async getQuizAttemptDetails(quizId: number, attemptId: number): Promise<any> {
    try {
      const response = await axiosPrivate.get(`${API_BASE}/${quizId}/attempts/${attemptId}`)
      return response.data.data
    } catch (error: any) {
      console.error('Error fetching quiz attempt details:', error)
      throw this.handleError(error)
    }
  }

  // ==========================================================================
  // Analytics APIs
  // ==========================================================================

  /**
   * Get quiz statistics (for instructors/admins)
   * GET /api/lms/quizzes/:quizId/statistics
   */
  async getQuizStatistics(quizId: number): Promise<QuizStatistics> {
    try {
      const response = await axiosPrivate.get(`${API_BASE}/${quizId}/statistics`)
      return response.data.data
    } catch (error: any) {
      console.error('Error fetching quiz statistics:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Get detailed quiz analytics
   * GET /api/lms/quizzes/:quizId/analytics
   */
  async getQuizAnalytics(quizId: number): Promise<QuizAnalytics> {
    try {
      const response = await axiosPrivate.get(`${API_BASE}/${quizId}/analytics`)
      return response.data.data
    } catch (error: any) {
      console.error('Error fetching quiz analytics:', error)
      throw this.handleError(error)
    }
  }

  // ==========================================================================
  // Utility APIs
  // ==========================================================================

  /**
   * Validate quiz configuration without saving
   * POST /api/lms/quizzes/validate-config
   */
  async validateQuizConfig(quizData: CreateQuizDTO): Promise<QuizValidationResult> {
    try {
      await axiosPrivate.post(`${API_BASE}/validate-config`, quizData)
      return {
        valid: true,
        message: 'La configuración cumple el contrato técnico del backend.'
      }
    } catch (error: any) {
      console.error('Quiz validation failed:', error)
      if (error.response?.data?.error) {
        return {
          valid: false,
          message: error.response.data.error.message || 'La configuración no es válida.',
          errorCode: error.response.data.error.code,
          details: error.response.data.error.details
        }
      }

      return {
        valid: false,
        message: 'No se pudo validar la configuración del quiz.'
      }
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Handle API errors and throw user-friendly messages
   */
  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error
      const apiError = error.response.data as ApiError
      const message = apiError.error?.message || 'Error en la operación'
      const code = apiError.error?.code || 'UNKNOWN_ERROR'

      // Create error with code property for specific handling
      const err = new Error(message) as Error & { code: string; details?: any }
      err.code = code
      err.details = apiError.error?.details

      return err
    } else if (error.request) {
      // Request made but no response
      return new Error('No se pudo conectar con el servidor. Verifica tu conexión.')
    } else {
      // Something else happened
      return new Error(error.message || 'Error desconocido')
    }
  }

  /**
   * Map frontend Question to backend QuestionDTO
   */
  mapQuestionToDTO(question: any, orderIndex: number): QuestionDTO {
    return {
      type: question.type,
      question: question.question,
      options: question.options,
      correct_answers: question.correct_answers,
      points: question.points,
      order_index: orderIndex,
      explanation: question.explanation || undefined
    }
  }

  /**
   * Map backend Quiz to frontend format
   */
  mapQuizToFrontend(quiz: Quiz): any {
    return {
      id: quiz.id,
      lessonId: quiz.lesson_id,
      title: quiz.title,
      instructions: quiz.instructions,
      passingPercentage: quiz.passing_percentage,
      maxAttempts: quiz.max_attempts,
      cooldownMinutes: quiz.cooldown_minutes,
      showCorrectAnswers: quiz.show_correct_answers,
      randomizeQuestions: quiz.randomize_questions,
      shuffleAnswers: quiz.shuffle_answers,
      hasTimeLimit: quiz.time_limit_minutes !== null,
      timeLimitMinutes: quiz.time_limit_minutes,
      questions: quiz.questions.map(q => ({
        id: q.id,
        type: q.type,
        question: q.question,
        options: q.options,
        correctAnswers: q.correct_answers,
        points: q.points,
        explanation: q.explanation || undefined
      }))
    }
  }

  /**
   * Build CreateQuizDTO from frontend data
   */
  buildQuizDTO(
    quizConfig: any,
    questions: any[]
  ): CreateQuizDTO {
    return {
      title: quizConfig.title,
      instructions: quizConfig.instructions,
      passing_percentage: quizConfig.passingPercentage,
      max_attempts: quizConfig.maxAttempts,
      cooldown_minutes: quizConfig.cooldownMinutes,
      show_correct_answers: quizConfig.showCorrectAnswers,
      randomize_questions: quizConfig.randomizeQuestions,
      shuffle_answers: quizConfig.shuffleAnswers,
      time_limit_minutes: quizConfig.hasTimeLimit ? quizConfig.timeLimitMinutes : null,
      questions: questions.map((q, index) => this.mapQuestionToDTO(q, index + 1))
    }
  }
}

// Export singleton instance
export default new QuizService()
