/**
 * Explicación en lenguaje sencillo de cada capacidad del panel "Roles y permisos".
 *
 * Cada entrada es [nombre corto, qué permite hacer, dónde se nota]. Los textos son escritos a mano
 * (no se generan): al agregar una capacidad al catálogo del backend (api.mmcs/constants/permissions.js)
 * hay que agregarla aquí también; el test permissionCatalog del api falla si falta alguna.
 * Las pantallas exactas donde interviene salen de permissionScreens.ts (generado).
 */
export type PermissionHelp = readonly [
  name: string,
  what: string,
  where: string
]

export const PERMISSION_HELP: Record<string, PermissionHelp> = {
  // --- Mantenimiento
  'maintenance:ticket:view': [
    'Ver tickets de mantenimiento',
    'Abrir los tickets y consultar todo lo que tienen: línea de tiempo, informe técnico, comentarios, archivos y PDFs.',
    'Módulo Mantenimiento: listado y detalle de tickets.'
  ],
  'maintenance:ticket:create': [
    'Crear tickets',
    'Registrar un ticket nuevo de mantenimiento.',
    'Mantenimiento: botón para crear un ticket.'
  ],
  'maintenance:ticket:update': [
    'Editar tickets',
    'Cambiar los datos de un ticket. Sin "Operar todos los tickets" solo se editan los asignados a uno mismo y algunos campos.',
    'Mantenimiento: detalle del ticket, botón de editar.'
  ],
  'maintenance:ticket:delete': [
    'Eliminar tickets',
    'Borrar un ticket de mantenimiento.',
    'Mantenimiento: acción de eliminar en el ticket.'
  ],
  'maintenance:technical_report:edit': [
    'Escribir el informe técnico',
    'Crear o modificar el informe técnico de un ticket.',
    'Mantenimiento: sección de informe técnico dentro del ticket.'
  ],
  'maintenance:ticket:manage_all': [
    'Operar todos los tickets',
    'Trabajar sobre cualquier ticket, informe o técnico. Sin esto, la persona solo trabaja con los tickets asignados a ella y con campos limitados.',
    'Mantenimiento: cambia qué tickets y qué campos puede tocar cada persona.'
  ],
  'maintenance:comment:create': [
    'Comentar tickets',
    'Escribir comentarios en un ticket.',
    'Mantenimiento: comentarios del ticket.'
  ],
  'maintenance:comment:manage': [
    'Editar o borrar sus comentarios',
    'Modificar o eliminar los comentarios que uno mismo escribió.',
    'Mantenimiento: comentarios del ticket.'
  ],
  'maintenance:comment:view_internal': [
    'Ver comentarios internos',
    'Leer los comentarios internos del equipo. Quien no la tiene solo ve los que están marcados como visibles para el cliente.',
    'Mantenimiento: comentarios del ticket.'
  ],
  'maintenance:comment:moderate': [
    'Moderar comentarios de otros',
    'Editar o borrar comentarios escritos por otras personas.',
    'Mantenimiento: comentarios del ticket.'
  ],
  'maintenance:file:upload': [
    'Subir archivos a un ticket',
    'Adjuntar fotos y documentos a un ticket.',
    'Mantenimiento: archivos del ticket.'
  ],
  'maintenance:file:manage': [
    'Editar o borrar archivos de un ticket',
    'Cambiar o eliminar los archivos adjuntos de un ticket.',
    'Mantenimiento: archivos del ticket.'
  ],
  'maintenance:file:view_all': [
    'Ver archivos no públicos',
    'Ver también los archivos que no son públicos. Quien no la tiene solo ve los públicos.',
    'Mantenimiento: archivos del ticket.'
  ],
  'maintenance:file:view_inactive': [
    'Ver archivos desactivados',
    'Consultar los archivos que fueron desactivados en un ticket.',
    'Mantenimiento: archivos del ticket.'
  ],
  'maintenance:file:manage_all': [
    'Gestionar archivos de cualquiera',
    'Editar o borrar archivos que subió cualquier persona. Sin esto, solo los propios.',
    'Mantenimiento: archivos del ticket.'
  ],
  'maintenance:file:manage_technician_uploads': [
    'Gestionar archivos de técnicos',
    'Editar o borrar los archivos que subió un técnico.',
    'Mantenimiento: archivos del ticket.'
  ],
  'maintenance:file:statistics': [
    'Ver estadísticas de archivos',
    'Consultar cuántos archivos hay y datos de uso de los archivos de mantenimiento.',
    'Mantenimiento: estadísticas de archivos.'
  ],
  'maintenance:protocol:view': [
    'Ver protocolos',
    'Consultar los protocolos de mantenimiento.',
    'Mantenimiento: protocolos.'
  ],
  'maintenance:protocol:manage': [
    'Gestionar protocolos',
    'Crear, editar y eliminar protocolos de mantenimiento.',
    'Mantenimiento: protocolos.'
  ],
  'maintenance:technician:view': [
    'Ver la ficha de un técnico',
    'Abrir la ficha de un técnico con sus métricas y su bitácora.',
    'Mantenimiento: técnicos, ficha individual.'
  ],
  'maintenance:technician:list': [
    'Ver la lista de técnicos',
    'Listar a los técnicos de mantenimiento.',
    'Mantenimiento: técnicos, y selectores para asignar tickets.'
  ],
  'maintenance:technician:create': [
    'Dar de alta técnicos',
    'Registrar un técnico nuevo.',
    'Mantenimiento: técnicos.'
  ],
  'maintenance:technician:update': [
    'Editar técnicos',
    'Cambiar los datos de un técnico. Un técnico solo puede editar su propia ficha.',
    'Mantenimiento: técnicos.'
  ],
  'maintenance:technician:delete': [
    'Eliminar técnicos',
    'Borrar a un técnico.',
    'Mantenimiento: técnicos.'
  ],
  'maintenance:technician:recalculate_workload': [
    'Recalcular la carga de trabajo',
    'Volver a calcular cuánto trabajo tiene cada técnico.',
    'Mantenimiento: carga de trabajo de los técnicos (acción de administración).'
  ],
  'maintenance:analytics:view': [
    'Ver analítica de mantenimiento',
    'Ver estadísticas y tableros de mantenimiento.',
    'Mantenimiento: tablero y analítica.'
  ],
  'maintenance:invoicing:view': [
    'Ver tickets por facturar',
    'Consultar los tickets que están pendientes de facturación.',
    'Mantenimiento: seguimiento de facturación.'
  ],
  'maintenance:invoicing:manage': [
    'Marcar tickets como facturados',
    'Registrar que un ticket ya fue facturado.',
    'Mantenimiento: seguimiento de facturación.'
  ],

  // --- Compras
  'purchases:request:view': [
    'Ver solicitudes de compra',
    'Consultar las solicitudes de compra.',
    'Módulo Compras: solicitudes.'
  ],
  'purchases:request:create': [
    'Crear solicitudes de compra',
    'Hacer una solicitud de compra nueva.',
    'Compras: solicitudes.'
  ],
  'purchases:request:update': [
    'Editar solicitudes de compra',
    'Cambiar los datos de una solicitud.',
    'Compras: solicitudes.'
  ],
  'purchases:request:decide': [
    'Aprobar o rechazar solicitudes',
    'Pre-aprobar, aprobar o rechazar una solicitud de compra.',
    'Compras: solicitudes, botones de decisión.'
  ],
  'purchases:request:assign_suppliers': [
    'Asignar proveedores a una solicitud',
    'Elegir qué proveedor atiende cada ítem de la solicitud.',
    'Compras: detalle de la solicitud.'
  ],
  'purchases:request:set_initial_id': [
    'Fijar el consecutivo inicial',
    'Definir desde qué número empiezan a contarse las solicitudes.',
    'Compras: configuración de solicitudes.'
  ],
  'purchases:quotation:view': [
    'Ver cotizaciones de compra',
    'Consultar las cotizaciones que enviaron los proveedores.',
    'Compras: cotizaciones.'
  ],
  'purchases:quotation:create': [
    'Registrar cotizaciones de compra',
    'Cargar la cotización que dio un proveedor.',
    'Compras: cotizaciones.'
  ],
  'purchases:quotation:accept': [
    'Aceptar una cotización de compra',
    'Elegir y aceptar la cotización ganadora.',
    'Compras: cotizaciones.'
  ],
  'purchases:order:view': [
    'Ver órdenes de compra',
    'Consultar las órdenes de compra y lo que se le ha comprado a cada proveedor.',
    'Compras: órdenes de compra.'
  ],
  'purchases:order:create': [
    'Generar órdenes de compra',
    'Crear la orden de compra a partir de una cotización.',
    'Compras: órdenes de compra.'
  ],
  'purchases:verification:view': [
    'Ver verificaciones de compra',
    'Consultar las verificaciones hechas a lo que se compró.',
    'Compras: verificaciones.'
  ],
  'purchases:verification:create': [
    'Crear verificaciones de compra',
    'Registrar una verificación de lo recibido.',
    'Compras: verificaciones.'
  ],
  'purchases:verification:update': [
    'Editar verificaciones de compra',
    'Cambiar una verificación ya registrada.',
    'Compras: verificaciones.'
  ],
  'purchases:supplier:view': [
    'Ver proveedores',
    'Consultar proveedores, sus documentos y el estado de sus evaluaciones.',
    'Compras: proveedores.'
  ],
  'purchases:supplier:create': [
    'Registrar proveedores',
    'Dar de alta un proveedor nuevo.',
    'Compras: proveedores.'
  ],
  'purchases:supplier:update': [
    'Editar proveedores',
    'Cambiar los datos de un proveedor.',
    'Compras: proveedores.'
  ],
  'purchases:supplier:retention': [
    'Cambiar la retención de un proveedor',
    'Modificar la retención que se le aplica a un proveedor.',
    'Compras: ficha del proveedor.'
  ],
  'purchases:supplier:document_upload': [
    'Subir documentos de un proveedor',
    'Adjuntar documentos a la ficha del proveedor.',
    'Compras: ficha del proveedor.'
  ],
  'purchases:supplier_selection:view': [
    'Ver la selección de proveedores',
    'Consultar la selección de proveedores.',
    'Compras: selección de proveedores.'
  ],
  'purchases:supplier_selection:manage': [
    'Gestionar la selección de proveedores',
    'Crear y editar la selección de proveedores.',
    'Compras: selección de proveedores.'
  ],
  'purchases:evaluation:view': [
    'Ver evaluaciones de proveedores',
    'Consultar las evaluaciones hechas a los proveedores.',
    'Compras: evaluaciones.'
  ],
  'purchases:evaluation:manage': [
    'Gestionar evaluaciones de proveedores',
    'Crear y editar evaluaciones de proveedores.',
    'Compras: evaluaciones.'
  ],
  'purchases:statistics:view': [
    'Ver estadísticas de compras',
    'Consultar los números y gráficas de compras.',
    'Compras: estadísticas.'
  ],
  'purchases:report:view': [
    'Descargar informes PDF de compras',
    'Bajar los informes en PDF de proveedores, solicitudes, órdenes, verificaciones, evaluaciones y cotizaciones.',
    'Compras: botones de descargar PDF en cada listado.'
  ],
  'purchases:report:selection': [
    'Descargar el informe de selección',
    'Bajar el informe de selección de proveedores (formato FOG-MMCS-10).',
    'Compras: selección de proveedores.'
  ],
  'purchases:personnel:view': [
    'Ver el personal de compras',
    'Consultar quiénes participan en compras.',
    'Compras: personal.'
  ],
  'purchases:personnel:manage': [
    'Gestionar el personal de compras',
    'Crear, editar y eliminar personal de compras.',
    'Compras: personal.'
  ],
  'purchases:fiscal_parameter:view': [
    'Consultar parámetros fiscales',
    'Ver los parámetros fiscales activos; los usa la ventana de generar una orden de compra.',
    'Compras: al generar una orden de compra.'
  ],
  'purchases:fiscal_parameter:manage': [
    'Gestionar parámetros fiscales',
    'Ver todos los parámetros fiscales y crearlos, editarlos o eliminarlos.',
    'Compras: parámetros fiscales.'
  ],

  // --- Venta de equipos
  'sales:quotation:view': [
    'Ver cotizaciones de venta de equipos',
    'Abrir las cotizaciones de venta, ver sus documentos y descargarlos (incluido el PDF).',
    'Venta de equipos: listado y detalle de cotizaciones.'
  ],
  'sales:quotation:create': [
    'Crear cotizaciones de venta',
    'Hacer una cotización nueva de venta de equipos.',
    'Venta de equipos: botón de nueva cotización.'
  ],
  'sales:quotation:update': [
    'Editar cotizaciones de venta',
    'Cambiar una cotización de venta.',
    'Venta de equipos: detalle de la cotización.'
  ],
  'sales:quotation:workflow': [
    'Mover la cotización por su flujo',
    'Enviar al cliente, registrar si aprobó, rechazó o pidió cambios, dejarla lista para facturar y cancelarla.',
    'Venta de equipos: botones de estado en el detalle.'
  ],
  'sales:quotation:invoice': [
    'Facturar una cotización',
    'Facturar una cotización que ya está lista para facturar.',
    'Venta de equipos: detalle de la cotización.'
  ],
  'sales:quotation:document_upload': [
    'Subir documentos a una cotización',
    'Adjuntar documentos y evidencias a una cotización.',
    'Venta de equipos: documentos de la cotización.'
  ],
  'sales:quotation:pdf': [
    'Generar el PDF de la cotización',
    'Crear el PDF oficial de una cotización de venta.',
    'Venta de equipos: documentos de la cotización.'
  ],
  'sales:product:view': [
    'Ver productos de venta',
    'Consultar el catálogo de productos de venta de equipos.',
    'Venta de equipos: productos.'
  ],
  'sales:product:manage': [
    'Gestionar productos de venta',
    'Crear, editar y desactivar productos del catálogo de venta.',
    'Venta de equipos: productos.'
  ],
  'sales:config:manage': [
    'Configurar cotizaciones de venta',
    'Ver y editar el consecutivo y la plantilla de términos. Cambiar un consecutivo que ya empezó solo lo hacen admin y super_admin.',
    'Venta de equipos: configuración.'
  ],

  // --- Clientes y módulos contratados
  'customers:customer:catalog': [
    'Consultar el catálogo de empresas',
    'Ver la lista de empresas y sus sedes para elegirlas en formularios.',
    'Selectores de empresa y sede en cotizaciones, servicios y mapas.'
  ],
  'customers:customer:view': [
    'Ver la ficha de una empresa',
    'Abrir la ficha de una empresa con sus servicios contratados y su meta. Ojo: hoy no limita a un usuario cliente a su propia empresa.',
    'Clientes: ficha de la empresa.'
  ],
  'customers:customer:create': [
    'Crear empresas',
    'Registrar una empresa cliente nueva.',
    'Clientes: botón de nueva empresa.'
  ],
  'customers:customer:update': [
    'Editar empresas',
    'Cambiar los datos de una empresa, su estado activo y su perfil de certificados.',
    'Clientes: ficha de la empresa.'
  ],
  'customers:customer:delete': [
    'Eliminar empresas',
    'Borrar una empresa.',
    'Clientes: listado de empresas.'
  ],
  'customers:customer:manage': [
    'Administrar empresas',
    'Entrar a la pantalla de empresas y manejar sus archivos, usuarios, correos de notificación y las empresas con módulo IoT.',
    'Clientes: pantalla de empresas.'
  ],
  'customers:customer:avatar': [
    'Cambiar la imagen de una empresa',
    'Subir el logo o imagen de una empresa.',
    'Clientes: ficha de la empresa.'
  ],
  'customers:site:manage': [
    'Gestionar sedes',
    'Agregar, editar y eliminar las sedes de una empresa.',
    'Clientes: ficha de la empresa.'
  ],
  'customers:user:list': [
    'Ver los usuarios de una empresa',
    'Consultar quiénes son los usuarios de una empresa.',
    'Clientes: pestaña Usuarios de la ficha.'
  ],
  'customers:module:view': [
    'Ver los módulos de una empresa',
    'Consultar qué módulos tiene contratados una empresa.',
    'Clientes: ficha de la empresa.'
  ],
  'customers:module:assign': [
    'Activar o desactivar módulos a una empresa',
    'Decidir qué módulos puede usar una empresa cliente.',
    'Clientes: ficha de la empresa.'
  ],
  'customers:lms_course:manage': [
    'Gestionar los cursos de una empresa',
    'Ver, asignar y quitar los cursos de la academia de una empresa.',
    'Clientes: ficha de la empresa.'
  ],
  'customers:module_catalog:view': [
    'Ver el catálogo de módulos',
    'Consultar los módulos que existen en el sistema.',
    'Clientes: asignación de módulos.'
  ],
  'customers:module_catalog:manage': [
    'Crear módulos del catálogo',
    'Agregar un módulo nuevo a la lista de módulos del sistema.',
    'Administración de módulos del sistema.'
  ],
  'customers:indicator:view': [
    'Ver indicadores de calibración de una empresa',
    'Ver equipos contratados, calibrados y avance, y descargar el informe PDF del comité.',
    'Clientes: indicadores de la empresa.'
  ],
  'customers:indicator:observations': [
    'Escribir observaciones del año',
    'Redactar las observaciones del año en los indicadores de una empresa.',
    'Clientes: indicadores de la empresa.'
  ],
  'customers:indicator:contracted_view': [
    'Ver el panel de servicios contratados',
    'Ver los servicios contratados (ODS, cotización y novedades) que originan la meta. Es solo para personal interno porque incluye la cotización.',
    'Clientes: indicadores, panel de contratados.'
  ],
  'customers:indicator:goal_manage': [
    'Fijar la meta de indicadores',
    'Poner o quitar la meta manual de un año y relacionar los ítems de las ODS con tipos de equipo.',
    'Clientes: indicadores de la empresa.'
  ],
  'customers:service:view_own': [
    'Ver sus servicios de calibración (cliente)',
    'Que la empresa cliente vea sus servicios con ODS y descargue ODS, avances técnicos y novedades. Nunca ve precios ni cotización.',
    'Portal del cliente: servicios de calibración.'
  ],

  // --- Laboratorio e IoT
  'laboratory:device:view': [
    'Ver sensores del laboratorio',
    'Ver los sensores de condiciones del laboratorio y su histórico.',
    'Laboratorio: sensores.'
  ],
  'laboratory:device:manage': [
    'Gestionar sensores del laboratorio',
    'Crear, editar y eliminar los sensores de condiciones del laboratorio.',
    'Laboratorio: sensores.'
  ],
  'laboratory:calibration:view': [
    'Ver cámaras y patrones',
    'Ver cámaras, patrones, sensores y lecturas de calibración del laboratorio.',
    'Laboratorio: calibración.'
  ],
  'laboratory:calibration:manage': [
    'Gestionar cámaras y patrones',
    'Crear, editar y eliminar cámaras, patrones y sensores, y configurar un patrón.',
    'Laboratorio: calibración.'
  ],
  'iot:device:list': [
    'Listar dispositivos IoT',
    'Ver la lista de dispositivos IoT de su empresa. Para ver los de todas las empresas hace falta "Ver dispositivos IoT de todas las empresas".',
    'IoT: listado de dispositivos.'
  ],
  'iot:device:view_all': [
    'Ver dispositivos IoT de todas las empresas',
    'En el listado, ver los dispositivos de todas las empresas y no solo los de la propia.',
    'IoT: listado de dispositivos.'
  ],
  'iot:device:view': [
    'Ver un dispositivo IoT',
    'Abrir un dispositivo y ver su histórico, energía, alarmas, eventos y datos.',
    'IoT: detalle del dispositivo.'
  ],
  'iot:device:manage': [
    'Gestionar dispositivos IoT',
    'Crear, editar y eliminar dispositivos IoT y configurar sus módulos.',
    'IoT: dispositivos.'
  ],
  'iot:alarm:manage': [
    'Gestionar alarmas IoT',
    'Crear y editar las alarmas de los dispositivos.',
    'IoT: alarmas del dispositivo.'
  ],

  // --- Trabajo no conforme
  'nonconform:report:view': [
    'Ver trabajo no conforme',
    'Ver los informes de trabajo no conforme, sus alertas y verificar códigos.',
    'Trabajo no conforme: listado de informes.'
  ],
  'nonconform:report:manage': [
    'Gestionar trabajo no conforme',
    'Crear, editar y eliminar informes de trabajo no conforme.',
    'Trabajo no conforme: informes.'
  ],

  // --- Usuarios, roles y perfiles
  'users:user:list': [
    'Ver la lista de usuarios',
    'Listar los usuarios y los usuarios internos.',
    'Configuración › Usuarios.'
  ],
  'users:user:view': [
    'Ver un usuario',
    'Abrir los datos de un usuario. Ojo: hoy no limita a un usuario cliente a sí mismo.',
    'Configuración › Usuarios.'
  ],
  'users:user:create': [
    'Crear usuarios',
    'Registrar un usuario nuevo y asignarle roles.',
    'Configuración › Usuarios: botón de nuevo usuario.'
  ],
  'users:user:update': [
    'Editar usuarios de empresas',
    'Cambiar los datos y el estado activo de un usuario de una empresa.',
    'Configuración › Usuarios.'
  ],
  'users:user:update_internal': [
    'Editar usuarios internos',
    'Cambiar usuarios internos, incluidos sus roles.',
    'Configuración › Usuarios.'
  ],
  'users:user:delete': [
    'Eliminar usuarios',
    'Borrar un usuario.',
    'Configuración › Usuarios.'
  ],
  'users:user:password_reset': [
    'Cambiar la contraseña de otra persona',
    'Poner una contraseña nueva a otro usuario.',
    'Configuración › Usuarios.'
  ],
  'users:user:activation': [
    'Enviar el enlace de activación',
    'Generar y reenviar el enlace con el que un usuario activa su cuenta.',
    'Configuración › Usuarios.'
  ],
  'users:role:list': [
    'Ver la lista de roles',
    'Listar los roles para asignarlos a personas y a cursos.',
    'Selectores de rol al crear usuarios o asignar cursos.'
  ],
  'users:impersonation:use': [
    'Entrar como otro usuario',
    'Suplantar a otro usuario para ver el sistema como él lo ve, y ver la lista de candidatos.',
    'Menú de usuario: entrar como otro usuario.'
  ],
  'users:profile:manage': [
    'Gestionar perfiles de biomédicos',
    'Crear, editar y eliminar perfiles de biomédicos, su imagen y su hoja de vida.',
    'Perfiles de biomédicos.'
  ],

  // --- Sistema
  'system:settings:view': [
    'Ver contraseñas de libros Excel',
    'Ver las contraseñas guardadas de los libros de Excel que se suben.',
    'Utilidades › Subir Excel.'
  ],
  'system:settings:manage': [
    'Gestionar contraseñas de libros Excel',
    'Crear, editar y eliminar las contraseñas guardadas de los libros de Excel.',
    'Utilidades › Subir Excel.'
  ],

  // --- Calibración: servicios
  'calibration:service:view': [
    'Ver servicios de calibración',
    'Abrir los servicios y ver su línea de tiempo, documentos, notificaciones, SLA y la configuración de WhatsApp. No decide si se ven los precios: eso lo controla "Ver precios y cotización".',
    'Servicios de calibración: listado y detalle.'
  ],
  'calibration:service:create': [
    'Crear servicios de calibración',
    'Registrar un servicio nuevo.',
    'Servicios de calibración › Nuevo.'
  ],
  'calibration:service:update': [
    'Editar servicios de calibración',
    'Cambiar los datos de un servicio.',
    'Servicios de calibración › Editar.'
  ],
  'calibration:service:request_approval': [
    'Enviar la cotización a aprobación',
    'Mandar la cotización del servicio al cliente para que la apruebe.',
    'Servicios de calibración: detalle, botón de enviar a aprobación.'
  ],
  'calibration:service:quote_pdf': [
    'Generar el PDF de cotización',
    'Crear el PDF de la cotización de un servicio. Ver o descargar uno ya generado lo controla "Ver precios y cotización".',
    'Servicios de calibración: detalle, botón de generar cotización.'
  ],
  'calibration:service:quote_terms': [
    'Editar los términos de la cotización',
    'Ver y editar la plantilla de términos que aparece en las cotizaciones de servicios.',
    'Servicios de calibración: configuración de términos.'
  ],
  'calibration:service:view_prices': [
    'Ver precios y cotización',
    'Ver precios, descuentos y totales de los servicios, y ver y descargar el PDF de cotización. Sin ella el servicio se muestra sin valores económicos y sin la cotización.',
    'Servicios de calibración: columnas de valores, resumen económico y documentos.'
  ],
  'calibration:service:view_pre_approval': [
    'Ver servicios aún sin aprobar',
    'Ver también los servicios cuya cotización el cliente todavía no aprobó: borrador, pendiente de aprobación o rechazada. Sin ella solo se ven los servicios aprobados, y los demás ni aparecen ni se pueden abrir.',
    'Servicios de calibración: listado, detalle, línea de tiempo y documentos.'
  ],
  'calibration:service:decide': [
    'Registrar la respuesta del cliente',
    'Anotar si el cliente aprobó, rechazó o pidió cambios en la cotización.',
    'Servicios de calibración: detalle, botones de decisión.'
  ],
  'calibration:service:ods': [
    'Emitir la orden de servicio (ODS)',
    'Generar la ODS de un servicio y su PDF.',
    'Servicios de calibración: detalle, botón de emitir ODS.'
  ],
  'calibration:service:schedule': [
    'Programar un servicio',
    'Fijar la fecha de un servicio y ver qué metrólogos se le pueden asignar.',
    'Servicios de calibración: programación.'
  ],
  'calibration:service:reschedule': [
    'Reprogramar un servicio',
    'Cambiar la fecha ya programada de un servicio.',
    'Servicios de calibración: programación.'
  ],
  'calibration:service:reassign': [
    'Reasignar el metrólogo',
    'Cambiar quién atiende un servicio.',
    'Servicios de calibración: programación.'
  ],
  'calibration:service:pause': [
    'Pausar y reanudar un servicio',
    'Detener un servicio temporalmente y volver a ponerlo en marcha.',
    'Servicios de calibración: detalle.'
  ],
  'calibration:service:cancel': [
    'Cancelar un servicio',
    'Dar por cancelado un servicio.',
    'Servicios de calibración: detalle.'
  ],
  'calibration:service:execute': [
    'Ejecutar un servicio',
    'Iniciar y terminar el servicio, registrar avances por ítem, cortes, ajustes y firmas, y generar el PDF de avance técnico.',
    'Servicios de calibración: ejecución (también en la vista móvil).'
  ],
  'calibration:service:execution_customer': [
    'Registrar datos del cliente en la ejecución',
    'Anotar los datos del cliente mientras se ejecuta el servicio.',
    'Servicios de calibración: ejecución.'
  ],
  'calibration:adjustment:review_technical': [
    'Revisión técnica de un ajuste',
    'Hacer la revisión técnica de un ajuste (desviación) sobre lo cotizado.',
    'Servicios de calibración: ajustes del servicio.'
  ],
  'calibration:adjustment:commercial': [
    'Revisión económica de un ajuste',
    'Revisar el valor de un ajuste, enviarlo al cliente y registrar su respuesta. También habilita sus PDF junto con la revisión técnica.',
    'Servicios de calibración: ajustes del servicio.'
  ],
  'calibration:service:invoicing': [
    'Facturar y registrar pagos',
    'Marcar un corte como facturado y anotar su pago.',
    'Servicios de calibración: cortes de facturación.'
  ],
  'calibration:service:close': [
    'Cerrar un servicio',
    'Dar por terminado un servicio.',
    'Servicios de calibración: detalle.'
  ],
  'calibration:service:document_control': [
    'Controlar documentos de un corte',
    'Revisar y controlar los documentos de un corte del servicio.',
    'Servicios de calibración: documentos del corte.'
  ],
  'calibration:service:document_upload': [
    'Subir documentos a un servicio',
    'Adjuntar documentos a un servicio.',
    'Servicios de calibración: documentos.'
  ],
  'calibration:service:traceability': [
    'Registrar trazabilidad y logística',
    'Anotar la trazabilidad física y el control logístico, con su PDF y correo.',
    'Servicios de calibración: trazabilidad.'
  ],
  'calibration:service:certificate_send': [
    'Enviar el certificado al cliente',
    'Mandar o reenviar el certificado de un servicio al cliente.',
    'Servicios de calibración: botón de enviar certificado.'
  ],
  'calibration:config:sequence': [
    'Configurar el consecutivo de servicios',
    'Ver y cambiar el número consecutivo de los servicios de calibración.',
    'Servicios de calibración: configuración.'
  ],
  'calibration:config:sla_manage': [
    'Configurar los tiempos (SLA)',
    'Editar los plazos de atención de los servicios.',
    'Servicios de calibración: configuración de SLA.'
  ],
  'calibration:config:whatsapp_manage': [
    'Configurar WhatsApp de los servicios',
    'Crear, editar y eliminar los mensajes de WhatsApp de los servicios.',
    'Servicios de calibración: configuración de WhatsApp.'
  ],
  'calibration:analytics:view': [
    'Ver analíticas de servicios',
    'Consultar las gráficas y números de los servicios de calibración.',
    'Servicios de calibración › Analíticas.'
  ],

  // --- Calibración clásica: certificados, equipos y hojas de datos
  'calibration:file:create': [
    'Crear certificados',
    'Registrar certificados y archivos de equipos de una empresa, incluida la carga directa del PDF.',
    'Certificados: botón de nuevo certificado.'
  ],
  'calibration:file:list': [
    'Listar certificados',
    'Ver la lista de certificados y los próximos a vencer. Un usuario de empresa solo ve los de su empresa.',
    'Certificados: listado.'
  ],
  'calibration:file:customer_view': [
    'Ver equipos y certificados de una empresa',
    'Ver desde la ficha de una empresa sus equipos, su programación y los PDF. El usuario de una empresa solo ve los suyos.',
    'Clientes: ficha de la empresa.'
  ],
  'calibration:file:update': [
    'Editar certificados',
    'Cambiar certificados y archivos de equipos, y su sede.',
    'Certificados: edición.'
  ],
  'calibration:file:delete': [
    'Eliminar certificados',
    'Borrar certificados y archivos de equipos.',
    'Certificados: acción de eliminar.'
  ],
  'calibration:file:bulk_reassign': [
    'Reasignar equipos en lote',
    'Pasar varios equipos a otra sede o empresa de una vez, con vista previa.',
    'Certificados: reasignación masiva.'
  ],
  'calibration:file:expiring_grouped': [
    'Ver certificados por vencer, agrupados',
    'Consultar los certificados próximos a vencer agrupados. Un usuario de empresa solo ve los suyos.',
    'Certificados: próximos a vencer.'
  ],
  'calibration:datasheet:view': [
    'Ver hojas de datos de equipos',
    'Ver el listado de hojas de datos, sus alertas y su estado.',
    'Hojas de datos: listado.'
  ],
  'calibration:datasheet:detail': [
    'Ver el detalle de una hoja de datos',
    'Abrir una hoja de datos con su reporte de entradas y salidas y su factura.',
    'Hojas de datos: detalle.'
  ],
  'calibration:datasheet:create': [
    'Crear hojas de datos',
    'Registrar una hoja de datos de un equipo.',
    'Hojas de datos: nueva.'
  ],
  'calibration:datasheet:update': [
    'Editar hojas de datos',
    'Cambiar una hoja de datos, su estado, imagen y factura.',
    'Hojas de datos: edición.'
  ],
  'calibration:datasheet:delete': [
    'Eliminar hojas de datos',
    'Borrar una hoja de datos.',
    'Hojas de datos: acción de eliminar.'
  ],
  'calibration:device:view': [
    'Ver la lista de equipos',
    'Consultar el listado de equipos.',
    'Equipos: listado.'
  ],
  'calibration:device:manage': [
    'Gestionar equipos',
    'Ver el detalle de un equipo y crear, editar y eliminar equipos.',
    'Equipos: detalle y edición.'
  ],
  'calibration:record:view': [
    'Ver registros de calibración',
    'Consultar los registros de calibración.',
    'Calibración: registros.'
  ],
  'calibration:record:manage': [
    'Gestionar registros de calibración',
    'Crear, editar y eliminar registros de calibración.',
    'Calibración: registros.'
  ],
  'calibration:history:view': [
    'Ver el historial de calibraciones',
    'Consultar el historial de calibraciones.',
    'Calibración: historial.'
  ],
  'calibration:history:manage': [
    'Gestionar el historial de calibraciones',
    'Crear y editar el historial de calibraciones.',
    'Calibración: historial.'
  ],
  'calibration:certificate_type:view': [
    'Ver tipos de certificado',
    'Consultar los tipos de certificado.',
    'Certificados: tipos.'
  ],
  'calibration:certificate_type:manage': [
    'Gestionar tipos de certificado',
    'Ver el detalle, crear, editar y eliminar tipos de certificado.',
    'Certificados: tipos.'
  ],
  'calibration:certificate_history:delete': [
    'Borrar del historial de certificados',
    'Eliminar un registro del historial de certificados.',
    'Certificados: historial.'
  ],
  'calibration:template:view': [
    'Ver plantillas',
    'Consultar el listado de plantillas.',
    'Calibración: plantillas.'
  ],
  'calibration:template:manage': [
    'Gestionar plantillas',
    'Ver el detalle, crear, editar y eliminar plantillas.',
    'Calibración: plantillas.'
  ],
  'calibration:document:view': [
    'Ver documentos de calibración',
    'Consultar los documentos.',
    'Calibración: documentos.'
  ],
  'calibration:document:manage': [
    'Gestionar documentos de calibración',
    'Crear, editar y eliminar documentos.',
    'Calibración: documentos.'
  ],
  'calibration:traceability:manage': [
    'Gestionar trazabilidades',
    'Crear, editar y eliminar trazabilidades.',
    'Calibración: trazabilidad.'
  ],
  'calibration:equipment_inout:view': [
    'Ver una entrada o salida de equipo',
    'Abrir el detalle de una entrada o salida.',
    'Entradas y salidas de equipos: detalle.'
  ],
  'calibration:equipment_inout:list': [
    'Listar entradas y salidas de equipos',
    'Ver la lista de entradas y salidas.',
    'Entradas y salidas de equipos: listado.'
  ],
  'calibration:equipment_inout:manage': [
    'Gestionar entradas y salidas',
    'Registrar, editar y eliminar entradas y salidas de equipos.',
    'Entradas y salidas de equipos.'
  ],
  'calibration:inspection_maintenance:view': [
    'Ver inspecciones y mantenimientos de equipos',
    'Consultar las inspecciones y mantenimientos de equipos.',
    'Inspección y mantenimiento: listado.'
  ],
  'calibration:inspection_maintenance:manage': [
    'Gestionar inspecciones y mantenimientos',
    'Crear, editar y eliminar inspecciones y mantenimientos de equipos.',
    'Inspección y mantenimiento.'
  ],
  'calibration:product:view': [
    'Ver productos y servicios',
    'Consultar el catálogo de productos y servicios (con sus precios).',
    'Productos y servicios: listado.'
  ],
  'calibration:product:manage': [
    'Gestionar productos y servicios',
    'Crear, editar, eliminar, importar y actualizar precios del catálogo.',
    'Productos y servicios.'
  ],
  'calibration:report:view': [
    'Descargar informes de equipos',
    'Bajar los informes de inventario, calibración, mantenimiento, préstamos y entradas y salidas.',
    'Informes en las pantallas de equipos.'
  ],

  // --- Academia (LMS)
  'lms:training:manage': [
    'Administrar la capacitación',
    'Ver los datos de cualquier usuario y operar la Academia como administrador.',
    'Academia › Administración.'
  ],
  'lms:course:manage': [
    'Gestionar cursos',
    'Administrar cursos, su contenido, evaluaciones y archivos.',
    'Academia › Administración › Cursos.'
  ],
  'lms:assignment:manage': [
    'Gestionar asignaciones',
    'Asignar cursos a las personas y seguirlos.',
    'Academia › Administración › Asignaciones.'
  ],
  'lms:plan:manage': [
    'Gestionar planes de formación',
    'Crear y administrar los planes de formación.',
    'Academia › Administración › Planes.'
  ],
  'lms:report:manage': [
    'Gestionar reportes de la Academia',
    'Generar y administrar los reportes de la Academia.',
    'Academia › Administración › Reportes.'
  ],
  'lms:analytics:view': [
    'Ver analíticas de la Academia',
    'Ver analíticas de cursos, progreso y evaluaciones.',
    'Academia › Analíticas.'
  ],
  'lms:certificate:manage': [
    'Gestionar certificados de la Academia',
    'Ver y administrar los certificados de la Academia.',
    'Academia › Administración › Certificados.'
  ],
  'lms:dashboard:view': [
    'Ver tableros de la Academia',
    'Ver los tableros analíticos de la Academia.',
    'Academia › Tableros.'
  ],
  'lms:notification:manage': [
    'Gestionar notificaciones de la Academia',
    'Administrar las notificaciones de la Academia.',
    'Academia › Notificaciones.'
  ],
  'lms:notification:admin': [
    'Administrar el envío de notificaciones',
    'Manejar los trabajos y la configuración de las notificaciones de la Academia.',
    'Academia › Administración técnica de notificaciones.'
  ],
  'lms:question_bank:manage': [
    'Gestionar el banco de preguntas',
    'Crear y administrar las preguntas de las evaluaciones.',
    'Academia › Administración › Banco de preguntas.'
  ],
  'lms:user:manage': [
    'Consultar usuarios de la Academia',
    'Ver los usuarios de la Academia.',
    'Academia › Administración › Usuarios.'
  ],
  'lms:video:manage': [
    'Gestionar videos de la Academia',
    'Administrar los videos de los cursos.',
    'Academia › Administración › Videos.'
  ],
  'lms:training_manager:view': [
    'Ver el panel del responsable de formación',
    'Abrir el panel de quien lleva la formación.',
    'Academia › Panel del responsable de formación.'
  ],
  'lms:training_manager:admin': [
    'Administrar el panel del responsable de formación',
    'Hacer cambios dentro del panel del responsable de formación.',
    'Academia › Panel del responsable de formación.'
  ],
  'lms:error_report:view': [
    'Ver errores reportados',
    'Consultar los errores que la Academia ha reportado.',
    'Academia › Administración › Errores.'
  ],

  // --- Flota
  'fleet:vehicle:view': [
    'Ver vehículos',
    'Consultar los vehículos, su estado, inspecciones y documentos.',
    'Flota: vehículos.'
  ],
  'fleet:vehicle:manage': [
    'Gestionar vehículos',
    'Crear, editar y eliminar vehículos.',
    'Flota: vehículos.'
  ],
  'fleet:vehicle:document_upload': [
    'Subir documentos de un vehículo',
    'Adjuntar documentos a un vehículo.',
    'Flota: ficha del vehículo.'
  ],
  'fleet:trip:view': [
    'Ver viajes',
    'Consultar los viajes de los vehículos.',
    'Flota: viajes.'
  ],
  'fleet:trip:manage': [
    'Gestionar viajes',
    'Crear, editar, terminar y eliminar viajes, con o sin inspección.',
    'Flota: viajes.'
  ],
  'fleet:maintenance:view': [
    'Ver mantenimientos de vehículos',
    'Consultar los registros de mantenimiento de los vehículos.',
    'Flota: mantenimientos.'
  ],
  'fleet:maintenance:manage': [
    'Gestionar mantenimientos de vehículos',
    'Crear, editar y eliminar registros de mantenimiento.',
    'Flota: mantenimientos.'
  ],
  'fleet:intervention_type:view': [
    'Ver tipos de intervención',
    'Consultar los tipos de intervención de la flota.',
    'Flota: tipos de intervención.'
  ],
  'fleet:intervention_type:manage': [
    'Gestionar tipos de intervención',
    'Crear, editar y eliminar tipos de intervención.',
    'Flota: tipos de intervención.'
  ],
  'fleet:inspection:view': [
    'Ver inspecciones de vehículos',
    'Consultar las inspecciones de los vehículos.',
    'Flota: inspecciones.'
  ],
  'fleet:inspection:manage': [
    'Gestionar inspecciones de vehículos',
    'Crear, editar y eliminar inspecciones.',
    'Flota: inspecciones.'
  ],
  'fleet:reminder:view': [
    'Ver recordatorios de la flota',
    'Consultar los recordatorios de la flota.',
    'Flota: recordatorios.'
  ],
  'fleet:reminder:manage': [
    'Gestionar recordatorios de la flota',
    'Crear, editar y eliminar recordatorios.',
    'Flota: recordatorios.'
  ],

  // --- Activos de TI, repositorios y utilidades
  'assets:life_sheet:view': [
    'Ver hojas de vida de activos de TI',
    'Ver las hojas de vida de PCs, portátiles y TVs, su imagen, su PDF y el cronograma de mantenimiento.',
    'Inventario › Hoja de vida TI.'
  ],
  'assets:life_sheet:manage': [
    'Gestionar hojas de vida de activos de TI',
    'Crear, editar y eliminar hojas de vida y registrar sus intervenciones.',
    'Inventario › Hoja de vida TI.'
  ],
  'repositories:repository:view': [
    'Ver el repositorio de archivos',
    'Consultar los archivos del repositorio.',
    'Repositorios.'
  ],
  'repositories:repository:manage': [
    'Gestionar el repositorio de archivos',
    'Subir, editar y eliminar archivos del repositorio.',
    'Repositorios.'
  ],
  'tools:utility:use': [
    'Usar utilidades de administración',
    'Procesar Excel, generar y convertir PDF, generar scripts y agregar módulos.',
    'Utilidades.'
  ],

  // --- Administración de permisos
  'rbac:view': [
    'Ver roles y permisos',
    'Ver los roles, las capacidades y la auditoría de cambios.',
    'Configuración › Roles y permisos.'
  ],
  'rbac:manage': [
    'Administrar roles y permisos',
    'Crear roles y activar o desactivar capacidades.',
    'Configuración › Roles y permisos.'
  ]
}

export const getPermissionHelp = (key: string) => {
  const entry = PERMISSION_HELP[key]
  return entry ? { name: entry[0], what: entry[1], where: entry[2] } : null
}
