import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  IconButton,
  Alert
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import LmsContentEditor from '../shared/LmsContentEditor'

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
  }
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
  modules: ContentModule[]
}

const LmsCourseContentEditor: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [isSaving, setIsSaving] = useState(false)

  const queryClient = useQueryClient()

  // Mock data para el curso con módulos
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
    modules: [
      {
        id: '1',
        title: 'Introducción a JavaScript',
        type: 'video',
        order: 0,
        content: {
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          videoSource: 'youtube',
          description: 'Introducción a los conceptos fundamentales de JavaScript'
        }
      },
      {
        id: '2',
        title: 'Variables y Tipos de Datos',
        type: 'text',
        order: 1,
        content: {
          text: `<h1>Variables y Tipos de Datos</h1>
<h2>Declaración de Variables</h2>
<p>En JavaScript, puedes declarar variables usando <strong>var</strong>, <strong>let</strong> o <strong>const</strong>...</p>
<h2>Tipos de Datos Primitivos</h2>
<ul>
<li><strong>String</strong>: Para texto</li>
<li><strong>Number</strong>: Para números</li>
<li><strong>Boolean</strong>: Para valores true/false</li>
<li><strong>Undefined</strong>: Variable sin valor asignado</li>
<li><strong>Null</strong>: Valor nulo intencional</li>
</ul>
<h2>Ejemplos Prácticos</h2>
<pre><code>let nombre = "Juan";
const edad = 25;
let esEstudiante = true;</code></pre>`,
          description: 'Aprende sobre variables y tipos de datos en JavaScript'
        }
      },
      {
        id: '3',
        title: 'Quiz: Fundamentos de JavaScript',
        type: 'quiz',
        order: 2,
        content: {
          description: 'Evalúa tu conocimiento sobre los fundamentos de JavaScript'
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
      setIsSaving(true)
      try {
        // In the future, this will make a real API call
        // return axiosPrivate.put(`/lms/courses/${courseId}`, courseData)
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
        return courseData
      } finally {
        setIsSaving(false)
      }
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

  const handleModulesChange = (modules: ContentModule[]) => {
    const updatedCourse = {
      ...course,
      modules
    }
    // Update local state immediately for better UX
    queryClient.setQueryData(['lms-course', courseId], updatedCourse)
  }

  const handleSave = () => {
    saveCourseMutation.mutate(course)
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
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant='h4' component='h1'>
            Editor de Contenido: {course.title}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {course.description}
          </Typography>
        </Box>
        <Button
          variant='contained'
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Guardando...' : 'Guardar Curso'}
        </Button>
      </Box>

      {/* Success/Error Messages */}
      {saveCourseMutation.isSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Curso guardado exitosamente
        </Alert>
      )}
      {saveCourseMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error al guardar el curso. Por favor, inténtalo de nuevo.
        </Alert>
      )}

      {/* Content Editor */}
      <Card>
        <CardHeader
          title="Contenido del Curso"
          subheader="Crea y organiza los módulos de tu curso con contenido de texto, video y quizzes"
        />
        <CardContent>
          <LmsContentEditor
            modules={course.modules}
            onModulesChange={handleModulesChange}
            onSave={handleSave}
            isLoading={isSaving}
          />
        </CardContent>
      </Card>
    </Box>
  )
}

export default LmsCourseContentEditor
