// src/pages/Admin/PersonnelManagementPage.tsx
import React, { useState, useMemo } from 'react'
import {
  Container,
  Button,
  Box,
  Grid,
  IconButton,
  Paper,
  Tooltip
} from '@mui/material'
import { Edit, Delete, Add, ArrowBack, Badge, CheckCircle, PersonOff } from '@mui/icons-material'
import MaterialReactTable, { type MRT_ColumnDef } from 'material-react-table'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import { purchaseTableStyle } from 'src/Components/Purchases/purchaseTableStyle'
import Swal from 'sweetalert2'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import PersonnelFormModal from './PersonnelFormModal' // Ajusta la ruta
import { useNavigate } from 'react-router-dom'

export interface Personnel {
  id: number | string
  name: string
  position: string
  email?: string
  phone?: string
  isActive: boolean
}

const PersonnelManagementPage: React.FC = () => {
  const navigate = useNavigate()
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
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/purchases/requests')}
        sx={{ mb: 1, color: 'text.secondary', textTransform: 'none', fontWeight: 600 }}
      >
        Volver
      </Button>

      <LmsPageHeader
        title='Gestión de Personal'
        subtitle='Personas que firman y aprueban los documentos de compras'
        icon={<Badge />}
        actions={
          <Button variant='contained' startIcon={<Add />} onClick={() => handleOpenModal()} sx={{ bgcolor: '#00BFA5', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#00ACC1' } }}>
            Agregar persona
          </Button>
        }
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <LmsStatCard label='Personal' value={personnelList.length} icon={<Badge />} tone='teal' />
        </Grid>
        <Grid item xs={12} sm={4}>
          <LmsStatCard label='Activos' value={personnelList.filter((p) => p.isActive).length} icon={<CheckCircle />} tone='green' />
        </Grid>
        <Grid item xs={12} sm={4}>
          <LmsStatCard label='Inactivos' value={personnelList.filter((p) => !p.isActive).length} icon={<PersonOff />} tone='orange' />
        </Grid>
      </Grid>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <MaterialReactTable
          {...purchaseTableStyle}
          columns={columns}
          data={personnelList}
          enableRowActions
          enablePinning
          renderRowActions={({ row }) => (
            <Box sx={{ display: 'flex', gap: '0.5rem' }}>
              <Tooltip title='Editar'>
                <IconButton onClick={() => handleOpenModal(row.original)} color='primary' size='small'>
                  <Edit />
                </IconButton>
              </Tooltip>
              <Tooltip title='Eliminar'>
                <IconButton onClick={() => handleDelete(row.original.id)} color='error' size='small'>
                  <Delete />
                </IconButton>
              </Tooltip>
            </Box>
          )}
          initialState={{ density: 'compact', columnPinning: { right: ['mrt-row-actions'] } }}
          state={{ isLoading, showAlertBanner: isError }}
          muiToolbarAlertBannerProps={
            isError ? { color: 'error', children: error?.message } : undefined
          }
        />
      </Paper>

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
