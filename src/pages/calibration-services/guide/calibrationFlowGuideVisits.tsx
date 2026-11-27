import { PERMISSIONS } from 'src/constants/permissions'
import {
  GUIDE_SECTIONS,
  GUIDE_TROUBLESHOOTING,
  GuideSection
} from './calibrationFlowGuideContent'

/**
 * La guía según las funciones encendidas. Con la programación por visitas, las etapas que cambian reemplazan a las de
 * `calibrationFlowGuideContent`; sin ella se muestra la guía de siempre. Si cambia el flujo con visitas, se actualiza
 * aquí (y el diagrama en `calibrationFlowDiagramContent`).
 */
const IMG = '/ayuda/guia/visitas'

/** Etapas que reemplazan (por `id`) a las de la guía base cuando las visitas están encendidas. */
const VISIT_SECTIONS: Record<string, Partial<GuideSection>> = {
  vision: {
    steps: [
      <>
        <b>Cotización:</b> se crea el servicio, se envía al cliente y este
        aprueba, rechaza o pide cambios.
      </>,
      <>
        <b>ODS:</b> con la aprobación se emite la orden de servicio. Es una sola
        aunque el contrato dure meses.
      </>,
      <>
        <b>Visitas:</b> la orden se programa tantas veces como haga falta, cada
        visita con su personal y sus equipos. En laboratorio, cada ingreso de
        equipos es una visita.
      </>,
      <>
        <b>Ejecución y certificados:</b> se registra cuántos equipos se
        calibraron en la visita, se cargan sus certificados y se revisan y
        liberan.
      </>,
      <>
        <b>Cortes, facturación y pago:</b> lo ejecutado se libera en cortes, se
        factura y se registra el pago.
      </>,
      <>
        <b>Cierre:</b> cuando todo está facturado, pagado (si es de contado) y
        con certificados enviados, el servicio se cierra automáticamente.
      </>
    ],
    variants: [
      {
        title: 'Fecha programada y fecha compromiso',
        text: (
          <>
            La <b>fecha programada</b> es el día de cada visita. La{' '}
            <b>fecha compromiso</b> es la fecha límite pactada para calibrar
            todos los equipos de la orden: es una sola.
          </>
        )
      },
      {
        title: 'Códigos que verás',
        text: (
          <>
            <b>SCL-2026-0113</b> es el servicio, <b>3633-CAL-MMCS</b> es su ODS
            y <b>SCL-2026-0113-C01</b> es su primer corte.
          </>
        )
      },
      {
        title: 'Caminos laterales',
        text: (
          <>
            Un servicio puede <b>pausarse</b> y reanudarse, <b>cancelarse</b>{' '}
            (mientras no tenga cortes listos o facturados), o quedar{' '}
            <b>rechazado</b> o <b>vencido</b> si el cliente no responde.
          </>
        )
      }
    ]
  },
  bandeja: {
    variants: [
      {
        title: 'El semáforo de cada orden',
        text: (
          <>
            Muestra lo más urgente: programar la primera visita, registrar una
            ejecución, cargar, revisar o corregir certificados, programar la
            siguiente visita, la fecha compromiso o los equipos que no han
            llegado al laboratorio. Si no hay nada pendiente, dice cuál es la
            próxima visita.
          </>
        )
      }
    ],
    tips: [
      <>
        El botón <b>Pendientes</b> del encabezado junta las visitas atrasadas de
        todas las órdenes que puedes ver.
      </>
    ]
  },
  crear: {
    variants: [
      {
        title: 'Servicio parecido a uno anterior',
        text: (
          <>
            En el detalle de cualquier servicio, <b>Duplicar</b> crea uno nuevo
            con los mismos datos para ajustarlo.
          </>
        )
      },
      {
        title: 'Calibración en laboratorio o en sitio',
        text: (
          <>
            En sitio, coordinación programa las visitas. En laboratorio la orden
            queda programada al emitir la ODS, con la fecha prevista según el
            tiempo de entrega, y la visita nace cuando llegan los equipos.
          </>
        )
      },
      {
        title: 'Consecutivos y metrólogo de laboratorio',
        text: (
          <>
            El botón «Consecutivos y metrólogo» configura la numeración y el
            metrólogo de laboratorio que se asigna automáticamente.
          </>
        )
      }
    ]
  },
  programacion: {
    needs: [
      PERMISSIONS.CALIBRATION_SERVICE_SCHEDULE,
      PERMISSIONS.CALIBRATION_SERVICE_RESCHEDULE
    ],
    title: 'Programar visitas',
    summary:
      'Una orden se programa las veces que haga falta, con personal y equipos distintos.',
    where: 'Detalle › Programar visita o pestaña Visitas · Menú › Agenda',
    steps: [
      <>
        <b>Programar visita</b>: fechas, sede, metrólogos, el{' '}
        <b>responsable de cargar los certificados</b> y notas. La primera pide
        la fecha compromiso.
      </>,
      <>
        Los <b>equipos planeados</b> son opcionales: búscalos por nombre, rango
        o nota, o usa <b>Agregar pendientes</b>.
      </>,
      <>
        <b>Editar</b> cambia fecha o personal de una visita (pide el motivo);{' '}
        <b>Cancelar visita</b> la saca de la agenda.
      </>,
      <>
        La <b>fecha compromiso</b> aparece arriba en la pestaña Visitas; se
        cambia con <b>Cambiar</b> y su motivo.
      </>,
      <>
        En la <b>Agenda</b>, toca un día para ver sus visitas o{' '}
        <b>Programar visita este día</b>.
      </>
    ],
    variants: [
      {
        title: 'Contratos con muchas visitas',
        text: (
          <>
            La franja de arriba en Visitas suma equipos contratados,
            programados, calibrados, cargados, liberados y facturados. Si quedan
            equipos y no hay una visita programada, la orden avisa.
          </>
        )
      },
      {
        title: 'Quién conserva acceso',
        text: (
          <>
            Quien estuvo en alguna visita sigue asignado a la orden y puede
            cargar sus certificados.
          </>
        )
      }
    ],
    images: [
      {
        src: `${IMG}/programar.png`,
        caption: 'Programar una visita: fechas, personal y equipos.'
      },
      {
        src: `${IMG}/agenda.png`,
        caption: 'Agenda por visitas.'
      }
    ]
  },
  logistica: {
    steps: [
      <>
        <b>Diligenciar formato</b> registra el ingreso, el estado de cada equipo
        y las condiciones acordadas (certificado, estampilla, puntos de
        calibración).
      </>,
      <>
        En <b>laboratorio</b>, al guardar la fecha de ingreso con sus equipos se
        crea la visita <b>Ingreso al laboratorio</b>, asignada al metrólogo de
        laboratorio. Mientras no llegue nada, la orden dice{' '}
        <b>Esperando equipos</b>.
      </>,
      <>
        Si llega otro grupo, marca <b>Es un lote nuevo</b> y escribe su fecha.
        La ficha guarda solo el último lote: genera antes el PDF del anterior si
        lo necesitas.
      </>,
      <>
        <b>Registrar movimiento</b> anota cada recogida o entrega.{' '}
        <b>Generar PDF</b> y <b>Enviar formato</b> lo entregan al cliente.
      </>,
      <>
        Cuando los equipos están listos para salir, <b>Lista para entregar</b>{' '}
        los pone en la pantalla de Entregas.
      </>
    ]
  },
  ejecucion: {
    title: 'Registrar la ejecución',
    summary:
      'En cada visita se anota cuántos equipos se calibraron; de ahí salen los certificados que debe.',
    where:
      'Detalle › pestaña Visitas · Celular › tu servicio, en la parte de arriba',
    steps: [
      <>
        Pulsa <b>Registrar ejecución</b> en tu visita. Se puede desde su primer
        día; si no ha llegado la fecha final, confirma que <b>ya terminó</b> y
        esa pasa a ser la fecha final.
      </>,
      <>
        Escribe cuántos calibraste de cada equipo. Si alguno no lleva
        certificado, indícalo y explica por qué.
      </>,
      <>
        La primera ejecución pone la orden <i>En ejecución</i>. Se puede{' '}
        <b>corregir</b> después, con motivo.
      </>,
      <>
        La pestaña <b>Operación</b> y la lista de ítems del celular muestran el
        avance y permiten escribir observaciones; las cantidades solo se cambian
        en la visita.
      </>,
      <>
        Cuando todos los equipos están calibrados y no quedan visitas por
        registrar, pulsa <b>Finalizar ejecución</b>.
      </>
    ],
    variants: [
      {
        title: 'Equipos de más o de menos',
        text: (
          <>
            No se puede calibrar más de lo contratado: repórtalo primero como
            novedad.
          </>
        )
      },
      {
        title: 'Firma del cliente',
        text: (
          <>
            En el celular, «Ir a corte y firma» crea el corte y recoge la firma
            de recepción. También puede pedirse por un enlace de firma remota.
          </>
        )
      }
    ],
    images: [
      {
        src: `${IMG}/visitas.png`,
        caption: 'Pestaña Visitas: avance de la orden y estado de cada visita.'
      },
      {
        src: `${IMG}/movil.png`,
        caption: 'Las visitas en el celular.',
        mobile: true
      }
    ]
  },
  documentos: {
    steps: [
      <>
        En <b>Documentos</b> están los PDF oficiales (cotización, ODS, avance
        técnico) y se pueden subir soportes adicionales.
      </>,
      <>
        En cada corte facturado, el <b>control documental</b> confirma cuántos
        certificados se emitieron, revisaron y enviaron. Las cifras se toman de
        Certificados a liberar y se pueden ajustar a mano.
      </>,
      <>
        Con el control hecho, <b>Enviar certificados</b> los manda al cliente.
        En un corte de contado sin pago el sistema no deja avanzar.
      </>
    ]
  },
  seguimiento: {
    steps: [
      <>
        <b>Pendientes</b> (botón de la bandeja) muestra las cargas, revisiones y
        correcciones atrasadas, con su responsable. <b>Cumplimiento</b> compara
        a tiempo y tarde por persona.
      </>,
      <>
        La <b>campana</b> avisa cada día hábil lo que está por vencer o vencido.
        Estos atrasos todavía no llegan por correo ni WhatsApp.
      </>,
      <>
        Los <b>plazos</b> son días hábiles: se configuran en los tiempos SLA, se
        pueden cambiar para una orden (botón <b>Plazos</b>) y ampliar en una
        visita (<b>Cambiar plazo</b>).
      </>,
      <>
        La pestaña <b>Historial</b> de cada servicio es su línea de tiempo, y{' '}
        <b>Analíticas</b> resume cobro y tiempos por etapa.
      </>
    ],
    variants: [
      {
        title: 'Plazos iniciales',
        text: (
          <>
            Programar la primera visita 3 días desde la ODS; registrar la
            ejecución el mismo día; cargar certificados 2; revisar y firmar 3;
            entregar 1; corregir 1; programar la siguiente visita 5.
          </>
        )
      }
    ]
  }
}

