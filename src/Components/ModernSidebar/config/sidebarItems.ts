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