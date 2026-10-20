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
  'calibration:analytics:view': [
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'screen' }
  ],
  'calibration:certificate_history:delete': [
    { path: "/calibraciones/certificados/:id", label: "Calibraciones › Certificados", kind: 'action' }
  ],
  'calibration:certificate_type:manage': [
    { path: "/calibraciones/tipos-de-certificado", label: "Calibraciones › Tipos de Certificado", kind: 'screen' }
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
    { path: "/datasheets", label: "Inventario › Hoja de Vida", kind: 'action' }
  ],
  'calibration:datasheet:update': [
    { path: "/datasheets", label: "Inventario › Hoja de Vida", kind: 'action' },
    { path: "/datasheets/:id", label: "Inventario › Hoja de Vida", kind: 'action' }
  ],
  'calibration:datasheet:view': [
    { path: "/datasheets", label: "Inventario › Hoja de Vida", kind: 'screen' },
    { path: "/datasheets/alerts", label: "Inventario › Alertas", kind: 'screen' }
  ],
  'calibration:device:manage': [
    { path: "/calibraciones/equipos", label: "Calibraciones › Equipos", kind: 'action' }
  ],
  'calibration:device:view': [
    { path: "/calibraciones/equipos", label: "Calibraciones › Equipos", kind: 'screen' }
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
    { path: "/calibraciones/certificados/:id", label: "Calibraciones › Certificados", kind: 'action' }
  ],
  'calibration:file:create': [
    { path: "/calibraciones/subir-excel", label: "Calibraciones › Subir Excel", kind: 'screen' },
    { path: "/", label: "Dashboard", kind: 'action' },
    { path: "/calibraciones/certificados", label: "Calibraciones › Certificados", kind: 'action' },
    { path: "/customers/:id", label: "Empresas", kind: 'action' },
    { path: "/customers/certificates-due/:id", label: "Clientes › certificates due", kind: 'action' },
    { path: "/fleet/:id/documents", label: "Flota › Documentos", kind: 'action' }
  ],
  'calibration:file:delete': [
    { path: "/", label: "Dashboard", kind: 'action' },
    { path: "/calibraciones/certificados", label: "Calibraciones › Certificados", kind: 'action' },
    { path: "/calibraciones/subir-excel", label: "Calibraciones › Subir Excel", kind: 'action' },
    { path: "/customers/certificates-due/:id", label: "Clientes › certificates due", kind: 'action' },
    { path: "/fleet/:id/documents", label: "Flota › Documentos", kind: 'action' }
  ],
  'calibration:file:update': [
    { path: "/calibraciones/certificados/:id", label: "Calibraciones › Certificados", kind: 'action' }
  ],
  'calibration:inspection_maintenance:manage': [
    { path: "/datasheets/:id/edit-maintenance", label: "Hojas de datos › Editar mantenimiento", kind: 'screen' },
    { path: "/datasheets/:id/new-maintenance", label: "Hojas de datos › Nuevo mantenimiento", kind: 'screen' }
  ],
  'calibration:inspection_maintenance:view': [
    { path: "/datasheets/:id/inspection-maintenance", label: "Hojas de datos › Inspección y mantenimiento", kind: 'screen' },
    { path: "/datasheets", label: "Inventario › Hoja de Vida", kind: 'action' },
    { path: "/datasheets/:id", label: "Inventario › Hoja de Vida", kind: 'action' }
  ],
  'calibration:product:view': [
    { path: "/productos-y-servicios", label: "Productos y servicios", kind: 'screen' }
  ],
  'calibration:record:manage': [
    { path: "/datasheets/:id/edit-calibration", label: "Hojas de datos › Editar calibración", kind: 'screen' },
    { path: "/datasheets/:id/new-calibration", label: "Hojas de datos › Nueva calibración", kind: 'screen' }
  ],
  'calibration:report:view': [
    { path: "/datasheets/:id/in-out-report", label: "Hojas de datos › Informe de entradas y salidas", kind: 'screen' },
    { path: "/datasheets/:id/inspection-maintenance/:id", label: "Hojas de datos › Inspección y mantenimiento", kind: 'screen' },
    { path: "/datasheets/calibration-program/:id?", label: "Hojas de datos › Programa de calibración", kind: 'screen' },
    { path: "/datasheets/devices-on-loan", label: "Hojas de datos › Equipos en préstamo", kind: 'screen' },
    { path: "/datasheets/inventory-leasing", label: "Hojas de datos › Inventario y alquiler", kind: 'screen' },
    { path: "/datasheets/inventory/:id?", label: "Hojas de datos › Inventario", kind: 'screen' },
    { path: "/datasheets/maintenance-schedule/:id?", label: "Hojas de datos › Cronograma de mantenimiento", kind: 'screen' }
  ],
  'calibration:service:create': [
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'screen' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'screen' },
    { path: "/calibration-services/customers", label: "Servicios de calibración › Clientes", kind: 'action' }
  ],
  'calibration:service:update': [
    { path: "/calibration-services/:serviceId/edit", label: "Servicios de calibración › Editar", kind: 'action' },
    { path: "/calibration-services/new", label: "Servicios de calibración › Nuevo", kind: 'action' }
  ],
  'calibration:service:view': [
    { path: "/calibration-services", label: "Servicios Cal.", kind: 'screen' },
    { path: "/calibration-services/:serviceId", label: "Servicios Cal.", kind: 'screen' },
    { path: "/calibration-services/analytics", label: "Servicios de calibración › Analíticas", kind: 'screen' },
    { path: "/calibration-services/customers", label: "Servicios de calibración › Clientes", kind: 'screen' },
    { path: "/calibration-services/mobile/:serviceId", label: "Servicios de calibración › Vista móvil", kind: 'screen' },
    { path: "/calibration-services/notifications", label: "Servicios de calibración › Notificaciones", kind: 'screen' },
    { path: "/calibration-services/productos-y-servicios", label: "Servicios de calibración › Productos y servicios", kind: 'screen' },
    { path: "/calibration-services/schedule", label: "Servicios de calibración › Programación", kind: 'screen' }
  ],
  'calibration:template:manage': [
    { path: "/calibraciones/equipos", label: "Calibraciones › Equipos", kind: 'action' },
    { path: "/calibraciones/templates", label: "Calibraciones › Plantillas", kind: 'action' }
  ],
  'calibration:template:view': [
    { path: "/calibraciones/templates", label: "Calibraciones › Plantillas", kind: 'screen' }
  ],
  'calibration:traceability:manage': [
    { path: "/trazabilidad", label: "Trazabilidades", kind: 'action' }
  ],
  'customers:customer:avatar': [
    { path: "/customers/:id", label: "Empresas", kind: 'action' }
  ],
  'customers:customer:create': [
    { path: "/customers", label: "Empresas", kind: 'action' }
  ],
  'customers:customer:delete': [
    { path: "/customers", label: "Empresas", kind: 'action' }
  ],
  'customers:customer:manage': [
    { path: "/customers", label: "Empresas", kind: 'screen' },
    { path: "/iot/customers-management", label: "IoT › Clientes IoT", kind: 'screen' },
    { path: "/customers/:id", label: "Empresas", kind: 'action' }
  ],
  'customers:customer:update': [
    { path: "/customers", label: "Empresas", kind: 'action' },
    { path: "/customers/:id", label: "Empresas", kind: 'action' }
  ],
  'customers:customer:view': [
    { path: "/customers/:id", label: "Empresas", kind: 'screen' },
    { path: "/customers/:id/schedule/pdf", label: "Clientes › Programación › PDF", kind: 'screen' },
    { path: "/customers/certificates-due/:id", label: "Clientes › certificates due", kind: 'screen' }
  ],
  'customers:indicator:contracted_view': [
    { path: "/customers/:id", label: "Empresas", kind: 'action' }
  ],
  'customers:indicator:goal_manage': [
    { path: "/customers/:id", label: "Empresas", kind: 'action' }
  ],
  'customers:indicator:observations': [
    { path: "/customers/:id", label: "Empresas", kind: 'action' }
  ],
  'customers:indicator:view': [
    { path: "/customers/:id", label: "Empresas", kind: 'action' }
  ],
  'customers:lms_course:manage': [
    { path: "/customers/:id", label: "Empresas", kind: 'action' }
  ],
  'customers:module:assign': [
    { path: "/customers/:id", label: "Empresas", kind: 'action' },
    { path: "/modules", label: "Ajustes › Módulos", kind: 'action' }
  ],
  'customers:module:view': [
    { path: "/customers/:id", label: "Empresas", kind: 'action' },
    { path: "/modules", label: "Ajustes › Módulos", kind: 'action' }
  ],
  'customers:module_catalog:view': [
    { path: "/modules", label: "Ajustes › Módulos", kind: 'screen' }
  ],
  'customers:service:view_own': [
    { path: "/customers/:id", label: "Empresas", kind: 'action' }
  ],
  'customers:site:manage': [
    { path: "/customers/:id", label: "Empresas", kind: 'action' }
  ],
  'customers:user:list': [
    { path: "/customers/:id", label: "Empresas", kind: 'action' }
  ],
  'fleet:intervention_type:manage': [
    { path: "/fleet/interventions", label: "Flota › Tipos de intervención", kind: 'action' }
  ],
  'fleet:intervention_type:view': [
    { path: "/fleet/interventions", label: "Flota › Tipos de intervención", kind: 'screen' }
  ],
  'fleet:maintenance:manage': [
    { path: "/fleet/:id/interventions", label: "Flota › Tipos de intervención", kind: 'action' }
  ],
  'fleet:maintenance:view': [
    { path: "/fleet/:id/interventions", label: "Flota › Tipos de intervención", kind: 'screen' }
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
    { path: "/fleet/:id/inspections", label: "Flota › Inspecciones", kind: 'screen' }
  ],
  'iot:device:list': [
    { path: "/iot", label: "IoT", kind: 'screen' },
    { path: "/iot/map", label: "IoT › Mapa", kind: 'screen' }
  ],
  'iot:device:manage': [
    { path: "/iot", label: "IoT", kind: 'action' }
  ],
  'iot:device:view': [
    { path: "/iot/email-settings", label: "IoT › Correos de alerta", kind: 'screen' }
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
    { path: "/lms/admin/users", label: "Academia › Gestión de Usuarios", kind: 'screen' }
  ],
  'maintenance:analytics:view': [
    { path: "/maintenance/analytics", label: "Mantenimiento › Analíticas", kind: 'screen' }
  ],
  'maintenance:invoicing:manage': [
    { path: "/maintenance/billing", label: "Mantenimiento › Facturación", kind: 'action' }
  ],
  'maintenance:invoicing:view': [
    { path: "/maintenance/billing", label: "Mantenimiento › Facturación", kind: 'screen' }
  ],
  'maintenance:protocol:manage': [
    { path: "/maintenance/protocols", label: "Mantenimiento › Protocolos", kind: 'screen' }
  ],
  'maintenance:technician:list': [
    { path: "/maintenance/technicians", label: "Mantenimiento › Técnicos", kind: 'screen' },
    { path: "/maintenance", label: "Mantenimiento › Dashboard", kind: 'action' },
    { path: "/maintenance/tickets/:ticketId", label: "Mantenimiento › Tickets", kind: 'action' }
  ],
  'maintenance:ticket:create': [
    { path: "/maintenance", label: "Mantenimiento › Dashboard", kind: 'action' }
  ],
  'maintenance:ticket:manage_all': [
    { path: "/maintenance", label: "Mantenimiento › Dashboard", kind: 'action' },
    { path: "/maintenance/tickets/:ticketId", label: "Mantenimiento › Tickets", kind: 'action' }
  ],
  'maintenance:ticket:view': [
    { path: "/maintenance", label: "Mantenimiento › Dashboard", kind: 'screen' },
    { path: "/maintenance/tickets/:ticketId", label: "Mantenimiento › Tickets", kind: 'screen' }
  ],
  'nonconform:report:view': [
    { path: "/non-conform-work-reports", label: "Calidad › Trabajo no Conforme", kind: 'screen' }
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
  'purchases:order:create': [
    { path: "/purchases/requests", label: "Compras › Solicitudes de Compra", kind: 'action' }
  ],
  'purchases:order:view': [
    { path: "/purchases/orders", label: "Compras › Ordenes de Compra", kind: 'screen' }
  ],
  'purchases:personnel:view': [
    { path: "/purchases/personnel-management", label: "Compras › Personal", kind: 'screen' }
  ],
  'purchases:request:create': [
    { path: "/purchases/requests", label: "Compras › Solicitudes de Compra", kind: 'action' }
  ],
  'purchases:request:decide': [
    { path: "/purchases/requests", label: "Compras › Solicitudes de Compra", kind: 'action' }
  ],
  'purchases:request:view': [
    { path: "/purchases/requests", label: "Compras › Solicitudes de Compra", kind: 'screen' }
  ],
  'purchases:statistics:view': [
    { path: "/purchases/statistics", label: "Compras › Estadísticas", kind: 'screen' }
  ],
  'purchases:supplier:update': [
    { path: "/purchases/suppliers/edit/:supplierId", label: "Compras › Proveedores › Editar", kind: 'screen' },
    { path: "/purchases/suppliers/details/:supplierId", label: "Compras › Proveedores › Detalle", kind: 'action' },
    { path: "/purchases/suppliers/evaluations", label: "Compras › Evaluaciones de Proveedores", kind: 'action' }
  ],
  'purchases:supplier:view': [
    { path: "/purchases/suppliers", label: "Compras › Lista de Proveedores", kind: 'screen' },
    { path: "/purchases/suppliers/details/:supplierId", label: "Compras › Proveedores › Detalle", kind: 'screen' }
  ],
  'purchases:supplier_selection:view': [
    { path: "/purchases/supplier-selection", label: "Compras › Selección de Proveedores", kind: 'screen' }
  ],
  'purchases:verification:view': [
    { path: "/purchases/verifications", label: "Compras › Verificaciones", kind: 'screen' }
  ],
  'rbac:manage': [
    { path: "/settings/roles", label: "Ajustes › Roles y permisos", kind: 'action' }
  ],
  'rbac:view': [
    { path: "/settings/roles", label: "Ajustes › Roles y permisos", kind: 'screen' }
  ],
  'repositories:repository:manage': [
    { path: "/", label: "Dashboard", kind: 'action' },
    { path: "/calibraciones/subir-excel", label: "Calibraciones › Subir Excel", kind: 'action' },
    { path: "/customers/certificates-due/:id", label: "Clientes › certificates due", kind: 'action' },
    { path: "/fleet/:id/documents", label: "Flota › Documentos", kind: 'action' },
    { path: "/repository", label: "Repositorio", kind: 'action' }
  ],
  'repositories:repository:view': [
    { path: "/repository", label: "Repositorio", kind: 'screen' }
  ],
  'sales:config:manage': [
    { path: "/equipment-sales", label: "Venta Equipos", kind: 'action' },
    { path: "/equipment-sales/:quotationId", label: "Venta Equipos", kind: 'action' }
  ],
  'sales:product:view': [
    { path: "/equipment-sales/products", label: "Venta de equipos › Productos", kind: 'screen' },
    { path: "/equipment-sales", label: "Venta Equipos", kind: 'action' }
  ],
  'sales:quotation:create': [
    { path: "/equipment-sales/new", label: "Venta de equipos › Nuevo", kind: 'screen' },
    { path: "/equipment-sales", label: "Venta Equipos", kind: 'action' },
    { path: "/equipment-sales/:quotationId/edit", label: "Venta de equipos › Editar", kind: 'action' }
  ],
  'sales:quotation:document_upload': [
    { path: "/equipment-sales/:quotationId", label: "Venta Equipos", kind: 'action' }
  ],
  'sales:quotation:invoice': [
    { path: "/equipment-sales/:quotationId", label: "Venta Equipos", kind: 'action' }
  ],
  'sales:quotation:pdf': [
    { path: "/equipment-sales/:quotationId", label: "Venta Equipos", kind: 'action' }
  ],
  'sales:quotation:update': [
    { path: "/equipment-sales/:quotationId/edit", label: "Venta de equipos › Editar", kind: 'screen' },
    { path: "/equipment-sales", label: "Venta Equipos", kind: 'action' },
    { path: "/equipment-sales/:quotationId", label: "Venta Equipos", kind: 'action' },
    { path: "/equipment-sales/new", label: "Venta de equipos › Nuevo", kind: 'action' }
  ],
  'sales:quotation:view': [
    { path: "/equipment-sales", label: "Venta Equipos", kind: 'screen' },
    { path: "/equipment-sales/:quotationId", label: "Venta Equipos", kind: 'screen' }
  ],
  'sales:quotation:workflow': [
    { path: "/equipment-sales", label: "Venta Equipos", kind: 'action' },
    { path: "/equipment-sales/:quotationId", label: "Venta Equipos", kind: 'action' }
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
  'users:user:activation': [
    { path: "/customers/:id", label: "Empresas", kind: 'action' },
    { path: "/settings", label: "Ajustes › Usuarios", kind: 'action' },
    { path: "/users", label: "Usuarios", kind: 'action' }
  ],
  'users:user:create': [
    { path: "/customers/:id", label: "Empresas", kind: 'action' },
    { path: "/settings", label: "Ajustes › Usuarios", kind: 'action' },
    { path: "/users", label: "Usuarios", kind: 'action' }
  ],
  'users:user:delete': [
    { path: "/customers/:id", label: "Empresas", kind: 'action' },
    { path: "/settings", label: "Ajustes › Usuarios", kind: 'action' },
    { path: "/users", label: "Usuarios", kind: 'action' }
  ],
  'users:user:list': [
    { path: "/settings", label: "Ajustes › Usuarios", kind: 'screen' }
  ],
  'users:user:password_reset': [
    { path: "/customers/:id", label: "Empresas", kind: 'action' }
  ],
  'users:user:update': [
    { path: "/customers/:id", label: "Empresas", kind: 'action' }
  ],
  'users:user:update_internal': [
    { path: "/customers/:id", label: "Empresas", kind: 'action' },
    { path: "/settings", label: "Ajustes › Usuarios", kind: 'action' },
    { path: "/users", label: "Usuarios", kind: 'action' }
  ],
}
