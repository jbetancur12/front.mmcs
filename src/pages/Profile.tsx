import React, { useState, useEffect } from 'react'

import { useParams, useNavigate } from 'react-router-dom'

import { 
  Typography, 
  IconButton, 
  TextField, 
  Button, 
  Box,
  Breadcrumbs,
  Link,
  Container,
  Paper,
  Skeleton
} from '@mui/material'
import { 
  Edit, 
  Save, 
  ArrowBack, 
  Person, 
  Home,
  NavigateNext
} from '@mui/icons-material'

import PDFViewer from '../Components/PDFViewer'
import IMGViewer from '../Components/IMGViewer'
import Swal from 'sweetalert2'
import { userStore } from '../store/userStore'
import { useStore } from '@nanostores/react'
import useAxiosPrivate from '@utils/use-axios-private'

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

const Profile: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const $userStore = useStore(userStore)
  const navigate = useNavigate()
  const { id: idProfile } = useParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [editedProfile, setEditedProfile] = useState<Profile | null>(null)
  const [image, setImage] = useState<string>('')
  const [selectedCV, setSelectedCV] = useState<File | undefined>(undefined)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const response = await axiosPrivate.get(`/profiles/${idProfile}`, {})

        const { cvUrl, avatarUrl, createdAt, updatedAt, id, ...profileData } =
          response.data

        setProfile(response.data)
        setEditedProfile(profileData)
        setImage(response.data.avatarUrl)
        setSelectedCV(response.data.cvUrl)
      } catch (error) {
        console.error('Error al cargar el perfil:', error)
        Swal.fire({
          title: 'Error',
          text: 'No se pudo cargar el perfil',
          icon: 'error',
          confirmButtonText: 'Entendido'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [idProfile])

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleSaveClick = async () => {
    try {
      await axiosPrivate.put(`/profiles/${idProfile}`, editedProfile, {})
      setProfile(editedProfile)
      setIsEditing(false)
      Swal.fire({
        title: '¡Actualizado!',
        text: 'El perfil ha sido actualizado correctamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      })
    } catch (error) {
      console.error('Error al guardar el perfil:', error)
      Swal.fire({
        title: 'Error',
        text: 'No se pudo actualizar el perfil. Por favor intenta nuevamente.',
        icon: 'error',
        confirmButtonText: 'Entendido'
      })
    }
  }

  const handleGoBack = () => {
    navigate('/profiles')
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setEditedProfile((prevState: Profile | null) => ({
      ...prevState!,
      [name]: value
    }))
  }

  const handleCVChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0]
    // setSelectedCV(file);
    const formData = new FormData()
    formData.append('cv', file as Blob)
    try {
      // Enviar la imagen al backend Express
      const response = await axiosPrivate.post(
        `/profiles/${idProfile}/cv`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      setSelectedCV(response.data.profile.cvUrl)
      Swal.fire({
        title: '¡CV Actualizado!',
        text: 'La hoja de vida ha sido actualizada correctamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      })

      // Actualizar la imagen en el estado local
    } catch (error) {
      console.error('Error al enviar la imagen al backend:', error)
      Swal.fire({
        title: 'Error',
        text: 'No se pudo actualizar el CV. Por favor intenta nuevamente.',
        icon: 'error',
        confirmButtonText: 'Entendido'
      })
    }
  }

  const handleClick = () => {
    if ($userStore.rol.some((role) => ['admin'].includes(role))) {
      document.getElementById('avatarInput')?.click()
    }
  }

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files && event.target.files[0]
    if (file) {
      setImage(URL.createObjectURL(file))
      const formData = new FormData()
      formData.append('avatar', file as Blob)

      try {
        // Enviar la imagen al backend Express
        const response = await axiosPrivate.post(
          `/profiles/${idProfile}/avatar`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        )

        setImage(response.data.profile.avatarUrl)
        Swal.fire({
          title: '¡Imagen Actualizada!',
          text: 'La foto de perfil ha sido actualizada correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        })

        // Actualizar la imagen en el estado local
      } catch (error) {
        console.error('Error al enviar la imagen al backend:', error)
        Swal.fire({
          title: 'Error',
          text: 'No se pudo actualizar la imagen. Por favor intenta nuevamente.',
          icon: 'error',
          confirmButtonText: 'Entendido'
        })
      }
    }
  }

  const ProfileSkeleton = () => (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="text" width={300} height={32} />
      </Box>
      <Box sx={{ display: 'flex', gap: 4, mb: 4 }}>
        <Skeleton variant="rectangular" width={300} height={400} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="100%" height={32} />
          <Skeleton variant="text" width="80%" height={24} />
          <Skeleton variant="text" width="90%" height={24} />
          <Skeleton variant="rectangular" width="100%" height={200} sx={{ mt: 2 }} />
        </Box>
      </Box>
    </Container>
  )

  if (loading) {
    return <ProfileSkeleton />
  }

  if (!profile) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography variant="h6" color="error">
          Perfil no encontrado
        </Typography>
        <Button onClick={handleGoBack} sx={{ mt: 2 }}>
          Volver a Perfiles
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      
      {/* Breadcrumb y Botón Volver */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Breadcrumbs 
            separator={<NavigateNext fontSize="small" />}
            aria-label="breadcrumb"
          >
            <Link 
              color="inherit" 
              href="/" 
              sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
            >
              <Home sx={{ mr: 0.5, fontSize: 20 }} />
              Inicio
            </Link>
            <Link 
              color="inherit" 
              onClick={handleGoBack}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                textDecoration: 'none',
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              <Person sx={{ mr: 0.5, fontSize: 20 }} />
              Metrólogos
            </Link>
            <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
              <Person sx={{ mr: 0.5, fontSize: 20 }} />
              {profile.name}
            </Typography>
          </Breadcrumbs>
          
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handleGoBack}
            sx={{
              borderRadius: 2,
              textTransform: 'none'
            }}
          >
            Volver
          </Button>
        </Box>
      </Box>

      {/* Contenido Principal */}
      <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {/* Header del Perfil */}
        <Box sx={{ 
          bgcolor: '#00BFA5', 
          color: 'white', 
          p: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <Box>
            {isEditing ? (
              <TextField
                name='name'
                label='Nombre'
                value={editedProfile?.name || ''}
                onChange={handleInputChange}
                sx={{ 
                  mb: 2, 
                  width: '400px',
                  '& .MuiInputLabel-root': { color: 'white' },
                  '& .MuiOutlinedInput-root': { 
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                    '&:hover fieldset': { borderColor: 'white' },
                    '&.Mui-focused fieldset': { borderColor: 'white' }
                  }
                }}
              />
            ) : (
              <Typography variant='h4' gutterBottom sx={{ fontWeight: 600 }}>
                {profile.name}
              </Typography>
            )}
            
            <Typography variant='h6' sx={{ opacity: 0.9, mb: 1 }}>
              {isEditing ? (
                <TextField
                  name='phone'
                  label='Teléfono'
                  value={editedProfile?.phone || ''}
                  onChange={handleInputChange}
                  sx={{ 
                    mb: 1, 
                    width: '300px',
                    '& .MuiInputLabel-root': { color: 'white' },
                    '& .MuiOutlinedInput-root': { 
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                      '&:hover fieldset': { borderColor: 'white' },
                      '&.Mui-focused fieldset': { borderColor: 'white' }
                    }
                  }}
                />
              ) : (
                `📞 ${profile.phone}`
              )}
            </Typography>
            
            <Typography variant='h6' sx={{ opacity: 0.9 }}>
              {isEditing ? (
                <TextField
                  name='email'
                  label='Email'
                  value={editedProfile?.email || ''}
                  onChange={handleInputChange}
                  sx={{ 
                    width: '300px',
                    '& .MuiInputLabel-root': { color: 'white' },
                    '& .MuiOutlinedInput-root': { 
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                      '&:hover fieldset': { borderColor: 'white' },
                      '&.Mui-focused fieldset': { borderColor: 'white' }
                    }
                  }}
                />
              ) : (
                `✉️ ${profile.email}`
              )}
            </Typography>
          </Box>
          
          {/* Botones de Acción */}
          <Box>
            {$userStore.rol.some((role) => ['admin'].includes(role)) && !isEditing && (
              <IconButton
                sx={{ 
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}
                onClick={handleEditClick}
                aria-label="Editar perfil"
              >
                <Edit />
              </IconButton>
            )}
            {isEditing && (
              <IconButton
                sx={{ 
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}
                onClick={handleSaveClick}
                aria-label="Guardar cambios"
              >
                <Save />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Contenido del Perfil */}
        <Box sx={{ p: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            gap: 4, 
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'center', md: 'flex-start' },
            mb: 4 
          }}>
            {/* Imagen del Perfil */}
            <Box 
              sx={{ 
                cursor: $userStore.rol.some((role) => ['admin'].includes(role)) ? 'pointer' : 'default',
                textAlign: 'center'
              }}
              onClick={handleClick}
            >
              <IMGViewer bucket='images' path={image} />
              <input
                id='avatarInput'
                type='file'
                accept='image/*'
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
              {$userStore.rol.some((role) => ['admin'].includes(role)) && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Haz clic para cambiar imagen
                </Typography>
              )}
            </Box>
            
            {/* Descripción */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Descripción Profesional
              </Typography>
              {isEditing ? (
                <TextField
                  name='description'
                  label='Descripción'
                  multiline
                  rows={6}
                  fullWidth
                  value={editedProfile?.description || ''}
                  onChange={handleInputChange}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: '#f8f9fa'
                    }
                  }}
                />
              ) : (
                <Typography variant='body1' sx={{ 
                  lineHeight: 1.6,
                  color: 'text.secondary',
                  bgcolor: '#f8f9fa',
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid #e0e0e0'
                }}>
                  {profile.description || 'Sin descripción disponible'}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Sección CV */}
          <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Currículum Vitae
              </Typography>
              {$userStore.rol.some((role) => ['admin'].includes(role)) && !isEditing && (
                <Button
                  variant='contained'
                  onClick={() => document.getElementById('cvInput')?.click()}
                  sx={{
                    bgcolor: '#FF9800',
                    '&:hover': { bgcolor: '#F57C00' },
                    borderRadius: 2
                  }}
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
            
            <Box sx={{ 
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: 'white'
            }}>
              {/* @ts-ignore */}
              <PDFViewer bucket='cvs' path={selectedCV} view='preview' />
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}

export default Profile
