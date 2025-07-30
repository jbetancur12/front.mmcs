import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Avatar
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  School as SchoolIcon,
  Work as WorkIcon
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'

interface User {
  id: number
  name: string
  email: string
  role: string
  isActive: boolean
  enrolledCourses: number
  completedCourses: number
  certificatesEarned: number
  lastLogin: string
  createdAt: string
}

interface CreateUserData {
  name: string
  email: string
  role: string
  isActive: boolean
}

const LmsUserManagement: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<CreateUserData>({
    name: '',
    email: '',
    role: 'client',
    isActive: true
  })

  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()

  // Mock data para usuarios
  const mockUsers: User[] = [
    {
      id: 1,
      name: 'Juan Pérez',
      email: 'juan.perez@empresa.com',
      role: 'employee',
      isActive: true,
      enrolledCourses: 5,
      completedCourses: 3,
      certificatesEarned: 2,
      lastLogin: '2024-01-20',
      createdAt: '2024-01-01'
    },
    {
      id: 2,
      name: 'María García',
      email: 'maria.garcia@empresa.com',
      role: 'employee',
      isActive: true,
      enrolledCourses: 8,
      completedCourses: 6,
      certificatesEarned: 4,
      lastLogin: '2024-01-19',
      createdAt: '2024-01-02'
    },
    {
      id: 3,
      name: 'Carlos López',
      email: 'carlos.lopez@cliente.com',
      role: 'client',
      isActive: true,
      enrolledCourses: 3,
      completedCourses: 1,
      certificatesEarned: 1,
      lastLogin: '2024-01-18',
      createdAt: '2024-01-03'
    },
    {
      id: 4,
      name: 'Ana Rodríguez',
      email: 'ana.rodriguez@empresa.com',
      role: 'employee',
      isActive: false,
      enrolledCourses: 2,
      completedCourses: 0,
      certificatesEarned: 0,
      lastLogin: '2024-01-10',
      createdAt: '2024-01-04'
    }
  ]

  // Query para obtener usuarios (usando mock data por ahora)
  const { data: users = mockUsers, isLoading } = useQuery<User[]>(
    'lms-users',
    async () => {
      // En el futuro, esto hará una llamada real a la API
      // const response = await axiosPrivate.get('/lms/users')
      // return response.data
      return mockUsers
    }
  )

  // Mutación para crear/actualizar usuario
  const saveUserMutation = useMutation(
    async (userData: CreateUserData | User) => {
      if ('id' in userData) {
        // Actualizar usuario existente
        return axiosPrivate.put(`/lms/users/${userData.id}`, userData)
      } else {
        // Crear nuevo usuario
        return axiosPrivate.post('/lms/users', userData)
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('lms-users')
        handleCloseDialog()
      },
      onError: (error: any) => {
        console.error('Error al guardar usuario:', error)
      }
    }
  )

  // Mutación para eliminar usuario
  const deleteUserMutation = useMutation(
    async (userId: number) => {
      return axiosPrivate.delete(`/lms/users/${userId}`)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('lms-users')
      },
      onError: (error: any) => {
        console.error('Error al eliminar usuario:', error)
      }
    }
  )

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      })
    } else {
      setEditingUser(null)
      setFormData({
        name: '',
        email: '',
        role: 'client',
        isActive: true
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingUser(null)
    setFormData({
      name: '',
      email: '',
      role: 'client',
      isActive: true
    })
  }

  const handleSubmit = () => {
    if (editingUser) {
      saveUserMutation.mutate({ ...editingUser, ...formData })
    } else {
      saveUserMutation.mutate(formData)
    }
  }

  const handleDelete = (userId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      deleteUserMutation.mutate(userId)
    }
  }

  const handleInputChange = (field: keyof CreateUserData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error'
      case 'employee':
        return 'primary'
      case 'client':
        return 'success'
      default:
        return 'default'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'employee':
        return 'Empleado'
      case 'client':
        return 'Cliente'
      default:
        return role
    }
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh'
        }}
      >
        <Typography>Cargando usuarios...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <Typography variant='h4' component='h1'>
          Gestión de Usuarios
        </Typography>
        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Agregar Usuario
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Cursos Inscritos</TableCell>
              <TableCell>Cursos Completados</TableCell>
              <TableCell>Certificados</TableCell>
              <TableCell>Último Acceso</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant='subtitle2' fontWeight='bold'>
                        {user.name}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        ID: {user.id}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <EmailIcon sx={{ mr: 1, fontSize: 'small' }} />
                    {user.email}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getRoleLabel(user.role)}
                    color={getRoleColor(user.role) as any}
                    size='small'
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SchoolIcon sx={{ mr: 1, fontSize: 'small' }} />
                    {user.enrolledCourses}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <WorkIcon sx={{ mr: 1, fontSize: 'small' }} />
                    {user.completedCourses}
                  </Box>
                </TableCell>
                <TableCell>{user.certificatesEarned}</TableCell>
                <TableCell>
                  <Typography variant='caption'>
                    {new Date(user.lastLogin).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.isActive ? 'Activo' : 'Inactivo'}
                    color={user.isActive ? 'success' : 'default'}
                    size='small'
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size='small'
                      onClick={() => handleOpenDialog(user)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size='small'
                      color='error'
                      onClick={() => handleDelete(user.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para crear/editar usuario */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>
          {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Nombre completo'
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type='email'
                label='Email'
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={formData.role}
                  label='Rol'
                  onChange={(e) => handleInputChange('role', e.target.value)}
                >
                  <MenuItem value='admin'>Administrador</MenuItem>
                  <MenuItem value='employee'>Empleado</MenuItem>
                  <MenuItem value='client'>Cliente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) =>
                      handleInputChange('isActive', e.target.checked)
                    }
                  />
                }
                label='Usuario activo'
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant='contained'
            disabled={saveUserMutation.isLoading}
          >
            {saveUserMutation.isLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LmsUserManagement
