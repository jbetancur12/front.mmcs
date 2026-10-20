import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  MaintenanceFile,
  MaintenanceTicket,
  MaintenanceUpdateRequest
} from '../../../types/maintenance'

export const formatCurrency = (amount: number | undefined) => {
  if (!amount) return 'No especificado'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP'
  }).format(amount)
}

export const formatWorkMinutes = (value?: number | null) => {
  const minutes = Number(value)
  if (!Number.isFinite(minutes) || minutes <= 0) return null
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (hours <= 0) return `${remainingMinutes} min`
  if (remainingMinutes <= 0) return `${hours} h`
  return `${hours} h ${remainingMinutes} min`
}

export const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'No programada'
  try {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es })
  } catch {
    return 'Fecha inválida'
  }
}

export const surfaceSx = {
  backgroundColor: '#ffffff',
  borderRadius: '14px',
  border: '1px solid #e5e7eb',
  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)'
}

export const getFileDisplayName = (file: MaintenanceFile) =>
  file.originalName || file.fileName || 'archivo'

export const getFilePreviewType = (file: MaintenanceFile) => {
  const fileName = getFileDisplayName(file).toLowerCase()

  if (file.isImage || file.fileType === 'image') return 'image'
  if (file.isVideo || file.fileType === 'video') return 'video'
  if (file.fileType === 'document' && fileName.endsWith('.pdf')) return 'pdf'
  if (fileName.endsWith('.pdf')) return 'pdf'

  return 'other'
}

/** Valores editables del ticket; el técnico solo ve un subconjunto. */
export const getInitialEditData = (
  ticket: MaintenanceTicket,
  isTechnician: boolean
): MaintenanceUpdateRequest =>
  isTechnician
    ? {
        status: ticket.status,
        priority: ticket.priority,
        equipmentType: ticket.equipmentType,
        equipmentBrand: ticket.equipmentBrand,
        equipmentModel: ticket.equipmentModel,
        equipmentSerial: ticket.equipmentSerial,
        location: ticket.location,
        workPerformed: ticket.workPerformed || '',
        intakePhysicalCondition: ticket.intakePhysicalCondition || '',
        receivedAccessories: ticket.receivedAccessories || ''
      }
    : {
        status: ticket.status,
        assignedTechnician: ticket.assignedTechnicianId || '',
        scheduledDate: ticket.scheduledDate || '',
        equipmentType: ticket.equipmentType,
        equipmentBrand: ticket.equipmentBrand,
        equipmentModel: ticket.equipmentModel,
        equipmentSerial: ticket.equipmentSerial,
        priority: ticket.priority,
        estimatedCost: ticket.estimatedCost,
        actualCost: ticket.actualCost,
        location: ticket.location,
        intakePhysicalCondition: ticket.intakePhysicalCondition || '',
        receivedAccessories: ticket.receivedAccessories || ''
      }
