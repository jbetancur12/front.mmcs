import React, { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ConfirmDialog from 'src/Components/Common/ConfirmDialog'
import { notify } from 'src/utils/notify'
import {
  useCloseOtherSessions,
  useCloseSession,
  useSessions
} from 'src/hooks/useSessions'
import SessionDeviceRow from './SessionDeviceRow'

interface ActiveSessionsListDialogProps {
  open: boolean
  onClose: () => void
}

/**
 * Sesiones abiertas de la cuenta (una por equipo o navegador) con la opción
 * de cerrar una o todas las demás. Se abre desde el menú de usuario.
 */
const ActiveSessionsListDialog: React.FC<ActiveSessionsListDialogProps> = ({
  open,
  onClose
}) => {
  const { data, isLoading, isError } = useSessions(open)
  const sessions = data?.sessions ?? []
  const closeSession = useCloseSession()
  const closeOthers = useCloseOtherSessions()
  const [confirmOthers, setConfirmOthers] = useState(false)

  const others = sessions.filter((session) => !session.current)

  const handleClose = (sessionId: string) => {
    closeSession.mutate(sessionId, {
      onSuccess: () => notify.success('Sesión cerrada'),
      onError: () => notify.error('No se pudo cerrar la sesión')
    })
  }

  const handleCloseOthers = () => {
    closeOthers.mutate(undefined, {
      onSuccess: () => {
        setConfirmOthers(false)
        notify.success('Se cerraron las demás sesiones')
      },
      onError: () => {
        setConfirmOthers(false)
        notify.error('No se pudieron cerrar las sesiones')
      }
    })
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth='sm'
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 1
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant='h6' component='span' fontWeight={700}>
              Sesiones activas
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {data
                ? `${sessions.length} de ${data.limit} sesiones permitidas. `
                : ''}
              Los equipos y navegadores donde tu cuenta tiene la sesión abierta.
            </Typography>
          </Box>
          <IconButton aria-label='Cerrar' onClick={onClose} edge='end'>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2.5 }}>
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} sx={{ color: '#00BFA5' }} />
            </Box>
          )}
          {isError && (
            <Alert severity='error'>
              No se pudieron cargar las sesiones. Inténtalo de nuevo.
            </Alert>
          )}
          {!isLoading && !isError && (
            <Stack spacing={1.5}>
              {sessions.map((session) => (
                <SessionDeviceRow
                  key={session.id}
                  deviceLabel={session.deviceLabel}
                  ip={session.ip}
                  lastSeenAt={session.lastSeenAt}
                  current={session.current}
                  action={
                    session.current ? undefined : (
                      <Button
                        size='small'
                        variant='outlined'
                        color='inherit'
                        aria-label={`Cerrar la sesión de ${session.deviceLabel}`}
                        disabled={closeSession.isLoading}
                        onClick={() => handleClose(session.id)}
                        sx={{ textTransform: 'none', flexShrink: 0 }}
                      >
                        Cerrar
                      </Button>
                    )
                  }
                />
              ))}
              {others.length === 0 && (
                <Typography variant='body2' color='text.secondary'>
                  No tienes otras sesiones abiertas.
                </Typography>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={onClose} sx={{ color: '#4b5563' }}>
            Listo
          </Button>
          <Button
            variant='contained'
            disabled={others.length === 0}
            onClick={() => setConfirmOthers(true)}
            sx={{ bgcolor: '#00BFA5', '&:hover': { bgcolor: '#00897B' } }}
          >
            Cerrar las demás
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOthers}
        title='¿Cerrar las demás sesiones?'
        message='Los otros equipos saldrán de la plataforma al instante y tendrán que ingresar de nuevo. Esta sesión sigue abierta.'
        confirmLabel='Cerrar las demás'
        tone='danger'
        loading={closeOthers.isLoading}
        onConfirm={handleCloseOthers}
        onClose={() => setConfirmOthers(false)}
      />
    </>
  )
}

export default ActiveSessionsListDialog
