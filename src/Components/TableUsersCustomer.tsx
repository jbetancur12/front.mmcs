import {
  Add,
  DeleteOutline,
  EditOutlined,
  ForwardToInbox,
  Link as LinkIcon,
  PersonOutline,
  VpnKey
} from '@mui/icons-material'
import {
  Avatar,
  Box,
  Button,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { MRT_ColumnDef } from 'material-react-table'
import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import { PERMISSIONS } from 'src/constants/permissions'
import {
  useCustomerUsers,
  useDeleteUserById,
  useRegisterUser,
  useResetUserPassword,
  useUpdateUserById
} from 'src/hooks/useUsers'
import { useCan } from '@utils/functions'

import { showActivationLinkDialog } from '../utils/sweetAlert'
import {
  fetchActivationLink,
  resendActivationEmail
} from '../utils/userActivation'

import ConfirmDialog from './Common/ConfirmDialog'
import DataTable from './Common/DataTable'
import EmptyState from './Common/EmptyState'
import FormDialog from './Common/FormDialog'
import { notify } from 'src/utils/notify'
import ResetPasswordModal from './ResetPasswordModal'

import { logger } from 'src/utils/logger'
// Define interfaces
export interface UserData {
  id: number
  nombre: string
  email: string
  contraseña: string
  active: boolean
  phone?: string | null
  customer: {
    id: number
    nombre: string
    // Otras propiedades de User
  }
  rol: string
}

const primaryButtonSx = {
  bgcolor: '#00BFA5',
  borderRadius: '10px',
  textTransform: 'none',
  fontWeight: 700,
  boxShadow: 'none',
  whiteSpace: 'nowrap',
  '&:hover': { bgcolor: '#00ACC1', boxShadow: 'none' }
} as const

// Main component
const Table: React.FC = () => {
  // Eliminar usuarios es solo de admin (DELETE /users/:id); el metrólogo ve la pestaña pero no el botón
  const canDeleteUsers = useCan(PERMISSIONS.USERS_USER_DELETE)
  const canCreateUsers = useCan(PERMISSIONS.USERS_USER_CREATE)
  const canUpdateUsers = useCan(PERMISSIONS.USERS_USER_UPDATE)
  const canResetPassword = useCan(PERMISSIONS.USERS_USER_PASSWORD_RESET)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null)
  const { id } = useParams()
  const { data: tableData = [], isLoading: loading } =
    useCustomerUsers<UserData>(id, {
      onError: (error) => {
        logger.error('Error fetching user data:', error)
      }
    })
  const registerUser = useRegisterUser<UserData>()
  const resetUserPassword = useResetUserPassword()
  const updateUserById = useUpdateUserById()
  const deleteUserById = useDeleteUserById()

  // Create a new user
  const onCreateUser = async (userData: UserData) => {
    try {
      const response = await registerUser.mutateAsync(userData)

      if (response.status >= 200 && response.status < 300) {
        if (response.data?.activationUrl) {
          await showActivationLinkDialog({
            nombre: userData.nombre,
            email: userData.email,
            phone: response.data.phone,
            activationUrl: response.data.activationUrl,
            emailSent: response.data.emailSent,
            emailError: response.data.emailError
          })
        } else {
          notify.success('Usuario creado exitosamente!')
        }
      } else {
        notify.error('Error al crear usuario')
      }
    } catch (error) {
      logger.error('Error de red:', error)
      notify.error('Error al crear usuario')
    }
  }

  // Enlace de activación / reenvío de correo para usuarios que aún no activan su cuenta
  const handleActivationLink = async (target: { id: number }) => {
    try {
      const info = await fetchActivationLink(target.id)
      await showActivationLinkDialog(info)
    } catch (error) {
      logger.error('Error obteniendo enlace de activación:', error)
      notify.error('No se pudo generar el enlace de activación')
    }
  }

  const handleResendActivation = async (target: { id: number }) => {
    try {
      const info = await resendActivationEmail(target.id)
      await showActivationLinkDialog(info)
    } catch (error) {
      logger.error('Error reenviando activación:', error)
      notify.error('No se pudo reenviar la activación')
    }
  }

  const handleResetPassword = async (userId: number, newPassword: string) => {
    try {
      const response = await resetUserPassword.mutateAsync({
        userId,
        newPassword
      })

      if (response.status === 200) {
        notify.success('Contraseña actualizada exitosamente!')
      } else {
        notify.error('Error al actualizar la contraseña')
      }
    } catch (error) {
      logger.error('Error de red:', error)
      notify.error('Error al actualizar la contraseña')
    }
  }

  const handleCreateNewRow = (values: any) => {
    onCreateUser({
      ...values,
      customerId: parseInt(id || '0'),
      contraseña: 'NewUser@123'
    })
    setCreateModalOpen(false)
  }

  const handleEditUser = async (userData: UserData) => {
    try {
      const updatedValues: any = { ...userData }
      delete updatedValues.id

      const response = await updateUserById.mutateAsync({
        id: userData.id,
        values: updatedValues
      })

      if (response.status === 200) {
        notify.success('Usuario modificado exitosamente!')
        setEditingUser(null)
      } else {
        notify.error('Error al modificar usuario')
      }
    } catch (error) {
      logger.error('Error de red:', error)
      notify.error('Error al modificar usuario')
    }
  }

  const deleteUser = async (userId: number) => {
    try {
      const response = await deleteUserById.mutateAsync(userId)

      if (response.status === 204) {
        notify.success('Usuario eliminado exitosamente!')
      } else {
        notify.error('Error al eliminar usuario')
      }
    } catch (error) {
      logger.error('Error de red:', error)
      notify.error('Error al eliminar usuario')
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleToggleActive = async (user: UserData) => {
    try {
      await updateUserById.mutateAsync({
        id: user.id,
        values: { active: !user.active }
      })
      notify.success(
        `Usuario ${!user.active ? 'activado' : 'desactivado'} con éxito`
      )
    } catch (error) {
      logger.error('Error al cambiar estado del usuario:', error)
      notify.error('Error al actualizar el estado del usuario')
    }
  }

  const columns = useMemo<MRT_ColumnDef<UserData>[]>(
    () => [
      {
        accessorKey: 'nombre',
        header: 'Usuario',
        size: 300,
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: '#00BFA5',
                fontSize: 14,
                fontWeight: 700
              }}
            >
              {row.original.nombre?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant='body2' fontWeight={600}>
                {row.original.nombre}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {row.original.email}
              </Typography>
            </Box>
          </Box>
        )
      },
      {
        accessorKey: 'active',
        header: 'Acceso',
        size: 150,
        Cell: ({ row }) => (
          <FormControlLabel
            sx={{ m: 0 }}
            control={
              <Switch
                size='small'
                checked={row.original.active}
                onChange={() => handleToggleActive(row.original)}
                disabled={!canUpdateUsers}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#00BFA5' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#00BFA5'
                  }
                }}
              />
            }
            label={
              <Typography variant='body2'>
                {row.original.active ? 'Activo' : 'Inactivo'}
              </Typography>
            }
          />
        )
      }
    ],
    // handleToggleActive cambia en cada render; la fila siempre trae el usuario actual
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canUpdateUsers]
  )

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
          mb: 3
        }}
      >
        <Box>
          <Typography variant='h5' fontWeight={700} sx={{ color: '#111827' }}>
            Usuarios
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Las personas del cliente que pueden entrar al sistema.
          </Typography>
        </Box>
        {canCreateUsers && (
          <Button
            variant='contained'
            startIcon={<Add />}
            onClick={() => setCreateModalOpen(true)}
            sx={primaryButtonSx}
          >
            Crear usuario
          </Button>
        )}
      </Box>

      <DataTable<UserData>
        columns={columns}
        data={tableData}
        itemLabel={['usuario', 'usuarios']}
        searchPlaceholder='Buscar por nombre o correo'
        state={{ isLoading: loading }}
        muiTableContainerProps={{ sx: { maxHeight: 'none' } }}
        enableRowActions
        renderRowActions={({ row }) => {
          const user = row.original
          return (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title='Editar usuario'>
                <IconButton
                  size='small'
                  aria-label={`Editar ${user.nombre}`}
                  sx={{ color: '#2563eb' }}
                  onClick={() => setEditingUser(user)}
                >
                  <EditOutlined fontSize='small' />
                </IconButton>
              </Tooltip>
              {user.active !== true && (
                <>
                  <Tooltip title='Enlace de activación (copiar o WhatsApp)'>
                    <IconButton
                      size='small'
                      aria-label={`Enlace de activación de ${user.nombre}`}
                      sx={{ color: '#00695C' }}
                      onClick={() => handleActivationLink(user)}
                    >
                      <LinkIcon fontSize='small' />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='Reenviar correo de activación'>
                    <IconButton
                      size='small'
                      aria-label={`Reenviar activación a ${user.nombre}`}
                      sx={{ color: '#00695C' }}
                      onClick={() => handleResendActivation(user)}
                    >
                      <ForwardToInbox fontSize='small' />
                    </IconButton>
                  </Tooltip>
                </>
              )}
              {canResetPassword && (
                <Tooltip title='Restablecer contraseña'>
                  <IconButton
                    size='small'
                    aria-label={`Restablecer contraseña de ${user.nombre}`}
                    sx={{ color: '#b45309' }}
                    onClick={() => {
                      setSelectedUser(user)
                      setResetPasswordModalOpen(true)
                    }}
                  >
                    <VpnKey fontSize='small' />
                  </IconButton>
                </Tooltip>
              )}
              {canDeleteUsers && (
                <Tooltip title='Eliminar usuario'>
                  <IconButton
                    size='small'
                    color='error'
                    aria-label={`Eliminar ${user.nombre}`}
                    onClick={() => setDeleteTarget(user)}
                  >
                    <DeleteOutline fontSize='small' />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )
        }}
        displayColumnDefOptions={{
          'mrt-row-actions': { header: 'Acciones', size: 190 }
        }}
        renderEmptyRowsFallback={() => (
          <EmptyState
            icon={<PersonOutline />}
            title='No hay usuarios registrados'
            hint='Crea el primer usuario para que el cliente pueda entrar.'
          />
        )}
      />

      {/* Modals */}
      <CreateNewAccountModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateNewRow}
      />

      <EditUserModal
        open={!!editingUser}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSubmit={handleEditUser}
      />

      <ResetPasswordModal
        open={resetPasswordModalOpen}
        onClose={() => setResetPasswordModalOpen(false)}
        onSubmit={handleResetPassword}
        user={selectedUser}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title='Eliminar usuario'
        tone='danger'
        message={
          <>
            Vas a eliminar a <strong>{deleteTarget?.nombre}</strong> (
            {deleteTarget?.email}). Esta acción no se puede deshacer: el usuario
            se borra del sistema.
          </>
        }
        confirmLabel='Eliminar'
        loading={deleteUserById.isLoading}
        onConfirm={() => deleteTarget && deleteUser(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  )
}

interface CreateModalProps {
  onClose: () => void
  onSubmit: (values: any) => void
  open: boolean
}

interface EditModalProps {
  user: UserData | null
  onClose: () => void
  onSubmit: (values: UserData) => void
  open: boolean
}

const validateEmail = (email: string) =>
  !!email.length &&
  email
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )

