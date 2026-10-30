import SignalLoader from 'src/Components/Common/SignalLoader'
import React, { useState } from 'react'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'

import { useParams, useNavigate } from 'react-router-dom'

import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  TextField,
  Typography
} from '@mui/material'
import {
  ArrowBack,
  Edit,
  PhotoCamera,
  Person,
  UploadFile
} from '@mui/icons-material'
import toast from 'react-hot-toast'

import PDFViewer from '../Components/PDFViewer'
import IMGViewer from '../Components/IMGViewer'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import FormDialog, { FormDialogSection } from 'src/Components/Common/FormDialog'
import {
  DetailField,
  DetailSection,
  DetailCell
} from 'src/Components/Common/DetailBlocks'
import EmptyState from 'src/Components/Common/EmptyState'
import {
  useProfile,
  useUpdateProfile,
  useUploadProfileFile
} from 'src/hooks/profiles/useProfiles'

import { logger } from 'src/utils/logger'
interface Profile {
  id: number
  name: string
  profession: string
  description: string
  avatarUrl: string
  cvUrl: string
  phone: string
  email: string
}

type EditableProfile = Pick<
  Profile,
  'name' | 'phone' | 'email' | 'description' | 'profession'
>

const OUTLINE_BUTTON_SX = {
  textTransform: 'none',
  fontWeight: 600,
  color: '#00695C',
  borderColor: '#00BFA5',
  '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' }
} as const

const CARD_SX = {
  p: { xs: 2, md: 3 },
  borderRadius: '16px',
  border: '1px solid #e5e7eb'
} as const

