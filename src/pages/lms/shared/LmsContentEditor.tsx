import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress
} from '@mui/material'
import {
  CloudUpload as CloudUploadIcon,
  VideoLibrary as VideoLibraryIcon,
  YouTube as YouTubeIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Settings as SettingsIcon
} from '@mui/icons-material'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import './quill-custom.css'
import DOMPurify from 'dompurify'
import { useDropzone } from 'react-dropzone'
import LmsQuizManagement from '../admin/LmsQuizManagement'
import Swal from 'sweetalert2'

// Types
interface ContentModule {
  id: string
  title: string
  type: 'text' | 'video' | 'quiz'
  order: number
  content: {
    text?: string
    videoUrl?: string
    videoSource?: 'minio' | 'youtube'
    videoFile?: File
    description?: string
    // Quiz - NEW: Reference to quiz in LmsQuizManagement
    quizId?: number
    // DEPRECATED: Use quizId instead (legacy inline quiz editor)
    // @deprecated - Will be removed in future version
    quizConfig?: any
    // @deprecated - Will be removed in future version
    quizQuestions?: any[]
  }
}

interface VideoUploadProgress {
  file: File
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  url?: string
  error?: string
}

interface LmsContentEditorProps {
  modules: ContentModule[]
  onModulesChange: (modules: ContentModule[]) => void
  onSave?: () => void
  isLoading?: boolean
  hasUnsavedChanges?: boolean
  onUpdateLesson?: (params: { moduleId: string, lessonData: any }) => void
  onDeleteModule?: (moduleId: string) => void
  courseId?: string  // Nuevo: ID del curso para integración con quiz
}

// WYSIWYG Editor configuration
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'align': [] }],
    ['link', 'image', 'video'],
    ['blockquote', 'code-block'],
    ['clean']
  ]
}

const quillFormats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'list', 'bullet', 'indent',
  'align', 'link', 'image', 'video', 'blockquote', 'code-block'
]

