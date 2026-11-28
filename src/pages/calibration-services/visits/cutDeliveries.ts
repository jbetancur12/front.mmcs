import { CalibrationServiceReleaseCertificates } from '../../../types/calibrationService'
import { DELIVERY_METHOD_LABELS } from './visitUtils'

type Item = CalibrationServiceReleaseCertificates['items'][number]

export const formatDeliveryDay = (value: string) =>
  new Date(value).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    timeZone: 'America/Bogota'
  })

const methodLabel = (item: Item) =>
  item.deliveryMethod
    ? DELIVERY_METHOD_LABELS[item.deliveryMethod]
    : 'Sin medio registrado'

const unique = (values: string[]) => [...new Set(values.filter(Boolean))]

/**
 * Datos de envío de un corte a partir de la entrega registrada en cada certificado, para no volver a pedirlos en el
 * control documental.
 */
export const summarizeCutDeliveries = (items: Item[]) => {
  const delivered = items.filter((item) => item.deliveredAt)
  const dates = delivered.map((item) => String(item.deliveredAt)).sort()
  const methods = unique(delivered.map(methodLabel))

  return {
    count: delivered.length,
    /** Liberados que todavía no le llegan al cliente. */
    pending: items.filter(
      (item) => item.status === 'liberado' && !item.deliveredAt
    ).length,
    /** Una línea por medio: «Correo · 2 · 27 nov». */
    lines: methods.map((method) => {
      const group = delivered.filter((item) => methodLabel(item) === method)
      const days = unique(
        group
          .map((item) => String(item.deliveredAt))
          .sort()
          .map(formatDeliveryDay)
      )
      return `${method} · ${group.length} · ${days.join(', ')}`
    }),
    sendChannel: methods.join(', ') || null,
    sentTo:
      unique(delivered.map((item) => item.deliveryRecipient || '')).join(
        ', '
      ) || (delivered.length ? 'Según la entrega de cada certificado' : null),
    sentAt: dates[dates.length - 1] ?? null
  }
}