const Profile: React.FC = () => {
  const canManageProfiles = useCan(PERMISSIONS.USERS_PROFILE_MANAGE)
  const navigate = useNavigate()
  const { id: idProfile } = useParams()
  const [editOpen, setEditOpen] = useState(false)
  const [edited, setEdited] = useState<EditableProfile | null>(null)
  const [image, setImage] = useState<string | null>(null)
  const [selectedCV, setSelectedCV] = useState<string | null>(null)

  const { data: profileData, isLoading: loading } = useProfile<
    Profile & { createdAt?: string; updatedAt?: string }
  >(idProfile, {
    onError: (error) => {
      logger.error('Error al cargar el perfil:', error)
      toast.error('No se pudo cargar el perfil')
    }
  })
  const profile = profileData ?? null
  const updateProfile = useUpdateProfile<Profile>(idProfile)
  const uploadAvatar = useUploadProfileFile(idProfile, 'avatar')
  const uploadCV = useUploadProfileFile(idProfile, 'cv')

  const avatarPath = image ?? profile?.avatarUrl ?? ''
  const cvPath = selectedCV ?? profile?.cvUrl ?? ''

  const openEdit = () => {
    if (!profile) return
    setEdited({
      name: profile.name || '',
      phone: profile.phone || '',
      email: profile.email || '',
      description: profile.description || '',
      profession: profile.profession || ''
    })
    setEditOpen(true)
  }

  const setField =
    (name: keyof EditableProfile) =>
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setEdited((current) =>
        current ? { ...current, [name]: event.target.value } : current
      )

  const handleSave = async () => {
    if (!edited) return
    if (!edited.name.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    try {
      await updateProfile.mutateAsync(edited as Profile)
      setEditOpen(false)
      toast.success('Perfil actualizado correctamente')
    } catch (error) {
      logger.error('Error al guardar el perfil:', error)
      toast.error('No se pudo actualizar el perfil. Inténtalo de nuevo.')
    }
  }

  const handleCVChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('cv', file as Blob)
    try {
      const response = await uploadCV.mutateAsync(formData)
      setSelectedCV(response.data.profile.cvUrl)
      toast.success('Currículum actualizado correctamente')
    } catch (error) {
      logger.error('Error al enviar el CV al backend:', error)
      toast.error('No se pudo actualizar el currículum. Inténtalo de nuevo.')
    }
  }

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files && event.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('avatar', file as Blob)
    try {
      const response = await uploadAvatar.mutateAsync(formData)
      setImage(response.data.profile.avatarUrl)
      toast.success('Foto de perfil actualizada correctamente')
    } catch (error) {
      logger.error('Error al enviar la imagen al backend:', error)
      toast.error('No se pudo actualizar la foto. Inténtalo de nuevo.')
    }
  }

  if (loading) {
    return <SignalLoader message='Cargando perfil...' fullPage />
  }

  if (!profile) {
    return (
      <Container maxWidth='xl' sx={{ py: 3 }}>
        <EmptyState
          icon={<Person />}
          title='Perfil no encontrado'
          hint='Puede que haya sido eliminado.'
          action={
            <Button
              variant='outlined'
              startIcon={<ArrowBack />}
              onClick={() => navigate('/profiles')}
              sx={OUTLINE_BUTTON_SX}
            >
              Volver a metrólogos
            </Button>
          }
        />
      </Container>
    )
  }

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>

      <LmsPageHeader
        title={profile.name}
        subtitle='Metrólogo del laboratorio'
        icon={<Person />}
        actions={
          <>
            {canManageProfiles && (
              <Button
                variant='outlined'
                startIcon={<Edit />}
                onClick={openEdit}
                sx={OUTLINE_BUTTON_SX}
              >
                Editar perfil
              </Button>
            )}
            <Button
              variant='outlined'
              startIcon={<ArrowBack />}
              onClick={() => navigate('/profiles')}
              sx={OUTLINE_BUTTON_SX}
            >
              Volver
            </Button>
          </>
        }
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={CARD_SX}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <IMGViewer bucket='images' path={avatarPath} />
            </Box>
            {canManageProfiles && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Button
                  variant='outlined'
                  startIcon={<PhotoCamera />}
                  onClick={() =>
                    document.getElementById('avatarInput')?.click()
                  }
                  sx={OUTLINE_BUTTON_SX}
                >
                  Cambiar foto
                </Button>
                <input
                  id='avatarInput'
                  type='file'
                  accept='image/*'
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
              </Box>
            )}
            <DetailSection title='Contacto'>
              <DetailCell full>
                <DetailField label='Teléfono'>
                  {profile.phone || 'Sin registrar'}
                </DetailField>
              </DetailCell>
              <DetailCell full>
                <DetailField label='Correo'>
                  {profile.email || 'Sin registrar'}
                </DetailField>
              </DetailCell>
            </DetailSection>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'grid', gap: 3 }}>
            <Paper elevation={0} sx={CARD_SX}>
              <DetailSection title='Descripción profesional'>
                <DetailCell full>
                  <Typography
                    variant='body1'
                    color={
                      profile.description ? 'text.primary' : 'text.disabled'
                    }
                    sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}
                  >
                    {profile.description || 'Sin descripción disponible'}
                  </Typography>
                </DetailCell>
              </DetailSection>
            </Paper>

            <Paper elevation={0} sx={CARD_SX}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1,
                  mb: 2
                }}
              >
                <Typography variant='subtitle1' fontWeight={700}>
                  Currículum vitae
                </Typography>
                {canManageProfiles && (
                  <Button
                    variant='outlined'
                    startIcon={<UploadFile />}
                    onClick={() => document.getElementById('cvInput')?.click()}
                    sx={OUTLINE_BUTTON_SX}
                  >
                    Actualizar CV
                  </Button>
                )}
              </Box>
              <input
                id='cvInput'
                type='file'
                accept='application/pdf'
                style={{ display: 'none' }}
                onChange={handleCVChange}
              />
              <Box
                sx={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  bgcolor: '#fff'
                }}
              >
                <PDFViewer
                  bucket='cvs'
                  path={cvPath}
                  view='preview'
                  buttons={false}
                  allowDownload={false}
                  allowOpen={false}
                  downloadUrl={`/profiles/${idProfile}/cv/download`}
                  disableContextMenu
                />
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>

      <FormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title='Editar perfil'
        subtitle={profile.name}
        submitLabel='Guardar cambios'
        onSubmit={handleSave}
        loading={updateProfile.isLoading}
        maxWidth='sm'
      >
        <FormDialogSection title='Información personal'>
          <Box sx={{ gridColumn: '1 / -1' }}>
            <TextField
              fullWidth
              label='Nombre completo'
              value={edited?.name ?? ''}
              onChange={setField('name')}
            />
          </Box>
          <TextField
            fullWidth
            label='Teléfono'
            value={edited?.phone ?? ''}
            onChange={setField('phone')}
          />
          <TextField
            fullWidth
            label='Correo'
            type='email'
            value={edited?.email ?? ''}
            onChange={setField('email')}
          />
          <Box sx={{ gridColumn: '1 / -1' }}>
            <TextField
              fullWidth
              multiline
              minRows={5}
              label='Descripción profesional'
              value={edited?.description ?? ''}
              onChange={setField('description')}
            />
          </Box>
        </FormDialogSection>
      </FormDialog>
    </Container>
  )
}

export default Profile
