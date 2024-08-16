import axios from 'axios'
import React, { useCallback, useMemo, useState } from 'react'
import { api } from '../../config'
import MaterialReactTable, {
  MaterialReactTableProps,
  MRT_Cell,
  MRT_ColumnDef,
  MRT_Row
} from 'material-react-table'
import { bigToast, MySwal } from '../ExcelManipulation/Utils'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  TextFieldProps,
  Tooltip
} from '@mui/material'
import { Delete, Edit } from '@mui/icons-material'
import { MRT_Localization_ES } from 'material-react-table/locales/es'

const apiUrl = api()

export interface Vehicle {
  id?: number
  licensePlate: string
  make: string
  model: string
  year: number
  currentMileage: number
  fuelType: string
  status: string
}

const Fleet = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{
    [cellId: string]: string
  }>({})

  const fetchVehicles = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}/vehicles`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      })
      if (response.status === 200) {
        setVehicles(response.data)
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    }
  }, [])

  React.useEffect(() => {
    fetchVehicles()
  }, [fetchVehicles])

  const handleSaveRowEdits: MaterialReactTableProps<Vehicle>['onEditingRowSave'] =
    async ({ exitEditingMode, row, values }) => {
      if (!Object.keys(validationErrors).length) {
        try {
          const { id, ...updatedValues } = values
          const response = await axios.put(
            `${apiUrl}/vehicles/${id}`,
            updatedValues,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`
              }
            }
          )

          if (response.status === 200) {
            bigToast('Hoja de Datos Modificada Exitosamente!', 'success')
            const updatedVehicles = [...vehicles]
            updatedVehicles[row.index] = values
            setVehicles(updatedVehicles)
          } else {
            console.error('Error al modificar la hoja de datos')
          }
        } catch (error) {
          console.error('Error de red:', error)
        }
        exitEditingMode()
      }
    }

  const handleCancelRowEdits = useCallback(() => {
    setValidationErrors({})
  }, [])

  const deleteVehicle = useCallback(
    async (rowIndex: number, id: number) => {
      try {
        const response = await axios.delete(`${apiUrl}/vehicles/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        })

        if (response.status === 204) {
          bigToast('Hoja de Datos Eliminada Exitosamente!', 'success')
          const updatedVehicles = vehicles.filter(
            (_, index) => index !== rowIndex
          )
          setVehicles(updatedVehicles)
        } else {
          console.error('Error al eliminar la hoja de datos')
        }
      } catch (error) {
        console.error('Error de red:', error)
      }
    },
    [vehicles]
  )

  const handleDeleteRow = useCallback(
    (row: MRT_Row<Vehicle>) => {
      MySwal.fire({
        title: `¿Está seguro que desea eliminar la hoja de datos ${row.getValue(
          'licensePlate'
        )}?`,
        text: 'No podrá recuperar esta información una vez eliminada',
        showCancelButton: true,
        confirmButtonText: 'Sí'
      }).then((result) => {
        if (result.isConfirmed) {
          deleteVehicle(row.index, row.getValue('id'))
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
      {
        accessorKey: 'id',
        header: 'ID',
        size: 10,
        enableEditing: false
      },
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

  return (
    <MaterialReactTable
      columns={columns}
      data={vehicles}
      localization={MRT_Localization_ES}
      enableColumnOrdering
      editingMode='modal'
      enableEditing
      onEditingRowSave={handleSaveRowEdits}
      onEditingRowCancel={handleCancelRowEdits}
      initialState={{
        columnVisibility: {
          id: false
        }
      }}
      renderRowActions={({ row, table }) => (
        <Box sx={{ display: 'flex', gap: '1rem' }}>
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
            sx={{
              fontWeight: 'bold',
              color: '#DCFCE7'
            }}
          >
            Crear Nuevo Vehículo
          </Button>
          <CreateNewVehicleModal
            columns={columns}
            open={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onSubmit={(newVehicle) => {
              // Lógica para manejar la creación de un nuevo vehículo
              setVehicles([...vehicles, newVehicle])
            }}
          />
        </>
      )}
    />
  )
}

interface CreateModalProps {
  columns: MRT_ColumnDef<Vehicle>[]
  onClose: () => void
  onSubmit: (values: Vehicle) => void
  open: boolean
}

const CreateNewVehicleModal: React.FC<CreateModalProps> = ({
  open,
  columns,
  onClose,
  onSubmit
}) => {
  const initialValues = useMemo(
    () =>
      columns.reduce(
        (acc, column) => ({
          ...acc,
          [column.accessorKey || '']: ''
        }),
        {}
      ),
    [columns]
  )

  const [values, setValues] = useState<typeof initialValues>(initialValues)

  const handleSubmit = () => {
    onSubmit(values as Vehicle)
    onClose()
  }

  return (
    <Dialog open={open}>
      <DialogTitle textAlign='center'>Crear Nuevo Vehículo</DialogTitle>
      <DialogContent>
        <form onSubmit={(e) => e.preventDefault()}>
          <Stack sx={{ gap: '1.5rem', width: '100%', minWidth: '300px' }}>
            {columns.map((column) => (
              <TextField
                key={column.accessorKey}
                label={column.header}
                name={column.accessorKey}
                onChange={(e) =>
                  setValues({ ...values, [e.target.name]: e.target.value })
                }
              />
            ))}
          </Stack>
        </form>
      </DialogContent>
      <DialogActions sx={{ p: '1.25rem' }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button color='secondary' onClick={handleSubmit} variant='contained'>
          Crear Nuevo Vehículo
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default Fleet
