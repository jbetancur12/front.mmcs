import { useQuery } from 'react-query'
import { lmsService } from 'src/services/lmsService'

export interface ManageableQuizOption {
  id: number
  title: string
  courseId: number
  courseTitle: string
  moduleId: number
  moduleTitle: string
  lessonId: number
  lessonTitle: string
  questionCount: number
}

const fetchManageableQuizzes = async (): Promise<ManageableQuizOption[]> => {
  const { courses } = await lmsService.getCourses({
    limit: 100,
    sortBy: 'created_at',
    sortOrder: 'DESC'
  })

  const detailedCourses = await Promise.all(
    courses.map(async (course) => {
      try {
        return await lmsService.getCourse(course.id)
      } catch (error) {
        console.warn(`No se pudo cargar el detalle del curso ${course.id}`, error)
        return null
      }
    })
  )

  const quizMap = new Map<number, ManageableQuizOption>()

  detailedCourses.filter(Boolean).forEach((course) => {
    course?.modules?.forEach((module) => {
      module.lessons?.forEach((lesson) => {
        if (!lesson.quiz) {
          return
        }

        quizMap.set(lesson.quiz.id, {
          id: lesson.quiz.id,
          title: lesson.quiz.title,
          courseId: course.id,
          courseTitle: course.title,
          moduleId: module.id,
          moduleTitle: module.title,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          questionCount: lesson.quiz.questions?.length || 0
        })
      })
    })
  })

  return Array.from(quizMap.values()).sort((a, b) => {
    if (a.courseTitle === b.courseTitle) {
      return a.title.localeCompare(b.title)
    }

    return a.courseTitle.localeCompare(b.courseTitle)
  })
}

export const useManageableQuizzes = () => {
  return useQuery(['lms-admin', 'manageable-quizzes'], fetchManageableQuizzes, {
    staleTime: 5 * 60 * 1000
  })
}
