import React, { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField
} from '@mui/material'
import { useCreateRole, useUpdateRole } from '../../hooks/useRbac'
import { RbacRole } from '../../types/rbac'
import { rbacErrorMessage } from '../../utils/rbacErrors'
import { roleDisplayName } from './PermissionMatrix'

const primaryButtonSx = {
  textTransform: 'none',
  bgcolor: '#00BFA5',
  '&:hover': { bgcolor: '#00897B' }
} as const

// Mismo patrón que valida el backend: minúscula inicial, minúsculas, números y guion bajo
const ROLE_NAME_PATTERN = /^[a-z][a-z0-9_]{2,49}$/

interface CreateRoleDialogProps {
  open: boolean
  onClose: () => void
  onDone: (message: string) => void
}

export const CreateRoleDialog: React.FC<CreateRoleDialogProps> = ({
  open,
  onClose,
  onDone
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const createRole = useCreateRole()

  useEffect(() => {
    if (open) {
      setName('')
      setDescription('')
      setError(null)
    }
  }, [open])

  const nameValid = ROLE_NAME_PATTERN.test(name)
  const nameError = name.length > 0 && !nameValid

  const submit = async () => {
    setError(null)
    try {
      const role = await createRole.mutateAsync({
        name,
        description: description.trim() || undefined
      })
      onDone(
        `Rol "${role.description || role.name}" creado. Está vacío: márcale capacidades en la matriz.`
      )
      onClose()
    } catch (e) {
      setError(rbacErrorMessage(e))
    }
  }

  return (
    <Dialog open={open} onClose={createRole.isLoading ? undefined : onClose} maxWidth='xs' fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Nuevo rol</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          El rol se crea sin capacidades. Después podrás marcarlas en la matriz y
          asignárselo a las personas desde Ajustes.
        </DialogContentText>
        <TextField
          autoFocus
          fullWidth
          margin='dense'
          label='Nombre técnico'
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={nameError}
          helperText={
            nameError
              ? 'Minúsculas, números y guiones bajos; empieza con una letra (3 a 50 caracteres).'
              : 'Ejemplo: supervisor_taller. No se puede cambiar después.'
          }
          inputProps={{ 'aria-label': 'Nombre técnico del rol', maxLength: 50 }}
        />
        <TextField
          fullWidth
          margin='dense'
          label='Descripción (lo que se muestra)'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          inputProps={{ maxLength: 255 }}
          helperText='Ejemplo: Supervisor de taller'
        />
        {error && (
          <Alert severity='error' sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={createRole.isLoading} sx={{ textTransform: 'none' }}>
          Cancelar
        </Button>
        <Button
          variant='contained'
          onClick={submit}
          disabled={!nameValid || createRole.isLoading}
          startIcon={createRole.isLoading ? <CircularProgress size={16} color='inherit' /> : undefined}
          sx={primaryButtonSx}
        >
          Crear rol
        </Button>
      </DialogActions>
    </Dialog>
  )
}

interface RoleDialogProps {
  role: RbacRole | null
  onClose: () => void
  onDone: (message: string) => void
}

export const EditRoleDialog: React.FC<RoleDialogProps> = ({
  role,
  onClose,
  onDone
}) => {
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const updateRole = useUpdateRole()

  useEffect(() => {
    setDescription(role?.description ?? '')
    setError(null)
  }, [role])

  const submit = async () => {
    if (!role) return
    setError(null)
    try {
      await updateRole.mutateAsync({ roleId: role.id, description })
      onDone('Descripción actualizada.')
      onClose()
    } catch (e) {
      setError(rbacErrorMessage(e))
    }
  }

  return (
    <Dialog open={Boolean(role)} onClose={updateRole.isLoading ? undefined : onClose} maxWidth='xs' fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Editar rol</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          El nombre técnico <strong>{role?.name}</strong> no se puede cambiar:
          es el identificador que llevan las sesiones. Aquí solo editas lo que
          se muestra.
        </DialogContentText>
        <TextField
          autoFocus
          fullWidth
          margin='dense'
          label='Descripción'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          inputProps={{ maxLength: 255 }}
        />
        {error && (
          <Alert severity='error' sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={updateRole.isLoading} sx={{ textTransform: 'none' }}>
          Cancelar
        </Button>
        <Button
          variant='contained'
          onClick={submit}
          disabled={updateRole.isLoading}
          startIcon={updateRole.isLoading ? <CircularProgress size={16} color='inherit' /> : undefined}
          sx={primaryButtonSx}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export const ToggleRoleDialog: React.FC<RoleDialogProps> = ({
  role,
  onClose,
  onDone
}) => {
  const [error, setError] = useState<string | null>(null)
  const updateRole = useUpdateRole()

  useEffect(() => {
    setError(null)
  }, [role])

  const deactivating = Boolean(role?.isActive)

  const submit = async () => {
    if (!role) return
    setError(null)
    try {
      await updateRole.mutateAsync({ roleId: role.id, isActive: !role.isActive })
      onDone(
        deactivating
          ? `Rol "${roleDisplayName(role)}" desactivado.`
          : `Rol "${roleDisplayName(role)}" activado.`
      )
      onClose()
    } catch (e) {
      setError(rbacErrorMessage(e))
    }
  }

  return (
    <Dialog open={Boolean(role)} onClose={updateRole.isLoading ? undefined : onClose} maxWidth='xs' fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {deactivating ? 'Desactivar rol' : 'Activar rol'}
      </DialogTitle>
      <DialogContent>
        {role && deactivating ? (
          <>
            <DialogContentText sx={{ mb: 2 }}>
              Mientras <strong>{roleDisplayName(role)}</strong> esté inactivo, sus{' '}
              {role.userCount} {role.userCount === 1 ? 'usuario' : 'usuarios'}{' '}
              no recibirán ninguna de sus capacidades. Conservan el rol y todo
              vuelve al activarlo.
            </DialogContentText>
            <Alert severity='info'>
              Solo afecta a los módulos que ya se gestionan desde este panel; el
              resto de la aplicación sigue con sus permisos fijos por rol.
            </Alert>
          </>
        ) : (
          role && (
            <DialogContentText>
              Los {role.userCount} {role.userCount === 1 ? 'usuario' : 'usuarios'} de{' '}
              <strong>{roleDisplayName(role)}</strong> recuperan sus capacidades.
            </DialogContentText>
          )
        )}
        {error && (
          <Alert severity='error' sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={updateRole.isLoading} sx={{ textTransform: 'none' }}>
          Cancelar
        </Button>
        <Button
          variant='contained'
          color={deactivating ? 'warning' : 'primary'}
          onClick={submit}
          disabled={updateRole.isLoading}
          startIcon={updateRole.isLoading ? <CircularProgress size={16} color='inherit' /> : undefined}
          sx={deactivating ? { textTransform: 'none' } : primaryButtonSx}
        >
          {deactivating ? 'Desactivar' : 'Activar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
