import { useState } from 'react'
import {
  Badge,
  Box,
  Chip,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Popper,
  Stack,
  Typography
} from '@mui/material'
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined'
import {
  useCalibrationUnreadCount,
  useCalibrationNotifications,
  useCalibrationNotificationMutations,
  CalibrationNotification
} from '../../hooks/useCalibrationNotifications'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

const PRIORITY_COLORS: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  urgent: 'error',
  high: 'warning',
  normal: 'info',
  low: 'default'
}

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  ods_issued: 'ODS emitida',
  adjustment_reported: 'Novedad reportada',
  adjustment_technical_reviewed: 'Revisión técnica',
  cut_ready_for_invoicing: 'Listo para facturar',
  cut_invoiced: 'Corte facturado'
}

const NotificationBell = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const navigate = useNavigate()

  const { data: countData } = useCalibrationUnreadCount()
  const { data: notifData } = useCalibrationNotifications({ limit: 5, showRead: false })
  const { markAsRead } = useCalibrationNotificationMutations()

  const unreadCount = countData?.unreadCount ?? 0
  const notifications = notifData?.notifications ?? []

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleNotificationClick = (notification: CalibrationNotification) => {
    markAsRead.mutate(notification.id)
    if (notification.actionUrl) {
      navigate(notification.actionUrl)
    }
    handleClose()
  }

  const open = Boolean(anchorEl)

  return (
    <>
      <IconButton
        onClick={handleClick}
        size='small'
        sx={{ color: open ? '#059669' : 'text.secondary', position: 'relative' }}
      >
        <Badge
          badgeContent={unreadCount}
          color='error'
          max={99}
          sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', minWidth: 16, height: 16 } }}
        >
          <NotificationsOutlinedIcon />
        </Badge>
      </IconButton>
      <Popper
        open={open}
        anchorEl={anchorEl}
        placement='bottom-end'
        sx={{ zIndex: 1300 }}
        modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
      >
        <Paper
          elevation={8}
          sx={{
            width: 360,
            maxHeight: 420,
            borderRadius: '14px',
            overflow: 'hidden',
            border: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='center'
            sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}
          >
            <Typography variant='subtitle2' fontWeight={700}>Notificaciones</Typography>
            {unreadCount > 0 ? (
              <Chip size='small' label={`${unreadCount} sin leer`} color='error' variant='outlined'
                sx={{ height: 22, '& .MuiChip-label': { fontSize: '0.7rem', px: 0.6 } }}
              />
            ) : null}
          </Stack>

          <Box sx={{ overflow: 'auto', flex: 1 }}>
            {notifications.length > 0 ? (
              <List disablePadding dense>
                {notifications.map((notification) => (
                  <ListItemButton
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      px: 2, py: 1.5,
                      borderBottom: '1px solid', borderColor: 'divider',
                      '&:hover': { backgroundColor: 'rgba(16,185,129,0.04)' }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Stack direction='row' alignItems='center' spacing={1}>
                          <Typography variant='body2' fontWeight={600} sx={{ fontSize: '0.82rem' }}>
                            {notification.title}
                          </Typography>
                          <Chip
                            size='small'
                            label={NOTIFICATION_TYPE_LABELS[notification.type] || notification.type}
                            color={PRIORITY_COLORS[notification.priority] || 'default'}
                            variant='outlined'
                            sx={{ height: 18, '& .MuiChip-label': { fontSize: '0.6rem', px: 0.5 } }}
                          />
                        </Stack>
                      }
                      secondary={
                        <Typography variant='caption' color='text.secondary' sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          mt: 0.25
                        }}>
                          {notification.message}
                          <Box component='span' sx={{ display: 'block', mt: 0.25, color: 'text.disabled' }}>
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: es })}
                          </Box>
                        </Typography>
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <NotificationsOutlinedIcon sx={{ fontSize: 32, color: '#d1d5db', mb: 1 }} />
                <Typography variant='body2' color='text.secondary'>Sin notificaciones</Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Popper>
    </>
  )
}

export default NotificationBell
