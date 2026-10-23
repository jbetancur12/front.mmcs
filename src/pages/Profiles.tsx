import React, { useMemo, useState } from 'react'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'

import {
  Avatar,
  Box,
  Button,
  Container,
  Grid,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import {
  Add,
  Delete,
  Email,
  Person,
  Phone,
  Visibility
} from '@mui/icons-material'
import { type MRT_Cell, type MRT_ColumnDef } from 'material-react-table'
import ModalProfile from '../Components/ModalProfile'
import { useDeleteProfile, useProfiles } from 'src/hooks/profiles/useProfiles'
import toast from 'react-hot-toast'
import { buildMinioObjectUrl } from '@utils/minio'

import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import DataTable from 'src/Components/Common/DataTable'
import EmptyState from 'src/Components/Common/EmptyState'
import ConfirmDialog from 'src/Components/Common/ConfirmDialog'

export interface Profile {
  id: number
  name: string
  photo: string
  phone: string
  email: string
  description: string
  imageProfile: string
}

interface RawProfile extends Omit<Profile, 'imageProfile'> {
  avatarUrl?: string | null
}

const getDefaultAvatar = (name?: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Usuario')}&background=00BFA5&color=fff&size=200`

const TEAL_BUTTON_SX = {
  textTransform: 'none',
  fontWeight: 600,
  bgcolor: '#00BFA5',
  whiteSpace: 'nowrap',
  '&:hover': { bgcolor: '#00897B' }
} as const

const Profiles: React.FC = () => {
  const canManageProfiles = useCan(PERMISSIONS.USERS_PROFILE_MANAGE)
  const navigate = useNavigate()
  const [openModal, setOpenModal] = useState(false)
  const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null)

  const { data: rawProfiles, isLoading: loading } = useProfiles({
    onError: (error) => {
      console.error('Error al cargar los perfiles:', error)
      toast.error('Error al cargar los perfiles')
    }
  })
  const profiles = useMemo<Profile[]>(
    () =>
      ((rawProfiles || []) as unknown as RawProfile[]).map((item) => ({
        ...item,
        imageProfile: item.avatarUrl
          ? buildMinioObjectUrl('images', item.avatarUrl)
          : getDefaultAvatar(item.name)
      })),
    [rawProfiles]
  )
  const deleteProfile = useDeleteProfile()

  const handleDelete = async () => {
    if (!profileToDelete) return
    try {
      const response = await deleteProfile.mutateAsync(profileToDelete.id)
      if (response.status === 204) {
        toast.success('Perfil eliminado correctamente')
      }
      setProfileToDelete(null)
    } catch (error) {
      console.error('Error al eliminar el perfil:', error)
      toast.error('No se pudo eliminar el perfil. Inténtalo de nuevo.')
    }
  }

  const columns = useMemo<MRT_ColumnDef<Profile>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Metrólogo',
        size: 280,
        Cell: ({ row }: { row: { original: Profile } }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              src={row.original.imageProfile}
              alt={row.original.name}
              imgProps={{
                onError: (event) => {
                  event.currentTarget.src = getDefaultAvatar(row.original.name)
                }
              }}
              sx={{ width: 36, height: 36, bgcolor: '#00BFA5' }}
            />
            <Typography fontWeight={600}>{row.original.name}</Typography>
          </Box>
        )
      },
      {
        accessorKey: 'phone',
        header: 'Teléfono',
        size: 170,
        Cell: ({ cell }: { cell: MRT_Cell<Profile> }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Phone sx={{ fontSize: 16, color: '#6b7280' }} />
            {cell.getValue<string>() || '—'}
          </Box>
        )
      },
      {
        accessorKey: 'email',
        header: 'Correo',
        size: 260,
        Cell: ({ cell }: { cell: MRT_Cell<Profile> }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Email sx={{ fontSize: 16, color: '#6b7280' }} />
            {cell.getValue<string>() || '—'}
          </Box>
        )
      }
    ],
    []
  )

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <ModalProfile open={openModal} onClose={() => setOpenModal(false)} />

      <LmsPageHeader
        title='Metrólogos'
        subtitle='Perfiles de los metrólogos del laboratorio'
        icon={<Person />}
        actions={
          canManageProfiles && (
            <Button
              variant='contained'
              startIcon={<Add />}
              onClick={() => setOpenModal(true)}
              sx={TEAL_BUTTON_SX}
            >
              Crear perfil
            </Button>
          )
        }
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <LmsStatCard
            variant='quiet'
            label='Metrólogos'
            value={profiles.length}
            icon={<Person />}
            tone='teal'
          />
        </Grid>
      </Grid>

      <DataTable
        columns={columns}
        data={profiles}
        itemLabel={['metrólogo', 'metrólogos']}
        searchPlaceholder='Buscar metrólogos'
        enableRowActions
        state={{ isLoading: loading }}
        initialState={{ density: 'compact' }}
        displayColumnDefOptions={{
          'mrt-row-actions': { header: 'Acciones', size: 110 }
        }}
        renderEmptyRowsFallback={() => (
          <EmptyState
            compact
            icon={<Person />}
            title='No hay perfiles de metrólogos'
            hint='Crea el primer perfil o ajusta la búsqueda.'
            action={
              canManageProfiles ? (
                <Button
                  variant='contained'
                  startIcon={<Add />}
                  onClick={() => setOpenModal(true)}
                  sx={TEAL_BUTTON_SX}
                >
                  Crear perfil
                </Button>
              ) : undefined
            }
          />
        )}
        renderRowActions={({ row }) => (
          <Box sx={{ display: 'flex' }}>
            <Tooltip title='Ver perfil'>
              <IconButton
                size='small'
                aria-label={`Ver perfil de ${row.original.name}`}
                sx={{ color: '#00695C' }}
                onClick={() => navigate(`/profiles/${row.original.id}`)}
              >
                <Visibility fontSize='small' />
              </IconButton>
            </Tooltip>
            {canManageProfiles && (
              <Tooltip title='Eliminar'>
                <IconButton
                  size='small'
                  aria-label={`Eliminar perfil de ${row.original.name}`}
                  color='error'
                  onClick={() => setProfileToDelete(row.original)}
                >
                  <Delete fontSize='small' />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      />

      <ConfirmDialog
        open={Boolean(profileToDelete)}
        tone='danger'
        title='Eliminar perfil'
        message={
          <>
            Vas a eliminar el perfil de <strong>{profileToDelete?.name}</strong>
            . Esta acción no se puede deshacer.
          </>
        }
        confirmLabel='Eliminar'
        loading={deleteProfile.isLoading}
        onConfirm={handleDelete}
        onClose={() => setProfileToDelete(null)}
      />
    </Container>
  )
}

export default Profiles
