import { ChipProps } from '@mui/material'
import type { StatusPillTone } from 'src/Components/Common/StatusPill'
import {
  CalibrationServiceAdjustmentStatus,
  CalibrationServiceAdjustmentType,
  CalibrationServiceApprovalStatus,
  CalibrationServiceCutDocumentStatus,
  CalibrationServiceCutStatus,
  CalibrationServiceDocumentType,
  CalibrationServiceEventType,
  CalibrationServiceOperationalItemStatus,
  CalibrationServiceSlaIndicatorColor,
  CalibrationServiceStatus
} from '../types/calibrationService'

// Quién puede hacer qué (y qué parte de los servicios ve cada persona) se decide por capacidades: ver
// constants/permissions.ts y hooks/useCalibrationVisibility.ts. Ya no hay listas de roles aquí.

export const CALIBRATION_SERVICE_STATUS_LABELS: Record<
  CalibrationServiceStatus,
  string
> = {
  draft: 'Borrador',
  pending_approval: 'Cotización enviada',
  expired: 'Vencida',
  rejected: 'Rechazada',
  approved: 'Aprobada por cliente',
  ods_issued: 'ODS emitida',
  pending_programming: 'Pendiente de programación',
  scheduled: 'Programada',
  in_execution: 'En ejecución',
  technically_completed: 'Finalizada técnicamente',
  cancelled: 'Cancelado',
  closed: 'Cerrado'
}

export const CALIBRATION_SERVICE_APPROVAL_LABELS: Record<
  CalibrationServiceApprovalStatus,
  string
> = {
  pending: 'Pendiente respuesta cliente',
  approved: 'Aprobada por cliente',
  rejected: 'Rechazada por cliente'
}

export const CALIBRATION_SERVICE_STATUS_COLORS: Record<
  CalibrationServiceStatus,
  ChipProps['color']
> = {
  draft: 'default',
  pending_approval: 'warning',
  expired: 'default',
  rejected: 'error',
  approved: 'success',
  ods_issued: 'info',
  pending_programming: 'secondary',
  scheduled: 'primary',
  in_execution: 'warning',
  technically_completed: 'success',
  cancelled: 'error',
  closed: 'default'
}

// Borde = estado alcanzado o en espera; relleno = en curso o terminado.
// Tono de StatusPill por estado: fondo suave y texto oscuro, legibles sobre blanco.
export const CALIBRATION_SERVICE_STATUS_TONES: Record<string, StatusPillTone> = {
  draft: 'idle',
  pending_approval: 'warning',
  expired: 'idle',
  rejected: 'error',
  approved: 'success',
  ods_issued: 'live',
  pending_programming: 'live',
  scheduled: 'live',
  in_execution: 'live',
  technically_completed: 'success',
  cancelled: 'idle',
  closed: 'idle',
  ready_for_invoicing: 'warning',
  invoiced: 'success'
}

/** Traduce un color de Chip de MUI al tono equivalente de StatusPill. */
export const chipColorToStatusTone = (
  color?: ChipProps['color']
): StatusPillTone => {
  switch (color) {
    case 'success':
      return 'success'
    case 'warning':
      return 'warning'
    case 'error':
      return 'error'
    case 'info':
    case 'primary':
    case 'secondary':
      return 'live'
    default:
      return 'idle'
  }
}

export const CALIBRATION_SERVICE_STATUS_VARIANTS: Record<
  CalibrationServiceStatus,
  'filled' | 'outlined'
> = {
  draft: 'outlined',
  pending_approval: 'filled',
  expired: 'outlined',
  rejected: 'filled',
  approved: 'outlined',
  ods_issued: 'outlined',
  pending_programming: 'filled',
  scheduled: 'outlined',
  in_execution: 'filled',
  technically_completed: 'filled',
  cancelled: 'filled',
  closed: 'filled'
}

const CHIP_ACCENT_HEX: Record<string, string> = {
  default: '#9ca3af',
  warning: '#f59e0b',
  error: '#ef4444',
  success: '#10b981',
  info: '#3b82f6',
  secondary: '#8b5cf6',
  primary: '#00BFA5'
}

// Color de la barra lateral de las tarjetas: sale del mismo mapa que el chip.
export const getCalibrationServiceStatusAccent = (
  status: CalibrationServiceStatus
) =>
  CHIP_ACCENT_HEX[CALIBRATION_SERVICE_STATUS_COLORS[status] || 'default']

const normalizeChipLabel = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^servicio /, '')
    .replace(/[ao]$/, '')
    .trim()

// El chip de SLA a veces repite el estado ("Programada" / "Programado").
export const isSlaLabelRedundantWithStatus = (
  status: CalibrationServiceStatus,
  slaLabel?: string | null
) =>
  Boolean(slaLabel) &&
  normalizeChipLabel(slaLabel as string) ===
    normalizeChipLabel(CALIBRATION_SERVICE_STATUS_LABELS[status])

export const CALIBRATION_SERVICE_OPERATIONAL_ITEM_STATUS_LABELS: Record<
  CalibrationServiceOperationalItemStatus,
  string
> = {
  pending: 'Pendiente',
  scheduled: 'Programado',
  in_progress: 'En proceso',
  completed: 'Completado'
}

export const CALIBRATION_SERVICE_APPROVAL_COLORS: Record<
  CalibrationServiceApprovalStatus,
  ChipProps['color']
> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error'
}

export const CALIBRATION_SERVICE_SLA_COLORS: Record<
  CalibrationServiceSlaIndicatorColor,
  ChipProps['color']
> = {
  gray: 'default',
  green: 'success',
  yellow: 'warning',
  red: 'error',
  blue: 'info'
}

export const CALIBRATION_SERVICE_DOCUMENT_LABELS: Record<
  CalibrationServiceDocumentType,
  string
