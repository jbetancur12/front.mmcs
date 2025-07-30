import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Chip,
  Divider,
  Alert
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Description as TextIcon,
  Quiz as QuizIcon,
  Save as SaveIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import LmsQuizEditor from './LmsQuizEditor'

interface CourseUnit {
  id: number
  title: string
  type: 'video' | 'text' | 'quiz'
  duration: string
  order: number
  content: {
    videoUrl?: string
    transcript?: string
    text?: string
    questions?: QuizQuestion[]
    description?: string
  }
}

interface QuizQuestion {
  id: number
  question: string
  type: 'true-false' | 'single-choice' | 'multiple-choice'
  options: string[]
  correctAnswer: number | number[] // Para single-choice es un número, para multiple-choice es un array
  explanation?: string
  points: number
}

interface Course {
  id: number
  title: string
  description: string
  category: string
  instructor: string
  duration: string
  isActive: boolean
  isPublic: boolean
  totalLessons: number
  enrolledStudents: number
  rating: number
  createdAt: string
  audience: {
    employees: boolean
    clients: boolean
  }
  units: CourseUnit[]
}

const LmsCourseContentEditor: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(0)
  const [selectedUnit, setSelectedUnit] = useState<CourseUnit | null>(null)
  const [openUnitDialog, setOpenUnitDialog] = useState(false)
  const [editingUnit, setEditingUnit] = useState<CourseUnit | null>(null)
  const [newUnit, setNewUnit] = useState({
    title: '',
    type: 'video' as 'video' | 'text' | 'quiz',
    duration: '',
    description: ''
  })

  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()

  // Mock data para el curso con unidades
  const mockCourse: Course = {
    id: 1,
    title: 'JavaScript Avanzado',
    description: 'Aprende conceptos avanzados de JavaScript',
    category: 'Programación',
    instructor: 'Dr. Carlos Méndez',
    duration: '8 horas',
    isActive: true,
    isPublic: false,
    totalLessons: 12,
    enrolledStudents: 45,
    rating: 4.8,
    createdAt: '2024-01-15',
    audience: {
      employees: true,
      clients: false
    },
    units: [
      {
        id: 1,
        title: 'Introducción a JavaScript',
        type: 'video',
        duration: '45 min',
        order: 1,
        content: {
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          transcript:
            'En esta unidad exploraremos los fundamentos básicos de JavaScript...',
          description:
            'Introducción a los conceptos fundamentales de JavaScript'
        }
      },
      {
        id: 2,
        title: 'Variables y Tipos de Datos',
        type: 'text',
        duration: '30 min',
        order: 2,
        content: {
          text: `# Variables y Tipos de Datos

## Declaración de Variables
En JavaScript, puedes declarar variables usando var, let o const...

## Tipos de Datos Primitivos
- **String**: Para texto
- **Number**: Para números
- **Boolean**: Para valores true/false
- **Undefined**: Variable sin valor asignado
- **Null**: Valor nulo intencional

## Ejemplos Prácticos
\`\`\`javascript
let nombre = "Juan";
const edad = 25;
let esEstudiante = true;
\`\`\``,
          description: 'Aprende sobre variables y tipos de datos en JavaScript'
        }
      },
      {
        id: 3,
        title: 'Quiz: Fundamentos de JavaScript',
        type: 'quiz',
        duration: '15 min',
        order: 3,
        content: {
          questions: [
            {
              id: 1,
              question:
                '¿Cuál es la forma correcta de declarar una variable en JavaScript?',
              type: 'single-choice',
              options: [
                'var nombre = "Juan"',
                'let nombre = "Juan"',
                'const nombre = "Juan"',
                'Todas las anteriores'
              ],
              correctAnswer: 3,
              explanation: 'Todas las formas son válidas en JavaScript moderno',
              points: 2
            },
            {
              id: 2,
              question: '¿JavaScript es un lenguaje de programación tipado?',
              type: 'single-choice',
              options: [
                'Sí, es fuertemente tipado',
                'No, es dinámicamente tipado'
              ],
              correctAnswer: 1,
              explanation:
                'JavaScript es dinámicamente tipado, no necesitas declarar tipos',
              points: 1
            },
            {
              id: 3,
              question:
                'JavaScript es un lenguaje de programación interpretado.',
              type: 'true-false',
              options: ['Falso', 'Verdadero'],
              correctAnswer: 1,
              explanation:
                'JavaScript es un lenguaje interpretado que se ejecuta en el navegador',
              points: 1
            },
            {
              id: 4,
              question: 'Selecciona todas las características de JavaScript:',
              type: 'multiple-choice',
              options: [
                'Es orientado a objetos',
                'Es funcional',
                'Es tipado estáticamente',
                'Es dinámicamente tipado'
              ],
              correctAnswer: [0, 1, 3],
              explanation:
                'JavaScript es orientado a objetos, funcional y dinámicamente tipado, pero no es tipado estáticamente',
              points: 3
            }
          ],
          description:
            'Evalúa tu conocimiento sobre los fundamentos de JavaScript'
        }
      }
    ]
  }

  // Query para obtener el curso
  const { data: course = mockCourse, isLoading } = useQuery<Course>(
    ['lms-course', courseId],
    async () => {
      // En el futuro, esto hará una llamada real a la API
      // const response = await axiosPrivate.get(`/lms/courses/${courseId}`)
      // return response.data
      return mockCourse
    }
  )

  // Mutación para guardar cambios
  const saveCourseMutation = useMutation(
    async (courseData: Course) => {
      return axiosPrivate.put(`/lms/courses/${courseId}`, courseData)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['lms-course', courseId])
        alert('Curso guardado exitosamente')
      },
      onError: (error: any) => {
        console.error('Error al guardar curso:', error)
        alert('Error al guardar el curso')
      }
    }
  )

  const handleAddUnit = () => {
    const unit: CourseUnit = {
      id: Date.now(),
      ...newUnit,
      order: course.units.length + 1,
      content: {
        description: newUnit.description,
        ...(newUnit.type === 'video' && {
          videoUrl: '',
          transcript: ''
        }),
        ...(newUnit.type === 'text' && {
          text: ''
        }),
        ...(newUnit.type === 'quiz' && {
          questions: []
        })
      }
    }

    const updatedCourse = {
      ...course,
      units: [...course.units, unit]
    }

    saveCourseMutation.mutate(updatedCourse)
    setNewUnit({ title: '', type: 'video', duration: '', description: '' })
    setOpenUnitDialog(false)
    setSelectedUnit(unit)
  }

  const handleDeleteUnit = (unitId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta unidad?')) {
      const updatedCourse = {
        ...course,
        units: course.units.filter((unit) => unit.id !== unitId)
      }
      saveCourseMutation.mutate(updatedCourse)
      if (selectedUnit?.id === unitId) {
        setSelectedUnit(null)
      }
    }
  }

  const handleUpdateUnit = (unitId: number, updatedUnit: CourseUnit) => {
    const updatedCourse = {
      ...course,
      units: course.units.map((unit) =>
        unit.id === unitId ? updatedUnit : unit
      )
    }
    saveCourseMutation.mutate(updatedCourse)
  }

  const getUnitIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <PlayIcon />
      case 'text':
        return <TextIcon />
      case 'quiz':
        return <QuizIcon />
      default:
        return <TextIcon />
    }
  }

  const getUnitTypeLabel = (type: string) => {
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

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh'
        }}
      >
        <Typography>Cargando curso...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton
          onClick={() => navigate('/lms/admin/courses')}
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant='h4' component='h1'>
            Editor de Contenido: {course.title}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {course.description}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Lista de unidades */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              title='Unidades del Curso'
              action={
                <Button
                  variant='contained'
                  size='small'
                  startIcon={<AddIcon />}
                  onClick={() => setOpenUnitDialog(true)}
                >
                  Agregar Unidad
                </Button>
              }
            />
            <CardContent>
              <List>
                {course.units.map((unit, index) => (
                  <ListItem
                    key={unit.id}
                    button
                    selected={selectedUnit?.id === unit.id}
                    onClick={() => setSelectedUnit(unit)}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.light',
                        color: 'primary.contrastText'
                      }
                    }}
                  >
                    <ListItemIcon>{getUnitIcon(unit.type)}</ListItemIcon>
                    <ListItemText
                      primary={unit.title}
                      secondary={
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <Chip
                            label={getUnitTypeLabel(unit.type)}
                            size='small'
                          />
                          <Typography variant='caption'>
                            {unit.duration}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size='small'
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingUnit(unit)
                          setOpenUnitDialog(true)
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size='small'
                        color='error'
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteUnit(unit.id)
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
                {course.units.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <TextIcon
                      sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }}
                    />
                    <Typography color='text.secondary'>
                      No hay unidades creadas
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Agrega tu primera unidad para comenzar
                    </Typography>
                  </Box>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Editor de contenido */}
        <Grid item xs={12} md={8}>
          {selectedUnit ? (
            <Card>
              <CardHeader
                title={`Editando: ${selectedUnit.title}`}
                subheader={`Tipo: ${getUnitTypeLabel(selectedUnit.type)}`}
                action={
                  <Button
                    variant='contained'
                    startIcon={<SaveIcon />}
                    onClick={() =>
                      handleUpdateUnit(selectedUnit.id, selectedUnit)
                    }
                  >
                    Guardar Cambios
                  </Button>
                }
              />
              <CardContent>
                <Tabs
                  value={activeTab}
                  onChange={(e, newValue) => setActiveTab(newValue)}
                >
                  <Tab label='Información Básica' />
                  <Tab label='Contenido' />
                  <Tab label='Vista Previa' />
                </Tabs>

                <Box sx={{ mt: 2 }}>
                  {activeTab === 0 && (
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label='Título de la unidad'
                          value={selectedUnit.title}
                          onChange={(e) =>
                            setSelectedUnit({
                              ...selectedUnit,
                              title: e.target.value
                            })
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label='Duración'
                          value={selectedUnit.duration}
                          onChange={(e) =>
                            setSelectedUnit({
                              ...selectedUnit,
                              duration: e.target.value
                            })
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Tipo de contenido</InputLabel>
                          <Select
                            value={selectedUnit.type}
                            label='Tipo de contenido'
                            onChange={(e) =>
                              setSelectedUnit({
                                ...selectedUnit,
                                type: e.target.value as
                                  | 'video'
                                  | 'text'
                                  | 'quiz'
                              })
                            }
                          >
                            <MenuItem value='video'>Video</MenuItem>
                            <MenuItem value='text'>Texto</MenuItem>
                            <MenuItem value='quiz'>Quiz</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label='Descripción'
                          value={selectedUnit.content.description || ''}
                          onChange={(e) =>
                            setSelectedUnit({
                              ...selectedUnit,
                              content: {
                                ...selectedUnit.content,
                                description: e.target.value
                              }
                            })
                          }
                        />
                      </Grid>
                    </Grid>
                  )}

                  {activeTab === 1 && (
                    <Box>
                      {selectedUnit.type === 'video' && (
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label='URL del video (YouTube, Vimeo, etc.)'
                              value={selectedUnit.content.videoUrl || ''}
                              onChange={(e) =>
                                setSelectedUnit({
                                  ...selectedUnit,
                                  content: {
                                    ...selectedUnit.content,
                                    videoUrl: e.target.value
                                  }
                                })
                              }
                              helperText='Soporta YouTube, Vimeo y enlaces directos a archivos de video'
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              multiline
                              rows={4}
                              label='Transcripción del video'
                              value={selectedUnit.content.transcript || ''}
                              onChange={(e) =>
                                setSelectedUnit({
                                  ...selectedUnit,
                                  content: {
                                    ...selectedUnit.content,
                                    transcript: e.target.value
                                  }
                                })
                              }
                            />
                          </Grid>
                        </Grid>
                      )}

                      {selectedUnit.type === 'text' && (
                        <TextField
                          fullWidth
                          multiline
                          rows={12}
                          label='Contenido del texto'
                          value={selectedUnit.content.text || ''}
                          onChange={(e) =>
                            setSelectedUnit({
                              ...selectedUnit,
                              content: {
                                ...selectedUnit.content,
                                text: e.target.value
                              }
                            })
                          }
                          helperText='Puedes usar Markdown para formatear el texto'
                        />
                      )}

                      {selectedUnit.type === 'quiz' && (
                        <Box>
                          <Typography variant='h6' gutterBottom>
                            Preguntas del Quiz
                          </Typography>
                          <LmsQuizEditor
                            questions={selectedUnit.content.questions || []}
                            onQuestionsChange={(questions) =>
                              setSelectedUnit({
                                ...selectedUnit,
                                content: {
                                  ...selectedUnit.content,
                                  questions
                                }
                              })
                            }
                          />
                        </Box>
                      )}
                    </Box>
                  )}

                  {activeTab === 2 && (
                    <Box>
                      <Typography variant='h6' gutterBottom>
                        Vista previa de: {selectedUnit.title}
                      </Typography>
                      <Divider sx={{ mb: 2 }} />

                      {selectedUnit.type === 'video' &&
                        selectedUnit.content.videoUrl && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant='subtitle2' gutterBottom>
                              Video:
                            </Typography>
                            <Box
                              component='iframe'
                              src={selectedUnit.content.videoUrl}
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

                      {selectedUnit.type === 'text' &&
                        selectedUnit.content.text && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant='subtitle2' gutterBottom>
                              Contenido:
                            </Typography>
                            <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                              <Typography
                                component='div'
                                sx={{
                                  whiteSpace: 'pre-wrap',
                                  fontFamily: 'monospace'
                                }}
                              >
                                {selectedUnit.content.text}
                              </Typography>
                            </Paper>
                          </Box>
                        )}

                      {selectedUnit.content.description && (
                        <Box>
                          <Typography variant='subtitle2' gutterBottom>
                            Descripción:
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {selectedUnit.content.description}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <EditIcon
                  sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
                />
                <Typography variant='h6' color='text.secondary' gutterBottom>
                  Selecciona una unidad para editar
                </Typography>
                <Typography color='text.secondary'>
                  O crea una nueva unidad para comenzar
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Dialog para agregar/editar unidad */}
      <Dialog
        open={openUnitDialog}
        onClose={() => setOpenUnitDialog(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>
          {editingUnit ? 'Editar Unidad' : 'Agregar Nueva Unidad'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Título de la unidad'
                value={newUnit.title}
                onChange={(e) =>
                  setNewUnit({ ...newUnit, title: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Duración'
                value={newUnit.duration}
                onChange={(e) =>
                  setNewUnit({ ...newUnit, duration: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de contenido</InputLabel>
                <Select
                  value={newUnit.type}
                  label='Tipo de contenido'
                  onChange={(e) =>
                    setNewUnit({
                      ...newUnit,
                      type: e.target.value as 'video' | 'text' | 'quiz'
                    })
                  }
                >
                  <MenuItem value='video'>Video</MenuItem>
                  <MenuItem value='text'>Texto</MenuItem>
                  <MenuItem value='quiz'>Quiz</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label='Descripción'
                value={newUnit.description}
                onChange={(e) =>
                  setNewUnit({ ...newUnit, description: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUnitDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleAddUnit}
            variant='contained'
            disabled={!newUnit.title || !newUnit.duration}
          >
            {editingUnit ? 'Actualizar' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LmsCourseContentEditor
