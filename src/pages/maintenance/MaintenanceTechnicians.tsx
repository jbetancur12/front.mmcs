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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Autocomplete,
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
  Cancel
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
  TechnicianAvailability,
  TechnicianFormData,
  TechnicianFormErrors
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
  specialties: Yup.array()
    .min(1, 'Debe seleccionar al menos una especialidad')
    .required('Las especialidades son requeridas'),
  isActive: Yup.boolean()
})

const availableSpecialties = [
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
      specialties: [],
      isActive: true
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
      specialties: technician.specialties,
      isActive: technician.isActive
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

  const getAvailabilityColor = (status: TechnicianAvailability) => {
    switch (status) {
      case TechnicianAvailability.AVAILABLE:
        return 'success'
      case TechnicianAvailability.BUSY:
        return 'warning'
      case TechnicianAvailability.ON_BREAK:
        return 'info'
      case TechnicianAvailability.OFFLINE:
        return 'error'
      default:
        return 'default'
    }
  }

  const getAvailabilityLabel = (status: TechnicianAvailability) => {
    switch (status) {
      case TechnicianAvailability.AVAILABLE:
        return 'Disponible'
      case TechnicianAvailability.BUSY:
        return 'Ocupado'
      case TechnicianAvailability.ON_BREAK:
        return 'En Descanso'
      case TechnicianAvailability.OFFLINE:
        return 'Desconectado'
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
                      (t) =>
                        t.isActive &&
                        t.availabilityStatus ===
                          TechnicianAvailability.AVAILABLE
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
                      (t) =>
                        t.isActive &&
                        t.availabilityStatus === TechnicianAvailability.BUSY
                    ).length || 0}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Ocupados
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
                    {technicians?.reduce((acc, t) => acc + (t.rating || 0), 0) /
                      (technicians?.length || 1) || 0}
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
                    <TableCell>Especialidades</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Disponibilidad</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Tickets</TableCell>
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
                        <Box
                          display='flex'
                          flexWrap='wrap'
                          gap={0.5}
                          maxWidth={200}
                        >
                          {technician.specialties
                            .slice(0, 3)
                            .map((specialty) => (
                              <Chip
                                key={specialty}
                                label={specialty}
                                size='small'
                                variant='outlined'
                                color='primary'
                              />
                            ))}
                          {technician.specialties.length > 3 && (
                            <Chip
                              label={`+${technician.specialties.length - 3}`}
                              size='small'
                              variant='outlined'
                            />
                          )}
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={technician.isActive ? 'Activo' : 'Inactivo'}
                          color={technician.isActive ? 'success' : 'error'}
                          size='small'
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={getAvailabilityLabel(
                            technician.availabilityStatus
                          )}
                          color={
                            getAvailabilityColor(
                              technician.availabilityStatus
                            ) as any
                          }
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
                          {technician.completedTickets}/
                          {technician.totalTickets}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          Completados/Total
                        </Typography>
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
                <FormControlLabel
                  control={
                    <Switch
                      checked={formik.values.isActive}
                      onChange={(e) =>
                        formik.setFieldValue('isActive', e.target.checked)
                      }
                      name='isActive'
                    />
                  }
                  label='Técnico Activo'
                />
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={availableSpecialties}
                  value={formik.values.specialties}
                  onChange={(_, value) =>
                    formik.setFieldValue('specialties', value)
                  }
                  onBlur={() => formik.setFieldTouched('specialties', true)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label='Especialidades'
                      error={
                        formik.touched.specialties &&
                        Boolean(formik.errors.specialties)
                      }
                      helperText={
                        formik.touched.specialties && formik.errors.specialties
                      }
                      required
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={option}
                        label={option}
                        size='small'
                        color='primary'
                      />
                    ))
                  }
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
                createTechnicianMutation.isPending ||
                updateTechnicianMutation.isPending
              }
            >
              {createTechnicianMutation.isPending ||
              updateTechnicianMutation.isPending
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
            disabled={deleteTechnicianMutation.isPending}
          >
            {deleteTechnicianMutation.isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default MaintenanceTechnicians
