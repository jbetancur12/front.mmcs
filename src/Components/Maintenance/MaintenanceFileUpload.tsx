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
          borderColor: dragActive || isDragActive ? 'primary.main' : 'grey.300',
          backgroundColor:
            dragActive || isDragActive ? 'action.hover' : 'background.paper',
          cursor: disabled || uploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: disabled || uploading ? 'grey.300' : 'primary.main',
            backgroundColor:
              disabled || uploading ? 'background.paper' : 'action.hover'
          }
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <input {...getInputProps()} />
          <CloudUpload
            sx={{
              fontSize: 48,
              color: disabled || uploading ? 'grey.400' : 'primary.main',
              mb: 2
            }}
          />
          <Typography
            variant='h6'
            gutterBottom
            color={disabled || uploading ? 'text.disabled' : 'text.primary'}
          >
            {isDragActive || dragActive
              ? 'Suelta los archivos aquí'
              : 'Arrastra archivos aquí o haz clic para seleccionar'}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Máximo {maxFiles} archivos, {maxSizeInMB}MB cada uno
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            Formatos soportados: Imágenes, Videos, PDF, Word
          </Typography>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploading && (
        <Box sx={{ mt: 2 }}>
          <Typography variant='body2' gutterBottom>
            Subiendo archivos... {uploadProgress}%
          </Typography>
          <LinearProgress variant='determinate' value={uploadProgress} />
        </Box>
      )}

      {/* Error Display */}
      {error && (
        <Alert severity='error' sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* File List */}
      {files.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant='subtitle2' gutterBottom>
            Archivos ({files.length}/{maxFiles})
          </Typography>
          <Grid container spacing={2}>
            {files.map((file) => (
              <Grid item xs={12} sm={6} md={4} key={file.id}>
                <Card variant='outlined'>
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
                        variant='outlined'
                        color='primary'
                      />

                      <Box>
                        {onFileView && (
                          <Tooltip title='Ver archivo'>
                            <IconButton
                              size='small'
                              onClick={() => onFileView(file)}
                              color='primary'
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Tooltip title='Eliminar archivo'>
                          <IconButton
                            size='small'
                            onClick={() => onFileRemove(file.id)}
                            color='error'
                            disabled={uploading}
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
