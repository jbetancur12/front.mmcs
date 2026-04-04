import { useState, useCallback } from 'react'
import { useQuery, useMutation } from 'react-query'
import {
  Notification,
  NotificationSummary,
  SystemAlert,
  TrainingAlert
} from '../types/notifications'
import { axiosPrivate } from '../utils/api'

interface NotificationsResponse {
  notifications: Notification[]
  summary: NotificationSummary
  systemAlerts: SystemAlert[]
  trainingAlerts: TrainingAlert[]
}

interface UseNotificationsOptions {
  limit?: number
  severity?: string[]
  unreadOnly?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export const useNotifications = (options: UseNotificationsOptions = {}) => {
  const {
    limit = 50,
    severity = [],
    unreadOnly = false,
    autoRefresh = true,
    refreshInterval = 30000 // 30 seconds
  } = options

  // Fetch notifications
  const { data, isLoading, error, refetch } = useQuery(
    ['notifications', { limit, severity, unreadOnly }],
    async (): Promise<NotificationsResponse> => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        unreadOnly: unreadOnly.toString()
      })

      if (severity.length > 0) {
        params.append('severity', severity.join(','))
      }

      const response = await axiosPrivate.get(`/lms/notifications?${params}`)
      return response.data
    },
    {
      refetchInterval: autoRefresh ? refreshInterval : false,
      staleTime: 10000, // Consider data stale after 10 seconds
      cacheTime: 300000 // Keep in cache for 5 minutes
    }
  )

  // Mark notification as read
  const markAsReadMutation = useMutation(
    async (notificationId: string) => {
      const response = await axiosPrivate.patch(
        `/lms/notifications/${notificationId}/read`
      )
      return response.data
    },
    {
      onSuccess: () => {
        // Refetch to ensure consistency
        refetch()
      }
    }
  )

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation(
    async () => {
      const response = await axiosPrivate.patch('/lms/notifications/read-all')
      return response.data
    },
    {
      onSuccess: () => {
        // Refetch to ensure consistency
        refetch()
      }
    }
  )

  // Create notification (for testing or manual creation)
  const createNotificationMutation = useMutation(
    async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      const response = await axiosPrivate.post(
        '/lms/notifications',
        notification
      )
      return response.data
    },
    {
      onSuccess: () => {
        // Refetch to get the latest notifications
        refetch()
      }
    }
  )

  // Dismiss notification (soft delete)
  const dismissNotificationMutation = useMutation(
    async (notificationId: string) => {
      const response = await axiosPrivate.delete(
        `/lms/notifications/${notificationId}`
      )
      return response.data
    },
    {
      onSuccess: () => {
        // Refetch to ensure consistency
        refetch()
      }
    }
  )

  // Handlers
  const handleMarkAsRead = useCallback(
    (notificationId: string) => {
      markAsReadMutation.mutate(notificationId)
    },
    [markAsReadMutation]
  )

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate()
  }, [markAllAsReadMutation])

  const handleCreateNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      createNotificationMutation.mutate(notification)
    },
    [createNotificationMutation]
  )

  const handleDismissNotification = useCallback(
    (notificationId: string) => {
      dismissNotificationMutation.mutate(notificationId)
    },
    [dismissNotificationMutation]
  )

  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  // Extract data with fallbacks
  const notifications = data?.notifications || []
  const summary = data?.summary || {
    total: 0,
    unread: 0,
    critical: 0,
    warning: 0,
    info: 0,
    system: 0
  }
  const systemAlerts = data?.systemAlerts || []
  const trainingAlerts = data?.trainingAlerts || []

  return {
    // Data
    notifications,
    summary,
    systemAlerts,
    trainingAlerts,

    // Loading states
    isLoading,
    error: error as Error | null,

    // Actions
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    createNotification: handleCreateNotification,
    dismissNotification: handleDismissNotification,
    refresh: handleRefresh,

    // Mutation states
    isMarkingAsRead: markAsReadMutation.isLoading,
    isMarkingAllAsRead: markAllAsReadMutation.isLoading,
    isCreating: createNotificationMutation.isLoading,
    isDismissing: dismissNotificationMutation.isLoading
  }
}

// Hook for real-time notifications (to be used with WebSocket)
export const useRealtimeNotifications = () => {
  const [realtimeNotifications, setRealtimeNotifications] = useState<
    Notification[]
  >([])

  const addRealtimeNotification = useCallback((notification: Notification) => {
    setRealtimeNotifications((prev) => [notification, ...prev.slice(0, 9)]) // Keep last 10
  }, [])

  const clearRealtimeNotifications = useCallback(() => {
    setRealtimeNotifications([])
  }, [])

  return {
    realtimeNotifications,
    addRealtimeNotification,
    clearRealtimeNotifications
  }
}

export default useNotifications
