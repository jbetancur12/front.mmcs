// src/pages/Admin/PersonnelManagementPage.tsx
import React, { useState, useMemo } from 'react'
import {
  Container,
  Button,
  Box,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material'
import {
  Edit,
  Delete,
  Add,
  ArrowBack,
  Badge,
  CheckCircle,
  PersonOff
} from '@mui/icons-material'
import { type MRT_Cell, type MRT_ColumnDef } from 'material-react-table'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import DataTable from 'src/Components/Common/DataTable'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import PersonnelFormModal from './PersonnelFormModal' // Ajusta la ruta
import { useNavigate } from 'react-router-dom'
import { notify } from 'src/utils/notify'
import { confirmDialog } from 'src/utils/confirm'

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

  const [activeFilter, setActiveFilter] = useState<
    'active' | 'inactive' | null
  >(null)
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
        notify.success('¡Éxito!', 'Los datos se han guardado correctamente.')
        queryClient.invalidateQueries('personnelList') // Refrescar la tabla
        handleCloseModal()
      },
      onError: (err: any) => {
        notify.error(
          'Error',
          err.response?.data?.message || 'No se pudo guardar la información.'
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
        notify.success('Eliminado', 'La persona ha sido eliminada.')
        queryClient.invalidateQueries('personnelList')
      },
      onError: (err: any) => {
        notify.error(
          'Error',
          err.response?.data?.message || 'No se pudo eliminar a la persona.'
        )
      }
    }
  )

  const toggleFilter = (value: 'active' | 'inactive') =>
    setActiveFilter((current) => (current === value ? null : value))
  const visiblePersonnel = activeFilter
    ? personnelList.filter((p) => p.isActive === (activeFilter === 'active'))
    : personnelList

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
    confirmDialog({
      title: '¿Estás seguro?',
      text: 'Esta acción es irreversible.',
      confirmLabel: 'Sí, eliminar',
      tone: 'danger'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(personId)
      }
    })
  }

  const columns = useMemo<MRT_ColumnDef<Personnel>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nombre',
        size: 260,
        Cell: ({ cell }: { cell: MRT_Cell<Personnel> }) => (
          <Typography variant='body2' fontWeight={600}>
            {cell.getValue<string>()}
          </Typography>
        )
      },
      { accessorKey: 'position', header: 'Cargo', size: 260 },
      {
        accessorKey: 'isActive',
        header: 'Estado',
        size: 120,
        Cell: ({ cell }: { cell: MRT_Cell<Personnel> }) =>
          cell.getValue<boolean>() ? (
            <Chip
              label='Activo'
              color='success'
              size='small'
              variant='outlined'
            />
          ) : (
            <Chip label='Inactivo' size='small' variant='outlined' />
          )
      }
    ],
    []
  )

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/purchases/requests')}
        sx={{
          mb: 1,
          color: 'text.secondary',
          textTransform: 'none',
          fontWeight: 600
        }}
      >
        Volver
      </Button>

      <LmsPageHeader
        title='Gestión de Personal'
        subtitle='Personas que firman y aprueban los documentos de compras'
        icon={<Badge />}
        actions={
          <Button
            variant='contained'
            startIcon={<Add />}
            onClick={() => handleOpenModal()}
            sx={{
              bgcolor: '#00BFA5',
              whiteSpace: 'nowrap',
              '&:hover': { bgcolor: '#00ACC1' }
            }}
          >
            Agregar persona
          </Button>
        }
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <LmsStatCard
            variant='quiet'
            label='Activos'
            value={personnelList.filter((p) => p.isActive).length}
            icon={<CheckCircle />}
            tone='green'
            active={activeFilter === 'active'}
            onClick={() => toggleFilter('active')}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <LmsStatCard
            variant='quiet'
            label='Inactivos'
            value={personnelList.filter((p) => !p.isActive).length}
            icon={<PersonOff />}
            tone='orange'
            active={activeFilter === 'inactive'}
            onClick={() => toggleFilter('inactive')}
          />
        </Grid>
      </Grid>

      <DataTable
        columns={columns}
        data={visiblePersonnel}
        itemLabel={['persona', 'personas']}
        searchPlaceholder='Buscar personal'
        enableRowActions
        initialState={{ density: 'compact' }}
        state={{ isLoading, showAlertBanner: isError }}
        muiToolbarAlertBannerProps={
          isError ? { color: 'error', children: error?.message } : undefined
        }
        renderRowActions={({ row }) => (
          <Box sx={{ display: 'flex', gap: '0.5rem' }}>
            <Tooltip title='Editar'>
              <IconButton
                onClick={() => handleOpenModal(row.original)}
                aria-label={`Editar a ${row.original.name}`}
                sx={{ color: '#2563eb' }}
                size='small'
              >
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title='Eliminar'>
              <IconButton
                onClick={() => handleDelete(row.original.id)}
                aria-label={`Eliminar a ${row.original.name}`}
                color='error'
                size='small'
              >
                <Delete />
              </IconButton>
            </Tooltip>
          </Box>
        )}
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
