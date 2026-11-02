/**
 * Guía paso a paso para conectar la copia al Drive. Cada paso se agrega cuando se confirma que así se ve en pantalla,
 * por eso la lista crece de a poco. Si Google cambia su pantalla, se ajusta el texto aquí.
 */
/** Cómo se conecta: con una cuenta de Gmail (OAuth) o con una cuenta de servicio (Google Workspace). */
export type DriveGuidePath = 'gmail' | 'workspace'

export const DRIVE_GUIDE_PATH_LABELS: Record<DriveGuidePath, string> = {
  gmail: 'Cuenta de Gmail',
  workspace: 'Google Workspace (cuenta de servicio)'
}

export interface DriveGuideStep {
  id: string
  title: string
  /** Dónde se hace: «En Google Cloud», «En Drive», «En la plataforma». */
  where: string
  /** Lo que hay que hacer, en orden. */
  actions: string[]
  /** Qué debería verse al terminar el paso. */
  expect: string
  /** Aviso importante del paso (opcional). */
  warning?: string
  link?: { label: string; url: string }
  /** Caminos a los que aplica; sin este campo aplica a todos. */
  paths?: DriveGuidePath[]
  /** Captura de pantalla confirmada (ruta pública), opcional. */
  image?: { src: string; alt: string }
}

