import React, { useCallback, useState, useEffect } from 'react'
import {
  Box,
  Typography,
  IconButton,
  Chip,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Tooltip,
  CardMedia
} from '@mui/material'
import {
  CloudUpload,
  Delete,
  Image,
  VideoFile,
  InsertDriveFile,
  Visibility,
  Refresh
} from '@mui/icons-material'
import { useDropzone } from 'react-dropzone'
import { MaintenanceFile } from '../../types/maintenance'

interface MaintenanceFileUploadProps {
  files: MaintenanceFile[]
  onFilesChange: (files: File[]) => void
  onFileRemove: (fileId: string) => void
  onFileView?: (file: MaintenanceFile) => void
  getFilePreviewUrl?: (file: MaintenanceFile) => Promise<string>
  onFileRetry?: (file: MaintenanceFile) => void
  maxFiles?: number
  maxSizeInMB?: number
  acceptedFileTypes?: string[]
  disabled?: boolean
  uploading?: boolean
  uploadProgress?: number
  failedFiles?: Set<string>
}

/**
 * MaintenanceFileUpload component provides drag-and-drop file upload functionality
 * with preview capabilities for images and videos
 *
 * @param files - Array of uploaded files
 * @param onFilesChange - Callback when new files are added
 * @param onFileRemove - Callback when a file is removed
 * @param onFileView - Callback when a file is viewed
 * @param maxFiles - Maximum number of files allowed
 * @param maxSizeInMB - Maximum file size in MB
 * @param acceptedFileTypes - Array of accepted file types
 * @param disabled - Whether the upload is disabled
 * @param uploading - Whether files are currently uploading
 * @param uploadProgress - Upload progress percentage
 */
