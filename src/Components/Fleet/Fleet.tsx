import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'

import MaterialReactTable, {
  MRT_Cell,
  MRT_ColumnDef,
  MRT_Row
} from 'material-react-table'
import { MySwal } from '../ExcelManipulation/Utils'
import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Paper,
  IconButton,
  TextFieldProps,
  Tooltip
} from '@mui/material'
import {
  BuildCircle,
  Commute,
  Delete,
  Add,
  DirectionsCar,
  Edit,
  Plumbing,
  Speed,
  Summarize,
  Visibility,
  WarningAmber
} from '@mui/icons-material'

import * as yup from 'yup'

import GenericFormModal from './GenericFormModal'
import { useAddVehicle, useVehicles, vehicleFields } from './vehicleUtils'
import { Link, useNavigate } from 'react-router-dom'
import { Vehicle } from './types'
import { vehicleStore } from '../../store/vehicleStore'
import { useFormik } from 'formik'
import useAxiosPrivate from '@utils/use-axios-private'
import { useStore } from '@nanostores/react'
import { userStore } from 'src/store/userStore'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'

import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import { purchaseTableStyle } from 'src/Components/Purchases/purchaseTableStyle'
import { notify } from 'src/utils/notify'
const validationSchema = yup.object().shape({
  pictureUrl: yup.mixed().required('Imagen es obligatoria'),
  vin: yup.string().required('Número de Identificación es obligatorio'),
  licensePlate: yup
    .string()
    .matches(
      /^[A-Z]{3}-\d{2}[A-Z0-9]$/,
      'El formato debe ser ABC-123 o ABC-12J'
    )
    .required('Número de Identificación es obligatorio'),
  make: yup.string().required('Marca es obligatoria'),
  purchaseDate: yup
    .string()
    .matches(
      /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/,
      'El formato debe ser dd-mm-yyyy'
    )
    .required('Fecha de Compra es obligatoria'),
  model: yup.string().required('Modelo es obligatorio'),
  year: yup
    .number()
    .required('Año es obligatorio')
    .min(1991, 'El año debe ser mayor a 1990'),
  currentMileage: yup
    .number()
    .required('Kilómetros es obligatorio')
    .moreThan(0, 'El kilómetros debe ser mayor a 0'),
  fuelType: yup.string().required('Tipo de Combustible es obligatorio'),
  status: yup.string().required('Estado es obligatorio'),
  transitLicense: yup.string().required('Lincencia de Transito es obligatorio'),
  displacement: yup
    .number()
    .required('Cilindraje es obligatorio')
    .moreThan(0, 'El cilindraje debe ser mayor a 0'),
  color: yup.string().required('Color es obligatorio'),
  serviceType: yup.string().required('Tipo de Servicio es obligatorio'),
  vehicleClass: yup.string().required('Clase es obligatorio'),
  bodyType: yup.string().required('Tipo de Carroceria es obligatorio'),
  capacity: yup
    .number()
    .required('Capacidad es obligatorio')
    .moreThan(0, 'La capacidad debe ser mayor a 0'),
  engineNumber: yup.string().required('Número de Motor es obligatorio'),
  chasisNumber: yup.string().required('Número de Chasis es obligatorio'),
  power: yup
    .number()
    .required('Potencia es obligatorio')
    .moreThan(0, 'La potencia debe ser mayor a 0'),
  declarationImportation: yup
    .string()
    .required('Declaración de Importación es obligatorio'),
  doors: yup
    .number()
    .required('Numero de puertas es obligatorio')
    .moreThan(0, 'Las puertas deben ser mayores a 0'),
  trafficAuthority: yup
    .string()
    .required('Autoridad de Tráfico es obligatorio'),
  importationDate: yup
    .string()
    .matches(
      /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/,
      'El formato debe ser dd-mm-yyyy'
    )
    .required('Fecha de Importación es obligatoria'),
  registrationDate: yup
    .string()
    .matches(
      /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/,
      'El formato debe ser dd-mm-yyyy'
    )
    .required('Fecha de Registro es obligatoria'),
  expeditionDate: yup
    .string()
    .matches(
      /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/,
      'El formato debe ser dd-mm-yyyy'
    )
    .required('Fecha de Expedición es obligatoria')
})

