import React, { useMemo, useState } from 'react'
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

const LmsNotificationCenter: React.FC<LmsNotificationCenterProps> = ({
  userRole = 'employee',
  userId
}) => {
  void userRole
  void userId

  const navigate = useNavigate()
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread' | 'actionRequired'>('all')

  const { data, isLoading, error } = useNotifications({
    refetchOnWindowFocus: false
  })
  const markAsReadMutation = useMarkNotificationAsRead()
  const markAllAsReadMutation = useMarkAllNotificationsAsRead()

  const notifications = data?.notifications || []

  const unreadCount = notifications.filter((notification) => !notification.read).length
  const actionRequiredCount = notifications.filter(
    (notification) => hasNotificationAction(notification) && !notification.read
  ).length

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      switch (filter) {
        case 'unread':
          return !notification.read
        case 'actionRequired':
          return hasNotificationAction(notification) && !notification.read
        default:
          return true
      }
    })
  }, [filter, notifications])

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
                {filter === 'unread'
                  ? 'No tienes notificaciones sin leer.'
                  : filter === 'actionRequired'
                    ? 'No hay notificaciones que requieran una acción inmediata.'
                    : 'No tienes notificaciones en este momento.'}
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
                            {notification.title}
                          </Typography>
                          <Chip
                            label={notification.severity}
                            size='small'
                            color={getPriorityColor(notification)}
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
                            {notification.message}
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
                <Typography variant='h6'>{selectedNotification.title}</Typography>
                <Chip
                  label={selectedNotification.severity}
                  size='small'
                  color={getPriorityColor(selectedNotification)}
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant='body1' sx={{ mb: 2 }}>
                {selectedNotification.message}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {formatTimestamp(selectedNotification.timestamp)}
              </Typography>

              {hasNotificationAction(selectedNotification) && (
                <Alert severity='info' sx={{ mt: 2 }}>
                  Esta notificación tiene una acción asociada dentro del LMS.
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
