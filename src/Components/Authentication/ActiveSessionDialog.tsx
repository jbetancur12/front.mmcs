import React from 'react'
import { Button, Stack, Typography } from '@mui/material'
import FormDialog from 'src/Components/Common/FormDialog'
import type { ActiveSessionInfo } from 'src/hooks/useSessions'
import SessionDeviceRow from './SessionDeviceRow'

interface ActiveSessionDialogProps {
  open: boolean
  sessions: ActiveSessionInfo[]
  loading: boolean
  /** Cierra la otra sesión y entra. */
  onReplace: () => void
  /** Entra y deja la otra sesión abierta. */
  onKeep: () => void
  onCancel: () => void
}

/**
 * Aviso del login cuando la cuenta ya tiene una sesión abierta en otro
 * equipo: el usuario decide si la cierra o si trabaja en los dos.
 */
const ActiveSessionDialog: React.FC<ActiveSessionDialogProps> = ({
  open,
  sessions,
  loading,
  onReplace,
  onKeep,
  onCancel
}) => (
  <FormDialog
    open={open}
    onClose={onCancel}
    title='Ya tienes una sesión abierta'
    subtitle='Elige qué hacer con ella para ingresar en este equipo.'
    submitLabel='Cerrar la otra e ingresar'
    onSubmit={onReplace}
    loading={loading}
    extraActions={
      <Button
        onClick={onKeep}
        disabled={loading}
        sx={{ color: '#00695c', textTransform: 'none', fontWeight: 600 }}
      >
        Mantenerla e ingresar
      </Button>
    }
  >
    <Stack spacing={1.5}>
      {sessions.map((session, index) => (
        <SessionDeviceRow
          key={`${session.deviceLabel}-${index}`}
          deviceLabel={session.deviceLabel}
          ip={session.ip}
          lastSeenAt={session.lastSeenAt}
        />
      ))}
      <Typography variant='body2' color='text.secondary'>
        Si la cierras, ese equipo saldrá de la plataforma al instante. Si la
        mantienes, podrás trabajar en los dos.
      </Typography>
    </Stack>
  </FormDialog>
)

export default ActiveSessionDialog
