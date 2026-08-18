import { ChipProps } from '@mui/material'

export const EQUIPMENT_SALES_ALLOWED_ROLES = [
  'admin',
  'super_admin',
  'comp_admin',
  'comp_requester',
  'comp_supervisor',
  'invoicing'
] as const

export const EQUIPMENT_SALES_EDIT_ROLES = [
  'admin',
  'super_admin',
  'comp_admin',
  'comp_requester',
  'comp_supervisor'
] as const

export const EQUIPMENT_SALES_INVOICE_ROLES = [
  'admin',
  'super_admin',
  'invoicing'
] as const

export const EQUIPMENT_SALES_PRODUCT_ROLES = [
  'admin',
  'super_admin',
  'comp_admin',
  'comp_requester',
  'comp_supervisor'
] as const

export const EQUIPMENT_QUOTATION_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  pending_approval: 'Cotización enviada',
  approved: 'Aprobada por cliente',
  ready_for_invoicing: 'Lista para facturar',
  rejected: 'Rechazada',
  invoiced: 'Facturada',
  cancelled: 'Cancelada'
}

export const EQUIPMENT_QUOTATION_STATUS_COLORS: Record<string, string> = {
  draft: '#9e9e9e',
  pending_approval: '#ff9800',
  approved: '#4caf50',
  ready_for_invoicing: '#2196f3',
  rejected: '#f44336',
  invoiced: '#1565c0',
  cancelled: '#757575'
}

export const EQUIPMENT_QUOTATION_APPROVAL_LABELS: Record<string, string> = {
  pending: 'Pendiente respuesta cliente',
  approved: 'Aprobada por cliente',
  rejected: 'Rechazada por cliente'
}

export const EQUIPMENT_QUOTATION_APPROVAL_COLORS: Record<string, ChipProps['color']> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error'
}

export const EQUIPMENT_QUOTATION_DOCUMENT_LABELS: Record<string, string> = {
  request_evidence: 'Evidencia de solicitud',
  approval_evidence: 'Evidencia aprobación cliente',
  rejection_evidence: 'Evidencia rechazo cliente',
  quote_pdf: 'PDF de cotización',
  supporting_attachment: 'Soporte adjunto'
}

export const EQUIPMENT_QUOTATION_DOCUMENT_COLORS: Record<string, ChipProps['color']> = {
  request_evidence: 'info',
  approval_evidence: 'success',
  rejection_evidence: 'warning',
  quote_pdf: 'secondary',
  supporting_attachment: 'default'
}
