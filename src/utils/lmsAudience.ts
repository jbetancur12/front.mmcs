import type { CourseAudience } from 'src/services/lmsService'

export const normalizeCourseAudience = (audience?: string | null): CourseAudience => {
  switch (audience) {
    case 'internal':
    case 'client':
    case 'both':
      return audience
    case 'employee':
      return 'internal'
    default:
      return 'both'
  }
}

export const getCourseAudienceLabel = (audience?: string | null): string => {
  switch (normalizeCourseAudience(audience)) {
    case 'internal':
      return 'Interno'
    case 'client':
      return 'Cliente'
    case 'both':
      return 'Ambos'
    default:
      return 'Ambos'
  }
}

export const getLearningVisibilityLabel = (userType: 'internal' | 'client'): string => {
  return userType === 'client'
    ? 'Cursos para clientes y compartidos'
    : 'Cursos internos y compartidos'
}
