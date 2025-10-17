import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Badge,
  Menu,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Button,
  Divider,
  Tooltip,
  Alert,
  Skeleton,
  Stack
} from '@mui/material'
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Settings as SystemIcon,
  CheckCircle as CheckIcon,
  Refresh as RefreshIcon,
  MarkEmailRead as MarkReadIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  School as CourseIcon,
  EmojiEvents as CertificateIcon
} from '@mui/icons-material'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  Notification, 
  NotificationWidgetProps,
  NotificationSeverity 
} from '../../../types/notifications'

// Color palette
const colors = {
  critical: '#dc2626',
  warning: '#d97706',
  info: '#3b82f6',
  system: '#6b7280',
  success: '#059669',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937'
  }
}

const getSeverityIcon = (severity: NotificationSeverity) => {
  switch (severity) {
    case 'critical':
      return <ErrorIcon sx={{ color: colors.critical }} />
    case 'warning':
      return <WarningIcon sx={{ color: colors.warning }} />
    case 'info':
      return <InfoIcon sx={{ color: colors.info }} />
    case 'system':
      return <SystemIcon sx={{ color: colors.system }} />
    default:
      return <InfoIcon sx={{ color: colors.info }} />
  }
}

const getSeverityColor = (severity: NotificationSeverity) => {
  switch (severity) {
    case 'critical':
      return colors.critical
    case 'warning':
      return colors.warning
    case 'info':
      return colors.info
    case 'system':
      return colors.system
    default:
      return colors.info
  }
}

const getNotificationTypeIcon = (notification: Notification) => {
  const metadata = notification.metadata || {}
  
  switch (metadata.type) {
    case 'mandatory_deadline':
    case 'new_assignment':
      return <AssignmentIcon sx={{ fontSize: 16 }} />
    case 'low_completion':
      return <CourseIcon sx={{ fontSize: 16 }} />
    case 'certificate_expiry':
      return <CertificateIcon sx={{ fontSize: 16 }} />
    case 'job_failure':
    case 'performance_issue':
      return <SystemIcon sx={{ fontSize: 16 }} />
    default:
      return getSeverityIcon(notification.severity)
  }
}

