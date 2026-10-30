import { PERMISSIONS, PermissionKey } from './permissions'

/**
 * Pantallas con ruta propia que no tienen ítem en el menú lateral y que la
 * búsqueda rápida (Ctrl+K) debe encontrar. Las del menú se toman solas de
 * `sidebarItems`; aquí solo van las que se abren desde botones, pestañas o
 * enlaces internos. Cada una lleva el mismo permiso que pide su ruta.
 */
export interface QuickSearchPage {
  label: string
  path: string
  /** Grupo al que pertenece (se muestra como "Grupo › Pantalla"). */
  parents: string[]
  permission: PermissionKey | readonly PermissionKey[]
  /** Módulo licenciado; por defecto 'Basic'. */
  moduleName?: string
  /** Palabras extra que también deben encontrarla (sinónimos, sin tildes). */
  keywords?: string[]
}

export const QUICK_SEARCH_PAGES: QuickSearchPage[] = [
  {
    label: 'Guía de capacidades',
    path: '/settings/roles/ayuda',
    parents: ['Ajustes', 'Roles y permisos'],
    permission: PERMISSIONS.RBAC_VIEW,
    keywords: ['ayuda', 'wiki', 'permisos', 'capacidades', 'explicacion', 'guia']
  },
  {
    label: 'Equipos en préstamo',
    path: '/datasheets/devices-on-loan',
    parents: ['Inventario'],
    permission: PERMISSIONS.CALIBRATION_REPORT_VIEW,
    keywords: ['prestamo', 'prestados', 'loan', 'salida']
  },
  {
    label: 'Inventario en arriendo',
    path: '/datasheets/inventory-leasing',
    parents: ['Inventario'],
    permission: PERMISSIONS.CALIBRATION_REPORT_VIEW,
    keywords: ['arriendo', 'leasing', 'informe', 'pdf']
  },
  {
    label: 'Informe de inventario',
    path: '/datasheets/inventory',
    parents: ['Inventario'],
    permission: PERMISSIONS.CALIBRATION_REPORT_VIEW,
    keywords: ['pdf', 'listado de equipos']
  },
  {
    label: 'Programa de calibración',
    path: '/datasheets/calibration-program',
    parents: ['Inventario'],
    permission: PERMISSIONS.CALIBRATION_REPORT_VIEW,
    keywords: ['cronograma', 'informe', 'pdf']
  },
  {
    label: 'Cronograma de mantenimiento',
    path: '/datasheets/maintenance-schedule',
    parents: ['Inventario'],
    permission: PERMISSIONS.CALIBRATION_REPORT_VIEW,
    keywords: ['programa', 'informe', 'pdf']
  },
  {
    label: 'Gestión de cuestionarios',
    path: '/lms/admin/quiz-management',
    parents: ['Academia'],
    permission: PERMISSIONS.LMS_COURSE_MANAGE,
    moduleName: 'lms',
    keywords: ['quiz', 'preguntas', 'examenes', 'evaluaciones', 'banco']
  },
  {
    label: 'Productos y servicios',
    path: '/productos-y-servicios',
    parents: ['Calibraciones'],
    permission: PERMISSIONS.CALIBRATION_PRODUCT_VIEW,
    keywords: ['catalogo', 'precios']
  },
  {
    label: 'Analíticas',
    path: '/calibration-services/analytics',
    parents: ['Servicios de calibración'],
    permission: PERMISSIONS.CALIBRATION_ANALYTICS_VIEW,
    keywords: ['analiticas', 'indicadores', 'graficas', 'estadisticas']
  },
  {
    label: 'Entregas',
    path: '/calibration-services/entregas',
    parents: ['Servicios de calibración'],
    permission: PERMISSIONS.CALIBRATION_SERVICE_DELIVER,
    keywords: ['entregar', 'entrega', 'firma', 'recepcion', 'mensajero', 'equipos']
  },
  {
    label: 'Guía del flujo de servicios',
    path: '/calibration-services/guia',
    parents: ['Servicios de calibración'],
    permission: PERMISSIONS.CALIBRATION_SERVICE_VIEW,
    keywords: ['ayuda', 'guia', 'manual', 'tutorial', 'como', 'flujo', 'pasos']
  },
  {
    label: 'Agenda',
    path: '/calibration-services/schedule',
    parents: ['Servicios de calibración'],
    permission: PERMISSIONS.CALIBRATION_SERVICE_VIEW,
    keywords: ['calendario', 'programacion', 'cronograma']
  },
  {
    label: 'Clientes',
    path: '/calibration-services/customers',
    parents: ['Servicios de calibración'],
    permission: PERMISSIONS.CALIBRATION_SERVICE_VIEW,
    keywords: ['empresas']
  },
  {
    label: 'Notificaciones',
    path: '/calibration-services/notifications',
    parents: ['Servicios de calibración'],
    permission: PERMISSIONS.CALIBRATION_SERVICE_VIEW,
    keywords: ['avisos', 'alertas']
  },
  {
    label: 'Productos y servicios',
    path: '/calibration-services/productos-y-servicios',
    parents: ['Servicios de calibración'],
    permission: PERMISSIONS.CALIBRATION_SERVICE_VIEW,
    keywords: ['catalogo', 'precios']
  },
  {
    label: 'Nuevo servicio de calibración',
    path: '/calibration-services/new',
    parents: ['Servicios de calibración'],
    permission: PERMISSIONS.CALIBRATION_SERVICE_CREATE,
    keywords: ['crear', 'registrar', 'nueva']
  },
  {
    label: 'Productos',
    path: '/equipment-sales/products',
    parents: ['Venta de equipos'],
    permission: PERMISSIONS.SALES_PRODUCT_VIEW,
    keywords: ['catalogo', 'inventario']
  },
  {
    label: 'Nueva cotización',
    path: '/equipment-sales/new',
    parents: ['Venta de equipos'],
    permission: PERMISSIONS.SALES_QUOTATION_CREATE,
    keywords: ['crear', 'cotizar', 'nueva']
  },
  {
    label: 'Analíticas',
    path: '/maintenance/analytics',
    parents: ['Mantenimiento'],
    permission: PERMISSIONS.MAINTENANCE_ANALYTICS_VIEW,
    keywords: ['analiticas', 'indicadores', 'graficas', 'estadisticas']
  },
  {
    label: 'Personal de compras',
    path: '/purchases/personnel-management',
    parents: ['Compras'],
    permission: PERMISSIONS.PURCHASES_PERSONNEL_VIEW,
    keywords: ['personal', 'responsables', 'aprobadores']
  },
  {
    label: 'Informe de proveedores',
    path: '/purchases/suppliers/report',
    parents: ['Compras'],
    permission: PERMISSIONS.PURCHASES_REPORT_VIEW,
    keywords: ['reporte', 'pdf']
  },
  {
    label: 'Tipos de intervención',
    path: '/fleet/interventions',
    parents: ['Flota'],
    permission: PERMISSIONS.FLEET_INTERVENTION_TYPE_VIEW,
    moduleName: 'Fleet',
    keywords: ['mantenimiento vehiculos']
  },
  {
    label: 'Repositorio',
    path: '/repository',
    parents: ['Herramientas'],
    permission: PERMISSIONS.REPOSITORIES_REPOSITORY_VIEW,
    keywords: ['archivos', 'documentos']
  },
  {
    label: 'Manipulación de Excel',
    path: '/excel-manipulation',
    parents: ['Herramientas'],
    permission: PERMISSIONS.TOOLS_UTILITY_USE,
    keywords: ['xlsx', 'hoja de calculo']
  },
  {
    label: 'Generador de scripts PDF',
    path: '/pdf-script',
    parents: ['Herramientas'],
    permission: PERMISSIONS.TOOLS_UTILITY_USE,
    keywords: ['plantillas', 'certificados']
  },
  {
    label: 'Gotenberg',
    path: '/gotemberg',
    parents: ['Herramientas'],
    permission: PERMISSIONS.TOOLS_UTILITY_USE,
    keywords: ['convertir', 'pdf']
  }
]
