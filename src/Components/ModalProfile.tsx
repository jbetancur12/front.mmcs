import React, { useEffect, useMemo, useState } from 'react'
import {
  Avatar,
  Box,
  LinearProgress,
  TextField,
  Typography
} from '@mui/material'
import { Person } from '@mui/icons-material'
import toast from 'react-hot-toast'
import FormDialog, { FormDialogSection } from 'src/Components/Common/FormDialog'
import FileDropZone from 'src/Components/Common/FileDropZone'
import { useCreateProfile } from 'src/hooks/profiles/useProfiles'

interface ModalProfileProps {
  open: boolean
  onClose: () => void
}

const initialState = {
  name: '',
  phone: '',
  email: '',
  description: ''
}

type FormErrors = Partial<
  Record<keyof typeof initialState | 'avatar' | 'cv', string>
>

const FULL_ROW = { gridColumn: '1 / -1' } as const

/** Diálogo para crear el perfil de un metrólogo: datos, foto y currículum. */
const ModalProfile: React.FC<ModalProfileProps> = ({ open, onClose }) => {
  const createProfile = useCreateProfile()
  const [formData, setFormData] = useState(initialState)
  const [avatar, setAvatar] = useState<File | null>(null)
  const [cv, setCv] = useState<File | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [uploadProgress, setUploadProgress] = useState(0)
  const [loading, setLoading] = useState(false)

  const avatarPreview = useMemo(
    () => (avatar ? URL.createObjectURL(avatar) : ''),
    [avatar]
  )
  useEffect(
    () => () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    },
    [avatarPreview]
  )

  const reset = () => {
    setFormData(initialState)
    setAvatar(null)
    setCv(null)
    setErrors({})
    setUploadProgress(0)
  }

  const handleClose = () => {
    if (loading) return
    reset()
    onClose()
  }

  const validate = () => {
    const next: FormErrors = {}
    if (!formData.name.trim()) next.name = 'El nombre es requerido'
    if (!formData.phone.trim()) next.phone = 'El teléfono es requerido'
    if (!formData.email.trim()) next.email = 'El correo es requerido'
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      next.email = 'Correo inválido'
    if (!formData.description.trim())
      next.description = 'La descripción es requerida'
    if (!avatar) next.avatar = 'La foto de perfil es requerida'
    if (!cv) next.cv = 'El currículum es requerido'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const setField =
    (name: keyof typeof initialState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((current) => ({ ...current, [name]: event.target.value }))
      if (errors[name]) setErrors((current) => ({ ...current, [name]: '' }))
    }

  const handleSubmit = async () => {
    if (!validate()) return

    const payload = new FormData()
    payload.append('name', formData.name)
    payload.append('phone', formData.phone)
    payload.append('email', formData.email)
    payload.append('description', formData.description)
    payload.append('cv', cv as Blob)
    payload.append('avatar', avatar as Blob)

    try {
      setLoading(true)
      setUploadProgress(0)
      const response = await createProfile.mutateAsync({
        formData: payload,
        onProgress: setUploadProgress
      })
      if (response.status === 200) {
        toast.success('Perfil de metrólogo creado con éxito')
        setLoading(false)
        reset()
        onClose()
      } else {
        toast.error('Error al crear el perfil')
      }
    } catch (error) {
      console.error('Error al enviar la solicitud:', error)
      toast.error('Error al crear el perfil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormDialog
      open={open}
      onClose={handleClose}
      title='Crear perfil de metrólogo'
      subtitle='Completa la información del nuevo metrólogo'
      submitLabel='Crear perfil'
      onSubmit={handleSubmit}
      loading={loading}
      maxWidth='md'
    >
      <FormDialogSection title='Foto de perfil'>
        <Box
          sx={{ ...FULL_ROW, display: 'flex', gap: 2, alignItems: 'center' }}
        >
          <Avatar
            src={avatarPreview}
            sx={{
              width: 72,
              height: 72,
              bgcolor: '#E0F7F4',
              color: '#00695C',
              border: '1px solid #e5e7eb',
              flexShrink: 0
            }}
          >
            <Person sx={{ fontSize: 36 }} />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <FileDropZone
              file={avatar}
              onFileSelected={(file) => {
                setAvatar(file)
                setErrors((current) => ({ ...current, avatar: '' }))
              }}
              onReject={(message) => toast.error(message)}
              accept='image/*'
              acceptLabel='imagen'
              title='Arrastra la foto o haz clic para elegirla'
              hint='JPG o PNG, hasta 5 MB'
              maxSizeMb={5}
              disabled={loading}
            />
          </Box>
        </Box>
        {errors.avatar && (
          <Typography variant='caption' color='error' sx={FULL_ROW}>
            {errors.avatar}
          </Typography>
        )}
      </FormDialogSection>

      <FormDialogSection title='Información personal'>
        <Box sx={FULL_ROW}>
          <TextField
            fullWidth
            label='Nombre completo'
            value={formData.name}
            onChange={setField('name')}
            disabled={loading}
            error={Boolean(errors.name)}
            helperText={errors.name}
          />
        </Box>
        <TextField
          fullWidth
          label='Teléfono'
          value={formData.phone}
          onChange={setField('phone')}
          disabled={loading}
          error={Boolean(errors.phone)}
          helperText={errors.phone}
        />
        <TextField
          fullWidth
          label='Correo'
          type='email'
          value={formData.email}
          onChange={setField('email')}
          disabled={loading}
          error={Boolean(errors.email)}
          helperText={errors.email}
        />
        <Box sx={FULL_ROW}>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label='Descripción profesional'
            value={formData.description}
            onChange={setField('description')}
            disabled={loading}
            error={Boolean(errors.description)}
            helperText={
              errors.description ||
              'Describe la experiencia y especialidades del metrólogo'
            }
          />
        </Box>
      </FormDialogSection>

      <FormDialogSection title='Currículum'>
        <Box sx={FULL_ROW}>
          <FileDropZone
            file={cv}
            onFileSelected={(file) => {
              setCv(file)
              setErrors((current) => ({ ...current, cv: '' }))
            }}
            onReject={(message) => toast.error(message)}
            accept='application/pdf'
            acceptLabel='PDF'
            maxSizeMb={10}
            disabled={loading}
          />
          {errors.cv && (
            <Typography
              variant='caption'
              color='error'
              sx={{ display: 'block', mt: 0.5 }}
            >
              {errors.cv}
            </Typography>
          )}
        </Box>
        {loading && (
          <Box sx={FULL_ROW}>
            <LinearProgress
              variant='determinate'
              value={uploadProgress}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: '#E0F7F4',
                '& .MuiLinearProgress-bar': { bgcolor: '#00BFA5' }
              }}
            />
            <Typography variant='caption' color='text.secondary'>
              Creando perfil… {uploadProgress}%
            </Typography>
          </Box>
        )}
      </FormDialogSection>
    </FormDialog>
  )
}

export default ModalProfile
