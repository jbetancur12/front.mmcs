import { ChipProps } from '@mui/material'
import type { StatusPillTone } from 'src/Components/Common/StatusPill'
import { neutral, intent } from 'src/theme/designTokens'

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
  draft: neutral.textFaint,
  pending_approval: intent.warning,
  approved: intent.success,
  ready_for_invoicing: intent.info,
  rejected: intent.danger,
  invoiced: intent.infoInk,
  cancelled: neutral.textMuted
}

// Tono de StatusPill por estado: fondo suave y texto oscuro, legibles sobre blanco.
export const EQUIPMENT_QUOTATION_STATUS_TONES: Record<string, StatusPillTone> =
  {
    draft: 'idle',
    pending_approval: 'warning',
    approved: 'success',
    ready_for_invoicing: 'live',
    rejected: 'error',
    invoiced: 'success',
    cancelled: 'idle'
  }

export const EQUIPMENT_QUOTATION_APPROVAL_LABELS: Record<string, string> = {
  pending: 'Pendiente respuesta cliente',
  approved: 'Aprobada por cliente',
  rejected: 'Rechazada por cliente'
}

export const EQUIPMENT_QUOTATION_APPROVAL_COLORS: Record<
  string,
  ChipProps['color']
> = {
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

export const EQUIPMENT_QUOTATION_DOCUMENT_COLORS: Record<
  string,
  ChipProps['color']
> = {
  request_evidence: 'info',
  approval_evidence: 'success',
  rejection_evidence: 'warning',
  quote_pdf: 'secondary',
  supporting_attachment: 'default'
}
