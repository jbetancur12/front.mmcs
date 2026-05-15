import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { useState } from 'react'
import { UserData } from './TableUsersCustomer'

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
  const [generatedPassword, setGeneratedPassword] = useState('')

  const generatePassword = () => {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewPassword(password)
    setGeneratedPassword(password)
  }

  const handleSubmit = () => {
    if (user) {
      onSubmit(user.id, newPassword)
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Restablecer Contraseña</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField
            label='Nueva Contraseña'
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
          />
          <Button onClick={generatePassword} variant='outlined'>
            Generar Contraseña Segura
          </Button>
          {generatedPassword && (
            <Typography variant='body2'>
              Contraseña generada: {generatedPassword}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color='inherit'>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} color='primary'>
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ResetPasswordModal
