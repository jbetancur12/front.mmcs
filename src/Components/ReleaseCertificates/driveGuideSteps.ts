/**
 * Guía paso a paso para conectar la copia al Drive. Cada paso se agrega cuando se confirma que así se ve en pantalla,
 * por eso la lista crece de a poco. Si Google cambia su pantalla, se ajusta el texto aquí.
 */
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
  }
]
