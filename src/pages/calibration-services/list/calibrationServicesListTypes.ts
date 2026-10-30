import { CalibrationService } from '../../../types/calibrationService'

export type CalibrationServicesViewMode = 'list' | 'table' | 'kanban'

export type KanbanColumnDefinition = {
  key: string
  title: string
  description: string
  accent: string
  priority: number
}

export interface StoredFilters {
  search?: string
  statusFilter?: string
  approvalFilter?: string
  scopeFilter?: string
  slaFilter?: string
  siteFilter?: string
  metrologistFilter?: string
  hasAdjustmentsFilter?: string
  showOnlyMyLoad?: boolean
  areFiltersOpen?: boolean
}

/** Columna del tablero (o grupo de la lista) con sus servicios. */
export type CalibrationServicesColumn = KanbanColumnDefinition & {
  services: CalibrationService[]
}

/** Columna del kanban con los contadores usados para priorizarla. */
export type CalibrationServicesKanbanColumn = CalibrationServicesColumn & {
  urgentCount: number
  myLoadCount: number
  /** Total en el servidor para la columna; null si no se puede saber (estados mezclados o filtros locales). */
  serverTotal: number | null
}

export interface CalibrationServicesMetrologistOption {
  id: string
  label: string
}
