/**
 * Contenido del diagrama de flujo del módulo, en lenguaje sencillo. Si cambia una regla del flujo (pasos, plazos o
 * quién hace qué), se actualiza aquí.
 */
export type FlowRole =
  | 'commercial'
  | 'coordination'
  | 'metrologist'
  | 'review'
  | 'invoicing'
  | 'customer'
  | 'platform'

export const FLOW_ROLE_LABELS: Record<FlowRole, string> = {
  commercial: 'Comercial',
  coordination: 'Coordinación',
  metrologist: 'Metrólogo',
  review: 'Analista / revisión',
  invoicing: 'Facturación',
  customer: 'Cliente',
  platform: 'La plataforma (sola)'
}

export interface FlowStep {
  kind: 'step'
  number: string
  role: FlowRole
  title: string
  text: string
  where?: string
  automatic?: string
  state?: string
}

export interface FlowDecision {
  kind: 'decision'
  question: string
  branches: { answer: string; result: string; tone: 'ok' | 'warn' | 'bad' }[]
}

export interface FlowSplit {
  kind: 'split'
  columns: { title: string; steps: FlowStep[] }[]
}

export type FlowNode = FlowStep | FlowDecision | FlowSplit

export interface FlowPhase {
  id: string
  letter: string
  short: string
  summary: string
  title: string
  intro: string
  nodes: FlowNode[]
  note?: string
}

const step = (data: Omit<FlowStep, 'kind'>): FlowStep => ({
  kind: 'step',
  ...data
})

export const FLOW_WORDS: [string, string][] = [
  ['Cotización', 'La oferta de precio que se le envía al cliente.'],
  [
    'ODS (orden de servicio)',
    'El trabajo aprobado. Un contrato de todo un año es una sola ODS.'
  ],
  [
    'Visita',
    'Cada salida a calibrar, o cada grupo de equipos que llega al laboratorio, dentro de una ODS.'
  ],
  ['Certificado', 'El PDF que demuestra que un equipo fue calibrado.'],
  [
    'Liberar',
    'Aprobar el certificado y entregarlo al cliente en la plataforma.'
  ],
  ['Corte', 'La parte del trabajo que se envía a facturar.'],
  [
    'Control documental',
    'Confirmar que los certificados de un corte se emitieron, revisaron y enviaron.'
  ]
]

