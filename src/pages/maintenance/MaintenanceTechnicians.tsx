import { getApiErrorReason } from 'src/utils/apiError'
import FormDialog from 'src/Components/Common/FormDialog'
import ConfirmDialog from 'src/Components/Common/ConfirmDialog'
import React, { useMemo, useState } from 'react'
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  Avatar,
  Chip,
  IconButton,
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

import { MRT_ColumnDef } from 'material-react-table'
import DataTable from 'src/Components/Common/DataTable'
import EmptyState from 'src/Components/Common/EmptyState'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import { notify } from 'src/utils/notify'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import { logger } from 'src/utils/logger'
import { brand } from 'src/theme/designTokens'
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

const ratingColumn: MRT_ColumnDef<MaintenanceTechnician> = {
  accessorKey: 'rating',
  header: 'Calificación',
  size: 190,
  Cell: ({ row }) => (
    <Box display='flex' alignItems='center' gap={0.5}>
      <Rating
        value={row.original.rating || 0}
        readOnly
        size='small'
        precision={0.1}
      />
      <Typography variant='caption'>
        ({row.original.rating?.toFixed(1) || 0})
      </Typography>
    </Box>
  )
}

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

  const canCreateTechnician = useCan(PERMISSIONS.MAINTENANCE_TECHNICIAN_CREATE)
  const canUpdateTechnician = useCan(PERMISSIONS.MAINTENANCE_TECHNICIAN_UPDATE)
  const canDeleteTechnician = useCan(PERMISSIONS.MAINTENANCE_TECHNICIAN_DELETE)

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
        notify.success(
          editingTechnician
            ? 'Técnico actualizado exitosamente.'
            : 'Técnico creado exitosamente.'
        )
        refetch()
      } catch (error: unknown) {
        logger.error('Error saving technician:', error)
        notify.error(
          getApiErrorReason(error) || 'No se pudo guardar el técnico.'
        )
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
      notify.success(
        newStatus === 'active'
          ? 'Técnico reactivado exitosamente.'
          : 'Técnico desactivado exitosamente.'
      )
    } catch (error) {
      logger.error('Error toggling technician status:', error)
      notify.error(
        getApiErrorReason(error) || 'No se pudo cambiar el estado del técnico.'
      )
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
      notify.success('Técnico eliminado exitosamente.')
    } catch (error: unknown) {
      logger.error('Error deleting technician:', error)
      const message = getApiErrorReason(error) || 'Error al eliminar el técnico'
      setDeleteError(message)
      notify.error(message)
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

  // La calificación solo se muestra cuando algún técnico ya tiene una
  const hasRatings = (technicians ?? []).some((tech) => (tech.rating ?? 0) > 0)

  const columns = useMemo<MRT_ColumnDef<MaintenanceTechnician>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Técnico',
        size: 240,
        Cell: ({ row }) => (
          <Box display='flex' alignItems='center' gap={1.5}>
            <Avatar
              sx={{
                bgcolor: brand.main,
                color: brand.onMain,
                fontWeight: 600,
                width: 36,
                height: 36,
                fontSize: 14
              }}
            >
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
        accessorFn: (t) =>
          `${t.specialization ?? ''} ${t.certifications ?? ''}`,
        Cell: ({ row }) => (
          <Box>
            <Chip
              size='small'
              variant='outlined'
              label={row.original.specialization || 'No especificado'}
              sx={{ maxWidth: 200 }}
            />
            {row.original.certifications && (
              <Typography
                variant='caption'
                color='text.secondary'
                display='block'
                sx={{ mt: 0.5 }}
              >
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
            color={
              row.original.status === 'active'
                ? 'primary'
                : row.original.status === 'inactive'
                  ? 'error'
                  : 'warning'
            }
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
            color={row.original.isAvailable ? 'primary' : 'warning'}
          />
        )
      },
      ...(hasRatings ? [ratingColumn] : []),
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
              <Typography
                variant='caption'
                display='block'
                color='text.secondary'
              >
                {row.original.metrics.workloadPercentage}% utilización
              </Typography>
            )}
          </Box>
        )
      }
    ],
    [hasRatings]
  )

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Gestión de Técnicos'
        subtitle='Administración del equipo de mantenimiento'
        icon={<People />}
        actions={
          canCreateTechnician ? (
            <Button
              variant='contained'
              startIcon={<Add />}
              onClick={() => setDialogOpen(true)}
              sx={{
                bgcolor: brand.main,
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: brand.hover }
              }}
            >
              Agregar Técnico
            </Button>
          ) : undefined
        }
      />

      <Grid container spacing={3} mb={3}>
        <Grid item xs={6} md={3}>
          <LmsStatCard
            label='Total Técnicos'
            value={technicians?.length || 0}
            icon={<People />}
            tone='teal'
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <LmsStatCard
            label='Disponibles'
            value={
              technicians?.filter((t) => t.status === 'active' && t.isAvailable)
                .length || 0
            }
            icon={<CheckCircle />}
            tone='green'
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <LmsStatCard
            label='No Disponibles'
            value={
              technicians?.filter(
                (t) => t.status === 'active' && !t.isAvailable
              ).length || 0
            }
            icon={<Work />}
            tone='orange'
          />
        </Grid>
        {hasRatings && (
          <Grid item xs={6} md={3}>
            <LmsStatCard
              label='Calificación Promedio'
              value={
                technicians && technicians.length > 0
                  ? (
                      technicians.reduce((acc, t) => acc + (t.rating || 0), 0) /
                      technicians.length
                    ).toFixed(1)
                  : '0.0'
              }
              icon={<Star />}
              tone='blue'
            />
          </Grid>
        )}
      </Grid>

      {/* Technicians Table */}
      <DataTable<MaintenanceTechnician>
        itemLabel={['técnico', 'técnicos']}
        searchPlaceholder='Buscar técnicos'
        columns={columns}
        data={technicians ?? []}
        state={{ isLoading }}
        getRowId={(row, index) => String(row.id ?? `skeleton-${index}`)}
        initialState={{ density: 'comfortable' }}
        enableRowActions={canUpdateTechnician || canDeleteTechnician}
        renderRowActions={({ row }) => {
          const technician = row.original
          return (
            <Box display='flex' gap={0.5}>
              {canUpdateTechnician && (
                <Tooltip title='Editar'>
                  <IconButton
                    size='small'
                    color='primary'
                    aria-label={`Editar a ${technician.name}`}
                    onClick={() => handleEdit(technician)}
                  >
                    <Edit />
                  </IconButton>
                </Tooltip>
              )}
              {canUpdateTechnician && (
                <Tooltip
                  title={
                    technician.status === 'active' ? 'Desactivar' : 'Reactivar'
                  }
                >
                  <IconButton
                    size='small'
                    aria-label={`${technician.status === 'active' ? 'Desactivar' : 'Reactivar'} a ${technician.name}`}
                    onClick={() => {
                      setTechnicianToToggle(technician)
                      setStatusConfirmDialogOpen(true)
                    }}
                    sx={{
                      color:
                        technician.status === 'active'
                          ? 'warning.main'
                          : brand.main
                    }}
                  >
                    {technician.status === 'active' ? (
                      <PowerSettingsNew />
                    ) : (
                      <RestoreFromTrash />
                    )}
                  </IconButton>
                </Tooltip>
              )}
              {canDeleteTechnician && (
                <Tooltip title='Eliminar'>
                  <IconButton
                    size='small'
                    color='error'
                    aria-label={`Eliminar a ${technician.name}`}
                    onClick={() => {
                      setTechnicianToDelete(technician)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Delete />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )
        }}
        renderEmptyRowsFallback={() => (
          <EmptyState
            compact
            icon={<People />}
            title='No hay técnicos registrados'
            hint='Agrega el primer técnico para poder asignarle tickets.'
          />
        )}
      />

      {/* Add/Edit Technician Dialog */}
      <FormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        title={editingTechnician ? 'Editar técnico' : 'Agregar técnico'}
        subtitle={editingTechnician?.name}
        submitLabel={editingTechnician ? 'Actualizar' : 'Crear'}
        onSubmit={() => formik.handleSubmit()}
        loading={
          createTechnicianMutation.isLoading ||
          updateTechnicianMutation.isLoading
        }
        maxWidth='md'
      >
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
                formik.touched.employeeId && Boolean(formik.errors.employeeId)
              }
              helperText={formik.touched.employeeId && formik.errors.employeeId}
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
                formik.touched.maxWorkload && Boolean(formik.errors.maxWorkload)
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
                formik.touched.certifications && formik.errors.certifications
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
      </FormDialog>

      {/* Status Toggle Confirmation Dialog */}
      <ConfirmDialog
        open={statusConfirmDialogOpen}
        title={
          technicianToToggle?.status === 'active'
            ? 'Desactivar técnico'
            : 'Reactivar técnico'
        }
        message={
          <>
            ¿Seguro que quieres{' '}
            {technicianToToggle?.status === 'active'
              ? 'desactivar'
              : 'reactivar'}{' '}
            a <strong>{technicianToToggle?.name}</strong>?
            {technicianToToggle?.status === 'active' &&
              ' No podrá ser asignado a nuevos tickets.'}
          </>
        }
        confirmLabel={
          technicianToToggle?.status === 'active' ? 'Desactivar' : 'Reactivar'
        }
        tone={technicianToToggle?.status === 'active' ? 'danger' : 'default'}
        loading={updateTechnicianMutation.isLoading}
        onConfirm={handleToggleStatus}
        onClose={() => setStatusConfirmDialogOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title={deleteError ? 'No se puede eliminar' : 'Eliminar técnico'}
        message={
          deleteError ?? (
            <>
              ¿Seguro que quieres eliminar a{' '}
              <strong>{technicianToDelete?.name}</strong>? Esta acción no se
              puede deshacer.
            </>
          )
        }
        confirmLabel={deleteError ? 'Cerrar' : 'Eliminar'}
        tone={deleteError ? 'default' : 'danger'}
        loading={deleteTechnicianMutation.isLoading}
        onConfirm={() => {
          if (deleteError) {
            setDeleteDialogOpen(false)
            setDeleteError(null)
          } else {
            handleDelete()
          }
        }}
        onClose={() => {
          setDeleteDialogOpen(false)
          setDeleteError(null)
        }}
      />
    </Container>
  )
}

export default MaintenanceTechnicians