const NotificationWidget: React.FC<NotificationWidgetProps> = ({
  notifications = [],
  summary = { total: 0, unread: 0, critical: 0, warning: 0, info: 0, system: 0 },
  loading = false,
  error,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onRefresh
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
    if (onNotificationClick) {
      onNotificationClick(notification)
    }
    handleClose()
  }

  const handleMarkAllAsRead = () => {
    if (onMarkAllAsRead) {
      onMarkAllAsRead()
    }
  }

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh()
    }
  }

  // Sort notifications by timestamp (newest first) and unread status
  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.read !== b.read) {
      return a.read ? 1 : -1 // Unread first
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })

  const recentNotifications = sortedNotifications.slice(0, 5)

  if (loading) {
    return (
      <Card sx={{
        borderRadius: '16px',
        border: `1px solid ${colors.gray[200]}`,
        height: '100%'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="40%" height={20} />
            </Box>
          </Box>
          <Stack spacing={1}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
            ))}
          </Stack>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card sx={{
      borderRadius: '16px',
      border: `1px solid ${colors.gray[200]}`,
      height: '100%',
      transition: 'all 0.3s ease-in-out',
      '&:hover': {
        borderColor: summary.unread > 0 ? colors.warning : colors.gray[300],
        boxShadow: summary.unread > 0 
          ? `0 8px 25px rgba(217, 119, 6, 0.15)` 
          : `0 4px 12px rgba(0,0,0,0.1)`
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Badge 
              badgeContent={summary.unread} 
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.75rem',
                  fontWeight: 700
                }
              }}
            >
              <IconButton
                onClick={handleClick}
                sx={{
                  bgcolor: summary.unread > 0 ? '#fef3c7' : colors.gray[100],
                  color: summary.unread > 0 ? colors.warning : colors.gray[600],
                  mr: 2,
                  '&:hover': {
                    bgcolor: summary.unread > 0 ? '#fde68a' : colors.gray[200]
                  }
                }}
              >
                {summary.unread > 0 ? <NotificationsActiveIcon /> : <NotificationsIcon />}
              </IconButton>
            </Badge>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: colors.gray[800] }}>
                Notificaciones
              </Typography>
              <Typography variant="body2" color={colors.gray[500]}>
                {summary.unread > 0 
                  ? `${summary.unread} sin leer de ${summary.total}`
                  : `${summary.total} notificaciones`
                }
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Actualizar">
            <IconButton
              onClick={handleRefresh}
              size="small"
              sx={{
                color: colors.gray[500],
                '&:hover': { color: colors.gray[700] }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            Error al cargar notificaciones: {error}
          </Alert>
        )}

        {/* Summary Chips */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          {summary.critical > 0 && (
            <Chip
              icon={<ErrorIcon />}
              label={`${summary.critical} Críticas`}
              size="small"
              sx={{
                bgcolor: '#fee2e2',
                color: colors.critical,
                fontWeight: 600,
                '& .MuiChip-icon': { color: colors.critical }
              }}
            />
          )}
          {summary.warning > 0 && (
            <Chip
              icon={<WarningIcon />}
              label={`${summary.warning} Advertencias`}
              size="small"
              sx={{
                bgcolor: '#fef3c7',
                color: colors.warning,
                fontWeight: 600,
                '& .MuiChip-icon': { color: colors.warning }
              }}
            />
          )}
          {summary.info > 0 && (
            <Chip
              icon={<InfoIcon />}
              label={`${summary.info} Info`}
              size="small"
              sx={{
                bgcolor: '#eff6ff',
                color: colors.info,
                fontWeight: 600,
                '& .MuiChip-icon': { color: colors.info }
              }}
            />
          )}
          {summary.system > 0 && (
            <Chip
              icon={<SystemIcon />}
              label={`${summary.system} Sistema`}
              size="small"
              sx={{
                bgcolor: colors.gray[100],
                color: colors.system,
                fontWeight: 600,
                '& .MuiChip-icon': { color: colors.system }
              }}
            />
          )}
        </Box>

        {/* Recent Notifications Preview */}
        {recentNotifications.length > 0 ? (
          <Box>
            <Typography variant="body2" sx={{ 
              fontWeight: 600, 
              color: colors.gray[700], 
              mb: 2 
            }}>
              Recientes
            </Typography>
            <Stack spacing={1}>
              {recentNotifications.map((notification) => (
                <Box
                  key={notification.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    p: 2,
                    borderRadius: '12px',
                    bgcolor: notification.read ? colors.gray[50] : '#fefce8',
                    border: `1px solid ${notification.read ? colors.gray[100] : '#fde047'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: notification.read ? colors.gray[100] : '#fef08a',
                      transform: 'translateX(4px)'
                    }
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <Box sx={{ mr: 2, mt: 0.5 }}>
                    {getNotificationTypeIcon(notification)}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: notification.read ? 500 : 700,
                        color: colors.gray[800],
                        mb: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {notification.title}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color={colors.gray[500]}
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}
                    >
                      <ScheduleIcon sx={{ fontSize: 12 }} />
                      {formatDistanceToNow(new Date(notification.timestamp), { 
                        addSuffix: true, 
                        locale: es 
                      })}
                    </Typography>
                  </Box>
                  {!notification.read && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: getSeverityColor(notification.severity),
                        ml: 1,
                        mt: 1
                      }}
                    />
                  )}
                </Box>
              ))}
            </Stack>
          </Box>
        ) : (
          <Box sx={{ 
            textAlign: 'center', 
            py: 4,
            color: colors.gray[500]
          }}>
            <CheckIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="body2">
              No hay notificaciones recientes
            </Typography>
          </Box>
        )}

        {/* Actions */}
        {summary.total > 0 && (
          <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${colors.gray[200]}` }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                onClick={handleClick}
                sx={{
                  color: colors.gray[700],
                  fontWeight: 600,
                  textTransform: 'none',
                  flex: 1
                }}
              >
                Ver todas
              </Button>
              {summary.unread > 0 && (
                <Button
                  size="small"
                  startIcon={<MarkReadIcon />}
                  onClick={handleMarkAllAsRead}
                  sx={{
                    color: colors.info,
                    fontWeight: 600,
                    textTransform: 'none'
                  }}
                >
                  Marcar leídas
                </Button>
              )}
            </Box>
          </Box>
        )}

        {/* Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          PaperProps={{
            sx: {
              width: 400,
              maxHeight: 500,
              borderRadius: '12px',
              border: `1px solid ${colors.gray[200]}`,
              boxShadow: '0 12px 30px rgba(0,0,0,0.15)'
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ p: 2, borderBottom: `1px solid ${colors.gray[200]}` }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Todas las Notificaciones
            </Typography>
            {summary.unread > 0 && (
              <Button
                size="small"
                startIcon={<MarkReadIcon />}
                onClick={handleMarkAllAsRead}
                sx={{
                  color: colors.info,
                  fontWeight: 600,
                  textTransform: 'none',
                  mt: 1
                }}
              >
                Marcar todas como leídas
              </Button>
            )}
          </Box>
          
          <List sx={{ p: 0, maxHeight: 350, overflow: 'auto' }}>
            {sortedNotifications.length > 0 ? (
              sortedNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    button
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      bgcolor: notification.read ? 'transparent' : '#fefce8',
                      '&:hover': {
                        bgcolor: notification.read ? colors.gray[50] : '#fef08a'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getNotificationTypeIcon(notification)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: notification.read ? 500 : 700,
                            color: colors.gray[800]
                          }}
                        >
                          {notification.title}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography 
                            variant="caption" 
                            color={colors.gray[600]}
                            sx={{ display: 'block', mb: 0.5 }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color={colors.gray[500]}>
                            {formatDistanceToNow(new Date(notification.timestamp), { 
                              addSuffix: true, 
                              locale: es 
                            })}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      {!notification.read && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: getSeverityColor(notification.severity)
                          }}
                        />
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < sortedNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))
            ) : (
              <ListItem>
                <ListItemText
                  primary={
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <CheckIcon sx={{ fontSize: 48, color: colors.gray[400], mb: 1 }} />
                      <Typography variant="body2" color={colors.gray[500]}>
                        No hay notificaciones
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            )}
          </List>
        </Menu>
      </CardContent>
    </Card>
  )
}

export default NotificationWidget