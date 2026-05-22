export const EQUIPMENT_QUOTE_TERM_KEYS = [
  'commercialComments',
  'generalConditions',
  'paymentConditions',
  'deliveryConditions',
  'warrantyConditions',
  'complaintsAndPqrs'
] as const

export type EquipmentQuoteTermKey = (typeof EQUIPMENT_QUOTE_TERM_KEYS)[number]

export const EQUIPMENT_QUOTE_TERM_LABELS: Record<EquipmentQuoteTermKey, string> = {
  commercialComments: 'Comentarios comerciales',
  generalConditions: 'Condiciones generales',
  paymentConditions: 'Condiciones de pago',
  deliveryConditions: 'Condiciones de entrega',
  warrantyConditions: 'Condiciones de garantía',
  complaintsAndPqrs: 'Quejas y PQRS'
}

export const EQUIPMENT_QUOTE_DEFAULT_TERMS: Record<string, string> = {
  commercialComments: '<p>Sin comentarios comerciales.</p>',
  generalConditions:
    '<p>Los equipos se entregan completamente nuevos, en su empaque original y con todos los accesorios especificados en la cotización.</p><p>Metromedics S.A.S no se hace responsable por daños ocasionados durante el transporte una vez entregado el equipo al cliente.</p><p>Los precios incluyen IVA salvo que se indique lo contrario.</p>',
  paymentConditions:
    '<p>La validez de la presente oferta es de <strong>{{validityDays}}</strong>.</p><p>El pago debe ser realizado en la cuenta de ahorros N° 85138050837 de banco Bancolombia, a nombre de Metromedics S.A.S.</p><p>Una vez realizado el pago, favor enviar copia del soporte de pago a la siguiente dirección de correo electrónico, comercial@metromedicslab.com.co</p><p>Forma de Pago es <strong>{{paymentMethod}}</strong></p>',
  deliveryConditions:
    '<p>Tiempo de entrega de los equipos: <strong>{{deliveryTime}}</strong>.</p><p>La entrega se realizará en la dirección indicada por el cliente en la orden de compra.</p><p>Los costos de envío corren por cuenta del cliente salvo acuerdo previo.</p>',
  warrantyConditions:
    '<p><strong>{{warrantyTerms}}</strong></p><p>La garantía cubre defectos de fábrica y no cubre daños por mal uso, manipulación indebida, descargas eléctricas, ni desgaste normal de piezas consumibles.</p><p>Para hacer efectiva la garantía, el cliente debe presentar la factura de compra y el producto debe ser devuelto en su empaque original con todos los accesorios.</p>',
  complaintsAndPqrs:
    '<p>Metromedics S.A.S se compromete a atender todas las quejas y PQRS relacionadas con los productos vendidos. El cliente puede interponer sus quejas a través de los canales de atención dispuestos en nuestra página web o al correo electrónico comercial@metromedicslab.com.co.</p>'
}

export const mergeEquipmentQuoteTerms = (
  terms?: Record<string, string> | null
): Record<string, string> => ({
  ...EQUIPMENT_QUOTE_DEFAULT_TERMS,
  ...(terms || {})
})
