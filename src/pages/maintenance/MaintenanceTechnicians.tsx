import React, { useState } from 'react'
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Avatar,
  Chip,
  IconButton,
  Alert,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  Autocomplete,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Rating
} from '@mui/material'
import {
  People,
  Add,
  Edit,
  Delete,
  Star,
  Work,
  CheckCircle,
  PowerSettingsNew,
  RestoreFromTrash
} from '@mui/icons-material'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import {
  useMaintenanceTechnicians,
  useCreateMaintenanceTechnician,
  useUpdateMaintenanceTechnician,
  useDeleteMaintenanceTechnician
} from '../../hooks/useMaintenance'
import {
  MaintenanceTechnician,
  TechnicianFormData
} from '../../types/maintenance'

const validationSchema = Yup.object({
  name: Yup.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .required('El nombre es requerido'),
  email: Yup.string().email('Email inválido').required('El email es requerido'),
  phone: Yup.string()
    .min(10, 'El teléfono debe tener al menos 10 dígitos')
    .required('El teléfono es requerido'),
  specialization: Yup.string()
    .min(2, 'La especialización es requerida')
    .required('La especialización es requerida'),
  certifications: Yup.string(),
  status: Yup.string().oneOf(['active', 'inactive', 'on_leave']).required(),
  employeeId: Yup.string(),
  isAvailable: Yup.boolean(),
  maxWorkload: Yup.number().min(1).max(50).required(),
  notes: Yup.string()
})

const availableSpecializations = [
  'Ventiladores Mecánicos',
  'Monitores de Signos Vitales',
  'Desfibriladores',
  'Electrocardiógrafos',
  'Bombas de Infusión',
  'Oxímetros',
  'Equipos de Rayos X',
  'Ecógrafos',
  'Autoclave',
  'Microscopios',
  'Centrífugas',
  'Incubadoras',
  'Equipos Láser',
  'Equipos de Diálisis',
  'Equipos de Anestesia'
]

const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'on_leave', label: 'En Licencia' }
]

/**
 * MaintenanceTechnicians component manages the technician database
 * Allows creating, editing, and managing technician information and specialties
 */
