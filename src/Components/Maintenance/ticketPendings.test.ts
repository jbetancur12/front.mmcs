import { describe, expect, it } from 'vitest'
import { MaintenanceStatus } from '../../types/maintenance'
import { getTicketPendings } from './ticketPendings'

const open = {
  status: MaintenanceStatus.IN_PROGRESS,
  assignedTechnicianId: '4',
  technicalReport: null,
  customerSignatureData: null,
  isInvoiced: false
}

describe('getTicketPendings', () => {
  it('abierto sin técnico', () => {
    expect(
      getTicketPendings({ ...open, assignedTechnicianId: undefined }, true)
    ).toEqual(['Sin técnico'])
  })

  it('abierto con técnico no tiene pendientes', () => {
    expect(getTicketPendings(open, true)).toEqual([])
  })

  it('completado sin nada: reporte, firma y facturar', () => {
    expect(
      getTicketPendings({ ...open, status: MaintenanceStatus.COMPLETED }, true)
    ).toEqual(['Sin reporte', 'Falta firma del cliente', 'Sin facturar'])
  })

  it('sin firmas activas no pide la firma', () => {
    expect(
      getTicketPendings({ ...open, status: MaintenanceStatus.COMPLETED }, false)
    ).toEqual(['Sin reporte', 'Sin facturar'])
  })

  it('completado al día no tiene pendientes', () => {
    expect(
      getTicketPendings(
        {
          ...open,
          status: MaintenanceStatus.COMPLETED,
          technicalReport: { updatedAt: '2026-11-01' } as never,
          customerSignatureData: 'data:image/png;base64,xx',
          isInvoiced: true
        },
        true
      )
    ).toEqual([])
  })

  it('cancelado no tiene pendientes', () => {
    expect(
      getTicketPendings({ ...open, status: MaintenanceStatus.CANCELLED }, true)
    ).toEqual([])
  })
})
