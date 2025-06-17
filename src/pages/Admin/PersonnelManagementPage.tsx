// src/pages/Admin/PersonnelManagementPage.tsx
import React, { useState, useMemo } from 'react'
import {
  Container,
  Typography,
  Button,
  Box,
  IconButton,
  Tooltip
} from '@mui/material'
import { Edit, Delete, Add } from '@mui/icons-material'
import MaterialReactTable, { type MRT_ColumnDef } from 'material-react-table'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import Swal from 'sweetalert2'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import PersonnelFormModal from './PersonnelFormModal' // Ajusta la ruta

export interface Personnel {
  id: number | string
  name: string
  position: string
  email?: string
  phone?: string
  isActive: boolean
}

const PersonnelManagementPage: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(
    null
  )

  // Carga de datos con React Query
  const {
    data: personnelList = [],
    isLoading,
    isError,
    error
  } = useQuery<Personnel[], Error>('personnelList', async () => {
    const response = await axiosPrivate.get('/personnel')
    return response.data
  })

  // Mutación para crear/actualizar
  const saveMutation = useMutation(
    (person: Omit<Personnel, 'id'> | Personnel) => {
      if ('id' in person) {
        return axiosPrivate.put(`/personnel/${person.id}`, person) // UPDATE
      }
      return axiosPrivate.post('/personnel', person) // CREATE
    },
    {
      onSuccess: () => {
        Swal.fire(
          '¡Éxito!',
          'Los datos se han guardado correctamente.',
          'success'
        )
        queryClient.invalidateQueries('personnelList') // Refrescar la tabla
        handleCloseModal()
      },
      onError: (err: any) => {
        Swal.fire(
          'Error',
          err.response?.data?.message || 'No se pudo guardar la información.',
          'error'
        )
      }
    }
  )

  // Mutación para eliminar
  const deleteMutation = useMutation(
    (personId: number | string) =>
      axiosPrivate.delete(`/personnel/${personId}`),
    {
      onSuccess: () => {
        Swal.fire('Eliminado', 'La persona ha sido eliminada.', 'success')
        queryClient.invalidateQueries('personnelList')
      },
      onError: (err: any) => {
        Swal.fire(
          'Error',
          err.response?.data?.message || 'No se pudo eliminar a la persona.',
          'error'
        )
      }
    }
  )

  const handleOpenModal = (person?: Personnel | null) => {
    setEditingPersonnel(person || null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingPersonnel(null)
  }

  const handleSave = (data: Omit<Personnel, 'id'> | Personnel) => {
    saveMutation.mutate(data)
  }

  const handleDelete = (personId: number | string) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción es irreversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(personId)
      }
    })
  }

  const columns = useMemo<MRT_ColumnDef<Personnel>[]>(
    () => [
      { accessorKey: 'name', header: 'Nombre Completo', size: 250 },
      { accessorKey: 'position', header: 'Cargo', size: 250 },
      {
        accessorKey: 'isActive',
        header: 'Activo',
        size: 100,
        Cell: ({ cell }) => (cell.getValue<boolean>() ? 'Sí' : 'No')
      }
    ],
    []
  )

  return (
    <Container maxWidth='lg' sx={{ mt: 4, mb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <Typography variant='h4' component='h1'>
          Gestión de Personal
        </Typography>
        <Button
          variant='contained'
          color='primary'
          startIcon={<Add />}
          onClick={() => handleOpenModal()}
        >
          Agregar Persona
        </Button>
      </Box>

      <MaterialReactTable
        columns={columns}
        data={personnelList}
        localization={MRT_Localization_ES}
        enableRowActions
        renderRowActions={({ row }) => (
          <Box sx={{ display: 'flex', gap: '0.5rem' }}>
            <Tooltip title='Editar'>
              <IconButton
                onClick={() => handleOpenModal(row.original)}
                color='primary'
                size='small'
              >
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title='Eliminar'>
              <IconButton
                onClick={() => handleDelete(row.original.id)}
                color='error'
                size='small'
              >
                <Delete />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        initialState={{ density: 'compact' }}
        state={{ isLoading, showAlertBanner: isError }}
        muiToolbarAlertBannerProps={
          isError ? { color: 'error', children: error?.message } : undefined
        }
      />

      {isModalOpen && (
        <PersonnelFormModal
          open={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
          existingPersonnel={editingPersonnel}
          isLoading={saveMutation.isLoading}
        />
      )}
    </Container>
  )
}

export default PersonnelManagementPage