const LmsContentEditor: React.FC<LmsContentEditorProps> = ({
  modules,
  onModulesChange,
  onSave,
  isLoading = false,
  hasUnsavedChanges = false,
  onUpdateLesson,
  onDeleteModule,
  courseId
}) => {
  const [selectedModule, setSelectedModule] = useState<ContentModule | null>(null)
  const [videoUploads, setVideoUploads] = useState<VideoUploadProgress[]>([])
  const [openModuleDialog, setOpenModuleDialog] = useState(false)
  const [newModule, setNewModule] = useState({
    title: '',
    type: 'text' as 'text' | 'video' | 'quiz',
    description: ''
  })
  const [draggedModule, setDraggedModule] = useState<string | null>(null)
  const [isSavingLesson, setIsSavingLesson] = useState(false)
  const [hasPendingChanges, setHasPendingChanges] = useState(false)
  const [openQuizManagement, setOpenQuizManagement] = useState(false)

  // Ref to track the current editor content to prevent spurious onChange events
  const editorContentRef = useRef<string>('')

  // Ref to track the debounce timeout for auto-save
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Update editorContentRef when selectedModule changes
  useEffect(() => {
    if (selectedModule?.content.text) {
      console.log('📝 Updating editor content ref:', selectedModule.content.text)
      editorContentRef.current = selectedModule.content.text
    } else {
      editorContentRef.current = ''
    }
    // Reset pending changes state when switching modules
    setHasPendingChanges(false)
    setIsSavingLesson(false)
  }, [selectedModule])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [])

  // Sync selectedModule with modules when modules change
  // This ensures that when the parent component updates modules (e.g., from API),
  // the selectedModule gets updated with the latest data
  useEffect(() => {
    if (selectedModule) {
      const updatedModule = modules.find(m => m.id === selectedModule.id)
      if (updatedModule) {
        console.log('🔍 Module sync check:', {
          selectedId: selectedModule.id,
          selectedContent: selectedModule.content.text,
          updatedContent: updatedModule.content.text,
          areEqual: JSON.stringify(updatedModule) === JSON.stringify(selectedModule)
        })
        if (JSON.stringify(updatedModule) !== JSON.stringify(selectedModule)) {
          console.log('🔄 Syncing selectedModule with updated data')
          setSelectedModule(updatedModule)
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modules])

  // Sanitize HTML content
  const sanitizeHtml = useCallback((html: string): string => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'img', 'video',
        'span', 'div'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'width', 'height', 'style', 'class',
        'target', 'rel', 'controls', 'autoplay', 'muted', 'loop'
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
    })
  }, [])

  // Convert YouTube URL to embed format
  const getYouTubeEmbedUrl = useCallback((url: string): string => {
    if (!url) return ''

    try {
      // Match various YouTube URL formats
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
      const match = url.match(regExp)

      if (match && match[2].length === 11) {
        const videoId = match[2]
        return `https://www.youtube.com/embed/${videoId}`
      }

      // If already an embed URL, return as is
      if (url.includes('/embed/')) {
        return url
      }

      return url
    } catch (error) {
      console.error('Error parsing YouTube URL:', error)
      return url
    }
  }, [])

  // Video upload handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        alert('Solo se permiten archivos de video')
        return
      }

      // Validate file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 100MB')
        return
      }

      const newUpload: VideoUploadProgress = {
        file,
        progress: 0,
        status: 'uploading'
      }

      setVideoUploads(prev => [...prev, newUpload])

      // Simulate upload progress (replace with actual MinIO upload)
      simulateVideoUpload(file)
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv']
    },
    multiple: true
  })

  const simulateVideoUpload = async (file: File) => {
    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200))
        setVideoUploads(prev => 
          prev.map(upload => 
            upload.file === file 
              ? { ...upload, progress }
              : upload
          )
        )
      }

      // Simulate processing
      setVideoUploads(prev => 
        prev.map(upload => 
          upload.file === file 
            ? { ...upload, status: 'processing' }
            : upload
        )
      )

      await new Promise(resolve => setTimeout(resolve, 2000))

      // Complete upload
      const videoUrl = URL.createObjectURL(file) // In real implementation, this would be the MinIO URL
      setVideoUploads(prev => 
        prev.map(upload => 
          upload.file === file 
            ? { ...upload, status: 'completed', url: videoUrl }
            : upload
        )
      )

      // Add video to selected module if applicable
      if (selectedModule && selectedModule.type === 'video') {
        updateModuleContent(selectedModule.id, {
          ...selectedModule.content,
          videoUrl,
          videoSource: 'minio' as const,
          videoFile: file
        })
      }

    } catch (error) {
      setVideoUploads(prev => 
        prev.map(upload => 
          upload.file === file 
            ? { ...upload, status: 'error', error: 'Error al subir el video' }
            : upload
        )
      )
    }
  }

  // YouTube URL validation
  const validateYouTubeUrl = (url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
    return youtubeRegex.test(url)
  }

  // Module management
  const addModule = () => {
    const module: ContentModule = {
      id: `temp_${Date.now()}`,
      title: newModule.title,
      type: newModule.type,
      order: modules.length,
      content: {
        description: newModule.description,
        ...(newModule.type === 'text' && { text: '' }),
        ...(newModule.type === 'video' && { videoUrl: '', videoSource: 'youtube' as const })
      }
    }

    onModulesChange([...modules, module])
    setNewModule({ title: '', type: 'text', description: '' })
    setOpenModuleDialog(false)
    setSelectedModule(module)
  }

  const deleteModule = async (moduleId: string) => {
    const moduleToDelete = modules.find(m => m.id === moduleId)

    const result = await Swal.fire({
      title: '¿Eliminar módulo?',
      html: `
        <div style="text-align: left;">
          <p>Estás a punto de eliminar el módulo:</p>
          <p><strong>${moduleToDelete?.title || 'Sin título'}</strong></p>
          <p style="color: #d32f2f; margin-top: 16px;">
            ⚠️ Esta acción no se puede deshacer. Se eliminará el módulo y todo su contenido.
          </p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#757575',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true
    })

    if (result.isConfirmed) {
      // Primero actualizar el estado local
      const updatedModules = modules.filter(m => m.id !== moduleId)
      onModulesChange(updatedModules)

      // Si el módulo seleccionado es el que se está eliminando, limpiar la selección
      if (selectedModule?.id === moduleId) {
        setSelectedModule(null)
      }

      // Si hay callback de eliminación y el módulo no es temporal, llamar al backend
      if (onDeleteModule) {
        onDeleteModule(moduleId)
      }

      // Mostrar mensaje de éxito
      Swal.fire({
        title: '¡Eliminado!',
        text: 'El módulo ha sido eliminado correctamente.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      })
    }
  }

  const updateModuleContent = (moduleId: string, content: ContentModule['content']) => {
    const updatedModules = modules.map(module =>
      module.id === moduleId
        ? { ...module, content }
        : module
    )
    onModulesChange(updatedModules)

    if (selectedModule?.id === moduleId) {
      setSelectedModule({ ...selectedModule, content })
    }

    // Auto-save the lesson content with debounce (only for existing modules)
    if (onUpdateLesson && moduleId && !moduleId.startsWith('temp_')) {
      // Mark that there are pending changes
      setHasPendingChanges(true)

      // Clear previous timeout
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }

      // Set new timeout for auto-save (2 seconds after user stops typing)
      updateTimeoutRef.current = setTimeout(async () => {
        const module = updatedModules.find(m => m.id === moduleId)
        if (module) {
          setIsSavingLesson(true)
          const lessonData = {
            title: module.title,
            type: module.type, // El backend espera 'type', no 'content_type'
            order_index: 0,
            content: module.content.text || '',
            video_url: module.content.videoUrl || null,
            is_mandatory: true
          }
          console.log('💾 Auto-saving lesson:', { moduleId, content: module.content.text })
          try {
            await onUpdateLesson({ moduleId, lessonData })
            setHasPendingChanges(false)
          } catch (error) {
            console.error('Error auto-saving:', error)
          } finally {
            setIsSavingLesson(false)
          }
        }
      }, 2000) // 2 seconds debounce
    }
  }

  const updateModuleTitle = (moduleId: string, title: string) => {
    const updatedModules = modules.map(module =>
      module.id === moduleId
        ? { ...module, title }
        : module
    )
    onModulesChange(updatedModules)
    
    if (selectedModule?.id === moduleId) {
      setSelectedModule({ ...selectedModule, title })
    }
  }

  // Drag and drop for reordering
  const handleDragStart = (moduleId: string) => {
    setDraggedModule(moduleId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetModuleId: string) => {
    e.preventDefault()
    
    if (!draggedModule || draggedModule === targetModuleId) {
      setDraggedModule(null)
      return
    }

    const draggedIndex = modules.findIndex(m => m.id === draggedModule)
    const targetIndex = modules.findIndex(m => m.id === targetModuleId)

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedModule(null)
      return
    }

    const newModules = [...modules]
    const [draggedItem] = newModules.splice(draggedIndex, 1)
    newModules.splice(targetIndex, 0, draggedItem)

    // Update order
    const reorderedModules = newModules.map((module, index) => ({
      ...module,
      order: index
    }))

    onModulesChange(reorderedModules)
    setDraggedModule(null)
  }

  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <VideoLibraryIcon />
      case 'text':
        return <EditIcon />
      case 'quiz':
        return <EditIcon />
      default:
        return <EditIcon />
    }
  }

  const getModuleTypeLabel = (type: string) => {
    switch (type) {
      case 'video':
        return 'Video'
      case 'text':
        return 'Texto'
      case 'quiz':
        return 'Quiz'
      default:
        return 'Texto'
    }
  }

  return (
    <Grid container spacing={3}>
      {/* Module List */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader
            title="Módulos del Curso"
            action={
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setOpenModuleDialog(true)}
              >
                Agregar
              </Button>
            }
          />
          <CardContent>
            <List>
              {modules
                .sort((a, b) => a.order - b.order)
                .map((module) => (
                  <ListItem
                    key={module.id}
                    draggable
                    onDragStart={() => handleDragStart(module.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, module.id)}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      cursor: 'pointer',
                      backgroundColor: selectedModule?.id === module.id ? 'primary.light' : 'background.paper',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                    onClick={() => {
                      console.log('📌 Module clicked:', {
                        id: module.id,
                        title: module.title,
                        content: module.content.text
                      })
                      setSelectedModule(module)
                    }}
                  >
                    <ListItemIcon>
                      <DragIndicatorIcon sx={{ cursor: 'grab' }} />
                    </ListItemIcon>
                    <ListItemIcon>
                      {getModuleIcon(module.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={module.title}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={getModuleTypeLabel(module.type)}
                            size="small"
                          />
                        </Box>
                      }
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteModule(module.id)
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItem>
                ))}
              {modules.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <EditIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography color="text.secondary">
                    No hay módulos creados
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Agrega tu primer módulo para comenzar
                  </Typography>
                </Box>
              )}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Content Editor */}
      <Grid item xs={12} md={8}>
        {selectedModule ? (
          <Card>
            <CardHeader
              title={
                <TextField
                  variant="standard"
                  value={selectedModule.title}
                  onChange={(e) => updateModuleTitle(selectedModule.id, e.target.value)}
                  sx={{ fontSize: '1.25rem', fontWeight: 500 }}
                />
              }
              subheader={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <span>{`Tipo: ${getModuleTypeLabel(selectedModule.type)}`}</span>
                  {hasPendingChanges && !selectedModule.id.startsWith('temp_') && (
                    <Chip
                      label="Guardando en 2s..."
                      size="small"
                      color="warning"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  )}
                  {isSavingLesson && (
                    <Chip
                      icon={<CircularProgress size={12} sx={{ color: 'white' }} />}
                      label="Guardando..."
                      size="small"
                      color="primary"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  )}
                  {!hasPendingChanges && !isSavingLesson && !selectedModule.id.startsWith('temp_') && (
                    <Chip
                      label="Guardado"
                      size="small"
                      color="success"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
              }
            />
            <CardContent>
              {/* Text Content Editor */}
              {selectedModule.type === 'text' && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Editor de Contenido
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <ReactQuill
                      key={selectedModule.id}
                      theme="snow"
                      value={selectedModule.content.text || ''}
                      onChange={(content) => {
                        console.log('✏️ Editor onChange fired:', content)
                        const sanitizedContent = sanitizeHtml(content)
                        updateModuleContent(selectedModule.id, {
                          ...selectedModule.content,
                          text: sanitizedContent
                        })
                      }}
                      modules={quillModules}
                      formats={quillFormats}
                      style={{ height: '300px', marginBottom: '50px' }}
                    />
                  </Box>
                  
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Descripción del módulo"
                    value={selectedModule.content.description || ''}
                    onChange={(e) =>
                      updateModuleContent(selectedModule.id, {
                        ...selectedModule.content,
                        description: e.target.value
                      })
                    }
                    sx={{ mt: 2 }}
                  />
                </Box>
              )}

              {/* Video Content Editor */}
              {selectedModule.type === 'video' && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Configuración de Video
                  </Typography>
                  
                  {/* Video Source Selection */}
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Fuente del Video</InputLabel>
                    <Select
                      value={selectedModule.content.videoSource || 'youtube'}
                      label="Fuente del Video"
                      onChange={(e) =>
                        updateModuleContent(selectedModule.id, {
                          ...selectedModule.content,
                          videoSource: e.target.value as 'minio' | 'youtube'
                        })
                      }
                    >
                      <MenuItem value="youtube">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <YouTubeIcon />
                          YouTube
                        </Box>
                      </MenuItem>
                      <MenuItem value="minio">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CloudUploadIcon />
                          Subir Video
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>

                  {/* YouTube URL Input */}
                  {selectedModule.content.videoSource === 'youtube' && (
                    <TextField
                      fullWidth
                      label="URL de YouTube"
                      value={selectedModule.content.videoUrl || ''}
                      onChange={(e) => {
                        const url = e.target.value
                        updateModuleContent(selectedModule.id, {
                          ...selectedModule.content,
                          videoUrl: url
                        })
                      }}
                      error={selectedModule.content.videoUrl ? !validateYouTubeUrl(selectedModule.content.videoUrl) : false}
                      helperText={
                        selectedModule.content.videoUrl && !validateYouTubeUrl(selectedModule.content.videoUrl)
                          ? "URL de YouTube no válida"
                          : "Ingresa la URL completa del video de YouTube"
                      }
                      sx={{ mb: 2 }}
                    />
                  )}

                  {/* Video Upload */}
                  {selectedModule.content.videoSource === 'minio' && (
                    <Box>
                      <Box
                        {...getRootProps()}
                        sx={{
                          border: '2px dashed',
                          borderColor: isDragActive ? 'primary.main' : 'divider',
                          borderRadius: 2,
                          p: 3,
                          textAlign: 'center',
                          cursor: 'pointer',
                          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
                          mb: 2
                        }}
                      >
                        <input {...getInputProps()} />
                        <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="h6" gutterBottom>
                          {isDragActive ? 'Suelta los archivos aquí' : 'Arrastra videos aquí o haz clic para seleccionar'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Formatos soportados: MP4, AVI, MOV, WMV, FLV, WebM, MKV
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Tamaño máximo: 100MB por archivo
                        </Typography>
                      </Box>

                      {/* Upload Progress */}
                      {videoUploads.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Subidas en Progreso
                          </Typography>
                          {videoUploads.map((upload, index) => (
                            <Box key={index} sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                                  {upload.file.name}
                                </Typography>
                                <Chip
                                  label={upload.status}
                                  size="small"
                                  color={
                                    upload.status === 'completed' ? 'success' :
                                    upload.status === 'error' ? 'error' : 'primary'
                                  }
                                />
                              </Box>
                              {upload.status === 'uploading' && (
                                <LinearProgress
                                  variant="determinate"
                                  value={upload.progress}
                                  sx={{ mb: 1 }}
                                />
                              )}
                              {upload.status === 'processing' && (
                                <LinearProgress sx={{ mb: 1 }} />
                              )}
                              {upload.status === 'error' && upload.error && (
                                <Alert severity="error" sx={{ mb: 1 }}>
                                  {upload.error}
                                </Alert>
                              )}
                              {upload.status === 'completed' && upload.url && (
                                <Alert severity="success" sx={{ mb: 1 }}>
                                  Video subido exitosamente
                                </Alert>
                              )}
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Video Preview */}
                  {selectedModule.content.videoUrl && validateYouTubeUrl(selectedModule.content.videoUrl) && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Vista Previa
                      </Typography>
                      <Box
                        component="iframe"
                        src={getYouTubeEmbedUrl(selectedModule.content.videoUrl)}
                        title="YouTube video preview"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        sx={{
                          width: '100%',
                          height: 300,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1
                        }}
                      />
                    </Box>
                  )}

                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Descripción del video"
                    value={selectedModule.content.description || ''}
                    onChange={(e) =>
                      updateModuleContent(selectedModule.id, {
                        ...selectedModule.content,
                        description: e.target.value
                      })
                    }
                  />
                </Box>
              )}

              {/* Quiz Content Editor */}
              {selectedModule.type === 'quiz' && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    Este módulo usa el sistema completo de gestión de quizzes con banco de preguntas,
                    analíticas y validación automática.
                  </Alert>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<SettingsIcon />}
                    onClick={() => setOpenQuizManagement(true)}
                    sx={{ mb: 2 }}
                  >
                    Abrir Editor de Quiz Completo
                  </Button>
                  {selectedModule.content.quizId && (
                    <Typography variant="body2" color="text.secondary">
                      Quiz ID: {selectedModule.content.quizId}
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <EditIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Selecciona un módulo para editar
              </Typography>
              <Typography color="text.secondary">
                O crea un nuevo módulo para comenzar
              </Typography>
            </CardContent>
          </Card>
        )}
      </Grid>

      {/* Add Module Dialog */}
      <Dialog
        open={openModuleDialog}
        onClose={() => setOpenModuleDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Agregar Nuevo Módulo</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título del módulo"
                value={newModule.title}
                onChange={(e) =>
                  setNewModule({ ...newModule, title: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Tipo de contenido</InputLabel>
                <Select
                  value={newModule.type}
                  label="Tipo de contenido"
                  onChange={(e) =>
                    setNewModule({
                      ...newModule,
                      type: e.target.value as 'text' | 'video' | 'quiz'
                    })
                  }
                >
                  <MenuItem value="text">Texto</MenuItem>
                  <MenuItem value="video">Video</MenuItem>
                  <MenuItem value="quiz">Quiz</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descripción"
                value={newModule.description}
                onChange={(e) =>
                  setNewModule({ ...newModule, description: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModuleDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={addModule}
            variant="contained"
            disabled={!newModule.title}
          >
            Agregar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quiz Management Dialog */}
      <Dialog
        open={openQuizManagement}
        onClose={() => setOpenQuizManagement(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle>
          Editor de Quiz: {selectedModule?.title}
          <IconButton
            onClick={() => setOpenQuizManagement(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <DeleteIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <LmsQuizManagement
            courseId={courseId ? parseInt(courseId) : undefined}
            moduleId={selectedModule?.id}
            initialQuizId={selectedModule?.content.quizId}
            onQuizSaved={(quizId) => {
              // Actualizar el módulo con el quizId guardado
              if (selectedModule) {
                updateModuleContent(selectedModule.id, {
                  ...selectedModule.content,
                  quizId
                })
              }
              setOpenQuizManagement(false)
            }}
            embedded={true}
          />
        </DialogContent>
      </Dialog>
    </Grid>
  )
}

export default LmsContentEditor