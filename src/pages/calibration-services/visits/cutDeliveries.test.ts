import { describe, expect, it } from 'vitest'
import { summarizeCutDeliveries } from './cutDeliveries'

const item = (extra: Record<string, unknown>) => ({
  id: 1,
  documentNumber: null,
  instrument: null,
  serie: null,
  status: 'liberado',
  cutId: null,
  ...extra
})

describe('summarizeCutDeliveries', () => {
  it('arma los datos de envío con las entregas de cada certificado', () => {
    const summary = summarizeCutDeliveries([
      item({
        deliveredAt: '2026-11-26T15:00:00Z',
        deliveryMethod: 'correo',
        deliveryRecipient: 'Cliente de prueba'
      }),
      item({
        deliveredAt: '2026-11-27T15:00:00Z',
        deliveryMethod: 'plataforma',
        deliveryRecipient: 'Cliente de prueba'
      }),
      item({})
    ])

    expect(summary.count).toBe(2)
    expect(summary.pending).toBe(1)
    expect(summary.sendChannel).toBe('Correo, Plataforma')
    expect(summary.sentTo).toBe('Cliente de prueba')
    expect(summary.sentAt).toBe('2026-11-27T15:00:00Z')
    expect(summary.lines).toHaveLength(2)
  })

  it('sin entregas no inventa datos', () => {
    const summary = summarizeCutDeliveries([item({ status: 'firmado' })])

    expect(summary).toMatchObject({
      count: 0,
      pending: 0,
      sendChannel: null,
      sentTo: null,
      sentAt: null
    })
  })
})
