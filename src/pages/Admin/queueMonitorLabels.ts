import { FailedJob } from 'src/hooks/useQueueMonitor'

const JOB_TYPES: Record<string, string> = {
  'send-verification': 'Verificación de cuenta',
  'send-password-reset': 'Restablecer contraseña',
  'send-ticket-notification': 'Aviso de ticket',
  'send-welcome': 'Bienvenida',
  ADMIN_REPORT: 'Reporte de administración'
}

const REFERENCES: Record<string, string> = {
  ticketId: 'Ticket',
  userId: 'Usuario',
  customerId: 'Empresa',
  notificationType: 'Aviso'
}

export const jobTypeLabel = (type: string) => JOB_TYPES[type] ?? type

/** "Ticket 249 · Aviso status_update": lo poco que el API deja ver de cada trabajo. */
export const referenceLabel = (reference: FailedJob['reference']) =>
  Object.entries(reference)
    .map(([key, value]) => `${REFERENCES[key] ?? key} ${value}`)
    .join(' · ')
