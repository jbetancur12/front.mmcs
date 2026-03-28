import React from 'react'
import LmsAdminPendingFeature from './shared/LmsAdminPendingFeature'

const LmsReporting: React.FC = () => {
  return (
    <LmsAdminPendingFeature
      title='Reportes LMS'
      summary='La capa de reportes avanzados dejó de mostrar resultados simulados mientras terminamos la conexión con datos reales.'
      limitations={[
        'Las plantillas, reportes recientes y programación automática que existían aquí eran mock y no representaban actividad real.',
        'Todavía falta decidir el set oficial de reportes que quedará soportado en backend y cómo se exportarán.',
        'No se debe usar esta pantalla todavía para auditoría, cumplimiento o entregas automáticas a negocio.'
      ]}
      availableNow={[
        'El dashboard admin ya muestra métricas activas del sistema y widgets conectados.',
        'Las analíticas LMS tienen una pantalla dedicada para exploración funcional del módulo.',
        'Los jobs del sistema ya se pueden monitorear desde la sección de jobs.'
      ]}
      suggestedActions={[
        {
          label: 'Dashboard Admin',
          description: 'Ver el estado operativo general del LMS y sus widgets activos.',
          route: '/lms/admin'
        },
        {
          label: 'Analíticas',
          description: 'Consultar la pantalla activa de métricas y comportamiento del LMS.',
          route: '/lms/admin/analytics'
        },
        {
          label: 'Jobs',
          description: 'Monitorear colas, scheduler y procesos asíncronos del sistema.',
          route: '/lms/admin/jobs'
        }
      ]}
    />
  )
}

export default LmsReporting
