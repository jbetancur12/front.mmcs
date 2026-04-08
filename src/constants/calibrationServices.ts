import { ChipProps } from '@mui/material'
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

export const CALIBRATION_SERVICE_ALLOWED_ROLES = [
  'admin',
  'super_admin',
  'metrologist',
  'comp_admin',
  'comp_requester',
  'comp_supervisor',
  'invoicing'
] as const

export const CALIBRATION_SERVICE_TECHNICAL_ROLES = ['metrologist'] as const

export const CALIBRATION_SERVICE_COMMERCIAL_VISIBILITY_ROLES = [
  'admin',
  'super_admin',
  'comp_admin',
  'comp_requester',
  'comp_supervisor',
  'invoicing'
] as const

export const CALIBRATION_SERVICE_EDIT_ROLES = [
  'admin',
  'super_admin',
  'comp_admin',
  'comp_requester',
  'comp_supervisor'
] as const

export const CALIBRATION_SERVICE_APPROVAL_ROLES = [
  'admin',
  'super_admin',
  'comp_admin',
  'comp_requester',
  'comp_supervisor'
] as const

export const CALIBRATION_SERVICE_ODS_ROLES = [
  'admin',
  'super_admin',
  'comp_admin',
  'comp_supervisor'
] as const

export const CALIBRATION_SERVICE_SCHEDULE_ROLES = [
  'admin',
  'super_admin',
  'comp_admin',
  'comp_supervisor'
] as const

export const CALIBRATION_SERVICE_EXECUTION_ROLES = [
  'admin',
  'super_admin',
  'comp_admin',
  'comp_supervisor',
  'metrologist'
] as const

export const CALIBRATION_SERVICE_ADJUSTMENT_REPORT_ROLES =
  CALIBRATION_SERVICE_EXECUTION_ROLES

export const CALIBRATION_SERVICE_ADJUSTMENT_REVIEW_ROLES = [
  'admin',
  'super_admin',
  'comp_admin',
  'comp_requester',
  'comp_supervisor',
  'invoicing'
] as const

export const CALIBRATION_SERVICE_INVOICING_ROLES = [
  'admin',
  'super_admin',
  'comp_admin',
  'comp_supervisor',
  'invoicing'
] as const

export const CALIBRATION_SERVICE_DOCUMENT_CONTROL_ROLES =
  CALIBRATION_SERVICE_INVOICING_ROLES

export const CALIBRATION_SERVICE_CLOSE_ROLES =
  CALIBRATION_SERVICE_DOCUMENT_CONTROL_ROLES

export const CALIBRATION_SERVICE_DOCUMENT_UPLOAD_ROLES = [
  'admin',
  'super_admin',
  'comp_admin',
  'comp_requester',
  'comp_supervisor',
  'invoicing'
] as const

export const CALIBRATION_SERVICE_STATUS_LABELS: Record<
CalibrationServiceStatus,
string
> = {
  draft: 'Borrador',
  pending_approval: 'Cotización enviada',
  rejected: 'Rechazada',
  approved: 'Aprobada por cliente',
  ods_issued: 'ODS emitida',
  pending_programming: 'Pendiente de programación',
  scheduled: 'Programada',
  in_execution: 'En ejecución',
  technically_completed: 'Finalizada técnicamente',
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
  rejected: 'error',
  approved: 'success',
  ods_issued: 'info',
  pending_programming: 'secondary',
  scheduled: 'primary',
  in_execution: 'success',
  technically_completed: 'info',
  closed: 'default'
}

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
  document_uploaded: 'Documento cargado'
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
  document_uploaded: 'secondary'
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
  approved: 'Aprobada',
  rejected: 'Rechazada',
  applied_to_cut: 'Aplicada al corte'
}

export const CALIBRATION_SERVICE_ADJUSTMENT_STATUS_COLORS: Record<
  CalibrationServiceAdjustmentStatus,
  ChipProps['color']
> = {
  reported: 'warning',
  approved: 'success',
  rejected: 'error',
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
