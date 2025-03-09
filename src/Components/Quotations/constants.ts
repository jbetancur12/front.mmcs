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
