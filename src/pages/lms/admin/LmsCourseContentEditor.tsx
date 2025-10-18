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
import { lmsService, type Course as BackendCourse } from '../../../services/lmsService'

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

// Declaración global para el timeout
declare global {
  interface Window {
    lessonUpdateTimeout: NodeJS.Timeout
  }
}

// Interface para el curso en el frontend (compatible con el componente)
interface FrontendCourse {
  id: number
  title: string
  description: string
  audience: {
    employees: boolean
    clients: boolean
  }
  is_mandatory?: boolean
  has_certificate?: boolean
  modules: ContentModule[]
}

const LmsCourseContentEditor: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const axiosPrivate = useAxiosPrivate()

  const queryClient = useQueryClient()

  // Función para crear un curso vacío por defecto
  const createEmptyCourse = (courseId: string): FrontendCourse => ({
    id: parseInt(courseId),
    title: `Curso ${courseId}`,
    description: 'Descripción del curso',
    audience: {
      employees: true,
      clients: false
    },
    is_mandatory: false,
    has_certificate: false,
    modules: [] // Siempre empezar con módulos vacíos
  })

  // Función para transformar el curso del backend al formato del frontend
  const transformCourseFromBackend = (backendCourse: BackendCourse): FrontendCourse => {
    // Transformar módulos del backend al formato del frontend
    const transformedModules: ContentModule[] = (backendCourse.modules || []).map((module, index) => {
      // Si el módulo tiene lecciones, usar la primera lección como contenido
      const firstLesson = module.lessons && module.lessons[0]

      // Determinar el tipo de contenido: si hay lección usar su 'type', sino 'text' por defecto
      const contentType = firstLesson?.type || 'text'

      console.log(`📦 Módulo "${module.title}":`, {
        hasLesson: !!firstLesson,
        type: firstLesson?.type,
        finalType: contentType,
        videoUrl: firstLesson?.video_url
      })

      return {
        id: module.id.toString(),
        title: module.title,
        type: contentType as 'text' | 'video' | 'quiz',
        order: module.order_index || index,
        content: {
          description: module.description || '',
          text: firstLesson?.content || '',
          videoUrl: firstLesson?.video_url || '',
          videoSource: firstLesson?.video_url ? 'youtube' : 'youtube' // Por defecto youtube
        }
      }
    })

    // Transformar audience del backend al formato del frontend
    const audienceMapping = {
      internal: { employees: true, clients: false },
      client: { employees: false, clients: true },
      both: { employees: true, clients: true }
    }

    return {
      id: backendCourse.id,
      title: backendCourse.title,
      description: backendCourse.description,
      audience: audienceMapping[backendCourse.audience] || { employees: true, clients: false },
      is_mandatory: backendCourse.is_mandatory,
      has_certificate: backendCourse.has_certificate,
      modules: transformedModules
    }
  }

  // Query para obtener el curso
  const {
    data: course,
    isLoading
  } = useQuery<FrontendCourse>(
    ['lms-course', courseId],
    async () => {
      if (!courseId) {
        throw new Error('Course ID is required')
      }

      try {
        // Hacer llamada real a la API
        const backendCourse = await lmsService.getCourse(parseInt(courseId))
        
        console.log('Course data from API:', backendCourse)

        // Transformar el curso del backend al formato del frontend
        return transformCourseFromBackend(backendCourse)
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
    async (courseData: FrontendCourse) => {
      // Transformar audience del frontend al formato del backend
      let backendAudience: 'internal' | 'client' | 'both' = 'internal'
      if (courseData.audience.employees && courseData.audience.clients) {
        backendAudience = 'both'
      } else if (courseData.audience.clients) {
        backendAudience = 'client'
      } else {
        backendAudience = 'internal'
      }

      // Solo actualizar información básica del curso, no los módulos
      const response = await axiosPrivate.put(`/lms/courses/${courseId}`, {
        title: courseData.title,
        description: courseData.description,
        audience: backendAudience,
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

  // Mutación para guardar módulos usando los endpoints correctos
  const saveModulesMutation = useMutation(
    async (modules: ContentModule[]) => {
      setIsSaving(true)
      try {
       
        const results = []

        // Procesar cada módulo
        for (const module of modules) {
          try {
            if (module.id && module.id.startsWith('temp_')) {
              // Es un módulo nuevo (ID temporal), crear en el backend
              
              // 1. Crear el módulo (sin contenido)
              const moduleData = {
                title: module.title,
                order_index: module.order,
                description: module.content.description || ''
              }

              const moduleResponse = await axiosPrivate.post(
                `/lms/content/courses/${courseId}/modules`,
                moduleData
              )
              
              const createdModule = moduleResponse.data.data || moduleResponse.data
              
              // 2. Crear una lección dentro del módulo con el contenido
              if (module.content && (module.content.text || module.content.videoUrl)) {
                const lessonData = {
                  title: module.title, // Usar el mismo título del módulo
                  type: module.type, // El backend espera 'type', no 'content_type'
                  order_index: 0, // Primera lección del módulo
                  content: module.content.text || '',
                  video_url: module.content.videoUrl || null,
                  is_mandatory: true
                }

                const lessonResponse = await axiosPrivate.post(
                  `/lms/content/modules/${createdModule.id}/lessons`,
                  lessonData
                )
                
              }
              
              results.push({
                action: 'created',
                module: createdModule,
                originalId: module.id
              })
            } else if (module.id) {
              // Es un módulo existente, actualizar
              
              // 1. Actualizar el módulo (sin contenido)
              const moduleData = {
                title: module.title,
                order_index: module.order,
                description: module.content.description || ''
              }

              const moduleResponse = await axiosPrivate.put(
                `/lms/content/modules/${module.id}`,
                moduleData
              )
              
              // 2. TODO: Actualizar las lecciones del módulo
              // Por ahora solo actualizamos el módulo
              
              results.push({
                action: 'updated',
                module: moduleResponse.data.data || moduleResponse.data
              })
            }
          } catch (moduleError) {
            console.error(`Error procesando módulo ${module.title}:`, moduleError)
            // Continuar con otros módulos aunque uno falle
          }
        }

        return { success: true, results }
      } catch (error) {
        console.error('Error general al guardar módulos:', error)
        throw error
      } finally {
        setIsSaving(false)
      }
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['lms-course', courseId])
      },
      onError: (error: any) => {
        console.error('Error al guardar módulos:', error)
      }
    }
  )

  // Mutación para actualizar lecciones individuales
  const updateLessonMutation = useMutation(
    async ({ moduleId, lessonData }: { moduleId: string, lessonData: any }) => {
      try {
        // Primero obtener las lecciones del módulo
        const lessonsResponse = await axiosPrivate.get(`/lms/content/modules/${moduleId}/lessons`)
        const lessons = lessonsResponse.data.data || lessonsResponse.data || []
        
        if (lessons.length > 0) {
          // Actualizar la primera lección (por ahora solo manejamos una lección por módulo)
          const lessonId = lessons[0].id
          const response = await axiosPrivate.put(`/lms/content/lessons/${lessonId}`, lessonData)
          return response.data
        } else {
          // Si no hay lecciones, crear una nueva
          const response = await axiosPrivate.post(`/lms/content/modules/${moduleId}/lessons`, lessonData)
          return response.data
        }
      } catch (error) {
        console.error('Error actualizando lección:', error)
        throw error
      }
    },
    {
      onSuccess: () => {
        // No invalidar queries aquí para evitar recargas constantes
      },
      onError: (error: any) => {
        console.error('Error al actualizar lección:', error)
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

    // Mark that there are unsaved changes (for new modules or module structure changes)
    setHasUnsavedChanges(true)

    // NOTE: Auto-save has been removed from here to prevent overwriting content
    // when switching between modules. Auto-save should only happen when the user
    // explicitly edits content, not when changing module selection.
    // The save will happen when the user clicks the "Guardar Curso" button.
  }

  const handleSave = () => {
    // Guardar información básica del curso
    saveCourseInfoMutation.mutate(courseData)
    // Guardar módulos por separado
    saveModulesMutation.mutate(courseData.modules)
    // Reset unsaved changes flag
    setHasUnsavedChanges(false)
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
          disabled={isSaving || !hasUnsavedChanges}
        >
          {isSaving ? 'Guardando...' : hasUnsavedChanges ? 'Guardar Curso' : 'Sin cambios'}
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
            hasUnsavedChanges={hasUnsavedChanges}
            onUpdateLesson={updateLessonMutation.mutate}
          />
        </CardContent>
      </Card>
    </Box>
  )
}

export default LmsCourseContentEditor
