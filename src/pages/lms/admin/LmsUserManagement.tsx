import React from 'react'
import LmsAdminPendingFeature from './shared/LmsAdminPendingFeature'

const LmsUserManagement: React.FC = () => {
  return (
    <LmsAdminPendingFeature
      title='Gestión de Usuarios LMS'
      summary='La administración real de usuarios LMS todavía no está conectada a un backend operativo.'
      limitations={[
        'No existe CRUD real para crear, editar, activar o desactivar usuarios LMS desde esta pantalla.',
        'Los usuarios LMS-only se validan hoy por seed y reglas de acceso, no por una interfaz administrativa final.',
        'No hay todavía una superficie segura para asignar customer, roles y restricción LMS-only en una sola operación.'
      ]}
      availableNow={[
        'Los accesos y permisos LMS ya funcionan para admin, Training Manager, employee, client y lms_only.',
        'Las validaciones funcionales se están haciendo con usuarios reales de seed y navegación en frontend.',
        'El catálogo, asignaciones internas, progreso, quizzes y certificados ya están operativos.'
      ]}
      suggestedActions={[
        {
          label: 'Cursos',
          description: 'Administrar cursos, contenido y audiencias reales del LMS.',
          route: '/lms/admin/courses'
        },
        {
          label: 'Asignaciones',
          description: 'Gestionar cursos obligatorios y deadlines para usuarios internos.',
          route: '/lms/admin/assignments'
        },
        {
          label: 'Analíticas',
          description: 'Revisar el estado global del LMS mientras se implementa la gestión de usuarios.',
          route: '/lms/admin/analytics'
        }
      ]}
    />
  )
}

export default LmsUserManagement
