import { ChipProps } from '@mui/material'

import { ROLES, ROLE_GROUPS } from 'src/constants/roles'
export const EQUIPMENT_SALES_ALLOWED_ROLES = [
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
  ROLES.COMP_ADMIN,
  ROLES.COMP_REQUESTER,
  ROLES.INVOICING
] as const

export const EQUIPMENT_SALES_EDIT_ROLES = ROLE_GROUPS.COMMERCIAL_EDITORS

export const EQUIPMENT_SALES_INVOICE_ROLES = [
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
  ROLES.INVOICING
] as const

export const EQUIPMENT_SALES_PRODUCT_ROLES = ROLE_GROUPS.COMMERCIAL_EDITORS

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