const CERTIFICATES_SECTION: GuideSection = {
  id: 'certificados',
  title: 'Certificados a liberar',
  summary:
    'Se cargan los PDF, se revisan, se firman y se liberan al equipo del cliente.',
  where: 'Menú › Certificados a liberar · Detalle › Cargar certificados',
  steps: [
    <>
      <b>Cargar certificados</b>: hasta 50 PDF, eligiendo la orden. La
      plataforma lee sus datos y señala lo raro; quedan{' '}
      <i>Pendientes de revisión</i>.
    </>,
    <>
      La analista revisa: <b>verifica</b>, <b>pide ajustes</b> (quien cargó sube
      el PDF corregido) o <b>descarta</b> con motivo.
    </>,
    <>
      Los certificados propios se <b>firman</b>; anexos y documentos de terceros
      no.
    </>,
    <>
      <b>Liberar</b> lo guarda en el equipo del cliente y en su historial. Deja
      marcada <b>Entregar por la plataforma</b>, o desmárcala si va por correo,
      WhatsApp o impreso.
    </>,
    <>
      Esas entregas se anotan en <b>Pendientes › Entregas</b>: medio,
      destinatario y, si quieres, un soporte. La plataforma no envía correos.
    </>,
    <>
      Un cliente de <b>contado</b> no recibe nada hasta que se registre el pago:
      queda <b>Esperando pago</b>.
    </>
  ],
  variants: [
    {
      title: 'Relación con la orden',
      text: (
        <>
          Cada certificado cuenta para su visita («37 de 50»). Si no se pudo
          saber cuál, aparece sin visita y se asigna desde la pestaña Visitas.
        </>
      )
    },
    {
      title: 'Liberar y entregar',
      text: (
        <>
          Liberar guarda el certificado; entregarlo es hacérselo llegar al
          cliente. El control documental del corte toma los enviados de las
          entregas. Nada de esto factura ni cierra la orden.
        </>
      )
    }
  ],
  needs: [
    PERMISSIONS.RELEASE_CERTIFICATE_UPLOAD,
    PERMISSIONS.RELEASE_CERTIFICATE_REVIEW
  ]
}

