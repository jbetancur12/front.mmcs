import React, { useState } from 'react'
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
  Divider
} from '@mui/material'
import {
  Notifications as NotificationsIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  MarkEmailRead as MarkEmailReadIcon,
  EmojiEvents as AwardIcon
} from '@mui/icons-material'

interface Notification {
  id: number
  type: 'assignment' | 'reminder' | 'deadline' | 'completion' | 'certificate'
  title: string
  message: string
  timestamp: string
  isRead: boolean
  priority: 'low' | 'medium' | 'high'
  courseId?: number
  userId?: number
  actionRequired?: boolean
}

// Mock data para notificaciones
const mockNotifications: Notification[] = [
  {
    id: 1,
    type: 'deadline',
    title: 'Curso próximo a vencer',
    message: 'El curso "Protección de Datos" vence en 2 días. Completa las lecciones restantes.',
    timestamp: '2024-01-20T10:30:00Z',
    isRead: false,
    priority: 'high',
    courseId: 2,
    actionRequired: true
  },
  {
    id: 2,
    type: 'assignment',
    title: 'Nuevo curso asignado',
    message: 'Se te ha asignado el curso "Seguridad en el Trabajo". Fecha límite: 15 de Febrero.',
    timestamp: '2024-01-19T14:15:00Z',
    isRead: false,
    priority: 'medium',
    courseId: 1,
    actionRequired: true
  },
  {
    id: 3,
    type: 'completion',
    title: 'Curso completado',
    message: 'Has completado exitosamente el curso "Comunicación Efectiva".',
    timestamp: '2024-01-18T16:45:00Z',
    isRead: true,
    priority: 'low',
    courseId: 3,
    actionRequired: false
  },
  {
    id: 4,
    type: 'certificate',
    title: 'Certificado disponible',
    message: 'Tu certificado para "Comunicación Efectiva" está listo para descargar.',
    timestamp: '2024-01-18T17:00:00Z',
    isRead: false,
    priority: 'medium',
    courseId: 3,
    actionRequired: true
  },
  {
    id: 5,
    type: 'reminder',
    title: 'Recordatorio de progreso',
    message: 'Llevas 3 días sin avanzar en "JavaScript Avanzado". ¡Continúa tu aprendizaje!',
    timestamp: '2024-01-17T09:00:00Z',
    isRead: true,
    priority: 'low',
    courseId: 4,
    actionRequired: false
  }
]

interface LmsNotificationCenterProps {
  userRole?: 'admin' | 'employee' | 'client'
  userId?: number
}

const LmsNotificationCenter: React.FC<LmsNotificationCenterProps> = ({ 
  userRole = 'employee',
  userId 
}) => {
  void userRole
  void userId
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread' | 'actionRequired'>('all')

  const unreadCount = notifications.filter(n => !n.isRead).length
  const actionRequiredCount = notifications.filter(n => n.actionRequired && !n.isRead).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <AssignmentIcon color="primary" />
      case 'deadline':
        return <WarningIcon color="error" />
      case 'reminder':
        return <ScheduleIcon color="warning" />
      case 'completion':
        return <CheckCircleIcon color="success" />
      case 'certificate':
        return <AwardIcon color="warning" />
      default:
        return <NotificationsIcon />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error'
      case 'medium':
        return 'warning'
      case 'low':
        return 'info'
      default:
        return 'default'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Hace unos minutos'
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} horas`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `Hace ${diffInDays} días`
    }
  }

  const handleMarkAsRead = (notificationId: number) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    )
  }

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification)
    setOpenDialog(true)
    if (!notification.isRead) {
      handleMarkAsRead(notification.id)
    }
  }

  const handleTakeAction = (notification: Notification) => {
    // Lógica para manejar acciones específicas según el tipo de notificación
    switch (notification.type) {
      case 'assignment':
      case 'deadline':
      case 'reminder':
        // Navegar al curso
        console.log('Navigating to course:', notification.courseId)
        break
      case 'certificate':
        // Descargar certificado
        console.log('Downloading certificate for course:', notification.courseId)
        break
      default:
        break
    }
    setOpenDialog(false)
  }

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.isRead
      case 'actionRequired':
        return notification.actionRequired && !notification.isRead
      default:
        return true
    }
  })

  return (
    <Box>
      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
              <Typography variant="h6">
                Centro de Notificaciones
              </Typography>
            </Box>
          }
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Filtrar</InputLabel>
                <Select
                  value={filter}
                  label="Filtrar"
                  onChange={(e) => setFilter(e.target.value as any)}
                >
                  <MenuItem value="all">Todas</MenuItem>
                  <MenuItem value="unread">No leídas ({unreadCount})</MenuItem>
                  <MenuItem value="actionRequired">Acción requerida ({actionRequiredCount})</MenuItem>
                </Select>
              </FormControl>
              {unreadCount > 0 && (
                <Button
                  size="small"
                  onClick={handleMarkAllAsRead}
                  startIcon={<MarkEmailReadIcon />}
                >
                  Marcar todas como leídas
                </Button>
              )}
            </Box>
          }
        />
        <CardContent sx={{ p: 0 }}>
          {filteredNotifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No hay notificaciones
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filter === 'unread' 
                  ? 'No tienes notificaciones sin leer'
                  : filter === 'actionRequired'
                  ? 'No hay notificaciones que requieran acción'
                  : 'No tienes notificaciones en este momento'
                }
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
                      backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                      '&:hover': {
                        backgroundColor: 'action.selected'
                      }
                    }}
                  >
                    <ListItemIcon>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body1"
                            fontWeight={notification.isRead ? 'normal' : 'bold'}
                          >
                            {notification.title}
                          </Typography>
                          <Chip
                            label={notification.priority}
                            size="small"
                            color={getPriorityColor(notification.priority) as any}
                            sx={{ fontSize: '0.7rem' }}
                          />
                          {notification.actionRequired && !notification.isRead && (
                            <Chip
                              label="Acción requerida"
                              size="small"
                              color="error"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTimestamp(notification.timestamp)}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      {!notification.isRead && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMarkAsRead(notification.id)
                          }}
                          title="Marcar como leída"
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

      {/* Dialog para detalles de notificación */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedNotification && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {getNotificationIcon(selectedNotification.type)}
                <Typography variant="h6">
                  {selectedNotification.title}
                </Typography>
                <Chip
                  label={selectedNotification.priority}
                  size="small"
                  color={getPriorityColor(selectedNotification.priority) as any}
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedNotification.message}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatTimestamp(selectedNotification.timestamp)}
              </Typography>
              
              {selectedNotification.actionRequired && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Esta notificación requiere que tomes una acción.
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>
                Cerrar
              </Button>
              {selectedNotification.actionRequired && (
                <Button
                  variant="contained"
                  onClick={() => handleTakeAction(selectedNotification)}
                  startIcon={
                    selectedNotification.type === 'certificate' ? <AwardIcon /> : <AssignmentIcon />
                  }
                >
                  {selectedNotification.type === 'certificate' 
                    ? 'Descargar Certificado'
                    : selectedNotification.type === 'assignment'
                    ? 'Ir al Curso'
                    : 'Continuar Curso'
                  }
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
