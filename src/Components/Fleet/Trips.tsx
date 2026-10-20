import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'

import MaterialReactTable, {
  MRT_Cell,
  MRT_ColumnDef,
  MRT_Row
} from 'material-react-table'
import { bigToast, MySwal } from '../ExcelManipulation/Utils'
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  TextFieldProps,
  Tooltip,
  Typography
} from '@mui/material'
import { ArrowBack, Delete } from '@mui/icons-material'
import { MRT_Localization_ES } from 'material-react-table/locales/es'

import { useNavigate, useParams } from 'react-router-dom'

import { Trip } from './types'
import { format } from 'date-fns'
import { vehicleStore } from '../../store/vehicleStore'
import { useStore } from '@nanostores/react'
import useAxiosPrivate from '@utils/use-axios-private'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import {
  TRIP_SORTABLE_FIELDS,
  useLastTrip,
  useTripsPaginated
} from 'src/hooks/fleet/useTrips'
import {
  useKeepPageInRange,
  useServerTableState
} from 'src/hooks/useServerTable'

// Tipos e interfaces para los datos de Trip

const TripsTable = () => {
  const canManage = useCan(PERMISSIONS.FLEET_TRIP_MANAGE)
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  const $vehicleStore = useStore(vehicleStore)

  const { id } = useParams<{ id: string }>()
  // Paginación, búsqueda (conductor, propósito) y orden en el servidor.
  const server = useServerTableState({ sortableFields: TRIP_SORTABLE_FIELDS })
  const {
    data: tripsPage,
    isLoading,
    isFetching
  } = useTripsPaginated(id, server.params)
  useKeepPageInRange(
    tripsPage?.totalPages,
    server.pagination.pageIndex,
    server.setPagination
  )
  const { data: lastTrip = null } = useLastTrip(id)
  const trips = tripsPage?.items ?? []

  const navigate = useNavigate()

  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string | undefined
  }>({})

  const saveRowEdits = useMutation(
    async (updatedTrip: Trip) => {
      const { id, ...values } = updatedTrip
      const { status } = await axiosPrivate.put(`/trip/${id}`, values, {})
      if (status !== 200) {
        throw new Error('Error al modificar el viaje')
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('trips')
        bigToast('Viaje Modificado Exitosamente!', 'success')
      }
    }
  )

  const deleteTrip = useMutation(
    async (id: number) => {
      const { status } = await axiosPrivate.delete(`/trip/${id}`, {})
      if (status !== 204) {
        throw new Error('Error al eliminar el viaje')
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('trips')
        bigToast('Viaje Eliminado Exitosamente!', 'success')
      }
    }
  )

  const handleSaveRowEdits = useCallback(
    async ({
      exitEditingMode,

      values
    }: {
      exitEditingMode: () => void
      row: MRT_Row<Trip>
      values: Trip
    }) => {
      try {
        await saveRowEdits.mutateAsync(values)
        exitEditingMode()
      } catch (error) {
        console.error('Error al guardar la edición:', error)
      }
    },
    [saveRowEdits]
  )

  const handleDeleteRow = useCallback(
    (row: MRT_Row<Trip>) => {
      MySwal.fire({
        title: `¿Está seguro que desea eliminar el viaje?`,
        text: 'No podrá recuperar esta información una vez eliminada',
        showCancelButton: true,
        confirmButtonText: 'Sí'
      }).then((result) => {
        if (result.isConfirmed) {
          deleteTrip.mutate(row.getValue('id'))
        }
      })
    },
    [deleteTrip]
  )

  const getCommonEditTextFieldProps = useCallback(
    ({ cell }: { cell: MRT_Cell<Trip> }): TextFieldProps => ({
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

  const columns = useMemo<MRT_ColumnDef<Trip>[]>(
    () => [
      { accessorKey: 'id', header: 'ID', size: 10, enableEditing: false },
      {
        accessorKey: 'vehicleId',
        header: 'ID Vehículo',
        size: 150,
        enableSorting: false,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'startMileage',
        header: 'Kilometraje Inicial',
        size: 150,
        Cell: ({ row }: { row: { getValue: (key: string) => number } }) =>
          row.getValue('startMileage').toLocaleString('en-US'),
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'endMileage',
        header: 'Kilometraje Final',
        size: 150,
        enableSorting: false,
        Cell: ({
          row
        }: {
          row: { getValue: (key: string) => number | undefined | null }
        }) => {
          const endMileage = row.getValue('endMileage')
          return endMileage != null ? endMileage.toLocaleString('en-US') : 'N/A'
        },
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },

      {
        accessorKey: 'startDate',
        header: 'Fecha de Inicio',
        size: 150,
        Cell: ({ row }) =>
          format(new Date(row.getValue('startDate')), 'yyyy-MM-dd'),
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'endDate',
        header: 'Fecha de Finalización',
        size: 150,
        Cell: ({ row }) =>
          format(new Date(row.getValue('endDate')), 'yyyy-MM-dd'),
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      },
      {
        accessorKey: 'driver',
        header: 'Conductor',
        size: 150,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
      }
    ],
    [getCommonEditTextFieldProps]
  )

  // Función para manejar la creación de un nuevo viaje
  const handleCreateTrip = () => {
    navigate(`new`, { state: { lastTrip: { ...lastTrip, vehicleId: id } } })
  }

  const formattedStartDate = lastTrip?.startDate
    ? format(new Date(lastTrip.startDate), 'yyyy-MM-dd')
    : 'No Start Date'

  return (
    <>
      <IconButton onClick={() => navigate('/fleet')} sx={{ mr: 2 }}>
        <ArrowBack />
      </IconButton>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column', // Cambiado a columna para apilar los elementos verticalmente
          alignItems: 'center',
          mt: 2,
          mb: 2
        }}
      >
        <Typography variant='h4' gutterBottom>
          {`${$vehicleStore?.make} ${$vehicleStore?.model}`}
        </Typography>

        <Box
          sx={{
            width: '200px',
            height: 'auto',
            backgroundColor: 'yellow',
            border: '2px solid black',
            borderRadius: 1,
            textAlign: 'center',
            mt: 1 // Añadido margen superior para separar la placa del nombre
          }}
        >
          <Typography variant='h4' sx={{ fontWeight: 'bold', marginY: 1 }}>
            {$vehicleStore?.licensePlate}
          </Typography>

          <Typography
            variant='h6'
            sx={{ fontWeight: 'bold', fontFamily: 'Orbitron, monospace' }}
          >
            {$vehicleStore?.currentMileage.toLocaleString('es-CO', {
              style: 'unit',
              unit: 'kilometer'
            })}{' '}
          </Typography>
        </Box>
      </Box>

      {!lastTrip?.endDate && lastTrip?.startDate && (
        <Card sx={{ maxWidth: 345, mb: 2, margin: '50px auto' }}>
          <CardContent>
            <Box
              sx={{
                backgroundColor: 'red',
                color: 'white',
                padding: 1,
                borderRadius: 1,
                mb: 2,
                textAlign: 'center'
              }}
            >
              <Typography variant='h6' gutterBottom>
                Carro en Uso
              </Typography>
            </Box>
            <Typography variant='body1' color='textSecondary'>
              <strong>Fecha de Viaje:</strong> {formattedStartDate}
            </Typography>
            <Typography variant='body1' color='textSecondary'>
              <strong>Kilometros Iniciales:</strong>{' '}
              {lastTrip?.startMileage.toLocaleString('en-US', {
                minimumFractionDigits: 0
              })}
            </Typography>
            <Typography variant='body1' color='textSecondary'>
              <strong>Conductor:</strong> {lastTrip?.driver}
            </Typography>
            <Typography variant='body1' color='textSecondary'>
              <strong>Proposito del viaje:</strong> {lastTrip?.purpose}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mt: 2
              }}
            >
{canManage && (
              <Button
                variant='contained'
                onClick={handleCreateTrip}
                sx={{
                  fontWeight: 'bold',
                  color: '#DCFCE7'
                }}
              >
                Terminar Viaje
              </Button>
)}
            </Box>
          </CardContent>
        </Card>
      )}
      <MaterialReactTable
        columns={columns}
        data={trips}
        localization={MRT_Localization_ES}
        {...server.tableProps}
        // El endpoint no tiene filtros exactos por estas columnas.
        enableColumnFilters={false}
        rowCount={tripsPage?.totalItems ?? 0}
        state={{
          ...server.tableState,
          isLoading,
          showProgressBars: isFetching && !isLoading
        }}
        enableColumnOrdering
        editingMode='modal'
        enableEditing={canManage}
        onEditingRowSave={handleSaveRowEdits}
        onEditingRowCancel={() => setValidationErrors({})}
        initialState={{ columnVisibility: { id: false, vehicleId: false } }}
        renderRowActions={({ row }) => (
          <Box sx={{ display: 'flex', gap: '1rem' }}>
            {/* <Tooltip arrow placement='right' title='Inspección'>
              <Link to={`/trips/${row.original.id}/inspection`}>
                <IconButton>
                  <TripOrigin />
                </IconButton>
              </Link>
            </Tooltip> */}
            {/* <Tooltip arrow placement='right' title='Editar'>
              <IconButton onClick={() => table.setEditingRow(row)}>
                <Edit />
              </IconButton>
            </Tooltip> */}
{canManage && (
            <Tooltip arrow placement='right' title='Eliminar'>
              <IconButton color='error' onClick={() => handleDeleteRow(row)}>
                <Delete />
              </IconButton>
            </Tooltip>
)}
          </Box>
        )}
        renderTopToolbarCustomActions={() =>
          !canManage || (!lastTrip?.endDate && lastTrip?.startDate) ? null : (
            <Button
              variant='contained'
              onClick={handleCreateTrip}
              sx={{ fontWeight: 'bold', color: '#DCFCE7' }}
            >
              Crear Nuevo Viaje
            </Button>
          )
        }
      />
    </>
  )
}

export default TripsTable
