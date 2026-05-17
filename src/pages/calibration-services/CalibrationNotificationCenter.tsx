import { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  TablePagination,
  Typography,
  Tooltip
} from '@mui/material'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import DoneAllOutlinedIcon from '@mui/icons-material/DoneAllOutlined'
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined'
import { Toaster, toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import {
  useCalibrationNotifications,
  useCalibrationNotificationMutations,
  CalibrationNotification
} from '../../hooks/useCalibrationNotifications'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  ods_issued: 'ODS emitida',
  adjustment_reported: 'Novedad reportada',
  adjustment_technical_reviewed: 'Revisión técnica',
  cut_ready_for_invoicing: 'Listo para facturar',
  cut_invoiced: 'Corte facturado'
}

const PRIORITY_COLORS: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  urgent: 'error',
  high: 'warning',
  normal: 'info',
  low: 'default'
}

const LIMIT = 20

const CalibrationNotificationCenter = () => {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [showRead, setShowRead] = useState(false)
  const { data, isLoading } = useCalibrationNotifications({ page, limit: LIMIT, showRead })
  const { markAsRead, markAllAsRead } = useCalibrationNotificationMutations()

  const notifications = data?.notifications ?? []
  const totalItems = data?.totalItems ?? 0
  const unreadCount = data?.unreadCount ?? 0

  const handleMarkRead = async (id: number) => {
    try {
      await markAsRead.mutateAsync(id)
    } catch {
      toast.error('No pudimos marcar la notificación como leída.')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead.mutateAsync(undefined)
      toast.success('Todas las notificaciones marcadas como leídas.')
    } catch {
      toast.error('No pudimos marcar las notificaciones como leídas.')
    }
  }

  const handleNavigate = (notification: CalibrationNotification) => {
    if (notification.actionUrl) {
      navigate(notification.actionUrl)
    }
  }

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 }, minHeight: '100vh', backgroundColor: '#f8fafb' }}>
      <Toaster position='top-center' />

      <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 3 }}>
        <Box>
          <Button
            startIcon={<ArrowBackOutlinedIcon />}
            onClick={() => navigate('/calibration-services')}
            sx={{ mb: 1, color: 'text.secondary', textTransform: 'none', fontWeight: 600, borderRadius: '10px', fontSize: '0.85rem' }}
          >
            Volver
          </Button>
          <Typography variant='h4' fontWeight={800} sx={{ letterSpacing: '-0.025em', lineHeight: 1.15 }}>
            Centro de notificaciones
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
            Eventos y alertas del módulo de servicios de calibración.
          </Typography>
        </Box>
        <Stack direction='row' spacing={1}>
          <Button
            size='small'
            variant={showRead ? 'contained' : 'outlined'}
            onClick={() => { setShowRead(false); setPage(0) }}
            sx={{ borderRadius: '8px', textTransform: 'none', fontSize: '0.8rem' }}
          >
            No leídas {unreadCount > 0 ? `(${unreadCount})` : ''}
          </Button>
          <Button
            size='small'
            variant={showRead ? 'outlined' : 'contained'}
            onClick={() => { setShowRead(true); setPage(0) }}
            sx={{ borderRadius: '8px', textTransform: 'none', fontSize: '0.8rem' }}
          >
            Todas
          </Button>
          {!showRead && unreadCount > 0 ? (
            <Button
              size='small'
              variant='text'
              startIcon={<DoneAllOutlinedIcon />}
              onClick={handleMarkAllRead}
              disabled={markAllAsRead.isLoading}
              sx={{ borderRadius: '8px', textTransform: 'none', fontSize: '0.8rem' }}
            >
              Marcar todas leídas
            </Button>
          ) : null}
        </Stack>
      </Stack>

      {isLoading ? (
        <Box display='flex' justifyContent='center' py={6}><CircularProgress /></Box>
      ) : notifications.length > 0 ? (
        <Stack spacing={1.5}>
          {notifications.map((notification) => (
            <Paper
              key={notification.id}
              elevation={0}
              sx={{
                p: 2, borderRadius: '12px',
                border: '1px solid',
                borderColor: notification.readAt ? 'divider' : 'rgba(16,185,129,0.2)',
                backgroundColor: notification.readAt ? '#fff' : 'rgba(16,185,129,0.02)',
                cursor: notification.actionUrl ? 'pointer' : 'default',
                transition: 'all 0.15s',
                '&:hover': {
                  borderColor: 'rgba(16,185,129,0.3)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }
              }}
              onClick={() => handleNavigate(notification)}
            >
              <Stack direction='row' justifyContent='space-between' alignItems='flex-start' spacing={2}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction='row' alignItems='center' spacing={1} sx={{ mb: 0.5 }} flexWrap='wrap'>
                    <Typography variant='body1' fontWeight={700} sx={{ fontSize: '0.92rem' }}>
                      {notification.title}
                    </Typography>
                    <Chip
                      size='small'
                      label={NOTIFICATION_TYPE_LABELS[notification.type] || notification.type}
                      color={PRIORITY_COLORS[notification.priority] || 'default'}
                      variant='outlined'
                      sx={{ height: 20, '& .MuiChip-label': { fontSize: '0.65rem', fontWeight: 600, px: 0.6 } }}
                    />
                    {notification.readAt ? (
                      <Chip
                        size='small'
                        label='Leída'
                        variant='outlined'
                        sx={{ height: 20, '& .MuiChip-label': { fontSize: '0.65rem', px: 0.6 } }}
                      />
                    ) : null}
                  </Stack>
                  {notification.message ? (
                    <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.85rem' }}>
                      {notification.message}
                    </Typography>
                  ) : null}
                  <Typography variant='caption' color='text.disabled' sx={{ mt: 0.5, display: 'block' }}>
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: es })}
                  </Typography>
                </Box>
                {!notification.readAt ? (
                  <Tooltip title='Marcar como leída'>
                    <IconButton
                      size='small'
                      onClick={(e) => { e.stopPropagation(); handleMarkRead(notification.id) }}
                      disabled={markAsRead.isLoading}
                      sx={{ mt: 0.5 }}
                    >
                      <CheckCircleOutlineOutlinedIcon fontSize='small' sx={{ color: '#059669' }} />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </Stack>
            </Paper>
          ))}
          <TablePagination
            component='div'
            count={totalItems}
            page={page}
            onPageChange={(_, next) => setPage(next)}
            rowsPerPage={LIMIT}
            rowsPerPageOptions={[LIMIT]}
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          />
        </Stack>
      ) : (
        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: '12px', border: '1px dashed', borderColor: 'divider' }}>
          <NotificationsOutlinedIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 1.5 }} />
          <Typography variant='body1' fontWeight={600} sx={{ color: '#6b7280' }}>
            {showRead ? 'No hay notificaciones' : 'No tienes notificaciones sin leer'}
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
            {showRead ? '' : 'Las nuevas notificaciones aparecerán aquí.'}
          </Typography>
        </Paper>
      )}
    </Box>
  )
}

export default CalibrationNotificationCenter
