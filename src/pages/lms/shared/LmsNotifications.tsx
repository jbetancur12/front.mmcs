import React, { useState, useEffect } from 'react'
import {
  Box,
  Badge,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Button,
  Divider,
  Chip
} from '@mui/material'
import {
  Notifications as NotificationsIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface TrainingNotification {
  id: string
  type: 'assignment' | 'reminder' | 'completion' | 'deadline'
  title: string
  message: string
  courseId?: string
  courseName?: string
  createdAt: Date
  read: boolean
  priority: 'low' | 'medium' | 'high'
  actionUrl?: string
}

interface LmsNotificationsProps {
  notifications: TrainingNotification[]
  onNotificationRead: (notificationId: string) => void
  onNotificationClick: (notification: TrainingNotification) => void
  onMarkAllRead: () => void
}

const LmsNotifications: React.FC<LmsNotificationsProps> = ({
  notifications,
  onNotificationRead,
  onNotificationClick,
  onMarkAllRead
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length)
  }, [notifications])

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleNotificationClick = (notification: TrainingNotification) => {
    if (!notification.read) {
      onNotificationRead(notification.id)
    }
    onNotificationClick(notification)
    handleClose()
  }

  const getNotificationIcon = (type: string, priority: string) => {
    const iconProps = {
      color: priority === 'high' ? 'error' : 
             priority === 'medium' ? 'warning' : 'primary'
    } as const

    switch (type) {
      case 'assignment':
        return <AssignmentIcon {...iconProps} />
      case 'reminder':
        return <WarningIcon {...iconProps} />
      case 'completion':
        return <CheckCircleIcon color="success" />
      case 'deadline':
        return <WarningIcon color="error" />
      default:
        return <SchoolIcon {...iconProps} />
    }
  }

  const getNotificationColor = (type: string, priority: string) => {
    if (type === 'completion') return 'success'
    if (type === 'deadline' || priority === 'high') return 'error'
    if (priority === 'medium') return 'warning'
    return 'primary'
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'assignment':
        return 'Asignación'
      case 'reminder':
        return 'Recordatorio'
      case 'completion':
        return 'Completado'
      case 'deadline':
        return 'Fecha límite'
      default:
        return 'Notificación'
    }
  }

  const open = Boolean(anchorEl)

  return (
    <>
      <IconButton
        onClick={handleClick}
        color="inherit"
        aria-label="notificaciones de entrenamiento"
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { width: 400, maxHeight: 500 }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">
              Notificaciones de Entrenamiento
            </Typography>
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          {unreadCount > 0 && (
            <Box sx={{ mb: 2 }}>
              <Button
                size="small"
                onClick={onMarkAllRead}
                variant="outlined"
              >
                Marcar todas como leídas
              </Button>
            </Box>
          )}
        </Box>

        <Divider />

        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <SchoolIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">
              No hay notificaciones de entrenamiento
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 350, overflow: 'auto' }}>
            {notifications
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
              .map((notification) => (
                <ListItem
                  key={notification.id}
                  button
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    backgroundColor: notification.read ? 'transparent' : 'action.hover',
                    borderLeft: notification.read ? 'none' : '4px solid',
                    borderLeftColor: `${getNotificationColor(notification.type, notification.priority)}.main`,
                    '&:hover': {
                      backgroundColor: 'action.selected'
                    }
                  }}
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification.type, notification.priority)}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: notification.read ? 'normal' : 'bold',
                            flexGrow: 1
                          }}
                        >
                          {notification.title}
                        </Typography>
                        <Chip
                          label={getTypeLabel(notification.type)}
                          size="small"
                          color={getNotificationColor(notification.type, notification.priority)}
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 0.5 }}
                        >
                          {notification.message}
                        </Typography>
                        {notification.courseName && (
                          <Typography
                            variant="caption"
                            color="primary.main"
                            sx={{ display: 'block', mb: 0.5 }}
                          >
                            Curso: {notification.courseName}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.disabled">
                          {formatDistanceToNow(notification.createdAt, {
                            addSuffix: true,
                            locale: es
                          })}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
          </List>
        )}

        {notifications.length > 0 && (
          <>
            <Divider />
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Button
                size="small"
                variant="text"
                onClick={() => {
                  // Navigate to full notifications page
                  handleClose()
                }}
              >
                Ver todas las notificaciones
              </Button>
            </Box>
          </>
        )}
      </Popover>
    </>
  )
}

// Hook for managing training notifications
export const useTrainingNotifications = () => {
  const [notifications, setNotifications] = useState<TrainingNotification[]>([])

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockNotifications: TrainingNotification[] = [
      {
        id: '1',
        type: 'assignment',
        title: 'Nuevo curso asignado',
        message: 'Se te ha asignado el curso "Seguridad en el Trabajo"',
        courseId: '1',
        courseName: 'Seguridad en el Trabajo',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: false,
        priority: 'high'
      },
      {
        id: '2',
        type: 'reminder',
        title: 'Recordatorio de curso pendiente',
        message: 'Tienes un curso obligatorio pendiente de completar',
        courseId: '2',
        courseName: 'Capacitación en Primeros Auxilios',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        read: false,
        priority: 'medium'
      },
      {
        id: '3',
        type: 'completion',
        title: 'Curso completado',
        message: 'Has completado exitosamente el curso y obtenido tu certificado',
        courseId: '3',
        courseName: 'Introducción a JavaScript',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        read: true,
        priority: 'low'
      },
      {
        id: '4',
        type: 'deadline',
        title: 'Fecha límite próxima',
        message: 'El curso debe completarse antes del 31 de diciembre',
        courseId: '4',
        courseName: 'Compliance y Regulaciones',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        read: false,
        priority: 'high'
      }
    ]

    setNotifications(mockNotifications)
  }, [])

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    )
  }

  const addNotification = (notification: Omit<TrainingNotification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: TrainingNotification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date(),
      read: false
    }
    setNotifications(prev => [newNotification, ...prev])
  }

  return {
    notifications,
    markAsRead,
    markAllAsRead,
    addNotification
  }
}

export default LmsNotifications