> = {
  request_evidence: 'Evidencia de solicitud',
  approval_evidence: 'Evidencia aprobación cliente',
  rejection_evidence: 'Evidencia rechazo cliente',
  quote_pdf: 'PDF de cotización',
  ods_pdf: 'PDF de ODS',
  adjustment_pdf: 'PDF de anexo de novedad',
  adjustment_summary_pdf: 'PDF consolidado de novedades',
  adjustment_customer_response_pdf: 'PDF respuesta cliente novedad',
  logistics_control_pdf: 'PDF control ingreso/entrega',
  technical_progress_pdf: 'Anexo avance técnico',
  invoice_attachment: 'Soporte de factura',
  supporting_attachment: 'Soporte adjunto'
}

export const CALIBRATION_SERVICE_DOCUMENT_COLORS: Record<
  CalibrationServiceDocumentType,
  ChipProps['color']
> = {
  request_evidence: 'info',
  approval_evidence: 'success',
  rejection_evidence: 'warning',
  quote_pdf: 'secondary',
  ods_pdf: 'secondary',
  adjustment_pdf: 'secondary',
  adjustment_summary_pdf: 'secondary',
  adjustment_customer_response_pdf: 'secondary',
  logistics_control_pdf: 'secondary',
  technical_progress_pdf: 'secondary',
  invoice_attachment: 'info',
  supporting_attachment: 'default'
}

export const CALIBRATION_SERVICE_EVENT_LABELS: Record<
  CalibrationServiceEventType,
  string
> = {
  service_created: 'Servicio creado',
  service_updated: 'Servicio actualizado',
  approval_requested: 'Cotización enviada',
  service_approved: 'Aprobación cliente registrada',
  service_rejected: 'Rechazo cliente registrado',
  adjustment_reported: 'Novedad reportada',
  adjustment_reviewed: 'Novedad revisada',
  ods_issued: 'ODS emitida',
  document_uploaded: 'Documento cargado',
  certificate_sent: 'Certificado enviado'
}

export const CALIBRATION_SERVICE_EVENT_COLORS: Record<
  CalibrationServiceEventType,
  'primary' | 'success' | 'error' | 'warning' | 'info' | 'secondary'
> = {
  service_created: 'primary',
  service_updated: 'secondary',
  approval_requested: 'warning',
  service_approved: 'success',
  service_rejected: 'error',
  adjustment_reported: 'warning',
  adjustment_reviewed: 'info',
  ods_issued: 'info',
  document_uploaded: 'secondary',
  certificate_sent: 'success'
}

export const CALIBRATION_SERVICE_ADJUSTMENT_TYPE_LABELS: Record<
  CalibrationServiceAdjustmentType,
  string
> = {
  quantity_less: 'Cantidad menor a la cotizada',
  quantity_more: 'Cantidad mayor a la cotizada',
  extra_item: 'Ítem adicional no cotizado',
  not_received: 'Ítem no recibido',
  scope_change: 'Cambio de alcance'
}

export const CALIBRATION_SERVICE_ADJUSTMENT_STATUS_LABELS: Record<
  CalibrationServiceAdjustmentStatus,
  string
> = {
  reported: 'Reportada',
  pending_customer_approval: 'Pendiente cliente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  customer_rejected: 'Rechazada por cliente',
  customer_changes_requested: 'Cliente pide ajuste',
  applied_to_cut: 'Aplicada al corte'
}

export const CALIBRATION_SERVICE_ADJUSTMENT_STATUS_COLORS: Record<
  CalibrationServiceAdjustmentStatus,
  ChipProps['color']
> = {
  reported: 'warning',
  pending_customer_approval: 'info',
  approved: 'success',
  rejected: 'error',
  customer_rejected: 'error',
  customer_changes_requested: 'secondary',
  applied_to_cut: 'info'
}

export const CALIBRATION_SERVICE_CUT_STATUS_LABELS: Record<
  CalibrationServiceCutStatus,
  string
> = {
  draft: 'Borrador',
  ready_for_invoicing: 'Listo para facturar',
  invoiced: 'Facturado'
}

export const CALIBRATION_SERVICE_CUT_DOCUMENT_STATUS_LABELS: Record<
  CalibrationServiceCutDocumentStatus,
  string
> = {
  pending_certificates: 'Pendiente certificados',
  certificates_partial: 'Certificados parciales',
  certificates_ready: 'Certificados completos',
  reviewed: 'Certificados revisados',
  sent: 'Certificados enviados'
}

// D-04: motivo de pérdida al rechazar una cotización (`no_response` lo pone el vencimiento automático).
export const CALIBRATION_QUOTE_LOSS_REASON_LABELS: Record<string, string> = {
  price: 'Precio',
  time: 'Tiempo de entrega',
  competition: 'Competencia',
  no_response: 'Sin respuesta',
  other: 'Otro'
}

// Etapa del circuito de una novedad (la calcula el API) y color del chip según urgencia.
export const CALIBRATION_ADJUSTMENT_STAGE_LABELS: Record<string, string> = {
  technical_review: 'Por revisión técnica',
  commercial_review: 'Por revisión comercial',
  customer_response: 'Esperando al cliente',
  customer_rejected: 'Rechazada por el cliente',
  technically_approved: 'Aprobada técnicamente',
  approved: 'Aprobada',
  rejected: 'Rechazada'
}

export const CALIBRATION_ADJUSTMENT_STAGE_COLORS: Record<
  string,
  ChipProps['color']
> = {
  technical_review: 'warning',
  commercial_review: 'warning',
  customer_response: 'info',
  customer_rejected: 'error',
  technically_approved: 'success',
  approved: 'success',
  rejected: 'error'
}
