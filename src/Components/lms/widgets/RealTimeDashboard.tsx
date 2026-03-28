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
import useDashboardNotifications from '../../../hooks/useDashboardNotifications'
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
  } = useDashboardNotifications({
    enabled: showConnectionStatus, // Only connect if status is shown (or always true if preferred)
    refreshInterval: refreshInterval,
    onNewNotification: (notification) => {
      setRealtimeAlert({
        message: `Nueva notificación: ${notification.title}`,
        severity: notification.severity === 'critical' ? 'error' : 'info',
        show: true
      })
    }
  })

  const isConnected = connectionStatus.connected
  const isConnecting = connectionStatus.connecting
  const wsError = connectionStatus.error
  const wsErrorMessage =
    typeof wsError === 'string'
      ? wsError
      : wsError
        ? String(wsError)
        : ''
  const notificationsErrorMessage =
    notificationsError instanceof Error
      ? notificationsError.message
      : notificationsError
        ? String(notificationsError)
        : ''

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }

    if (onNotificationClick) {
      onNotificationClick(notification)
      return
    }

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
                ? 'Actualización automática de respaldo'
                : 'Actualización manual'}
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

      {(wsErrorMessage || notificationsErrorMessage) && (
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
            {wsErrorMessage && !isRealTimeEnabled && (
              <Typography variant='body2'>
                Conexión WebSocket no disponible: {wsErrorMessage}
              </Typography>
            )}
            {isRealTimeEnabled && connectionMethod === 'polling' && (
              <Typography variant='body2'>
                Usando actualización automática como respaldo (cada{' '}
                {Math.round(refreshInterval / 1000)}s)
              </Typography>
            )}
            {notificationsErrorMessage && (
              <Typography variant='body2'>
                Error al cargar notificaciones: {notificationsErrorMessage}
              </Typography>
            )}
            {!isRealTimeEnabled && (
              <Typography variant='caption' color='text.secondary'>
                Las notificaciones requieren actualización manual. Algunas
                funciones de monitoreo pueden estar limitadas.
              </Typography>
            )}
          </Stack>
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={4}>
          <NotificationWidget
            notifications={notifications}
            summary={summary}
            loading={notificationsLoading}
            error={notificationsErrorMessage}
            onNotificationClick={handleNotificationClick}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onRefresh={refreshNotifications}
          />
        </Grid>

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
                Estado del monitoreo en tiempo real
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                Este resumen te ayuda a confirmar si las notificaciones se están recibiendo al
                instante o si el panel está funcionando con respaldo automático.
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
                        ? 'Respaldo automático'
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
                      {lastNotificationTime.toLocaleTimeString('es-CO')}
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

        <Grid item xs={12} lg={4}>
          <Card
            sx={{
              borderRadius: '16px',
              border: '1px dashed #d1d5db',
              height: '100%'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant='h6' sx={{ fontWeight: 700, mb: 1 }}>
                Siguiente capa del monitoreo
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Este espacio queda reservado para ampliar el monitoreo operativo del LMS cuando
                definamos un panel adicional de jobs, alertas o integraciones en vivo.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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

export default React.memo(RealTimeDashboard)
