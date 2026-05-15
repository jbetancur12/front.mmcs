import { CalibrationServiceQuoteTerms } from '../../types/calibrationService'

export const CALIBRATION_QUOTE_TERM_KEYS = [
  'commercialComments',
  'generalConditions',
  'labCalibrationConditions',
  'siteCalibrationConditions',
  'paymentConditions',
  'deliveryConditions',
  'subcontractedServices',
  'calibrationMethods',
  'conformityDeclaration',
  'capacityAndResources',
  'complaintsAndPqrs'
] as const

export type CalibrationQuoteTermKey = (typeof CALIBRATION_QUOTE_TERM_KEYS)[number]

export const CALIBRATION_QUOTE_TERM_LABELS: Record<CalibrationQuoteTermKey, string> = {
  commercialComments: 'Comentarios comerciales',
  generalConditions: 'Condiciones generales',
  labCalibrationConditions: 'Condiciones de calibración en el laboratorio',
  siteCalibrationConditions: 'Condiciones de calibración en sitio',
  paymentConditions: 'Condiciones de pago',
  deliveryConditions: 'Condiciones de entrega',
  subcontractedServices: 'Condiciones para servicios subcontratados',
  calibrationMethods: 'Métodos de calibración',
  conformityDeclaration: 'Declaración de conformidad',
  capacityAndResources: 'Capacidad y recursos',
  complaintsAndPqrs: 'Quejas y PQRS'
}

export const CALIBRATION_QUOTE_DEFAULT_TERMS: Required<CalibrationServiceQuoteTerms> = {
  commercialComments: '<p>Sin comentarios comerciales.</p>',
  generalConditions:
    '<p>Los equipos deben estar disponibles para su calibración el día de la programación.</p><p>El cliente es responsable de proporcionar al metrólogo un área con ambiente adecuado y/o controlado para la realización de las calibraciones. Para calibración de termohigrómetros se debe garantizar temperatura ambiente en el rango de 16 °C a 24 °C; de lo contrario no se podrá realizar la calibración.</p><p>El área debe tener alimentación adecuada, servicio eléctrico y espacio suficiente para la realización del servicio. Los equipos deben estar identificados con serial o número de identificación; de lo contrario se asignará uno.</p>',
  labCalibrationConditions:
    '<p>Para servicios realizados en el laboratorio, el cliente debe entregar los equipos en condiciones adecuadas de limpieza, empaque y transporte. La recepción queda sujeta a inspección física y documental. Si durante la revisión se identifican condiciones que impidan ejecutar el servicio, Metromedics S.A.S informará al cliente para definir autorización, ajuste o devolución.</p>',
  siteCalibrationConditions:
    '<p>Para servicios realizados en sitio, el cliente debe garantizar acceso al área de trabajo, disponibilidad del equipo, condiciones ambientales y operativas requeridas, alimentación eléctrica y acompañamiento del personal responsable. Si las condiciones del sitio no permiten ejecutar la calibración, se deberá reprogramar o acordar el tratamiento aplicable.</p>',
  paymentConditions:
    '<p>La validez de la presente oferta es de <strong>{{validityDays}}</strong>.</p><p>El pago debe ser realizado en la cuenta de ahorros N° 85138050837 de banco Bancolombia, a nombre de Metromedics S.A.S.</p><p>Una vez realizado el pago, favor enviar copia del soporte de pago a comercial@metromedicslab.com.co y pagosyfacturas@metromedicslab.com.co.</p><p>Forma de pago: <strong>{{paymentMethod}}</strong>.</p>',
  deliveryConditions:
    '<p>Tiempo de entrega de los equipos: <strong>{{instrumentDeliveryTime}}</strong>.</p><p>Tiempo de entrega de los certificados: <strong>{{certificateDeliveryTime}}</strong>.</p><p>Los certificados se entregan en forma digital con firma certificada. En caso de que se deba realizar una corrección o modificación al certificado por solicitud del cliente, se genera un costo adicional por cada uno.</p>',
  subcontractedServices:
    '<p>En los casos en los que el servicio ofrecido sea ejecutado mediante subcontratación, los tiempos de entrega estarán sujetos a los plazos definidos por el laboratorio contratado. Estos tiempos pueden variar según la disponibilidad y condiciones operativas del proveedor.</p>',
  calibrationMethods:
    '<p>Las calibraciones de los equipos son realizadas a través de comparación directa entre el equipo bajo prueba y el instrumento patrón. Los métodos utilizados están basados en normas técnicas nacionales e internacionales aplicables.</p><ul><li>El cliente deberá informar los puntos de calibración requeridos cuando aplique.</li><li>Si el cliente no informa los puntos, el laboratorio definirá los puntos aplicables según el alcance del servicio.</li><li>Para instrumentos con requisitos especiales, el cliente deberá informar accesorios, condiciones de uso y parámetros relevantes antes de la ejecución.</li></ul>',
  conformityDeclaration:
    '<p>Metromedics S.A.S podrá realizar una declaración de conformidad sobre los resultados obtenidos en la calibración. Cuando el cliente solicite declaración de conformidad, deberá informar el criterio, norma o regla de decisión aplicable.</p>',
  capacityAndResources:
    '<p>Metromedics S.A.S es una organización dedicada a realizar procesos bajo normas técnicas nacionales e internacionales para contribuir a la estandarización de procedimientos metrológicos a nivel nacional. La organización cuenta con infraestructura tecnológica, equipos trazados a patrones nacionales y personal competente.</p>',
  complaintsAndPqrs:
    '<p>Metromedics S.A.S se compromete a atender todas las quejas y PQRS relacionadas con los servicios prestados por la organización y a dar una pronta respuesta. El cliente puede interponer quejas y PQRS a través de los canales de atención disponibles.</p>'
}

export const mergeCalibrationQuoteTerms = (
  terms?: CalibrationServiceQuoteTerms | null
): Required<CalibrationServiceQuoteTerms> => ({
  ...CALIBRATION_QUOTE_DEFAULT_TERMS,
  ...(terms || {})
})
