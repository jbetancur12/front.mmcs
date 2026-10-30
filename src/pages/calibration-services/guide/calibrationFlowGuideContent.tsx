import { ReactNode } from 'react'
import { PERMISSIONS, PermissionKey } from 'src/constants/permissions'

const IMG = '/ayuda/guia'
const BILLING = '/ayuda/facturacion'

export interface GuideImage {
  src: string
  caption: string
  /** Las capturas del celular se muestran angostas. */
  mobile?: boolean
}

export interface GuideSection {
  id: string
  title: string
  /** Frase corta que resume para qué sirve la etapa. */
  summary: string
  /** Dónde se hace, en una línea. */
  where?: string
  steps?: ReactNode[]
  /** Variantes y casos especiales de la etapa. */
  variants?: { title: string; text: ReactNode }[]
  tips?: ReactNode[]
  images?: GuideImage[]
  /** Capacidades que habilitan esta etapa (cualquiera de ellas). */
  needs?: PermissionKey[]
  /** Muestra el botón de la guía de facturación. */
  billingGuide?: boolean
}

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'vision',
    title: 'El recorrido completo',
    summary:
      'Un servicio nace como cotización y termina cerrado solo, cuando todo está hecho.',
    steps: [
      <>
        <b>Cotización:</b> se crea el servicio, se envía al cliente y este
        aprueba, rechaza o pide cambios.
      </>,
      <>
        <b>ODS y programación:</b> con la aprobación se emite la orden de
        servicio y se programa quién y cuándo.
      </>,
      <>
        <b>Ejecución:</b> el metrólogo registra el avance de cada ítem y las
        novedades; al terminar el último ítem el servicio queda{' '}
        <i>Finalizada técnicamente</i>.
      </>,
      <>
        <b>Cortes:</b> lo ejecutado se libera en cortes (parciales o uno final)
        para facturar.
      </>,
      <>
        <b>Facturación y pago:</b> cada corte se factura y se registra su pago.
      </>,
      <>
        <b>Documentos y certificados:</b> se controlan y se envían al cliente;
        si hay equipos que llevar, se entregan con firma.
      </>,
      <>
        <b>Cierre:</b> cuando todo está facturado, pagado (si es de contado) y
        con certificados enviados, el servicio se cierra automáticamente.
      </>
    ],
    variants: [
      {
        title: 'Códigos que verás',
        text: (
          <>
            <b>SCL-2026-0113</b> es el servicio, <b>3633-CAL-MMCS</b> es su ODS
            y <b>SCL-2026-0113-C01</b> es su primer corte. La cotización tiene
            su propio número de oferta.
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
  {
    id: 'bandeja',
    title: 'La bandeja de servicios',
    summary:
      'Tu punto de partida: qué te toca hoy y en qué etapa está cada servicio.',
    where: 'Menú › Servicios de calibración',
    steps: [
      <>
        <b>Mis pendientes</b> (arriba) cuenta lo que te toca según lo que puedes
        hacer. Cada tarjeta filtra la lista al hacer clic.
      </>,
      <>
        El <b>embudo</b> muestra cuántos servicios hay en cada etapa: Borrador,
        Cotización enviada, Aprobada, Por programar, Programada, En ejecución,
        Finalizada y Cerrada (más Rechazada y Cancelada).
      </>,
      <>
        Los botones{' '}
        <b>En riesgo, Por facturar, Sin pago, Por cobrar y Facturados</b> son
        filtros rápidos; <b>Más filtros</b> agrega cliente, fechas y alcance.
      </>,
      <>
        Cambia entre <b>Lista</b>, <b>Tabla</b> y <b>Kanban</b>; con «Agrupado
        por etapa» la lista se ordena por fase.
      </>,
      <>
        La campana avisa lo nuevo y los botones del encabezado llevan a
        Analíticas, Agenda y Clientes.
      </>
    ],
    variants: [
      {
        title: 'El semáforo de plazos',
        text: (
          <>
            Verde: en tiempo. Amarillo: en alerta. Rojo: vencido. Gris: sin
            iniciar. Azul: completado.
          </>
        )
      }
    ],
    tips: [
      <>
        No ves todo a propósito: quien no tiene permiso para ver servicios de
        otras personas, servicios sin aprobar o sin ODS, solo ve los suyos o los
        que ya están en operación.
      </>
    ],
    images: [
      {
        src: `${IMG}/01-bandeja.png`,
        caption: 'Mis pendientes, embudo de etapas y filtros rápidos.'
      }
    ],
    needs: [PERMISSIONS.CALIBRATION_SERVICE_VIEW]
  },
  {
    id: 'crear',
    title: 'Crear el servicio (cotización)',
    summary:
      'Se arma en cinco pasos y se puede guardar como borrador en cualquier momento.',
    where: 'Bandeja › Nuevo servicio',
    steps: [
      <>
        <b>Cliente y alcance:</b> elige el cliente (con «+» creas uno nuevo), si
        aplica a todo el cliente o a una <i>sede específica</i>, la vía de
        solicitud (En persona, Email, Teléfono o WhatsApp) y adjunta la{' '}
        <b>evidencia de la solicitud</b>, que es obligatoria.
      </>,
      <>
        <b>Contacto y destino:</b> nombre, correo y ciudad del contacto.
      </>,
      <>
        <b>Términos:</b> las condiciones que saldrán en el PDF de la cotización.
      </>,
      <>
        <b>Ítems cotizados:</b> «Agregar ítem» busca en el catálogo de productos
        y servicios. Cada ítem toma el valor médica, industrial o subcontratado,
        y puede llevar descuento fijo o en porcentaje. A la derecha ves el
        resumen económico con IVA.
      </>,
      <>
        <b>Condiciones:</b> forma de pago, vigencia de la oferta en días y
        tiempos de entrega de equipos y de certificados.
      </>,
      <>
        Abajo eliges <b>Guardar borrador</b> (sigues después) o{' '}
        <b>Guardar y enviar cotización</b>. El panel «Faltan N para enviar» te
        dice qué datos faltan.
      </>
    ],
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
            El tipo cambia lo que ocurre al emitir la ODS: en laboratorio la
            calibración se programa sola según el tiempo de entrega; en sitio
            alguien programa la visita (ver «Programación»).
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
    ],
    images: [
      {
        src: `${IMG}/02-nuevo-servicio.png`,
        caption: 'Paso 1: cliente, alcance, vía de solicitud y evidencia.'
      },
      {
        src: `${IMG}/03-items.png`,
        caption: 'Paso 4: ítems cotizados y resumen económico.'
      }
    ],
    needs: [PERMISSIONS.CALIBRATION_SERVICE_CREATE]
  },
  {
    id: 'cotizacion',
    title: 'Enviar la cotización y registrar la respuesta',
    summary: 'El cliente decide; el sistema deja constancia.',
    where: 'Detalle del servicio',
    steps: [
      <>
        Con la cotización completa, <b>Enviar a aprobación</b> la deja como{' '}
        <i>Cotización enviada</i>. El PDF se genera desde el mismo detalle.
      </>,
      <>
        Cuando el cliente responde, quien tenga ese permiso registra la
        decisión: <b>aprobó</b>, <b>rechazó</b> (se pide el motivo de pérdida,
        de una lista) o <b>pidió modificación</b> (vuelve a borrador, se ajusta
        y se reenvía).
      </>,
      <>
        Si pasan 30 días sin respuesta, la cotización <b>vence sola</b>. Se
        puede <b>Reabrir</b> si el cliente vuelve a interesarse.
      </>
    ],
    needs: [
      PERMISSIONS.CALIBRATION_SERVICE_REQUEST_APPROVAL,
      PERMISSIONS.CALIBRATION_SERVICE_DECIDE,
      PERMISSIONS.CALIBRATION_SERVICE_QUOTE_PDF
    ]
  },
  {
    id: 'ods',
    title: 'Emitir la ODS',
    summary: 'La orden de servicio arranca la operación.',
    where: 'Detalle del servicio › Emitir ODS',
    steps: [
      <>
        Con el servicio <i>Aprobado</i>, <b>Emitir ODS</b> genera la orden y su
        PDF (pestaña Documentos). Pide las fechas y los responsables.
      </>,
      <>
        Si algo cambia después (cliente, ítems, fechas), <b>Reemitir ODS</b>{' '}
        crea una nueva versión con el motivo; la anterior queda en el historial.
      </>
    ],
    images: [
      {
        src: `${IMG}/04-detalle.png`,
        caption:
          'Cabecera del servicio: estado, etapas, acciones y pestañas de trabajo.'
      }
    ],
    needs: [PERMISSIONS.CALIBRATION_SERVICE_ODS]
  },
  {
    id: 'programacion',
    title: 'Programar y asignar',
    summary: 'Define cuándo se hace el servicio y quién lo atiende.',
    where: 'Servicio › Programar · Menú › Agenda',
    steps: [
      <>
        En <b>Programar servicio</b> pones la fecha compromiso, la fecha
        programada, los metrólogos asignados, el responsable operativo y notas.
      </>,
      <>
        Si cambia la fecha, <b>Reprogramar</b>; si cambia la persona,{' '}
        <b>Reasignar</b>. Los servicios sin programar aparecen en la etapa «Por
        programar» del embudo.
      </>,
      <>
        La <b>Agenda</b> muestra el mes con la carga por día, cuántos servicios
        hay hoy, cuántos están en ejecución y cuáles no tienen metrólogo.
      </>
    ],
    images: [
      {
        src: `${IMG}/09-agenda.png`,
        caption: 'Agenda: carga por día y servicios en ejecución.'
      }
    ],
    needs: [
      PERMISSIONS.CALIBRATION_SERVICE_SCHEDULE,
      PERMISSIONS.CALIBRATION_SERVICE_RESCHEDULE,
      PERMISSIONS.CALIBRATION_SERVICE_REASSIGN
    ]
  },
  {
    id: 'logistica',
    title: 'Logística, ingreso y entrega de equipos',
    summary:
      'El formato que acompaña a los equipos desde que llegan hasta que salen.',
    where: 'Detalle del servicio › Logística',
    steps: [
      <>
        <b>Diligenciar formato</b> registra el ingreso, el estado de cada equipo
        y las condiciones acordadas (certificado, estampilla, puntos de
        calibración).
      </>,
      <>
        <b>Registrar movimiento</b> anota cada recogida o entrega con quién,
        cuándo y quién recibió. <b>Generar PDF</b> y <b>Enviar formato</b> lo
        entregan al cliente por correo.
      </>,
      <>
        Cuando los equipos están listos para salir, <b>Lista para entregar</b>{' '}
        los pone en la pantalla de Entregas.
      </>
    ],
    variants: [
      {
        title: 'Equipos en préstamo',
        text: (
          <>
            Si se deja un equipo de préstamo al cliente, se registra en el
            servicio y el sistema avisa mientras la devolución esté pendiente.
          </>
        )
      }
    ],
    images: [
      {
        src: `${IMG}/05-logistica.png`,
        caption: 'Control de ingreso y entrega de equipos.'
      }
    ],
    needs: [PERMISSIONS.CALIBRATION_SERVICE_TRACEABILITY]
  },
  {
    id: 'ejecucion',
    title: 'Ejecución en campo (celular)',
    summary:
      'El metrólogo trabaja desde el celular: avance por ítem, novedades y firma.',
    where: 'Celular › Servicios de calibración › tu servicio',
    steps: [
      <>
        Abre el servicio: arriba tienes <b>Llamar</b>, <b>Cómo llegar</b> y{' '}
        <b>Ver ODS</b>.
      </>,
      <>
        En <b>Ítems</b>, marca cada uno como Pendiente, Programado, En proceso o
        Completado. El primer avance pasa el servicio a <i>En ejecución</i>; al
        completar el último queda <i>Finalizada técnicamente</i> sin pulsar nada
        más.
      </>,
      <>
        Las pestañas de abajo son <b>Trabajo</b>, <b>Ingreso</b>,{' '}
        <b>Novedades</b> y <b>Cierre</b>. Al terminar, «Ir a corte y firma» crea
        el corte y recoge la firma de recepción del cliente en pantalla.
      </>
    ],
    variants: [
      {
        title: 'Cliente que no está presente',
        text: (
          <>
            La firma puede pedirse por un enlace de firma remota que el cliente
            abre desde su propio celular.
          </>
        )
      },
      {
        title: 'Solo ves tus servicios',
        text: (
          <>
            Quien solo ejecuta ve y opera únicamente los servicios asignados a
            sí mismo.
          </>
        )
      }
    ],
    images: [
      {
        src: `${IMG}/11-movil.png`,
        caption: 'Vista del celular: acciones rápidas, estado y firma.',
        mobile: true
      }
    ],
    needs: [PERMISSIONS.CALIBRATION_SERVICE_EXECUTE]
  },
  {
    id: 'novedades',
    title: 'Novedades: cuando lo hecho no coincide con lo cotizado',
    summary:
      'Se registran, se revisan y, si cambian el valor, se aprueban con el cliente.',
    where: 'Detalle del servicio › Novedades',
    steps: [
      <>
        <b>Registrar novedad</b> y elegir el tipo: cantidad menor, cantidad
        mayor, ítem adicional no cotizado, ítem no recibido o cambio de alcance.
        Se pueden seleccionar varios ítems del mismo tipo.
      </>,
      <>
        Se indica la descripción, la observación técnica y si necesita ajuste
        comercial para facturar. Una novedad de <i>cantidad menor</i> se aplica
        sola; las demás pasan por revisión.
      </>,
      <>
        La <b>revisión técnica</b> valida lo ocurrido; la{' '}
        <b>revisión económica</b> revisa el valor, la envía al cliente y
        registra su respuesta. Lo aprobado puede generar un anexo.
      </>,
      <>
        Las novedades dejan trazabilidad pero no cambian los valores del
        servicio hasta que se validan y se aplican.
      </>
    ],
    images: [
      {
        src: `${IMG}/06-novedades.png`,
        caption: 'Pestaña Novedades de un servicio.'
      }
    ],
    needs: [
      PERMISSIONS.CALIBRATION_SERVICE_EXECUTE,
      PERMISSIONS.CALIBRATION_ADJUSTMENT_REVIEW_TECHNICAL,
      PERMISSIONS.CALIBRATION_ADJUSTMENT_COMMERCIAL
    ]
  },
  {
    id: 'cortes',
    title: 'Cortes: lo que se libera para facturar',
    summary: 'Un servicio puede tener varios cortes parciales y uno final.',
    where: 'Detalle del servicio › Cortes',
    steps: [
      <>
        <b>Nuevo corte</b> elige los ítems y cantidades que se liberan. Al
        finalizar el servicio, <b>Crear corte final</b> ya viene con todo lo
        pendiente marcado: se revisa y se confirma.
      </>,
      <>
        Un corte pasa por <b>Borrador → Listo para facturar → Facturado</b>.
      </>,
      <>
        Si algo salió mal, el menú <b>Corregir</b> permite editar un corte en
        borrador (con motivo), anularlo o devolverlo a borrador; en uno
        facturado, corregir la factura.
      </>,
      <>
        <b>Anexo de avance técnico</b> genera el PDF del avance acumulado.
      </>
    ],
    images: [
      {
        src: `${IMG}/08-cortes.png`,
        caption: 'Pestaña Cortes con un corte final ya facturado.'
      }
    ],
    needs: [PERMISSIONS.CALIBRATION_SERVICE_EXECUTE]
  },
  {
    id: 'facturacion',
    title: 'Facturación y pago',
    summary:
      'Cada corte se factura; los de contado además se pagan antes de enviar certificados.',
    where: 'Bandeja › Mis pendientes · Servicio › Cortes',
    steps: [
      <>
        Quien factura entra por <b>Cortes listos para facturar</b>, abre el
        corte y pulsa <b>Marcar facturado</b>.
      </>,
      <>
        En clientes de <b>contado</b> el pago bloquea el control documental y el
        envío de certificados hasta que se registre. En clientes con{' '}
        <b>crédito</b> no bloquea: queda como «Crédito por cobrar».
      </>
    ],
    tips: [
      <>
        Hay una guía aparte, paso a paso y con capturas, solo para facturación:
      </>
    ],
    images: [
      {
        src: `${BILLING}/01-pendientes.png`,
        caption: 'Mis pendientes de facturación y cobro.'
      }
    ],
    needs: [PERMISSIONS.CALIBRATION_SERVICE_INVOICING],
    billingGuide: true
  },
  {
    id: 'documentos',
    title: 'Documentos, control documental y certificados',
    summary:
      'Todo lo oficial queda en un solo lugar y los certificados salen revisados.',
    where: 'Detalle del servicio › Documentos y Cortes',
    steps: [
      <>
        En <b>Documentos</b> están los PDF oficiales (cotización, ODS, avance
        técnico) y se pueden subir soportes adicionales.
      </>,
      <>
        En cada corte facturado, el <b>control documental</b> revisa que los
        documentos y certificados estén completos. Se cuentan solos desde el
        módulo de Calibraciones.
      </>,
      <>
        Con el control hecho, <b>Enviar certificados</b> los manda al cliente.
        En un corte de contado sin pago el sistema no deja avanzar.
      </>
    ],
    images: [
      {
        src: `${IMG}/07-documentos.png`,
        caption: 'Pestaña Documentos con los PDF oficiales.'
      }
    ],
    needs: [
      PERMISSIONS.CALIBRATION_SERVICE_DOCUMENT_UPLOAD,
      PERMISSIONS.CALIBRATION_SERVICE_DOCUMENT_CONTROL,
      PERMISSIONS.CALIBRATION_SERVICE_CERTIFICATE_SEND
    ]
  },
  {
    id: 'entregas',
    title: 'Entregas de equipos con firma',
    summary:
      'Quien lleva el equipo al cliente recoge la firma de recepción en pantalla.',
    where: 'Menú › Entregas',
    steps: [
      <>
        En <b>Disponibles</b> aparecen las entregas que el laboratorio marcó
        como listas. <b>Yo la llevo</b> la reserva para ti y pasa a{' '}
        <b>En camino</b>.
      </>,
      <>
        Al llegar, <b>Entregar y firmar</b> pide el nombre de quien recibe y su
        firma en la pantalla. Queda en <b>Entregadas</b> y se avisa a
        coordinación y a los metrólogos del servicio.
      </>,
      <>
        Si no se pudo entregar, <b>No se pudo</b> deja el motivo; si no vas a
        llevarla, <b>Soltar</b> la devuelve a Disponibles.
      </>
    ],
    tips: [
      <>
        Esta pantalla no da acceso a cotizaciones, precios ni cortes: es solo
        para entregar.
      </>
    ],
    images: [
      {
        src: `${IMG}/10-entregas.png`,
        caption: 'Entregas: disponibles, en camino y entregadas.'
      }
    ],
    needs: [PERMISSIONS.CALIBRATION_SERVICE_DELIVER]
  },
  {
    id: 'cierre',
    title: 'Cierre, pausas y cancelaciones',
    summary: 'El cierre es automático; pausar y cancelar son las excepciones.',
    steps: [
      <>
        El servicio se cierra <b>solo</b> cuando todos sus cortes están
        facturados, pagados (si son de contado), con certificados enviados y no
        queda nada por liberar. No hay que cerrarlo a mano.
      </>,
      <>
        <b>Pausar</b> detiene el servicio con un motivo; <b>Reanudar</b> lo pone
        otra vez en marcha. Un servicio pausado no admite acciones de operación.
      </>,
      <>
        <b>Cancelar</b> solo es posible si no hay cortes listos para facturar o
        facturados.
      </>
    ],
    needs: [
      PERMISSIONS.CALIBRATION_SERVICE_PAUSE,
      PERMISSIONS.CALIBRATION_SERVICE_CANCEL,
      PERMISSIONS.CALIBRATION_SERVICE_CLOSE
    ]
  },
  {
    id: 'seguimiento',
    title: 'Avisos, historial y analíticas',
    summary: 'Para enterarte de lo que pasa sin preguntar.',
    steps: [
      <>
        La <b>campana</b> y el centro de notificaciones avisan cuando un
        servicio necesita algo de ti; algunos avisos también llegan por
        WhatsApp.
      </>,
      <>
        La pestaña <b>Historial</b> de cada servicio es su línea de tiempo:
        quién hizo qué y cuándo.
      </>,
      <>
        <b>Analíticas</b> resume cobro (facturado, cobrado y por cobrar, en
        contado y crédito) y el tiempo que toma cada etapa.
      </>
    ],
    needs: [PERMISSIONS.CALIBRATION_ANALYTICS_VIEW]
  }
]

export const GUIDE_TROUBLESHOOTING: { problem: string; answer: ReactNode }[] = [
  {
    problem: 'No veo un botón que otra persona sí ve',
    answer: (
      <>
        Cada acción depende de un permiso. Pídele a quien administra los roles
        que te lo conceda (en esta guía, cada etapa indica si necesita uno).
      </>
    )
  },
  {
    problem: 'El botón está gris con un aviso',
    answer: (
      <>
        Falta algo antes: una novedad abierta, un ítem sin completar, el pago de
        un corte de contado o el servicio está pausado. El aviso dice qué.
      </>
    )
  },
  {
    problem: 'No encuentro un servicio',
    answer: (
      <>
        Quita los filtros («Limpiar filtros»). Si aun así no está, puede que no
        tengas permiso para ver servicios de otras personas, sin aprobar o sin
        ODS.
      </>
    )
  }
]
