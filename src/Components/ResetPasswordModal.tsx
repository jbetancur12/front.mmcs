import { AutoFixHigh, ContentCopy } from '@mui/icons-material'
import {
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip
} from '@mui/material'
import { useEffect, useState } from 'react'

import FormDialog from './Common/FormDialog'
import { notify } from 'src/utils/notify'
import { UserData } from './TableUsersCustomer'

const CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()'

/** 12 caracteres al azar con el generador seguro del navegador. */
const randomPassword = () => {
  const values = new Uint32Array(12)
  crypto.getRandomValues(values)
  return Array.from(values, (value) => CHARS[value % CHARS.length]).join('')
}

/** Restablece la contraseña de un usuario: la escribes o generas una segura. */
const ResetPasswordModal = ({
  open,
  onClose,
  onSubmit,
  user
}: {
  open: boolean
  onClose: () => void
  onSubmit: (userId: number, newPassword: string) => void
  user: UserData | null
}) => {
  const [newPassword, setNewPassword] = useState('')

  // Cada vez que se abre, empieza vacío
  useEffect(() => {
    if (open) setNewPassword('')
  }, [open])

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(newPassword)
      notify.success('Contraseña copiada')
    } catch {
      notify.error('No se pudo copiar la contraseña')
    }
  }

  const handleSubmit = () => {
    if (user && newPassword) {
      onSubmit(user.id, newPassword)
      onClose()
    }
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title='Restablecer contraseña'
      subtitle={user ? `${user.nombre} · ${user.email}` : undefined}
      submitLabel='Restablecer contraseña'
      onSubmit={handleSubmit}
      submitDisabled={!newPassword}
    >
      <Stack spacing={2}>
        <TextField
          label='Nueva contraseña'
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          fullWidth
          autoFocus
          required
          helperText='Cópiala y compártela con el usuario: después no se puede volver a ver.'
          InputProps={{
            endAdornment: newPassword ? (
              <InputAdornment position='end'>
                <Tooltip title='Copiar contraseña'>
                  <IconButton
                    aria-label='Copiar contraseña'
                    edge='end'
                    onClick={() => void copyPassword()}
                  >
                    <ContentCopy fontSize='small' />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ) : undefined
          }}
        />
        <Button
          variant='outlined'
          startIcon={<AutoFixHigh />}
          onClick={() => setNewPassword(randomPassword())}
          sx={{
            alignSelf: 'flex-start',
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 600,
            borderColor: '#e5e7eb',
            color: '#374151',
            '&:hover': {
              borderColor: '#00897B',
              color: '#00695C',
              backgroundColor: '#E0F7F4'
            }
          }}
        >
          Generar contraseña segura
        </Button>
      </Stack>
    </FormDialog>
  )
}

export default ResetPasswordModal
