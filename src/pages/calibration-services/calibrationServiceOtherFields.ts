import type {
  CalibrationService,
  CalibrationServiceItem,
  CalibrationServiceOperationsSummary
} from '../../types/calibrationService'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

/**
 * `otherFields` llega como JSON libre desde el API; las operaciones sí tienen
 * una forma conocida, así que se leen una sola vez y se tipan aquí.
 */
export const getOperationsSummary = (
  service: Pick<CalibrationService, 'otherFields'>
): CalibrationServiceOperationsSummary => {
  const operations = service.otherFields?.operations
  return isRecord(operations)
    ? (operations as CalibrationServiceOperationsSummary)
    : {}
}

/** Estado operativo del ítem, guardado en su `otherFields`. */
export const getItemOperationalStatus = (
  item: Pick<CalibrationServiceItem, 'otherFields'>
): string | undefined => {
  const status = item.otherFields?.operationalStatus
  return typeof status === 'string' ? status : undefined
}

/** Bandera booleana guardada en `otherFields` del servicio. */
export const getServiceFlag = (
  service: Pick<CalibrationService, 'otherFields'>,
  key: string
): boolean => service.otherFields?.[key] === true