export const getGuideSections = ({
  visitsOn,
  releaseOn
}: {
  visitsOn: boolean
  releaseOn: boolean
}): GuideSection[] => {
  const sections = visitsOn
    ? GUIDE_SECTIONS.map((section) => ({
        ...section,
        ...VISIT_SECTIONS[section.id]
      }))
    : GUIDE_SECTIONS
  if (!releaseOn) return sections
  const after = sections.findIndex((s) => s.id === 'ejecucion') + 1
  return [
    ...sections.slice(0, after),
    CERTIFICATES_SECTION,
    ...sections.slice(after)
  ]
}

export const getGuideTroubleshooting = (visitsOn: boolean) =>
  visitsOn
    ? [
        {
          problem: 'No puedo registrar la ejecución de una visita',
          answer: (
            <>
              La visita todavía no empieza, la orden está pausada o no estás
              asignado. Si ya se hizo, pide a coordinación corregir la fecha.
            </>
          )
        },
        {
          problem: 'La visita no se marca como cumplida',
          answer: (
            <>
              Falta registrar la ejecución, faltan certificados o alguno no
              quedó en esa visita: revisa «certificados que no están en ninguna
              visita».
            </>
          )
        },
        ...GUIDE_TROUBLESHOOTING
      ]
    : GUIDE_TROUBLESHOOTING
