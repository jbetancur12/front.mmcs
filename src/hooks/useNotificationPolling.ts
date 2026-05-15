import { useState, useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from 'react-query'
import { lmsService } from '../services/lmsService'
import { Notification } from '../types/notifications'

interface NotificationPollingOptions {
  enabled?: boolean
  interval?: number
  onNewNotification?: (notification: Notification) => void
  onError?: (error: Error) => void
}

export const useNotificationPolling = (
  options: NotificationPollingOptions = {}
) => {
  const {
    enabled = false, // Disabled by default to prevent infinite requests
    interval = 300000, // 5 minutes (300 seconds)
    onNewNotification,
    onError
  } = options

  const [isPolling, setIsPolling] = useState(false)
  const [lastPollTime, setLastPollTime] = useState<Date | null>(null)
  const [pollCount, setPollCount] = useState(0)
  const [error, setError] = useState<Error | null>(null)

  const intervalRef = useRef<NodeJS.Timeout>()
  const lastNotificationIds = useRef<Set<string>>(new Set())
  const queryClient = useQueryClient()

  const pollNotifications = useCallback(async () => {
    if (!enabled) return

    try {
      setError(null)
      const response = await lmsService.getNotifications({
        limit: 20,
        unreadOnly: false
      })

      const notifications = response.notifications || []

      // Check for new notifications
      const newNotifications = notifications.filter(
        (notification) => !lastNotificationIds.current.has(notification.id)
      )

      // Update the set of known notification IDs
      notifications.forEach((notification) => {
        lastNotificationIds.current.add(notification.id)
      })

      // Trigger callbacks for new notifications
      newNotifications.forEach((notification) => {
        if (onNewNotification) {
          onNewNotification(notification)
        }
      })

      // Update query cache
      queryClient.setQueryData(['notifications'], response)

      setLastPollTime(new Date())
      setPollCount((prev) => prev + 1)
    } catch (err) {
      const error = err as Error
      setError(error)

      // If it's a rate limit error (429), stop polling temporarily
      if (
        error.message.includes('429') ||
        error.message.includes('Too Many Requests')
      ) {
        console.warn('Rate limit hit, stopping polling for 5 minutes')
        stopPolling()
        // Resume after 5 minutes
        setTimeout(
          () => {
            if (enabled) {
              console.log('Resuming polling after rate limit cooldown')
              startPolling()
            }
          },
          5 * 60 * 1000
        ) // 5 minutes
        return
      }

      if (onError) {
        onError(error)
      }
      console.error('Notification polling error:', error)
    }
  }, [enabled, onNewNotification, onError, queryClient])

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    setIsPolling(true)

    // Initial poll
    pollNotifications()

    // Set up interval
    intervalRef.current = setInterval(pollNotifications, interval)
  }, [pollNotifications, interval])

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = undefined
    }
    setIsPolling(false)
  }, [])

  const resetPolling = useCallback(() => {
    stopPolling()
    lastNotificationIds.current.clear()
    setPollCount(0)
    setLastPollTime(null)
    setError(null)

    if (enabled) {
      startPolling()
    }
  }, [enabled, startPolling, stopPolling])

  // Auto-start/stop based on enabled flag
  useEffect(() => {
    if (enabled) {
      startPolling()
    } else {
      stopPolling()
    }

    return () => {
      stopPolling()
    }
  }, [enabled, startPolling, stopPolling])

  // Handle visibility change to pause/resume polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling()
      } else if (enabled) {
        startPolling()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, startPolling, stopPolling])

  return {
    isPolling,
    lastPollTime,
    pollCount,
    error,
    startPolling,
    stopPolling,
    resetPolling,
    pollNow: pollNotifications
  }
}

export default useNotificationPolling
