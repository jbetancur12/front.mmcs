import { ChipProps } from '@mui/material'
import {
  CalibrationServiceApprovalStatus,
  CalibrationServiceDocumentType,
  CalibrationServiceEventType,
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
  'comp_supervisor'
] as const

export const CALIBRATION_SERVICE_ODS_ROLES = [
  'admin',
  'super_admin',
  'comp_admin',
  'comp_supervisor'
] as const

export const CALIBRATION_SERVICE_DOCUMENT_UPLOAD_ROLES = [
  'admin',
  'super_admin',
  'comp_admin',
  'comp_requester',
  'comp_supervisor'
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
  pending_programming: 'Pendiente de programación'
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
  pending_programming: 'secondary'
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
  ods_issued: 'info',
  document_uploaded: 'secondary'
}
