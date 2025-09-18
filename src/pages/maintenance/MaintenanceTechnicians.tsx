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
  CheckCircle
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

  const handleDelete = async () => {
    if (!technicianToDelete) return

    try {
      await deleteTechnicianMutation.mutateAsync(technicianToDelete.id)
      setDeleteDialogOpen(false)
      setTechnicianToDelete(null)
      refetch()
    } catch (error) {
      console.error('Error deleting technician:', error)
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
    <Container maxWidth={false} sx={{ py: 3 }}>
      {/* Header */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={3}
      >
        <Box display='flex' alignItems='center' gap={2}>
          <People color='primary' sx={{ fontSize: 32 }} />
          <Typography variant='h4' component='h1'>
            Gestión de Técnicos
          </Typography>
        </Box>

        <Button
          variant='contained'
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
        >
          Agregar Técnico
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Box>
                  <Typography variant='h4' color='primary'>
                    {technicians?.length || 0}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Total Técnicos
                  </Typography>
                </Box>
                <People color='primary' sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Box>
                  <Typography variant='h4' color='success.main'>
                    {technicians?.filter(
                      (t) => t.status === 'active' && t.isAvailable
                    ).length || 0}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Disponibles
                  </Typography>
                </Box>
                <CheckCircle color='success' sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Box>
                  <Typography variant='h4' color='warning.main'>
                    {technicians?.filter(
                      (t) => t.status === 'active' && !t.isAvailable
                    ).length || 0}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    No Disponibles
                  </Typography>
                </Box>
                <Work color='warning' sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Box>
                  <Typography variant='h4' color='info.main'>
                    {technicians && technicians.length > 0
                      ? (
                          technicians.reduce((acc, t) => acc + (t.rating || 0), 0) /
                          technicians.length
                        ).toFixed(1)
                      : '0.0'}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Rating Promedio
                  </Typography>
                </Box>
                <Star color='warning' sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Technicians Table */}
      <Paper elevation={2}>
        <Box p={3}>
          <Typography variant='h6' gutterBottom>
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
                          label={technician.isAvailable ? 'Disponible' : 'No Disponible'}
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
                          <Typography variant='caption' display='block' color='text.secondary'>
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
                  error={formik.touched.employeeId && Boolean(formik.errors.employeeId)}
                  helperText={formik.touched.employeeId && formik.errors.employeeId}
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
                  error={formik.touched.maxWorkload && Boolean(formik.errors.maxWorkload)}
                  helperText={formik.touched.maxWorkload && formik.errors.maxWorkload}
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
                        formik.touched.specialization && formik.errors.specialization
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
                  error={formik.touched.certifications && Boolean(formik.errors.certifications)}
                  helperText={formik.touched.certifications && formik.errors.certifications}
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea eliminar al técnico{' '}
            <strong>{technicianToDelete?.name}</strong>? Esta acción no se puede
            deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleDelete}
            color='error'
            variant='contained'
            disabled={deleteTechnicianMutation.isLoading}
          >
            {deleteTechnicianMutation.isLoading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default MaintenanceTechnicians
