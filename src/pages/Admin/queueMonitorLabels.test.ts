import { describe, expect, it } from 'vitest'
import { jobTypeLabel, referenceLabel } from './queueMonitorLabels'

describe('etiquetas de las colas', () => {
  it('traduce los tipos conocidos y deja los demás tal cual', () => {
    expect(jobTypeLabel('send-ticket-notification')).toBe('Aviso de ticket')
    expect(jobTypeLabel('otro-trabajo')).toBe('otro-trabajo')
  })

  it('arma la referencia del trabajo, vacía si no hay', () => {
    expect(
      referenceLabel({ ticketId: 249, notificationType: 'status_update' })
    ).toBe('Ticket 249 · Aviso status_update')
    expect(referenceLabel({})).toBe('')
  })
})
