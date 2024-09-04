import MaterialReactTable, {
  MRT_Cell,
  MRT_ColumnDef,
  MaterialReactTableProps
} from 'material-react-table'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Loader from './Loader2'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField
} from '@mui/material'
import { Delete, Edit } from '@mui/icons-material'
import { bigToast } from './ExcelManipulation/Utils'
import useAxiosPrivate from '@utils/use-axios-private'

export interface TemplateData {
  name: string
  description: string
  password: string
  city: string
  location: string
  sede: string
  activoFijo: string
  serie: string
  solicitante: string
  instrumento: string
  calibrationDate: string
}

export interface TemplatesData extends TemplateData {
  id: number
  created_at: Date
}

const Templates = () => {
  const axiosPrivate = useAxiosPrivate()
  const [tableData, setTableData] = useState<TemplatesData[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const [validationErrors, setValidationErrors] = useState<{
    [cellId: string]: string
  }>({})

  const getCommonEditTextFieldProps = useCallback(
    (
      cell: MRT_Cell<TemplatesData>
    ): MRT_ColumnDef<TemplatesData>['muiTableBodyCellEditTextFieldProps'] => {
      return {
        error: !!validationErrors[cell.id],
        helperText: validationErrors[cell.id],
        onBlur: () => {
          delete validationErrors[cell.id]
          setValidationErrors({
            ...validationErrors
          })
        }
      }
    },
    [validationErrors]
  )

  const handleCancelRowEdits = () => {
    setValidationErrors({})
  }

  const columns = useMemo<MRT_ColumnDef<TemplatesData>[]>(
    () => [
      { accessorKey: 'id', header: 'Id', size: 80 },
      {
        accessorKey: 'name',
        header: 'Nombre',
        size: 100,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        })
      },
      {
        accessorKey: 'description',
        header: 'Descripción',
        size: 100,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        })
      },
      {
        accessorKey: 'city',
        header: 'Ciudad',
        size: 50,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        })
      },
      {
        accessorKey: 'location',
        header: 'Ubicación',
        size: 50,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        })
      },
      {
        accessorKey: 'sede',
        header: 'Sede',
        size: 50,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        })
      },
      {
        accessorKey: 'activoFijo',
        header: 'Activo Fijo',
        size: 50,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        })
      },
      {
        accessorKey: 'serie',
        header: 'Serie',
        size: 50,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        })
      },
      {
        accessorKey: 'solicitante',
        header: 'Solicitante',
        size: 50,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        })
      },
      {
        accessorKey: 'instrumento',
        header: 'Instrumento',
        size: 50,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        })
      },
      {
        accessorKey: 'calibrationDate',
        header: 'Fecha de Calibración',
        size: 50
      }
    ],
    [getCommonEditTextFieldProps]
  )

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const response = await axiosPrivate.get(`/templates`, {})
      if (response.status === 200) {
        setTableData(response.data)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching device data:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const handleCreateNewRow = (values: TemplateData) => {
    onCreateTemplates(values)
    setCreateModalOpen(false)
  }

  const onCreateTemplates = async (templateData: TemplateData) => {
    try {
      const response = await axiosPrivate.post(`/templates`, templateData, {})
      if (response.status >= 200 && response.status < 300) {
        bigToast('Plantilla creada exitosamente!', 'success')
        fetchTemplates()
      } else {
        bigToast('Error al crear plantilla', 'error')
      }
    } catch (error: any) {
      if (error.response.status === 409) {
        bigToast(error.response.data.message, 'error')
      } else {
        bigToast(error.response?.data?.error || 'Error desconocido', 'error')
      }
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const shouldDelete = window.confirm(
        '¿Estás seguro de que deseas eliminar este archivo?'
      )
      if (shouldDelete) {
        const response = await axiosPrivate.delete(`/templates/${id}`, {})
        if (response.status >= 200 && response.status < 300) {
          bigToast('Archivo eliminado exitosamente!', 'success')
          fetchTemplates()
        } else {
          bigToast('Error al eliminar archivo', 'error')
        }
      }
    } catch (error) {
      console.error('Error de red:', error)
    }
  }

  const handleUpdateSubmit: MaterialReactTableProps<TemplatesData>['onEditingRowSave'] =
    async ({ exitEditingMode, row, values }) => {
      if (!Object.keys(validationErrors).length) {
        const updatedValues = { ...values }
        delete updatedValues.id
        try {
          const response = await axiosPrivate.put(
            `/templates/${values.id}`,
            updatedValues,
            {}
          )

          if (response.status === 201) {
            bigToast('Plantilla modificada exitosamente!', 'success')
            tableData[row.index] = values
            setTableData([...tableData])
          } else {
            console.error('Error al modificar la plantilla')
          }
        } catch (error) {
          console.error('Error de red:', error)
        }

        exitEditingMode() //required to exit editing mode and close modal
      }
    }

  return (
    <>
      <Loader loading={loading} />
      <MaterialReactTable
        columns={columns}
        data={tableData}
        localization={MRT_Localization_ES}
        enableRowActions
        editingMode='modal'
        enableEditing
        onEditingRowSave={handleUpdateSubmit}
        onEditingRowCancel={handleCancelRowEdits}
        renderTopToolbarCustomActions={() => (
          <button
            className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
            onClick={() => setCreateModalOpen(true)}
          >
            Crear Nueva Plantilla
          </button>
        )}
        renderRowActions={({ row, table }) => (
          <Box sx={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Button onClick={() => handleDelete(row.original.id)} color='error'>
              <Delete />
            </Button>
            <Button onClick={() => table.setEditingRow(row)} color='inherit'>
              <Edit />
            </Button>
          </Box>
        )}
      />
      <CreateNewTemplatesModal
        columns={columns}
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateNewRow}
      />
    </>
  )
}

interface CreateModalProps {
  columns: MRT_ColumnDef<TemplatesData>[]
  onClose: () => void
  onSubmit: (values: TemplateData) => void
  open: boolean
}

const CreateNewTemplatesModal = ({
  open,
  columns,
  onClose,
  onSubmit
}: CreateModalProps) => {
  const [values, setValues] = useState<any>(() =>
    columns.reduce((acc, column) => {
      acc[column.accessorKey ?? ''] = ''
      return acc
    }, {} as any)
  )

  const handleSubmit = () => {
    const { id, ...objetoSinId } = values
    onSubmit(objetoSinId)
    onClose()
  }

  return (
    <Dialog open={open}>
      <DialogTitle textAlign='center'>Subir Nuevo Archivo</DialogTitle>
      <DialogContent>
        <form onSubmit={(e) => e.preventDefault()}>
          <Stack
            sx={{
              width: '100%',
              minWidth: { xs: '300px', sm: '360px', md: '400px' },
              gap: '1.5rem'
            }}
          >
            {columns.map(
              (column) =>
                column.accessorKey !== 'id' && (
                  <TextField
                    key={column.accessorKey}
                    label={column.header}
                    name={column.accessorKey}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setValues({ ...values, [e.target.name]: e.target.value })
                    }
                  />
                )
            )}
          </Stack>
        </form>
      </DialogContent>
      <DialogActions sx={{ p: '1.25rem' }}>
        <Button
          variant='contained'
          onClick={onClose}
          sx={{ backgroundColor: '#ccc', marginRight: '10px' }}
        >
          Cancelar
        </Button>
        <Button variant='contained' color='primary' onClick={handleSubmit}>
          Subir Archivo
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default Templates
