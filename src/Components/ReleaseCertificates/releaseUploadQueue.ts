import { ReleaseUploadResult } from './ReleaseCertificates.types'

export const MAX_UPLOAD_FILES = 50
export const MAX_UPLOAD_SIZE_MB = 20
/** Cuántos PDF viajan a la vez: más lento que uno solo, sin saturar la lectura de PDF del API. */
export const UPLOAD_CONCURRENCY = 3

export const UNREADABLE_MESSAGE =
  'No se pudo leer; sube una copia que abra bien'

export type UploadRowStatus =
  | 'queued'
  | 'uploading'
  | 'done'
  | 'warning'
  | 'failed'
  | 'cancelled'

export interface UploadRow {
  id: string
  file: File
  status: UploadRowStatus
  /** Texto bajo el nombre: número leído, rarezas o motivo del fallo. */
  detail?: string
  certificateId?: number
}

/** Un PDF que el API no pudo leer: se registró, pero sin datos. */
export const isUnreadable = (result: ReleaseUploadResult) =>
  result.certificate?.readStatus === 'fallida' ||
  result.certificate?.anomalies.some((a) => a.code === 'PDF_ILEGIBLE') === true

/** Estado y texto de una fila a partir de la respuesta del API para ese archivo. */
export const classifyResult = (
  result: ReleaseUploadResult
): Pick<UploadRow, 'status' | 'detail' | 'certificateId'> => {
  if (!result.ok || !result.certificate) {
    return { status: 'failed', detail: result.error ?? 'No se pudo registrar' }
  }
  const certificate = result.certificate
  const certificateId = certificate.id
  if (isUnreadable(result)) {
    return { status: 'warning', detail: UNREADABLE_MESSAGE, certificateId }
  }
  const anomalies = certificate.anomalies
  if (anomalies.length > 0) {
    const first = anomalies[0].message
    return {
      status: 'warning',
      detail: [
        certificate.documentNumber,
        anomalies.length === 1 ? first : `${anomalies.length} rarezas: ${first}`
      ]
        .filter(Boolean)
        .join(' · '),
      certificateId
    }
  }
  return {
    status: 'done',
    detail: certificate.documentNumber ?? undefined,
    certificateId
  }
}

export interface UploadSummary {
  total: number
  /** Registrados sin rarezas. */
  good: number
  /** Registrados con rarezas o ilegibles. */
  warnings: number
  /** Rechazados por el API o con error de red. */
  rejected: number
  /** Sin enviar porque se canceló. */
  cancelled: number
  /** Ya con respuesta (o cancelados): sirve para el avance. */
  finished: number
}

export const summarize = (rows: UploadRow[]): UploadSummary => {
  const count = (status: UploadRowStatus) =>
    rows.filter((row) => row.status === status).length
  const summary = {
    total: rows.length,
    good: count('done'),
    warnings: count('warning'),
    rejected: count('failed'),
    cancelled: count('cancelled')
  }
  return {
    ...summary,
    finished:
      summary.good + summary.warnings + summary.rejected + summary.cancelled
  }
}

/** Huella SHA-256 del contenido: dos archivos con otro nombre pero el mismo PDF dan la misma. */
export const hashFile = async (file: File): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Ejecuta `worker` sobre cada elemento con a lo sumo `concurrency` a la vez, tomándolos en orden.
 * `shouldStop` se consulta antes de tomar cada uno: lo que no arrancó se devuelve en `skipped`.
 */
export const runPool = async <T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
  shouldStop: () => boolean = () => false
): Promise<T[]> => {
  const skipped: T[] = []
  let next = 0
  const lane = async () => {
    while (next < items.length) {
      const item = items[next++]
      if (shouldStop()) skipped.push(item)
      else await worker(item)
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, lane)
  )
  return skipped
}
