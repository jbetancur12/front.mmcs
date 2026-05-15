import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Badge,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  CircularProgress
} from '@mui/material'
import {
  Notifications as NotificationsIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  MarkEmailRead as MarkEmailReadIcon,
  EmojiEvents as AwardIcon,
  Info as InfoIcon,
  Settings as SettingsIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import {
  useNotifications,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead
} from '../../../hooks/useLms'
import type { Notification } from '../../../types/notifications'

interface LmsNotificationCenterProps {
  userRole?: 'admin' | 'employee' | 'client'
  userId?: number
}

const getNotificationIcon = (notification: Notification) => {
  const type = notification.metadata?.type

  switch (type) {
    case 'new_assignment':
      return <AssignmentIcon color='primary' />
    case 'mandatory_deadline':
      return <WarningIcon color='error' />
    case 'certificate_expiry':
      return <AwardIcon color='warning' />
    case 'system_alert':
    case 'job_failure':
    case 'performance_issue':
      return <SettingsIcon color='warning' />
    default:
      switch (notification.severity) {
        case 'critical':
          return <WarningIcon color='error' />
        case 'warning':
          return <ScheduleIcon color='warning' />
        case 'system':
          return <SettingsIcon color='action' />
        default:
          return <InfoIcon color='info' />
      }
  }
}

const getPriorityColor = (notification: Notification) => {
  switch (notification.severity) {
    case 'critical':
      return 'error'
    case 'warning':
      return 'warning'
    case 'system':
      return 'default'
    default:
      return 'info'
  }
}

const getNotificationContextLabel = (notification: Notification) => {
  const type = notification.metadata?.type

  switch (type) {
    case 'course_assigned':
      return notification.metadata?.isMandatory ? 'Curso obligatorio asignado' : 'Curso asignado'
    case 'mandatory_reminder':
      return 'Recordatorio obligatorio'
    case 'deadline_reminder':
      return 'Fecha límite próxima'
    case 'course_overdue':
      return 'Curso vencido'
    case 'course_completed':
      return 'Curso completado'
    case 'certificate_earned':
      return 'Certificado generado'
    default:
      return 'Aviso LMS'
  }
}

const getNotificationDisplayTitle = (notification: Notification) => {
  const type = notification.metadata?.type

  switch (type) {
    case 'course_assigned':
      return notification.metadata?.isMandatory ? 'Nuevo curso obligatorio' : 'Nuevo curso disponible'
    case 'mandatory_reminder':
      return 'Recordatorio de curso obligatorio'
    case 'deadline_reminder':
      return 'Curso próximo a vencer'
    case 'course_overdue':
      return 'Curso vencido'
    case 'course_completed':
      return 'Curso completado'
    case 'certificate_earned':
      return 'Certificado disponible'
    default:
      return notification.title
  }
}

const getNotificationDisplayMessage = (notification: Notification) => {
  const type = notification.metadata?.type
  const courseTitle = notification.metadata?.courseTitle
  const certificateNumber = notification.metadata?.certificateNumber

  switch (type) {
    case 'course_assigned':
      return courseTitle
        ? `Ya puedes comenzar "${courseTitle}" desde tu ruta de aprendizaje.`
        : 'Ya puedes comenzar el curso asignado desde tu ruta de aprendizaje.'
    case 'mandatory_reminder':
      return courseTitle
        ? `Aun tienes pendiente "${courseTitle}". Conviene retomarlo cuanto antes.`
        : 'Tienes un curso obligatorio pendiente. Conviene retomarlo cuanto antes.'
    case 'deadline_reminder':
      return courseTitle
        ? `"${courseTitle}" está cerca de su fecha límite.`
        : 'Un curso asignado está cerca de su fecha límite.'
    case 'course_overdue':
      return courseTitle
        ? `"${courseTitle}" ya venció y requiere atención inmediata.`
        : 'Un curso asignado ya venció y requiere atención inmediata.'
    case 'course_completed':
      return notification.metadata?.hasCertificate
        ? 'Completaste el curso y tu certificado ya está disponible.'
        : 'Completaste el curso correctamente.'
    case 'certificate_earned':
      return certificateNumber
        ? `Tu certificado ${certificateNumber} ya está listo para consultar o compartir.`
        : 'Tu certificado ya está listo para consultar o compartir.'
    default:
      return notification.message
  }
}

const formatTimestamp = (timestamp: Notification['timestamp']) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 1) {
    return 'Hace unos minutos'
  }

  if (diffInHours < 24) {
    return `Hace ${diffInHours} horas`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  return `Hace ${diffInDays} días`
}

