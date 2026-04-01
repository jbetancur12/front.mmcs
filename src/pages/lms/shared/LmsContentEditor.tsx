import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import {
  Add as AddIcon,
  Article as ArticleIcon,
  Delete as DeleteIcon,
  FolderOpen as SectionIcon,
  Link as LinkIcon,
  OndemandVideo as VideoIcon,
  PictureAsPdf as PdfIcon,
  Quiz as QuizIcon,
  UploadFile as UploadFileIcon
} from '@mui/icons-material'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import './quill-custom.css'
import LmsQuizManagement from '../admin/LmsQuizManagement'
import { lmsService } from '../../../services/lmsService'

export type LessonDraftType = 'text' | 'video' | 'quiz'
export type LessonResourceType = 'pdf' | 'document' | 'link'

export interface LessonResourceDraft {
  id: string
  title: string
  description?: string
  resourceType: LessonResourceType
  fileUrl?: string
  externalUrl?: string
  bucketName?: string
  objectKey?: string
  mimeType?: string
  fileSize?: number
  originalFilename?: string
  localFile?: File | null
  order: number
}

export interface ContentLessonDraft {
  id: string
  title: string
  type: LessonDraftType
  order: number
  estimatedMinutes: number
  content: {
    text?: string
    videoUrl?: string
    videoSource?: 'youtube' | 'minio'
    description?: string
    quizId?: number
    resources: LessonResourceDraft[]
  }
}

export interface ContentModuleDraft {
  id: string
  title: string
  description?: string
  order: number
  lessons: ContentLessonDraft[]
}

interface ResourceDraftDialogState {
  open: boolean
  editingResourceId: string | null
  lessonId: string | null
  values: {
    title: string
    description: string
    resourceType: LessonResourceType
    externalUrl: string
    localFile: File | null
    existingFileName: string
  }
}

interface LmsContentEditorProps {
  modules: ContentModuleDraft[]
  onModulesChange: (modules: ContentModuleDraft[]) => void
  onSave?: () => void
  isLoading?: boolean
  hasUnsavedChanges?: boolean
  onDeleteModule?: (moduleId: string) => void
  onDeleteLesson?: (lessonId: string) => void
  onDeleteResource?: (resourceId: string) => void
  courseId?: string
}

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'blockquote', 'code-block'],
    ['clean']
  ]
}

const quillFormats = [
  'header',
  'bold',
  'italic',
  'underline',
  'list',
  'link',
  'blockquote',
  'code-block'
]

interface QuillEditorProps {
  value: string
  onChange: (value: string) => void
}

const QuillEditor: React.FC<QuillEditorProps> = ({ value, onChange }) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const quillRef = useRef<Quill | null>(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!containerRef.current || quillRef.current) {
      return
    }

    const host = document.createElement('div')
    containerRef.current.appendChild(host)

    const quill = new Quill(host, {
      theme: 'snow',
      modules: quillModules,
      formats: quillFormats
    })

    quill.root.innerHTML = value || ''
    quill.on('text-change', () => {
      onChangeRef.current(quill.root.innerHTML)
    })

    quillRef.current = quill

    return () => {
      quillRef.current = null
      if (containerRef.current && host.parentNode === containerRef.current) {
        containerRef.current.removeChild(host)
      }
    }
  }, [value])

  useEffect(() => {
    const quill = quillRef.current
    if (!quill) {
      return
    }

    const nextValue = value || ''
    if (quill.root.innerHTML !== nextValue) {
      const selection = quill.getSelection()
      quill.root.innerHTML = nextValue
      if (selection) {
        quill.setSelection(selection)
      }
    }
  }, [value])

  return <Box className="quill-editor-shell" ref={containerRef} />
}

const lessonTypeMeta: Record<LessonDraftType, { label: string; helper: string; icon: React.ReactNode }> = {
  text: {
    label: 'Texto',
    helper: 'Úsalo para explicar conceptos, pasos o procedimientos.',
    icon: <ArticleIcon fontSize="small" />
  },
  video: {
    label: 'Video',
    helper: 'Ideal para demostraciones o clases grabadas.',
    icon: <VideoIcon fontSize="small" />
  },
  quiz: {
    label: 'Quiz',
    helper: 'Valida aprendizaje y permite aprobar la sección.',
    icon: <QuizIcon fontSize="small" />
  }
}

const resourceTypeMeta: Record<LessonResourceType, { label: string; icon: React.ReactNode }> = {
  pdf: {
    label: 'PDF',
    icon: <PdfIcon fontSize="small" />
  },
  document: {
    label: 'Documento',
    icon: <ArticleIcon fontSize="small" />
  },
  link: {
    label: 'Enlace',
    icon: <LinkIcon fontSize="small" />
  }
}

