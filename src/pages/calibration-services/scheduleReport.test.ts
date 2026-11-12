import { describe, expect, it } from 'vitest'
import { CalibrationService } from '../../types/calibrationService'
import {
  buildDetailRows,
  buildSummaryRows,
  filterByPeriod
} from './scheduleReport'

const svc = (
  id: number,
  scheduledDate: string | null,
  metrologists: string[] = []
) =>
  ({
    id,
    serviceCode: `S-${id}`,
    status: 'scheduled',
    customer: { nombre: 'Cliente' },
    otherFields: {
      operations: {
        scheduledDate,
        assignedMetrologists: metrologists.map((name, i) => ({
          userId: i,
          name
        }))
      }
    }
  }) as unknown as CalibrationService

describe('scheduleReport', () => {
  const all = [
    svc(1, '2026-11-20T00:00:00Z', ['Ana']),
    svc(2, '2026-11-05'),
    svc(3, '2026-12-01', ['Ana']),
    svc(4, null)
  ]

  it('filtra por periodo inclusivo y ordena por fecha', () => {
    const rows = filterByPeriod(all, '2026-11-01', '2026-11-30')
    expect(rows.map((s) => s.id)).toEqual([2, 1])
  })

  it('arma detalle y resumen', () => {
    const rows = filterByPeriod(all, '2026-11-01', '2026-12-31')
    expect(buildDetailRows(rows)[0]['Metrólogos']).toBe(
      'Sin metrólogo asignado'
    )
    const summary = buildSummaryRows(rows, '2026-11-01', '2026-12-31')
    expect(summary).toContainEqual(['Total de servicios', 3])
    expect(summary).toContainEqual(['Sin metrólogo asignado', 1])
  })
})
