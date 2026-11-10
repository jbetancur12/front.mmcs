import { MaintenanceStatus, MaintenanceTicket } from '../../types/maintenance'
import { maintenanceSignaturesEnabled } from '../../features/maintenanceFlags'

/**
 * Pendientes visibles de un ticket en la lista. Mismas reglas que el filtro
 * «Con pendientes» del API: lo abierto sin técnico, y lo completado sin reporte,
 * sin firma del cliente o sin facturar.
 */
export const getTicketPendings = (
  ticket: Pick<
    MaintenanceTicket,
    | 'status'
    | 'assignedTechnician'
    | 'assignedTechnicianId'
    | 'technicalReport'
    | 'customerSignatureData'
    | 'isInvoiced'
  >,
  signaturesEnabled: boolean = maintenanceSignaturesEnabled
): string[] => {
  const pendings: string[] = []
  const { status } = ticket

  if (status === MaintenanceStatus.CANCELLED) return pendings

  if (status === MaintenanceStatus.COMPLETED) {
    if (!ticket.technicalReport?.updatedAt) pendings.push('Sin reporte')
    if (signaturesEnabled && !ticket.customerSignatureData) {
      pendings.push('Falta firma del cliente')
    }
    if (!ticket.isInvoiced) pendings.push('Sin facturar')
    return pendings
  }

  if (!ticket.assignedTechnicianId && !ticket.assignedTechnician) {
    pendings.push('Sin técnico')
  }
  return pendings
}