const MaintenanceTechnicians: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTechnician, setEditingTechnician] =
    useState<MaintenanceTechnician | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [technicianToDelete, setTechnicianToDelete] =
    useState<MaintenanceTechnician | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [statusConfirmDialogOpen, setStatusConfirmDialogOpen] = useState(false)
  const [technicianToToggle, setTechnicianToToggle] =
    useState<MaintenanceTechnician | null>(null)

  // API hooks
  const { data: technicians, isLoading, refetch } = useMaintenanceTechnicians()
  const createTechnicianMutation = useCreateMaintenanceTechnician()
  const updateTechnicianMutation = useUpdateMaintenanceTechnician()
  const deleteTechnicianMutation = useDeleteMaintenanceTechnician()

  const formik = useFormik<TechnicianFormData>({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      specialization: '',
      certifications: '',
      status: 'active',
      employeeId: '',
      isAvailable: true,
      maxWorkload: 10,
      notes: ''
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        if (editingTechnician) {
          await updateTechnicianMutation.mutateAsync({
            id: editingTechnician.id,
            data: values
          })
        } else {
          await createTechnicianMutation.mutateAsync(values)
        }

        resetForm()
        setDialogOpen(false)
        setEditingTechnician(null)
        refetch()
      } catch (error) {
        console.error('Error saving technician:', error)
      }
    }
  })

  const handleEdit = (technician: MaintenanceTechnician) => {
    setEditingTechnician(technician)
    formik.setValues({
      name: technician.name,
      email: technician.email,
      phone: technician.phone,
      specialization: technician.specialization,
      certifications: technician.certifications || '',
      status: technician.status,
      employeeId: technician.employeeId || '',
      isAvailable: technician.isAvailable,
      maxWorkload: technician.maxWorkload,
      notes: technician.notes || ''
    })
    setDialogOpen(true)
  }

  const handleToggleStatus = async () => {
    if (!technicianToToggle) return

    try {
      const newStatus =
        technicianToToggle.status === 'active' ? 'inactive' : 'active'
      // If reactivating, also set isAvailable to true by default
      const isAvailable = newStatus === 'active' ? true : false

      await updateTechnicianMutation.mutateAsync({
        id: technicianToToggle.id,
        data: {
          status: newStatus,
          isAvailable: isAvailable
        }
      })

      setStatusConfirmDialogOpen(false)
      setTechnicianToToggle(null)
      refetch()
    } catch (error) {
      console.error('Error toggling technician status:', error)
    }
  }

  const handleDelete = async () => {
    if (!technicianToDelete) return
    setDeleteError(null)

    try {
      await deleteTechnicianMutation.mutateAsync(technicianToDelete.id)
      setDeleteDialogOpen(false)
      setTechnicianToDelete(null)
      refetch()
    } catch (error: any) {
      console.error('Error deleting technician:', error)
      const message =
        error.response?.data?.error || 'Error al eliminar el técnico'
      setDeleteError(message)
    }
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingTechnician(null)
    formik.resetForm()
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'inactive':
        return 'error'
      case 'on_leave':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo'
      case 'inactive':
        return 'Inactivo'
      case 'on_leave':
        return 'En Licencia'
      default:
        return 'Desconocido'
    }
  }

  return (
    <Container
      maxWidth={false}
      sx={{
        py: 3,
        background:
          'linear-gradient(135deg, rgba(109, 198, 98, 0.02) 0%, rgba(255, 255, 255, 0.8) 100%)',
        minHeight: '100vh'
      }}
    >
      {/* Header */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={3}
        sx={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          p: 3,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(109, 198, 98, 0.1)'
        }}
      >
        <Box display='flex' alignItems='center' gap={2}>
          <Box
            sx={{
              background: 'linear-gradient(135deg, #6dc662 0%, #5ab052 100%)',
              borderRadius: '12px',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(109, 198, 98, 0.3)'
            }}
          >
            <People sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Box>
            <Typography
              variant='h4'
              component='h1'
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6dc662 0%, #5ab052 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em'
              }}
            >
              Gestión de Técnicos
            </Typography>
            <Typography variant='subtitle1' color='text.secondary'>
              Administración del equipo de mantenimiento
            </Typography>
          </Box>
        </Box>

        <Button
          variant='contained'
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
          sx={{
            background: 'linear-gradient(135deg, #6dc662 0%, #5ab052 100%)',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(109, 198, 98, 0.3)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              background: 'linear-gradient(135deg, #5ab052 0%, #4a9642 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(109, 198, 98, 0.4)'
            }
          }}
        >
          Agregar Técnico
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(109, 198, 98, 0.1)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 30px rgba(109, 198, 98, 0.15)',
                border: '1px solid rgba(109, 198, 98, 0.2)'
              }
            }}
          >
            <CardContent>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Box>
                  <Typography
                    variant='h4'
                    sx={{
                      fontWeight: 700,
                      color: '#6dc662'
                    }}
                  >
                    {technicians?.length || 0}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ fontWeight: 500 }}
                  >
                    Total Técnicos
                  </Typography>
                </Box>
                <Box
                  sx={{
                    background:
                      'linear-gradient(135deg, #6dc662 0%, #5ab052 100%)',
                    borderRadius: '12px',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <People sx={{ fontSize: 40, color: 'white' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(76, 175, 80, 0.1)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 30px rgba(76, 175, 80, 0.15)',
                border: '1px solid rgba(76, 175, 80, 0.2)'
              }
            }}
          >
            <CardContent>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Box>
                  <Typography
                    variant='h4'
                    sx={{
                      fontWeight: 700,
                      color: '#4caf50'
                    }}
                  >
                    {technicians?.filter(
                      (t) => t.status === 'active' && t.isAvailable
                    ).length || 0}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ fontWeight: 500 }}
                  >
                    Disponibles
                  </Typography>
                </Box>
                <Box
                  sx={{
                    background:
                      'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                    borderRadius: '12px',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CheckCircle sx={{ fontSize: 40, color: 'white' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(255, 152, 0, 0.1)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 30px rgba(255, 152, 0, 0.15)',
                border: '1px solid rgba(255, 152, 0, 0.2)'
              }
            }}
          >
            <CardContent>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Box>
                  <Typography
                    variant='h4'
                    sx={{
                      fontWeight: 700,
                      color: '#ff9800'
                    }}
                  >
                    {technicians?.filter(
                      (t) => t.status === 'active' && !t.isAvailable
                    ).length || 0}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ fontWeight: 500 }}
                  >
                    No Disponibles
                  </Typography>
                </Box>
                <Box
                  sx={{
                    background:
                      'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                    borderRadius: '12px',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Work sx={{ fontSize: 40, color: 'white' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(255, 193, 7, 0.1)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 30px rgba(255, 193, 7, 0.15)',
                border: '1px solid rgba(255, 193, 7, 0.2)'
              }
            }}
          >
            <CardContent>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Box>
                  <Typography
                    variant='h4'
                    sx={{
                      fontWeight: 700,
                      color: '#ffc107'
                    }}
                  >
                    {technicians && technicians.length > 0
                      ? (
                          technicians.reduce(
                            (acc, t) => acc + (t.rating || 0),
                            0
                          ) / technicians.length
                        ).toFixed(1)
                      : '0.0'}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ fontWeight: 500 }}
                  >
                    Rating Promedio
                  </Typography>
                </Box>
                <Box
                  sx={{
                    background:
                      'linear-gradient(135deg, #ffc107 0%, #ff8f00 100%)',
                    borderRadius: '12px',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Star sx={{ fontSize: 40, color: 'white' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Technicians Table */}
      <Paper
        elevation={2}
        sx={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(109, 198, 98, 0.1)'
        }}
      >
        <Box p={3}>
          <Typography
            variant='h6'
            gutterBottom
            sx={{
              fontWeight: 600,
              color: '#6dc662',
              mb: 3
            }}
          >
            Lista de Técnicos
          </Typography>

          {isLoading ? (
            <Box display='flex' justifyContent='center' py={4}>
              <Typography>Cargando técnicos...</Typography>
            </Box>
          ) : !technicians?.length ? (
            <Alert severity='info'>
              No hay técnicos registrados. Agregue el primer técnico.
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Técnico</TableCell>
                    <TableCell>Contacto</TableCell>
                    <TableCell>Especialización</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Disponibilidad</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Carga de Trabajo</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {technicians.map((technician) => (
                    <TableRow key={technician.id}>
                      <TableCell>
                        <Box display='flex' alignItems='center' gap={2}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {getInitials(technician.name)}
                          </Avatar>
                          <Box>
                            <Typography variant='body1' fontWeight='medium'>
                              {technician.name}
                            </Typography>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              ID: {technician.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant='body2'>
                          {technician.email}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {technician.phone}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant='body2'>
                          {technician.specialization || 'No especificado'}
                        </Typography>
                        {technician.certifications && (
                          <Typography variant='caption' color='text.secondary'>
                            Cert: {technician.certifications}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={getStatusLabel(technician.status)}
                          color={getStatusColor(technician.status) as any}
                          size='small'
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={
                            technician.isAvailable
                              ? 'Disponible'
                              : 'No Disponible'
                          }
                          color={technician.isAvailable ? 'success' : 'error'}
                          size='small'
                        />
                      </TableCell>

                      <TableCell>
                        <Box display='flex' alignItems='center' gap={0.5}>
                          <Rating
                            value={technician.rating || 0}
                            readOnly
                            size='small'
                            precision={0.1}
                          />
                          <Typography variant='caption'>
                            ({technician.rating?.toFixed(1) || 0})
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant='body2'>
                          {technician.workload}/{technician.maxWorkload}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          Actual/Máximo
                        </Typography>
                        {technician.metrics && (
                          <Typography
                            variant='caption'
                            display='block'
                            color='text.secondary'
                          >
                            {technician.metrics.workloadPercentage}% utilización
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Tooltip title='Editar'>
                          <IconButton
                            size='small'
                            onClick={() => handleEdit(technician)}
                            color='primary'
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>

                        <Tooltip
                          title={
                            technician.status === 'active'
                              ? 'Desactivar'
                              : 'Reactivar'
                          }
                        >
                          <IconButton
                            size='small'
                            onClick={() => {
                              setTechnicianToToggle(technician)
                              setStatusConfirmDialogOpen(true)
                            }}
                            color={
                              technician.status === 'active'
                                ? 'warning'
                                : 'success'
                            }
                          >
                            {technician.status === 'active' ? (
                              <PowerSettingsNew />
                            ) : (
                              <RestoreFromTrash />
                            )}
                          </IconButton>
                        </Tooltip>

                        <Tooltip title='Eliminar'>
                          <IconButton
                            size='small'
                            onClick={() => {
                              setTechnicianToDelete(technician)
                              setDeleteDialogOpen(true)
                            }}
                            color='error'
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>

      {/* Add/Edit Technician Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          {editingTechnician ? 'Editar Técnico' : 'Agregar Técnico'}
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name='name'
                  label='Nombre Completo'
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name='email'
                  label='Email'
                  type='email'
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name='phone'
                  label='Teléfono'
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.phone && Boolean(formik.errors.phone)}
                  helperText={formik.touched.phone && formik.errors.phone}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  name='status'
                  label='Estado'
                  value={formik.values.status}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.status && Boolean(formik.errors.status)}
                  helperText={formik.touched.status && formik.errors.status}
                  required
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name='employeeId'
                  label='ID Empleado'
                  value={formik.values.employeeId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.employeeId &&
                    Boolean(formik.errors.employeeId)
                  }
                  helperText={
                    formik.touched.employeeId && formik.errors.employeeId
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type='number'
                  name='maxWorkload'
                  label='Carga Máxima de Trabajo'
                  value={formik.values.maxWorkload}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.maxWorkload &&
                    Boolean(formik.errors.maxWorkload)
                  }
                  helperText={
                    formik.touched.maxWorkload && formik.errors.maxWorkload
                  }
                  InputProps={{ inputProps: { min: 1, max: 50 } }}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  freeSolo
                  options={availableSpecializations}
                  value={formik.values.specialization}
                  onChange={(_, value) =>
                    formik.setFieldValue('specialization', value || '')
                  }
                  onBlur={() => formik.setFieldTouched('specialization', true)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label='Especialización'
                      name='specialization'
                      value={formik.values.specialization}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.specialization &&
                        Boolean(formik.errors.specialization)
                      }
                      helperText={
                        formik.touched.specialization &&
                        formik.errors.specialization
                      }
                      required
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  name='certifications'
                  label='Certificaciones'
                  value={formik.values.certifications}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.certifications &&
                    Boolean(formik.errors.certifications)
                  }
                  helperText={
                    formik.touched.certifications &&
                    formik.errors.certifications
                  }
                  placeholder='Ej: Técnico en Electromedicina, Certificado en Ventiladores...'
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name='notes'
                  label='Notas'
                  value={formik.values.notes}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.notes && Boolean(formik.errors.notes)}
                  helperText={formik.touched.notes && formik.errors.notes}
                  placeholder='Notas adicionales sobre el técnico...'
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formik.values.isAvailable}
                      onChange={(e) =>
                        formik.setFieldValue('isAvailable', e.target.checked)
                      }
                      name='isAvailable'
                    />
                  }
                  label='Disponible para Asignaciones'
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button
              type='submit'
              variant='contained'
              disabled={
                createTechnicianMutation.isLoading ||
                updateTechnicianMutation.isLoading
              }
            >
              {createTechnicianMutation.isLoading ||
              updateTechnicianMutation.isLoading
                ? 'Guardando...'
                : editingTechnician
                  ? 'Actualizar'
                  : 'Crear'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Status Toggle Confirmation Dialog */}
      <Dialog
        open={statusConfirmDialogOpen}
        onClose={() => setStatusConfirmDialogOpen(false)}
      >
        <DialogTitle>
          {technicianToToggle?.status === 'active'
            ? 'Desactivar Técnico'
            : 'Reactivar Técnico'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea{' '}
            {technicianToToggle?.status === 'active'
              ? 'desactivar'
              : 'reactivar'}{' '}
            al técnico <strong>{technicianToToggle?.name}</strong>?
          </Typography>
          {technicianToToggle?.status === 'active' && (
            <Alert severity='warning' sx={{ mt: 2 }}>
              El técnico no podrá ser asignado a nuevos tickets.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusConfirmDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleToggleStatus}
            color={
              technicianToToggle?.status === 'active' ? 'warning' : 'success'
            }
            variant='contained'
            disabled={updateTechnicianMutation.isLoading}
          >
            {updateTechnicianMutation.isLoading
              ? 'Procesando...'
              : technicianToToggle?.status === 'active'
                ? 'Desactivar'
                : 'Reactivar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setDeleteError(null)
        }}
      >
        <DialogTitle>
          {deleteError ? 'No se puede eliminar' : 'Confirmar Eliminación'}
        </DialogTitle>
        <DialogContent>
          {deleteError ? (
            <Alert severity='error' sx={{ mt: 1 }}>
              {deleteError}
            </Alert>
          ) : (
            <Typography>
              ¿Está seguro de que desea eliminar al técnico{' '}
              <strong>{technicianToDelete?.name}</strong>? Esta acción no se
              puede deshacer.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false)
              setDeleteError(null)
            }}
          >
            {deleteError ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!deleteError && (
            <Button
              onClick={handleDelete}
              color='error'
              variant='contained'
              disabled={deleteTechnicianMutation.isLoading}
            >
              {deleteTechnicianMutation.isLoading
                ? 'Eliminando...'
                : 'Eliminar'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default MaintenanceTechnicians