const validateUserFields = (values: { nombre: string; email: string }) => {
  const errors: { [key: string]: string } = {}
  if (!values.nombre) errors.nombre = 'Nombre es requerido'
  if (!values.email) errors.email = 'Email es requerido'
  if (!validateEmail(values.email) && values.email)
    errors.email = 'Email inválido'
  return errors
}

/** Los dos campos del usuario del cliente: nombre y correo. */
const UserFields = ({
  values,
  errors,
  onChange
}: {
  values: { nombre: string; email: string }
  errors: { [key: string]: string }
  onChange: (values: { nombre: string; email: string }) => void
}) => (
  <Stack spacing={2}>
    <TextField
      label='Nombre completo'
      required
      autoFocus
      value={values.nombre}
      error={!!errors.nombre}
      helperText={errors.nombre}
      onChange={(e) => onChange({ ...values, nombre: e.target.value })}
      fullWidth
    />
    <TextField
      label='Correo electrónico'
      type='email'
      required
      value={values.email}
      error={!!errors.email}
      helperText={errors.email}
      onChange={(e) => onChange({ ...values, email: e.target.value })}
      fullWidth
    />
  </Stack>
)

const CreateNewAccountModal = ({
  open,
  onClose,
  onSubmit
}: CreateModalProps) => {
  const { id } = useParams()
  const [values, setValues] = useState({ nombre: '', email: '' })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const handleSubmit = () => {
    const newErrors = validateUserFields(values)
    setErrors(newErrors)
    if (Object.keys(newErrors).length === 0) {
      onSubmit({
        ...values,
        roles: [{ id: 3 }],
        customerId: parseInt(id || '0')
      })
      setValues({ nombre: '', email: '' })
    }
  }

  const handleClose = () => {
    setValues({ nombre: '', email: '' })
    setErrors({})
    onClose()
  }

  return (
    <FormDialog
      open={open}
      onClose={handleClose}
      title='Crear usuario'
      subtitle='Recibirá un enlace para activar su cuenta'
      submitLabel='Crear usuario'
      onSubmit={handleSubmit}
    >
      <UserFields values={values} errors={errors} onChange={setValues} />
    </FormDialog>
  )
}

const EditUserModal = ({ open, user, onClose, onSubmit }: EditModalProps) => {
  const [values, setValues] = useState({ nombre: '', email: '' })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (user) {
      setValues({ nombre: user.nombre, email: user.email })
    }
  }, [user])

  const handleSubmit = () => {
    const newErrors = validateUserFields(values)
    setErrors(newErrors)
    if (Object.keys(newErrors).length === 0 && user) {
      onSubmit({ ...user, ...values, rol: user.rol })
    }
  }

  const handleClose = () => {
    setErrors({})
    onClose()
  }

  return (
    <FormDialog
      open={open}
      onClose={handleClose}
      title='Editar usuario'
      subtitle={user?.nombre}
      submitLabel='Guardar cambios'
      onSubmit={handleSubmit}
    >
      <UserFields values={values} errors={errors} onChange={setValues} />
    </FormDialog>
  )
}

export default Table
