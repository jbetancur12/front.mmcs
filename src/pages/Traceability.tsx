import React, { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  TextField,
  Typography,
  Card,
  CardContent,
  Grid,
  Container,
  InputAdornment,
  Skeleton,
  Chip,
  CardActions,
  CardHeader,
  Fade,
  LinearProgress
} from '@mui/material'

import {
  CloudUpload,
  Visibility,

  Search,
  Delete,
  Edit,
  PictureAsPdf,
  CalendarToday,
  Clear
} from '@mui/icons-material'
import toast, { Toaster } from 'react-hot-toast'
import PDFViewer from '../Components/PDFViewer.js'
import { userStore } from '../store/userStore.js'
import { useStore } from '@nanostores/react'
import useAxiosPrivate from '@utils/use-axios-private.js'
import Swal from 'sweetalert2'

interface TraceabilityDocument {
  id: number
  name: string
  filePath: string
  createdAt: string
}

interface CreateDocumentForm {
  name: string
  file: File | null
}

const initialState: CreateDocumentForm = {
  name: '',
  file: null
}

const Traceability = () => {
  const axiosPrivate = useAxiosPrivate()
  const $userStore = useStore(userStore)
  const [traceabilities, setTraceabilities] = useState<TraceabilityDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [formData, setFormData] = useState<CreateDocumentForm>(initialState)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const [pdfModalOpen, setPdfModalOpen] = useState(false)
  const [selectedPdfDocument, setSelectedPdfDocument] = useState<TraceabilityDocument | null>(null)

  const [updateFile, setUpdateFile] = useState<File | null>(null)
  const [updateId, setUpdateId] = useState<number | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  useEffect(() => {
    const fetchTraceabilities = async () => {
      try {
        setLoading(true)
        const response = await axiosPrivate.get(`/traceabilities`, {})
        setTraceabilities(response.data)
      } catch (error) {
        console.error('Error al cargar las trazabilidades:', error)
        toast.error('Error al cargar las trazabilidades')
      } finally {
        setLoading(false)
      }
    }

    fetchTraceabilities()
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

  const handleOpenModal = () => {
    setOpenModal(true)
  }

  const handleCloseModal = () => {
    if (!isUploading) {
      setOpenModal(false)
      setFormData(initialState)
      setUploadProgress(0)
      setDragActive(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (validateFile(file)) {
        setFormData({
          ...formData,
          file
        })
        toast.success('Archivo PDF cargado correctamente')
      }
    }
  }

  const handleUpdateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (validateFile(file)) {
        setUpdateFile(file)
        toast.success('Nuevo archivo PDF cargado correctamente')
      }
    }
  }

  const handleUpdateDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (validateFile(file)) {
        setUpdateFile(file)
        toast.success('Nuevo archivo PDF cargado correctamente')
      }
    }
  }, [])

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Por favor ingresa un nombre para el documento')
      return
    }

    if (!formData.file) {
      toast.error('Por favor selecciona un archivo PDF')
      return
    }

    const formDataToSend = new FormData()
    formDataToSend.append('name', formData.name)
    formDataToSend.append('file', formData.file as Blob)

    try {
      setIsUploading(true)
      setUploadProgress(0)

      const response = await axiosPrivate.post(
        `/traceabilities`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
            setUploadProgress(progress)
          }
        }
      )

      toast.success('Documento de trazabilidad creado con éxito')
      setTraceabilities([...traceabilities, response.data])
      setFormData(initialState)
      setUploadProgress(0)
      handleCloseModal()
    } catch (error) {
      console.error('Error al crear la trazabilidad:', error)
      toast.error('Error al crear el documento')
    } finally {
      setIsUploading(false)
    }
  }

  const handleUpdate = async (id: number) => {
    setUpdateId(id)
  }

  const getCurrentDocument = () => {
    return traceabilities.find(doc => doc.id === updateId)
  }

  const handleUpdateSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    if (!updateFile || updateId === null) {
      toast.error('Por favor selecciona un archivo PDF para actualizar.')
      return
    }

    const formDataToSend = new FormData()
    formDataToSend.append('file', updateFile)

    try {
      setIsUploading(true)
      setUploadProgress(0)

      const response = await axiosPrivate.put(
        `/traceabilities/${updateId}`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
            setUploadProgress(progress)
          }
        }
      )

      toast.success('Documento actualizado con éxito')
      setTraceabilities(
        traceabilities.map((traceability) =>
          traceability.id === updateId ? response.data : traceability
        )
      )
      setUpdateId(null)
      setUpdateFile(null)
      setUploadProgress(0)
    } catch (error) {
      console.error('Error al actualizar el PDF:', error)
      toast.error('Error al actualizar el documento')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
    const document = traceabilities.find(doc => doc.id === id)
    if (!document) return

    const result = await Swal.fire({
      title: '¿Eliminar documento?',
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Documento:</strong> ${document.name}</p>
          <p><strong>Creado:</strong> ${formatDate(document.createdAt)}</p>
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
      // Show loading state
      Swal.fire({
        title: 'Eliminando...',
        text: 'Por favor espera mientras se elimina el documento',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading()
        }
      })

      const response = await axiosPrivate.delete(`/traceabilities/${id}`, {})

      if (response.status >= 200 && response.status < 300) {
        setTraceabilities(
          traceabilities.filter((traceability) => traceability.id !== id)
        )

        Swal.fire({
          title: '¡Eliminado!',
          text: 'El documento ha sido eliminado correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        })
      }
    } catch (error) {
      console.error('Error al eliminar la trazabilidad:', error)

      Swal.fire({
        title: 'Error',
        text: 'No se pudo eliminar el documento. Por favor intenta nuevamente.',
        icon: 'error',
        confirmButtonText: 'Entendido'
      })
    }
  }

  const openPDFModal = (document: TraceabilityDocument) => {
    setSelectedPdfDocument(document)
    setPdfModalOpen(true)
  }

  const closePDFModal = () => {
    setPdfModalOpen(false)
    setSelectedPdfDocument(null)
  }

  // Funciones para controles de PDF - COMENTADAS
  /*
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handleZoomIn = () => {
    if (zoomLevel < 200) {
      setZoomLevel(zoomLevel + 25)
    }
  }

  const handleZoomOut = () => {
    if (zoomLevel > 50) {
      setZoomLevel(zoomLevel - 25)
    }
  }

  const handleDownload = () => {
    if (selectedPdfDocument) {
      // Crear un enlace temporal para descargar el PDF
      const link = document.createElement('a')
      link.href = selectedPdfDocument.filePath
      link.download = selectedPdfDocument.name + '.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
  */





  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const filteredTraceabilities = useMemo(() => {
    if (!debouncedSearchTerm) return traceabilities

    return traceabilities.filter((traceability) =>
      traceability.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    )
  }, [traceabilities, debouncedSearchTerm])

  const highlightText = useCallback((text: string, highlight: string) => {
    if (!highlight) return text

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
      if (file.type === 'application/pdf') {
        setFormData({
          ...formData,
          file
        })
        toast.success('Archivo PDF cargado correctamente')
      } else {
        toast.error('Por favor selecciona un archivo PDF')
      }
    }
  }, [formData])

  const validateFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Solo se permiten archivos PDF')
      return false
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('El archivo no puede ser mayor a 10MB')
      return false
    }
    return true
  }

  const SkeletonCard = () => (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardHeader
        avatar={<Skeleton variant="circular" width={40} height={40} />}
        title={<Skeleton variant="text" width="60%" />}
        subheader={<Skeleton variant="text" width="40%" />}
      />
      <CardContent>
        <Skeleton variant="rectangular" height={60} />
      </CardContent>
      <CardActions>
        <Skeleton variant="rectangular" width={80} height={32} />
        <Skeleton variant="rectangular" width={80} height={32} />
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
      <PictureAsPdf sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h6" color="text.secondary" gutterBottom>
        No hay documentos de trazabilidad
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {debouncedSearchTerm
          ? `No se encontraron documentos que coincidan con "${debouncedSearchTerm}"`
          : 'Comienza creando tu primer documento de trazabilidad'
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
          startIcon={<CloudUpload />}
          onClick={handleOpenModal}
        >
          Crear Primer Documento
        </Button>
      )}
    </Box>
  )

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Toaster />

      {/* Header Section */}
      <Box component="header" sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PictureAsPdf sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Trazabilidades
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
            label="Buscar documentos"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1 }}
            aria-label="Campo de búsqueda de documentos de trazabilidad"
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
                searchTerm && !isSearching ? `${filteredTraceabilities.length} resultado(s) encontrado(s)` :
                  ""
            }
          />
          {$userStore.rol.some((role) => ['admin'].includes(role)) && (
            <Button
              variant="contained"
              startIcon={<CloudUpload />}
              onClick={handleOpenModal}
              sx={{ minWidth: 200 }}
              aria-label="Crear nuevo documento de trazabilidad"
            >
              Crear Documento
            </Button>
          )}
        </Box>

        {/* Results Count */}
        {!loading && traceabilities.length > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {filteredTraceabilities.length} de {traceabilities.length} documentos
          </Typography>
        )}
      </Box>

      {/* Content Area */}
      <Box component="main" role="main" aria-label="Lista de documentos de trazabilidad">
        {loading ? (
          <Grid container spacing={3}>
            {[...Array(6)].map((_, index) => (
              <Grid item xs={12} sm={6} lg={4} key={index}>
                <SkeletonCard />
              </Grid>
            ))}
          </Grid>
        ) : filteredTraceabilities.length === 0 ? (
          <EmptyState />
        ) : (
          <Grid container spacing={3}>
            {filteredTraceabilities.map((traceability) => (
              <Grid item xs={12} sm={6} lg={4} key={traceability.id}>
                <Fade in timeout={300}>
                  <Card
                    elevation={2}
                    role="article"
                    aria-label={`Documento de trazabilidad: ${traceability.name}`}
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
                    <CardHeader
                      avatar={
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <PictureAsPdf sx={{ color: 'white', fontSize: 20 }} />
                        </Box>
                      }
                      title={
                        <Typography variant="h6" noWrap>
                          {highlightText(traceability.name, debouncedSearchTerm)}
                        </Typography>
                      }
                      subheader={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarToday sx={{ fontSize: 14 }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(traceability.createdAt)}
                          </Typography>
                        </Box>
                      }
                    />

                    <CardContent sx={{ flexGrow: 1, pt: 0 }}>
                      <Chip
                        label="PDF"
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ mb: 2 }}
                      />
                    </CardContent>

                    <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => openPDFModal(traceability)}
                        aria-label={`Ver documento ${traceability.name} en pantalla completa`}
                      >
                        Vista Previa
                      </Button>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {$userStore.rol.some((role) => ['admin'].includes(role)) && (
                          <>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleUpdate(traceability.id)}
                              aria-label={`Editar documento ${traceability.name}`}
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(traceability.id)}
                              aria-label={`Eliminar documento ${traceability.name}`}
                            >
                              <Delete />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    </CardActions>


                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Modals */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        aria-labelledby="create-dialog-title"
        aria-describedby="create-dialog-description"
        PaperProps={{
          sx: { borderRadius: 3, overflow: 'hidden' }
        }}
      >
        {/* Header colorido */}
        <Box
          sx={{
            bgcolor: '#00BFA5',
            color: 'white',
            p: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CloudUpload sx={{ fontSize: 28 }} />
            <Box>
              <Typography variant="h6" id="create-dialog-title" sx={{ fontWeight: 600 }}>
                Crear Documento
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }} id="create-dialog-description">
                Sube el nuevo documento PDF de trazabilidad
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={handleCloseModal}
            sx={{ color: 'white' }}
            disabled={isUploading}
          >
            <Clear />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          {/* Sección Nombre */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Edit sx={{ color: '#00BFA5', fontSize: 20 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Nombre del Documento
              </Typography>
            </Box>
            <TextField
              fullWidth
              placeholder="Ingresa el nombre del documento"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={isUploading}
              error={!formData.name.trim() && formData.name !== ''}
              helperText={!formData.name.trim() && formData.name !== '' ? 'El nombre es requerido' : ''}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#f8f9fa'
                }
              }}
            />
          </Box>

          {/* Sección PDF */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PictureAsPdf sx={{ color: '#00BFA5', fontSize: 20 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Documento PDF
              </Typography>
            </Box>

            {/* Drag and Drop Area */}
            <Box
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              sx={{
                border: `2px dashed ${dragActive ? '#00BFA5' : '#e0e0e0'}`,
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                bgcolor: dragActive ? '#e0f2f1' : '#f8f9fa',
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: '#00BFA5',
                  bgcolor: '#e0f2f1'
                }
              }}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                type="file"
                accept=".pdf"
                id="file-input"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={isUploading}
              />

              <CloudUpload
                sx={{
                  fontSize: 48,
                  color: dragActive ? '#00BFA5' : '#9e9e9e',
                  mb: 2
                }}
              />

              {formData.file ? (
                <Box>
                  <Typography variant="h6" sx={{ color: '#00BFA5', mb: 1 }}>
                    ✓ Archivo seleccionado
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                    {formData.file.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Typography variant="h6" sx={{ mb: 1, color: '#424242' }}>
                    {dragActive ? 'Suelta tu archivo PDF aquí' : 'Arrastra tu archivo PDF aquí'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    o haz clic para seleccionar
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Máximo 10MB • Solo archivos PDF
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Upload Progress */}
          {isUploading && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ flex: 1 }}>
                  Subiendo archivo...
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
            onClick={handleCloseModal}
            disabled={isUploading}
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
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name.trim() || !formData.file || isUploading}
            startIcon={isUploading ? null : <CloudUpload />}
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
            {isUploading ? 'Creando Documento...' : 'Crear Documento'}
          </Button>
        </DialogActions>
      </Dialog>
      {updateId !== null && (
        <Dialog
          open={updateId !== null}
          onClose={() => !isUploading && setUpdateId(null)}
          maxWidth="sm"
          fullWidth
          aria-labelledby="update-dialog-title"
          aria-describedby="update-dialog-description"
          PaperProps={{
            sx: { borderRadius: 3, overflow: 'hidden' }
          }}
        >
          {/* Header colorido */}
          <Box
            sx={{
              bgcolor: '#FF9800',
              color: 'white',
              p: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Edit sx={{ fontSize: 28 }} />
              <Box>
                <Typography variant="h6" id="update-dialog-title" sx={{ fontWeight: 600 }}>
                  Actualizar Documento
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }} id="update-dialog-description">
                  Sube el nuevo archivo PDF para reemplazar el actual
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={() => {
                setUpdateId(null)
                setUpdateFile(null)
                setUploadProgress(0)
              }}
              sx={{ color: 'white' }}
              disabled={isUploading}
            >
              <Clear />
            </IconButton>
          </Box>

          <DialogContent sx={{ p: 3 }}>
            {/* Documento Actual */}
            {getCurrentDocument() && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PictureAsPdf sx={{ color: '#FF9800', fontSize: 20 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Documento Actual
                  </Typography>
                </Box>
                <Box sx={{
                  bgcolor: '#fff3e0',
                  border: '1px solid #ffcc02',
                  borderRadius: 2,
                  p: 2
                }}>
                  <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                    {getCurrentDocument()?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Creado: {formatDate(getCurrentDocument()?.createdAt || '')}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Nuevo Documento */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CloudUpload sx={{ color: '#FF9800', fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Nuevo Documento PDF
                </Typography>
              </Box>

              {/* Drag and Drop Area for Update */}
              <Box
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleUpdateDrop}
                sx={{
                  border: `2px dashed ${dragActive ? '#FF9800' : '#e0e0e0'}`,
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  bgcolor: dragActive ? '#fff3e0' : '#f8f9fa',
                  transition: 'all 0.2s ease-in-out',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: '#FF9800',
                    bgcolor: '#fff3e0'
                  }
                }}
                onClick={() => document.getElementById('update-file-input')?.click()}
              >
                <input
                  type="file"
                  accept=".pdf"
                  id="update-file-input"
                  onChange={handleUpdateFileChange}
                  style={{ display: 'none' }}
                  disabled={isUploading}
                />

                <CloudUpload
                  sx={{
                    fontSize: 48,
                    color: dragActive ? '#FF9800' : '#9e9e9e',
                    mb: 2
                  }}
                />

                {updateFile ? (
                  <Box>
                    <Typography variant="h6" sx={{ color: '#FF9800', mb: 1 }}>
                      ✓ Nuevo archivo seleccionado
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                      {updateFile.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {(updateFile.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 1, color: '#424242' }}>
                      {dragActive ? 'Suelta el nuevo archivo aquí' : 'Arrastra el nuevo archivo PDF aquí'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      o haz clic para seleccionar
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Máximo 10MB • Solo archivos PDF
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Upload Progress */}
            {isUploading && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    Actualizando documento...
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
                      bgcolor: '#FF9800'
                    }
                  }}
                />
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 3, pt: 0, gap: 2, justifyContent: 'flex-end' }}>
            <Button
              onClick={() => {
                setUpdateId(null)
                setUpdateFile(null)
                setUploadProgress(0)
              }}
              disabled={isUploading}
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
              onClick={handleUpdateSubmit}
              variant="contained"
              disabled={!updateFile || isUploading}
              startIcon={isUploading ? null : <Edit />}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                bgcolor: '#FF9800',
                '&:hover': {
                  bgcolor: '#F57C00'
                },
                '&:disabled': {
                  bgcolor: '#e0e0e0',
                  color: '#9e9e9e'
                }
              }}
            >
              {isUploading ? 'Actualizando Documento...' : 'Actualizar Documento'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* PDF Preview Modal */}
      <Dialog
        open={pdfModalOpen}
        onClose={closePDFModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            height: '90vh',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        {/* Header del Modal PDF */}
        <Box
          sx={{
            bgcolor: '#00BFA5',
            color: 'white',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PictureAsPdf sx={{ fontSize: 24 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {selectedPdfDocument?.name || 'Documento PDF'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Vista previa del documento
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={closePDFModal}
            sx={{ color: 'white' }}
          >
            <Clear />
          </IconButton>
        </Box>



        {/* Contenido del PDF */}
        <DialogContent
          sx={{
            p: 0,
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0
          }}
        >
          {selectedPdfDocument && (
            <Box sx={{
              flex: 1,
              width: '100%',
              minHeight: '600px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <PDFViewer
                path={selectedPdfDocument.filePath}
                bucket="traceabilities"
                view="preview"
              />
            </Box>
          )}
        </DialogContent>

        {/* Footer con botones */}
        <Box sx={{
          p: 2,
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: '#f8f9fa',
          flexShrink: 0
        }}>
          <Typography variant="body2" color="text.secondary">
            {selectedPdfDocument && `Creado: ${formatDate(selectedPdfDocument.createdAt)}`}
          </Typography>
          <Button
            variant="contained"
            onClick={closePDFModal}
            sx={{
              bgcolor: '#00BFA5',
              '&:hover': {
                bgcolor: '#00ACC1'
              }
            }}
          >
            Cerrar Vista Previa
          </Button>
        </Box>
      </Dialog>
    </Container>
  )
}

export default Traceability
