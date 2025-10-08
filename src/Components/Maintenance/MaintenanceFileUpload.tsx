import React, { useCallback, useState } from 'react'
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
  Tooltip
} from '@mui/material'
import {
  CloudUpload,
  Delete,
  Image,
  VideoFile,
  InsertDriveFile,
  Visibility
} from '@mui/icons-material'
import { useDropzone } from 'react-dropzone'
import { MaintenanceFile } from '../../types/maintenance'

interface MaintenanceFileUploadProps {
  files: MaintenanceFile[]
  onFilesChange: (files: File[]) => void
  onFileRemove: (fileId: string) => void
  onFileView?: (file: MaintenanceFile) => void
  maxFiles?: number
  maxSizeInMB?: number
  acceptedFileTypes?: string[]
  disabled?: boolean
  uploading?: boolean
  uploadProgress?: number
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
  uploadProgress = 0
}) => {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
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
    multiple: true
  })

  const formatFileSize = (bytes: number | undefined | null) => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (file: MaintenanceFile) => {
    if (file.isImage) return <Image color='primary' />
    if (file.isVideo) return <VideoFile color='secondary' />
    return <InsertDriveFile color='action' />
  }

  const handleDragEnter = () => setDragActive(true)
  const handleDragLeave = () => setDragActive(false)

  return (
    <Box>
      {/* Upload Area */}
      <Card
        {...getRootProps()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        sx={{
          border: '2px dashed',
          borderColor: dragActive || isDragActive ? '#6dc662' : 'rgba(109, 198, 98, 0.3)',
          background: dragActive || isDragActive 
            ? 'linear-gradient(135deg, rgba(109, 198, 98, 0.1) 0%, rgba(90, 176, 82, 0.1) 100%)'
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          cursor: disabled || uploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            borderColor: disabled || uploading ? 'rgba(109, 198, 98, 0.3)' : '#6dc662',
            background: disabled || uploading 
              ? 'rgba(255, 255, 255, 0.95)' 
              : 'linear-gradient(135deg, rgba(109, 198, 98, 0.05) 0%, rgba(90, 176, 82, 0.05) 100%)',
            transform: disabled || uploading ? 'none' : 'translateY(-2px)',
            boxShadow: disabled || uploading 
              ? '0 4px 20px rgba(0, 0, 0, 0.08)' 
              : '0 8px 30px rgba(109, 198, 98, 0.15)'
          }
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <input {...getInputProps()} />
          <Box
            sx={{
              background: disabled || uploading 
                ? 'rgba(158, 158, 158, 0.1)' 
                : 'linear-gradient(135deg, #6dc662 0%, #5ab052 100%)',
              borderRadius: '50%',
              width: 80,
              height: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: disabled || uploading 
                ? 'none' 
                : '0 4px 20px rgba(109, 198, 98, 0.3)'
            }}
          >
            <CloudUpload
              sx={{
                fontSize: 40,
                color: disabled || uploading ? 'grey.400' : 'white'
              }}
            />
          </Box>
          <Typography
            variant='h6'
            gutterBottom
            sx={{
              color: disabled || uploading ? 'text.disabled' : '#6dc662',
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
              background: 'rgba(109, 198, 98, 0.1)',
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
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(109, 198, 98, 0.1)'
          }}
        >
          <Typography 
            variant='body2' 
            gutterBottom
            sx={{
              color: '#6dc662',
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
              backgroundColor: 'rgba(109, 198, 98, 0.1)',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(135deg, #6dc662 0%, #5ab052 100%)',
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
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(244, 67, 54, 0.1)',
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
              color: '#6dc662',
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
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    border: '1px solid rgba(109, 198, 98, 0.1)',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 30px rgba(109, 198, 98, 0.15)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box display='flex' alignItems='center' gap={1} mb={1}>
                      {getFileIcon(file)}
                      <Typography
                        variant='body2'
                        sx={{
                          flexGrow: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {file.originalName ||
                          file.fileName ||
                          'Archivo sin nombre'}
                      </Typography>
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
                        label={file.fileType}
                        sx={{
                          background: 'linear-gradient(135deg, #6dc662 0%, #5ab052 100%)',
                          color: 'white',
                          borderRadius: '6px',
                          fontWeight: 500,
                          border: 'none'
                        }}
                      />

                      <Box>
                        {onFileView && (
                          <Tooltip title='Ver archivo'>
                            <IconButton
                              size='small'
                              onClick={() => onFileView(file)}
                              sx={{
                                background: 'rgba(109, 198, 98, 0.1)',
                                color: '#6dc662',
                                borderRadius: '6px',
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #6dc662 0%, #5ab052 100%)',
                                  color: 'white',
                                  transform: 'translateY(-1px)',
                                  boxShadow: '0 4px 12px rgba(109, 198, 98, 0.3)'
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
                              background: 'rgba(244, 67, 54, 0.1)',
                              color: '#f44336',
                              borderRadius: '6px',
                              transition: 'all 0.2s ease-in-out',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                                color: 'white',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)'
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
