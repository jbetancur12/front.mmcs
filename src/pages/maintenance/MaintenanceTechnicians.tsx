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
import SignaturePad from '../../Components/Maintenance/SignaturePad'
import { maintenanceSignaturesEnabled } from '../../features/maintenanceFlags'
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
  notes: Yup.string(),
  signatureData: Yup.string().nullable()
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
  const surfaceSx = {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)'
  }
  const statCardSx = {
    ...surfaceSx,
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      borderColor: '#cbd5e1',
      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)'
    }
  }

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
      notes: '',
      signatureData: ''
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
      notes: technician.notes || '',
      signatureData: technician.signatureData || ''
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
        py: { xs: 2, md: 3 },
        backgroundColor: '#f8fafc',
        minHeight: '100vh'
      }}
    >
      {/* Header */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', md: 'center' }}
        flexDirection={{ xs: 'column', md: 'row' }}
        gap={2}
        mb={3}
        sx={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          p: 3,
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
          border: '1px solid #e5e7eb'
        }}
      >
        <Box display='flex' alignItems='center' gap={2}>
          <Box
            sx={{
              backgroundColor: '#eef6ee',
              borderRadius: '10px',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <People sx={{ fontSize: 32, color: '#2f7d32' }} />
          </Box>
          <Box>
            <Typography
              variant='h4'
              component='h1'
              sx={{
                fontWeight: 700,
                color: '#0f172a',
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
            backgroundColor: '#2f7d32',
            borderRadius: '12px',
            alignSelf: { xs: 'stretch', md: 'auto' },
            '&:hover': {
              backgroundColor: '#27672a'
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
              ...statCardSx
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
                    backgroundColor: '#eef6ee',
                    borderRadius: '10px',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <People sx={{ fontSize: 40, color: '#2f7d32' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              ...statCardSx
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
                    backgroundColor: '#eef6ee',
                    borderRadius: '10px',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CheckCircle sx={{ fontSize: 40, color: '#2f7d32' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              ...statCardSx
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
                    backgroundColor: '#fff4e5',
                    borderRadius: '10px',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Work sx={{ fontSize: 40, color: '#b45309' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              ...statCardSx
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
                    backgroundColor: '#fff7db',
                    borderRadius: '10px',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Star sx={{ fontSize: 40, color: '#b45309' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Technicians Table */}
      <Paper
        sx={{
          ...surfaceSx
        }}
      >
        <Box p={3}>
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems={{ xs: 'flex-start', md: 'center' }}
            flexDirection={{ xs: 'column', md: 'row' }}
            gap={1}
            mb={3}
          >
            <Box>
              <Typography
                variant='h6'
                gutterBottom
                sx={{
                  fontWeight: 600,
                  color: '#0f172a',
                  mb: 0.5
                }}
              >
                Lista de Técnicos
              </Typography>
              <Typography variant='body2' sx={{ color: '#64748b' }}>
                Tabla más sobria para revisar disponibilidad, carga y acciones sin ruido visual.
              </Typography>
            </Box>
            <Chip
              size='small'
              label={`${technicians?.length || 0} registrados`}
              sx={{
                backgroundColor: '#eef6ee',
                color: '#2f7d32',
                fontWeight: 600
              }}
            />
          </Box>

          {isLoading ? (
            <Box display='flex' justifyContent='center' py={4}>
              <Typography>Cargando técnicos...</Typography>
            </Box>
          ) : !technicians?.length ? (
            <Alert severity='info'>
              No hay técnicos registrados. Agregue el primer técnico.
            </Alert>
          ) : (
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 980 }}>
                <TableHead>
                  <TableRow>
                    {[
                      'Técnico',
                      'Contacto',
                      'Especialización',
                      'Estado',
                      'Disponibilidad',
                      'Rating',
                      'Carga de Trabajo',
                      'Acciones'
                    ].map((label) => (
                      <TableCell
                        key={label}
                        sx={{
                          color: '#64748b',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          borderBottom: '1px solid #e5e7eb',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {technicians.map((technician) => (
                    <TableRow
                      key={technician.id}
                      hover
                      sx={{
                        '& td': {
                          borderBottom: '1px solid #eef2f7',
                          py: 2
                        }
                      }}
                    >
                      <TableCell>
                        <Box display='flex' alignItems='center' gap={2}>
                          <Avatar
                            sx={{
                              bgcolor: '#eef6ee',
                              color: '#2f7d32',
                              fontWeight: 700
                            }}
                          >
                            {getInitials(technician.name)}
                          </Avatar>
                          <Box>
                            <Typography variant='body1' fontWeight={600}>
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
                        <Chip
                          size='small'
                          label={technician.specialization || 'No especificado'}
                          sx={{
                            maxWidth: 220,
                            backgroundColor: '#f8fafc',
                            color: '#334155',
                            border: '1px solid #e5e7eb',
                            '& .MuiChip-label': {
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }
                          }}
                        />
                        {technician.certifications && (
                          <Typography
                            variant='caption'
                            color='text.secondary'
                            display='block'
                            sx={{ mt: 0.75 }}
                          >
                            Cert: {technician.certifications}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={getStatusLabel(technician.status)}
                          size='small'
                          sx={{
                            backgroundColor:
                              technician.status === 'active'
                                ? '#eef6ee'
                                : technician.status === 'inactive'
                                  ? '#fef2f2'
                                  : '#fff7db',
                            color:
                              technician.status === 'active'
                                ? '#2f7d32'
                                : technician.status === 'inactive'
                                  ? '#b91c1c'
                                  : '#b45309',
                            fontWeight: 600
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={
                            technician.isAvailable
                              ? 'Disponible'
                              : 'No Disponible'
                          }
                          size='small'
                          sx={{
                            backgroundColor: technician.isAvailable
                              ? '#ecfdf5'
                              : '#fff7ed',
                            color: technician.isAvailable ? '#059669' : '#c2410c',
                            fontWeight: 600
                          }}
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
                        <Typography variant='body2' fontWeight={600}>
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
                            sx={{
                              color: '#0ea5e9',
                              backgroundColor: '#f8fafc',
                              border: '1px solid #e5e7eb',
                              mr: 0.5,
                              '&:hover': { backgroundColor: '#eff6ff' }
                            }}
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
                            sx={{
                              color:
                                technician.status === 'active' ? '#d97706' : '#2f7d32',
                              backgroundColor: '#f8fafc',
                              border: '1px solid #e5e7eb',
                              mr: 0.5,
                              '&:hover': { backgroundColor: '#fff7ed' }
                            }}
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
                            sx={{
                              color: '#ef4444',
                              backgroundColor: '#f8fafc',
                              border: '1px solid #e5e7eb',
                              '&:hover': { backgroundColor: '#fef2f2' }
                            }}
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

              {maintenanceSignaturesEnabled && (
                <Grid item xs={12}>
                  <SignaturePad
                    value={formik.values.signatureData || null}
                    onChange={(value) =>
                      formik.setFieldValue('signatureData', value || '')
                    }
                    label='Firma guardada del técnico (opcional)'
                    helperText='Si la guardas aquí, se usará automáticamente al cerrar órdenes de servicio.'
                  />
                </Grid>
              )}

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
