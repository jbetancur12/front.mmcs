import axios from 'axios'

import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table'
import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../config'
import toast, { Toaster } from 'react-hot-toast'
import Loader from './Loader2'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
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
import { Delete } from '@mui/icons-material'
import { bigToast } from './ExcelManipulation/Utils'

export interface TemplateData {
  name: string
  description: string
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

const apiUrl = api()

const Templates = () => {
  const [tableData, setTableData] = useState<TemplatesData[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const columns = useMemo<MRT_ColumnDef<TemplatesData>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'Id',
        size: 80
      },
      {
        accessorKey: 'name',
        header: 'Nombre',
        size: 100
      },
      {
        accessorKey: 'description',
        header: 'Descripción',
        size: 100
      },

      {
        accessorKey: 'city',
        header: 'Ciuadad',
        size: 50
      },
      {
        accessorKey: 'location',
        header: 'Ubicación',
        size: 50
      },
      {
        accessorKey: 'sede',
        header: 'Sede',
        size: 50
      },
      {
        accessorKey: 'activoFijo',
        header: 'Activo Fijo',
        size: 50
      },
      {
        accessorKey: 'serie',
        header: 'Serie',
        size: 50
      },
      {
        accessorKey: 'solicitante',
        header: 'Solicitante',
        size: 50
      },
      {
        accessorKey: 'instrumento',
        header: 'Instrumento',
        size: 50
      },
      {
        accessorKey: 'calibrationDate',
        header: 'Fecha de Calibración',
        size: 50
      }
    ],
    [] // No hay dependencias específicas aquí
  )

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${apiUrl}/templates`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (response.statusText === 'OK') {
        // @ts-ignore: Ignorar el error en esta línea
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

  const onCreateTemplates = async (repostoryData: TemplateData) => {
    try {
      const response = await axios.post(`${apiUrl}/templates`, repostoryData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (response.status >= 200 && response.status < 300) {
        bigToast('Plantilla creada Exitosamente!', 'success')
        fetchTemplates()
      } else {
        bigToast('Error al crear plantilla', 'error')
      }
    } catch (error: any) {
      bigToast(error.response.data.error, 'error')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const shouldDelete = window.confirm(
        '¿Estás seguro de que deseas eliminar este archivo?'
      )

      if (shouldDelete) {
        const response = await axios.delete(`${apiUrl}/templates/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        })

        if (response.status >= 200 && response.status < 300) {
          toast.success('Archivo eliminado Exitosamente!', {
            duration: 4000,
            position: 'top-center'
          })
          fetchTemplates()
        } else {
          toast.error('Error al eliminar archivo', {
            duration: 4000,
            position: 'top-center'
          })
        }
      }
    } catch (error) {
      console.error('Error de red:', error)
    }
  }

  return (
    <>
      <Toaster />
      <Loader loading={loading} />
      <MaterialReactTable
        columns={columns}
        data={tableData}
        localization={MRT_Localization_ES}
        enableRowActions={true}
        renderTopToolbarCustomActions={() => (
          <button
            className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded '
            onClick={() => setCreateModalOpen(true)}
          >
            Crear Nueva Plantilla
          </button>
        )}
        renderRowActions={({ row }) => {
          return (
            <Box
              sx={{
                display: 'flex',
                gap: '1rem',
                // width: 20,
                justifyContent: 'center'
              }}
            >
              <Button onClick={() => handleDelete(row.original.id)}>
                <Delete />
              </Button>
            </Box>
          )
        }}
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

export const CreateNewTemplatesModal = ({
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

    //@ts-ignore
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
            {columns.map((column) => (
              <React.Fragment key={column.accessorKey}>
                {column.accessorKey !== 'id' && (
                  <TextField
                    label={column.header}
                    name={column.accessorKey}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setValues({
                        ...values,
                        [e.target.name]: e.target.value
                      })
                    }
                  />
                )}
              </React.Fragment>
            ))}
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
