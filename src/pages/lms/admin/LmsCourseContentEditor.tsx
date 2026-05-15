import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  IconButton,
  Stack,
  Typography
} from '@mui/material'
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import LmsContentEditor, {
  ContentLessonDraft,
  ContentModuleDraft
} from '../shared/LmsContentEditor'
import {
  buildLessonResourceDownloadUrl,
  lmsService,
  type Course as BackendCourse,
  type CourseAudience
} from '../../../services/lmsService'

interface FrontendCourseDraft {
  id: number
  title: string
  description: string
  audience: CourseAudience
  is_mandatory?: boolean
  has_certificate?: boolean
  modules: ContentModuleDraft[]
}

const getApiData = <T,>(response: any): T => response?.data?.data ?? response?.data ?? response

const pluralize = (count: number, singular: string, plural?: string) =>
  `${count} ${count === 1 ? singular : plural || `${singular}s`}`

const transformCourseFromBackend = (backendCourse: BackendCourse): FrontendCourseDraft => ({
  id: backendCourse.id,
  title: backendCourse.title,
  description: backendCourse.description,
  audience: backendCourse.audience || 'internal',
  is_mandatory: backendCourse.is_mandatory,
  has_certificate: backendCourse.has_certificate,
  modules: (backendCourse.modules || []).map((module, moduleIndex) => ({
    id: String(module.id),
    title: module.title,
    description: module.description || '',
    order: module.order_index || moduleIndex + 1,
    lessons: (module.lessons || []).map((lesson, lessonIndex) => ({
      id: String(lesson.id),
      title: lesson.title,
      type: lesson.type === 'quiz' ? 'quiz' : lesson.type === 'video' ? 'video' : 'text',
      order: lesson.order_index || lessonIndex + 1,
      estimatedMinutes: lesson.estimated_minutes || lesson.duration_minutes || 10,
      content: {
        text: lesson.content || '',
        description: '',
        videoUrl: lesson.video_url || '',
        videoSource: lesson.video_source || 'youtube',
        quizId: lesson.quiz?.id,
        resources: (lesson.resources || []).map((resource, resourceIndex) => ({
          id: String(resource.id),
          title: resource.title,
          description: resource.description || '',
          resourceType: resource.resource_type,
          fileUrl: resource.external_url
            ? ''
            : resource.download_url ||
              (resource.object_key ? buildLessonResourceDownloadUrl(resource.id) : resource.file_url || ''),
          externalUrl: resource.external_url || '',
          bucketName: resource.bucket_name || '',
          objectKey: resource.object_key || '',
          mimeType: resource.mime_type || '',
          fileSize: resource.file_size || undefined,
          originalFilename: resource.original_filename || '',
          localFile: null,
          order: resource.order_index || resourceIndex + 1
        }))
      }
    }))
  }))
})

const normalizeLessonPayload = (lesson: ContentLessonDraft) => {
  const basePayload: Record<string, any> = {
    title: lesson.title,
    type: lesson.type,
    order_index: lesson.order,
    estimated_minutes: lesson.estimatedMinutes,
    is_mandatory: true
  }

  if (lesson.type === 'text') {
    basePayload.content = lesson.content.text || '<p>Contenido pendiente</p>'
  }

  if (lesson.type === 'video') {
    basePayload.video_url = lesson.content.videoUrl || ''
    basePayload.video_source = lesson.content.videoSource || 'youtube'
    basePayload.content = lesson.content.description || ''
  }

  if (lesson.type === 'quiz') {
    basePayload.content = lesson.content.description || 'Evaluación del módulo'
  }

  return basePayload
}

const isPersistedEntityId = (id: string) => /^\d+$/.test(id)

