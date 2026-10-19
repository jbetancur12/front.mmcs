import {
  CalibrationService,
  CalibrationServiceSlaIndicatorColor
} from '../../../types/calibrationService'
import {
  CALIBRATION_SERVICES_FILTERS_STORAGE_KEY,
  CALIBRATION_SERVICES_VIEW_STORAGE_KEY
} from './calibrationServicesListConstants'
import {
  CalibrationServicesViewMode,
  KanbanColumnDefinition,
  StoredFilters
} from './calibrationServicesListTypes'

export const getStoredViewMode = (): CalibrationServicesViewMode => {
  if (typeof window === 'undefined') {
    return 'list'
  }

  const storedValue = window.localStorage.getItem(
    CALIBRATION_SERVICES_VIEW_STORAGE_KEY
  )

  return storedValue === 'kanban' ? 'kanban' : storedValue === 'table' ? 'table' : 'list'
}

export const getStoredFilters = (): StoredFilters => {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.sessionStorage.getItem(CALIBRATION_SERVICES_FILTERS_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredFilters) : {}
  } catch {
    return {}
  }
}

export const saveStoredFilters = (filters: StoredFilters) => {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(
      CALIBRATION_SERVICES_FILTERS_STORAGE_KEY,
      JSON.stringify(filters)
    )
  } catch { /* quota exceeded */ }
}

export const getSlaVisualTone = (color?: CalibrationServiceSlaIndicatorColor) => {
  switch (color) {
    case 'red':
      return {
        accent: '#ef4444',
        background: 'linear-gradient(180deg, rgba(239,68,68,0.14) 0%, rgba(255,255,255,0.96) 28%)',
        border: 'rgba(239,68,68,0.24)',
        glow: '0 6px 18px rgba(239,68,68,0.12)'
      }
    case 'yellow':
      return {
        accent: '#f59e0b',
        background: 'linear-gradient(180deg, rgba(245,158,11,0.14) 0%, rgba(255,255,255,0.96) 28%)',
        border: 'rgba(245,158,11,0.24)',
        glow: '0 6px 18px rgba(245,158,11,0.12)'
      }
    case 'green':
      return {
        accent: '#10b981',
        background: 'linear-gradient(180deg, rgba(16,185,129,0.1) 0%, rgba(255,255,255,0.96) 28%)',
        border: 'rgba(16,185,129,0.18)',
        glow: '0 6px 18px rgba(16,185,129,0.08)'
      }
    case 'blue':
      return {
        accent: '#3b82f6',
        background: 'linear-gradient(180deg, rgba(59,130,246,0.1) 0%, rgba(255,255,255,0.96) 28%)',
        border: 'rgba(59,130,246,0.18)',
        glow: '0 6px 18px rgba(59,130,246,0.08)'
      }
    default:
      return {
        accent: '#94a3b8',
        background: 'linear-gradient(180deg, rgba(148,163,184,0.08) 0%, rgba(255,255,255,0.96) 28%)',
        border: 'rgba(148,163,184,0.16)',
        glow: '0 4px 12px rgba(148,163,184,0.08)'
      }
  }
}

export const getCompactSlaLabel = (color?: CalibrationServiceSlaIndicatorColor) => {
  switch (color) {
    case 'red':
      return 'Vencido'
    case 'yellow':
      return 'Alerta'
    case 'green':
      return 'En tiempo'
    case 'blue':
      return 'Completado'
    default:
      return 'Sin iniciar'
  }
}

export const getCompactColumnTitle = (title: string) => {
  switch (title) {
    case 'Esperando respuesta cliente':
      return 'Cliente'
    case 'Listo para ODS':
      return 'Para ODS'
    case 'Pendiente programación':
      return 'Programar'
    case 'En servicio':
      return 'Servicio'
    case 'Facturación y cierre':
      return 'Fact./cierre'
    default:
      return title
  }
}

export const getItemsTotal = (service: CalibrationService) => {
  return (service.items ?? []).reduce((accumulator, item) => {
    const value =
      typeof item.total === 'string' ? parseFloat(item.total) : item.total
    return accumulator + (typeof value === 'number' && Number.isFinite(value) ? value : 0)
  }, 0)
}

