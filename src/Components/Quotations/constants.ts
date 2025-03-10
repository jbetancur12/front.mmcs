// constants.ts
import { PaymentConditionsOptions, StatusKey } from './types'

export const statusOptions: Record<StatusKey, string> = {
  created: 'Creado',
  sent: 'Enviado',
  accepted: 'Aceptado',
  rejected: 'Rechazado'
}

export const paymentConditionsOptions: PaymentConditionsOptions = {
  contado: 'De contado',
  credito: 'Crédito'
}

export const texts = (
  quoteType: 'mantenimiento' | 'equipos' = 'equipos',
  paymentMethod?: string
) => {
  const companyName =
    quoteType === 'mantenimiento' ? 'Cibmedics' : 'Metromedics'
  const email =
    quoteType === 'mantenimiento'
      ? 'cibmedicsas@gmail.com'
      : 'comercial@metromedicslab.com.co'
  return {
    generalConditions: `${companyName} es responsable del manejo de toda la información del cliente obtenida durante la ejecución de las actividades de calibración.\nEl personal de ${companyName} no está sometido a presiones comerciales, financieras o de otro tipo, tanto externas como internas que puedan influenciar el juicio técnico y transparente de los resultados obtenidos en el servicio`,
    paymentConditions: `La validez de la presente oferta es de 30 días.\nEl pago debe ser realizado en la cuenta de ahorros N° 85138050837 de banco Bancolombia, a nombre de ${companyName} SAS\nUna vez realizado el pago, favor enviar copia del soporte de pago a la siguiente dirección de correo electrónico: ${email}\nForma de Pago es ${paymentMethod}`,
    deliveryConditions:
      'Tiempo de entrega: 15 días hábiles a partir de la fecha de pago.',
    maintenanceConditionsInLab: `El cliente debe enviar los instrumentos con una remisión donde se especifique los datos generales de la empresa y el equipo.
Los equipos deben ser enviados con sus respectivos accesorios y preferiblemente en un empaque adecuado.
Es responsabilidad del cliente el envío y la recolección de los equipos que se deban calibrar en el laboratorio. Si los equipos son enviados por transportadora, igualmente deben programar su recogida.\n${companyName} no se responsabiliza por desajustes o daños que se presenten en el transporte de los equipos.
El horario de recepción y entrega de equipos es de lunes a viernes de 8:00 am a 12:00 pm y de 2:00 pm a 5:00 pm`,
    maintenanceConditionsInInSitu: `Cada equipo médico deberá tener un tiempo de disponibilidad según lo establecido por el biomédico y a la vez estos deberán estar desinfectados.
Los equipos deben estar disponibles para su mantenimiento el día y la hora de programación.
El cliente es responsable de proporcionar a los técnicos un área con ambiente adecuado y/o controlado para realizar el mantenimiento de los equipos. Esta área deberá tener una iluminación adecuada, servicio eléctrico, así como espacio suficiente para la realización del servicio. Si durante la prestación del servicio se requieren cambios, estos serán acordados por escrito por ambas partes.
El cliente debe tener disponible personal que pueda informar o que tenga acceso a las claves y derechos de ingreso de todos los módulos de servicio del aplicativo de cada equipo objeto de servicio. Si requiere copia de un reporte de mantenimiento o informe del mismo, este podrá observarse en la página web mientras se estipule en el contrato de mantenimiento.`,
    methodsUsed: `El mantenimiento de los equipos médicos se puede dividir en dos principales categorías: mantenimiento preventivo (MP) y mantenimiento correctivo (MC). Por MP se entienden todas las actividades programadas que aseguran la funcionalidad de los equipos y previenen averías o fallas.
El mantenimiento preventivo (MP) comprende todas las actividades que se realizan para prolongar la vida útil de un dispositivo y prevenir desperfectos. Se aplicará un plan de mantenimiento, un cronograma de mantenimiento, la realización de todas las hojas de vida, el reporte de mantenimiento por cada equipo y si se requiere se hará una capacitación de los equipos médicos.
A cada equipo se le hará intervención tanto física como funcional, la cual está establecida en cada protocolo de mantenimiento para cada equipo.`,
    capacityAndResources: `${companyName} SAS es una organización dedicada a realizar procesos bajo normas técnicas nacionales e internacionales para contribuir en la estandarización de los procedimientos metrológicos a nivel nacional, en la rama biomédica e industrial y de esta manera garantizar la productividad de las compañías para que puedan brindar con seguridad un excelente trabajo en su producción y protección de los servicios ofertados para sus clientes.
Contamos con una excelente infraestructura tecnológica, con equipos trazados a estándares internacionales acordes con el Sistema Internacional de Unidades (SI), que nos permiten ser eficientes, con alta calidad y oportunidad en los servicios ofrecidos.`
  }
}
