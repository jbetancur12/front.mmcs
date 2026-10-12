/**
 * Capacidades (permisos) que entrega el backend en `permissions` de /auth/validateToken.
 *
 * Espejo de api.mmcs/constants/permissions.js: mismas claves, mismos nombres de constante.
 * Si el catálogo del backend cambia, regenerar este archivo (el test del backend
 * test/permissionCatalog.test.js falla si las claves dejan de coincidir).
 *
 * Solo cosmético: la autorización real vive en el backend. Lo que muestra el front sale de
 * lo que el backend dice que el usuario puede hacer, así los menús y botones no pueden
 * desalinearse de las rutas (a diferencia de comparar roles en la interfaz).
 */
export const PERMISSIONS = {
  /** Ver tickets, su línea de tiempo, informe técnico, comentarios, archivos, PDFs y buscar herramientas */
  MAINTENANCE_TICKET_VIEW: 'maintenance:ticket:view',
  /** Crear tickets de mantenimiento */
  MAINTENANCE_TICKET_CREATE: 'maintenance:ticket:create',
  /** Editar tickets (sin maintenance:ticket:manage_all, solo los asignados y ciertos campos) */
  MAINTENANCE_TICKET_UPDATE: 'maintenance:ticket:update',
  /** Eliminar tickets */
  MAINTENANCE_TICKET_DELETE: 'maintenance:ticket:delete',
  /** Crear o editar el informe técnico de un ticket */
  MAINTENANCE_TECHNICAL_REPORT_EDIT: 'maintenance:technical_report:edit',
  /** Operar sobre cualquier ticket, informe técnico o técnico. Sin esta capacidad solo se trabaja sobre los tickets asignados a uno mismo y con campos limitados */
  MAINTENANCE_TICKET_MANAGE_ALL: 'maintenance:ticket:manage_all',
  /** Comentar tickets */
  MAINTENANCE_COMMENT_CREATE: 'maintenance:comment:create',
  /** Editar o eliminar comentarios (propios; los ajenos con maintenance:comment:moderate) */
  MAINTENANCE_COMMENT_MANAGE: 'maintenance:comment:manage',
  /** Ver los comentarios internos de un ticket (los demás solo ven los visibles al cliente) */
  MAINTENANCE_COMMENT_VIEW_INTERNAL: 'maintenance:comment:view_internal',
  /** Editar o eliminar comentarios de otras personas (sin ella, solo los propios) */
  MAINTENANCE_COMMENT_MODERATE: 'maintenance:comment:moderate',
  /** Subir archivos a un ticket */
  MAINTENANCE_FILE_UPLOAD: 'maintenance:file:upload',
  /** Editar o eliminar archivos de tickets */
  MAINTENANCE_FILE_MANAGE: 'maintenance:file:manage',
  /** Ver también los archivos no públicos de un ticket (los demás solo ven los públicos) */
  MAINTENANCE_FILE_VIEW_ALL: 'maintenance:file:view_all',
  /** Ver los archivos desactivados de un ticket */
  MAINTENANCE_FILE_VIEW_INACTIVE: 'maintenance:file:view_inactive',
  /** Editar o eliminar archivos subidos por cualquier persona (sin ella, solo los propios) */
  MAINTENANCE_FILE_MANAGE_ALL: 'maintenance:file:manage_all',
  /** Editar o eliminar los archivos que subió un técnico */
  MAINTENANCE_FILE_MANAGE_TECHNICIAN_UPLOADS: 'maintenance:file:manage_technician_uploads',
  /** Ver estadísticas de archivos */
  MAINTENANCE_FILE_STATISTICS: 'maintenance:file:statistics',
  /** Ver protocolos de mantenimiento */
  MAINTENANCE_PROTOCOL_VIEW: 'maintenance:protocol:view',
  /** Crear, editar y eliminar protocolos */
  MAINTENANCE_PROTOCOL_MANAGE: 'maintenance:protocol:manage',
  /** Ver ficha, métricas y bitácora de un técnico */
  MAINTENANCE_TECHNICIAN_VIEW: 'maintenance:technician:view',
  /** Listar técnicos */
  MAINTENANCE_TECHNICIAN_LIST: 'maintenance:technician:list',
  /** Dar de alta técnicos */
  MAINTENANCE_TECHNICIAN_CREATE: 'maintenance:technician:create',
  /** Editar técnicos (el técnico solo su propia ficha: regla del controlador) */
  MAINTENANCE_TECHNICIAN_UPDATE: 'maintenance:technician:update',
  /** Eliminar técnicos */
  MAINTENANCE_TECHNICIAN_DELETE: 'maintenance:technician:delete',
  /** Recalcular la carga de trabajo de los técnicos */
  MAINTENANCE_TECHNICIAN_RECALCULATE_WORKLOAD: 'maintenance:technician:recalculate_workload',
  /** Ver estadísticas, tablero y analítica de mantenimiento */
  MAINTENANCE_ANALYTICS_VIEW: 'maintenance:analytics:view',
  /** Ver tickets por facturar */
  MAINTENANCE_INVOICING_VIEW: 'maintenance:invoicing:view',
  /** Marcar tickets como facturados */
  MAINTENANCE_INVOICING_MANAGE: 'maintenance:invoicing:manage',
  /** Ver solicitudes de compra */
  PURCHASES_REQUEST_VIEW: 'purchases:request:view',
  /** Crear solicitudes de compra */
  PURCHASES_REQUEST_CREATE: 'purchases:request:create',
  /** Editar solicitudes de compra */
  PURCHASES_REQUEST_UPDATE: 'purchases:request:update',
  /** Pre-aprobar, aprobar o rechazar solicitudes de compra */
  PURCHASES_REQUEST_DECIDE: 'purchases:request:decide',
  /** Asignar proveedores a los ítems de una solicitud */
  PURCHASES_REQUEST_ASSIGN_SUPPLIERS: 'purchases:request:assign_suppliers',
  /** Fijar el consecutivo inicial de solicitudes */
  PURCHASES_REQUEST_SET_INITIAL_ID: 'purchases:request:set_initial_id',
  /** Ver cotizaciones de compra */
  PURCHASES_QUOTATION_VIEW: 'purchases:quotation:view',
  /** Registrar cotizaciones de compra */
  PURCHASES_QUOTATION_CREATE: 'purchases:quotation:create',
  /** Aceptar una cotización de compra */
  PURCHASES_QUOTATION_ACCEPT: 'purchases:quotation:accept',
  /** Ver órdenes de compra y el historial de compras por proveedor */
  PURCHASES_ORDER_VIEW: 'purchases:order:view',
  /** Generar órdenes de compra */
  PURCHASES_ORDER_CREATE: 'purchases:order:create',
  /** Ver verificaciones de compra */
  PURCHASES_VERIFICATION_VIEW: 'purchases:verification:view',
  /** Crear verificaciones de compra */
  PURCHASES_VERIFICATION_CREATE: 'purchases:verification:create',
  /** Editar verificaciones de compra */
  PURCHASES_VERIFICATION_UPDATE: 'purchases:verification:update',
  /** Ver proveedores, sus documentos y el estado de sus evaluaciones */
  PURCHASES_SUPPLIER_VIEW: 'purchases:supplier:view',
  /** Registrar proveedores */
  PURCHASES_SUPPLIER_CREATE: 'purchases:supplier:create',
  /** Editar los datos de un proveedor */
  PURCHASES_SUPPLIER_UPDATE: 'purchases:supplier:update',
  /** Cambiar la retención de un proveedor */
  PURCHASES_SUPPLIER_RETENTION: 'purchases:supplier:retention',
  /** Subir documentos de un proveedor */
  PURCHASES_SUPPLIER_DOCUMENT_UPLOAD: 'purchases:supplier:document_upload',
  /** Ver la selección de proveedores */
  PURCHASES_SUPPLIER_SELECTION_VIEW: 'purchases:supplier_selection:view',
  /** Crear y editar la selección de proveedores */
  PURCHASES_SUPPLIER_SELECTION_MANAGE: 'purchases:supplier_selection:manage',
  /** Ver evaluaciones de proveedores */
  PURCHASES_EVALUATION_VIEW: 'purchases:evaluation:view',
  /** Crear y editar evaluaciones de proveedores */
  PURCHASES_EVALUATION_MANAGE: 'purchases:evaluation:manage',
  /** Ver las estadísticas de compras */
  PURCHASES_STATISTICS_VIEW: 'purchases:statistics:view',
  /** Descargar los informes PDF de compras (proveedores, solicitudes, órdenes, verificaciones, evaluaciones y cotizaciones) */
  PURCHASES_REPORT_VIEW: 'purchases:report:view',
  /** Descargar el informe de selección de proveedores (FOG-MMCS-10) */
  PURCHASES_REPORT_SELECTION: 'purchases:report:selection',
  /** Ver el personal de compras */
  PURCHASES_PERSONNEL_VIEW: 'purchases:personnel:view',
  /** Crear, editar y eliminar personal de compras */
  PURCHASES_PERSONNEL_MANAGE: 'purchases:personnel:manage',
  /** Consultar los parámetros fiscales activos (los usa el modal de generar una orden de compra) */
  PURCHASES_FISCAL_PARAMETER_VIEW: 'purchases:fiscal_parameter:view',
  /** Gestionar los parámetros fiscales (listar todos, crear, editar y eliminar) */
  PURCHASES_FISCAL_PARAMETER_MANAGE: 'purchases:fiscal_parameter:manage',
  /** Ver las cotizaciones de venta de equipos, sus documentos y descargarlos */
  SALES_QUOTATION_VIEW: 'sales:quotation:view',
  /** Crear cotizaciones de venta de equipos */
  SALES_QUOTATION_CREATE: 'sales:quotation:create',
  /** Editar cotizaciones de venta de equipos */
  SALES_QUOTATION_UPDATE: 'sales:quotation:update',
  /** Mover una cotización por el flujo: enviar al cliente, registrar aprobación, rechazo o cambios, dejarla lista para facturar y cancelarla */
  SALES_QUOTATION_WORKFLOW: 'sales:quotation:workflow',
  /** Facturar una cotización que está lista para facturar */
  SALES_QUOTATION_INVOICE: 'sales:quotation:invoice',
  /** Subir documentos y evidencias a una cotización */
  SALES_QUOTATION_DOCUMENT_UPLOAD: 'sales:quotation:document_upload',
  /** Generar el PDF de una cotización */
  SALES_QUOTATION_PDF: 'sales:quotation:pdf',
  /** Ver el catálogo de productos de venta de equipos */
  SALES_PRODUCT_VIEW: 'sales:product:view',
  /** Crear, editar y desactivar productos de venta de equipos */
  SALES_PRODUCT_MANAGE: 'sales:product:manage',
  /** Ver y editar el consecutivo y la plantilla de términos de las cotizaciones (cambiar un consecutivo ya iniciado sigue siendo solo de admin y super_admin: regla del controlador) */
  SALES_CONFIG_MANAGE: 'sales:config:manage',
  /** Consultar el catálogo de empresas y sus sedes (lo usan los selectores de cotizaciones, servicios y mapas) */
  CUSTOMERS_CUSTOMER_CATALOG: 'customers:customer:catalog',
  /** Ver la ficha de una empresa. OJO: el controlador NO limita al usuario de una empresa cliente a la suya (pendiente, ver docs/rbac/RUTAS_SOLO_SESION.md) */
  CUSTOMERS_CUSTOMER_VIEW: 'customers:customer:view',
  /** Crear empresas */
  CUSTOMERS_CUSTOMER_CREATE: 'customers:customer:create',
  /** Editar empresas (datos, estado activo y perfil de certificados) */
  CUSTOMERS_CUSTOMER_UPDATE: 'customers:customer:update',
  /** Eliminar empresas */
  CUSTOMERS_CUSTOMER_DELETE: 'customers:customer:delete',
  /** Gestionar empresas: pantalla de empresas, archivos, usuarios, correos de notificación y empresas con módulo IoT */
  CUSTOMERS_CUSTOMER_MANAGE: 'customers:customer:manage',
  /** Cambiar la imagen de una empresa */
  CUSTOMERS_CUSTOMER_AVATAR: 'customers:customer:avatar',
  /** Agregar, editar y eliminar las sedes de una empresa */
  CUSTOMERS_SITE_MANAGE: 'customers:site:manage',
  /** Ver los módulos contratados por una empresa */
  CUSTOMERS_MODULE_VIEW: 'customers:module:view',
  /** Activar o desactivar módulos a una empresa */
  CUSTOMERS_MODULE_ASSIGN: 'customers:module:assign',
  /** Ver, asignar y quitar los cursos de la academia de una empresa */
  CUSTOMERS_LMS_COURSE_MANAGE: 'customers:lms_course:manage',
  /** Ver el catálogo de módulos del sistema */
  CUSTOMERS_MODULE_CATALOG_VIEW: 'customers:module_catalog:view',
  /** Crear módulos en el catálogo del sistema */
  CUSTOMERS_MODULE_CATALOG_MANAGE: 'customers:module_catalog:manage',
  /** Ver los sensores de condiciones del laboratorio y su histórico */
  LABORATORY_DEVICE_VIEW: 'laboratory:device:view',
  /** Crear, editar y eliminar los sensores de condiciones del laboratorio */
  LABORATORY_DEVICE_MANAGE: 'laboratory:device:manage',
  /** Ver cámaras, patrones, sensores y lecturas de calibración del laboratorio */
  LABORATORY_CALIBRATION_VIEW: 'laboratory:calibration:view',
  /** Crear, editar y eliminar cámaras, patrones y sensores, y configurar un patrón */
  LABORATORY_CALIBRATION_MANAGE: 'laboratory:calibration:manage',
  /** Listar dispositivos IoT (solo los de su empresa; todos con iot:device:view_all) */
  IOT_DEVICE_LIST: 'iot:device:list',
  /** Ver los dispositivos IoT de todas las empresas en el listado (sin ella, solo los de su empresa) */
  IOT_DEVICE_VIEW_ALL: 'iot:device:view_all',
  /** Ver dispositivos IoT por id o cliente, su histórico, energía, alarmas, eventos y datos agregados */
  IOT_DEVICE_VIEW: 'iot:device:view',
  /** Crear, editar y eliminar dispositivos IoT y configurar sus módulos */
  IOT_DEVICE_MANAGE: 'iot:device:manage',
  /** Crear y editar alarmas de dispositivos IoT */
  IOT_ALARM_MANAGE: 'iot:alarm:manage',
  /** Ver los informes de trabajo no conforme, sus alertas y verificar códigos */
  NONCONFORM_REPORT_VIEW: 'nonconform:report:view',
  /** Crear, editar y eliminar informes de trabajo no conforme */
  NONCONFORM_REPORT_MANAGE: 'nonconform:report:manage',
  /** Listar los usuarios y los usuarios internos */
  USERS_USER_LIST: 'users:user:list',
  /** Ver un usuario. OJO: el controlador NO limita al usuario de una empresa cliente al suyo (pendiente, ver docs/rbac/RUTAS_SOLO_SESION.md) */
  USERS_USER_VIEW: 'users:user:view',
  /** Crear usuarios (registro), con sus roles */
  USERS_USER_CREATE: 'users:user:create',
  /** Editar un usuario de una empresa (datos y estado activo) */
  USERS_USER_UPDATE: 'users:user:update',
  /** Editar usuarios internos, incluidos sus roles */
  USERS_USER_UPDATE_INTERNAL: 'users:user:update_internal',
  /** Eliminar usuarios */
  USERS_USER_DELETE: 'users:user:delete',
  /** Cambiar la contraseña de otro usuario */
  USERS_USER_PASSWORD_RESET: 'users:user:password_reset',
  /** Generar y reenviar el enlace de activación de un usuario */
  USERS_USER_ACTIVATION: 'users:user:activation',
  /** Listar los roles (para asignarlos a personas y a cursos) */
  USERS_ROLE_LIST: 'users:role:list',
  /** Suplantar a otro usuario y ver la lista de candidatos */
  USERS_IMPERSONATION_USE: 'users:impersonation:use',
  /** Crear, editar y eliminar perfiles de biomédicos, su imagen y su hoja de vida */
  USERS_PROFILE_MANAGE: 'users:profile:manage',
  /** Ver las contraseñas de libros Excel guardadas (Subir Excel) */
  SYSTEM_SETTINGS_VIEW: 'system:settings:view',
  /** Crear, editar y eliminar las contraseñas de libros Excel guardadas (Subir Excel) */
  SYSTEM_SETTINGS_MANAGE: 'system:settings:manage',
  /** Ver los servicios de calibración, su línea de tiempo, documentos, notificaciones, SLA y configuración de WhatsApp */
  CALIBRATION_SERVICE_VIEW: 'calibration:service:view',
  /** Crear servicios de calibración */
  CALIBRATION_SERVICE_CREATE: 'calibration:service:create',
  /** Editar servicios de calibración */
  CALIBRATION_SERVICE_UPDATE: 'calibration:service:update',
  /** Enviar la cotización de un servicio a aprobación del cliente */
  CALIBRATION_SERVICE_REQUEST_APPROVAL: 'calibration:service:request_approval',
  /** Generar el PDF de cotización de un servicio */
  CALIBRATION_SERVICE_QUOTE_PDF: 'calibration:service:quote_pdf',
  /** Ver y editar la plantilla de términos de las cotizaciones de servicios */
  CALIBRATION_SERVICE_QUOTE_TERMS: 'calibration:service:quote_terms',
  /** Registrar la aprobación, el rechazo o la solicitud de cambios del cliente sobre un servicio */
  CALIBRATION_SERVICE_DECIDE: 'calibration:service:decide',
  /** Emitir la orden de servicio (ODS) y generar su PDF */
  CALIBRATION_SERVICE_ODS: 'calibration:service:ods',
  /** Programar un servicio y ver los metrólogos asignables */
  CALIBRATION_SERVICE_SCHEDULE: 'calibration:service:schedule',
  /** Reprogramar un servicio */
  CALIBRATION_SERVICE_RESCHEDULE: 'calibration:service:reschedule',
  /** Reasignar el metrólogo de un servicio */
  CALIBRATION_SERVICE_REASSIGN: 'calibration:service:reassign',
  /** Pausar y reanudar un servicio */
  CALIBRATION_SERVICE_PAUSE: 'calibration:service:pause',
  /** Cancelar un servicio */
  CALIBRATION_SERVICE_CANCEL: 'calibration:service:cancel',
  /** Ejecutar un servicio: iniciar y terminar, avances por ítem, cortes, ajustes, firmas y PDF de avance técnico */
  CALIBRATION_SERVICE_EXECUTE: 'calibration:service:execute',
  /** Registrar los datos del cliente durante la ejecución de un servicio */
  CALIBRATION_SERVICE_EXECUTION_CUSTOMER: 'calibration:service:execution_customer',
  /** Hacer la revisión técnica de un ajuste (desviación) */
  CALIBRATION_ADJUSTMENT_REVIEW_TECHNICAL: 'calibration:adjustment:review_technical',
  /** Hacer la revisión económica de un ajuste, enviarlo al cliente y registrar su respuesta (también habilita sus PDF junto con la revisión técnica) */
  CALIBRATION_ADJUSTMENT_COMMERCIAL: 'calibration:adjustment:commercial',
  /** Marcar un corte como facturado y registrar su pago */
  CALIBRATION_SERVICE_INVOICING: 'calibration:service:invoicing',
  /** Cerrar un servicio */
  CALIBRATION_SERVICE_CLOSE: 'calibration:service:close',
  /** Controlar los documentos de un corte */
  CALIBRATION_SERVICE_DOCUMENT_CONTROL: 'calibration:service:document_control',
  /** Subir documentos a un servicio */
  CALIBRATION_SERVICE_DOCUMENT_UPLOAD: 'calibration:service:document_upload',
  /** Registrar la trazabilidad física y el control logístico de un servicio (incluye PDF y correo) */
  CALIBRATION_SERVICE_TRACEABILITY: 'calibration:service:traceability',
  /** Enviar al cliente el certificado de un servicio */
  CALIBRATION_SERVICE_CERTIFICATE_SEND: 'calibration:service:certificate_send',
  /** Ver y editar el consecutivo de los servicios de calibración */
  CALIBRATION_CONFIG_SEQUENCE: 'calibration:config:sequence',
  /** Editar la configuración de SLA */
  CALIBRATION_CONFIG_SLA_MANAGE: 'calibration:config:sla_manage',
  /** Crear, editar y eliminar la configuración de WhatsApp de los servicios */
  CALIBRATION_CONFIG_WHATSAPP_MANAGE: 'calibration:config:whatsapp_manage',
  /** Ver las analíticas de servicios de calibración */
  CALIBRATION_ANALYTICS_VIEW: 'calibration:analytics:view',
  /** Crear certificados y archivos de equipos de una empresa (incluida la carga directa del PDF) */
  CALIBRATION_FILE_CREATE: 'calibration:file:create',
  /** Listar los certificados y ver los próximos a vencer (el usuario de una empresa solo ve los de su empresa: el controlador filtra por customers:customer:manage) */
  CALIBRATION_FILE_LIST: 'calibration:file:list',
  /** Editar certificados y archivos de equipos, y cambiar su sede */
  CALIBRATION_FILE_UPDATE: 'calibration:file:update',
  /** Eliminar certificados y archivos de equipos */
  CALIBRATION_FILE_DELETE: 'calibration:file:delete',
  /** Reasignar equipos en lote (vista previa y aplicación) */
  CALIBRATION_FILE_BULK_REASSIGN: 'calibration:file:bulk_reassign',
  /** Ver los certificados próximos a vencer agrupados (el usuario de una empresa solo los suyos: regla del controlador) */
  CALIBRATION_FILE_EXPIRING_GROUPED: 'calibration:file:expiring_grouped',
  /** Ver el listado de hojas de datos de equipos, sus alertas y su estado */
  CALIBRATION_DATASHEET_VIEW: 'calibration:datasheet:view',
  /** Ver el detalle de una hoja de datos, su reporte de entradas y salidas y su factura */
  CALIBRATION_DATASHEET_DETAIL: 'calibration:datasheet:detail',
  /** Crear hojas de datos de equipos */
  CALIBRATION_DATASHEET_CREATE: 'calibration:datasheet:create',
  /** Editar hojas de datos de equipos, su estado, imagen y factura */
  CALIBRATION_DATASHEET_UPDATE: 'calibration:datasheet:update',
  /** Eliminar hojas de datos de equipos */
  CALIBRATION_DATASHEET_DELETE: 'calibration:datasheet:delete',
  /** Ver el listado de equipos */
  CALIBRATION_DEVICE_VIEW: 'calibration:device:view',
  /** Ver el detalle, crear, editar y eliminar equipos */
  CALIBRATION_DEVICE_MANAGE: 'calibration:device:manage',
  /** Ver los registros de calibración */
  CALIBRATION_RECORD_VIEW: 'calibration:record:view',
  /** Crear, editar y eliminar registros de calibración */
  CALIBRATION_RECORD_MANAGE: 'calibration:record:manage',
  /** Ver el historial de calibraciones */
  CALIBRATION_HISTORY_VIEW: 'calibration:history:view',
  /** Crear y editar el historial de calibraciones */
  CALIBRATION_HISTORY_MANAGE: 'calibration:history:manage',
  /** Ver el listado de tipos de certificado */
  CALIBRATION_CERTIFICATE_TYPE_VIEW: 'calibration:certificate_type:view',
  /** Ver el detalle, crear, editar y eliminar tipos de certificado */
  CALIBRATION_CERTIFICATE_TYPE_MANAGE: 'calibration:certificate_type:manage',
  /** Eliminar un registro del historial de certificados */
  CALIBRATION_CERTIFICATE_HISTORY_DELETE: 'calibration:certificate_history:delete',
  /** Ver el listado de plantillas */
  CALIBRATION_TEMPLATE_VIEW: 'calibration:template:view',
  /** Ver el detalle, crear, editar y eliminar plantillas */
  CALIBRATION_TEMPLATE_MANAGE: 'calibration:template:manage',
  /** Ver documentos */
  CALIBRATION_DOCUMENT_VIEW: 'calibration:document:view',
  /** Crear, editar y eliminar documentos */
  CALIBRATION_DOCUMENT_MANAGE: 'calibration:document:manage',
  /** Crear, editar y eliminar trazabilidades */
  CALIBRATION_TRACEABILITY_MANAGE: 'calibration:traceability:manage',
  /** Ver el detalle de una entrada o salida de equipo */
  CALIBRATION_EQUIPMENT_INOUT_VIEW: 'calibration:equipment_inout:view',
  /** Listar las entradas y salidas de equipos */
  CALIBRATION_EQUIPMENT_INOUT_LIST: 'calibration:equipment_inout:list',
  /** Registrar, editar y eliminar entradas y salidas de equipos */
  CALIBRATION_EQUIPMENT_INOUT_MANAGE: 'calibration:equipment_inout:manage',
  /** Ver las inspecciones y mantenimientos de equipos */
  CALIBRATION_INSPECTION_MAINTENANCE_VIEW: 'calibration:inspection_maintenance:view',
  /** Crear, editar y eliminar inspecciones y mantenimientos de equipos */
  CALIBRATION_INSPECTION_MAINTENANCE_MANAGE: 'calibration:inspection_maintenance:manage',
  /** Ver el catálogo de productos y servicios */
  CALIBRATION_PRODUCT_VIEW: 'calibration:product:view',
  /** Crear, editar, eliminar, importar y actualizar precios de productos y servicios */
  CALIBRATION_PRODUCT_MANAGE: 'calibration:product:manage',
  /** Descargar los informes de inventario, calibración, mantenimiento, préstamos y entradas y salidas de equipos */
  CALIBRATION_REPORT_VIEW: 'calibration:report:view',
  /** Administrar la capacitación: ver los datos de cualquier usuario y operar el LMS como administrador (también decide la bandera canManageTraining del LMS) */
  LMS_TRAINING_MANAGE: 'lms:training:manage',
  /** Gestionar cursos, contenido, evaluaciones y archivos del LMS */
  LMS_COURSE_MANAGE: 'lms:course:manage',
  /** Gestionar las asignaciones de cursos */
  LMS_ASSIGNMENT_MANAGE: 'lms:assignment:manage',
  /** Gestionar los planes de formación */
  LMS_PLAN_MANAGE: 'lms:plan:manage',
  /** Generar y gestionar los reportes del LMS */
  LMS_REPORT_MANAGE: 'lms:report:manage',
  /** Ver analíticas de cursos, progreso y evaluaciones */
  LMS_ANALYTICS_VIEW: 'lms:analytics:view',
  /** Gestionar certificados del LMS (listados y acciones de administración) */
  LMS_CERTIFICATE_MANAGE: 'lms:certificate:manage',
  /** Ver los tableros analíticos del LMS */
  LMS_DASHBOARD_VIEW: 'lms:dashboard:view',
  /** Gestionar las notificaciones del LMS */
  LMS_NOTIFICATION_MANAGE: 'lms:notification:manage',
  /** Administrar los trabajos y la configuración de notificaciones del LMS */
  LMS_NOTIFICATION_ADMIN: 'lms:notification:admin',
  /** Gestionar el banco de preguntas */
  LMS_QUESTION_BANK_MANAGE: 'lms:question_bank:manage',
  /** Consultar usuarios del LMS */
  LMS_USER_MANAGE: 'lms:user:manage',
  /** Gestionar videos del LMS */
  LMS_VIDEO_MANAGE: 'lms:video:manage',
  /** Ver el panel del responsable de formación */
  LMS_TRAINING_MANAGER_VIEW: 'lms:training_manager:view',
  /** Administrar el panel del responsable de formación */
  LMS_TRAINING_MANAGER_ADMIN: 'lms:training_manager:admin',
  /** Ver los errores reportados por el LMS */
  LMS_ERROR_REPORT_VIEW: 'lms:error_report:view',
  /** Ver los vehículos, su estado, sus inspecciones y sus documentos */
  FLEET_VEHICLE_VIEW: 'fleet:vehicle:view',
  /** Crear, editar y eliminar vehículos */
  FLEET_VEHICLE_MANAGE: 'fleet:vehicle:manage',
  /** Subir documentos de un vehículo */
  FLEET_VEHICLE_DOCUMENT_UPLOAD: 'fleet:vehicle:document_upload',
  /** Ver los viajes de los vehículos */
  FLEET_TRIP_VIEW: 'fleet:trip:view',
  /** Crear, editar, terminar y eliminar viajes (con o sin inspección) */
  FLEET_TRIP_MANAGE: 'fleet:trip:manage',
  /** Ver los registros de mantenimiento de vehículos */
  FLEET_MAINTENANCE_VIEW: 'fleet:maintenance:view',
  /** Crear, editar y eliminar registros de mantenimiento de vehículos */
  FLEET_MAINTENANCE_MANAGE: 'fleet:maintenance:manage',
  /** Ver los tipos de intervención */
  FLEET_INTERVENTION_TYPE_VIEW: 'fleet:intervention_type:view',
  /** Crear, editar y eliminar tipos de intervención */
  FLEET_INTERVENTION_TYPE_MANAGE: 'fleet:intervention_type:manage',
  /** Ver las inspecciones de vehículos */
  FLEET_INSPECTION_VIEW: 'fleet:inspection:view',
  /** Crear, editar y eliminar inspecciones de vehículos */
  FLEET_INSPECTION_MANAGE: 'fleet:inspection:manage',
  /** Ver los recordatorios de la flota */
  FLEET_REMINDER_VIEW: 'fleet:reminder:view',
  /** Crear, editar y eliminar recordatorios de la flota */
  FLEET_REMINDER_MANAGE: 'fleet:reminder:manage',
  /** Ver las hojas de vida de activos de TI (PCs, portátiles, TVs), su imagen, su PDF y el cronograma de mantenimiento */
  ASSETS_LIFE_SHEET_VIEW: 'assets:life_sheet:view',
  /** Crear, editar y eliminar hojas de vida de activos de TI y registrar sus intervenciones */
  ASSETS_LIFE_SHEET_MANAGE: 'assets:life_sheet:manage',
  /** Ver los archivos del repositorio */
  REPOSITORIES_REPOSITORY_VIEW: 'repositories:repository:view',
  /** Subir, editar y eliminar archivos del repositorio */
  REPOSITORIES_REPOSITORY_MANAGE: 'repositories:repository:manage',
  /** Usar las utilidades de administración: procesar Excel, generar y convertir PDF, generar scripts y agregar módulos */
  TOOLS_UTILITY_USE: 'tools:utility:use',
  /** Ver roles, capacidades y la auditoría de cambios */
  RBAC_VIEW: 'rbac:view',
  /** Crear roles y activar o desactivar capacidades */
  RBAC_MANAGE: 'rbac:manage'
} as const

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

/**
 * ¿El usuario tiene alguna de las capacidades pedidas (any-of)?
 *
 * `userPermissions === undefined` significa que el backend aún no envía capacidades (despliegue
 * del front antes que el del backend): se deja ver la interfaz y el backend responde 403 si
 * corresponde. Una lista vacía (`[]`) sí significa "ninguna capacidad".
 */
export const hasPermission = (
  userPermissions: readonly string[] | undefined,
  required: PermissionKey | readonly PermissionKey[]
): boolean => {
  if (userPermissions === undefined) return true
  const wanted = Array.isArray(required) ? required : [required]
  return wanted.some((key) => userPermissions.includes(key))
}