const Fleet = () => {
  const canManage = useCan(PERMISSIONS.FLEET_VEHICLE_MANAGE)
  const axiosPrivate = useAxiosPrivate()
  const $userStore = useStore(userStore)
  const customerId = $userStore.customer?.id || null
  const queryClient = useQueryClient()
  const { data: vehicles = [], refetch } = useVehicles({
    customerId: customerId
  })
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string | undefined
  }>({})
  const navigate = useNavigate()

  const saveRowEdits = useMutation(
    async (updatedVehicle: Vehicle) => {
      const { id, ...values } = updatedVehicle
      const { status } = await axiosPrivate.put(`/vehicles/${id}`, values, {})
      if (status !== 200) {
        throw new Error('Error al modificar la hoja de datos')
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vehicles')
        notify.success('Hoja de Datos Modificada Exitosamente!')
      }
    }
  )

  const deleteVehicle = useMutation(
    async (id: number) => {
      const { status } = await axiosPrivate.delete(`/vehicles/${id}`, {})
      if (status !== 204) {
        throw new Error('Error al eliminar la hoja de datos')
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vehicles')
        notify.success('Hoja de Datos Eliminada Exitosamente!')
      }
    }
  )

  const { mutate: createVehicle } = useAddVehicle()

  const handleSaveRowEdits = useCallback(
    async ({
      exitEditingMode,

      values
    }: {
      exitEditingMode: () => void
      row: MRT_Row<Vehicle>
      values: Vehicle
    }) => {
      try {
        await saveRowEdits.mutateAsync({ ...values, customerId: customerId })
        exitEditingMode()
      } catch (error) {
        console.error('Error al guardar la edición:', error)
      }
    },
    [saveRowEdits]
  )

  const handleDeleteRow = useCallback(
    (row: MRT_Row<Vehicle>) => {
      MySwal.fire({
        title: `¿Está seguro que desea eliminar la hoja de datos ${row.getValue('licensePlate')}?`,
        text: 'No podrá recuperar esta información una vez eliminada',
        showCancelButton: true,
        confirmButtonText: 'Sí'
      }).then((result) => {
        if (result.isConfirmed) {
          deleteVehicle.mutate(row.getValue('id'))
        }
      })
    },
    [deleteVehicle]
  )

  const getCommonEditTextFieldProps = useCallback(
    ({ cell }: { cell: MRT_Cell<Vehicle> }): TextFieldProps => ({
      error: !!validationErrors[cell.id],
      helperText: validationErrors[cell.id],
      onBlur: (event) => {
        const isValid = validateRequired(event.target.value)
        if (!isValid) {
          setValidationErrors({
            ...validationErrors,
            [cell.id]: `${cell.column.columnDef.header} es obligatorio`
          })
        } else {
          const { [cell.id]: _, ...rest } = validationErrors
          setValidationErrors(rest)
        }
      }
    }),
    [validationErrors]
  )

  const validateRequired = useCallback((value: string) => !!value.length, [])

  const columns = useMemo<MRT_ColumnDef<Vehicle>[]>(
    () => [
      { accessorKey: 'id', header: 'ID', size: 10, enableEditing: false },
      {
        accessorKey: 'licensePlate',
        header: 'Número de Identificación',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'make',
        header: 'Marca',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'model',
        header: 'Modelo',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'year',
        header: 'Año',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'currentMileage',
        header: 'Kilómetros',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'fuelType',
        header: 'Tipo de Combustible',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      }
    ],
    [getCommonEditTextFieldProps]
  )

  const handleTrip = (vehicle: Vehicle) => {
    if (vehicle && vehicle.id) {
      vehicleStore.set(vehicle)
      navigate(`${vehicle.id}/trip`)
    } else {
      notify.error('No se ha seleccionado un vehículo')
    }
  }

  const formik = useFormik<Vehicle>({
    initialValues: {
      pictureUrl: null,
      purchaseDate: '',
      vin: '',
      licensePlate: '',
      make: '',
      model: '',
      year: 0,
      currentMileage: 0,
      fuelType: '',
      status: '',
      upcomingReminders: [],
      transitLicense: '',
      displacement: 0,
      color: '',
      serviceType: '',
      vehicleClass: '',
      bodyType: '',
      capacity: 0,
      engineNumber: '',
      chasisNumber: '',
      power: 0,
      declarationImportation: '',
      doors: 0,
      trafficAuthority: '',
      importationDate: '',
      registrationDate: '',
      expeditionDate: '',
      customerId: customerId
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        await createVehicle(
          { ...values, customerId: customerId },
          {
            onSuccess: () => {
              queryClient.invalidateQueries('vehicles')
              notify.success('Vehículo Creado Exitosamente!')
              setCreateModalOpen(false)
              refetch()
            },
            onError: (error) => {
              console.error('Error al crear el vehículo:', error)
              notify.error('Error al crear el vehículo')
            }
          }
        )
        resetForm()
      } catch (error) {
        console.error('Error al crear el vehículo:', error)
      }
    }
  })

  const remindersCount = vehicles.filter((v: Vehicle) => v.upcomingReminders?.length > 0).length
  const avgMileage = vehicles.length
    ? Math.round(vehicles.reduce((acc: number, v: Vehicle) => acc + (Number(v.currentMileage) || 0), 0) / vehicles.length)
    : 0

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Flota'
        subtitle='Vehículos, documentos, viajes, inspecciones y mantenimiento'
        icon={<DirectionsCar />}
        actions={
          <>
            <Button variant='outlined' startIcon={<Plumbing />} onClick={() => navigate('/fleet/interventions')} sx={{ color: '#00897B', borderColor: '#00BFA5', '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' } }}>
              Tipos de intervención
            </Button>
            {canManage && (
              <Button variant='contained' startIcon={<Add />} onClick={() => setCreateModalOpen(true)} sx={{ bgcolor: '#00BFA5', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#00ACC1' } }}>
                Crear vehículo
              </Button>
            )}
          </>
        }
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <LmsStatCard label='Vehículos' value={vehicles.length} icon={<DirectionsCar />} tone='teal' />
        </Grid>
        <Grid item xs={12} sm={4}>
          <LmsStatCard
            label='Con documentos por vencer'
            value={remindersCount}
            icon={<WarningAmber />}
            tone={remindersCount > 0 ? 'red' : 'green'}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <LmsStatCard
            label='Kilometraje promedio'
            value={`${avgMileage.toLocaleString('es-CO')} km`}
            icon={<Speed />}
            tone='blue'
            compact
          />
        </Grid>
      </Grid>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <MaterialReactTable
          {...purchaseTableStyle}
          columns={columns}
          data={vehicles}
          enableColumnOrdering
          editingMode='modal'
          enableEditing={canManage}
          onEditingRowSave={handleSaveRowEdits}
          onEditingRowCancel={() => setValidationErrors({})}
          enablePinning
          initialState={{ columnVisibility: { id: false }, columnPinning: { right: ['mrt-row-actions'] } }}
        renderRowActions={({ row, table }) => (
          <Box sx={{ display: 'flex', gap: '1rem' }}>
            <Tooltip arrow placement='right' title='Documentos'>
              <Link to={`${row.original.id}/documents`}>
                <IconButton>
                  <Visibility
                    sx={{
                      color:
                        row.original.upcomingReminders.length > 0 ? '#ef4444' : '#00BFA5'
                    }}
                  />
                </IconButton>
              </Link>
            </Tooltip>
            <Tooltip arrow placement='right' title='Viajes'>
              <Link to={`${row.original.id}/trip`}>
                <IconButton onClick={() => handleTrip(row.original)}>
                  <Commute />
                </IconButton>
              </Link>
            </Tooltip>
            <Tooltip arrow placement='right' title='Inspecciones'>
              <Link to={`${row.original.id}/inspections`}>
                <IconButton onClick={() => handleTrip(row.original)}>
                  <Summarize />
                </IconButton>
              </Link>
            </Tooltip>
            <Tooltip arrow placement='right' title='Intervenciones'>
              <Link to={`${row.original.id}/interventions`}>
                <IconButton>
                  <BuildCircle />
                </IconButton>
              </Link>
            </Tooltip>
  {canManage && (
  <>
            <Divider orientation='vertical' flexItem />
            <Tooltip arrow placement='right' title='Editar'>
              <IconButton color='primary' onClick={() => table.setEditingRow(row)}>
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip arrow placement='right' title='Eliminar'>
              <IconButton color='error' onClick={() => handleDeleteRow(row)}>
                <Delete />
              </IconButton>
            </Tooltip>
  </>
  )}
          </Box>
        )}
        />
      </Paper>

      <GenericFormModal
        open={createModalOpen}
        fields={vehicleFields}
        onClose={() => {
          setCreateModalOpen(false)
          formik.resetForm()
        }}
        submitButtonText='Crear Vehículo'
        formik={formik}
      />
    </Container>
  )
}

export default Fleet
