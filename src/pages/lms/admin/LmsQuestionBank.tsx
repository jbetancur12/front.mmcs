import React from 'react'
import LmsAdminPendingFeature from './shared/LmsAdminPendingFeature'

const LmsQuestionBank: React.FC = () => {
  return (
    <LmsAdminPendingFeature
      title='Banco de Preguntas LMS'
      summary='El banco de preguntas standalone dejó de mostrar datos locales ficticios. Hoy el flujo real vive dentro de la gestión de quizzes conectada al backend.'
      limitations={[
        'La versión anterior de esta pantalla creaba, editaba y filtraba preguntas solo en estado local del navegador.',
        'No representaba el inventario real de preguntas guardadas en `/lms/question-bank`.',
        'Tampoco garantizaba coherencia con los quizzes reales de los cursos.'
      ]}
      availableNow={[
        'La gestión de quizzes ya consume el banco de preguntas real del backend.',
        'Desde la administración de quizzes se pueden listar, crear, editar y eliminar preguntas reales.',
        'Los quizzes guardados ya reutilizan preguntas conectadas al API activa.'
      ]}
      suggestedActions={[
        {
          label: 'Gestión de Quizzes',
          description: 'Abrir el flujo activo donde hoy vive el banco de preguntas conectado al backend.',
          route: '/lms/admin/quiz-management'
        },
        {
          label: 'Gestión de Cursos',
          description: 'Entrar al catálogo admin para saltar al editor de contenido y trabajar quizzes por curso.',
          route: '/lms/admin/courses'
        },
        {
          label: 'Analíticas de Quizzes',
          description: 'Revisar métricas reales de quizzes guardados en el LMS.',
          route: '/lms/admin/quiz-analytics'
        }
      ]}
    />
  )
}

export default LmsQuestionBank
