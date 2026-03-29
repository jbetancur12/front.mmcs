import React, { useEffect, useMemo, useState } from 'react'
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
  Quiz as QuizIcon
} from '@mui/icons-material'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import './quill-custom.css'
import LmsQuizManagement from '../admin/LmsQuizManagement'

export type LessonDraftType = 'text' | 'video' | 'quiz'
export type LessonResourceType = 'pdf' | 'document' | 'link'

export interface LessonResourceDraft {
  id: string
  title: string
  description?: string
  resourceType: LessonResourceType
  fileUrl?: string
  externalUrl?: string
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
    fileUrl: string
    externalUrl: string
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
  'bullet',
  'link',
  'blockquote',
  'code-block'
]

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
      fileUrl: '',
      externalUrl: ''
    }
  })
  const [editorNotice, setEditorNotice] = useState<string | null>(null)
  const [quizEditorLessonId, setQuizEditorLessonId] = useState<string | null>(null)

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
        fileUrl: '',
        externalUrl: ''
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
        fileUrl: resource.fileUrl || '',
        externalUrl: resource.externalUrl || ''
      }
    })
  }

  const handleSaveResource = () => {
    if (!selectedModule || !selectedLesson || !resourceDialog.lessonId) {
      return
    }

    const normalizedTitle = resourceDialog.values.title.trim()
    const normalizedFileUrl = resourceDialog.values.fileUrl.trim()
    const normalizedExternalUrl = resourceDialog.values.externalUrl.trim()

    if (!normalizedTitle) {
      setEditorNotice('Cada recurso necesita un título claro.')
      return
    }

    if (!normalizedFileUrl && !normalizedExternalUrl) {
      setEditorNotice('Agrega un enlace o una URL de archivo para el recurso.')
      return
    }

    const resourcePayload: LessonResourceDraft = {
      id: resourceDialog.editingResourceId || createTempId('resource'),
      title: normalizedTitle,
      description: resourceDialog.values.description.trim(),
      resourceType: resourceDialog.values.resourceType,
      fileUrl: normalizedFileUrl || undefined,
      externalUrl: normalizedExternalUrl || undefined,
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
        Estructura recomendada: crea una <strong>sección</strong>, agrega varias
        <strong> lecciones</strong> dentro de ella y luego adjunta
        <strong> recursos</strong> como PDFs, documentos o enlaces de apoyo.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h6">Secciones del curso</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Organiza el contenido por bloques temáticos.
                  </Typography>
                </Box>
                <Button size="small" startIcon={<AddIcon />} onClick={() => setModuleDialogOpen(true)}>
                  Sección
                </Button>
              </Stack>

              {modules.length === 0 ? (
                <Alert severity="info">Este curso aún no tiene secciones. Crea la primera para empezar.</Alert>
              ) : (
                <List disablePadding>
                  {modules.map((module) => (
                    <Paper key={module.id} variant={module.id === selectedModuleId ? 'elevation' : 'outlined'} sx={{ mb: 1 }}>
                      <ListItemButton onClick={() => setSelectedModuleId(module.id)}>
                        <ListItemIcon>
                          <SectionIcon color={module.id === selectedModuleId ? 'primary' : 'inherit'} />
                        </ListItemIcon>
                        <ListItemText
                          primary={module.title}
                          secondary={`${module.lessons.length} lección${module.lessons.length === 1 ? '' : 'es'}`}
                        />
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
                      </ListItemButton>
                    </Paper>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Card variant="outlined">
            <CardContent>
              {selectedModule ? (
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="overline" color="primary">
                      Sección {selectedModule.order}
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

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6">Lecciones de la sección</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Cada sección puede tener texto, video y quiz.
                      </Typography>
                    </Box>
                    <Button startIcon={<AddIcon />} onClick={() => setLessonDialogOpen(true)}>
                      Lección
                    </Button>
                  </Stack>

                  {selectedModule.lessons.length === 0 ? (
                    <Alert severity="info">Esta sección aún no tiene lecciones. Agrega la primera para editar contenido.</Alert>
                  ) : (
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
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

                      <Grid item xs={12} md={8}>
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
                              <ReactQuill
                                theme="snow"
                                modules={quillModules}
                                formats={quillFormats}
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
                                          videoSource: event.target.value as 'youtube' | 'minio'
                                        }
                                      }))
                                    }
                                  >
                                    <MenuItem value="youtube">YouTube</MenuItem>
                                    <MenuItem value="minio">Archivo alojado</MenuItem>
                                  </Select>
                                </FormControl>
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
                                  <Typography variant="subtitle1">Recursos adjuntos</Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Agrega PDFs, documentos o enlaces de apoyo.
                                  </Typography>
                                </Box>
                                <Button size="small" startIcon={<AddIcon />} onClick={openCreateResourceDialog}>
                                  Recurso
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
                                            secondary={resource.externalUrl || resource.fileUrl || resource.description || resourceTypeMeta[resource.resourceType].label}
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
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" spacing={1}>
          <Chip label={`${modules.length} secciones`} color="primary" variant="outlined" />
          <Chip label={`${modules.reduce((total, module) => total + module.lessons.length, 0)} lecciones`} variant="outlined" />
          <Chip label={`${modules.reduce((total, module) => total + module.lessons.reduce((resourceTotal, lesson) => resourceTotal + lesson.content.resources.length, 0), 0)} recursos`} variant="outlined" />
        </Stack>
        <Button variant="contained" onClick={onSave} disabled={isLoading || !hasUnsavedChanges}>
          {isLoading ? 'Guardando...' : hasUnsavedChanges ? 'Guardar curso' : 'Sin cambios'}
        </Button>
      </Box>

      <Dialog open={moduleDialogOpen} onClose={() => setModuleDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nueva sección</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
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
            <TextField fullWidth label="Título de la lección" value={lessonDraft.title} onChange={(event) => setLessonDraft((current) => ({ ...current, title: event.target.value }))} />
            <FormControl fullWidth>
              <InputLabel id="new-lesson-type-label">Tipo</InputLabel>
              <Select labelId="new-lesson-type-label" label="Tipo" value={lessonDraft.type} onChange={(event) => setLessonDraft((current) => ({ ...current, type: event.target.value as LessonDraftType }))}>
                {Object.entries(lessonTypeMeta).map(([value, meta]) => (
                  <MenuItem key={value} value={value}>{meta.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField fullWidth type="number" label="Duración estimada (min)" value={lessonDraft.estimatedMinutes} onChange={(event) => setLessonDraft((current) => ({ ...current, estimatedMinutes: Math.max(1, Number(event.target.value) || 1) }))} />
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
            <TextField fullWidth label="Título" value={resourceDialog.values.title} onChange={(event) => setResourceDialog((current) => ({ ...current, values: { ...current.values, title: event.target.value } }))} />
            <FormControl fullWidth>
              <InputLabel id="resource-type-label">Tipo de recurso</InputLabel>
              <Select labelId="resource-type-label" label="Tipo de recurso" value={resourceDialog.values.resourceType} onChange={(event) => setResourceDialog((current) => ({ ...current, values: { ...current.values, resourceType: event.target.value as LessonResourceType } }))}>
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="document">Documento</MenuItem>
                <MenuItem value="link">Enlace</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth label="URL del archivo" placeholder="https://..." value={resourceDialog.values.fileUrl} onChange={(event) => setResourceDialog((current) => ({ ...current, values: { ...current.values, fileUrl: event.target.value } }))} />
            <TextField fullWidth label="Enlace externo" placeholder="https://..." value={resourceDialog.values.externalUrl} onChange={(event) => setResourceDialog((current) => ({ ...current, values: { ...current.values, externalUrl: event.target.value } }))} />
            <TextField fullWidth multiline minRows={2} label="Descripción" value={resourceDialog.values.description} onChange={(event) => setResourceDialog((current) => ({ ...current, values: { ...current.values, description: event.target.value } }))} />
            <Alert severity="info">
              Usa <strong>URL del archivo</strong> para PDFs o documentos alojados y <strong>enlace externo</strong> cuando el material vive en otra plataforma.
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
