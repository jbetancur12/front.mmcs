import {
  Delete,
  Edit,
  Add,
  Person,
  Email,
  VpnKey,
  CheckCircle,
  Cancel
} from '@mui/icons-material'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Fade,
  Alert
} from '@mui/material'

import React, { useCallback, useEffect, useState } from 'react'

import { useParams } from 'react-router-dom'

import { bigToast } from './ExcelManipulation/Utils'
import useAxiosPrivate from '@utils/use-axios-private'
import ResetPasswordModal from './ResetPasswordModal'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

// Define interfaces
export interface UserData {
  id: number
  nombre: string
  email: string
  contraseña: string
  active: boolean
  customer: {
    id: number
    nombre: string
    // Otras propiedades de User
  }
  rol: string
}

// API URL

// Main component
const Table: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [tableData, setTableData] = useState<UserData[]>([])
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const { id } = useParams()

  // Initialize SweetAlert with React content
  const MySwal = withReactContent(Swal)

  // Create a new user
  const onCreateUser = async (userData: UserData) => {
    try {
      const response = await axiosPrivate.post(`/auth/register`, userData, {})

      if (response.status >= 200 && response.status < 300) {
        bigToast('Usuario creado exitosamente!', 'success')
        fetchUsers() // Refresh data after creation
      } else {
        bigToast('Error al crear usuario', 'error')
      }
    } catch (error) {
      console.error('Error de red:', error)
      bigToast('Error al crear usuario', 'error')
    }
  }

  const handleResetPassword = async (userId: number, newPassword: string) => {
    try {
      const response = await axiosPrivate.put(`/auth/${userId}/password`, {
        newPassword
      })

      if (response.status === 200) {
        bigToast('Contraseña actualizada exitosamente!', 'success')
      } else {
        bigToast('Error al actualizar la contraseña', 'error')
      }
    } catch (error) {
      console.error('Error de red:', error)
      bigToast('Error al actualizar la contraseña', 'error')
    }
  }

  // Fetch users data
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axiosPrivate.get(`/customers/${id}/users`, {})

      if (response.statusText === 'OK') {
        const filteredData = response.data.filter(
          (user: UserData) => user.rol !== 'admin'
        )
        setTableData(filteredData)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }, [id, axiosPrivate])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

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

      const response = await axiosPrivate.put(
        `/users/${userData.id}`,
        updatedValues,
        {}
      )

      if (response.status === 200) {
        bigToast('Usuario modificado exitosamente!', 'success')
        fetchUsers()
        setEditingUser(null)
      } else {
        bigToast('Error al modificar usuario', 'error')
      }
    } catch (error) {
      console.error('Error de red:', error)
      bigToast('Error al modificar usuario', 'error')
    }
  }

  const deleteUser = async (userId: number) => {
    try {
      const response = await axiosPrivate.delete(`/users/${userId}`, {})

      if (response.status === 204) {
        bigToast('Usuario eliminado exitosamente!', 'success')
        fetchUsers()
      } else {
        bigToast('Error al eliminar usuario', 'error')
      }
    } catch (error) {
      console.error('Error de red:', error)
      bigToast('Error al eliminar usuario', 'error')
    }
  }

  const handleDeleteUser = async (user: UserData) => {
    const result = await MySwal.fire({
      title: '¿Eliminar usuario?',
      html: `
        <div style="text-align: center; padding: 20px;">
          <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); 
                      border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <div style="width: 60px; height: 60px; background: #dc2626; border-radius: 50%; 
                        display: flex; align-items: center; justify-content: center; 
                        margin: 0 auto 15px auto;">
              <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </div>
            <h3 style="color: #dc2626; margin: 0 0 10px 0; font-size: 1.2rem; font-weight: 600;">
              ${user.nombre}
            </h3>
            <p style="color: #6b7280; margin: 0; font-size: 0.9rem;">
              ${user.email}
            </p>
          </div>
          <p style="color: #374151; font-size: 1rem; margin: 0;">
            Esta acción no se puede deshacer. El usuario será eliminado permanentemente del sistema.
          </p>
        </div>
      `,
      icon: undefined,
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      customClass: {
        popup: 'swal-modern-popup',
        confirmButton: 'swal-modern-confirm',
        cancelButton: 'swal-modern-cancel'
      },
      buttonsStyling: false,
      didOpen: () => {
        // Add custom styles
        const style = document.createElement('style')
        style.textContent = `
          .swal-modern-popup {
            border-radius: 16px !important;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
          }
          .swal-modern-confirm {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
            border: none !important;
            border-radius: 8px !important;
            padding: 12px 24px !important;
            font-weight: 600 !important;
            font-size: 0.875rem !important;
            color: white !important;
            margin-left: 8px !important;
          }
          .swal-modern-confirm:hover {
            background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%) !important;
            transform: translateY(-1px) !important;
          }
          .swal-modern-cancel {
            background: #f9fafb !important;
            border: 1px solid #d1d5db !important;
            border-radius: 8px !important;
            padding: 12px 24px !important;
            font-weight: 600 !important;
            font-size: 0.875rem !important;
            color: #374151 !important;
          }
          .swal-modern-cancel:hover {
            background: #f3f4f6 !important;
            border-color: #9ca3af !important;
          }
        `
        document.head.appendChild(style)
      }
    })

    if (result.isConfirmed) {
      deleteUser(user.id)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'user':
        return { bg: '#f0f9ff', color: '#1e40af', label: 'Usuario' }
      case 'fleet':
        return { bg: '#fef3c7', color: '#d97706', label: 'Flota' }
      default:
        return { bg: '#f3f4f6', color: '#374151', label: role }
    }
  }

  if (loading) {
    return (
      <Box sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {[...Array(6)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card
                elevation={0}
                sx={{ border: '1px solid #e5e7eb', borderRadius: '12px' }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display='flex' alignItems='center' mb={2}>
                    <Avatar sx={{ mr: 2, width: 40, height: 40 }} />
                    <Box flex={1}>
                      <Box
                        sx={{
                          height: 20,
                          backgroundColor: '#f3f4f6',
                          borderRadius: '4px',
                          mb: 1
                        }}
                      />
                      <Box
                        sx={{
                          height: 16,
                          backgroundColor: '#f3f4f6',
                          borderRadius: '4px',
                          width: '70%'
                        }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    )
  }

  return (
    <Box sx={{ py: 2 }}>
      {/* Header with Add Button */}
      <Box
        display='flex'
        alignItems='center'
        justifyContent='space-between'
        mb={4}
      >
        <Box display='flex' alignItems='center'>
          <Avatar
            sx={{
              backgroundColor: '#10b981',
              mr: 2,
              width: 40,
              height: 40
            }}
          >
            <Person />
          </Avatar>
          <Box>
            <Typography
              variant='h6'
              fontWeight='bold'
              sx={{ color: '#1f2937' }}
            >
              Usuarios del Cliente
            </Typography>
            <Typography variant='body2' sx={{ color: '#6b7280' }}>
              {tableData.length}{' '}
              {tableData.length === 1
                ? 'usuario registrado'
                : 'usuarios registrados'}
            </Typography>
          </Box>
        </Box>

        <Button
          variant='contained'
          startIcon={<Add />}
          onClick={() => setCreateModalOpen(true)}
          sx={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            '&:hover': {
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
            }
          }}
        >
          Crear Usuario
        </Button>
      </Box>

      {/* Users Grid */}
      {tableData.length === 0 ? (
        <Alert
          severity='info'
          sx={{
            borderRadius: '12px',
            backgroundColor: '#f0f9ff',
            border: '1px solid #bfdbfe'
          }}
        >
          <Typography variant='body2'>
            No hay usuarios registrados para este cliente. Crea el primer
            usuario para comenzar.
          </Typography>
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {tableData.map((user, index) => (
            <Grid item xs={12} sm={6} md={4} key={user.id}>
              <Fade in={true} timeout={300 + index * 100}>
                <Card
                  elevation={0}
                  sx={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      borderColor: '#10b981',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* User Header */}
                    <Box
                      display='flex'
                      alignItems='center'
                      justifyContent='space-between'
                      mb={2}
                    >
                      <Box display='flex' alignItems='center'>
                        <Avatar
                          sx={{
                            backgroundColor: '#f0fdf4',
                            mr: 2,
                            width: 40,
                            height: 40
                          }}
                        >
                          <Person sx={{ color: '#10b981' }} />
                        </Avatar>
                        <Box>
                          <Typography
                            variant='h6'
                            fontWeight='600'
                            sx={{
                              color: '#1f2937',
                              fontSize: '1rem'
                            }}
                          >
                            {user.nombre}
                          </Typography>
                          <Box display='flex' alignItems='center' gap={1}>
                            <Email sx={{ fontSize: 14, color: '#6b7280' }} />
                            <Typography
                              variant='body2'
                              sx={{ color: '#6b7280', fontSize: '0.875rem' }}
                            >
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>

                    {/* User Details */}
                    <Box
                      display='flex'
                      justifyContent='space-between'
                      alignItems='center'
                    >
                      <Box display='flex' gap={1}>
                        <Chip
                          label={getRoleColor(user.rol).label}
                          size='small'
                          sx={{
                            backgroundColor: getRoleColor(user.rol).bg,
                            color: getRoleColor(user.rol).color,
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        />

                        <Chip
                          icon={user.active ? <CheckCircle /> : <Cancel />}
                          label={user.active ? 'Activo' : 'Inactivo'}
                          size='small'
                          sx={{
                            backgroundColor: user.active
                              ? '#f0fdf4'
                              : '#fef2f2',
                            color: user.active ? '#059669' : '#dc2626',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            '& .MuiChip-icon': {
                              color: user.active ? '#059669' : '#dc2626'
                            }
                          }}
                        />
                      </Box>

                      {/* Action Buttons - Moved to bottom for better visibility */}
                      <Box display='flex' alignItems='center' gap={0.5}>
                        <Tooltip title='Editar usuario'>
                          <IconButton
                            size='small'
                            onClick={() => setEditingUser(user)}
                            sx={{
                              color: '#6b7280',
                              '&:hover': {
                                backgroundColor: '#f0fdf4',
                                color: '#10b981'
                              }
                            }}
                          >
                            <Edit fontSize='small' />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title='Restablecer contraseña'>
                          <IconButton
                            size='small'
                            onClick={() => {
                              setSelectedUser(user)
                              setResetPasswordModalOpen(true)
                            }}
                            sx={{
                              color: '#6b7280',
                              '&:hover': {
                                backgroundColor: '#fffbeb',
                                color: '#d97706'
                              }
                            }}
                          >
                            <VpnKey fontSize='small' />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title='Eliminar usuario'>
                          <IconButton
                            size='small'
                            onClick={() => handleDeleteUser(user)}
                            sx={{
                              color: '#6b7280',
                              '&:hover': {
                                backgroundColor: '#fef2f2',
                                color: '#dc2626'
                              }
                            }}
                          >
                            <Delete fontSize='small' />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>
      )}

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

// Modern Create User Modal
const CreateNewAccountModal = ({
  open,
  onClose,
  onSubmit
}: CreateModalProps) => {
  const { id } = useParams()
  const [values, setValues] = useState({
    nombre: '',
    email: ''
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateFields = () => {
    const newErrors: { [key: string]: string } = {}
    if (!values.nombre) newErrors.nombre = 'Nombre es requerido'
    if (!values.email) newErrors.email = 'Email es requerido'
    if (!validateEmail(values.email) && values.email)
      newErrors.email = 'Email inválido'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateFields()) {
      onSubmit({
        ...values,
        roles: [{ id: 3 }],
        customerId: parseInt(id || '0')
      })
      setValues({ nombre: '', email: '' })
      setErrors({})
    }
  }

  const handleClose = () => {
    setValues({ nombre: '', email: '' })
    setErrors({})
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <DialogTitle
        sx={{
          textAlign: 'center',
          fontWeight: 'bold',
          pb: 1,
          borderBottom: '1px solid #e5e7eb'
        }}
      >
        <Box
          display='flex'
          alignItems='center'
          justifyContent='center'
          gap={1}
          mb={1}
        >
          <Person sx={{ color: '#10b981' }} />
          <Typography variant='h6' fontWeight='bold'>
            Crear Nuevo Usuario
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3}>
          <TextField
            label='Nombre completo'
            value={values.nombre}
            error={!!errors.nombre}
            helperText={errors.nombre}
            onChange={(e) => setValues({ ...values, nombre: e.target.value })}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#10b981'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#10b981'
                }
              }
            }}
          />

          <TextField
            label='Correo electrónico'
            type='email'
            value={values.email}
            error={!!errors.email}
            helperText={errors.email}
            onChange={(e) => setValues({ ...values, email: e.target.value })}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#10b981'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#10b981'
                }
              }
            }}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={handleClose}
          variant='outlined'
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            borderColor: '#d1d5db',
            color: '#374151',
            '&:hover': {
              borderColor: '#9ca3af',
              backgroundColor: '#f9fafb'
            }
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant='contained'
          sx={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            ml: 2,
            '&:hover': {
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
            }
          }}
        >
          Crear Usuario
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// Modern Edit User Modal
const EditUserModal = ({ open, user, onClose, onSubmit }: EditModalProps) => {
  const [values, setValues] = useState({
    nombre: '',
    email: ''
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (user) {
      setValues({
        nombre: user.nombre,
        email: user.email
      })
    }
  }, [user])

  const validateFields = () => {
    const newErrors: { [key: string]: string } = {}
    if (!values.nombre) newErrors.nombre = 'Nombre es requerido'
    if (!values.email) newErrors.email = 'Email es requerido'
    if (!validateEmail(values.email) && values.email)
      newErrors.email = 'Email inválido'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateFields() && user) {
      onSubmit({ ...user, ...values, rol: user.rol })
      setErrors({})
    }
  }

  const handleClose = () => {
    setErrors({})
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <DialogTitle
        sx={{
          textAlign: 'center',
          fontWeight: 'bold',
          pb: 1,
          borderBottom: '1px solid #e5e7eb'
        }}
      >
        <Box
          display='flex'
          alignItems='center'
          justifyContent='center'
          gap={1}
          mb={1}
        >
          <Edit sx={{ color: '#10b981' }} />
          <Typography variant='h6' fontWeight='bold'>
            Editar Usuario
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3}>
          <TextField
            label='Nombre completo'
            value={values.nombre}
            error={!!errors.nombre}
            helperText={errors.nombre}
            onChange={(e) => setValues({ ...values, nombre: e.target.value })}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#10b981'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#10b981'
                }
              }
            }}
          />

          <TextField
            label='Correo electrónico'
            type='email'
            value={values.email}
            error={!!errors.email}
            helperText={errors.email}
            onChange={(e) => setValues({ ...values, email: e.target.value })}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#10b981'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#10b981'
                }
              }
            }}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={handleClose}
          variant='outlined'
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            borderColor: '#d1d5db',
            color: '#374151',
            '&:hover': {
              borderColor: '#9ca3af',
              backgroundColor: '#f9fafb'
            }
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant='contained'
          sx={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            ml: 2,
            '&:hover': {
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
            }
          }}
        >
          Guardar Cambios
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const validateEmail = (email: string) =>
  !!email.length &&
  email
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )

export default Table
