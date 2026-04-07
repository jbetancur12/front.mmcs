import { ChipProps } from '@mui/material'
import {
  CalibrationServiceApprovalStatus,
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

export const CALIBRATION_SERVICE_STATUS_LABELS: Record<
CalibrationServiceStatus,
string
> = {
  draft: 'Borrador',
  pending_approval: 'Pendiente de aprobación',
  rejected: 'Rechazada',
  approved: 'Aprobada',
  ods_issued: 'ODS emitida',
  pending_programming: 'Pendiente de programación'
}

export const CALIBRATION_SERVICE_APPROVAL_LABELS: Record<
CalibrationServiceApprovalStatus,
string
> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada'
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