const createTempId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

const pluralize = (count: number, singular: string, plural?: string) =>
  `${count} ${count === 1 ? singular : plural || `${singular}s`}`

const LmsContentEditor: React.FC<LmsContentEditorProps> = ({
  modules,
  onModulesChange,
  onSave,
  isLoading = false,
  hasUnsavedChanges = false,
  onDeleteModule,
  onDeleteLesson,
  onDeleteResource,
  courseId
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(modules[0]?.id ?? null)
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(modules[0]?.lessons[0]?.id ?? null)
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false)
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false)
  const [moduleDraft, setModuleDraft] = useState({ title: '', description: '' })
  const [lessonDraft, setLessonDraft] = useState({
    title: '',
    type: 'text' as LessonDraftType,
    estimatedMinutes: 10,
    description: ''
  })
  const [resourceDialog, setResourceDialog] = useState<ResourceDraftDialogState>({
    open: false,
    editingResourceId: null,
    lessonId: null,
    values: {
      title: '',
      description: '',
      resourceType: 'pdf',
      externalUrl: '',
      localFile: null,
      existingFileName: ''
    }
  })
  const [editorNotice, setEditorNotice] = useState<string | null>(null)
  const [quizEditorLessonId, setQuizEditorLessonId] = useState<string | null>(null)
  const [videoUploadState, setVideoUploadState] = useState<{
    lessonId: string | null
    isUploading: boolean
    progress: number
    fileName: string
  }>({
    lessonId: null,
    isUploading: false,
    progress: 0,
    fileName: ''
  })

  useEffect(() => {
    if (!modules.length) {
      setSelectedModuleId(null)
      setSelectedLessonId(null)
      return
    }

    const selectedModuleExists = modules.some((module) => module.id === selectedModuleId)
    const nextModuleId = selectedModuleExists ? selectedModuleId : modules[0].id
    setSelectedModuleId(nextModuleId)

    const nextModule = modules.find((module) => module.id === nextModuleId) ?? modules[0]
    if (!nextModule.lessons.length) {
      setSelectedLessonId(null)
      return
    }

    const selectedLessonExists = nextModule.lessons.some((lesson) => lesson.id === selectedLessonId)
    setSelectedLessonId(selectedLessonExists ? selectedLessonId : nextModule.lessons[0].id)
  }, [modules, selectedLessonId, selectedModuleId])

  const selectedModule = useMemo(
    () => modules.find((module) => module.id === selectedModuleId) ?? null,
    [modules, selectedModuleId]
  )

  const selectedLesson = useMemo(
    () => selectedModule?.lessons.find((lesson) => lesson.id === selectedLessonId) ?? null,
    [selectedLessonId, selectedModule]
  )

  const replaceModule = (moduleId: string, updater: (module: ContentModuleDraft) => ContentModuleDraft) => {
    onModulesChange(modules.map((module) => (module.id === moduleId ? updater(module) : module)))
  }

  const replaceLesson = (
    moduleId: string,
    lessonId: string,
    updater: (lesson: ContentLessonDraft) => ContentLessonDraft
  ) => {
    replaceModule(moduleId, (module) => ({
      ...module,
      lessons: module.lessons.map((lesson) => (lesson.id === lessonId ? updater(lesson) : lesson))
    }))
  }

  const updateSelectedLesson = (updater: (lesson: ContentLessonDraft) => ContentLessonDraft) => {
    if (!selectedModule || !selectedLesson) {
      return
    }

    replaceLesson(selectedModule.id, selectedLesson.id, updater)
  }

  const isPersistedCourse = Boolean(courseId && /^\d+$/.test(courseId))
  const isPersistedLesson = Boolean(selectedLesson && /^\d+$/.test(selectedLesson.id))
  const canUploadLessonVideo = isPersistedCourse && isPersistedLesson

  const handleUploadLessonVideo = async (file: File | null) => {
    if (!file) {
      return
    }

    if (!selectedLesson || !canUploadLessonVideo || !courseId) {
      setEditorNotice('Guarda el curso y la lección primero para subir el video al LMS.')
      return
    }

    try {
      setVideoUploadState({
        lessonId: selectedLesson.id,
        isUploading: true,
        progress: 0,
        fileName: file.name
      })

      const uploadResult = await lmsService.uploadLessonVideo(
        Number(courseId),
        Number(selectedLesson.id),
        file,
        (progressEvent) => {
          const total = progressEvent.total || file.size || 1
          const loaded = progressEvent.loaded || 0
          setVideoUploadState((current) => ({
            ...current,
            progress: Math.round((loaded / total) * 100)
          }))
        }
      )

      updateSelectedLesson((lesson) => ({
        ...lesson,
        type: 'video',
        content: {
          ...lesson.content,
          videoSource: 'minio',
          videoUrl: uploadResult.videoPath
        }
      }))

      const optimizationMessage = uploadResult.optimized
        ? ' El archivo fue optimizado antes de guardarse.'
        : ''
      setEditorNotice(`Video cargado correctamente en MinIO.${optimizationMessage}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No fue posible subir el video.'
      setEditorNotice(message)
    } finally {
      setVideoUploadState({
        lessonId: null,
        isUploading: false,
        progress: 0,
        fileName: ''
      })
    }
  }

  const handleAddModule = () => {
    if (!moduleDraft.title.trim()) {
      setEditorNotice('Agrega un título para crear la sección.')
      return
    }

    const newModule: ContentModuleDraft = {
      id: createTempId('module'),
      title: moduleDraft.title.trim(),
      description: moduleDraft.description.trim(),
      order: modules.length + 1,
      lessons: []
    }

    onModulesChange([...modules, newModule])
    setSelectedModuleId(newModule.id)
    setSelectedLessonId(null)
    setModuleDraft({ title: '', description: '' })
    setModuleDialogOpen(false)
    setEditorNotice('Sección creada. Ahora agrega la primera lección.')
  }

  const handleDeleteModule = (moduleId: string) => {
    onModulesChange(
      modules
        .filter((module) => module.id !== moduleId)
        .map((module, index) => ({ ...module, order: index + 1 }))
    )
    onDeleteModule?.(moduleId)
    setEditorNotice('Se eliminó la sección seleccionada.')
  }

  const handleAddLesson = () => {
    if (!selectedModule || !lessonDraft.title.trim()) {
      setEditorNotice('Selecciona una sección y agrega un título para la lección.')
      return
    }

    const newLesson: ContentLessonDraft = {
      id: createTempId('lesson'),
      title: lessonDraft.title.trim(),
      type: lessonDraft.type,
      order: selectedModule.lessons.length + 1,
      estimatedMinutes: Math.max(1, Number(lessonDraft.estimatedMinutes) || 1),
      content: {
        description: lessonDraft.description.trim(),
        text: lessonDraft.type === 'text' ? '<p>Nuevo contenido</p>' : '',
        videoUrl: '',
        videoSource: 'youtube',
        quizId: undefined,
        resources: []
      }
    }

    replaceModule(selectedModule.id, (module) => ({
      ...module,
      lessons: [...module.lessons, newLesson]
    }))
    setSelectedLessonId(newLesson.id)
    setLessonDraft({ title: '', type: 'text', estimatedMinutes: 10, description: '' })
    setLessonDialogOpen(false)
    setEditorNotice('Lección creada. Completa ahora su contenido.')
  }

  const handleDeleteLesson = (moduleId: string, lessonId: string) => {
    replaceModule(moduleId, (module) => ({
      ...module,
      lessons: module.lessons
        .filter((lesson) => lesson.id !== lessonId)
        .map((lesson, index) => ({ ...lesson, order: index + 1 }))
    }))
    onDeleteLesson?.(lessonId)
    setEditorNotice('Se eliminó la lección seleccionada.')
  }

  const openCreateResourceDialog = () => {
    if (!selectedLesson) {
      setEditorNotice('Selecciona una lección para agregar recursos.')
      return
    }

    setResourceDialog({
      open: true,
      editingResourceId: null,
      lessonId: selectedLesson.id,
      values: {
        title: '',
        description: '',
        resourceType: 'pdf',
        externalUrl: '',
        localFile: null,
        existingFileName: ''
      }
    })
  }

  const openEditResourceDialog = (resourceId: string) => {
    if (!selectedLesson) {
      return
    }

    const resource = selectedLesson.content.resources.find((item) => item.id === resourceId)
    if (!resource) {
      return
    }

    setResourceDialog({
      open: true,
      editingResourceId: resourceId,
      lessonId: selectedLesson.id,
      values: {
        title: resource.title,
        description: resource.description || '',
        resourceType: resource.resourceType,
        externalUrl: resource.externalUrl || '',
        localFile: null,
        existingFileName: resource.originalFilename || resource.fileUrl || ''
      }
    })
  }

  const handleSaveResource = () => {
    if (!selectedModule || !selectedLesson || !resourceDialog.lessonId) {
      return
    }

    const normalizedTitle = resourceDialog.values.title.trim()
    const normalizedExternalUrl = resourceDialog.values.externalUrl.trim()
    const isLinkResource = resourceDialog.values.resourceType === 'link'
    const hasUploadedFile = Boolean(resourceDialog.values.localFile)
    const hasExistingStoredFile = Boolean(
      resourceDialog.editingResourceId &&
      selectedLesson.content.resources.find((item) => item.id === resourceDialog.editingResourceId)?.objectKey
    )
    const hasLegacyFileUrl = Boolean(
      resourceDialog.editingResourceId &&
      selectedLesson.content.resources.find((item) => item.id === resourceDialog.editingResourceId)?.fileUrl
    )

    if (!normalizedTitle) {
      setEditorNotice('Cada recurso necesita un título claro.')
      return
    }

    if (isLinkResource && !normalizedExternalUrl) {
      setEditorNotice('Agrega el enlace externo para este recurso.')
      return
    }

    if (!isLinkResource && !hasUploadedFile && !hasExistingStoredFile && !hasLegacyFileUrl) {
      setEditorNotice('Sube un archivo para este recurso.')
      return
    }

    const resourcePayload: LessonResourceDraft = {
      id: resourceDialog.editingResourceId || createTempId('resource'),
      title: normalizedTitle,
      description: resourceDialog.values.description.trim(),
      resourceType: resourceDialog.values.resourceType,
      fileUrl: isLinkResource ? undefined : selectedLesson.content.resources.find((item) => item.id === resourceDialog.editingResourceId)?.fileUrl,
      externalUrl: isLinkResource ? normalizedExternalUrl || undefined : undefined,
      bucketName: isLinkResource ? undefined : selectedLesson.content.resources.find((item) => item.id === resourceDialog.editingResourceId)?.bucketName,
      objectKey: isLinkResource ? undefined : selectedLesson.content.resources.find((item) => item.id === resourceDialog.editingResourceId)?.objectKey,
      mimeType: isLinkResource ? undefined : (resourceDialog.values.localFile?.type || selectedLesson.content.resources.find((item) => item.id === resourceDialog.editingResourceId)?.mimeType),
      fileSize: isLinkResource ? undefined : (resourceDialog.values.localFile?.size || selectedLesson.content.resources.find((item) => item.id === resourceDialog.editingResourceId)?.fileSize),
      originalFilename: isLinkResource
        ? undefined
        : (resourceDialog.values.localFile?.name || selectedLesson.content.resources.find((item) => item.id === resourceDialog.editingResourceId)?.originalFilename),
      localFile: isLinkResource ? null : resourceDialog.values.localFile,
      order:
        resourceDialog.editingResourceId
          ? selectedLesson.content.resources.find((item) => item.id === resourceDialog.editingResourceId)?.order || 1
          : selectedLesson.content.resources.length + 1
    }

    updateSelectedLesson((lesson) => ({
      ...lesson,
      content: {
        ...lesson.content,
        resources: resourceDialog.editingResourceId
          ? lesson.content.resources.map((resource) =>
              resource.id === resourceDialog.editingResourceId ? resourcePayload : resource
            )
          : [...lesson.content.resources, resourcePayload]
      }
    }))

    setResourceDialog((current) => ({ ...current, open: false }))
    setEditorNotice(
      resourceDialog.editingResourceId
        ? 'Recurso actualizado dentro de la lección.'
        : 'Recurso agregado a la lección.'
    )
  }

  const handleDeleteResource = (resourceId: string) => {
    updateSelectedLesson((lesson) => ({
      ...lesson,
      content: {
        ...lesson.content,
        resources: lesson.content.resources
          .filter((resource) => resource.id !== resourceId)
          .map((resource, index) => ({ ...resource, order: index + 1 }))
      }
    }))
    onDeleteResource?.(resourceId)
    setEditorNotice('Recurso eliminado.')
  }

  const canOpenQuizBuilder = Boolean(
    selectedLesson &&
    !selectedLesson.id.startsWith('temp_') &&
    !selectedLesson.id.startsWith('lesson_')
  )

  return (
    <Stack spacing={3}>
      <Alert severity="info">
        Flujo recomendado dentro del contenido: crea una <strong>sección</strong>, agrega una o varias
        <strong> lecciones</strong> y usa <strong>recursos de apoyo</strong> para PDFs, documentos o enlaces
        complementarios.
      </Alert>

      <Stack spacing={3}>
        <Card variant="outlined">
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 2 }}>
              <Box>
                <Typography variant="h6">Secciones del curso</Typography>
                <Typography variant="body2" color="text.secondary">
                  Organiza el curso por bloques temáticos o momentos del aprendizaje.
                </Typography>
              </Box>
              <Button size="small" startIcon={<AddIcon />} onClick={() => setModuleDialogOpen(true)}>
                Agregar sección
              </Button>
            </Stack>

            {modules.length === 0 ? (
              <Alert severity="info">Este curso aún no tiene secciones. Crea la primera para empezar.</Alert>
            ) : (
              <Grid container spacing={2}>
                {modules.map((module) => (
                  <Grid key={module.id} item xs={12} md={6} xl={4}>
                    <Paper
                      variant={module.id === selectedModuleId ? 'elevation' : 'outlined'}
                      sx={{
                        p: 2,
                        borderColor: module.id === selectedModuleId ? 'primary.main' : 'divider',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedModuleId(module.id)}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
                          <SectionIcon color={module.id === selectedModuleId ? 'primary' : 'inherit'} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle2" noWrap>
                              {module.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {pluralize(module.lessons.length, 'lección', 'lecciones')}
                            </Typography>
                          </Box>
                        </Stack>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleDeleteModule(module.id)
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            {selectedModule ? (
              <Stack spacing={3}>
                <Box>
                  <Typography variant="overline" color="primary">
                    Sección {selectedModule.order}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Agrupa aquí las lecciones que pertenecen al mismo tema, unidad o momento del curso.
                  </Typography>
                  <TextField
                    fullWidth
                    label="Título de la sección"
                    value={selectedModule.title}
                    onChange={(event) =>
                      replaceModule(selectedModule.id, (module) => ({
                        ...module,
                        title: event.target.value
                      }))
                    }
                    sx={{ mt: 1, mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    label="Descripción de la sección"
                    value={selectedModule.description || ''}
                    onChange={(event) =>
                      replaceModule(selectedModule.id, (module) => ({
                        ...module,
                        description: event.target.value
                      }))
                    }
                  />
                </Box>

                <Divider />

                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
                  <Box>
                    <Typography variant="h6">Lecciones de la sección</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Puedes combinar texto, video y quiz dentro de la misma sección.
                    </Typography>
                  </Box>
                  <Button startIcon={<AddIcon />} onClick={() => setLessonDialogOpen(true)}>
                    Agregar lección
                  </Button>
                </Stack>

                {selectedModule.lessons.length === 0 ? (
                  <Alert severity="info">Esta sección aún no tiene lecciones. Agrega la primera para editar contenido.</Alert>
                ) : (
                  <Grid container spacing={2}>
                    <Grid item xs={12} xl={4}>
                      <List disablePadding>
                        {selectedModule.lessons.map((lesson) => (
                          <Paper key={lesson.id} variant={lesson.id === selectedLessonId ? 'elevation' : 'outlined'} sx={{ mb: 1 }}>
                            <ListItemButton onClick={() => setSelectedLessonId(lesson.id)}>
                              <ListItemIcon>{lessonTypeMeta[lesson.type].icon}</ListItemIcon>
                              <ListItemText
                                primary={lesson.title}
                                secondary={`${lessonTypeMeta[lesson.type].label} · ${lesson.estimatedMinutes} min`}
                              />
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  handleDeleteLesson(selectedModule.id, lesson.id)
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </ListItemButton>
                          </Paper>
                        ))}
                      </List>
                    </Grid>

                    <Grid item xs={12} xl={8}>
                      {selectedLesson ? (
                        <Stack spacing={2}>
                            <TextField
                              fullWidth
                              label="Título de la lección"
                              value={selectedLesson.title}
                              onChange={(event) =>
                                updateSelectedLesson((lesson) => ({
                                  ...lesson,
                                  title: event.target.value
                                }))
                              }
                            />
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                  <InputLabel id="lesson-type-label">Tipo de lección</InputLabel>
                                  <Select
                                    labelId="lesson-type-label"
                                    label="Tipo de lección"
                                    value={selectedLesson.type}
                                    onChange={(event) =>
                                      updateSelectedLesson((lesson) => ({
                                        ...lesson,
                                        type: event.target.value as LessonDraftType
                                      }))
                                    }
                                  >
                                    {Object.entries(lessonTypeMeta).map(([value, meta]) => (
                                      <MenuItem key={value} value={value}>
                                        {meta.label}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  type="number"
                                  label="Duración estimada (min)"
                                  value={selectedLesson.estimatedMinutes}
                                  onChange={(event) =>
                                    updateSelectedLesson((lesson) => ({
                                      ...lesson,
                                      estimatedMinutes: Math.max(1, Number(event.target.value) || 1)
                                    }))
                                  }
                                />
                              </Grid>
                            </Grid>

                            <Alert severity="info">{lessonTypeMeta[selectedLesson.type].helper}</Alert>

                            {selectedLesson.type === 'text' && (
                              <QuillEditor
                                value={selectedLesson.content.text || ''}
                                onChange={(value) =>
                                  updateSelectedLesson((lesson) => ({
                                    ...lesson,
                                    content: { ...lesson.content, text: value }
                                  }))
                                }
                              />
                            )}

                            {selectedLesson.type === 'video' && (
                              <Stack spacing={2}>
                                <FormControl fullWidth>
                                  <InputLabel id="video-source-label">Origen del video</InputLabel>
                                  <Select
                                    labelId="video-source-label"
                                    label="Origen del video"
                                    value={selectedLesson.content.videoSource || 'youtube'}
                                    onChange={(event) =>
                                      updateSelectedLesson((lesson) => ({
                                        ...lesson,
                                        content: {
                                          ...lesson.content,
                                          videoSource: event.target.value as 'youtube' | 'minio',
                                          videoUrl:
                                            event.target.value === 'youtube' &&
                                            (lesson.content.videoUrl || '').startsWith('course_')
                                              ? ''
                                              : lesson.content.videoUrl
                                        }
                                      }))
                                    }
                                  >
                                    <MenuItem value="youtube">YouTube</MenuItem>
                                    <MenuItem value="minio">Archivo alojado</MenuItem>
                                  </Select>
                                </FormControl>

                                {selectedLesson.content.videoSource === 'youtube' ? (
                                  <TextField
                                    fullWidth
                                    label="URL del video"
                                    placeholder="https://youtu.be/... o URL embebible"
                                    value={selectedLesson.content.videoUrl || ''}
                                    onChange={(event) =>
                                      updateSelectedLesson((lesson) => ({
                                        ...lesson,
                                        content: { ...lesson.content, videoUrl: event.target.value }
                                      }))
                                    }
                                  />
                                ) : (
                                  <Stack spacing={1.5}>
                                    <Alert severity={canUploadLessonVideo ? 'info' : 'warning'}>
                                      {canUploadLessonVideo
                                        ? 'Sube el archivo del video y el LMS lo optimizará antes de almacenarlo en MinIO.'
                                        : 'Guarda el curso y la lección primero para habilitar la carga del video alojado.'}
                                    </Alert>

                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                                      <Button
                                        variant="outlined"
                                        component="label"
                                        startIcon={<UploadFileIcon />}
                                        disabled={!canUploadLessonVideo || videoUploadState.isUploading}
                                      >
                                        {videoUploadState.isUploading && videoUploadState.lessonId === selectedLesson.id
                                          ? 'Subiendo video...'
                                          : selectedLesson.content.videoUrl
                                            ? 'Reemplazar video'
                                            : 'Subir video'}
                                        <input
                                          hidden
                                          type="file"
                                          accept="video/mp4,video/avi,video/mov,video/wmv,video/flv,video/webm,video/mkv"
                                          onChange={(event) => {
                                            const file = event.target.files?.[0] || null
                                            void handleUploadLessonVideo(file)
                                            event.target.value = ''
                                          }}
                                        />
                                      </Button>
                                      {selectedLesson.content.videoUrl && (
                                        <Chip
                                          color="success"
                                          variant="outlined"
                                          label={
                                            selectedLesson.content.videoUrl.startsWith('course_')
                                              ? 'Video alojado en MinIO'
                                              : 'Ruta de video configurada'
                                          }
                                        />
                                      )}
                                    </Stack>

                                    {videoUploadState.isUploading && videoUploadState.lessonId === selectedLesson.id && (
                                      <Box>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                                          {videoUploadState.fileName} · {videoUploadState.progress}%
                                        </Typography>
                                        <LinearProgress variant="determinate" value={videoUploadState.progress} />
                                      </Box>
                                    )}

                                    <TextField
                                      fullWidth
                                      label="Ruta interna del video"
                                      value={selectedLesson.content.videoUrl || ''}
                                      InputProps={{ readOnly: true }}
                                      helperText="Esta ruta se genera automáticamente cuando cargas el archivo al LMS."
                                    />
                                  </Stack>
                                )}
                              </Stack>
                            )}

                            {selectedLesson.type === 'quiz' && (
                              <Stack spacing={2}>
                                <Alert severity={canOpenQuizBuilder ? 'info' : 'warning'}>
                                  {canOpenQuizBuilder
                                    ? 'Crea preguntas nuevas dentro del quiz y usa el banco solo si te aporta reutilización.'
                                    : 'Guarda el curso primero para persistir esta lección y luego abrir el constructor del quiz.'}
                                </Alert>
                                <Button
                                  variant="contained"
                                  startIcon={<QuizIcon />}
                                  onClick={() => setQuizEditorLessonId(selectedLesson.id)}
                                  disabled={!canOpenQuizBuilder}
                                >
                                  {selectedLesson.content.quizId ? 'Editar quiz de la lección' : 'Crear quiz para esta lección'}
                                </Button>
                                {selectedLesson.content.quizId && (
                                  <Chip label={`Quiz asociado #${selectedLesson.content.quizId}`} color="success" variant="outlined" />
                                )}
                              </Stack>
                            )}

                            <Divider />

                            <Box>
                              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                <Box>
                                  <Typography variant="subtitle1">Recursos de apoyo</Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Adjunta PDFs, documentos o enlaces para complementar esta lección.
                                  </Typography>
                                </Box>
                                <Button size="small" startIcon={<AddIcon />} onClick={openCreateResourceDialog}>
                                  Agregar recurso
                                </Button>
                              </Stack>

                              {selectedLesson.content.resources.length === 0 ? (
                                <Alert severity="info">Esta lección aún no tiene recursos.</Alert>
                              ) : (
                                <List disablePadding>
                                  {selectedLesson.content.resources
                                    .slice()
                                    .sort((left, right) => left.order - right.order)
                                    .map((resource) => (
                                      <Paper key={resource.id} variant="outlined" sx={{ mb: 1 }}>
                                        <ListItemButton onClick={() => openEditResourceDialog(resource.id)}>
                                          <ListItemIcon>{resourceTypeMeta[resource.resourceType].icon}</ListItemIcon>
                                            <ListItemText
                                            primary={resource.title}
                                            secondary={
                                              resource.externalUrl ||
                                              resource.originalFilename ||
                                              resource.description ||
                                              resourceTypeMeta[resource.resourceType].label
                                            }
                                          />
                                          <Chip size="small" label={resourceTypeMeta[resource.resourceType].label} sx={{ mr: 1 }} />
                                          <IconButton
                                            edge="end"
                                            size="small"
                                            onClick={(event) => {
                                              event.stopPropagation()
                                              handleDeleteResource(resource.id)
                                            }}
                                          >
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </ListItemButton>
                                      </Paper>
                                    ))}
                                </List>
                              )}
                            </Box>
                          </Stack>
                      ) : (
                        <Alert severity="info">Selecciona una lección para editar su contenido.</Alert>
                      )}
                    </Grid>
                  </Grid>
                )}
              </Stack>
            ) : (
              <Alert severity="info">Selecciona una sección para editarla o crea la primera.</Alert>
            )}
          </CardContent>
        </Card>
      </Stack>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" spacing={1}>
          <Chip label={pluralize(modules.length, 'sección', 'secciones')} color="primary" variant="outlined" />
          <Chip label={pluralize(modules.reduce((total, module) => total + module.lessons.length, 0), 'lección', 'lecciones')} variant="outlined" />
          <Chip label={pluralize(modules.reduce((total, module) => total + module.lessons.reduce((resourceTotal, lesson) => resourceTotal + lesson.content.resources.length, 0), 0), 'recurso')} variant="outlined" />
        </Stack>
        <Button variant="contained" onClick={onSave} disabled={isLoading || !hasUnsavedChanges}>
          {isLoading ? 'Guardando cambios...' : hasUnsavedChanges ? 'Guardar cambios del contenido' : 'Sin cambios por guardar'}
        </Button>
      </Box>

      <Dialog open={moduleDialogOpen} onClose={() => setModuleDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nueva sección</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              Usa una sección para agrupar varias lecciones relacionadas dentro del mismo bloque del curso.
            </Alert>
            <TextField fullWidth label="Título de la sección" value={moduleDraft.title} onChange={(event) => setModuleDraft((current) => ({ ...current, title: event.target.value }))} />
            <TextField fullWidth multiline minRows={3} label="Descripción" value={moduleDraft.description} onChange={(event) => setModuleDraft((current) => ({ ...current, description: event.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModuleDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleAddModule}>Crear sección</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={lessonDialogOpen} onClose={() => setLessonDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nueva lección</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              Crea primero la lección y luego completa su contenido, recursos o quiz desde el editor principal.
            </Alert>
            <TextField fullWidth label="Título de la lección" value={lessonDraft.title} onChange={(event) => setLessonDraft((current) => ({ ...current, title: event.target.value }))} />
            <FormControl fullWidth>
              <InputLabel id="new-lesson-type-label">Tipo</InputLabel>
              <Select labelId="new-lesson-type-label" label="Tipo" value={lessonDraft.type} onChange={(event) => setLessonDraft((current) => ({ ...current, type: event.target.value as LessonDraftType }))}>
                {Object.entries(lessonTypeMeta).map(([value, meta]) => (
                  <MenuItem key={value} value={value}>{meta.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField fullWidth type="number" label="Duración estimada (min)" helperText="Usa una estimación corta y realista para orientar al alumno." value={lessonDraft.estimatedMinutes} onChange={(event) => setLessonDraft((current) => ({ ...current, estimatedMinutes: Math.max(1, Number(event.target.value) || 1) }))} />
            <TextField fullWidth multiline minRows={2} label="Descripción breve" value={lessonDraft.description} onChange={(event) => setLessonDraft((current) => ({ ...current, description: event.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLessonDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleAddLesson}>Crear lección</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={resourceDialog.open} onClose={() => setResourceDialog((current) => ({ ...current, open: false }))} fullWidth maxWidth="sm">
        <DialogTitle>{resourceDialog.editingResourceId ? 'Editar recurso adjunto' : 'Nuevo recurso adjunto'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              Usa recursos para materiales de apoyo. El contenido principal debe vivir en la lección.
            </Alert>
            <TextField fullWidth label="Título" value={resourceDialog.values.title} onChange={(event) => setResourceDialog((current) => ({ ...current, values: { ...current.values, title: event.target.value } }))} />
            <FormControl fullWidth>
              <InputLabel id="resource-type-label">Tipo de recurso</InputLabel>
              <Select labelId="resource-type-label" label="Tipo de recurso" value={resourceDialog.values.resourceType} onChange={(event) => setResourceDialog((current) => ({ ...current, values: { ...current.values, resourceType: event.target.value as LessonResourceType } }))}>
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="document">Documento</MenuItem>
                <MenuItem value="link">Enlace</MenuItem>
              </Select>
            </FormControl>
            {resourceDialog.values.resourceType === 'link' ? (
              <TextField fullWidth label="Enlace externo" placeholder="https://..." value={resourceDialog.values.externalUrl} onChange={(event) => setResourceDialog((current) => ({ ...current, values: { ...current.values, externalUrl: event.target.value } }))} />
            ) : (
              <Stack spacing={1}>
                <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
                  {resourceDialog.values.localFile ? 'Cambiar archivo' : 'Seleccionar archivo'}
                  <input
                    hidden
                    type="file"
                    accept={resourceDialog.values.resourceType === 'pdf' ? '.pdf,application/pdf' : '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'}
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null
                      setResourceDialog((current) => ({
                        ...current,
                        values: {
                          ...current.values,
                          localFile: file,
                          existingFileName: file?.name || current.values.existingFileName
                        }
                      }))
                    }}
                  />
                </Button>
                {(resourceDialog.values.localFile || resourceDialog.values.existingFileName) && (
                  <Alert severity="success">
                    Archivo listo: {resourceDialog.values.localFile?.name || resourceDialog.values.existingFileName}
                  </Alert>
                )}
              </Stack>
            )}
            <TextField fullWidth multiline minRows={2} label="Descripción" value={resourceDialog.values.description} onChange={(event) => setResourceDialog((current) => ({ ...current, values: { ...current.values, description: event.target.value } }))} />
            <Alert severity="info">
              Los PDFs y documentos se subirán al almacenamiento seguro del LMS. Usa enlace externo solo cuando el material viva fuera de la plataforma.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResourceDialog((current) => ({ ...current, open: false }))}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveResource}>Guardar recurso</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(quizEditorLessonId)} onClose={() => setQuizEditorLessonId(null)} fullWidth maxWidth="lg">
        <DialogTitle>Constructor del quiz de la lección</DialogTitle>
        <DialogContent dividers>
          {quizEditorLessonId && courseId ? (
            <LmsQuizManagement
              courseId={Number(courseId)}
              lessonId={Number(quizEditorLessonId)}
              initialQuizId={selectedLesson?.content.quizId}
              onQuizSaved={(quizId) => {
                updateSelectedLesson((lesson) => ({
                  ...lesson,
                  content: { ...lesson.content, quizId }
                }))
                setQuizEditorLessonId(null)
                setEditorNotice('Quiz guardado y asociado a esta lección.')
              }}
            />
          ) : (
            <Alert severity="warning">Guarda el curso primero para abrir el constructor del quiz.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuizEditorLessonId(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(editorNotice)} autoHideDuration={3500} onClose={() => setEditorNotice(null)} message={editorNotice} />
    </Stack>
  )
}

export default LmsContentEditor
