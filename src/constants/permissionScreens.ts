// GENERADO por scripts/gen-permission-screens.mjs — no editar a mano ni pasar por Prettier.
// Para cada capacidad, las pantallas del front donde interviene: 'screen' = la pantalla o el menú se protege con ella;
// 'action' = un botón o sección dentro de esa pantalla; 'related' = pantalla que hace una llamada protegida por ella.
export interface PermissionScreen {
  path: string
  label: string
  kind: 'screen' | 'action' | 'related'
}

export const PERMISSION_SCREENS: Record<string, PermissionScreen[]> = {
  'assets:life_sheet:manage': [
    { path: "/asset-life-sheets", label: "Inventario › Hoja de Vida TI", kind: 'screen' }
  ],
  'assets:life_sheet:view': [
    { path: "/asset-life-sheets", label: "Inventario › Hoja de Vida TI", kind: 'screen' }
  ],
  'calibration:adjustment:commercial': [
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'related' },
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'related' },
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'related' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'related' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'related' }
  ],
  'calibration:adjustment:review_technical': [
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'related' },
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'related' },
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'related' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'related' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'related' }
  ],
  'calibration:analytics:view': [
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'screen' },
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'related' },
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'related' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'related' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'related' },
    { path: "/lms/admin/analytics", label: "Academia › Analíticas", kind: 'related' },
    { path: "/lms/admin/courses/:courseId/content", label: "Academia › Administración › Cursos › Contenido", kind: 'related' },
    { path: "/lms/admin/quiz-management", label: "Academia › Administración › Banco de preguntas", kind: 'related' }
  ],
  'calibration:certificate_history:delete': [
    { path: "/calibraciones/certificados/:id", label: "Calibraciones › Certificados", kind: 'action' },
    { path: "/", label: "Dashboard", kind: 'related' },
    { path: "/calibraciones/subir-excel", label: "Calibraciones › Subir Excel", kind: 'related' },
    { path: "/customers/certificates-due/:id", label: "Clientes › certificates due", kind: 'related' },
    { path: "/fleet/:id/documents", label: "Flota › Documentos", kind: 'related' }
  ],
  'calibration:certificate_type:manage': [
    { path: "/calibraciones/tipos-de-certificado", label: "Calibraciones › Tipos de Certificado", kind: 'screen' }
  ],
  'calibration:certificate_type:view': [
    { path: "/calibraciones/tipos-de-certificado", label: "Calibraciones › Tipos de Certificado", kind: 'related' }
  ],
  'calibration:config:sequence': [
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'related' },
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'related' },
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'related' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'related' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'related' }
  ],
  'calibration:config:sla_manage': [
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'related' },
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'related' },
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'related' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'related' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'related' }
  ],
  'calibration:config:whatsapp_manage': [
    { path: "/calibration-services/notifications", label: "Servicios de calibración › Notificaciones", kind: 'related' }
  ],
  'calibration:datasheet:create': [
    { path: "/datasheets", label: "Inventario › Hoja de Vida", kind: 'action' },
    { path: "/datasheets/:id", label: "Inventario › Hoja de Vida", kind: 'action' }
  ],
  'calibration:datasheet:delete': [
    { path: "/datasheets", label: "Inventario › Hoja de Vida", kind: 'action' },
    { path: "/datasheets/:id", label: "Inventario › Hoja de Vida", kind: 'action' }
  ],
  'calibration:datasheet:detail': [
    { path: "/datasheets/:id", label: "Inventario › Hoja de Vida", kind: 'screen' },
    { path: "/datasheets", label: "Inventario › Hoja de Vida", kind: 'action' },
    { path: "/datasheets/:id/edit-calibration", label: "Hojas de datos › Editar calibración", kind: 'related' },
    { path: "/datasheets/:id/edit-maintenance", label: "Hojas de datos › Editar mantenimiento", kind: 'related' },
    { path: "/datasheets/:id/in-out", label: "Hojas de datos › Entradas y salidas", kind: 'related' },
    { path: "/datasheets/:id/in-out-table", label: "Hojas de datos › Entradas y salidas", kind: 'related' },
    { path: "/datasheets/:id/inspection-maintenance", label: "Hojas de datos › Inspección y mantenimiento", kind: 'related' },
    { path: "/datasheets/:id/new-calibration", label: "Hojas de datos › Nueva calibración", kind: 'related' },
    { path: "/datasheets/:id/new-maintenance", label: "Hojas de datos › Nuevo mantenimiento", kind: 'related' },
    { path: "/datasheets/devices-on-loan", label: "Hojas de datos › Equipos en préstamo", kind: 'related' }
  ],
  'calibration:datasheet:update': [
    { path: "/datasheets", label: "Inventario › Hoja de Vida", kind: 'action' },
    { path: "/datasheets/:id", label: "Inventario › Hoja de Vida", kind: 'action' }
  ],
  'calibration:datasheet:view': [
    { path: "/datasheets", label: "Inventario › Hoja de Vida", kind: 'screen' },
    { path: "/datasheets/alerts", label: "Inventario › Alertas", kind: 'screen' },
    { path: "/datasheets/:id", label: "Inventario › Hoja de Vida", kind: 'related' },
    { path: "/datasheets/:id/edit-calibration", label: "Hojas de datos › Editar calibración", kind: 'related' },
    { path: "/datasheets/:id/edit-maintenance", label: "Hojas de datos › Editar mantenimiento", kind: 'related' },
    { path: "/datasheets/:id/in-out", label: "Hojas de datos › Entradas y salidas", kind: 'related' },
    { path: "/datasheets/:id/in-out-table", label: "Hojas de datos › Entradas y salidas", kind: 'related' },
    { path: "/datasheets/:id/inspection-maintenance", label: "Hojas de datos › Inspección y mantenimiento", kind: 'related' },
    { path: "/datasheets/:id/new-calibration", label: "Hojas de datos › Nueva calibración", kind: 'related' },
    { path: "/datasheets/:id/new-maintenance", label: "Hojas de datos › Nuevo mantenimiento", kind: 'related' },
    { path: "/datasheets/devices-on-loan", label: "Hojas de datos › Equipos en préstamo", kind: 'related' }
  ],
  'calibration:device:manage': [
    { path: "/calibraciones/equipos", label: "Calibraciones › Equipos", kind: 'action' },
    { path: "/calibraciones/certificados/:id", label: "Calibraciones › Certificados", kind: 'related' },
    { path: "/calibraciones/subir-excel", label: "Calibraciones › Subir Excel", kind: 'related' }
  ],
  'calibration:device:view': [
    { path: "/calibraciones/equipos", label: "Calibraciones › Equipos", kind: 'screen' },
    { path: "/calibraciones/certificados/:id", label: "Calibraciones › Certificados", kind: 'related' },
    { path: "/calibraciones/subir-excel", label: "Calibraciones › Subir Excel", kind: 'related' },
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'related' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'related' }
  ],
  'calibration:document:manage': [
    { path: "/fleet/:id/documents", label: "Flota › Documentos", kind: 'action' }
  ],
  'calibration:equipment_inout:list': [
    { path: "/datasheets/:id/in-out-table", label: "Hojas de datos › Entradas y salidas", kind: 'screen' }
  ],
  'calibration:equipment_inout:manage': [
    { path: "/datasheets/:id/in-out", label: "Hojas de datos › Entradas y salidas", kind: 'screen' }
  ],
  'calibration:file:bulk_reassign': [
    { path: "/calibraciones/certificados/:id", label: "Calibraciones › Certificados", kind: 'action' },
    { path: "/", label: "Dashboard", kind: 'related' },
    { path: "/calibraciones/subir-excel", label: "Calibraciones › Subir Excel", kind: 'related' },
    { path: "/customers/certificates-due/:id", label: "Clientes › certificates due", kind: 'related' },
    { path: "/fleet/:id/documents", label: "Flota › Documentos", kind: 'related' }
  ],
  'calibration:file:create': [
    { path: "/calibraciones/subir-excel", label: "Calibraciones › Subir Excel", kind: 'screen' },
    { path: "/", label: "Dashboard", kind: 'action' },
    { path: "/calibraciones/certificados", label: "Calibraciones › Certificados", kind: 'action' },
    { path: "/customers/:id", label: "Empresas", kind: 'action' },
    { path: "/customers/certificates-due/:id", label: "Clientes › certificates due", kind: 'action' },
    { path: "/fleet/:id/documents", label: "Flota › Documentos", kind: 'action' },
    { path: "/calibraciones/certificados/:id", label: "Calibraciones › Certificados", kind: 'related' }
  ],
  'calibration:file:delete': [
    { path: "/", label: "Dashboard", kind: 'action' },
    { path: "/calibraciones/certificados", label: "Calibraciones › Certificados", kind: 'action' },
    { path: "/calibraciones/subir-excel", label: "Calibraciones › Subir Excel", kind: 'action' },
    { path: "/customers/certificates-due/:id", label: "Clientes › certificates due", kind: 'action' },
    { path: "/fleet/:id/documents", label: "Flota › Documentos", kind: 'action' },
    { path: "/calibraciones/certificados/:id", label: "Calibraciones › Certificados", kind: 'related' },
    { path: "/customers/:id", label: "Empresas", kind: 'related' }
  ],
  'calibration:file:expiring_grouped': [
    { path: "/", label: "Dashboard", kind: 'related' },
    { path: "/calibraciones/certificados/:id", label: "Calibraciones › Certificados", kind: 'related' },
    { path: "/calibraciones/subir-excel", label: "Calibraciones › Subir Excel", kind: 'related' },
    { path: "/customers/certificates-due/:id", label: "Clientes › certificates due", kind: 'related' },
    { path: "/fleet/:id/documents", label: "Flota › Documentos", kind: 'related' }
  ],
  'calibration:file:list': [
    { path: "/", label: "Dashboard", kind: 'related' },
    { path: "/calibraciones/certificados", label: "Calibraciones › Certificados", kind: 'related' },
    { path: "/calibraciones/certificados/:id", label: "Calibraciones › Certificados", kind: 'related' },
    { path: "/calibraciones/subir-excel", label: "Calibraciones › Subir Excel", kind: 'related' },
    { path: "/customers/certificates-due/:id", label: "Clientes › certificates due", kind: 'related' },
    { path: "/fleet/:id/documents", label: "Flota › Documentos", kind: 'related' }
  ],
  'calibration:file:update': [
    { path: "/calibraciones/certificados/:id", label: "Calibraciones › Certificados", kind: 'action' },
    { path: "/", label: "Dashboard", kind: 'related' },
    { path: "/calibraciones/subir-excel", label: "Calibraciones › Subir Excel", kind: 'related' },
    { path: "/customers/:id", label: "Empresas", kind: 'related' },
    { path: "/customers/certificates-due/:id", label: "Clientes › certificates due", kind: 'related' },
    { path: "/fleet/:id/documents", label: "Flota › Documentos", kind: 'related' }
  ],
  'calibration:inspection_maintenance:manage': [
    { path: "/datasheets/:id/edit-maintenance", label: "Hojas de datos › Editar mantenimiento", kind: 'screen' },
    { path: "/datasheets/:id/new-maintenance", label: "Hojas de datos › Nuevo mantenimiento", kind: 'screen' },
    { path: "/datasheets/:id", label: "Inventario › Hoja de Vida", kind: 'related' },
    { path: "/datasheets/:id/edit-calibration", label: "Hojas de datos › Editar calibración", kind: 'related' },
    { path: "/datasheets/:id/in-out", label: "Hojas de datos › Entradas y salidas", kind: 'related' },
    { path: "/datasheets/:id/in-out-table", label: "Hojas de datos › Entradas y salidas", kind: 'related' },
    { path: "/datasheets/:id/inspection-maintenance", label: "Hojas de datos › Inspección y mantenimiento", kind: 'related' },
    { path: "/datasheets/:id/new-calibration", label: "Hojas de datos › Nueva calibración", kind: 'related' },
    { path: "/datasheets/devices-on-loan", label: "Hojas de datos › Equipos en préstamo", kind: 'related' }
  ],
  'calibration:inspection_maintenance:view': [
    { path: "/datasheets/:id/inspection-maintenance", label: "Hojas de datos › Inspección y mantenimiento", kind: 'screen' },
    { path: "/datasheets", label: "Inventario › Hoja de Vida", kind: 'action' },
    { path: "/datasheets/:id", label: "Inventario › Hoja de Vida", kind: 'action' },
    { path: "/datasheets/:id/edit-calibration", label: "Hojas de datos › Editar calibración", kind: 'related' },
    { path: "/datasheets/:id/edit-maintenance", label: "Hojas de datos › Editar mantenimiento", kind: 'related' },
    { path: "/datasheets/:id/in-out", label: "Hojas de datos › Entradas y salidas", kind: 'related' },
    { path: "/datasheets/:id/in-out-table", label: "Hojas de datos › Entradas y salidas", kind: 'related' },
    { path: "/datasheets/:id/new-calibration", label: "Hojas de datos › Nueva calibración", kind: 'related' },
    { path: "/datasheets/:id/new-maintenance", label: "Hojas de datos › Nuevo mantenimiento", kind: 'related' },
    { path: "/datasheets/devices-on-loan", label: "Hojas de datos › Equipos en préstamo", kind: 'related' }
  ],
  'calibration:product:manage': [
    { path: "/calibration-services/productos-y-servicios", label: "Servicios de calibración › Productos y servicios", kind: 'related' },
    { path: "/productos-y-servicios", label: "Productos y servicios", kind: 'related' }
  ],
  'calibration:product:view': [
    { path: "/productos-y-servicios", label: "Productos y servicios", kind: 'screen' },
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'related' },
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'related' },
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'related' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'related' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'related' },
    { path: "/calibration-services/productos-y-servicios", label: "Servicios de calibración › Productos y servicios", kind: 'related' }
  ],
  'calibration:record:manage': [
    { path: "/datasheets/:id/edit-calibration", label: "Hojas de datos › Editar calibración", kind: 'screen' },
    { path: "/datasheets/:id/new-calibration", label: "Hojas de datos › Nueva calibración", kind: 'screen' },
    { path: "/datasheets/:id", label: "Inventario › Hoja de Vida", kind: 'related' },
    { path: "/datasheets/:id/edit-maintenance", label: "Hojas de datos › Editar mantenimiento", kind: 'related' },
    { path: "/datasheets/:id/in-out", label: "Hojas de datos › Entradas y salidas", kind: 'related' },
    { path: "/datasheets/:id/in-out-table", label: "Hojas de datos › Entradas y salidas", kind: 'related' },
    { path: "/datasheets/:id/inspection-maintenance", label: "Hojas de datos › Inspección y mantenimiento", kind: 'related' },
    { path: "/datasheets/:id/new-maintenance", label: "Hojas de datos › Nuevo mantenimiento", kind: 'related' },
    { path: "/datasheets/devices-on-loan", label: "Hojas de datos › Equipos en préstamo", kind: 'related' }
  ],
  'calibration:record:view': [
    { path: "/datasheets/:id", label: "Inventario › Hoja de Vida", kind: 'related' },
    { path: "/datasheets/:id/edit-calibration", label: "Hojas de datos › Editar calibración", kind: 'related' },
    { path: "/datasheets/:id/edit-maintenance", label: "Hojas de datos › Editar mantenimiento", kind: 'related' },
    { path: "/datasheets/:id/in-out", label: "Hojas de datos › Entradas y salidas", kind: 'related' },
    { path: "/datasheets/:id/in-out-table", label: "Hojas de datos › Entradas y salidas", kind: 'related' },
    { path: "/datasheets/:id/inspection-maintenance", label: "Hojas de datos › Inspección y mantenimiento", kind: 'related' },
    { path: "/datasheets/:id/new-calibration", label: "Hojas de datos › Nueva calibración", kind: 'related' },
    { path: "/datasheets/:id/new-maintenance", label: "Hojas de datos › Nuevo mantenimiento", kind: 'related' },
    { path: "/datasheets/devices-on-loan", label: "Hojas de datos › Equipos en préstamo", kind: 'related' }
  ],
  'calibration:report:view': [
    { path: "/datasheets/:id/in-out-report", label: "Hojas de datos › Informe de entradas y salidas", kind: 'screen' },
    { path: "/datasheets/:id/inspection-maintenance/:id", label: "Hojas de datos › Inspección y mantenimiento", kind: 'screen' },
    { path: "/datasheets/calibration-program/:id?", label: "Hojas de datos › Programa de calibración", kind: 'screen' },
    { path: "/datasheets/devices-on-loan", label: "Hojas de datos › Equipos en préstamo", kind: 'screen' },
    { path: "/datasheets/inventory-leasing", label: "Hojas de datos › Inventario y alquiler", kind: 'screen' },
    { path: "/datasheets/inventory/:id?", label: "Hojas de datos › Inventario", kind: 'screen' },
    { path: "/datasheets/maintenance-schedule/:id?", label: "Hojas de datos › Cronograma de mantenimiento", kind: 'screen' },
    { path: "/customers/:id/schedule/pdf", label: "Clientes › Programación › PDF", kind: 'related' },
    { path: "/datasheets/:id", label: "Inventario › Hoja de Vida", kind: 'related' },
    { path: "/datasheets/:id/edit-calibration", label: "Hojas de datos › Editar calibración", kind: 'related' },
    { path: "/datasheets/:id/edit-maintenance", label: "Hojas de datos › Editar mantenimiento", kind: 'related' },
    { path: "/datasheets/:id/in-out", label: "Hojas de datos › Entradas y salidas", kind: 'related' },
    { path: "/datasheets/:id/in-out-table", label: "Hojas de datos › Entradas y salidas", kind: 'related' },
    { path: "/datasheets/:id/inspection-maintenance", label: "Hojas de datos › Inspección y mantenimiento", kind: 'related' },
    { path: "/datasheets/:id/new-calibration", label: "Hojas de datos › Nueva calibración", kind: 'related' },
    { path: "/datasheets/:id/new-maintenance", label: "Hojas de datos › Nuevo mantenimiento", kind: 'related' }
  ],
  'calibration:service:cancel': [
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'related' },
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'related' },
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'related' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'related' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'related' }
  ],
  'calibration:service:certificate_send': [
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'related' },
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'related' },
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'related' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'related' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'related' }
  ],
  'calibration:service:close': [
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'related' },
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'related' },
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'related' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'related' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'related' }
  ],
  'calibration:service:create': [
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'screen' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'screen' },
    { path: "/calibration-services/customers", label: "Servicios de calibración › Clientes", kind: 'action' },
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'related' },
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'related' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'related' }
  ],
  'calibration:service:decide': [
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'related' },
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'related' },
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'related' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'related' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'related' }
  ],
  'calibration:service:document_control': [
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'related' },
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'related' },
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'related' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'related' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'related' }
  ],
  'calibration:service:document_upload': [
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'related' },
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'related' },
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'related' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'related' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'related' }
  ],
  'calibration:service:execute': [
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'related' },
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'related' },
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'related' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'related' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'related' }
  ],
  'calibration:service:execution_customer': [
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'related' },
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'related' },
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'related' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'related' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'related' }
  ],
  'calibration:service:invoicing': [
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'related' },
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'related' },
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'related' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'related' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'related' }
  ],
  'calibration:service:ods': [
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'related' },
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'related' },
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'related' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'related' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'related' }
  ],
  'calibration:service:pause': [
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'related' },
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'related' },
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'related' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'related' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'related' }
  ],
  'calibration:service:quote_pdf': [
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'related' },
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'related' },
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'related' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'related' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'related' }
  ],
  'calibration:service:quote_terms': [
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'related' },
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'related' },
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'related' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'related' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'related' }
  ],
  'calibration:service:reassign': [
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'related' },
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'related' },
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'related' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'related' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'related' }
  ],
  'calibration:service:request_approval': [
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'related' },
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'related' },
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'related' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'related' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'related' }
  ],
  'calibration:service:reschedule': [
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'related' },
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'related' },
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'related' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'related' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'related' }
  ],
  'calibration:service:schedule': [
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'related' },
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'related' },
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'related' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'related' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'related' }
  ],
  'calibration:service:traceability': [
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'related' },
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'related' },
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'related' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'related' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'related' }
  ],
  'calibration:service:update': [
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'action' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'action' },
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'related' },
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'related' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'related' }
  ],
  'calibration:service:view': [
    { path: "/calibration-services", label: "Servicios Cal.", kind: 'screen' },
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'screen' },
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'screen' },
    { path: "/calibration-services/customers", label: "Servicios de calibración › Clientes", kind: 'screen' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'screen' },
    { path: "/calibration-services/notifications", label: "Servicios de calibración › Notificaciones", kind: 'screen' },
    { path: "/calibration-services/productos-y-servicios", label: "Servicios de calibración › Productos y servicios", kind: 'screen' },
    { path: "/calibration-services/schedule", label: "Servicios de calibración › Programación", kind: 'screen' },
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'related' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'related' }
  ],
  'calibration:template:manage': [
    { path: "/calibraciones/equipos", label: "Calibraciones › Equipos", kind: 'action' },
    { path: "/calibraciones/templates", label: "Calibraciones › Plantillas", kind: 'action' }
  ],
  'calibration:template:view': [
    { path: "/calibraciones/templates", label: "Calibraciones › Plantillas", kind: 'screen' },
    { path: "/calibraciones/equipos", label: "Calibraciones › Equipos", kind: 'related' }
  ],
  'calibration:traceability:manage': [
    { path: "/trazabilidad", label: "Trazabilidades", kind: 'action' }
  ],
  'customers:customer:avatar': [
    { path: "/customers/:id", label: "Empresas", kind: 'action' }
  ],
  'customers:customer:catalog': [
    { path: "/calibraciones/subir-excel", label: "Calibraciones › Subir Excel", kind: 'related' },
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'related' },
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'related' },
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'related' },
    { path: "/calibration-services/customers", label: "Servicios de calibración › Clientes", kind: 'related' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'related' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'related' },
    { path: "/customers", label: "Empresas", kind: 'related' },
    { path: "/customers/:id", label: "Empresas", kind: 'related' },
    { path: "/equipment-sales", label: "Venta Equipos", kind: 'related' },
    { path: "/equipment-sales/:quotationId", label: "Venta Equipos", kind: 'related' },
    { path: "/equipment-sales/:quotationId/edit", label: "Venta de equipos › Editar", kind: 'related' },
    { path: "/equipment-sales/new", label: "Venta de equipos › Nuevo", kind: 'related' },
    { path: "/equipment-sales/products", label: "Venta de equipos › Productos", kind: 'related' },
    { path: "/iot/customers-management", label: "IoT › Clientes IoT", kind: 'related' },
    { path: "/iot/map", label: "IoT › Mapa", kind: 'related' },
    { path: "/modules", label: "Módulos", kind: 'related' },
    { path: "/settings", label: "Ajustes", kind: 'related' },
    { path: "/users", label: "Usuarios", kind: 'related' }
  ],
  'customers:customer:create': [
    { path: "/customers", label: "Empresas", kind: 'action' },
    { path: "/calibraciones/subir-excel", label: "Calibraciones › Subir Excel", kind: 'related' },
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'related' },
    { path: "/calibration-services/customers", label: "Servicios de calibración › Clientes", kind: 'related' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'related' },
    { path: "/customers/:id", label: "Empresas", kind: 'related' },
    { path: "/equipment-sales", label: "Venta Equipos", kind: 'related' },
    { path: "/equipment-sales/:quotationId", label: "Venta Equipos", kind: 'related' },
    { path: "/equipment-sales/:quotationId/edit", label: "Venta de equipos › Editar", kind: 'related' },
    { path: "/equipment-sales/new", label: "Venta de equipos › Nuevo", kind: 'related' },
    { path: "/equipment-sales/products", label: "Venta de equipos › Productos", kind: 'related' },
    { path: "/iot/customers-management", label: "IoT › Clientes IoT", kind: 'related' },
    { path: "/modules", label: "Módulos", kind: 'related' },
    { path: "/settings", label: "Ajustes", kind: 'related' },
    { path: "/users", label: "Usuarios", kind: 'related' }
  ],
  'customers:customer:delete': [
    { path: "/customers", label: "Empresas", kind: 'action' },
    { path: "/calibraciones/subir-excel", label: "Calibraciones › Subir Excel", kind: 'related' },
    { path: "/customers/:id", label: "Empresas", kind: 'related' },
    { path: "/iot/customers-management", label: "IoT › Clientes IoT", kind: 'related' },
    { path: "/modules", label: "Módulos", kind: 'related' },
    { path: "/settings", label: "Ajustes", kind: 'related' },
    { path: "/users", label: "Usuarios", kind: 'related' }
  ],
  'customers:customer:manage': [
    { path: "/customers", label: "Empresas", kind: 'screen' },
    { path: "/iot/customers-management", label: "IoT › Clientes IoT", kind: 'screen' },
    { path: "/customers/:id", label: "Empresas", kind: 'action' },
    { path: "/iot/email-settings", label: "IoT › Correos de alerta", kind: 'related' }
  ],
  'customers:customer:update': [
    { path: "/customers", label: "Empresas", kind: 'action' },
    { path: "/customers/:id", label: "Empresas", kind: 'action' },
    { path: "/calibraciones/subir-excel", label: "Calibraciones › Subir Excel", kind: 'related' },
    { path: "/calibration-services/customers", label: "Servicios de calibración › Clientes", kind: 'related' },
    { path: "/iot/customers-management", label: "IoT › Clientes IoT", kind: 'related' },
    { path: "/modules", label: "Módulos", kind: 'related' },
    { path: "/settings", label: "Ajustes", kind: 'related' },
    { path: "/users", label: "Usuarios", kind: 'related' }
  ],
  'customers:customer:view': [
    { path: "/customers/:id", label: "Empresas", kind: 'screen' },
    { path: "/customers/:id/schedule/pdf", label: "Clientes › Programación › PDF", kind: 'screen' },
    { path: "/customers/certificates-due/:id", label: "Clientes › certificates due", kind: 'screen' }
  ],
  'customers:lms_course:manage': [
    { path: "/customers/:id", label: "Empresas", kind: 'action' }
  ],
  'customers:module:assign': [
    { path: "/customers/:id", label: "Empresas", kind: 'action' },
    { path: "/modules", label: "Módulos", kind: 'related' }
  ],
  'customers:module:view': [
    { path: "/customers/:id", label: "Empresas", kind: 'action' },
    { path: "/modules", label: "Módulos", kind: 'related' }
  ],
  'customers:module_catalog:view': [
    { path: "/modules", label: "Módulos", kind: 'screen' },
    { path: "/customers/:id", label: "Empresas", kind: 'related' }
  ],
  'customers:site:manage': [
    { path: "/customers/:id", label: "Empresas", kind: 'action' },
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'related' },
    { path: "/calibration-services/customers", label: "Servicios de calibración › Clientes", kind: 'related' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'related' },
    { path: "/equipment-sales", label: "Venta Equipos", kind: 'related' },
    { path: "/equipment-sales/:quotationId", label: "Venta Equipos", kind: 'related' },
    { path: "/equipment-sales/:quotationId/edit", label: "Venta de equipos › Editar", kind: 'related' },
    { path: "/equipment-sales/new", label: "Venta de equipos › Nuevo", kind: 'related' },
    { path: "/equipment-sales/products", label: "Venta de equipos › Productos", kind: 'related' }
  ],
  'customers:user:list': [
    { path: "/customers/:id", label: "Empresas", kind: 'action' },
    { path: "/settings", label: "Ajustes", kind: 'related' },
    { path: "/users", label: "Usuarios", kind: 'related' }
  ],
  'fleet:intervention_type:manage': [
    { path: "/fleet/interventions", label: "Flota › Tipos de intervención", kind: 'action' }
  ],
  'fleet:intervention_type:view': [
    { path: "/fleet/interventions", label: "Flota › Tipos de intervención", kind: 'screen' },
    { path: "/fleet/:id/interventions", label: "Flota › Tipos de intervención", kind: 'related' }
  ],
  'fleet:maintenance:manage': [
    { path: "/fleet/:id/interventions", label: "Flota › Tipos de intervención", kind: 'action' },
    { path: "/fleet/:id/data-sheet", label: "Flota › Hoja de vida", kind: 'related' },
    { path: "/fleet/:id/inspections", label: "Flota › Inspecciones", kind: 'related' }
  ],
  'fleet:maintenance:view': [
    { path: "/fleet/:id/interventions", label: "Flota › Tipos de intervención", kind: 'screen' },
    { path: "/fleet/:id/data-sheet", label: "Flota › Hoja de vida", kind: 'related' },
    { path: "/fleet/:id/inspections", label: "Flota › Inspecciones", kind: 'related' }
  ],
  'fleet:trip:manage': [
    { path: "/fleet/:id/trip/new", label: "Flota › Viajes › Nuevo", kind: 'screen' },
    { path: "/fleet/:id/trip", label: "Flota › Viajes", kind: 'action' }
  ],
  'fleet:trip:view': [
    { path: "/fleet/:id/trip", label: "Flota › Viajes", kind: 'screen' }
  ],
  'fleet:vehicle:document_upload': [
    { path: "/fleet/:id/documents", label: "Flota › Documentos", kind: 'action' }
  ],
  'fleet:vehicle:manage': [
    { path: "/fleet", label: "Flota", kind: 'action' }
  ],
  'fleet:vehicle:view': [
    { path: "/fleet", label: "Flota", kind: 'screen' },
    { path: "/fleet/:id/data-sheet", label: "Flota › Hoja de vida", kind: 'screen' },
    { path: "/fleet/:id/documents", label: "Flota › Documentos", kind: 'screen' },
    { path: "/fleet/:id/documents/:docId", label: "Flota › Documentos", kind: 'screen' },
    { path: "/fleet/:id/inspections", label: "Flota › Inspecciones", kind: 'screen' },
    { path: "/fleet/:id/interventions", label: "Flota › Tipos de intervención", kind: 'related' }
  ],
  'iot:alarm:manage': [
    { path: "/iot/map", label: "IoT › Mapa", kind: 'related' }
  ],
  'iot:device:list': [
    { path: "/iot", label: "IoT", kind: 'screen' },
    { path: "/iot/map", label: "IoT › Mapa", kind: 'screen' }
  ],
  'iot:device:manage': [
    { path: "/iot", label: "IoT", kind: 'action' },
    { path: "/iot/customers-management", label: "IoT › Clientes IoT", kind: 'related' }
  ],
  'iot:device:view': [
    { path: "/iot/email-settings", label: "IoT › Correos de alerta", kind: 'screen' },
    { path: "/iot/customers-management", label: "IoT › Clientes IoT", kind: 'related' },
    { path: "/iot/map", label: "IoT › Mapa", kind: 'related' }
  ],
  'laboratory:calibration:view': [
    { path: "/laboratory/patterns", label: "Laboratorio › Patrones", kind: 'screen' }
  ],
  'laboratory:device:view': [
    { path: "/laboratory/conditions", label: "Laboratorio › Condiciones", kind: 'screen' }
  ],
  'lms:assignment:manage': [
    { path: "/lms/admin/assignments", label: "Academia › Asignaciones", kind: 'screen' },
    { path: "/lms/admin/courses/:courseId/assignments", label: "Academia › Administración › Cursos › Asignaciones", kind: 'screen' },
    { path: "/lms/admin/compliance", label: "Academia › Cumplimiento", kind: 'action' }
  ],
  'lms:certificate:manage': [
    { path: "/lms/admin/certificate-templates", label: "Academia › Plantillas de Certificados", kind: 'screen' },
    { path: "/lms/admin/certificates", label: "Academia › Certificados Emitidos", kind: 'screen' }
  ],
  'lms:course:manage': [
    { path: "/lms/admin/courses", label: "Academia › Gestión de Cursos", kind: 'screen' },
    { path: "/lms/admin/courses/:courseId/content", label: "Academia › Administración › Cursos › Contenido", kind: 'screen' },
    { path: "/lms/admin/quiz-management", label: "Academia › Administración › Banco de preguntas", kind: 'screen' }
  ],
  'lms:dashboard:view': [
    { path: "/lms/admin/analytics", label: "Academia › Analíticas", kind: 'screen' }
  ],
  'lms:notification:manage': [
    { path: "/lms/admin/compliance", label: "Academia › Cumplimiento", kind: 'screen' },
    { path: "/lms/admin/notifications", label: "Academia › Mis notificaciones", kind: 'screen' }
  ],
  'lms:plan:manage': [
    { path: "/lms/admin/plans", label: "Academia › Planes de formación", kind: 'screen' }
  ],
  'lms:question_bank:manage': [
    { path: "/lms/admin/courses/:courseId/content", label: "Academia › Administración › Cursos › Contenido", kind: 'related' },
    { path: "/lms/admin/quiz-management", label: "Academia › Administración › Banco de preguntas", kind: 'related' }
  ],
  'lms:report:manage': [
    { path: "/lms/admin/reporting", label: "Academia › Reportes", kind: 'screen' },
    { path: "/lms/admin/reports", label: "Academia › Administración › Reportes", kind: 'screen' }
  ],
  'lms:training:manage': [
    { path: "/lms", label: "Academia › Dashboard", kind: 'screen' },
    { path: "/lms/admin", label: "Academia › Administración", kind: 'screen' },
    { path: "/lms/admin/users/:userId/courses/:courseId/review", label: "Academia › Administración › Usuarios › Cursos › Revisión", kind: 'screen' }
  ],
  'lms:user:manage': [
    { path: "/lms/admin/users", label: "Academia › Gestión de Usuarios", kind: 'screen' },
    { path: "/lms/admin/assignments", label: "Academia › Asignaciones", kind: 'related' },
    { path: "/lms/admin/courses", label: "Academia › Gestión de Cursos", kind: 'related' }
  ],
  'maintenance:analytics:view': [
    { path: "/maintenance/analytics", label: "Mantenimiento › Analíticas", kind: 'screen' },
    { path: "/lms/admin/analytics", label: "Academia › Analíticas", kind: 'related' },
    { path: "/lms/admin/courses/:courseId/content", label: "Academia › Administración › Cursos › Contenido", kind: 'related' },
    { path: "/lms/admin/quiz-management", label: "Academia › Administración › Banco de preguntas", kind: 'related' },
    { path: "/maintenance", label: "Mantenimiento › Dashboard", kind: 'related' },
    { path: "/maintenance/protocols", label: "Mantenimiento › Protocolos", kind: 'related' },
    { path: "/maintenance/technicians", label: "Mantenimiento › Técnicos", kind: 'related' },
    { path: "/maintenance/tickets/:ticketId", label: "Mantenimiento › Tickets", kind: 'related' }
  ],
  'maintenance:comment:create': [
    { path: "/maintenance", label: "Mantenimiento › Dashboard", kind: 'related' },
    { path: "/maintenance/analytics", label: "Mantenimiento › Analíticas", kind: 'related' },
    { path: "/maintenance/protocols", label: "Mantenimiento › Protocolos", kind: 'related' },
    { path: "/maintenance/technicians", label: "Mantenimiento › Técnicos", kind: 'related' },
    { path: "/maintenance/tickets/:ticketId", label: "Mantenimiento › Tickets", kind: 'related' }
  ],
  'maintenance:comment:manage': [
    { path: "/maintenance", label: "Mantenimiento › Dashboard", kind: 'related' },
    { path: "/maintenance/analytics", label: "Mantenimiento › Analíticas", kind: 'related' },
    { path: "/maintenance/protocols", label: "Mantenimiento › Protocolos", kind: 'related' },
    { path: "/maintenance/technicians", label: "Mantenimiento › Técnicos", kind: 'related' },
    { path: "/maintenance/tickets/:ticketId", label: "Mantenimiento › Tickets", kind: 'related' }
  ],
  'maintenance:file:manage': [
    { path: "/maintenance", label: "Mantenimiento › Dashboard", kind: 'related' },
    { path: "/maintenance/analytics", label: "Mantenimiento › Analíticas", kind: 'related' },
    { path: "/maintenance/protocols", label: "Mantenimiento › Protocolos", kind: 'related' },
    { path: "/maintenance/technicians", label: "Mantenimiento › Técnicos", kind: 'related' },
    { path: "/maintenance/tickets/:ticketId", label: "Mantenimiento › Tickets", kind: 'related' }
  ],
  'maintenance:file:upload': [
    { path: "/maintenance", label: "Mantenimiento › Dashboard", kind: 'related' },
    { path: "/maintenance/analytics", label: "Mantenimiento › Analíticas", kind: 'related' },
    { path: "/maintenance/protocols", label: "Mantenimiento › Protocolos", kind: 'related' },
    { path: "/maintenance/technicians", label: "Mantenimiento › Técnicos", kind: 'related' },
    { path: "/maintenance/tickets/:ticketId", label: "Mantenimiento › Tickets", kind: 'related' }
  ],
  'maintenance:invoicing:manage': [
    { path: "/maintenance/billing", label: "Mantenimiento › Facturación", kind: 'action' }
  ],
  'maintenance:invoicing:view': [
    { path: "/maintenance/billing", label: "Mantenimiento › Facturación", kind: 'screen' }
  ],
  'maintenance:protocol:manage': [
    { path: "/maintenance/protocols", label: "Mantenimiento › Protocolos", kind: 'screen' },
    { path: "/maintenance", label: "Mantenimiento › Dashboard", kind: 'related' },
    { path: "/maintenance/analytics", label: "Mantenimiento › Analíticas", kind: 'related' },
    { path: "/maintenance/technicians", label: "Mantenimiento › Técnicos", kind: 'related' },
    { path: "/maintenance/tickets/:ticketId", label: "Mantenimiento › Tickets", kind: 'related' }
  ],
  'maintenance:protocol:view': [
    { path: "/maintenance", label: "Mantenimiento › Dashboard", kind: 'related' },
    { path: "/maintenance/analytics", label: "Mantenimiento › Analíticas", kind: 'related' },
    { path: "/maintenance/protocols", label: "Mantenimiento › Protocolos", kind: 'related' },
    { path: "/maintenance/technicians", label: "Mantenimiento › Técnicos", kind: 'related' },
    { path: "/maintenance/tickets/:ticketId", label: "Mantenimiento › Tickets", kind: 'related' }
  ],
  'maintenance:technical_report:edit': [
    { path: "/maintenance", label: "Mantenimiento › Dashboard", kind: 'related' },
    { path: "/maintenance/analytics", label: "Mantenimiento › Analíticas", kind: 'related' },
    { path: "/maintenance/protocols", label: "Mantenimiento › Protocolos", kind: 'related' },
    { path: "/maintenance/technicians", label: "Mantenimiento › Técnicos", kind: 'related' },
    { path: "/maintenance/tickets/:ticketId", label: "Mantenimiento › Tickets", kind: 'related' }
  ],
  'maintenance:technician:create': [
    { path: "/maintenance", label: "Mantenimiento › Dashboard", kind: 'related' },
    { path: "/maintenance/analytics", label: "Mantenimiento › Analíticas", kind: 'related' },
    { path: "/maintenance/protocols", label: "Mantenimiento › Protocolos", kind: 'related' },
    { path: "/maintenance/technicians", label: "Mantenimiento › Técnicos", kind: 'related' },
    { path: "/maintenance/tickets/:ticketId", label: "Mantenimiento › Tickets", kind: 'related' }
  ],
  'maintenance:technician:delete': [
    { path: "/maintenance", label: "Mantenimiento › Dashboard", kind: 'related' },
    { path: "/maintenance/analytics", label: "Mantenimiento › Analíticas", kind: 'related' },
    { path: "/maintenance/protocols", label: "Mantenimiento › Protocolos", kind: 'related' },
    { path: "/maintenance/technicians", label: "Mantenimiento › Técnicos", kind: 'related' },
    { path: "/maintenance/tickets/:ticketId", label: "Mantenimiento › Tickets", kind: 'related' }
  ],
  'maintenance:technician:list': [
    { path: "/maintenance/technicians", label: "Mantenimiento › Técnicos", kind: 'screen' },
    { path: "/maintenance", label: "Mantenimiento › Dashboard", kind: 'action' },
    { path: "/maintenance/tickets/:ticketId", label: "Mantenimiento › Tickets", kind: 'action' },
    { path: "/maintenance/analytics", label: "Mantenimiento › Analíticas", kind: 'related' },
    { path: "/maintenance/protocols", label: "Mantenimiento › Protocolos", kind: 'related' }
  ],
  'maintenance:technician:update': [
    { path: "/maintenance", label: "Mantenimiento › Dashboard", kind: 'related' },
    { path: "/maintenance/analytics", label: "Mantenimiento › Analíticas", kind: 'related' },
    { path: "/maintenance/protocols", label: "Mantenimiento › Protocolos", kind: 'related' },
    { path: "/maintenance/technicians", label: "Mantenimiento › Técnicos", kind: 'related' },
    { path: "/maintenance/tickets/:ticketId", label: "Mantenimiento › Tickets", kind: 'related' }
  ],
  'maintenance:technician:view': [
    { path: "/maintenance", label: "Mantenimiento › Dashboard", kind: 'related' },
    { path: "/maintenance/analytics", label: "Mantenimiento › Analíticas", kind: 'related' },
    { path: "/maintenance/protocols", label: "Mantenimiento › Protocolos", kind: 'related' },
    { path: "/maintenance/technicians", label: "Mantenimiento › Técnicos", kind: 'related' },
    { path: "/maintenance/tickets/:ticketId", label: "Mantenimiento › Tickets", kind: 'related' }
  ],
  'maintenance:ticket:create': [
    { path: "/maintenance", label: "Mantenimiento › Dashboard", kind: 'action' }
  ],
  'maintenance:ticket:delete': [
    { path: "/maintenance", label: "Mantenimiento › Dashboard", kind: 'related' },
    { path: "/maintenance/analytics", label: "Mantenimiento › Analíticas", kind: 'related' },
    { path: "/maintenance/protocols", label: "Mantenimiento › Protocolos", kind: 'related' },
    { path: "/maintenance/technicians", label: "Mantenimiento › Técnicos", kind: 'related' },
    { path: "/maintenance/tickets/:ticketId", label: "Mantenimiento › Tickets", kind: 'related' }
  ],
  'maintenance:ticket:manage_all': [
    { path: "/maintenance", label: "Mantenimiento › Dashboard", kind: 'action' },
    { path: "/maintenance/tickets/:ticketId", label: "Mantenimiento › Tickets", kind: 'action' }
  ],
  'maintenance:ticket:update': [
    { path: "/maintenance", label: "Mantenimiento › Dashboard", kind: 'related' },
    { path: "/maintenance/analytics", label: "Mantenimiento › Analíticas", kind: 'related' },
    { path: "/maintenance/protocols", label: "Mantenimiento › Protocolos", kind: 'related' },
    { path: "/maintenance/technicians", label: "Mantenimiento › Técnicos", kind: 'related' },
    { path: "/maintenance/tickets/:ticketId", label: "Mantenimiento › Tickets", kind: 'related' }
  ],
  'maintenance:ticket:view': [
    { path: "/maintenance", label: "Mantenimiento › Dashboard", kind: 'screen' },
    { path: "/maintenance/tickets/:ticketId", label: "Mantenimiento › Tickets", kind: 'screen' },
    { path: "/maintenance/analytics", label: "Mantenimiento › Analíticas", kind: 'related' },
    { path: "/maintenance/protocols", label: "Mantenimiento › Protocolos", kind: 'related' },
    { path: "/maintenance/technicians", label: "Mantenimiento › Técnicos", kind: 'related' }
  ],
  'nonconform:report:view': [
    { path: "/non-conform-work-reports", label: "Calidad › Trabajo no Conforme", kind: 'screen' },
    { path: "/customers/:id/schedule/pdf", label: "Clientes › Programación › PDF", kind: 'related' },
    { path: "/datasheets/:id/in-out-report", label: "Hojas de datos › Informe de entradas y salidas", kind: 'related' },
    { path: "/datasheets/:id/inspection-maintenance/:id", label: "Hojas de datos › Inspección y mantenimiento", kind: 'related' },
    { path: "/datasheets/calibration-program/:id?", label: "Hojas de datos › Programa de calibración", kind: 'related' },
    { path: "/datasheets/inventory-leasing", label: "Hojas de datos › Inventario y alquiler", kind: 'related' },
    { path: "/datasheets/inventory/:id?", label: "Hojas de datos › Inventario", kind: 'related' },
    { path: "/datasheets/maintenance-schedule/:id?", label: "Hojas de datos › Cronograma de mantenimiento", kind: 'related' }
  ],
  'purchases:evaluation:manage': [
    { path: "/purchases/suppliers/details/:supplierId", label: "Compras › Proveedores › Detalle", kind: 'action' },
    { path: "/purchases/suppliers/evaluations", label: "Compras › Evaluaciones de Proveedores", kind: 'action' }
  ],
  'purchases:evaluation:view': [
    { path: "/purchases/suppliers/evaluations", label: "Compras › Evaluaciones de Proveedores", kind: 'screen' }
  ],
  'purchases:fiscal_parameter:manage': [
    { path: "/purchases/fiscal-parameters", label: "Compras › Parametros Fiscales", kind: 'screen' }
  ],
  'purchases:fiscal_parameter:view': [
    { path: "/purchases/requests", label: "Compras › Solicitudes de Compra", kind: 'related' }
  ],
  'purchases:order:create': [
    { path: "/purchases/requests", label: "Compras › Solicitudes de Compra", kind: 'action' },
    { path: "/purchases/orders", label: "Compras › Ordenes de Compra", kind: 'related' }
  ],
  'purchases:order:view': [
    { path: "/purchases/orders", label: "Compras › Ordenes de Compra", kind: 'screen' },
    { path: "/purchases/suppliers/details/:supplierId", label: "Compras › Proveedores › Detalle", kind: 'related' },
    { path: "/purchases/suppliers/evaluations", label: "Compras › Evaluaciones de Proveedores", kind: 'related' }
  ],
  'purchases:personnel:manage': [
    { path: "/purchases/personnel-management", label: "Compras › Personal", kind: 'related' }
  ],
  'purchases:personnel:view': [
    { path: "/purchases/personnel-management", label: "Compras › Personal", kind: 'screen' },
    { path: "/purchases/requests", label: "Compras › Solicitudes de Compra", kind: 'related' }
  ],
  'purchases:quotation:accept': [
    { path: "/purchases/requests", label: "Compras › Solicitudes de Compra", kind: 'related' }
  ],
  'purchases:quotation:create': [
    { path: "/purchases/requests", label: "Compras › Solicitudes de Compra", kind: 'related' }
  ],
  'purchases:quotation:view': [
    { path: "/purchases/requests", label: "Compras › Solicitudes de Compra", kind: 'related' }
  ],
  'purchases:report:selection': [
    { path: "/customers/:id/schedule/pdf", label: "Clientes › Programación › PDF", kind: 'related' },
    { path: "/datasheets/:id/in-out-report", label: "Hojas de datos › Informe de entradas y salidas", kind: 'related' },
    { path: "/datasheets/:id/inspection-maintenance/:id", label: "Hojas de datos › Inspección y mantenimiento", kind: 'related' },
    { path: "/datasheets/calibration-program/:id?", label: "Hojas de datos › Programa de calibración", kind: 'related' },
    { path: "/datasheets/inventory-leasing", label: "Hojas de datos › Inventario y alquiler", kind: 'related' },
    { path: "/datasheets/inventory/:id?", label: "Hojas de datos › Inventario", kind: 'related' },
    { path: "/datasheets/maintenance-schedule/:id?", label: "Hojas de datos › Cronograma de mantenimiento", kind: 'related' }
  ],
  'purchases:report:view': [
    { path: "/customers/:id/schedule/pdf", label: "Clientes › Programación › PDF", kind: 'related' },
    { path: "/datasheets/:id/in-out-report", label: "Hojas de datos › Informe de entradas y salidas", kind: 'related' },
    { path: "/datasheets/:id/inspection-maintenance/:id", label: "Hojas de datos › Inspección y mantenimiento", kind: 'related' },
    { path: "/datasheets/calibration-program/:id?", label: "Hojas de datos › Programa de calibración", kind: 'related' },
    { path: "/datasheets/inventory-leasing", label: "Hojas de datos › Inventario y alquiler", kind: 'related' },
    { path: "/datasheets/inventory/:id?", label: "Hojas de datos › Inventario", kind: 'related' },
    { path: "/datasheets/maintenance-schedule/:id?", label: "Hojas de datos › Cronograma de mantenimiento", kind: 'related' },
    { path: "/purchases/suppliers/evaluations", label: "Compras › Evaluaciones de Proveedores", kind: 'related' }
  ],
  'purchases:request:assign_suppliers': [
    { path: "/purchases/requests", label: "Compras › Solicitudes de Compra", kind: 'related' }
  ],
  'purchases:request:create': [
    { path: "/purchases/requests", label: "Compras › Solicitudes de Compra", kind: 'action' }
  ],
  'purchases:request:decide': [
    { path: "/purchases/requests", label: "Compras › Solicitudes de Compra", kind: 'action' }
  ],
  'purchases:request:set_initial_id': [
    { path: "/purchases/requests", label: "Compras › Solicitudes de Compra", kind: 'related' }
  ],
  'purchases:request:update': [
    { path: "/purchases/requests", label: "Compras › Solicitudes de Compra", kind: 'related' }
  ],
  'purchases:request:view': [
    { path: "/purchases/requests", label: "Compras › Solicitudes de Compra", kind: 'screen' }
  ],
  'purchases:statistics:view': [
    { path: "/purchases/statistics", label: "Compras › Estadísticas", kind: 'screen' }
  ],
  'purchases:supplier:create': [
    { path: "/purchases/requests", label: "Compras › Solicitudes de Compra", kind: 'related' },
    { path: "/purchases/supplier-selection", label: "Compras › Selección de Proveedores", kind: 'related' },
    { path: "/purchases/suppliers", label: "Compras › Lista de Proveedores", kind: 'related' },
    { path: "/purchases/suppliers/details/:supplierId", label: "Compras › Proveedores › Detalle", kind: 'related' },
    { path: "/purchases/suppliers/evaluations", label: "Compras › Evaluaciones de Proveedores", kind: 'related' }
  ],
  'purchases:supplier:document_upload': [
    { path: "/purchases/suppliers/details/:supplierId", label: "Compras › Proveedores › Detalle", kind: 'related' },
    { path: "/purchases/suppliers/evaluations", label: "Compras › Evaluaciones de Proveedores", kind: 'related' }
  ],
  'purchases:supplier:retention': [
    { path: "/purchases/suppliers/details/:supplierId", label: "Compras › Proveedores › Detalle", kind: 'related' },
    { path: "/purchases/suppliers/evaluations", label: "Compras › Evaluaciones de Proveedores", kind: 'related' }
  ],
  'purchases:supplier:update': [
    { path: "/purchases/suppliers/edit/:supplierId", label: "Compras › Proveedores › Editar", kind: 'screen' },
    { path: "/purchases/suppliers/details/:supplierId", label: "Compras › Proveedores › Detalle", kind: 'action' },
    { path: "/purchases/suppliers/evaluations", label: "Compras › Evaluaciones de Proveedores", kind: 'action' }
  ],
  'purchases:supplier:view': [
    { path: "/purchases/suppliers", label: "Compras › Lista de Proveedores", kind: 'screen' },
    { path: "/purchases/suppliers/details/:supplierId", label: "Compras › Proveedores › Detalle", kind: 'screen' },
    { path: "/purchases/requests", label: "Compras › Solicitudes de Compra", kind: 'related' },
    { path: "/purchases/supplier-selection", label: "Compras › Selección de Proveedores", kind: 'related' },
    { path: "/purchases/suppliers/edit/:supplierId", label: "Compras › Proveedores › Editar", kind: 'related' },
    { path: "/purchases/suppliers/evaluations", label: "Compras › Evaluaciones de Proveedores", kind: 'related' }
  ],
  'purchases:supplier_selection:manage': [
    { path: "/purchases/requests", label: "Compras › Solicitudes de Compra", kind: 'related' },
    { path: "/purchases/supplier-selection", label: "Compras › Selección de Proveedores", kind: 'related' },
    { path: "/purchases/suppliers", label: "Compras › Lista de Proveedores", kind: 'related' },
    { path: "/purchases/suppliers/details/:supplierId", label: "Compras › Proveedores › Detalle", kind: 'related' },
    { path: "/purchases/suppliers/evaluations", label: "Compras › Evaluaciones de Proveedores", kind: 'related' }
  ],
  'purchases:supplier_selection:view': [
    { path: "/purchases/supplier-selection", label: "Compras › Selección de Proveedores", kind: 'screen' },
    { path: "/purchases/requests", label: "Compras › Solicitudes de Compra", kind: 'related' },
    { path: "/purchases/suppliers", label: "Compras › Lista de Proveedores", kind: 'related' },
    { path: "/purchases/suppliers/details/:supplierId", label: "Compras › Proveedores › Detalle", kind: 'related' },
    { path: "/purchases/suppliers/edit/:supplierId", label: "Compras › Proveedores › Editar", kind: 'related' },
    { path: "/purchases/suppliers/evaluations", label: "Compras › Evaluaciones de Proveedores", kind: 'related' }
  ],
  'purchases:verification:create': [
    { path: "/purchases/orders", label: "Compras › Ordenes de Compra", kind: 'related' }
  ],
  'purchases:verification:update': [
    { path: "/purchases/verifications", label: "Compras › Verificaciones", kind: 'related' }
  ],
  'purchases:verification:view': [
    { path: "/purchases/verifications", label: "Compras › Verificaciones", kind: 'screen' }
  ],
  'rbac:manage': [
    { path: "/settings/roles", label: "Roles y permisos", kind: 'action' }
  ],
  'rbac:view': [
    { path: "/settings/roles", label: "Roles y permisos", kind: 'screen' }
  ],
  'repositories:repository:manage': [
    { path: "/", label: "Dashboard", kind: 'action' },
    { path: "/calibraciones/subir-excel", label: "Calibraciones › Subir Excel", kind: 'action' },
    { path: "/customers/certificates-due/:id", label: "Clientes › certificates due", kind: 'action' },
    { path: "/fleet/:id/documents", label: "Flota › Documentos", kind: 'action' },
    { path: "/repository", label: "Repositorio", kind: 'action' }
  ],
  'repositories:repository:view': [
    { path: "/repository", label: "Repositorio", kind: 'screen' },
    { path: "/", label: "Dashboard", kind: 'related' },
    { path: "/calibraciones/subir-excel", label: "Calibraciones › Subir Excel", kind: 'related' },
    { path: "/customers/certificates-due/:id", label: "Clientes › certificates due", kind: 'related' },
    { path: "/fleet/:id/documents", label: "Flota › Documentos", kind: 'related' }
  ],
  'sales:config:manage': [
    { path: "/equipment-sales", label: "Venta Equipos", kind: 'action' },
    { path: "/equipment-sales/:quotationId", label: "Venta Equipos", kind: 'action' },
    { path: "/equipment-sales/:quotationId/edit", label: "Venta de equipos › Editar", kind: 'related' },
    { path: "/equipment-sales/new", label: "Venta de equipos › Nuevo", kind: 'related' },
    { path: "/equipment-sales/products", label: "Venta de equipos › Productos", kind: 'related' }
  ],
  'sales:product:manage': [
    { path: "/equipment-sales", label: "Venta Equipos", kind: 'related' },
    { path: "/equipment-sales/:quotationId", label: "Venta Equipos", kind: 'related' },
    { path: "/equipment-sales/:quotationId/edit", label: "Venta de equipos › Editar", kind: 'related' },
    { path: "/equipment-sales/new", label: "Venta de equipos › Nuevo", kind: 'related' },
    { path: "/equipment-sales/products", label: "Venta de equipos › Productos", kind: 'related' }
  ],
  'sales:product:view': [
    { path: "/equipment-sales/products", label: "Venta de equipos › Productos", kind: 'screen' },
    { path: "/equipment-sales", label: "Venta Equipos", kind: 'action' },
    { path: "/equipment-sales/:quotationId", label: "Venta Equipos", kind: 'related' },
    { path: "/equipment-sales/:quotationId/edit", label: "Venta de equipos › Editar", kind: 'related' },
    { path: "/equipment-sales/new", label: "Venta de equipos › Nuevo", kind: 'related' }
  ],
  'sales:quotation:create': [
    { path: "/equipment-sales/new", label: "Venta de equipos › Nuevo", kind: 'screen' },
    { path: "/equipment-sales", label: "Venta Equipos", kind: 'action' },
    { path: "/equipment-sales/:quotationId/edit", label: "Venta de equipos › Editar", kind: 'action' },
    { path: "/equipment-sales/:quotationId", label: "Venta Equipos", kind: 'related' },
    { path: "/equipment-sales/products", label: "Venta de equipos › Productos", kind: 'related' }
  ],
  'sales:quotation:document_upload': [
    { path: "/equipment-sales/:quotationId", label: "Venta Equipos", kind: 'action' },
    { path: "/equipment-sales", label: "Venta Equipos", kind: 'related' },
    { path: "/equipment-sales/:quotationId/edit", label: "Venta de equipos › Editar", kind: 'related' },
    { path: "/equipment-sales/new", label: "Venta de equipos › Nuevo", kind: 'related' },
    { path: "/equipment-sales/products", label: "Venta de equipos › Productos", kind: 'related' }
  ],
  'sales:quotation:invoice': [
    { path: "/equipment-sales/:quotationId", label: "Venta Equipos", kind: 'action' },
    { path: "/equipment-sales", label: "Venta Equipos", kind: 'related' },
    { path: "/equipment-sales/:quotationId/edit", label: "Venta de equipos › Editar", kind: 'related' },
    { path: "/equipment-sales/new", label: "Venta de equipos › Nuevo", kind: 'related' },
    { path: "/equipment-sales/products", label: "Venta de equipos › Productos", kind: 'related' }
  ],
  'sales:quotation:pdf': [
    { path: "/equipment-sales/:quotationId", label: "Venta Equipos", kind: 'action' },
    { path: "/equipment-sales", label: "Venta Equipos", kind: 'related' },
    { path: "/equipment-sales/:quotationId/edit", label: "Venta de equipos › Editar", kind: 'related' },
    { path: "/equipment-sales/new", label: "Venta de equipos › Nuevo", kind: 'related' },
    { path: "/equipment-sales/products", label: "Venta de equipos › Productos", kind: 'related' }
  ],
  'sales:quotation:update': [
    { path: "/equipment-sales/:quotationId/edit", label: "Venta de equipos › Editar", kind: 'screen' },
    { path: "/equipment-sales", label: "Venta Equipos", kind: 'action' },
    { path: "/equipment-sales/:quotationId", label: "Venta Equipos", kind: 'action' },
    { path: "/equipment-sales/new", label: "Venta de equipos › Nuevo", kind: 'action' },
    { path: "/equipment-sales/products", label: "Venta de equipos › Productos", kind: 'related' }
  ],
  'sales:quotation:view': [
    { path: "/equipment-sales", label: "Venta Equipos", kind: 'screen' },
    { path: "/equipment-sales/:quotationId", label: "Venta Equipos", kind: 'screen' },
    { path: "/equipment-sales/:quotationId/edit", label: "Venta de equipos › Editar", kind: 'related' },
    { path: "/equipment-sales/new", label: "Venta de equipos › Nuevo", kind: 'related' },
    { path: "/equipment-sales/products", label: "Venta de equipos › Productos", kind: 'related' }
  ],
  'sales:quotation:workflow': [
    { path: "/equipment-sales", label: "Venta Equipos", kind: 'action' },
    { path: "/equipment-sales/:quotationId", label: "Venta Equipos", kind: 'action' },
    { path: "/equipment-sales/:quotationId/edit", label: "Venta de equipos › Editar", kind: 'related' },
    { path: "/equipment-sales/new", label: "Venta de equipos › Nuevo", kind: 'related' },
    { path: "/equipment-sales/products", label: "Venta de equipos › Productos", kind: 'related' }
  ],
  'system:settings:manage': [
    { path: "/calibraciones/subir-excel", label: "Calibraciones › Subir Excel", kind: 'related' }
  ],
  'system:settings:view': [
    { path: "/calibraciones/subir-excel", label: "Calibraciones › Subir Excel", kind: 'related' }
  ],
  'tools:utility:use': [
    { path: "/excel-manipulation", label: "Manipulación de Excel", kind: 'screen' },
    { path: "/gotemberg", label: "Gotemberg", kind: 'screen' },
    { path: "/pdf-script", label: "Script de PDF", kind: 'screen' }
  ],
  'users:profile:manage': [
    { path: "/datasheets/:id/edit-calibration", label: "Hojas de datos › Editar calibración", kind: 'action' },
    { path: "/datasheets/:id/edit-maintenance", label: "Hojas de datos › Editar mantenimiento", kind: 'action' },
    { path: "/datasheets/:id/in-out", label: "Hojas de datos › Entradas y salidas", kind: 'action' },
    { path: "/datasheets/:id/new-calibration", label: "Hojas de datos › Nueva calibración", kind: 'action' },
    { path: "/datasheets/:id/new-maintenance", label: "Hojas de datos › Nuevo mantenimiento", kind: 'action' },
    { path: "/profiles", label: "Biomedicos", kind: 'action' },
    { path: "/profiles/:id", label: "Biomedicos", kind: 'action' }
  ],
  'users:role:list': [
    { path: "/customers/:id", label: "Empresas", kind: 'related' },
    { path: "/lms/admin/courses/:courseId/assignments", label: "Academia › Administración › Cursos › Asignaciones", kind: 'related' },
    { path: "/settings", label: "Ajustes", kind: 'related' },
    { path: "/users", label: "Usuarios", kind: 'related' }
  ],
  'users:user:activation': [
    { path: "/customers/:id", label: "Empresas", kind: 'action' },
    { path: "/settings", label: "Ajustes", kind: 'action' },
    { path: "/users", label: "Usuarios", kind: 'action' }
  ],
  'users:user:create': [
    { path: "/customers/:id", label: "Empresas", kind: 'action' },
    { path: "/settings", label: "Ajustes", kind: 'action' },
    { path: "/users", label: "Usuarios", kind: 'action' }
  ],
  'users:user:delete': [
    { path: "/customers/:id", label: "Empresas", kind: 'action' },
    { path: "/settings", label: "Ajustes", kind: 'action' },
    { path: "/users", label: "Usuarios", kind: 'action' }
  ],
  'users:user:list': [
    { path: "/settings", label: "Ajustes", kind: 'screen' },
    { path: "/customers/:id", label: "Empresas", kind: 'related' },
    { path: "/lms", label: "Academia › Dashboard", kind: 'related' },
    { path: "/lms/admin", label: "Academia › Administración", kind: 'related' },
    { path: "/lms/admin/analytics", label: "Academia › Analíticas", kind: 'related' },
    { path: "/lms/admin/assignments", label: "Academia › Asignaciones", kind: 'related' },
    { path: "/lms/admin/certificate-templates", label: "Academia › Plantillas de Certificados", kind: 'related' },
    { path: "/lms/admin/certificates", label: "Academia › Certificados Emitidos", kind: 'related' },
    { path: "/lms/admin/compliance", label: "Academia › Cumplimiento", kind: 'related' },
    { path: "/lms/admin/courses", label: "Academia › Gestión de Cursos", kind: 'related' },
    { path: "/lms/admin/courses/:courseId/assignments", label: "Academia › Administración › Cursos › Asignaciones", kind: 'related' },
    { path: "/lms/admin/courses/:courseId/content", label: "Academia › Administración › Cursos › Contenido", kind: 'related' },
    { path: "/lms/admin/notifications", label: "Academia › Mis notificaciones", kind: 'related' },
    { path: "/lms/admin/plans", label: "Academia › Planes de formación", kind: 'related' },
    { path: "/lms/admin/users/:userId/courses/:courseId/review", label: "Academia › Administración › Usuarios › Cursos › Revisión", kind: 'related' },
    { path: "/lms/certificate/:certificateId", label: "Academia › Certificado", kind: 'related' },
    { path: "/lms/certificates", label: "Academia › Mis Certificados", kind: 'related' },
    { path: "/lms/certificates/verify/:certificateNumber", label: "Academia › Certificados › Verificación", kind: 'related' },
    { path: "/lms/client", label: "Academia › Mi Aprendizaje", kind: 'related' },
    { path: "/lms/course/:courseId", label: "Academia › Curso", kind: 'related' },
    { path: "/lms/course/:courseId/preview", label: "Academia › Curso › Vista previa", kind: 'related' },
    { path: "/lms/employee", label: "Academia › Mi Aprendizaje", kind: 'related' },
    { path: "/users", label: "Usuarios", kind: 'related' }
  ],
  'users:user:password_reset': [
    { path: "/customers/:id", label: "Empresas", kind: 'action' },
    { path: "/settings", label: "Ajustes", kind: 'related' },
    { path: "/users", label: "Usuarios", kind: 'related' }
  ],
  'users:user:update': [
    { path: "/customers/:id", label: "Empresas", kind: 'action' },
    { path: "/settings", label: "Ajustes", kind: 'related' },
    { path: "/users", label: "Usuarios", kind: 'related' }
  ],
  'users:user:update_internal': [
    { path: "/customers/:id", label: "Empresas", kind: 'action' },
    { path: "/settings", label: "Ajustes", kind: 'action' },
    { path: "/users", label: "Usuarios", kind: 'action' }
  ],
}
