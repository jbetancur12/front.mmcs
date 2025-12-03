import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { axiosPrivate } from '../utils/api'
import { Notification } from '../types/notifications'

interface DashboardNotificationsOptions {
    enabled?: boolean
    refreshInterval?: number
    onNewNotification?: (notification: Notification) => void
}

export const useDashboardNotifications = (options: DashboardNotificationsOptions = {}) => {
    const {
        enabled = true,
        refreshInterval = 30000,
        onNewNotification
    } = options

    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'closed'>('connecting')
    const [connectionMethod, setConnectionMethod] = useState<'websocket' | 'polling'>('polling')
    const [lastActivity, setLastActivity] = useState<Date | null>(null)

    const wsRef = useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
    const queryClient = useQueryClient()

    // Use ref for callback to avoid dependency changes
    const onNewNotificationRef = useRef(onNewNotification)

    useEffect(() => {
        onNewNotificationRef.current = onNewNotification
    }, [onNewNotification])

    // Fetch notifications
    const { data, isLoading, error, refetch } = useQuery(
        ['dashboard-notifications'],
        async () => {
            const response = await axiosPrivate.get('/lms/notifications?limit=50')
            return response.data
        },
        {
            enabled: enabled,
            refetchInterval: connectionMethod === 'polling' ? refreshInterval : false,
            staleTime: 10000,
            onSuccess: () => {
                setLastActivity(new Date())
            }
        }
    )

    // WebSocket Connection Logic
    const connectWebSocket = useCallback(() => {
        if (!enabled) return

        try {
            const token = localStorage.getItem('accessToken')
            if (!token) return

            let baseUrl = import.meta.env.VITE_WS_URL

            // Handle development environment logic similar to use-websockets.tsx
            if (import.meta.env.VITE_ENV === 'development') {
                const isLocal = window.location.hostname.includes('localhost') ||
                    window.location.hostname.includes('127.0.0.1')

                if (!isLocal && import.meta.env.VITE_WS_URL_CLOUDFARE) {
                    baseUrl = import.meta.env.VITE_WS_URL_CLOUDFARE
                }
            }

            // Remove trailing slash if present
            if (baseUrl) {
                baseUrl = baseUrl.replace(/\/$/, '')
            }

            const wsUrl = `${baseUrl}/lms/notifications?token=${token}`

            console.log('Connecting to Dashboard WebSocket:', wsUrl)
            const socket = new WebSocket(wsUrl)
            wsRef.current = socket

            socket.onopen = () => {
                console.log('Dashboard WebSocket Connected')
                setConnectionStatus('connected')
                setConnectionMethod('websocket')
                // Clear any reconnect timeout
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current)
                }
            }

            socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data)
                    setLastActivity(new Date())

                    if (message.type === 'NOTIFICATION_NEW') {
                        const notification = message.data

                        // Notify parent using ref
                        if (onNewNotificationRef.current) {
                            onNewNotificationRef.current(notification)
                        }

                        // Invalidate query to refresh list
                        queryClient.invalidateQueries(['dashboard-notifications'])
                    }
                } catch (err) {
                    console.error('Error parsing WebSocket message:', err)
                }
            }

            socket.onclose = (event) => {
                console.log('Dashboard WebSocket Closed:', event.code)
                setConnectionStatus('closed')
                setConnectionMethod('polling') // Fallback to polling

                // Attempt reconnect
                if (enabled) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connectWebSocket()
                    }, 5000)
                }
            }

            socket.onerror = (error) => {
                console.error('Dashboard WebSocket Error:', error)
                setConnectionStatus('error')
                setConnectionMethod('polling') // Fallback to polling
            }

        } catch (err) {
            console.error('Failed to connect WebSocket:', err)
            setConnectionStatus('error')
            setConnectionMethod('polling')
        }
    }, [enabled, queryClient]) // Removed onNewNotification from dependencies

    // Effect to manage connection
    useEffect(() => {
        console.log('useDashboardNotifications: Effect mounted')
        connectWebSocket()

        return () => {
            console.log('useDashboardNotifications: Effect cleanup (unmount or dep change)')
            if (wsRef.current) {
                wsRef.current.close()
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
            }
        }
    }, [connectWebSocket])

    // Mark as read handler
    const markAsRead = async (id: string) => {
        try {
            await axiosPrivate.patch(`/lms/notifications/${id}/read`)
            queryClient.invalidateQueries(['dashboard-notifications'])
        } catch (err) {
            console.error('Error marking as read:', err)
        }
    }

    const markAllAsRead = async () => {
        try {
            await axiosPrivate.patch('/lms/notifications/read-all')
            queryClient.invalidateQueries(['dashboard-notifications'])
        } catch (err) {
            console.error('Error marking all as read:', err)
        }
    }

    return {
        notifications: data?.notifications || [],
        summary: data?.summary || { unread: 0, critical: 0 },
        isLoading,
        error,
        connectionStatus: {
            connected: connectionStatus === 'connected',
            connecting: connectionStatus === 'connecting',
            error: connectionStatus === 'error' ? 'Connection Error' : null,
            details: connectionMethod === 'websocket' ? 'WebSocket Activo' : 'Modo Polling'
        },
        connectionMethod,
        isRealTimeEnabled: true,
        lastNotificationTime: lastActivity,
        markAsRead,
        markAllAsRead,
        refresh: refetch
    }
}

export default useDashboardNotifications
