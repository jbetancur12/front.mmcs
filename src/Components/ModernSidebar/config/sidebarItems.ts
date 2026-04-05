import { ModernSidebarItem } from '../types/sidebar.types'
import { sidebarIcons } from './icons'

// Helper para generar enlaces dinámicos de cliente
// const getLinkToCustomer = (basePath: string, customerId?: number) => {
//   if (!customerId) {
//     return '/' // Ruta predeterminada para usuarios sin cliente
//   }
//   return `${basePath}${customerId}`
// }

export const createSidebarItems = (_userStore: any): ModernSidebarItem[] => [
  {
    id: 'dashboard',
    type: 'link',
    label: 'Dashboard',
    icon: sidebarIcons.dashboard,
    to: '/',
    roles: ['admin', 'user'],
    moduleName: 'Basic'
  },

  {
    id: 'customers',
    type: 'link',
    label: 'Empresas',
    icon: sidebarIcons.business,
    to: '/customers',
    roles: ['admin', 'metrologist'],
    moduleName: 'Basic'
  },
  {
    id: 'lms',
    type: 'dropdown',
    label: 'Academia',
    icon: sidebarIcons.school,
    roles: ['admin', 'employee', 'client'],
    moduleName: 'Basic',
    children: [
      {
        id: 'lms-dashboard',
        type: 'link',
        label: 'Dashboard',
        to: '/lms',
        roles: ['admin', 'employee', 'client'],
        moduleName: 'Basic'
      },
      {
        id: 'lms-admin',
        type: 'link',
        label: 'Administración',
        to: '/lms/admin',
        roles: ['admin'],
        moduleName: 'Basic'
      },
      {
        id: 'lms-course-management',
        type: 'link',
        label: 'Gestión de Cursos',
        to: '/lms/admin/courses',
        roles: ['admin'],
        moduleName: 'Basic'
      },
      {
        id: 'lms-user-management',
        type: 'link',
        label: 'Gestión de Usuarios',
        to: '/lms/admin/users',
        roles: ['admin'],
        moduleName: 'Basic'
      },
      {
        id: 'lms-analytics',
        type: 'link',
        label: 'Analíticas',
        to: '/lms/admin/analytics',
        roles: ['admin'],
        moduleName: 'Basic'
      },
      {
        id: 'lms-assignments',
        type: 'link',
        label: 'Asignaciones',
        to: '/lms/admin/assignments',
        roles: ['admin'],
        moduleName: 'Basic'
      },
      {
        id: 'lms-compliance',
        type: 'link',
        label: 'Cumplimiento',
        to: '/lms/admin/compliance',
        roles: ['admin'],
        moduleName: 'Basic'
      },
      {
        id: 'lms-certificate-templates',
        type: 'link',
        label: 'Plantillas de Certificados',
        to: '/lms/admin/certificate-templates',
        roles: ['admin'],
        moduleName: 'Basic'
      },
      {
        id: 'lms-my-learning',
        type: 'link',
        label: 'Mi Aprendizaje',
        to: '/lms/employee',
        roles: ['employee'],
        moduleName: 'Basic'
      },
      {
        id: 'lms-my-certificates',
        type: 'link',
        label: 'Mis Certificados',
        to: '/lms/certificates',
        roles: ['employee', 'client'],
        moduleName: 'Basic'
      },
      {
        id: 'lms-public-courses',
        type: 'link',
        label: 'Cursos Públicos',
        to: '/lms/client',
        roles: ['client'],
        moduleName: 'Basic'
      }
    ]
  },
    {
      id: 'profiles',
      type: 'link',
      label: 'Biomedicos',
      to: '/profiles',
      icon:sidebarIcons.users,
      roles: ['admin', 'user'],
      moduleName: 'Basic'
    },
    {
      id: 'traceabilities',
      type: 'link',
      label: 'Trazabilidades',
      to: '/trazabilidad',
      icon: sidebarIcons.analytics,
      roles: ['admin', 'user'],
      moduleName: 'Basic'
    },

      {
    id: 'quality',
    type: 'dropdown',
    label: 'Dashboard',
    icon: sidebarIcons.star,
    roles: ['admin'],
    moduleName: 'Basic',
    children: [
      {
        id: 'non-conforme-work',
        type: 'link',
        label: 'Trabajo no Conforme',
        to: '/non-conform-work-reports',
        roles: ['admin'],
        moduleName: 'Basic',
      }
    ]
  },

      {
        id: 'fleet',
        type: 'link',
        label: 'Flota',
        to: '/fleet',
        icon: sidebarIcons.fleet,
        roles: ['admin', 'fleet'],
        moduleName: 'Fleet'
      },
  {
    id: 'settings',
    type: 'link',
    label: 'Ajustes',
    icon: sidebarIcons.settings,
    to: '/settings',
    roles: ['admin'],
    moduleName: 'Basic'
  }
]

// Exportar función por defecto para compatibilidad
export const sidebarItems = createSidebarItems({})