const LmsCourseContentEditor: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  const [draftCourse, setDraftCourse] = useState<FrontendCourseDraft | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const draftCourseRef = useRef<FrontendCourseDraft | null>(null)

  const { data: course, isLoading } = useQuery<FrontendCourseDraft>(
    ['lms-course', courseId],
    async () => {
      if (!courseId) throw new Error('Course ID is required')
      const backendCourse = await lmsService.getCourse(Number(courseId))
      return transformCourseFromBackend(backendCourse)
    },
    { enabled: !!courseId }
  )

  useEffect(() => {
    if (course) {
      setDraftCourse(course)
      draftCourseRef.current = course
      setHasUnsavedChanges(false)
    }
  }, [course])

  const deleteModuleMutation = useMutation(async (moduleId: string) => {
    if (!moduleId.startsWith('temp_') && !moduleId.startsWith('module_')) {
      await axiosPrivate.delete(`/lms/content/modules/${moduleId}`)
    }
  })

  const deleteLessonMutation = useMutation(async (lessonId: string) => {
    if (!lessonId.startsWith('temp_') && !lessonId.startsWith('lesson_')) {
      await axiosPrivate.delete(`/lms/content/lessons/${lessonId}`)
    }
  })

  const deleteResourceMutation = useMutation(async (resourceId: string) => {
    if (!resourceId.startsWith('temp_') && !resourceId.startsWith('resource_')) {
      await axiosPrivate.delete(`/lms/content/resources/${resourceId}`)
    }
  })

  const reorderModulesMutation = useMutation(async (modules: ContentModuleDraft[]) => {
    if (!courseId || modules.some((module) => !isPersistedEntityId(module.id))) {
      return
    }

    await axiosPrivate.put(`/lms/content/courses/${courseId}/modules/reorder`, {
      moduleOrder: modules.map((module) => Number(module.id))
    })
  }, {
    onSuccess: async () => {
      await queryClient.invalidateQueries(['lms-course', courseId])
      await queryClient.invalidateQueries(['lms-courses'])
    }
  })

  const reorderLessonsMutation = useMutation(
    async ({ moduleId, lessons }: { moduleId: string; lessons: ContentLessonDraft[] }) => {
      if (!isPersistedEntityId(moduleId) || lessons.some((lesson) => !isPersistedEntityId(lesson.id))) {
        return
      }

      await axiosPrivate.put(`/lms/content/modules/${moduleId}/lessons/reorder`, {
        lessonOrder: lessons.map((lesson) => Number(lesson.id))
      })
    },
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries(['lms-course', courseId])
      }
    }
  )

  const saveCourseMutation = useMutation(async (courseData: FrontendCourseDraft) => {
    await axiosPrivate.put(`/lms/courses/${courseData.id}`, {
      title: courseData.title,
      description: courseData.description,
      audience: courseData.audience,
      is_mandatory: courseData.is_mandatory,
      has_certificate: courseData.has_certificate
    })

    for (const module of courseData.modules) {
      const modulePayload = {
        title: module.title,
        description: module.description || '',
        order_index: module.order
      }

      const persistedModule = module.id.startsWith('temp_') || module.id.startsWith('module_')
        ? getApiData<{ id: number }>(
            await axiosPrivate.post(`/lms/content/courses/${courseData.id}/modules`, modulePayload)
          )
        : getApiData<{ id: number }>(
            await axiosPrivate.put(`/lms/content/modules/${module.id}`, modulePayload)
          )

      const persistedModuleId = persistedModule.id

      for (const lesson of module.lessons) {
        const lessonPayload = normalizeLessonPayload(lesson)
        const persistedLesson = lesson.id.startsWith('temp_') || lesson.id.startsWith('lesson_')
          ? getApiData<{ id: number }>(
              await axiosPrivate.post(`/lms/content/modules/${persistedModuleId}/lessons`, lessonPayload)
            )
          : getApiData<{ id: number }>(
              await axiosPrivate.put(`/lms/content/lessons/${lesson.id}`, lessonPayload)
            )

        const persistedLessonId = persistedLesson.id

        for (const resource of lesson.content.resources) {
          const isUploadedResource = resource.resourceType !== 'link'
          const baseResourcePayload = {
            title: resource.title,
            description: resource.description || '',
            resource_type: resource.resourceType,
            order_index: resource.order
          }

          if (isUploadedResource && resource.localFile) {
            const formData = new FormData()
            formData.append('file', resource.localFile)
            formData.append('title', resource.title)
            formData.append('description', resource.description || '')
            formData.append('resource_type', resource.resourceType)
            formData.append('order_index', String(resource.order))

            if (resource.id.startsWith('temp_') || resource.id.startsWith('resource_')) {
              await axiosPrivate.post(`/lms/content/lessons/${persistedLessonId}/resources/upload`, formData, {
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
              })
            } else {
              await axiosPrivate.put(`/lms/content/resources/${resource.id}/upload`, formData, {
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
              })
            }
            continue
          }

          if (isUploadedResource) {
            const storedResourcePayload = {
              ...baseResourcePayload,
              file_url: null,
              bucket_name: resource.bucketName || null,
              object_key: resource.objectKey || null,
              mime_type: resource.mimeType || null,
              file_size: resource.fileSize || null,
              original_filename: resource.originalFilename || null,
              external_url: null
            }

            if (resource.id.startsWith('temp_') || resource.id.startsWith('resource_')) {
              await axiosPrivate.post(`/lms/content/lessons/${persistedLessonId}/resources`, storedResourcePayload)
            } else {
              await axiosPrivate.put(`/lms/content/resources/${resource.id}`, storedResourcePayload)
            }
            continue
          }

          const linkResourcePayload = {
            ...baseResourcePayload,
            file_url: null,
            external_url: resource.externalUrl || null,
            bucket_name: null,
            object_key: null,
            mime_type: null,
            file_size: null,
            original_filename: null
          }

          if (resource.id.startsWith('temp_') || resource.id.startsWith('resource_')) {
            await axiosPrivate.post(`/lms/content/lessons/${persistedLessonId}/resources`, linkResourcePayload)
          } else {
            await axiosPrivate.put(`/lms/content/resources/${resource.id}`, linkResourcePayload)
          }
        }
      }
    }
  }, {
    onSuccess: async () => {
      await queryClient.invalidateQueries(['lms-course', courseId])
      await queryClient.invalidateQueries(['lms-courses'])
      setHasUnsavedChanges(false)
    }
  })

  const handleModulesChange = (modules: ContentModuleDraft[], options?: { markUnsaved?: boolean }) => {
    setDraftCourse((current) => {
      if (!current) {
        return current
      }

      const nextDraft = { ...current, modules }
      draftCourseRef.current = nextDraft
      return nextDraft
    })
    setHasUnsavedChanges((current) => {
      if (options?.markUnsaved === false) {
        return current
      }

      return true
    })
  }

  const handleSave = () => {
    if (draftCourseRef.current) {
      saveCourseMutation.mutate(draftCourseRef.current)
    }
  }

  const handleModulesReorder = async (modules: ContentModuleDraft[]) => {
    await reorderModulesMutation.mutateAsync(modules)
  }

  const handleLessonsReorder = async (moduleId: string, lessons: ContentLessonDraft[]) => {
    await reorderLessonsMutation.mutateAsync({ moduleId, lessons })
  }

  const moduleCounts = useMemo(() => {
    const modules = draftCourse?.modules || []
    const lessonCount = modules.reduce((total, module) => total + module.lessons.length, 0)
    const resourceCount = modules.reduce(
      (total, module) =>
        total + module.lessons.reduce((lessonTotal, lesson) => lessonTotal + lesson.content.resources.length, 0),
      0
    )

    return {
      modules: modules.length,
      lessons: lessonCount,
      resources: resourceCount
    }
  }, [draftCourse])

  if (isLoading || !draftCourse) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Typography>Cargando contenido del curso...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/lms/admin/courses')}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4">Contenido del curso: {draftCourse.title}</Typography>
          <Typography variant="body2" color="text.secondary">
            Estructura este curso como secciones, lecciones y recursos de apoyo sin salir de la misma pantalla.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saveCourseMutation.isLoading || !hasUnsavedChanges}
        >
          {saveCourseMutation.isLoading ? 'Guardando cambios...' : hasUnsavedChanges ? 'Guardar cambios del contenido' : 'Sin cambios por guardar'}
        </Button>
      </Stack>

      <Alert severity="info" sx={{ mb: 2 }}>
        Flujo recomendado: 1) crea una sección, 2) agrega las lecciones que harán parte de ella, 3) usa recursos de apoyo para PDFs o enlaces, 4) guarda y revisa la vista previa.
      </Alert>

      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
        <Chip label={pluralize(moduleCounts.modules, 'sección', 'secciones')} color="primary" variant="outlined" />
        <Chip label={pluralize(moduleCounts.lessons, 'lección', 'lecciones')} variant="outlined" />
        <Chip label={pluralize(moduleCounts.resources, 'recurso')} variant="outlined" />
      </Stack>

      <Card>
        <CardHeader title="Estructura del curso" subheader="Organiza el aprendizaje por secciones, lecciones y recursos de apoyo." />
        <CardContent>
          <LmsContentEditor
            modules={draftCourse.modules}
            onModulesChange={handleModulesChange}
            onModulesReorder={handleModulesReorder}
            onLessonsReorder={handleLessonsReorder}
            onSave={handleSave}
            isLoading={saveCourseMutation.isLoading}
            hasUnsavedChanges={hasUnsavedChanges}
            onDeleteModule={(moduleId) => deleteModuleMutation.mutate(moduleId)}
            onDeleteLesson={(lessonId) => deleteLessonMutation.mutate(lessonId)}
            onDeleteResource={(resourceId) => deleteResourceMutation.mutate(resourceId)}
            courseId={courseId}
          />
        </CardContent>
      </Card>
    </Box>
  )
}

export default LmsCourseContentEditor
