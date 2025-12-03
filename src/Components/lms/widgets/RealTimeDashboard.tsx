import React, { useState } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Alert,
  Snackbar,
  Fade,
  Stack
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import NotificationWidget from './NotificationWidget'
import ConnectionStatusIndicator from './ConnectionStatusIndicator'
import useHybridNotifications from '../../../hooks/useHybridNotifications'
import { Notification } from '../../../types/notifications'

interface RealTimeDashboardProps {
  showConnectionStatus?: boolean
  refreshInterval?: number
  onNotificationClick?: (notification: Notification) => void
}

const RealTimeDashboard: React.FC<RealTimeDashboardProps> = ({
  showConnectionStatus = true,
  refreshInterval = 30000,
  onNotificationClick
}) => {
  const navigate = useNavigate()
  const [realtimeAlert, setRealtimeAlert] = useState<{
    message: string
    severity: 'success' | 'info' | 'warning' | 'error'
    show: boolean
  }>({
    message: '',
    severity: 'info',
    show: false
  })

  // Hybrid notifications system (WebSocket + Polling fallback)
  const {
    notifications,
    summary,
    isLoading: notificationsLoading,
    error: notificationsError,
    markAsRead,
    markAllAsRead,
    refresh: refreshNotifications,
    connectionStatus,
    connectionMethod,
    isRealTimeEnabled,
    lastNotificationTime
  } = useHybridNotifications({
    enableWebSocket: true, // Enabled for real-time updates
    enablePolling: true, // Enabled as fallback
    pollingInterval: refreshInterval,
    fallbackToPolling: true, // Enabled as fallback
    onNewNotification: (notification) => {
      // Show real-time alert for new notifications
      setRealtimeAlert({
        message: `Nueva notificación: ${notification.title}`,
        severity: notification.severity === 'critical' ? 'error' : 'info',
        show: true
      })
    }
  })

  // Connection status for display
  const isConnected = connectionStatus.connected
  const isConnecting = connectionStatus.connecting
  const wsError = connectionStatus.error

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id)
    }

    // Handle custom click action
    if (onNotificationClick) {
      onNotificationClick(notification)
      return
    }

    // Default navigation based on notification metadata
    const metadata = notification.metadata || {}

    if (notification.actionUrl) {
      navigate(notification.actionUrl)
    } else if (metadata.courseId) {
      navigate(`/lms/admin/courses/${metadata.courseId}`)
    } else if (metadata.assignmentId) {
      navigate(`/lms/admin/assignments`)
    } else if (metadata.type === 'system_alert') {
      navigate('/lms/admin/jobs')
    } else {
      navigate('/lms/admin/analytics')
    }
  }

  const handleRefreshConnection = () => {
    refreshNotifications()
  }

  const handleCloseAlert = () => {
    setRealtimeAlert((prev) => ({ ...prev, show: false }))
  }

  return (
    <Box>
      {/* Connection Status */}
      {showConnectionStatus && (
        <Box
          sx={{
            mb: 2,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Typography variant='caption' color='text.secondary'>
            {connectionMethod === 'websocket'
              ? 'Tiempo real (WebSocket)'
              : connectionMethod === 'polling'
                ? 'Actualización automática'
                : 'Solo actualización manual'}
          </Typography>
          <ConnectionStatusIndicator
            isConnected={isConnected}
            isConnecting={isConnecting}
            error={wsError}
            connectionAttempts={0}
            onRefresh={handleRefreshConnection}
            showLabel={true}
            size='medium'
          />
        </Box>
      )}

      {/* Error Alerts */}
      {(wsError || notificationsError) && (
        <Alert
          severity={isRealTimeEnabled ? 'info' : 'warning'}
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <ConnectionStatusIndicator
              isConnected={isConnected}
              isConnecting={isConnecting}
              error={wsError}
              connectionAttempts={0}
              onRefresh={handleRefreshConnection}
              showLabel={false}
              size='small'
            />
          }
        >
          <Stack spacing={1}>
            {wsError && !isRealTimeEnabled && (
              <Typography variant='body2'>
                Conexión WebSocket no disponible: {wsError}
              </Typography>
            )}
            {isRealTimeEnabled && connectionMethod === 'polling' && (
              <Typography variant='body2'>
                Usando actualización automática como respaldo (cada{' '}
                {Math.round(refreshInterval / 1000)}s)
              </Typography>
            )}
            {notificationsError && (
              <Typography variant='body2'>
                Error al cargar notificaciones: {notificationsError.message}
              </Typography>
            )}
            {!isRealTimeEnabled && (
              <Typography variant='caption' color='text.secondary'>
                Las notificaciones requieren actualización manual. Algunas
                funciones pueden estar limitadas.
              </Typography>
            )}
          </Stack>
        </Alert>
      )}

      {/* Main Dashboard Grid */}
      <Grid container spacing={3}>
        {/* Notification Widget */}
        <Grid item xs={12} md={6} lg={4}>
          <NotificationWidget
            notifications={notifications}
            summary={summary}
            loading={notificationsLoading}
            error={notificationsError?.message}
            onNotificationClick={handleNotificationClick}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onRefresh={refreshNotifications}
          />
        </Grid>

        {/* Real-time Status Card */}
        <Grid item xs={12} md={6} lg={4}>
          <Card
            sx={{
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              height: '100%'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant='h6' sx={{ fontWeight: 700, mb: 2 }}>
                Estado en Tiempo Real
              </Typography>

              <Stack spacing={2}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Typography variant='body2' color='text.secondary'>
                    Método de conexión
                  </Typography>
                  <Typography variant='body2' sx={{ fontWeight: 600 }}>
                    {connectionMethod === 'websocket'
                      ? 'WebSocket'
                      : connectionMethod === 'polling'
                        ? 'Polling'
                        : 'Manual'}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Typography variant='body2' color='text.secondary'>
                    Estado de conexión
                  </Typography>
                  <ConnectionStatusIndicator
                    isConnected={isConnected}
                    isConnecting={isConnecting}
                    error={wsError}
                    connectionAttempts={0}
                    onRefresh={handleRefreshConnection}
                    showLabel={false}
                    size='small'
                  />
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Typography variant='body2' color='text.secondary'>
                    Notificaciones sin leer
                  </Typography>
                  <Typography variant='h6' sx={{ fontWeight: 700 }}>
                    {summary.unread}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Typography variant='body2' color='text.secondary'>
                    Alertas críticas
                  </Typography>
                  <Typography
                    variant='h6'
                    sx={{
                      fontWeight: 700,
                      color: summary.critical > 0 ? '#dc2626' : 'inherit'
                    }}
                  >
                    {summary.critical}
                  </Typography>
                </Box>

                {lastNotificationTime && (
                  <Box>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{ mb: 1 }}
                    >
                      Última actividad
                    </Typography>
                    <Typography
                      variant='caption'
                      sx={{
                        bgcolor: '#f3f4f6',
                        p: 1,
                        borderRadius: 1,
                        display: 'block'
                      }}
                    >
                      {lastNotificationTime.toLocaleTimeString()}
                    </Typography>
                  </Box>
                )}

                {connectionStatus.details && (
                  <Box>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{ mb: 1 }}
                    >
                      Detalles
                    </Typography>
                    <Typography
                      variant='caption'
                      sx={{
                        bgcolor: '#f3f4f6',
                        p: 1,
                        borderRadius: 1,
                        display: 'block'
                      }}
                    >
                      {connectionStatus.details}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Additional widgets can be added here */}
        <Grid item xs={12} lg={4}>
          {/* Placeholder for future widgets */}
          <Box sx={{ height: '100%', minHeight: 200 }} />
        </Grid>
      </Grid>

      {/* Real-time Alert Snackbar */}
      <Snackbar
        open={realtimeAlert.show}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        TransitionComponent={Fade}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={realtimeAlert.severity}
          sx={{
            borderRadius: 2,
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
          }}
        >
          {realtimeAlert.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default RealTimeDashboard
