import React, { useState, useEffect } from 'react'
import { 
  Button, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Paper,
  Fade,
  IconButton,
  LinearProgress,
  Alert,
  Divider
} from '@mui/material'
import { 
  CloudUpload, 
  Close, 
  CalendarToday, 
  Description,
  CheckCircle,
  Update
} from '@mui/icons-material'
import { styled } from '@mui/material/styles'

import toast, { Toaster } from 'react-hot-toast'
import Loader from './Loader2'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import useAxiosPrivate from '@utils/use-axios-private'

interface UpdateCertificateModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  id?: string
}



const DropZone = styled(Paper)(() => ({
  border: '2px dashed #d1d5db',
  borderRadius: '12px',
  padding: '24px',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease-in-out',
  backgroundColor: '#f9fafb',
  '&:hover': {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
  },
  '&.dragover': {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
    boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.1)'
  }
}))

const DatePickerContainer = styled(Box)(() => ({
  '& .MuiTextField-root': {
    width: '100%',
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: '#10b981'
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#10b981'
      }
    }
  }
}))

const UpdateCertificateModal: React.FC<UpdateCertificateModalProps> = ({
  open,
  onClose,
  onSuccess,
  id
}) => {
  const axiosPrivate = useAxiosPrivate()
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [previousDate, setPreviousDate] = useState('')
  const [nextDate, setNextDate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(Date.now())
  const [isDragOver, setIsDragOver] = useState(false)

  // Función para limpiar el formulario
  const resetForm = () => {
    setSelectedFileName(null)
    setPreviousDate('')
    setNextDate('')
    setFile(null)
    setIsDragOver(false)
    setFileInputKey(Date.now()) // Forzar re-render del input de archivo
  }

  // Limpiar el formulario cuando el modal se abre
  useEffect(() => {
    if (open) {
      resetForm()
    }
  }, [open])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      processFile(selectedFile)
    }
  }

  const processFile = (selectedFile: File) => {
    // Validar que sea un PDF
    if (selectedFile.type !== 'application/pdf') {
      toast.error('Solo se permiten archivos PDF', {
        duration: 3000,
        position: 'top-center'
      })
      return
    }

    // Validar tamaño (máximo 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('El archivo no puede ser mayor a 10MB', {
        duration: 3000,
        position: 'top-center'
      })
      return
    }

    setFile(selectedFile)
    setSelectedFileName(selectedFile.name)
  }

  // Funciones para drag & drop
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    
    const files = event.dataTransfer.files
    if (files.length > 0) {
      processFile(files[0])
    }
  }

  const handleChangeCalibrationDate = (date: Date | null) => {
    let newDate = date
    if (newDate) {
      setPreviousDate(newDate.toISOString())
      newDate.setFullYear(newDate.getFullYear() + 1)
      setNextDate(newDate.toISOString())
    }
  }

  const handleSave = async () => {
    // Validar que todos los campos requeridos estén completos
    if (!file) {
      toast.error('Debes seleccionar un archivo PDF', {
        duration: 3000,
        position: 'top-center'
      })
      return
    }

    if (!previousDate || !nextDate) {
      toast.error('Debes seleccionar las fechas de calibración', {
        duration: 3000,
        position: 'top-center'
      })
      return
    }

    try {
      const formData = new FormData()
      formData.append('pdf', file as Blob)
      formData.append('calibrationDate', previousDate)
      formData.append('nextCalibrationDate', nextDate)
      formData.append('id', id as string)

      setLoading(true)
      const response = await axiosPrivate.put(`/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.status === 201) {
        setLoading(false)

        toast.success('Certificado Actualizado Exitosamente!', {
          duration: 4000,
          position: 'top-center'
        })

        // Notificar éxito al componente padre para refrescar datos
        onSuccess()

        // Limpiar formulario
        resetForm()

        // Delay antes de cerrar para que el toast sea visible
        setTimeout(() => {
          onClose()
        }, 500)
      }
    } catch (error: any) {
      setLoading(false)
      console.error('Error al guardar los datos del certificado:', error)

      // Verificar si es un error de archivo duplicado (409)
      if (error.response && error.response.status === 409) {
        toast.error(
          error.response.data.error ||
            'El archivo con este nombre ya existe. Por favor, renombre el archivo e intente nuevamente.',
          {
            duration: 5000,
            position: 'top-center'
          }
        )
      } else {
        toast.error('Error al actualizar el certificado. Intenta nuevamente.', {
          duration: 4000,
          position: 'top-center'
        })
      }
    }
  }
  return (
    <>
      <Toaster />
      <Loader loading={loading} />
      
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'visible'
          }
        }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            position: 'relative',
            textAlign: 'center',
            py: 3
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
            <Update sx={{ fontSize: 28, mr: 1 }} />
            <Typography variant="h5" fontWeight="bold">
              Actualizar Certificado
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Sube el nuevo certificado y actualiza las fechas de calibración
          </Typography>
          
          <IconButton
            onClick={onClose}
            disabled={loading}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        {loading && (
          <LinearProgress 
            sx={{ 
              height: 3,
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#10b981'
              }
            }} 
          />
        )}

        <DialogContent sx={{ p: 4 }}>
          {/* File Upload Section */}
          <Box mb={4}>
            <Box display="flex" alignItems="center" mb={2}>
              <Description sx={{ color: '#10b981', mr: 1 }} />
              <Typography variant="h6" fontWeight="600" sx={{ color: '#1f2937' }}>
                Certificado PDF
              </Typography>
            </Box>
            
            <DropZone
              elevation={0}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
              sx={{
                borderColor: isDragOver ? '#10b981' : '#d1d5db',
                backgroundColor: isDragOver ? '#f0fdf4' : '#f9fafb',
                transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isDragOver ? '0 8px 25px rgba(16, 185, 129, 0.2)' : 'none'
              }}
            >
              <input
                id="file-input"
                key={fileInputKey}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              
              <CloudUpload 
                sx={{ 
                  fontSize: 48, 
                  color: selectedFileName ? '#10b981' : isDragOver ? '#10b981' : '#9ca3af',
                  mb: 2,
                  transition: 'color 0.3s ease'
                }} 
              />
              
              {selectedFileName ? (
                <Box>
                  <Typography variant="body1" fontWeight="600" sx={{ color: '#10b981', mb: 1 }}>
                    ✓ Archivo seleccionado
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#374151' }}>
                    {selectedFileName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6b7280', mt: 1, display: 'block' }}>
                    Haz clic para cambiar el archivo
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Typography 
                    variant="body1" 
                    fontWeight="600" 
                    sx={{ 
                      color: isDragOver ? '#10b981' : '#374151', 
                      mb: 1,
                      transition: 'color 0.3s ease'
                    }}
                  >
                    {isDragOver ? '¡Suelta el archivo aquí!' : 'Arrastra tu archivo PDF aquí'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    o haz clic para seleccionar
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#9ca3af', mt: 1, display: 'block' }}>
                    Máximo 10MB • Solo archivos PDF
                  </Typography>
                </Box>
              )}
            </DropZone>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Dates Section */}
          <Box>
            <Box display="flex" alignItems="center" mb={3}>
              <CalendarToday sx={{ color: '#10b981', mr: 1 }} />
              <Typography variant="h6" fontWeight="600" sx={{ color: '#1f2937' }}>
                Fechas de Calibración
              </Typography>
            </Box>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Box display="flex" flexDirection="column" gap={3}>
                <DatePickerContainer>
                  <DatePicker
                    label="Fecha de Calibración"
                    value={previousDate ? new Date(previousDate) : null}
                    onChange={handleChangeCalibrationDate}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: 'outlined'
                      }
                    }}
                  />
                </DatePickerContainer>

                <DatePickerContainer>
                  <DatePicker
                    label="Próxima Fecha de Calibración"
                    value={nextDate ? new Date(nextDate) : null}
                    onChange={(e) => setNextDate(e ? new Date(e as Date).toISOString() : '')}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: 'outlined'
                      }
                    }}
                  />
                </DatePickerContainer>
              </Box>
            </LocalizationProvider>

            {previousDate && nextDate && (
              <Alert 
                severity="info" 
                sx={{ 
                  mt: 2, 
                  borderRadius: '12px',
                  '& .MuiAlert-icon': {
                    color: '#10b981'
                  }
                }}
              >
                <Typography variant="body2">
                  <strong>Período de calibración:</strong> {' '}
                  {Math.round((new Date(nextDate).getTime() - new Date(previousDate).getTime()) / (1000 * 60 * 60 * 24 * 365))} año(s)
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={onClose}
            disabled={loading}
            variant="outlined"
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              borderColor: '#d1d5db',
              color: '#374151',
              '&:hover': {
                borderColor: '#9ca3af',
                backgroundColor: '#f9fafb'
              }
            }}
          >
            Cancelar
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={loading || !file || !previousDate || !nextDate}
            variant="contained"
            startIcon={loading ? null : <CheckCircle />}
            sx={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              ml: 2,
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              },
              '&:disabled': {
                background: '#e5e7eb',
                color: '#9ca3af'
              }
            }}
          >
            {loading ? 'Actualizando...' : 'Actualizar Certificado'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default UpdateCertificateModal
