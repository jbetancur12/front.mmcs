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
      'Ves la consola de Google Cloud: una barra arriba con el nombre «Google Cloud» y el buscador en el centro.',
    link: {
      label: 'Abrir Google Cloud',
      url: 'https://console.cloud.google.com'
    }
  }
]
