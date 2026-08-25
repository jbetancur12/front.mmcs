interface ErrorReport {
  message: string
  stack?: string
  componentStack?: string
  section: string
  timestamp: string
  userAgent: string
  url: string
  userId?: string
  sessionId?: string
  buildVersion?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  tags?: Record<string, string>
  extra?: Record<string, any>
}

interface ErrorReportingConfig {
  apiEndpoint?: string
  maxReports?: number
  batchSize?: number
  flushInterval?: number
  enableConsoleLogging?: boolean
  enableLocalStorage?: boolean
}

class ErrorReportingService {
  private config: Required<ErrorReportingConfig>
  private reportQueue: ErrorReport[] = []
  private flushTimer: NodeJS.Timeout | null = null
  private reportCount = 0

  constructor(config: ErrorReportingConfig = {}) {
    this.config = {
      apiEndpoint: config.apiEndpoint || '/errors/report',
      maxReports: config.maxReports || 100,
      batchSize: config.batchSize || 10,
      flushInterval: config.flushInterval || 30000, // 30 seconds
      enableConsoleLogging: config.enableConsoleLogging ?? true,
      enableLocalStorage: config.enableLocalStorage ?? true
    }

    this.startFlushTimer()
    this.setupGlobalErrorHandlers()
  }

  private startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }

    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.config.flushInterval)
  }

  private setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError(event.reason, {
        section: 'unhandled_promise_rejection',
        severity: 'high',
        tags: { type: 'promise_rejection' }
      })
    })

    // Handle global JavaScript errors
    window.addEventListener('error', (event) => {
      this.reportError(event.error || new Error(event.message), {
        section: 'global_error',
        severity: 'high',
        tags: { 
          type: 'javascript_error',
          filename: event.filename,
          lineno: event.lineno?.toString(),
          colno: event.colno?.toString()
        }
      })
    })
  }

  public reportError(
    error: Error | string,
    options: {
      section?: string
      severity?: ErrorReport['severity']
      tags?: Record<string, string>
      extra?: Record<string, any>
      componentStack?: string
    } = {}
  ) {
    // Prevent too many reports
    if (this.reportCount >= this.config.maxReports) {
      return
    }

    const errorObj = typeof error === 'string' ? new Error(error) : error
    
    const report: ErrorReport = {
      message: errorObj.message,
      stack: errorObj.stack,
      componentStack: options.componentStack,
      section: options.section || 'unknown',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      buildVersion: this.getBuildVersion(),
      severity: options.severity || 'medium',
      tags: options.tags,
      extra: options.extra
    }

    this.addToQueue(report)
    this.reportCount++

    // Log to console if enabled
    if (this.config.enableConsoleLogging) {
      console.error('Error Report:', report)
    }

    // Store in localStorage if enabled
    if (this.config.enableLocalStorage) {
      this.storeInLocalStorage(report)
    }

    // Flush immediately for critical errors
    if (report.severity === 'critical') {
      this.flush()
    }
  }

  private addToQueue(report: ErrorReport) {
    this.reportQueue.push(report)

    // Auto-flush when batch size is reached
    if (this.reportQueue.length >= this.config.batchSize) {
      this.flush()
    }
  }

  private async flush() {
    if (this.reportQueue.length === 0) {
      return
    }

    const reportsToSend = this.reportQueue.splice(0, this.config.batchSize)

    try {
      await this.sendReports(reportsToSend)
    } catch (error) {
      // If sending fails, put reports back in queue (up to a limit)
      if (this.reportQueue.length < this.config.maxReports) {
        this.reportQueue.unshift(...reportsToSend)
      }
      
      console.error('Failed to send error reports:', error)
    }
  }

  private async sendReports(reports: ErrorReport[]) {
    const response = await fetch(this.config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify({ reports })
    })

    if (!response.ok) {
      throw new Error(`Failed to send reports: ${response.status} ${response.statusText}`)
    }
  }

  private getCurrentUserId(): string | undefined {
    try {
      const userStore = localStorage.getItem('userStore')
      if (userStore) {
        const parsed = JSON.parse(userStore)
        return parsed.customer?.id?.toString() || parsed.id?.toString()
      }
    } catch (error) {
      // Ignore parsing errors
    }
    return undefined
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('lms_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('lms_session_id', sessionId)
    }
    return sessionId
  }

  private getBuildVersion(): string {
    return process.env.REACT_APP_VERSION || 'unknown'
  }

  private getAuthToken(): string {
    return localStorage.getItem('authToken') || ''
  }

  private storeInLocalStorage(report: ErrorReport) {
    try {
      const key = 'lms_error_reports'
      const stored = localStorage.getItem(key)
      const reports: ErrorReport[] = stored ? JSON.parse(stored) : []
      
      reports.push(report)
      
      // Keep only the last 50 reports
      if (reports.length > 50) {
        reports.splice(0, reports.length - 50)
      }
      
      localStorage.setItem(key, JSON.stringify(reports))
    } catch (error) {
      // Ignore localStorage errors
    }
  }

  public getStoredReports(): ErrorReport[] {
    try {
      const stored = localStorage.getItem('lms_error_reports')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      return []
    }
  }

  public clearStoredReports() {
    localStorage.removeItem('lms_error_reports')
  }

  public getQueueStatus() {
    return {
      queueLength: this.reportQueue.length,
      reportCount: this.reportCount,
      maxReports: this.config.maxReports
    }
  }

  public destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
    
    // Flush remaining reports
    this.flush()
  }
}

// Create singleton instance
export const errorReportingService = new ErrorReportingService({
  apiEndpoint: '/lms/errors/report',
  maxReports: 100,
  batchSize: 5,
  flushInterval: 30000,
  enableConsoleLogging: process.env.NODE_ENV === 'development',
  enableLocalStorage: true
})

// React hook for error reporting
export const useErrorReporting = () => {
  const reportError = (
    error: Error | string,
    options?: Parameters<typeof errorReportingService.reportError>[1]
  ) => {
    errorReportingService.reportError(error, options)
  }

  const getStoredReports = () => {
    return errorReportingService.getStoredReports()
  }

  const clearStoredReports = () => {
    errorReportingService.clearStoredReports()
  }

  const getQueueStatus = () => {
    return errorReportingService.getQueueStatus()
  }

  return {
    reportError,
    getStoredReports,
    clearStoredReports,
    getQueueStatus
  }
}

export default errorReportingService