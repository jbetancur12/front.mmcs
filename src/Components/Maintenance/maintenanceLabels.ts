import { MaintenancePriority, MaintenanceStatus } from '../../types/maintenance'

/** Nombres en español de los estados de un ticket de mantenimiento (los mismos que usa el API en el historial). */
export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  [MaintenanceStatus.PENDING]: 'Pendiente',
  [MaintenanceStatus.ASSIGNED]: 'Asignado',
  [MaintenanceStatus.IN_PROGRESS]: 'En Progreso',
  [MaintenanceStatus.ON_HOLD]: 'En Pausa',
  [MaintenanceStatus.WAITING_PARTS]: 'Esperando Repuestos',
  [MaintenanceStatus.WAITING_CUSTOMER]: 'Esperando Cliente',
  [MaintenanceStatus.COMPLETED]: 'Completado',
  [MaintenanceStatus.CANCELLED]: 'Cancelado'
}

export const MAINTENANCE_PRIORITY_LABELS: Record<MaintenancePriority, string> =
  {
    [MaintenancePriority.LOW]: 'Baja',
    [MaintenancePriority.MEDIUM]: 'Media',
    [MaintenancePriority.HIGH]: 'Alta',
    [MaintenancePriority.URGENT]: 'Urgente'
  }