const MaintenanceFileUpload: React.FC<MaintenanceFileUploadProps> = ({
  files = [],
  onFilesChange,
  onFileRemove,
  onFileView,
  getFilePreviewUrl,
  onFileRetry,
  maxFiles = 5,
  maxSizeInMB = 10,
  acceptedFileTypes = [
    'image/*',
    'video/*',
    'application/pdf',
    '.doc',
    '.docx'
  ],
  disabled = false,
  uploading = false,
  uploadProgress = 0,
  failedFiles = new Set()
}) => {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({})
  const surfaceSx = {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)'
  }

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      setError(null)

      // Check for file rejections
      if (fileRejections.length > 0) {
        const rejection = fileRejections[0]
        if (rejection.errors[0]?.code === 'file-too-large') {
          setError(`El archivo es muy grande. Tamaño máximo: ${maxSizeInMB}MB`)
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setError('Tipo de archivo no permitido')
        } else {
          setError('Error al cargar el archivo')
        }
        return
      }

      // Check total file count
      if (files.length + acceptedFiles.length > maxFiles) {
        setError(`Máximo ${maxFiles} archivos permitidos`)
        return
      }

      onFilesChange(acceptedFiles)
    },
    [files.length, maxFiles, maxSizeInMB, onFilesChange]
  )

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    maxSize: maxSizeInMB * 1024 * 1024,
    accept: acceptedFileTypes.reduce(
      (acc, type) => {
        acc[type] = []
        return acc
      },
      {} as Record<string, string[]>
    ),
    disabled: disabled || uploading,
    multiple: true,
    noClick: false,
    noKeyboard: false
  })

  // Generate image previews for uploaded files
  useEffect(() => {
    const generatePreviews = async () => {
      const newPreviews: Record<string, string> = {}

      for (const file of files) {
        if (!file.isImage || imagePreviews[file.id]) continue

        if (file.filePath) {
          newPreviews[file.id] = file.filePath
          continue
        }

        if (getFilePreviewUrl) {
          try {
            newPreviews[file.id] = await getFilePreviewUrl(file)
          } catch (previewError) {
            console.error('Error generating image preview:', previewError)
          }
        }
      }

      if (Object.keys(newPreviews).length > 0) {
        setImagePreviews(prev => ({ ...prev, ...newPreviews }))
      }
    }

    generatePreviews()
  }, [files, imagePreviews, getFilePreviewUrl])


  const formatFileSize = (bytes: number | undefined | null) => {
    if (bytes === undefined || bytes === null) return 'Tamaño no disponible'
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getLocalizedFileType = (file: MaintenanceFile) => {
    if (file.isImage || file.fileType === 'image') return 'Imagen'
    if (file.isVideo || file.fileType === 'video') return 'Video'
    if (file.fileType === 'audio') return 'Audio'
    if (file.fileType === 'document') return 'Documento'
    return 'Archivo'
  }

  const getFileIcon = (file: MaintenanceFile) => {
    if (file.isImage) return <Image color='primary' />
    if (file.isVideo) return <VideoFile color='secondary' />
    return <InsertDriveFile color='action' />
  }

  const getFileExtension = (file: MaintenanceFile) => {
    const fileName = file.originalName || file.fileName || ''
    const extension = fileName.split('.').pop()
    return extension ? extension.toUpperCase() : 'FILE'
  }

  const isPdfFile = (file: MaintenanceFile) => {
    const fileName = (file.originalName || file.fileName || '').toLowerCase()
    return file.fileType?.includes('pdf') || fileName.endsWith('.pdf')
  }

  const renderFilePreview = (file: MaintenanceFile) => {
    if (file.isImage && imagePreviews[file.id]) {
      return (
        <CardMedia
          component='img'
          sx={{
            height: 120,
            objectFit: 'cover',
            borderRadius: '12px 12px 0 0'
          }}
          image={imagePreviews[file.id]}
          alt={file.originalName || file.fileName || 'Vista previa'}
        />
      )
    }

    if (file.isVideo) {
      return (
        <Box
          sx={{
            height: 120,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            borderRadius: '12px 12px 0 0',
            background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.12) 0%, rgba(103, 58, 183, 0.18) 100%)'
          }}
        >
          <VideoFile sx={{ fontSize: 42, color: '#7b1fa2' }} />
          <Chip
            size='small'
            label='Vista previa en modal'
            sx={{ backgroundColor: 'rgba(255,255,255,0.85)', color: '#6a1b9a' }}
          />
        </Box>
      )
    }

    return (
      <Box
        sx={{
          height: 120,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          borderRadius: '12px 12px 0 0',
          background: isPdfFile(file)
            ? 'linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(229, 57, 53, 0.16) 100%)'
            : 'linear-gradient(135deg, rgba(109, 198, 98, 0.08) 0%, rgba(96, 125, 139, 0.16) 100%)'
        }}
      >
        {isPdfFile(file) ? (
          <InsertDriveFile sx={{ fontSize: 42, color: '#d32f2f' }} />
        ) : (
          <InsertDriveFile sx={{ fontSize: 42, color: '#546e7a' }} />
        )}
        <Chip
          size='small'
          label={getFileExtension(file)}
          sx={{
            backgroundColor: 'rgba(255,255,255,0.85)',
            color: isPdfFile(file) ? '#c62828' : '#455a64',
            fontWeight: 700
          }}
        />
      </Box>
    )
  }

  const handleDragEnter = () => setDragActive(true)
  const handleDragLeave = () => setDragActive(false)

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      open()
    }
  }

  // Handle file retry
  const handleFileRetry = (file: MaintenanceFile) => {
    if (onFileRetry) {
      onFileRetry(file)
    }
  }

  return (
    <Box>
      {/* Upload Area */}
      <Card
        {...getRootProps()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onKeyDown={handleKeyDown}
        tabIndex={disabled || uploading ? -1 : 0}
        role="button"
        aria-label="Área de carga de archivos. Presiona Enter o Espacio para seleccionar archivos"
        sx={{
          border: '2px dashed',
          borderColor: dragActive || isDragActive ? '#86c88a' : '#cbd5e1',
          backgroundColor: dragActive || isDragActive ? '#f0fdf4' : '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
          cursor: disabled || uploading ? 'not-allowed' : 'pointer',
          transition: 'border-color 0.2s ease, background-color 0.2s ease',
          '&:hover': {
            borderColor: disabled || uploading ? '#cbd5e1' : '#86c88a',
            backgroundColor: disabled || uploading ? '#ffffff' : '#f8fafc'
          },
          '&:focus': {
            outline: '2px solid #6dc662',
            outlineOffset: '2px'
          }
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <input {...getInputProps()} aria-hidden="true" />
          <Box
            sx={{
              backgroundColor: disabled || uploading ? '#f1f5f9' : '#eef6ee',
              borderRadius: '50%',
              width: 80,
              height: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: '1px solid #dbe4db'
            }}
          >
            <CloudUpload
              sx={{
                fontSize: 40,
                color: disabled || uploading ? 'grey.400' : '#2f7d32'
              }}
            />
          </Box>
          <Typography
            variant='h6'
            gutterBottom
            sx={{
              color: disabled || uploading ? 'text.disabled' : '#0f172a',
              fontWeight: 600
            }}
          >
            {isDragActive || dragActive
              ? 'Suelta los archivos aquí'
              : 'Arrastra archivos aquí o haz clic para seleccionar'}
          </Typography>
          <Typography 
            variant='body2' 
            color='text.secondary'
            sx={{ fontWeight: 500 }}
          >
            Máximo {maxFiles} archivos, {maxSizeInMB}MB cada uno
          </Typography>
          <Typography 
            variant='caption' 
            color='text.secondary'
            sx={{ 
              mt: 1,
              backgroundColor: '#f1f5f9',
              borderRadius: '12px',
              padding: '4px 12px',
              display: 'inline-block'
            }}
          >
            Formatos soportados: Imágenes, Videos, PDF, Word
          </Typography>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploading && (
        <Box 
          sx={{ 
            mt: 2,
            p: 2,
            ...surfaceSx
          }}
        >
          <Typography 
            variant='body2' 
            gutterBottom
            sx={{
              color: '#0f172a',
              fontWeight: 600
            }}
          >
            Subiendo archivos... {uploadProgress}%
          </Typography>
          <LinearProgress 
            variant='determinate' 
            value={uploadProgress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#e2e8f0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#2f7d32',
                borderRadius: 4
              }
            }}
          />
        </Box>
      )}

      {/* Error Display */}
      {error && (
        <Alert 
          severity='error' 
          sx={{ 
            mt: 2,
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid rgba(244, 67, 54, 0.2)'
          }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* File List */}
      {files.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography 
            variant='subtitle2' 
            gutterBottom
            sx={{
              fontWeight: 600,
              color: '#0f172a',
              mb: 2
            }}
          >
            Archivos ({files.length}/{maxFiles})
          </Typography>
          <Grid container spacing={2}>
            {files.map((file) => (
              <Grid item xs={12} sm={6} md={4} key={file.id}>
                <Card
                  sx={{
                    backgroundColor: failedFiles.has(file.id) ? '#fff7f7' : '#ffffff',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
                    border: failedFiles.has(file.id)
                      ? '1px solid rgba(244, 67, 54, 0.2)'
                      : '1px solid #e5e7eb',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                      borderColor: failedFiles.has(file.id) ? '#fca5a5' : '#cbd5e1',
                      boxShadow: failedFiles.has(file.id)
                        ? '0 4px 12px rgba(244, 67, 54, 0.12)'
                        : '0 4px 12px rgba(15, 23, 42, 0.08)'
                    }
                  }}
                >
                  {renderFilePreview(file)}

                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box display='flex' alignItems='center' gap={1} mb={1}>
                      {!file.isImage && getFileIcon(file)}
                      <Typography
                        variant='body2'
                        sx={{
                          flexGrow: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: failedFiles.has(file.id) ? 'error.main' : 'inherit'
                        }}
                      >
                        {file.originalName ||
                          file.fileName ||
                          'Archivo sin nombre'}
                      </Typography>
                      {failedFiles.has(file.id) && (
                        <Chip
                          size='small'
                          label='Error'
                          color='error'
                          variant='outlined'
                        />
                      )}
                    </Box>

                    <Typography
                      variant='caption'
                      color='text.secondary'
                      display='block'
                    >
                      {formatFileSize(file.fileSize)}
                    </Typography>

                    <Box
                      display='flex'
                      justifyContent='space-between'
                      alignItems='center'
                      mt={1}
                    >
                      <Chip
                        size='small'
                        label={getLocalizedFileType(file)}
                        sx={{
                          backgroundColor: '#eef6ee',
                          color: '#2f7d32',
                          borderRadius: '6px',
                          fontWeight: 500,
                          border: 'none'
                        }}
                      />

                      <Box display='flex' gap={0.5}>
                        {failedFiles.has(file.id) && onFileRetry && (
                          <Tooltip title='Reintentar subida'>
                            <IconButton
                              size='small'
                              onClick={() => handleFileRetry(file)}
                              disabled={uploading}
                              sx={{
                                backgroundColor: '#fff7ed',
                                color: '#c2410c',
                                borderRadius: '6px',
                                '&:hover': {
                                  backgroundColor: '#fed7aa'
                                },
                                '&:disabled': {
                                  background: 'rgba(0, 0, 0, 0.12)',
                                  color: 'rgba(0, 0, 0, 0.26)'
                                }
                              }}
                            >
                              <Refresh />
                            </IconButton>
                          </Tooltip>
                        )}

                        {onFileView && (
                          <Tooltip title='Ver archivo'>
                            <IconButton
                              size='small'
                              onClick={() => onFileView(file)}
                              sx={{
                                backgroundColor: '#eef6ee',
                                color: '#2f7d32',
                                borderRadius: '6px',
                                '&:hover': {
                                  backgroundColor: '#dbeedb'
                                }
                              }}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Tooltip title='Eliminar archivo'>
                          <IconButton
                            size='small'
                            onClick={() => onFileRemove(file.id)}
                            disabled={uploading}
                            sx={{
                              backgroundColor: '#fef2f2',
                              color: '#dc2626',
                              borderRadius: '6px',
                              '&:hover': {
                                backgroundColor: '#fee2e2'
                              },
                              '&:disabled': {
                                background: 'rgba(0, 0, 0, 0.12)',
                                color: 'rgba(0, 0, 0, 0.26)'
                              }
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  )
}

export default MaintenanceFileUpload
