import React, { useState, useCallback } from 'react'
import { 
  TextField, 
  Button, 
  Avatar, 
  Box, 
  Typography,
  LinearProgress,
  DialogContent,
  DialogActions
} from '@mui/material'
import { 
  CloudUpload, 
  Person, 
  PictureAsPdf
} from '@mui/icons-material'

import toast, { Toaster } from 'react-hot-toast'
import useAxiosPrivate from '@utils/use-axios-private'

const initialState = {
  name: '',
  phone: '',
  email: '',
  description: '',
  cv: null as File | null,
  avatar: null as File | null,
  avatarUrl: ''
}
interface Profile {
  onSave: () => void
}

const ProfileCreationForm: React.FC<Profile> = ({ onSave }) => {
  const axiosPrivate = useAxiosPrivate()
  const [formData, setFormData] = useState(initialState)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido'
    if (!formData.phone.trim()) newErrors.phone = 'El teléfono es requerido'
    if (!formData.email.trim()) newErrors.email = 'El email es requerido'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido'
    if (!formData.description.trim()) newErrors.description = 'La descripción es requerida'
    if (!formData.avatar) newErrors.avatar = 'La foto de perfil es requerida'
    if (!formData.cv) newErrors.cv = 'El CV es requerido'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      })
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      processFile(file)
    }
  }, [])

  const processFile = (file: File) => {
    if (file.type.includes('image')) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('La imagen no puede ser mayor a 5MB')
        return
      }
      setFormData({
        ...formData,
        avatar: file,
        avatarUrl: URL.createObjectURL(file)
      })
      if (errors.avatar) {
        setErrors({ ...errors, avatar: '' })
      }
      toast.success('Imagen cargada correctamente')
    } else if (file.type === 'application/pdf') {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('El PDF no puede ser mayor a 10MB')
        return
      }
      setFormData({
        ...formData,
        cv: file
      })
      if (errors.cv) {
        setErrors({ ...errors, cv: '' })
      }
      toast.success('CV cargado correctamente')
    } else {
      toast.error('Tipo de archivo no válido')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      processFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    const formDataToSend = new FormData()
    formDataToSend.append('name', formData.name)
    formDataToSend.append('phone', formData.phone)
    formDataToSend.append('email', formData.email)
    formDataToSend.append('description', formData.description)
    formDataToSend.append('cv', formData.cv as Blob)
    formDataToSend.append('avatar', formData.avatar as Blob)

    try {
      setLoading(true)
      setUploadProgress(0)
      
      const response = await axiosPrivate.post(`/profiles`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
          setUploadProgress(progress)
        }
      })

      if (response.status === 200) {
        toast.success('Perfil de metrólogo creado con éxito')
        setFormData(initialState)
        setUploadProgress(0)
        onSave()
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
    <>
      <Toaster />
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ 
          p: 3, 
          maxHeight: '70vh', 
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#00BFA5',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#00ACC1',
          },
        }}>
          {/* Sección Foto de Perfil */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, justifyContent: 'center' }}>
              <Person sx={{ color: '#00BFA5', fontSize: 20 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Foto de Perfil
              </Typography>
            </Box>
            
            <Box
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                p: 2,
                border: `2px dashed ${dragActive ? '#00BFA5' : errors.avatar ? '#d32f2f' : '#e0e0e0'}`,
                borderRadius: 2,
                bgcolor: dragActive ? '#e0f2f1' : '#f8f9fa',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderColor: '#00BFA5',
                  bgcolor: '#e0f2f1'
                }
              }}
              onClick={() => document.getElementById('avatarInput')?.click()}
            >
              <input
                id='avatarInput'
                type='file'
                accept='image/*'
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={loading}
              />
              
              <Avatar
                src={formData.avatarUrl}
                sx={{ 
                  width: 80, 
                  height: 80, 
                  mb: 1,
                  border: formData.avatarUrl ? '3px solid #00BFA5' : '2px dashed #ccc'
                }}
              >
                <Person sx={{ fontSize: 40 }} />
              </Avatar>
              
              <Typography variant="body2" color="text.secondary">
                {formData.avatarUrl ? 'Cambiar foto' : 'Arrastra una imagen o haz clic'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Máximo 5MB • JPG, PNG
              </Typography>
            </Box>
            {errors.avatar && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                {errors.avatar}
              </Typography>
            )}
          </Box>

          {/* Información Personal */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Person sx={{ color: '#00BFA5', fontSize: 20 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Información Personal
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Nombre completo"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={loading}
                error={!!errors.name}
                helperText={errors.name}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f8f9fa'
                  }
                }}
              />
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={loading}
                  error={!!errors.phone}
                  helperText={errors.phone}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: '#f8f9fa'
                    }
                  }}
                />
                
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={loading}
                  error={!!errors.email}
                  helperText={errors.email}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: '#f8f9fa'
                    }
                  }}
                />
              </Box>
              
              <TextField
                fullWidth
                label="Descripción profesional"
                name="description"
                multiline
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                disabled={loading}
                error={!!errors.description}
                helperText={errors.description || 'Describe la experiencia y especialidades del metrólogo'}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f8f9fa'
                  }
                }}
              />
            </Box>
          </Box>

          {/* CV Upload */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PictureAsPdf sx={{ color: '#00BFA5', fontSize: 20 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Currículum Vitae
              </Typography>
            </Box>
            
            <Box
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              sx={{
                border: `2px dashed ${dragActive ? '#00BFA5' : errors.cv ? '#d32f2f' : '#e0e0e0'}`,
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                bgcolor: dragActive ? '#e0f2f1' : '#f8f9fa',
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: '#00BFA5',
                  bgcolor: '#e0f2f1'
                }
              }}
              onClick={() => document.getElementById('cvInput')?.click()}
            >
              <input
                id='cvInput'
                type='file'
                accept='.pdf'
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={loading}
              />
              
              <CloudUpload 
                sx={{ 
                  fontSize: 40, 
                  color: dragActive ? '#00BFA5' : '#9e9e9e',
                  mb: 1 
                }} 
              />
              
              {formData.cv ? (
                <Box>
                  <Typography variant="body1" sx={{ color: '#00BFA5', fontWeight: 500, mb: 0.5 }}>
                    ✓ CV cargado
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formData.cv.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(formData.cv.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Typography variant="body1" sx={{ mb: 0.5, color: '#424242' }}>
                    {dragActive ? 'Suelta el archivo PDF aquí' : 'Arrastra el CV aquí'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    o haz clic para seleccionar
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Máximo 10MB • Solo archivos PDF
                  </Typography>
                </Box>
              )}
            </Box>
            {errors.cv && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                {errors.cv}
              </Typography>
            )}
          </Box>

          {/* Upload Progress */}
          {loading && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ flex: 1 }}>
                  Creando perfil...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {uploadProgress}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={uploadProgress}
                sx={{ 
                  borderRadius: 1,
                  height: 8,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#00BFA5'
                  }
                }}
              />
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0, gap: 2, justifyContent: 'flex-end' }}>
          <Button 
            onClick={onSave} 
            disabled={loading}
            sx={{ 
              borderRadius: 2,
              px: 3,
              py: 1,
              color: '#666',
              '&:hover': {
                bgcolor: '#f5f5f5'
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            disabled={loading}
            startIcon={loading ? null : <Person />}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              bgcolor: '#00BFA5',
              '&:hover': {
                bgcolor: '#00ACC1'
              },
              '&:disabled': {
                bgcolor: '#e0e0e0',
                color: '#9e9e9e'
              }
            }}
          >
            {loading ? 'Creando Perfil...' : 'Crear Perfil'}
          </Button>
        </DialogActions>
      </form>
    </>
  )
}

export default ProfileCreationForm
