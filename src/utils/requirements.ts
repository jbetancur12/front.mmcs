// Requisitos para servicios de calibración
const calibrationServiceRequirements = [
  'Proveedor acreditado por un organismo que otorgue reconocimiento (nacional o internacional), o Institutos Nacionales de Metrología que cubran la necesidad que tenga el laboratorio.',
  'El certificado emitido debe cumplir los requisitos definidos en la ISO – IEC 17025.',
  'En la medida de lo posible, los tiempos de entrega no deben afectar la prestación de los servicios de calibración.'
]

// Requisitos para la compra de equipos
const equipmentPurchaseRequirements = [
  'Que el proveedor cumpla los requisitos de la compra.',
  'Que presente servicios posventas (No aplica para proveedores internacionales).',
  'Que el tiempo de envió sea menor a 45 días.',
  'Que venda también complementos.',
  'Si el equipo tiene software que este incluido en el precio.',
  'En lo posible que el equipo tenga estuches de almacenamiento si aplica.',
  'Que el equipo tenga certificado de calibración acreditado, si no lo tienen se debe solicitar el servicio del equipo.'
]

// Requisitos para servicios de ensayos de aptitud
const proficiencyTestingServiceRequirements = [
  'Proveedor acreditado en ISO 17043 o institutos nacionales de metrología.',
  'Que ofrezcan servicios de ensayos de aptitud en las magnitudes incluidas en el alcance del laboratorio de Metromedics S.A.S.',
  'Que realice entrega de informe preliminar y final.',
  'Que en lo posible realice análisis de los resultados.'
]

// Requisitos para servicios de auditoría interna
const internalAuditServiceRequirements = [
  'Proveedor con formación de acuerdo con los requisitos del procedimiento de auditorías internas PRGC-MMCS-08 AUDITORIAS INTERNAS.',
  'Deben contar con los formatos necesarios para la ejecución de la auditoria y debe incluir en su servicio la evaluación de la eficacia de los planes de acción de las auditorias ejecutadas en el año anterior a su ejecución.'
]

export {
  calibrationServiceRequirements,
  equipmentPurchaseRequirements,
  proficiencyTestingServiceRequirements,
  internalAuditServiceRequirements
}
