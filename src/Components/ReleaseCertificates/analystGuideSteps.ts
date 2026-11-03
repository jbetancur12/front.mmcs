import { DriveGuideStep } from './driveGuideSteps'

/** Guía corta del uso diario de «Certificados a liberar», en el orden en que se trabaja. */
export const ANALYST_GUIDE_STEPS: DriveGuideStep[] = [
  {
    id: 'cargar',
    title: 'Carga los certificados',
    where: 'Quien carga: metrólogo o técnico',
    actions: [
      'Pulsa «Cargar certificado» y suelta los PDF en el recuadro (o haz clic para elegirlos). Puedes cargar hasta 50 a la vez, de 20 MB cada uno.',
      'Si los PDF son de un servicio de calibración, elige la ODS en el campo «Servicio de calibración (ODS)»: el cliente se toma del servicio. Es opcional; si no sabes la ODS o el certificado no es de un servicio, déjalo vacío y se carga como siempre. La analista lo puede ligar o cambiar después, al revisar.',
      'Pulsa «Cargar». No hay que llenar nada más: el sistema lee cada PDF y propone el tipo de documento, el número, el cliente, el equipo, la serie y las fechas.',
      'Al terminar verás una lista: los certificados correctos quedan «Pendiente de revisión» y, si alguno no se pudo registrar, dice por qué.'
    ],
    expect:
      'Cada certificado aparece en la bandeja como «Pendiente de revisión». Si trae algo raro, muestra un triángulo amarillo junto al número.'
  },
  {
    id: 'revisar',
    title: 'Revisa lo que el sistema leyó',
    where: 'Quien revisa: analista de datos',
    actions: [
      'Abre un certificado con el ojo (o doble clic en la fila). A la izquierda están los datos leídos y a la derecha el PDF.',
      'Si hay un recuadro amarillo «Para revisar con el PDF», léelo: dice qué se ve raro (nombre del archivo distinto al número, fecha inválida, varias fechas de calibración, serie sin información…). El sistema nunca corrige solo: tú decides.',
      'Si el cliente no se identificó, aparece un recuadro naranja con clientes parecidos: pulsa el correcto, o usa «Buscar otro cliente». Si no existe, créalo en Empresas.',
      'Para corregir cualquier dato pulsa «Editar datos», cámbialo y «Guardar cambios».'
    ],
    expect:
      'El cliente aparece identificado en la plataforma y los datos coinciden con lo que dice el PDF.'
  },
  {
    id: 'verificar',
    title: 'Verifica o pide ajustes',
    where: 'Analista de datos',
    actions: [
      'Si todo está bien, pulsa «Verificar». Se necesita el cliente identificado, el instrumento y la fecha de calibración.',
      'Si hay errores en el PDF, pulsa «Pedir ajustes» y escribe qué se debe corregir. A quien cargó el certificado le llega un aviso (campana).',
      'Quien cargó abre el certificado, ve las observaciones arriba, pulsa «Subir PDF corregido» y el certificado vuelve a «Pendiente de revisión». La versión anterior se conserva.'
    ],
    expect:
      'El certificado queda «Verificado», o «Requiere ajustes» con las observaciones a la vista.'
  },
  {
    id: 'firmar',
    title: 'Firma',
    where: 'Analista de datos',
    actions: [
      'La primera vez, pulsa «Mi firma» y dibújala (con mouse, lápiz o dedo) o sube una imagen. Se guarda y solo tú la ves.',
      'En un certificado verificado pulsa «Firmar». Para varios a la vez, marca las casillas de la bandeja y pulsa «Firmar seleccionados».',
      'El sistema estampa tu firma, tu nombre y la fecha en la última página y guarda el PDF firmado como versión nueva. Los certificados de otros laboratorios y los reportes de seguridad eléctrica no se firman.'
    ],
    expect:
      'El certificado pasa a «Firmado» y en sus versiones aparece «(firmado)».'
  },
  {
    id: 'liberar',
    title: 'Libera y asocia el equipo',
    where: 'Analista de datos',
    actions: [
      'En un certificado firmado pulsa «Liberar». El sistema busca el equipo del cliente por tipo y serie y te propone coincidencias.',
      'Elige el equipo correcto. Si no aparece, mira «¿Es alguno de estos?» (mismo tipo, serie distinta) o usa «Buscar otro equipo del cliente». Si de verdad es nuevo, elige «Ninguno» y completa los datos.',
      'Un reporte de seguridad eléctrica se registra como «Seguridad Electrica» del equipo, aparte de su calibración: son dos registros del mismo equipo. El sistema no deja actualizar uno con el certificado del otro.',
      'Revisa «Próxima calibración» (6 o 12 meses) y, si la serie no coincide, confirma que es el mismo equipo. Pulsa «Actualizar equipo y liberar» (o «Crear equipo y liberar»).'
    ],
    expect:
      'El certificado queda «Liberado», aparece en el historial del equipo del cliente y se copia al Drive.',
    warning:
      'Nada se crea ni se actualiza hasta que confirmas. Revisa bien el equipo: si te equivocas, pide a administración que revierta la liberación.'
  },
  {
    id: 'deshacer',
    title: 'Si te equivocas',
    where: 'Según el rol',
    actions: [
      'Descartar: un certificado cargado por error sale de la bandeja con un motivo. Quien lo cargó puede descartar el suyo mientras nadie lo haya verificado; la analista puede descartar cualquiera que no esté liberado.',
      'Reabrir revisión: un certificado verificado o firmado vuelve a «Pendiente de revisión» (si estaba firmado, se firma de nuevo). Un descartado se restaura con el mismo botón. Activa «Ver descartados» para encontrarlos.',
      'Revertir liberación: solo administración. El equipo del cliente vuelve a como estaba (si la liberación lo creó, se elimina) y el certificado regresa a «Firmado». La copia que ya se hizo en el Drive hay que quitarla a mano.'
    ],
    expect:
      'La acción siempre pide un motivo y queda en el historial del certificado con quién la hizo y cuándo.'
  }
]