export const getServiceSiteLabel = (service: CalibrationService) => {
  if (service.scopeType === 'site') {
    return service.customerSite || service.executionSiteName || 'Sede pendiente'
  }

  return service.executionSiteName || 'Alcance general del cliente'
}

export const getMetrologistNames = (service: CalibrationService): string[] => {
  const ops = getOperationsDetails(service)
  const arr = ops.assignedMetrologists
  if (Array.isArray(arr) && arr.length > 0) return arr.map((m) => String(m.name)).filter(Boolean)
  const legacy = ops.assignedMetrologistName
  return legacy ? [String(legacy)] : []
}

export const getMetrologistEmails = (service: CalibrationService): string[] => {
  const ops = getOperationsDetails(service)
  const arr = ops.assignedMetrologists
  if (Array.isArray(arr) && arr.length > 0) return arr.map((m) => String(m.email)).filter(Boolean)
  const legacy = ops.assignedMetrologistEmail
  return legacy ? [String(legacy)] : []
}

export const matchesSiteFilter = (service: CalibrationService, siteSearch: string) => {
  if (!siteSearch.trim()) {
    return true
  }

  const haystack = [
    service.customerSite,
    service.executionSiteName,
    service.city,
    service.department
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(siteSearch.trim().toLowerCase())
}

export const hasCustomerChangeRequest = (service: CalibrationService) =>
  service.otherFields?.customerResponseType === 'changes_requested'

export const getOperationsDetails = (service: CalibrationService) => {
  const operations = service.otherFields?.operations

  return operations && typeof operations === 'object' && !Array.isArray(operations)
    ? (operations as Record<string, unknown>)
    : {}
}

export const getNumberValue = (value: unknown) => {
  const parsedValue = typeof value === 'string' ? parseFloat(value) : value

  return typeof parsedValue === 'number' && Number.isFinite(parsedValue)
    ? parsedValue
    : 0
}

export const hasPendingReleasableQuantities = (service: CalibrationService) =>
  (service.items || []).some((item) => {
    if (item.otherFields?.operationalStatus !== 'completed') {
      return false
    }

    const approvedDelta = (service.adjustments || []).reduce((accumulator, adjustment) => {
      if (adjustment.serviceItemId !== item.id) {
        return accumulator
      }

      if (!['approved', 'applied_to_cut'].includes(adjustment.status)) {
        return accumulator
      }

      if (adjustment.changeType === 'extra_item') {
        return accumulator
      }

      return accumulator + getNumberValue(adjustment.differenceQuantity)
    }, 0)
    const effectiveQuantity = Math.max(getNumberValue(item.quantity) + approvedDelta, 0)
    const releasedQuantity = getNumberValue(item.otherFields?.releasedQuantity)

    return Math.max(effectiveQuantity - releasedQuantity, 0) > 0
  })

export const getServiceOperationalFocus = (service: CalibrationService) => {
  const cuts = service.cuts || []
  const allCutsInvoiced =
    cuts.length > 0 && cuts.every((cut) => cut.status === 'invoiced')

  // El estado de facturación sale de los cortes, aunque el servicio siga en ejecución
  if (cuts.some((cut) => cut.status === 'ready_for_invoicing')) {
    // Parcial: ya hay un corte para facturar pero al servicio aún le falta trabajo por cortar
    const isFullyCut =
      service.status === 'technically_completed' &&
      !hasPendingReleasableQuantities(service)

    return isFullyCut
      ? { label: 'Por facturar', color: 'info' as const }
      : { label: 'Por facturar corte', color: 'secondary' as const }
  }

  if (!allCutsInvoiced && cuts.some((cut) => cut.status === 'invoiced')) {
    return { label: 'Facturado corte', color: 'success' as const }
  }

  if (service.status !== 'technically_completed') {
    return allCutsInvoiced
      ? { label: 'Facturado', color: 'success' as const }
      : null
  }

  const allCutsSent =
    cuts.length > 0 &&
    cuts.every((cut) => cut.otherFields?.documentControl?.status === 'sent')

  if (allCutsSent && !hasPendingReleasableQuantities(service)) {
    return { label: 'Listo para cierre final', color: 'success' as const }
  }

  if (hasPendingReleasableQuantities(service)) {
    return { label: 'Pendiente corte', color: 'warning' as const }
  }

  if (allCutsInvoiced) {
    return { label: 'Facturado', color: 'success' as const }
  }

  if (cuts.length > 0) {
    return { label: 'Por facturar', color: 'info' as const }
  }

  return { label: 'Pendiente administrativo', color: 'default' as const }
}

export const getKanbanColumns = (
  isTechnicalOnlyView: boolean
): KanbanColumnDefinition[] => {
  if (isTechnicalOnlyView) {
    return [
      {
        key: 'pre_operational',
        title: 'Preoperativo',
        description: 'Aún no liberados al frente técnico',
        accent: '#64748b',
        priority: 5
      },
      {
        key: 'to_schedule',
        title: 'Por programar',
        description: 'ODS emitidas o pendientes de agenda',
        accent: '#f59e0b',
        priority: 2
      },
      {
        key: 'in_service',
        title: 'En ejecución',
        description: 'Programados o en trabajo activo',
        accent: '#10b981',
        priority: 1
      },
      {
        key: 'pending_close',
        title: 'Pendiente cierre',
        description: 'Finalizados técnicamente y pendientes de salida',
        accent: '#0ea5e9',
        priority: 3
      },
      {
        key: 'closed',
        title: 'Cerrados',
        description: 'Servicios completamente terminados',
        accent: '#059669',
        priority: 6
      }
    ]
  }

  return [
    {
      key: 'adjustments',
      title: 'Por ajustar',
      description: 'Borradores, rechazadas o con cambios pendientes',
      accent: '#64748b',
      priority: 6
    },
    {
      key: 'waiting_customer',
      title: 'Esperando respuesta cliente',
      description: 'Cotizaciones enviadas pendientes de respuesta',
      accent: '#f59e0b',
      priority: 4
    },
    {
      key: 'ready_for_ods',
      title: 'Listo para ODS',
      description: 'Aprobadas y listas para liberar',
      accent: '#10b981',
      priority: 5
    },
    {
      key: 'to_schedule',
      title: 'Pendiente programación',
      description: 'ODS emitidas o pendientes de agenda operativa',
      accent: '#3b82f6',
      priority: 3
    },
    {
      key: 'in_service',
      title: 'En servicio',
      description: 'Programados y en ejecución',
      accent: '#14b8a6',
      priority: 2
    },
    {
      key: 'pending_close',
      title: 'Facturación y cierre',
      description: 'Finalizados técnicamente: por facturar, facturados o listos para cierre',
      accent: '#3b82f6',
      priority: 1
    },
    {
      key: 'closed',
      title: 'Cerradas',
      description: 'Servicios completados',
      accent: '#059669',
      priority: 7
    }
  ]
}

export const getKanbanColumnKey = (
  service: CalibrationService,
  isTechnicalOnlyView: boolean
) => {
  if (isTechnicalOnlyView) {
    if (
      ['draft', 'pending_approval', 'rejected', 'approved'].includes(service.status)
    ) {
      return 'pre_operational'
    }

    if (['ods_issued', 'pending_programming'].includes(service.status)) {
      return 'to_schedule'
    }

    if (['scheduled', 'in_execution'].includes(service.status)) {
      return 'in_service'
    }

    if (service.status === 'technically_completed') {
      return 'pending_close'
    }

    if (service.status === 'closed') {
      return 'closed'
    }

    return 'pre_operational'
  }

  if (
    service.status === 'draft' ||
    service.status === 'rejected' ||
    service.approvalStatus === 'rejected' ||
    hasCustomerChangeRequest(service)
  ) {
    return 'adjustments'
  }

  if (service.status === 'pending_approval') {
    return 'waiting_customer'
  }

  if (
    service.status === 'approved' &&
    service.approvalStatus === 'approved' &&
    !service.odsCode
  ) {
    return 'ready_for_ods'
  }

  if (['ods_issued', 'pending_programming'].includes(service.status)) {
    return 'to_schedule'
  }

  if (['scheduled', 'in_execution'].includes(service.status)) {
    return 'in_service'
  }

  if (service.status === 'technically_completed') {
    return 'pending_close'
  }

  if (service.status === 'closed') {
    return 'closed'
  }

  if (service.status === 'approved') {
    return 'ready_for_ods'
  }

  return 'adjustments'
}