export const FLOW_PHASES: FlowPhase[] = [
  {
    id: 'flujo-vender',
    letter: 'A',
    short: 'Vender',
    summary: 'Se cotiza y el cliente aprueba',
    title: 'Vender el servicio',
    intro: 'Todo empieza con una cotización.',
    nodes: [
      step({
        number: '1',
        role: 'commercial',
        title: 'Crea la cotización',
        text: 'Anota el cliente, los equipos que se van a calibrar, precios y condiciones.',
        where: 'Servicios de calibración › Nuevo',
        state: 'Borrador'
      }),
      step({
        number: '2',
        role: 'commercial',
        title: 'La envía a aprobación',
        text: 'El cliente recibe la cotización.',
        state: 'Pendiente de aprobación'
      }),
      {
        kind: 'decision',
        question: '¿Qué responde el cliente?',
        branches: [
          {
            answer: 'Aprueba',
            result: 'Comercial registra la aprobación y sigue el paso 3.',
            tone: 'ok'
          },
          {
            answer: 'Pide cambios',
            result: 'Vuelve a borrador: se corrige y se envía otra vez.',
            tone: 'warn'
          },
          {
            answer: 'Rechaza',
            result: 'La cotización queda rechazada. Fin.',
            tone: 'bad'
          },
          {
            answer: 'No responde',
            result:
              'Al pasar su vigencia (o 30 días) queda vencida. Se puede reabrir.',
            tone: 'warn'
          }
        ]
      },
      step({
        number: '3',
        role: 'commercial',
        title: 'Emite la ODS',
        text: 'Es el número que acompaña todo el trabajo, aunque dure meses.',
        where: 'Detalle del servicio › Emitir ODS',
        state: 'ODS emitida'
      })
    ]
  },
  {
    id: 'flujo-programar',
    letter: 'B',
    short: 'Programar',
    summary: 'Se agendan las visitas',
    title: 'Programar',
    intro: 'Depende de dónde se calibran los equipos.',
    nodes: [
      {
        kind: 'decision',
        question: '¿Dónde se hace la calibración?',
        branches: [
          {
            answer: 'Donde el cliente (en sitio)',
            result: 'Coordinación programa visitas: pasos 4 y 5.',
            tone: 'ok'
          },
          {
            answer: 'En nuestro laboratorio',
            result:
              'No se programa a mano: se espera que lleguen los equipos (paso 6).',
            tone: 'ok'
          }
        ]
      },
      {
        kind: 'split',
        columns: [
          {
            title: 'En sitio',
            steps: [
              step({
                number: '4',
                role: 'coordination',
                title: 'Pulsa «Programar visita»',
                text: 'Elige fechas, quiénes van, quién queda responsable de cargar los certificados y, si quiere, cuántos equipos. La primera vez pide la fecha compromiso.',
                where: 'Detalle del servicio o Agenda',
                automatic:
                  'avisa a los metrólogos y pone la visita en la agenda.',
                state: 'Programada'
              }),
              step({
                number: '5',
                role: 'coordination',
                title: 'Programa las demás visitas',
                text: 'Un contrato grande tiene muchas visitas, cada una con su personal. Cambiar fechas o personas pide el motivo.',
                where: 'Detalle › pestaña Visitas'
              })
            ]
          },
          {
            title: 'En laboratorio',
            steps: [
              step({
                number: '·',
                role: 'platform',
                title: 'Espera los equipos',
                text: 'La orden muestra «Esperando equipos» y la fecha prevista. Si pasa esa fecha se pone en amarillo y avisa a coordinación.',
                state: 'Programada'
              }),
              step({
                number: '6',
                role: 'metrologist',
                title: 'Guarda el formato de ingreso',
                text: 'Anota cuándo llegaron y qué equipos son. Si llega otro grupo después, marca «Es un lote nuevo».',
                where: 'Detalle › pestaña Logística',
                automatic:
                  'crea la visita «Ingreso al laboratorio» para el metrólogo de laboratorio.'
              })
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'flujo-calibrar',
    letter: 'C',
    short: 'Calibrar',
    summary: 'Se hacen las visitas',
    title: 'Calibrar',
    intro: 'Se repite en cada visita.',
    nodes: [
      step({
        number: '7',
        role: 'metrologist',
        title: 'Hace la calibración',
        text: 'Va donde el cliente, o calibra en el laboratorio.',
        where: 'Agenda › la visita del día'
      }),
      step({
        number: '8',
        role: 'metrologist',
        title: 'Pulsa «Registrar ejecución»',
        text: 'Escribe cuántos equipos calibró. Si alguno no lleva certificado, dice por qué. Se puede desde el primer día; si termina antes, confirma que ya terminó.',
        where: 'Detalle › pestaña Visitas (también en celular)',
        automatic:
          'calcula cuántos certificados debe la visita y empieza a contar el plazo para cargarlos.',
        state: 'En ejecución'
      }),
      {
        kind: 'decision',
        question:
          '¿Apareció algo distinto a lo cotizado? (equipos de más, de menos o que no llegaron)',
        branches: [
          {
            answer: 'Sí',
            result:
              'El metrólogo reporta una novedad. Dirección técnica la revisa. Si hay que cobrar algo, comercial y el cliente la aprueban. Luego cambia la cantidad del servicio.',
            tone: 'warn'
          },
          { answer: 'No', result: 'Sigue normal.', tone: 'ok' }
        ]
      },
      {
        kind: 'decision',
        question: '¿Quedan equipos por calibrar?',
        branches: [
          {
            answer: 'Sí',
            result:
              'Coordinación programa otra visita (paso 5). Si pasan los días sin programarla, la plataforma avisa.',
            tone: 'warn'
          },
          {
            answer: 'No',
            result:
              'Se pulsa «Finalizar ejecución». La orden queda finalizada técnicamente.',
            tone: 'ok'
          }
        ]
      }
    ]
  },
  {
    id: 'flujo-certificar',
    letter: 'D',
    short: 'Certificar',
    summary: 'Se cargan, revisan y liberan',
    title: 'Certificados a liberar',
    intro:
      'Es un módulo aparte, con su propia pantalla, conectado con la orden y la visita.',
    note: 'Si se liberó por error, un administrador puede revertir la liberación: el equipo del cliente vuelve a como estaba y el certificado regresa a firmado.',
    nodes: [
      step({
        number: '9',
        role: 'metrologist',
        title: 'Carga los PDF de los certificados',
        text: 'Hasta 50 a la vez. Elige la orden de servicio; solo puede elegir órdenes donde esté asignado.',
        where:
          'Certificados a liberar, o el botón «Cargar certificados» de la orden',
        automatic:
          'lee de cada PDF el número, el equipo, la serie, el cliente y la fecha; los liga a su visita y señala lo raro (repetido, otro cliente, fecha inválida).',
        state: 'Pendiente de revisión'
      }),
      step({
        number: '10',
        role: 'review',
        title: 'Revisa cada certificado',
        text: 'Compara los datos leídos con el PDF, corrige lo que haga falta e identifica al cliente.',
        where: 'Certificados a liberar › abrir el certificado'
      }),
      {
        kind: 'decision',
        question: '¿Está correcto?',
        branches: [
          {
            answer: 'Sí',
            result: 'Lo marca verificado y sigue el paso 11.',
            tone: 'ok'
          },
          {
            answer: 'Tiene un error',
            result:
              'Pide ajustes y escribe qué corregir. Quien lo cargó recibe un aviso, sube el PDF corregido y vuelve al paso 10.',
            tone: 'warn'
          },
          {
            answer: 'No debía cargarse',
            result: 'Lo descarta con el motivo. No cuenta.',
            tone: 'bad'
          }
        ]
      },
      step({
        number: '11',
        role: 'review',
        title: 'Firma el certificado',
        text: 'Estampa la firma y el sello. Si el PDF ya venía firmado, solo lo marca como firmado. Los anexos y los de otro laboratorio se saltan este paso.',
        where: 'Certificados a liberar › Firmar',
        state: 'Firmado'
      }),
      step({
        number: '12',
        role: 'review',
        title: 'Libera el certificado',
        text: 'Confirma a qué equipo del cliente pertenece (o crea el equipo) y cada cuántos meses se vuelve a calibrar.',
        where: 'Certificados a liberar › Liberar',
        automatic:
          'guarda el certificado en el equipo del cliente y en su historial, y lo copia a Google Drive si está conectado.',
        state: 'Liberado'
      }),
      step({
        number: '13',
        role: 'customer',
        title: 'Consulta su certificado',
        text: 'Entra a la plataforma y lo ve en sus equipos.'
      })
    ]
  },
  {
    id: 'flujo-cobrar',
    letter: 'E',
    short: 'Cobrar',
    summary: 'Corte, factura y pago',
    title: 'Cobrar',
    intro:
      'El corte es la parte del trabajo que se manda a facturar. Puede ser parcial o final.',
    nodes: [
      step({
        number: '14',
        role: 'metrologist',
        title: 'Crea el corte y lo marca listo',
        text: 'Elige qué equipos y cuántos entran. Se puede hacer mientras la orden sigue en ejecución.',
        where: 'Detalle › Crear corte',
        state: 'Listo para facturar'
      }),
      step({
        number: '15',
        role: 'invoicing',
        title: 'Factura',
        text: 'Registra el número de factura.',
        where: 'Detalle › pestaña Cortes',
        state: 'Facturado'
      }),
      {
        kind: 'decision',
        question: '¿El cliente paga de contado o a crédito?',
        branches: [
          {
            answer: 'De contado',
            result:
              'Facturación debe registrar el pago antes de poder enviar los certificados de ese corte.',
            tone: 'warn'
          },
          {
            answer: 'A crédito',
            result: 'Se puede seguir; el cobro queda pendiente.',
            tone: 'ok'
          }
        ]
      }
    ]
  },
  {
    id: 'flujo-cerrar',
    letter: 'F',
    short: 'Cerrar',
    summary: 'Se envían certificados y se cierra',
    title: 'Enviar certificados y cerrar',
    intro: 'Último tramo.',
    nodes: [
      step({
        number: '16',
        role: 'metrologist',
        title: 'Hace el control documental del corte',
        text: 'Confirma cuántos certificados se emitieron, revisaron y enviaron, y por qué medio.',
        where: 'Detalle › Cortes › Control documental',
        automatic:
          'trae las cifras desde Certificados a liberar. «Todos enviados» solo se habilita cuando todos los esperados están liberados.'
      }),
      {
        kind: 'decision',
        question:
          '¿Los cortes están facturados, los de contado pagados, los certificados enviados y no queda nada por cortar?',
        branches: [
          {
            answer: 'Sí',
            result: 'La plataforma cierra la orden sola.',
            tone: 'ok'
          },
          {
            answer: 'No',
            result: 'La orden sigue abierta y muestra qué falta.',
            tone: 'warn'
          }
        ]
      }
    ]
  }
]

export const FLOW_CERTIFICATE_LINKS: [string, string][] = [
  [
    'Se carga un certificado en la orden',
    'La visita suma uno («37 de 50») y la orden lo lista en «Certificados del servicio».'
  ],
  [
    'Se cargan todos los de la visita',
    'La visita queda cumplida: a tiempo o tarde, para quien era responsable.'
  ],
  [
    'Se piden ajustes',
    'La orden muestra «certificados con observaciones» y corre el plazo de corrección.'
  ],
  [
    'Se libera',
    'Sube el contador de liberados, deja de correr el plazo de revisión y el cliente lo ve.'
  ],
  [
    'Se liberan los de un corte',
    'En el control documental de ese corte ya se pueden marcar como enviados.'
  ],
  [
    'Se envían los de todos los cortes y lo demás está completo',
    'La orden se cierra.'
  ]
]

export const FLOW_DEADLINES: [string, string, string, string][] = [
  [
    'Programar la primera visita',
    'Emisión de la ODS',
    '3 días',
    'Coordinación'
  ],
  ['Registrar la ejecución', 'Fin de la visita', 'El mismo día', 'Metrólogo'],
  [
    'Cargar los certificados',
    'Fin de la visita',
    '2 días',
    'Responsable de la visita'
  ],
  ['Revisar y liberar', 'Carga del certificado', '3 días', 'Analista'],
  ['Corregir un certificado', 'Pedido de ajustes', '1 día', 'Quien lo cargó'],
  [
    'Programar la siguiente visita',
    'Última visita, si faltan equipos',
    '5 días (avisa a los 3)',
    'Coordinación'
  ],
  [
    'Cumplir la fecha compromiso',
    'Si faltan equipos',
    'Avisa 5 días antes',
    'Coordinación'
  ]
]