export const DRIVE_GUIDE_STEPS: DriveGuideStep[] = [
  {
    id: 'entrar-google-cloud',
    title: 'Entra a Google Cloud',
    where: 'En Google Cloud',
    actions: [
      'Abre la dirección de abajo en el navegador.',
      'Inicia sesión con la cuenta de Google que será la dueña de esta conexión. Que sea una cuenta del laboratorio y no la de una persona que pueda irse, porque quien administra esta cuenta administra el acceso al Drive.',
      'Si es la primera vez, Google muestra una ventana de bienvenida con el país y las condiciones del servicio. Deja el país (Colombia), marca la casilla de las condiciones y pulsa «Aceptar y continuar». La casilla de actualizaciones por correo es opcional.',
      'Es normal que aparezca una oferta de «prueba gratis con $300 de crédito». No la necesitas: ignórala o pulsa «Descartar» arriba a la derecha. Para esta conexión no hace falta activar la facturación ni poner tarjeta.'
    ],
    expect:
      'Ves la consola de Google Cloud: arriba el nombre «Google Cloud», un botón que dice «Selecciona un proyecto» (o el nombre de un proyecto si ya tienes uno) y el buscador en el centro.',
    link: {
      label: 'Abrir Google Cloud',
      url: 'https://console.cloud.google.com'
    }
  },
  {
    id: 'elegir-proyecto',
    title: 'Elige o crea el proyecto de trabajo',
    where: 'En Google Cloud',
    actions: [
      'Mira arriba a la izquierda, junto al nombre «Google Cloud»: hay un botón. Si dice «Selecciona un proyecto», todavía no tienes ninguno; si muestra un nombre (por ejemplo «Metromedics»), ya estás dentro de un proyecto y puedes usarlo.',
      'Para crear uno: pulsa ese botón, en la ventana que se abre pulsa «Proyecto nuevo» (arriba a la derecha), escribe el nombre «Metromedics Certificados» y pulsa «Crear». Deja «Organización» o «Ubicación» como están.',
      'Espera la notificación «Crear proyecto: Metromedics Certificados» (la campana arriba a la derecha). Si trae el enlace «Seleccionar proyecto», púlsalo. Si no, pulsa de nuevo el botón de proyectos y elígelo en la lista.'
    ],
    expect:
      'El botón de arriba ya no dice «Selecciona un proyecto» sino el nombre del tuyo. En la pantalla de bienvenida dice «Estás trabajando en» seguido de ese nombre, y aparecen su número y su ID de proyecto.'
  },
  {
    id: 'activar-drive-api',
    title: 'Activa la API de Google Drive',
    where: 'En Google Cloud',
    actions: [
      'En el buscador de arriba escribe «Google Drive API» y elige el resultado que dice «Google Drive API» (en la sección Marketplace).',
      'En la página de esa API pulsa el botón azul «Habilitar».',
      'Espera unos segundos. Cuando termina, la página cambia y muestra «API habilitada» o un panel con gráficas.'
    ],
    expect:
      'La página de «Google Drive API» muestra el estado «API habilitada» (o un botón «Administrar» en lugar de «Habilitar»).',
    warning:
      'Asegúrate de que arriba sigue seleccionado el proyecto correcto antes de pulsar «Habilitar»: la API se activa solo en el proyecto elegido.'
  },
  {
    id: 'pantalla-consentimiento',
    paths: ['gmail'],
    title: 'Configura la pantalla de consentimiento',
    where: 'En Google Cloud',
    actions: [
      'En el buscador de arriba escribe «Pantalla de consentimiento de OAuth» (o «Google Auth Platform») y entra a esa página.',
      'Si ves el botón «Comenzar» (o «Configurar»), púlsalo. Si ya muestra un panel, sigue al siguiente paso de esta lista.',
      'Información de la app: nombre «Metromedics Certificados» y, en «Correo de asistencia al usuario», elige tu correo. Pulsa «Siguiente».',
      'Público: elige «Externo» y pulsa «Siguiente».',
      'Datos de contacto: escribe tu correo y pulsa «Siguiente».',
      'Marca la casilla de acuerdo con la política de datos de usuario de los servicios de API de Google y pulsa «Continuar» y luego «Crear».'
    ],
    expect:
      'Ves el panel de la plataforma de autenticación de Google («Descripción general») con el nombre de tu app, sin errores.'
  },
  {
    id: 'crear-cliente-oauth',
    paths: ['gmail'],
    title: 'Crea el cliente OAuth',
    where: 'En Google Cloud',
    actions: [
      'En la página «Descripción general de OAuth» pulsa «Crear cliente de OAuth». Si no la ves, ve al menú «Clientes» de esa misma sección y pulsa «Crear cliente».',
      'En «Tipo de aplicación» elige «Aplicación web».',
      'En «Nombre» escribe Metromedics Certificados web.',
      'En «URI de redireccionamiento autorizados» pulsa «Agregar URI» y pega la dirección que muestra la plataforma en «Certificados a liberar → Drive → pestaña Cuenta de Gmail», en «Dirección de redireccionamiento autorizada» (tiene la forma …/release-certificates/drive/oauth/callback). Debe quedar idéntica, sin espacios ni barra final.',
      'Cuando pases a producción, agrega también la dirección del servidor de producción (con https) en esta misma lista.',
      'Pulsa «Crear». Google muestra el «ID de cliente» y el «Secreto de cliente».',
      'Copia los dos valores. El secreto se pega solo en la plataforma, no en un chat ni en un archivo compartido.'
    ],
    expect:
      'Aparece el cuadro «Cliente de OAuth creado» con el ID de cliente (termina en .apps.googleusercontent.com) y el secreto. En la lista de clientes ves «Metromedics Certificados web».',
    warning:
      'Si más adelante Google dice «redirect_uri_mismatch», la dirección registrada no es idéntica a la de la plataforma: corrígela aquí.'
  },
  {
    id: 'publicar-app',
    paths: ['gmail'],
    title: 'Publica la app para que el permiso no caduque',
    where: 'En Google Cloud',
    actions: [
      'En el menú de la izquierda de esta sección (Google Auth Platform) pulsa «Público» (o «Audiencia») y mira «Estado de publicación»: dice «Prueba».',
      'Si el botón «Publicar app» está gris, debajo dice «debes completar la configuración en la página de desarrollo de la marca». Pulsa ese enlace (o «Desarrollo de la marca» en el menú de la izquierda).',
      'Completa todos los datos de esa página y pulsa «Guardar» al final. Nombre de la app y correos: los mismos que pusiste al crear la pantalla de consentimiento.',
      'Página principal de la aplicación: https://app.metromedicslab.com',
      'Vínculo a la política de privacidad: https://metromedicslab.com/politica-datos/',
      'Vínculo a las condiciones del servicio: https://metromedicslab.com/politica-datos/',
      'Dominios autorizados: pulsa «Agregar un dominio» y escribe metromedicslab.com (solo el dominio, sin https ni barras).',
      'Vuelve a «Público». El botón «Publicar app» ya debe estar activo (con color).',
      'Pulsa «Publicar app» y confirma. Si pide agregar usuarios de prueba o verificar la app, no hace falta: es una app tuya, de uso interno.'
    ],
    expect:
      'El estado cambia a «En producción». Puede aparecer un aviso de «verificación necesaria»: ignóralo; solo significa que Google mostrará una pantalla de «app no verificada» cuando autorices.',
    warning:
      'Si la app se queda «en pruebas», el permiso de Google caduca a los 7 días y la copia al Drive dejará de funcionar sin avisar.'
  },
  {
    id: 'crear-cuenta-servicio',
    paths: ['workspace'],
    title: 'Crea la cuenta de servicio',
    where: 'En Google Cloud',
    actions: [
      'En el buscador de arriba escribe «Cuentas de servicio» y elige «Cuentas de servicio» (sección «IAM y administración»). Verás una lista vacía con el título «Cuentas de servicio del proyecto…».',
      'Arriba de la lista, a la derecha del título, pulsa el botón «+ Crear cuenta de servicio».',
      'En «Nombre de la cuenta de servicio» escribe certificados-mmcs. El ID se llena solo.',
      'Pulsa «Crear y continuar».',
      'Las secciones de roles y de acceso de usuarios no necesitan nada: pulsa «Continuar» y luego «Listo».'
    ],
    expect:
      'La lista muestra tu cuenta con un correo parecido a certificados-mmcs@tu-proyecto.iam.gserviceaccount.com. Ese correo no es secreto: lo usarás para compartir la carpeta del Drive.'
  },
  {
    id: 'crear-clave-json',
    paths: ['workspace'],
    title: 'Descarga la clave (archivo JSON)',
    where: 'En Google Cloud',
    actions: [
      'En la lista de cuentas de servicio, pulsa el correo de tu cuenta (el que termina en .iam.gserviceaccount.com). Se abre su página.',
      'Arriba, entre las pestañas «Detalles», «Permisos», «Claves»…, pulsa «Claves».',
      'Pulsa «Agregar clave» y elige «Crear clave nueva».',
      'Elige el tipo «JSON» y pulsa «Crear».',
      'El navegador descarga un archivo con un nombre parecido a metromedics-certificados-1a2b3c.json. Anota dónde quedó (normalmente la carpeta Descargas).'
    ],
    expect:
      'Aparece un aviso «Se creó una clave privada» y el archivo .json queda en tu carpeta de descargas. En la pestaña «Claves» ya hay una fila con una fecha de creación.',
    warning:
      'Ese archivo es la llave de la cuenta: quien lo tenga puede escribir en el Drive conectado. No lo envíes por chat ni por correo, no lo subas al repositorio y bórralo de Descargas cuando lo hayas pegado en la plataforma. Google no lo puede volver a mostrar: si lo pierdes, se crea otro y se elimina el anterior.'
  },
  {
    id: 'crear-carpeta-drive',
    title: 'Crea la carpeta raíz en Drive',
    where: 'En Google Drive',
    actions: [
      'Abre Google Drive con la misma cuenta de Google con la que creaste el proyecto.',
      'Arriba a la izquierda pulsa «+ Nuevo» y elige «Carpeta nueva».',
      'Ponle el nombre Certificados MMCS y pulsa «Crear».',
      'Aquí es donde el sistema creará solo las subcarpetas (categoría, cliente, año) y guardará los PDF liberados. No hace falta crear nada más dentro.'
    ],
    expect:
      'En «Mi unidad» ves la carpeta «Certificados MMCS». Si la abres, está vacía.',
    link: { label: 'Abrir Google Drive', url: 'https://drive.google.com' }
  },
  {
    id: 'compartir-carpeta',
    paths: ['workspace'],
    title: 'Comparte la carpeta con la cuenta de servicio',
    where: 'En Google Drive',
    actions: [
      'Haz clic derecho sobre la carpeta «Certificados MMCS» y elige «Compartir» (o ábrela y pulsa el botón «Compartir» de arriba).',
      'En el cuadro «Agregar personas, grupos…» pega el correo de la cuenta de servicio: el que termina en .iam.gserviceaccount.com (por ejemplo certificados-mmcs@metromedics-certificados.iam.gserviceaccount.com).',
      'A la derecha del correo, elige el rol «Editor».',
      'Desmarca «Notificar a las personas» si aparece: la cuenta de servicio no lee correos.',
      'Pulsa «Compartir» (o «Enviar»). Si Google avisa que el correo no es de una cuenta de Google normal, confirma que quieres compartir igual.'
    ],
    expect:
      'En «Compartir», debajo de tu nombre aparece el correo de la cuenta de servicio con el rol «Editor».',
    warning:
      'Comparte solo esta carpeta con ese correo. La cuenta de servicio solo podrá ver y escribir ahí, no en el resto de tu Drive.'
  },
  {
    id: 'copiar-id-carpeta',
    title: 'Copia el identificador de la carpeta',
    where: 'En Google Drive',
    actions: [
      'Abre la carpeta «Certificados MMCS» (doble clic).',
      'Mira la dirección del navegador: termina así: drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz. Ese texto largo después de «folders/» es el identificador.',
      'Selecciona solo ese texto (sin «folders/» ni nada que venga después de un signo ?) y cópialo.'
    ],
    expect:
      'Tienes copiado un texto de unas 33 letras y números mezclados, sin espacios ni barras.'
  },
  {
    id: 'pegar-en-plataforma',
    paths: ['workspace'],
    title: 'Pega todo en la plataforma y prueba',
    where: 'En la plataforma',
    actions: [
      'Entra a «Certificados a liberar» y pulsa el botón «Drive» (solo lo ve quien administra).',
      'Abre el archivo .json descargado con el Bloc de notas, selecciona todo el contenido (Ctrl+A), cópialo (Ctrl+C) y pégalo en el cuadro «Credencial (JSON de la cuenta de servicio)».',
      'En «Identificador de la carpeta raíz» pega el identificador del paso anterior.',
      'Deja la estructura de carpetas «Categoría / Cliente / Año» (se puede cambiar después).',
      'Pulsa «Guardar». Después pulsa «Probar conexión».',
      'Borra de tu carpeta de Descargas el archivo .json: ya no lo necesitas, la plataforma lo guardó cifrado.'
    ],
    expect:
      'Aparece «Credencial guardada (cifrada)» con el correo de la cuenta de servicio, y la prueba dice «Conectado a la carpeta «Certificados MMCS»». Después puedes pulsar «Copiar liberados pendientes» para subir los que ya estaban liberados.',
    warning:
      'Si la prueba falla, el mensaje dice por qué. Si menciona que la cuenta «no tiene espacio propio», el Drive personal no sirve para una cuenta de servicio: hay que usar una unidad compartida de Google Workspace o conectar con una cuenta de Gmail (OAuth).'
  },
  {
    id: 'conectar-google',
    paths: ['gmail'],
    title: 'Conecta la plataforma con Google',
    where: 'En la plataforma',
    actions: [
      'Entra a «Certificados a liberar» y pulsa «Drive» (solo lo ve quien administra). Deja la pestaña «Cuenta de Gmail».',
      'Pega el «ID de cliente» y el «Secreto de cliente» del paso del cliente OAuth.',
      'En «Identificador de la carpeta raíz» pega el identificador de la carpeta «Certificados MMCS».',
      'Pulsa «Conectar con Google». Se abre la pantalla de Google: elige la cuenta de Gmail dueña del Drive.',
      'Si Google dice «Google no verificó esta aplicación», pulsa «Avanzado» y luego «Ir a Metromedics Certificados (no seguro)». Es tu propia app.',
      'Acepta el permiso para ver y administrar los archivos de Drive y pulsa «Continuar».',
      'La plataforma te devuelve a «Certificados a liberar» y muestra «Cuenta de Google conectada». Abre «Drive» y pulsa «Probar conexión».'
    ],
    expect:
      'La plataforma dice «Conectado (Cuenta de Gmail, cifrado)» con tu correo, y la prueba responde «Conectado a la carpeta «Certificados MMCS»». Después pulsa «Copiar liberados pendientes».',
    warning:
      'Si falla con «redirect_uri_mismatch», revisa la dirección del cliente OAuth. Si dice «access_denied» o el permiso no se entrega, quita el acceso en myaccount.google.com/permissions y vuelve a conectar.'
  }
]