const hasNotificationAction = (notification: Notification) => {
  return Boolean(
    notification.actionUrl ||
      notification.metadata?.courseId ||
      notification.metadata?.assignmentId ||
      notification.metadata?.certificateId
  )
}

const getEmptyStateMessage = (
  filter: 'all' | 'unread' | 'actionRequired',
  userRole: 'admin' | 'employee' | 'client'
) => {
  if (filter === 'unread') {
    return 'No tienes notificaciones sin leer.'
  }

  if (filter === 'actionRequired') {
    return userRole === 'admin'
      ? 'No hay avisos que requieran una acción inmediata. Si reaparece riesgo, lo verás aquí antes de volver a asignaciones o cumplimiento.'
      : 'No hay notificaciones que requieran una acción inmediata.'
  }

  return userRole === 'admin'
    ? 'No hay avisos recientes del LMS para operación en este momento.'
    : 'No tienes notificaciones en este momento.'
}

const LmsNotificationCenter: React.FC<LmsNotificationCenterProps> = ({
  userRole = 'employee',
  userId
}) => {
  void userId

  const navigate = useNavigate()
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread' | 'actionRequired'>('all')
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)

  const { data, isLoading, error } = useNotifications({
    refetchOnWindowFocus: false
  })
  const markAsReadMutation = useMarkNotificationAsRead({
    onSuccess: () => {
      setFeedbackMessage('Notificación marcada como leída.')
    }
  })
  const markAllAsReadMutation = useMarkAllNotificationsAsRead({
    onSuccess: () => {
      setFeedbackMessage('Se actualizó tu bandeja y ya no quedan avisos sin leer.')
    }
  })

  const notifications = data?.notifications || []

  const unreadCount = Number(
    data?.summary?.unread ?? notifications.filter((notification) => !notification.read).length
  )
  const actionRequiredCount = notifications.filter(
    (notification) => hasNotificationAction(notification) && !notification.read
  ).length
  const reviewedCount = notifications.filter((notification) => notification.read).length

  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((notification) => {
      switch (filter) {
        case 'unread':
          return !notification.read
        case 'actionRequired':
          return hasNotificationAction(notification) && !notification.read
        default:
          return true
      }
      })
      .sort((left, right) => {
        const leftPriority =
          (hasNotificationAction(left) && !left.read ? 2 : 0) + (!left.read ? 1 : 0)
        const rightPriority =
          (hasNotificationAction(right) && !right.read ? 2 : 0) + (!right.read ? 1 : 0)

        if (leftPriority !== rightPriority) {
          return rightPriority - leftPriority
        }

        return new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
      })
  }, [filter, notifications])

  useEffect(() => {
    if (!feedbackMessage) {
      return
    }

    const timeout = window.setTimeout(() => {
      setFeedbackMessage(null)
    }, 3500)

    return () => window.clearTimeout(timeout)
  }, [feedbackMessage])

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId)
  }

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate()
  }

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification)
    setOpenDialog(true)

    if (!notification.read) {
      handleMarkAsRead(notification.id)
    }
  }

  const handleTakeAction = (notification: Notification) => {
    if (notification.actionUrl) {
      navigate(notification.actionUrl)
      setOpenDialog(false)
      return
    }

    if (notification.metadata?.certificateId) {
      navigate(`/lms/certificate/${notification.metadata.certificateId}`)
      setOpenDialog(false)
      return
    }

    if (notification.metadata?.courseId) {
      navigate(`/lms/course/${notification.metadata.courseId}`)
      setOpenDialog(false)
      return
    }

    if (notification.metadata?.assignmentId) {
      navigate('/lms/employee')
      setOpenDialog(false)
    }
  }

  return (
    <Box>
      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Badge badgeContent={unreadCount} color='error'>
                <NotificationsIcon />
              </Badge>
              <Typography variant='h6'>Centro de notificaciones</Typography>
            </Box>
          }
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl size='small' sx={{ minWidth: 150 }}>
                <InputLabel>Filtrar</InputLabel>
                <Select
                  value={filter}
                  label='Filtrar'
                  onChange={(event) =>
                    setFilter(event.target.value as 'all' | 'unread' | 'actionRequired')
                  }
                >
                  <MenuItem value='all'>Todas</MenuItem>
                  <MenuItem value='unread'>No leídas ({unreadCount})</MenuItem>
                  <MenuItem value='actionRequired'>
                    Requieren acción ({actionRequiredCount})
                  </MenuItem>
                </Select>
              </FormControl>
              {unreadCount > 0 && (
                <Button
                  size='small'
                  onClick={handleMarkAllAsRead}
                  startIcon={<MarkEmailReadIcon />}
                  disabled={markAllAsReadMutation.isLoading}
                >
                  Marcar todas
                </Button>
              )}
            </Box>
          }
        />
        <CardContent sx={{ p: 0 }}>
          {!isLoading && !error && (
            <Box sx={{ px: 3, pt: 2 }}>
              {feedbackMessage ? (
                <Alert severity='success' sx={{ mb: 2 }}>
                  {feedbackMessage}
                </Alert>
              ) : null}
              <Alert severity={actionRequiredCount > 0 ? 'warning' : 'info'} sx={{ mb: 2 }}>
                {actionRequiredCount > 0
                  ? `Tienes ${actionRequiredCount} aviso(s) que te pueden devolver a una acción concreta del LMS.`
                  : unreadCount > 0
                    ? `Tienes ${unreadCount} aviso(s) por revisar.`
                    : `Bandeja al día. ${reviewedCount} aviso(s) revisado(s) recientemente.`}
              </Alert>
            </Box>
          )}
          {isLoading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography color='text.secondary'>Cargando notificaciones...</Typography>
            </Box>
          ) : error ? (
            <Box sx={{ p: 3 }}>
              <Alert severity='error'>
                No se pudieron cargar las notificaciones reales del LMS.
              </Alert>
            </Box>
          ) : filteredNotifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant='h6' color='text.secondary'>
                No hay notificaciones
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {getEmptyStateMessage(filter, userRole)}
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    button
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      backgroundColor: notification.read ? 'transparent' : 'action.hover',
                      '&:hover': {
                        backgroundColor: 'action.selected'
                      }
                    }}
                  >
                    <ListItemIcon>{getNotificationIcon(notification)}</ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography
                            variant='body1'
                            fontWeight={notification.read ? 'normal' : 'bold'}
                          >
                            {getNotificationDisplayTitle(notification)}
                          </Typography>
                          <Chip
                            label={notification.severity}
                            size='small'
                            color={getPriorityColor(notification)}
                            sx={{ fontSize: '0.7rem' }}
                          />
                          <Chip
                            label={getNotificationContextLabel(notification)}
                            size='small'
                            variant='outlined'
                            sx={{ fontSize: '0.7rem' }}
                          />
                          {hasNotificationAction(notification) && !notification.read && (
                            <Chip
                              label='Acción disponible'
                              size='small'
                              color='primary'
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant='body2' color='text.secondary'>
                            {getNotificationDisplayMessage(notification)}
                          </Typography>
                          <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                            {notification.metadata?.courseTitle ||
                              notification.metadata?.certificateNumber ||
                              (notification.metadata?.isMandatory ? 'Capacitación obligatoria' : null) ||
                              'Notificación del LMS'}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {formatTimestamp(notification.timestamp)}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      {!notification.read && (
                        <IconButton
                          size='small'
                          onClick={(event) => {
                            event.stopPropagation()
                            handleMarkAsRead(notification.id)
                          }}
                          title='Marcar como leída'
                        >
                          <MarkEmailReadIcon />
                        </IconButton>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < filteredNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth='sm' fullWidth>
        {selectedNotification && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                {getNotificationIcon(selectedNotification)}
                <Typography variant='h6'>
                  {getNotificationDisplayTitle(selectedNotification)}
                </Typography>
                <Chip
                  label={selectedNotification.severity}
                  size='small'
                  color={getPriorityColor(selectedNotification)}
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant='body1' sx={{ mb: 2 }}>
                {getNotificationDisplayMessage(selectedNotification)}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {formatTimestamp(selectedNotification.timestamp)}
              </Typography>

              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={getNotificationContextLabel(selectedNotification)}
                  size='small'
                  variant='outlined'
                />
                {selectedNotification.metadata?.courseTitle && (
                  <Chip
                    label={selectedNotification.metadata.courseTitle}
                    size='small'
                    variant='outlined'
                  />
                )}
                {selectedNotification.metadata?.certificateNumber && (
                  <Chip
                    label={`Certificado ${selectedNotification.metadata.certificateNumber}`}
                    size='small'
                    variant='outlined'
                  />
                )}
              </Box>

              {hasNotificationAction(selectedNotification) && (
                <Alert severity='info' sx={{ mt: 2 }}>
                  Esta notificación te puede devolver al punto correcto del LMS para continuar.
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>Cerrar</Button>
              {hasNotificationAction(selectedNotification) && (
                <Button
                  variant='contained'
                  onClick={() => handleTakeAction(selectedNotification)}
                  startIcon={
                    selectedNotification.metadata?.certificateId ? (
                      <AwardIcon />
                    ) : (
                      <AssignmentIcon />
                    )
                  }
                >
                  {selectedNotification.actionLabel || 'Abrir en LMS'}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  )
}

export default LmsNotificationCenter
