import { describe, expect, it } from 'vitest'
import type { Course } from '../services/lmsService'
import {
  getCourseCompletedLessons,
  getCourseProgressPercentage,
  getCourseTimeSpentMinutes,
  getCourseTotalLessons
} from './lmsProgress'

const course = (data: Record<string, unknown>) =>
  data as unknown as Course

// 2 módulos: 3 + 1 lecciones = 4 en total
const modules = [{ lessons: [{}, {}, {}] }, { lessons: [{}] }]

describe('getCourseTotalLessons', () => {
  it('suma las lecciones de todos los módulos', () => {
    expect(getCourseTotalLessons(course({ modules }))).toBe(4)
  })

  it('sin módulos, o con módulos sin lecciones, es 0', () => {
    expect(getCourseTotalLessons(course({}))).toBe(0)
    expect(getCourseTotalLessons(course({ modules: [{}, { lessons: [] }] }))).toBe(
      0
    )
  })
})

describe('getCourseCompletedLessons', () => {
  it('sin progreso es 0, y un progreso que no es lista se ignora', () => {
    expect(getCourseCompletedLessons(course({ modules }))).toBe(0)
    expect(
      getCourseCompletedLessons(course({ modules, userProgress: [] }))
    ).toBe(0)
    expect(
      getCourseCompletedLessons(course({ modules, userProgress: 'raro' }))
    ).toBe(0)
  })

  it('con progreso por lección cuenta solo las completadas', () => {
    const userProgress = [
      { lesson_id: 1, status: 'completed' },
      { lesson_id: 2, status: 'in_progress' },
      { lesson_id: 3, status: 'completed' }
    ]
    expect(getCourseCompletedLessons(course({ modules, userProgress }))).toBe(2)
  })

  it('con progreso resumido usa completed_lessons', () => {
    const userProgress = [{ completed_lessons: [1, 2, 3] }]
    expect(getCourseCompletedLessons(course({ modules, userProgress }))).toBe(3)
  })
})

describe('getCourseProgressPercentage', () => {
  it('sin progreso o sin lecciones es 0', () => {
    expect(getCourseProgressPercentage(course({ modules }))).toBe(0)
    expect(
      getCourseProgressPercentage(
        course({ modules: [], userProgress: [{ lesson_id: 1, status: 'completed' }] })
      )
    ).toBe(0)
  })

  it('por lección: completadas sobre el total, redondeado', () => {
    const half = [
      { lesson_id: 1, status: 'completed' },
      { lesson_id: 2, status: 'completed' }
    ]
    expect(
      getCourseProgressPercentage(course({ modules, userProgress: half }))
    ).toBe(50)

    const oneOfThree = [{ lesson_id: 1, status: 'completed' }]
    expect(
      getCourseProgressPercentage(
        course({ modules: [{ lessons: [{}, {}, {}] }], userProgress: oneOfThree })
      )
    ).toBe(33)
  })

  it('con progreso resumido usa progress_percentage, o 0 si falta', () => {
    expect(
      getCourseProgressPercentage(
        course({ modules, userProgress: [{ progress_percentage: 75 }] })
      )
    ).toBe(75)
    expect(
      getCourseProgressPercentage(course({ modules, userProgress: [{}] }))
    ).toBe(0)
  })
})

describe('getCourseTimeSpentMinutes', () => {
  it('suma el tiempo de todas las entradas e ignora las que no lo traen', () => {
    const userProgress = [
      { time_spent_minutes: 10 },
      { time_spent_minutes: 25 },
      {}
    ]
    expect(getCourseTimeSpentMinutes(course({ userProgress }))).toBe(35)
  })

  it('sin progreso es 0', () => {
    expect(getCourseTimeSpentMinutes(course({}))).toBe(0)
  })
})
