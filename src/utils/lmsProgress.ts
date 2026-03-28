import type { Course } from '../services/lmsService'

type FlexibleProgressEntry = {
  status?: string
  lesson_id?: number
  time_spent_minutes?: number
  progress_percentage?: number
  completed_lessons?: number[]
}

const getProgressEntries = (course: Course): FlexibleProgressEntry[] => {
  if (!Array.isArray(course.userProgress)) {
    return []
  }

  return course.userProgress as FlexibleProgressEntry[]
}

export const getCourseTotalLessons = (course: Course): number => {
  return (course.modules || []).reduce((total, module) => {
    return total + (module.lessons?.length || 0)
  }, 0)
}

export const getCourseCompletedLessons = (course: Course): number => {
  const progressEntries = getProgressEntries(course)

  if (progressEntries.length === 0) {
    return 0
  }

  const lessonProgressEntries = progressEntries.filter((entry) => entry.lesson_id !== undefined)
  if (lessonProgressEntries.length > 0) {
    return lessonProgressEntries.filter((entry) => entry.status === 'completed').length
  }

  return progressEntries[0]?.completed_lessons?.length || 0
}

export const getCourseProgressPercentage = (course: Course): number => {
  const progressEntries = getProgressEntries(course)
  const totalLessons = getCourseTotalLessons(course)

  if (progressEntries.length === 0 || totalLessons === 0) {
    return 0
  }

  const lessonProgressEntries = progressEntries.filter((entry) => entry.lesson_id !== undefined)
  if (lessonProgressEntries.length > 0) {
    return Math.round((getCourseCompletedLessons(course) / totalLessons) * 100)
  }

  return progressEntries[0]?.progress_percentage || 0
}

export const getCourseTimeSpentMinutes = (course: Course): number => {
  const progressEntries = getProgressEntries(course)

  return progressEntries.reduce((total, entry) => {
    return total + (entry.time_spent_minutes || 0)
  }, 0)
}
