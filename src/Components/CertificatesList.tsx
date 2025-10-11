import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AxiosError, AxiosResponse, isAxiosError } from 'axios'
import { useStore } from '@nanostores/react'
import { userStore } from '../store/userStore'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Collapse,
  Fade,
  Tooltip,
  Alert
} from '@mui/material'

import Loader from './Loader2'
import { bigToast } from './ExcelManipulation/Utils'
import useAxiosPrivate from '@utils/use-axios-private'
import { 
  Download,
  Delete,
  CalendarToday,
  ExpandMore,
  ExpandLess,
  PictureAsPdf
} from '@mui/icons-material'
import PDFViewer from './PDFViewer'

interface Certificate {
  id: number
  calibrationDate: string
  filePath: string
}

interface CertificatesListProps {
  refreshTrigger?: number
}

function CertificatesList({ refreshTrigger }: CertificatesListProps) {
  const axiosPrivate = useAxiosPrivate()
  const { id } = useParams<{ id: string }>()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [certificateId, setCertificateId] = useState<number>(0)
  const [previewId, setPreviewId] = useState<number | null>(null)
  const [certificatePath, setCertificatePath] = useState<string>('')

  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const $userStore = useStore(userStore)

  // const years = certificates.map((certificate) => {
  //   const getYear = new Date(certificate.calibrationDate).getFullYear()
  //   return getYear
  // })

  // const uniqueYears = years.filter((value, index, self) => {
  //   return self.indexOf(value) === index
  // })

  useEffect(() => {
    const getCertificates = async () => {
      try {
        setLoading(true)
        const response = await axiosPrivate.get<Certificate[]>(
          `/certificateHistory/certificate/${id}`,
          {}
        )

        if (response.status === 200) {
          setCertificates(response.data)
          setLoading(false)
        }
      } catch (error) {
        setLoading(false)
        console.error('Error fetching certificates:', error)
      }
    }

    getCertificates()
  }, [id, refreshTrigger])

  const handleDownload = async (path: string) => {
    const filePath = path

    const partes = filePath.split('-')
    let resultado = ''

    if (partes.length > 1) {
      resultado = partes.slice(1).join('-')
    } else {
      resultado = filePath
    }

    try {
      const response: AxiosResponse<Blob> = await axiosPrivate.get(
        `/files/download/${filePath}`,
        {
          responseType: 'blob' // Indicar que esperamos una respuesta binaria
        }
      )

      if ((response.statusText = 'OK')) {
        // Crear un objeto URL para el archivo descargado
        const url = window.URL.createObjectURL(new Blob([response.data]))

        // Crear un enlace en el DOM para descargar el archivo
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', resultado) // Nombre del archivo a descargar
        document.body.appendChild(link)

        // Simular el clic en el enlace para iniciar la descarga
        link.click()

        // Liberar el objeto URL y eliminar el enlace después de la descarga
        window.URL.revokeObjectURL(url)
        document.body.removeChild(link)
      }
    } catch (error: any) {
      if (isAxiosError(error)) {
        // Manejo de errores de Axios
        const axiosError = error as AxiosError
        if (axiosError.response) {
          // La solicitud recibió una respuesta del servidor

          bigToast(
            `Error al descargar el archivo: ${axiosError.response.statusText}`,
            'error'
          )
        } else {
          bigToast(
            `Error al descargar el archivo: ${axiosError.message}`,
            'error'
          )
        }
      } else {
        bigToast(
          `Error desconocido al descargar el archivo: ${error.message}`,
          'error'
        )
      }
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await axiosPrivate.delete(
        `/certificateHistory/${id}`,
        {}
      )

      if (response.status === 200) {
        bigToast('Certificado eliminado con éxito', 'success')
        setCertificates(
          certificates.filter((certificate) => certificate.id !== id)
        )
      }
    } catch (error) {
      console.error('Error al eliminar el certificado:', error)
    }
  }

  const handleClickOpen = (id: number) => {
    setOpen(true)
    setCertificateId(id)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleConfirmDelete = () => {
    handleDelete(certificateId)
    handleClose()
  }

  const handlePreview = (certificate: Certificate) => {
    if (previewId === certificate.id) {
      setPreviewId(null) // Cerrar el preview si ya estaba abierto
      setCertificatePath('')
    } else {
      setPreviewId(certificate.id) // Abrir el preview para este certificado
      setCertificatePath(certificate.filePath)
    }
  }

  return (
    <>
      <Loader loading={loading} />
      
      {certificates.length === 0 ? (
        <Alert 
          severity="info" 
          sx={{ 
            borderRadius: '12px',
            backgroundColor: '#f0f9ff',
            border: '1px solid #bfdbfe',
            '& .MuiAlert-icon': {
              color: '#3b82f6'
            }
          }}
        >
          <Typography variant="body2">
            No hay certificados disponibles para este equipo.
          </Typography>
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {certificates.map((certificate, index) => (
            <Fade in={true} timeout={300 + index * 100} key={certificate.id}>
              <Card 
                elevation={0}
                sx={{ 
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    borderColor: '#10b981',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    {/* File Info */}
                    <Box display="flex" alignItems="center" flex={1}>
                      <Box 
                        sx={{ 
                          p: 1.5,
                          backgroundColor: '#fef2f2',
                          borderRadius: '8px',
                          mr: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <PictureAsPdf sx={{ color: '#dc2626', fontSize: 24 }} />
                      </Box>
                      
                      <Box flex={1}>
                        <Typography 
                          variant="body1" 
                          fontWeight="600" 
                          sx={{ 
                            color: '#1f2937',
                            mb: 0.5,
                            wordBreak: 'break-word'
                          }}
                        >
                          {certificate.filePath.split('-').slice(1).join('-') || certificate.filePath}
                        </Typography>
                        
                        <Box display="flex" alignItems="center" gap={1}>
                          <CalendarToday sx={{ fontSize: 16, color: '#6b7280' }} />
                          <Typography variant="body2" sx={{ color: '#6b7280' }}>
                            Fecha de Calibración: {new Date(certificate.calibrationDate).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Actions */}
                    <Box display="flex" alignItems="center" gap={1}>
                      <Tooltip title={previewId === certificate.id ? "Ocultar vista previa" : "Ver vista previa"}>
                        <IconButton
                          onClick={() => handlePreview(certificate)}
                          sx={{
                            color: previewId === certificate.id ? '#10b981' : '#6b7280',
                            backgroundColor: previewId === certificate.id ? '#f0fdf4' : 'transparent',
                            '&:hover': {
                              backgroundColor: '#f0fdf4',
                              color: '#10b981'
                            }
                          }}
                        >
                          {previewId === certificate.id ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Descargar certificado">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Download />}
                          onClick={() => handleDownload(certificate.filePath)}
                          sx={{
                            borderColor: '#10b981',
                            color: '#10b981',
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': {
                              borderColor: '#059669',
                              backgroundColor: '#f0fdf4',
                              color: '#059669'
                            }
                          }}
                        >
                          Descargar
                        </Button>
                      </Tooltip>

                      {$userStore.rol.some((role) => ['admin', 'metrologist'].includes(role)) && (
                        <Tooltip title="Eliminar certificado">
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Delete />}
                            onClick={() => handleClickOpen(certificate.id)}
                            sx={{
                              borderColor: '#dc2626',
                              color: '#dc2626',
                              borderRadius: '8px',
                              textTransform: 'none',
                              fontWeight: 600,
                              ml: 1,
                              '&:hover': {
                                borderColor: '#b91c1c',
                                backgroundColor: '#fef2f2',
                                color: '#b91c1c'
                              }
                            }}
                          >
                            Eliminar
                          </Button>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>

                  {/* PDF Preview */}
                  <Collapse in={previewId === certificate.id} timeout={300}>
                    <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #e5e7eb' }}>
                      <Box 
                        sx={{ 
                          backgroundColor: '#f8fafc',
                          borderRadius: '8px',
                          p: 2,
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        <PDFViewer path={certificatePath} buttons={false} />
                      </Box>
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>
            </Fade>
          ))}
        </Box>
      )}

      {/* Modern Delete Confirmation Dialog */}
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          fontWeight: 'bold',
          pb: 1,
          borderBottom: '1px solid #e5e7eb'
        }}>
          <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
            <Delete sx={{ color: '#dc2626' }} />
            <Typography variant="h6" fontWeight="bold">
              Confirmar Eliminación
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3, textAlign: 'center' }}>
          <DialogContentText sx={{ fontSize: '1rem', color: '#374151' }}>
            ¿Estás seguro de que quieres eliminar este certificado?
          </DialogContentText>
          <DialogContentText sx={{ fontSize: '0.875rem', color: '#6b7280', mt: 1 }}>
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={handleClose}
            variant="outlined"
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
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
            onClick={handleConfirmDelete}
            variant="contained"
            sx={{
              backgroundColor: '#dc2626',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              ml: 2,
              '&:hover': {
                backgroundColor: '#b91c1c'
              }
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default CertificatesList
