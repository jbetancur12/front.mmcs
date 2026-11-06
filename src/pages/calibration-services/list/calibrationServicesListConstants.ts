import {
  CalibrationServiceApprovalStatus,
  CalibrationServiceScopeType,
  CalibrationServiceSlaIndicatorColor,
  CalibrationServiceStatus
} from '../../../types/calibrationService'
import { brand, neutral, intent, withAlpha } from 'src/theme/designTokens'

export const FILTER_ALL = 'all'
export const FILTER_UNASSIGNED = 'unassigned'
/** Filtro de semáforo "en riesgo": amarillo o rojo. */
export const SLA_FILTER_ALERT = 'alert'
export const CALIBRATION_SERVICES_VIEW_STORAGE_KEY =
  'calibrationServicesViewMode'
export const CALIBRATION_SERVICES_FILTERS_STORAGE_KEY =
  'calibrationServicesFilters'

export const STATUS_OPTIONS: Array<{
  value:
    | CalibrationServiceStatus
    | typeof FILTER_ALL
    | 'ready_for_invoicing'
    | 'invoiced'
  label: string
}> = [
  { value: FILTER_ALL, label: 'Todos los estados' },
  { value: 'draft', label: 'Borrador' },
  { value: 'pending_approval', label: 'Cotización enviada' },
  { value: 'rejected', label: 'Rechazada' },
  { value: 'approved', label: 'Aprobada por cliente' },
  { value: 'ods_issued', label: 'ODS emitida · pendiente de programar' },
  { value: 'scheduled', label: 'Programada' },
  { value: 'in_execution', label: 'En ejecución' },
  { value: 'technically_completed', label: 'Finalizada técnicamente' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'closed', label: 'Cerrado' },
  { value: 'ready_for_invoicing', label: 'Por facturar' },
  { value: 'invoiced', label: 'Facturado' }
]

export const TECHNICAL_STATUS_OPTIONS: Array<{
  value: CalibrationServiceStatus | typeof FILTER_ALL
  label: string
}> = [
  { value: FILTER_ALL, label: 'Todos los estados técnicos' },
  { value: 'ods_issued', label: 'ODS emitida · pendiente de programar' },
  { value: 'scheduled', label: 'Programada' },
  { value: 'in_execution', label: 'En ejecución' },
  { value: 'technically_completed', label: 'Finalizada técnicamente' },
  { value: 'closed', label: 'Cerrado' }
]

export const APPROVAL_OPTIONS: Array<{
  value: CalibrationServiceApprovalStatus | typeof FILTER_ALL
  label: string
}> = [
  { value: FILTER_ALL, label: 'Toda la respuesta cliente' },
  { value: 'pending', label: 'Pendiente respuesta' },
  { value: 'approved', label: 'Aprobada por cliente' },
  { value: 'rejected', label: 'Rechazada por cliente' }
]

export const SCOPE_OPTIONS: Array<{
  value: CalibrationServiceScopeType | typeof FILTER_ALL
  label: string
}> = [
  { value: FILTER_ALL, label: 'Todos los alcances' },
  { value: 'general', label: 'Cliente general' },
  { value: 'site', label: 'Sede específica' }
]

export const SLA_OPTIONS: Array<{
  value: CalibrationServiceSlaIndicatorColor | typeof FILTER_ALL
  label: string
}> = [
  { value: FILTER_ALL, label: 'Todo el semáforo' },
  {
    value: SLA_FILTER_ALERT as CalibrationServiceSlaIndicatorColor,
    label: 'En riesgo (amarillo o rojo)'
  },
  { value: 'green', label: 'En tiempo' },
  { value: 'yellow', label: 'En alerta' },
  { value: 'red', label: 'Vencido' },
  { value: 'gray', label: 'Sin iniciar' },
  { value: 'blue', label: 'Completado' }
]

export const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

export const ui = {
  green: brand.main,
  greenDark: brand.hover,
  greenLight: intent.successSoft,
  success: brand.hover,
  warning: intent.warning,
  error: intent.danger,
  info: intent.info,
  text: neutral.text,
  textSecondary: neutral.textBody,
  muted: neutral.textMuted,
  border: neutral.border,
  surface: neutral.surfaceHead,
  white: '#ffffff',
  glass: withAlpha(neutral.surface, 0.75)
}

// Tarjeta del sistema de diseño: blanca, borde gris, sin vidrio ni brillo
export const softCardSx = {
  background: ui.white,
  border: `1px solid ${ui.border}`,
  borderRadius: '16px',
  boxShadow: 'none',
  transition: 'border-color .15s, box-shadow .15s',
  '&:hover': {
    borderColor: neutral.borderStrong,
    boxShadow: `0 4px 12px ${withAlpha(neutral.text, 0.06)}`
  },
  '@media (prefers-reduced-motion: reduce)': { transition: 'none' }
}

// Botón principal del sistema: turquesa sólido (el esmeralda queda para el
// banner de las fichas de detalle)
export const primaryButtonSx = {
  bgcolor: brand.main,
  borderRadius: '10px',
  textTransform: 'none',
  fontWeight: 700,
  color: ui.white,
  boxShadow: 'none',
  minHeight: 40,
  '&:hover': { bgcolor: brand.hover, boxShadow: 'none' },
  '&.Mui-disabled': { bgcolor: neutral.border, color: neutral.textMuted }
}

// Botón secundario: contorno gris, hover turquesa suave
export const secondaryButtonSx = {
  borderRadius: '10px',
  textTransform: 'none',
  fontWeight: 600,
  minHeight: 40,
  borderColor: ui.border,
  color: neutral.textBody,
  backgroundColor: ui.white,
  '&:hover': {
    borderColor: brand.hover,
    color: brand.ink,
    backgroundColor: brand.soft
  }
}
