import React, { useState, useEffect, useMemo, useCallback } from 'react'

import * as minioExports from 'minio'
import {
  Button,
  IconButton,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Box,
  TextField,
  InputAdornment,
  Skeleton,
  Fade,
  Chip
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { 
  Delete, 
  Search, 
  Clear, 
  Person, 
  Phone, 
  Email, 
  Add,
  Visibility
} from '@mui/icons-material'
import ModalProfile from '../Components/ModalProfile'
import { userStore } from '../store/userStore'
import { useStore } from '@nanostores/react'
import useAxiosPrivate from '@utils/use-axios-private'
import toast, { Toaster } from 'react-hot-toast'
import Swal from 'sweetalert2'

export interface Profile {
  id: number
  name: string
  photo: string
  phone: string
  email: string
  description: string
  imageProfile: string
}

const minioClient = new minioExports.Client({
  endPoint: import.meta.env.VITE_MINIO_ENDPOINT || 'localhost',
  port: import.meta.env.VITE_ENV === 'development' ? 9000 : undefined,
  useSSL: import.meta.env.VITE_MINIO_USESSL === 'true',
  accessKey: import.meta.env.VITE_MINIO_ACCESSKEY,
  secretKey: import.meta.env.VITE_MINIO_SECRETKEY
})



const Profiles: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const navigate = useNavigate()
  const $userStore = useStore(userStore)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [openModal, setOpenModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const getBucket = async (data: any) => {
    const profilePromises = data.map((item: any) => {
      return new Promise((resolve) => {
        if (!item.avatarUrl) {
          // Si no hay avatarUrl, generar avatar con iniciales
          const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'Usuario')}&background=00BFA5&color=fff&size=200`
          resolve({ ...item, imageProfile: defaultAvatar })
          return
        }

        minioClient.getObject(
          'images',
          item.avatarUrl,
          (err: Error | null, dataStream: any) => {
            if (err) {
              console.warn(`MinIO: Image not found for profile ${item.id} (${item.name}):`, err.message)
              // En caso de error, usar imagen por defecto o generar avatar con iniciales
              const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'Usuario')}&background=00BFA5&color=fff&size=200`
              resolve({ ...item, imageProfile: defaultAvatar })
            } else {
              // Crear URL del blob para la imagen
              const chunks: any[] = []
              dataStream.on('data', (chunk: any) => chunks.push(chunk))
              dataStream.on('end', () => {
                try {
                  const imageBlob = new Blob(chunks, { type: 'image/jpeg' })
                  const imageUrl = URL.createObjectURL(imageBlob)
                  resolve({ ...item, imageProfile: imageUrl })
                } catch (blobError) {
                  console.error('Error creating blob URL:', blobError)
                  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'Usuario')}&background=00BFA5&color=fff&size=200`
                  resolve({ ...item, imageProfile: defaultAvatar })
                }
              })
              dataStream.on('error', (streamError: any) => {
                console.error('Stream error:', streamError)
                const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'Usuario')}&background=00BFA5&color=fff&size=200`
                resolve({ ...item, imageProfile: defaultAvatar })
              })
            }
          }
        )
      })
    })

    try {
      const profiles = await Promise.all(profilePromises)
      return profiles
    } catch (error) {
      console.error('Error in getBucket:', error)
      // Fallback: devolver los datos originales con imagen por defecto
      return data.map((item: any) => ({
        ...item,
        imageProfile: '/default-avatar.png'
      }))
    }
  }
  const fetchProfiles = async () => {
    try {
      setLoading(true)
      const response = await axiosPrivate.get(`/profiles`, {})
      
      if (response.data && response.data.length > 0) {
        try {
          const pro = await getBucket(response.data)
          setProfiles(pro as Profile[])
        } catch (bucketError) {
          console.error('Error processing images, using profiles without images:', bucketError)
          // Si falla MinIO, usar los perfiles sin las imágenes procesadas
          const profilesWithoutImages = response.data.map((item: any) => ({
            ...item,
            imageProfile: item.avatarUrl || '/default-avatar.png' // Fallback image
          }))
          setProfiles(profilesWithoutImages)
        }
      } else {
        setProfiles([])
      }
    } catch (error) {
      console.error('Error al cargar los perfiles:', error)
      toast.error('Error al cargar los perfiles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfiles()
  }, [])

  // Debounced search effect
  useEffect(() => {
    setIsSearching(true)
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const filteredProfiles = useMemo(() => {
    if (!debouncedSearchTerm) return profiles
    
    return profiles.filter((profile) =>
      (profile.name || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      (profile.email || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      (profile.phone || '').includes(debouncedSearchTerm)
    )
  }, [profiles, debouncedSearchTerm])

  const highlightText = useCallback((text: string | null | undefined, highlight: string) => {
    if (!highlight || !text) return text || ''
    
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'))
    return parts.map((part, index) => 
      part.toLowerCase() === highlight.toLowerCase() ? (
        <Box component="span" key={index} sx={{ bgcolor: 'yellow', fontWeight: 'bold' }}>
          {part}
        </Box>
      ) : part
    )
  }, [])

  const clearSearch = () => {
    setSearchTerm('')
    setDebouncedSearchTerm('')
  }

  const handleEliminar = async (id: number, profileName: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar perfil?',
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Perfil:</strong> ${profileName}</p>
          <p style="color: #d32f2f; margin-top: 15px;">
            <strong>⚠️ Esta acción no se puede deshacer</strong>
          </p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#grey',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true
    })

    if (!result.isConfirmed) return

    try {
      Swal.fire({
        title: 'Eliminando...',
        text: 'Por favor espera mientras se elimina el perfil',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading()
        }
      })

      const response = await axiosPrivate.delete(`/profiles/${id}`, {})

      if (response.status === 204) {
        fetchProfiles()
        
        Swal.fire({
          title: '¡Eliminado!',
          text: 'El perfil ha sido eliminado correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        })
      }
    } catch (error) {
      console.error('Error al eliminar el perfil:', error)
      
      Swal.fire({
        title: 'Error',
        text: 'No se pudo eliminar el perfil. Por favor intenta nuevamente.',
        icon: 'error',
        confirmButtonText: 'Entendido'
      })
    }
  }

  const handleOpenModal = () => {
    setOpenModal(true)
  }

  const handleOpenProfile = (id: any) => {
    navigate(`/profiles/${id}`)
  }

  const SkeletonCard = () => (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent sx={{ textAlign: 'center', py: 3 }}>
        <Skeleton variant="circular" width={80} height={80} sx={{ mx: 'auto', mb: 2 }} />
        <Skeleton variant="text" width="60%" sx={{ mx: 'auto', mb: 1 }} />
        <Skeleton variant="text" width="80%" sx={{ mx: 'auto', mb: 1 }} />
        <Skeleton variant="text" width="70%" sx={{ mx: 'auto' }} />
      </CardContent>
      <CardActions sx={{ justifyContent: 'center', gap: 1 }}>
        <Skeleton variant="rectangular" width={80} height={32} />
        <Skeleton variant="rectangular" width={40} height={32} />
      </CardActions>
    </Card>
  )

  const EmptyState = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        textAlign: 'center'
      }}
    >
      <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h6" color="text.secondary" gutterBottom>
        No hay perfiles de metrólogos
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {debouncedSearchTerm 
          ? `No se encontraron perfiles que coincidan con "${debouncedSearchTerm}"`
          : 'Comienza creando el primer perfil de metrólogo'
        }
      </Typography>
      {debouncedSearchTerm && (
        <Button
          variant="outlined"
          onClick={clearSearch}
          sx={{ mb: 2 }}
        >
          Limpiar búsqueda
        </Button>
      )}
      {!debouncedSearchTerm && $userStore.rol.some((role) => ['admin'].includes(role)) && (
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenModal}
          sx={{
            bgcolor: '#00BFA5',
            '&:hover': {
              bgcolor: '#00ACC1'
            }
          }}
        >
          Crear Primer Perfil
        </Button>
      )}
    </Box>
  )

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Toaster />
      <ModalProfile open={openModal} onClose={() => setOpenModal(false)} />

      {/* Header Section */}
      <Box component="header" sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Person sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Metrólogos
          </Typography>
        </Box>
        
        {/* Search and Create Section */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' }
        }}>
          <TextField
            label="Buscar metrólogos"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1 }}
            aria-label="Campo de búsqueda de metrólogos"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color={isSearching ? "primary" : "inherit"} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={clearSearch}
                    edge="end"
                    aria-label="Limpiar búsqueda"
                  >
                    <Clear />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            helperText={
              isSearching ? "Buscando..." : 
              searchTerm && !isSearching ? `${filteredProfiles.length} resultado(s) encontrado(s)` : 
              ""
            }
          />
          {$userStore.rol.some((role) => ['admin'].includes(role)) && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenModal}
              sx={{ 
                minWidth: 200,
                bgcolor: '#00BFA5',
                '&:hover': {
                  bgcolor: '#00ACC1'
                }
              }}
              aria-label="Crear nuevo perfil de metrólogo"
            >
              Crear Perfil
            </Button>
          )}
        </Box>
        
        {/* Results Count */}
        {!loading && profiles.length > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {filteredProfiles.length} de {profiles.length} metrólogos
          </Typography>
        )}
      </Box>

      {/* Content Area */}
      <Box component="main" role="main" aria-label="Lista de metrólogos">

        
        {loading ? (
          <Grid container spacing={3}>
            {[...Array(6)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <SkeletonCard />
              </Grid>
            ))}
          </Grid>
        ) : filteredProfiles.length === 0 ? (
          <EmptyState />
        ) : (
          <Grid container spacing={3}>
            {filteredProfiles.map((profile) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={profile.id}>
                <Fade in timeout={300}>
                  <Card 
                    elevation={2}
                    role="article"
                    aria-label={`Perfil de metrólogo: ${profile.name}`}
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        elevation: 4,
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 3, flexGrow: 1 }}>
                      <Avatar
                        src={profile.imageProfile}
                        alt={profile.name}
                        sx={{ 
                          width: 80, 
                          height: 80, 
                          mx: 'auto', 
                          mb: 2,
                          border: '3px solid #00BFA5'
                        }}
                      />
                      
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        {highlightText(profile.name, debouncedSearchTerm)}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                        <Phone sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          {highlightText(profile.phone, debouncedSearchTerm)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                        <Email sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {highlightText(profile.email, debouncedSearchTerm)}
                        </Typography>
                      </Box>

                      <Chip
                        label="Metrólogo"
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </CardContent>

                    <CardActions sx={{ justifyContent: 'center', gap: 1, p: 2 }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Visibility />}
                        onClick={() => handleOpenProfile(profile.id)}
                        sx={{
                          bgcolor: '#00BFA5',
                          '&:hover': {
                            bgcolor: '#00ACC1'
                          }
                        }}
                        aria-label={`Ver perfil de ${profile.name}`}
                      >
                        Ver Perfil
                      </Button>
                      
                      {$userStore.rol.some((role) => ['admin'].includes(role)) && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleEliminar(profile.id, profile.name)}
                          aria-label={`Eliminar perfil de ${profile.name}`}
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </CardActions>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  )
}

export default Profiles
