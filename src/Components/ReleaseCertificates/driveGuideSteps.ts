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
      'Si Google muestra los términos de servicio, léelos y acéptalos. Para este paso no se pide tarjeta de crédito.'
    ],
    expect:
      'Ves la consola de Google Cloud: arriba el nombre «Google Cloud», un botón con el nombre de un proyecto y el buscador en el centro.',
    link: {
      label: 'Abrir Google Cloud',
      url: 'https://console.cloud.google.com'
    }
  },
  {
    id: 'elegir-proyecto',
    title: 'Elige el proyecto de trabajo',
    where: 'En Google Cloud',
    actions: [
      'Mira arriba a la izquierda, junto al nombre «Google Cloud»: hay un botón con el nombre del proyecto en el que estás trabajando (por ejemplo «Metromedics»).',
      'Si ya hay un proyecto para esta conexión, úsalo. No hace falta crear otro.',
      'Si no hay ninguno, pulsa ese botón, luego «Proyecto nuevo», ponle un nombre como «Metromedics Certificados» y pulsa «Crear». Espera a que termine y selecciónalo.'
    ],
    expect:
      'El botón de arriba muestra el nombre de tu proyecto. En la pantalla de bienvenida dice «Estás trabajando en» seguido de ese nombre, y aparecen su número y su ID de proyecto.'
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
