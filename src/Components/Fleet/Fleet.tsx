import React, { useCallback, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import MaterialReactTable, {
  MRT_Cell,
  MRT_ColumnDef,
  MRT_Row
} from 'material-react-table'
import { bigToast, MySwal } from '../ExcelManipulation/Utils'
import {
  Box,
  Button,
  Divider,
  IconButton,
  TextFieldProps,
  Tooltip
} from '@mui/material'
import {
  BuildCircle,
  Commute,
  Delete,
  Edit,
  Summarize,
  TripOrigin,
  Visibility
} from '@mui/icons-material'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import { api } from '../../config'

import GenericFormModal from './GenericFormModal'
import { fetchVehicles, vehicleFields } from './vehicleUtils'
import { Link, useNavigate } from 'react-router-dom'
import { Vehicle } from './types'
import { vehicleStore } from '../../store/vehicleStore'

const apiUrl = api()

const Fleet = () => {
  const queryClient = useQueryClient()
  const { data: vehicles = [] } = useQuery('vehicles', fetchVehicles)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string | undefined
  }>({})
  const navigate = useNavigate()

  const saveRowEdits = useMutation(
    async (updatedVehicle: Vehicle) => {
      const { id, ...values } = updatedVehicle
      const { status } = await axios.put(`${apiUrl}/vehicles/${id}`, values, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      })
      if (status !== 200) {
        throw new Error('Error al modificar la hoja de datos')
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vehicles')
        bigToast('Hoja de Datos Modificada Exitosamente!', 'success')
      }
    }
  )

  const deleteVehicle = useMutation(
    async (id: number) => {
      const { status } = await axios.delete(`${apiUrl}/vehicles/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      })
      if (status !== 204) {
        throw new Error('Error al eliminar la hoja de datos')
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vehicles')
        bigToast('Hoja de Datos Eliminada Exitosamente!', 'success')
      }
    }
  )

  const handleSaveRowEdits = useCallback(
    async ({
      exitEditingMode,
      row,
      values
    }: {
      exitEditingMode: () => void
      row: MRT_Row<Vehicle>
      values: Vehicle
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
      bigToast('No se ha seleccionado un vehículo', 'error')
    }
  }

  return (
    <MaterialReactTable
      columns={columns}
      data={vehicles}
      localization={MRT_Localization_ES}
      enableColumnOrdering
      editingMode='modal'
      enableEditing
      onEditingRowSave={handleSaveRowEdits}
      onEditingRowCancel={() => setValidationErrors({})}
      initialState={{ columnVisibility: { id: false } }}
      renderRowActions={({ row, table }) => (
        <Box sx={{ display: 'flex', gap: '1rem' }}>
          <Tooltip arrow placement='right' title='Documentos'>
            <Link to={`${row.original.id}/documents`}>
              <IconButton>
                <Visibility
                  sx={{
                    color:
                      row.original.upcomingReminders.length > 0 ? 'red' : ''
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
          <Divider orientation='vertical' flexItem />
          <Tooltip arrow placement='right' title='Editar'>
            <IconButton onClick={() => table.setEditingRow(row)}>
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip arrow placement='right' title='Eliminar'>
            <IconButton color='error' onClick={() => handleDeleteRow(row)}>
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>
      )}
      renderTopToolbarCustomActions={() => (
        <>
          <Button
            variant='contained'
            onClick={() => setCreateModalOpen(true)}
            sx={{ fontWeight: 'bold', color: '#DCFCE7' }}
          >
            Crear Nuevo Vehículo
          </Button>
          <GenericFormModal
            open={createModalOpen}
            fields={vehicleFields}
            onClose={() => setCreateModalOpen(false)}
            onSubmit={async (values: Record<string, any>) => {
              const vehicle: Vehicle = {
                licensePlate: values['licensePlate'],
                make: values['make'],
                model: values['model'],
                year: Number(values['year']),
                currentMileage: Number(values['currentMileage']),
                fuelType: values['fuelType'],
                status: values['status'],
                upcomingReminders: values['upcomingReminders']
              }
              try {
                await axios.post(`${apiUrl}/vehicles`, vehicle, {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`
                  }
                })
                queryClient.invalidateQueries('vehicles')
                setCreateModalOpen(false)
              } catch (error) {
                console.error('Error al crear el vehículo:', error)
              }
            }}
            submitButtonText='Crear Vehículo'
          />
        </>
      )}
    />
  )
}

export default Fleet
