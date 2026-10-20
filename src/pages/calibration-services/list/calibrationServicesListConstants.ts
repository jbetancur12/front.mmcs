import {
  CalibrationServiceApprovalStatus,
  CalibrationServiceScopeType,
  CalibrationServiceSlaIndicatorColor,
  CalibrationServiceStatus
} from '../../../types/calibrationService'

export const FILTER_ALL = 'all'
export const FILTER_UNASSIGNED = 'unassigned'
export const CALIBRATION_SERVICES_VIEW_STORAGE_KEY = 'calibrationServicesViewMode'
export const CALIBRATION_SERVICES_FILTERS_STORAGE_KEY = 'calibrationServicesFilters'

export const STATUS_OPTIONS: Array<{
  value: CalibrationServiceStatus | typeof FILTER_ALL
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
  { value: 'ready_for_invoicing' as any, label: 'Por facturar' },
  { value: 'invoiced' as any, label: 'Facturado' }
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
  green: '#10b981',
  greenDark: '#059669',
  greenLight: '#f0fdf4',
  success: '#059669',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  text: '#111827',
  textSecondary: '#4b5563',
  muted: '#9ca3af',
  border: '#e5e7eb',
  surface: '#f3f4f6',
  white: '#ffffff',
  glass: 'rgba(255, 255, 255, 0.75)'
}

export const softCardSx = {
  background: ui.glass,
  backdropFilter: 'blur(12px)',
  border: `1px solid rgba(255, 255, 255, 0.5)`,
  borderRadius: '16px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.1), 0 4px 6px -2px rgba(16, 185, 129, 0.05)',
    transform: 'translateY(-2px)'
  }
}

export const primaryButtonSx = {
  background: `linear-gradient(135deg, ${ui.green} 0%, ${ui.greenDark} 100%)`,
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 700,
  color: ui.white,
  boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2), 0 2px 4px -1px rgba(16, 185, 129, 0.1)',
  minHeight: 44,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(rgba(255,255,255,0.2), transparent)',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  '&:hover': {
    background: `linear-gradient(135deg, ${ui.green} 0%, #047857 100%)`,
    boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3), 0 4px 6px -2px rgba(16, 185, 129, 0.1)',
    transform: 'translateY(-1px)'
  },
  '&:hover::after': {
    opacity: 1
  }
}

export const secondaryButtonSx = {
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 700,
  minHeight: 44,
  borderColor: ui.border,
  color: ui.textSecondary,
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(8px)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  '&:hover': {
    borderColor: ui.green,
    color: ui.greenDark,
    backgroundColor: ui.greenLight,
    boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.1)',
    transform: 'translateY(-1px)'
  }
}
