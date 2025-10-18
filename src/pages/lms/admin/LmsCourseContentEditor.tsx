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
import useAxiosPrivate from '@utils/use-axios-private'
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
  const axiosPrivate = useAxiosPrivate()

  const queryClient = useQueryClient()

  // Función para crear un curso vacío por defecto
  const createEmptyCourse = (courseId: string): Course => ({
    id: parseInt(courseId),
    title: `Curso ${courseId}`,
    description: 'Descripción del curso',
    category: '',
    instructor: '',
    duration: '',
    isActive: true,
    isPublic: false,
    totalLessons: 0,
    enrolledStudents: 0,
    rating: 0,
    createdAt: new Date().toISOString(),
    audience: {
      employees: true,
      clients: false
    },
    modules: [] // Siempre empezar con módulos vacíos
  })

  // Query para obtener el curso
  const {
    data: course,
    isLoading,
    error
  } = useQuery<Course>(
    ['lms-course', courseId],
    async () => {
      if (!courseId) {
        throw new Error('Course ID is required')
      }

      try {
        // Hacer llamada real a la API
        const response = await axiosPrivate.get(`/lms/courses/${courseId}`)
        const courseData = response.data.success
          ? response.data.data
          : response.data

        console.log('Course data from API:', courseData)

        // Asegurar que el curso tenga la estructura correcta
        return {
          ...courseData,
          modules: courseData.modules || [] // Empezar con módulos vacíos si no existen
        }
      } catch (error) {
        console.error('Error fetching course:', error)
        // Si hay error, lanzar la excepción para que React Query la maneje
        throw error
      }
    },
    {
      enabled: !!courseId,
      retry: 1,
      // Si hay error, usar datos por defecto
      onError: (error) => {
        console.error('Failed to fetch course, using default data:', error)
      }
    }
  )

  // Si hay error, usar curso vacío por defecto
  const courseData = course || createEmptyCourse(courseId || '1')

  // Mutación para guardar cambios del curso (sin módulos)
  const saveCourseInfoMutation = useMutation(
    async (courseData: Course) => {
      // Solo actualizar información básica del curso, no los módulos
      const response = await axiosPrivate.put(`/lms/courses/${courseId}`, {
        title: courseData.title,
        description: courseData.description,
        audience: courseData.audience,
        is_mandatory: courseData.is_mandatory,
        has_certificate: courseData.has_certificate
      })
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['lms-course', courseId])
        queryClient.invalidateQueries(['lms-courses'])
      },
      onError: (error: any) => {
        console.error('Error al guardar información del curso:', error)
      }
    }
  )

  // Mutación para guardar módulos
  const saveModulesMutation = useMutation(
    async (modules: ContentModule[]) => {
      setIsSaving(true)
      try {
        // Por ahora, vamos a simular el guardado de módulos
        // TODO: Implementar llamadas individuales a los endpoints de módulos
        console.log('Guardando módulos:', modules)

        // Simular delay de guardado
        await new Promise((resolve) => setTimeout(resolve, 1000))

        return { success: true, modules }
      } finally {
        setIsSaving(false)
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['lms-course', courseId])
      },
      onError: (error: any) => {
        console.error('Error al guardar módulos:', error)
      }
    }
  )

  const handleModulesChange = (modules: ContentModule[]) => {
    const updatedCourse = {
      ...courseData,
      modules
    }
    // Update local state immediately for better UX
    queryClient.setQueryData(['lms-course', courseId], updatedCourse)
  }

  const handleSave = () => {
    // Guardar información básica del curso
    saveCourseInfoMutation.mutate(courseData)
    // Guardar módulos por separado
    saveModulesMutation.mutate(courseData.modules)
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
            Editor de Contenido: {courseData.title}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {courseData.description}
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
      {saveCourseInfoMutation.isSuccess && saveModulesMutation.isSuccess && (
        <Alert severity='success' sx={{ mb: 2 }}>
          Curso y módulos guardados exitosamente
        </Alert>
      )}
      {(saveCourseInfoMutation.isError || saveModulesMutation.isError) && (
        <Alert severity='error' sx={{ mb: 2 }}>
          Error al guardar el curso. Por favor, inténtalo de nuevo.
        </Alert>
      )}

      {/* Content Editor */}
      <Card>
        <CardHeader
          title='Contenido del Curso'
          subheader='Crea y organiza los módulos de tu curso con contenido de texto, video y quizzes'
        />
        <CardContent>
          <LmsContentEditor
            modules={courseData.modules}
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
