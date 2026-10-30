import { getApiErrorReason } from 'src/utils/apiError'
import React, { useMemo, useState } from 'react'
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
  FormControlLabel,
  Switch,
  Autocomplete,
  MenuItem,
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

import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table'
import { purchaseTableStyle } from 'src/Components/Purchases/purchaseTableStyle'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import { notify } from 'src/utils/notify'
const validationSchema = Yup.object({
  name: Yup.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .required('El nombre es requerido'),
  email: Yup.string().email('Email inválido').required('El email es requerido'),
  phone: Yup.string()
    .min(10, 'El teléfono debe tener al menos 10 dígitos')
    .required('El teléfono es requerido'),
  specialization: Yup.string(),
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
        notify.success(editingTechnician
            ? 'Técnico actualizado exitosamente.'
            : 'Técnico creado exitosamente.')
        refetch()
      } catch (error: any) {
        console.error('Error saving technician:', error)
        notify.error(getApiErrorReason(error) ||
            'No se pudo guardar el técnico.')
      }
    }
  })

  const safeText = (value: string | null | undefined) => value ?? ''

  const handleEdit = (technician: MaintenanceTechnician) => {
    setEditingTechnician(technician)
    formik.setValues({
      name: safeText(technician.name),
      email: safeText(technician.email),
      phone: safeText(technician.phone),
      specialization: safeText(technician.specialization),
      certifications: safeText(technician.certifications),
      status: technician.status,
      employeeId: safeText(technician.employeeId),
      isAvailable: technician.isAvailable,
      maxWorkload: technician.maxWorkload,
      notes: safeText(technician.notes),
      signatureData: safeText(technician.signatureData)
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
        getApiErrorReason(error) || 'Error al eliminar el técnico'
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

  const columns = useMemo<MRT_ColumnDef<MaintenanceTechnician>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Técnico',
        size: 240,
        Cell: ({ row }) => (
          <Box display='flex' alignItems='center' gap={1.5}>
            <Avatar sx={{ bgcolor: '#00BFA5', color: '#fff', fontWeight: 600, width: 36, height: 36, fontSize: 14 }}>
              {getInitials(row.original.name)}
            </Avatar>
            <Box>
              <Typography variant='body2' fontWeight={600}>
                {row.original.name}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                ID: {row.original.id}
              </Typography>
            </Box>
          </Box>
        )
      },
      {
        id: 'contact',
        header: 'Contacto',
        size: 240,
        accessorFn: (t) => `${t.email ?? ''} ${t.phone ?? ''}`,
        Cell: ({ row }) => (
          <Box>
            <Typography variant='body2'>{row.original.email}</Typography>
            <Typography variant='caption' color='text.secondary'>
              {row.original.phone}
            </Typography>
          </Box>
        )
      },
      {
        id: 'specialization',
        header: 'Especialización',
        size: 220,
        accessorFn: (t) => `${t.specialization ?? ''} ${t.certifications ?? ''}`,
        Cell: ({ row }) => (
          <Box>
            <Chip size='small' variant='outlined' label={row.original.specialization || 'No especificado'} sx={{ maxWidth: 200 }} />
            {row.original.certifications && (
              <Typography variant='caption' color='text.secondary' display='block' sx={{ mt: 0.5 }}>
                Cert: {row.original.certifications}
              </Typography>
            )}
          </Box>
        )
      },
      {
        id: 'status',
        header: 'Estado',
        size: 130,
        accessorFn: (t) => getStatusLabel(t.status),
        Cell: ({ row }) => (
          <Chip
            size='small'
            variant='outlined'
            label={getStatusLabel(row.original.status)}
            color={row.original.status === 'active' ? 'success' : row.original.status === 'inactive' ? 'error' : 'warning'}
          />
        )
      },
      {
        id: 'availability',
        header: 'Disponibilidad',
        size: 150,
        accessorFn: (t) => (t.isAvailable ? 'Disponible' : 'No Disponible'),
        Cell: ({ row }) => (
          <Chip
            size='small'
            variant='outlined'
            label={row.original.isAvailable ? 'Disponible' : 'No Disponible'}
            color={row.original.isAvailable ? 'success' : 'warning'}
          />
        )
      },
      {
        accessorKey: 'rating',
        header: 'Rating',
        size: 190,
        Cell: ({ row }) => (
          <Box display='flex' alignItems='center' gap={0.5}>
            <Rating value={row.original.rating || 0} readOnly size='small' precision={0.1} />
            <Typography variant='caption'>({row.original.rating?.toFixed(1) || 0})</Typography>
          </Box>
        )
      },
      {
        id: 'workload',
        header: 'Carga de trabajo',
        size: 170,
        accessorFn: (t) => t.workload,
        Cell: ({ row }) => (
          <Box>
            <Typography variant='body2' fontWeight={600}>
              {row.original.workload}/{row.original.maxWorkload}
            </Typography>
            {row.original.metrics && (
              <Typography variant='caption' display='block' color='text.secondary'>
                {row.original.metrics.workloadPercentage}% utilización
              </Typography>
            )}
          </Box>
        )
      }
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Gestión de Técnicos'
        subtitle='Administración del equipo de mantenimiento'
        icon={<People />}
        actions={
          <Button variant='contained' startIcon={<Add />} onClick={() => setDialogOpen(true)} sx={{ bgcolor: '#00BFA5', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#00ACC1' } }}>
            Agregar Técnico
          </Button>
        }
      />

      <Grid container spacing={3} mb={3}>
        <Grid item xs={6} md={3}>
          <LmsStatCard label='Total Técnicos' value={technicians?.length || 0} icon={<People />} tone='teal' />
        </Grid>
        <Grid item xs={6} md={3}>
          <LmsStatCard
            label='Disponibles'
            value={technicians?.filter((t) => t.status === 'active' && t.isAvailable).length || 0}
            icon={<CheckCircle />}
            tone='green'
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <LmsStatCard
            label='No Disponibles'
            value={technicians?.filter((t) => t.status === 'active' && !t.isAvailable).length || 0}
            icon={<Work />}
            tone='orange'
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <LmsStatCard
            label='Rating Promedio'
            value={technicians && technicians.length > 0
              ? (technicians.reduce((acc, t) => acc + (t.rating || 0), 0) / technicians.length).toFixed(1)
              : '0.0'}
            icon={<Star />}
            tone='blue'
          />
        </Grid>
      </Grid>

      {/* Technicians Table */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <MaterialReactTable
          {...purchaseTableStyle}
          columns={columns}
          data={technicians ?? []}
          state={{ isLoading }}
          getRowId={(row, index) => String(row.id ?? `skeleton-${index}`)}
          enablePinning
          initialState={{ columnPinning: { right: ['mrt-row-actions'] }, density: 'comfortable' }}
          enableRowActions
          displayColumnDefOptions={{ 'mrt-row-actions': { header: 'Acciones', size: 150 } }}
          renderRowActions={({ row }) => {
            const technician = row.original
            return (
              <Box display='flex' gap={0.5}>
                <Tooltip title='Editar'>
                  <IconButton size='small' color='primary' onClick={() => handleEdit(technician)}>
                    <Edit />
                  </IconButton>
                </Tooltip>
                <Tooltip title={technician.status === 'active' ? 'Desactivar' : 'Reactivar'}>
                  <IconButton
                    size='small'
                    onClick={() => {
                      setTechnicianToToggle(technician)
                      setStatusConfirmDialogOpen(true)
                    }}
                    sx={{ color: technician.status === 'active' ? 'warning.main' : '#00BFA5' }}
                  >
                    {technician.status === 'active' ? <PowerSettingsNew /> : <RestoreFromTrash />}
                  </IconButton>
                </Tooltip>
                <Tooltip title='Eliminar'>
                  <IconButton
                    size='small'
                    color='error'
                    onClick={() => {
                      setTechnicianToDelete(technician)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Delete />
                  </IconButton>
                </Tooltip>
              </Box>
            )
          }}
          renderEmptyRowsFallback={() => (
            <Alert severity='info' sx={{ m: 2 }}>
              No hay técnicos registrados. Agregue el primer técnico.
            </Alert>
          )}
        />
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
                  value={formik.values.name ?? ''}
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
                  value={formik.values.email ?? ''}
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
                  value={formik.values.phone ?? ''}
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
                  value={formik.values.status ?? 'active'}
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
                  value={formik.values.employeeId ?? ''}
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
                  value={formik.values.maxWorkload ?? 10}
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
                  value={formik.values.specialization ?? ''}
                  onChange={(_, value) =>
                    formik.setFieldValue('specialization', value || '')
                  }
                  onBlur={() => formik.setFieldTouched('specialization', true)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label='Especialización'
                      name='specialization'
                      value={formik.values.specialization ?? ''}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.specialization &&
                        Boolean(formik.errors.specialization)
                      }
                      helperText={
                        formik.touched.specialization &&
                        formik.errors.specialization
                      }
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
                  value={formik.values.certifications ?? ''}
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
                  value={formik.values.notes ?? ''}
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
                    value={formik.values.signatureData ?? null}
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
