export type NotificationSeverity = 'critical' | 'warning' | 'info' | 'system'

export interface Notification {
  id: string
  title: string
  message: string
  severity: NotificationSeverity
  timestamp: Date
  read: boolean
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
}

export interface NotificationSummary {
  total: number
  unread: number
  critical: number
  warning: number
  info: number
  system: number
}

export interface NotificationWidgetProps {
  notifications: Notification[]
  summary: NotificationSummary
  loading?: boolean
  error?: string
  onNotificationClick?: (notification: Notification) => void
  onMarkAsRead?: (notificationId: string) => void
  onMarkAllAsRead?: () => void
  onRefresh?: () => void
}

export interface SystemAlert {
  id: string
  type: 'job_failure' | 'performance_issue' | 'connection_error' | 'storage_warning'
  title: string
  description: string
  severity: NotificationSeverity
  timestamp: Date
  resolved: boolean
  actionRequired: boolean
}

export interface TrainingAlert {
  id: string
  type: 'mandatory_deadline' | 'low_completion' | 'certificate_expiry' | 'new_assignment'
  title: string
  description: string
  severity: NotificationSeverity
  timestamp: Date
  userId?: number
  courseId?: number
  assignmentId?: number
  deadline?: Date
}