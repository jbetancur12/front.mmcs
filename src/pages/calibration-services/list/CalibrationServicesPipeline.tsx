import StagePipeline from 'src/Components/Common/StagePipeline'
import { FILTER_ALL } from './calibrationServicesListConstants'
import { CalibrationServicesListFilters } from './useCalibrationServicesListFilters'
import { CalibrationServiceStatus } from '../../../types/calibrationService'

// Ciclo del servicio en el orden en que ocurre, con etiquetas cortas
const COMMERCIAL_STAGES: { key: CalibrationServiceStatus; label: string }[] = [
  { key: 'draft', label: 'Borrador' },
  { key: 'pending_approval', label: 'Cotización enviada' },
  { key: 'approved', label: 'Aprobada' },
  // ODS emitida = esperando programación (los de laboratorio se programan solos): en la bandeja es la cola "Por programar".
  // El estado pending_programming no se usa en el flujo real, por eso ya no tiene paso propio.
  { key: 'ods_issued', label: 'Por programar' },
  { key: 'scheduled', label: 'Programada' },
  { key: 'in_execution', label: 'En ejecución' },
  { key: 'technically_completed', label: 'Finalizada' },
  { key: 'closed', label: 'Cerrada' }
]

// La vista técnica arranca en la ODS
const TECHNICAL_STAGES = COMMERCIAL_STAGES.slice(3)

interface CalibrationServicesPipelineProps {
  statusCounts?: Partial<Record<string, number>>
  filters: CalibrationServicesListFilters
  isTechnicalOnlyView: boolean
}

/**
 * Embudo de etapas de la bandeja: cuántos servicios hay en cada estado (con
 * los demás filtros aplicados, según el servidor) y cada etapa filtra la lista.
 */
const CalibrationServicesPipeline = ({
  statusCounts = {},
  filters,
  isTechnicalOnlyView
}: CalibrationServicesPipelineProps) => {
  const stages = isTechnicalOnlyView ? TECHNICAL_STAGES : COMMERCIAL_STAGES
  const outside = isTechnicalOnlyView
    ? [{ key: 'cancelled', label: 'Cancelada' }]
    : [
        { key: 'rejected', label: 'Rechazada' },
        { key: 'cancelled', label: 'Cancelada' }
      ]
  const count = (key: string) => statusCounts[key] ?? 0
  const total = Object.values(statusCounts).reduce<number>(
    (sum, value) => sum + (value ?? 0),
    0
  )
  const selected =
    filters.statusFilter === FILTER_ALL ? '' : String(filters.statusFilter)

  return (
    <StagePipeline
      ariaLabel='Filtrar servicios por etapa'
      total={total}
      selected={selected}
      onSelect={(key) =>
        filters.setStatusFilter(
          (key || FILTER_ALL) as CalibrationServiceStatus | typeof FILTER_ALL
        )
      }
      stages={stages.map((stage) => ({ ...stage, count: count(stage.key) }))}
      outside={outside.map((stage) => ({ ...stage, count: count(stage.key) }))}
    />
  )
}

export default CalibrationServicesPipeline
