import { CalibrationService } from '../../types/calibrationService'
import { CALIBRATION_SERVICE_STATUS_LABELS } from '../../constants/calibrationServices'
import { getOperationsSummary } from './calibrationServiceOtherFields'

/** Estados que pueden tener fecha de programación y entran al reporte. */
export const SCHEDULE_REPORT_STATUSES = [
  'scheduled',
  'in_execution',
  'technically_completed',
  'closed',
  'cancelled'
] as const

export const getServiceMetrologists = (service: CalibrationService) => {
  const ops = getOperationsSummary(service)
  const list = ops.assignedMetrologists
  if (Array.isArray(list) && list.length > 0) {
    return list.map((m) => m.name).filter(Boolean)
  }
  return ops.assignedMetrologistName ? [ops.assignedMetrologistName] : []
}

const dayOf = (value?: string | null) => (value ? value.slice(0, 10) : '')

/** Servicios cuya fecha programada cae entre from y to (yyyy-MM-dd, inclusive). */
export const filterByPeriod = (
  services: CalibrationService[],
  from: string,
  to: string
) =>
  services
    .filter((s) => {
      const day = dayOf(getOperationsSummary(s).scheduledDate)
      return day !== '' && day >= from && day <= to
    })
    .sort((a, b) =>
      dayOf(getOperationsSummary(a).scheduledDate).localeCompare(
        dayOf(getOperationsSummary(b).scheduledDate)
      )
    )

const statusLabel = (s: CalibrationService) =>
  CALIBRATION_SERVICE_STATUS_LABELS[s.status] || s.status

export const buildDetailRows = (services: CalibrationService[]) =>
  services.map((s) => {
    const ops = getOperationsSummary(s)
    const metrologists = getServiceMetrologists(s)
    return {
      'Fecha programada': dayOf(ops.scheduledDate),
      'ODS / Servicio': s.odsCode || s.serviceCode,
      Cliente: s.customer?.nombre || s.executionCustomerName || 'Sin cliente',
      Sede: s.executionSiteName || s.customerSite || '',
      Ciudad: s.city || '',
      Estado: statusLabel(s),
      Metrólogos: metrologists.join(', ') || 'Sin metrólogo asignado',
      'Fecha de compromiso': dayOf(ops.commitmentDate),
      'Fecha de inicio': dayOf(ops.startedAt),
      'Notas de programación': ops.programmingNotes || ''
    }
  })

const countBy = (items: string[]) => {
  const map = new Map<string, number>()
  items.forEach((i) => map.set(i, (map.get(i) || 0) + 1))
  return [...map.entries()].sort((a, b) => b[1] - a[1])
}

export const buildSummaryRows = (
  services: CalibrationService[],
  from: string,
  to: string
): (string | number)[][] => {
  const rows: (string | number)[][] = [
    ['Reporte de programación de servicios de calibración'],
    ['Periodo', `${from} a ${to}`],
    ['Total de servicios', services.length],
    [
      'Sin metrólogo asignado',
      services.filter((s) => getServiceMetrologists(s).length === 0).length
    ],
    [],
    ['Por estado', 'Servicios'],
    ...countBy(services.map(statusLabel)),
    [],
    ['Por metrólogo', 'Servicios'],
    ...countBy(
      services.flatMap((s) => {
        const names = getServiceMetrologists(s)
        return names.length ? names : ['Sin metrólogo asignado']
      })
    ),
    [],
    ['Por cliente', 'Servicios'],
    ...countBy(
      services.map(
        (s) => s.customer?.nombre || s.executionCustomerName || 'Sin cliente'
      )
    )
  ]
  return rows
}

export const downloadScheduleReport = async (
  services: CalibrationService[],
  from: string,
  to: string
) => {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()
  const summary = XLSX.utils.aoa_to_sheet(buildSummaryRows(services, from, to))
  summary['!cols'] = [{ wch: 40 }, { wch: 28 }]
  XLSX.utils.book_append_sheet(wb, summary, 'Resumen')
  const detail = XLSX.utils.json_to_sheet(buildDetailRows(services))
  detail['!cols'] = [18, 18, 36, 28, 16, 24, 36, 18, 18, 40].map((wch) => ({
    wch
  }))
  XLSX.utils.book_append_sheet(wb, detail, 'Servicios')
  XLSX.writeFile(wb, `programacion-servicios_${from}_a_${to}.xlsx`)
}
