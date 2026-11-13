import { useCallback, useRef, useState } from 'react'
import { useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import { getApiErrorReason } from 'src/utils/apiError'
import { ReleaseUploadResult } from 'src/Components/ReleaseCertificates/ReleaseCertificates.types'
import {
  UPLOAD_CONCURRENCY,
  UploadRow,
  classifyResult,
  runPool
} from 'src/Components/ReleaseCertificates/releaseUploadQueue'
import { RELEASE_QUERY_KEYS } from './useReleaseCertificates'

interface QueueTarget {
  serviceId?: number | null
  cutId?: number | null
}

let rowCounter = 0
const newRow = (file: File): UploadRow => ({
  id: `row-${++rowCounter}`,
  file,
  status: 'queued'
})

/**
 * Carga masiva archivo por archivo (3 a la vez) contra `POST /release-certificates`, el mismo endpoint de siempre.
 * Cada fila tiene su estado; se puede cancelar lo que falta y reintentar lo que falló. El API liga los anexos con su
 * principal sin importar el orden de llegada, por eso subir en paralelo es seguro.
 */
export const useReleaseUploadQueue = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  const [rows, setRows] = useState<UploadRow[]>([])
  const [running, setRunning] = useState(false)
  const cancelRef = useRef(false)
  const targetRef = useRef<QueueTarget>({})

  const patch = (id: string, changes: Partial<UploadRow>) =>
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...changes } : row))
    )

  const uploadOne = useCallback(
    async (file: File): Promise<ReleaseUploadResult> => {
      const { serviceId, cutId } = targetRef.current
      const data = new FormData()
      // El servicio va antes de los archivos: el API lo lee del cuerpo del formulario.
      if (serviceId) data.append('serviceId', String(serviceId))
      if (serviceId && cutId) data.append('cutId', String(cutId))
      data.append('files', file)
      const response = await axiosPrivate.post('/release-certificates', data)
      return response.data.results[0]
    },
    [axiosPrivate]
  )

  const process = useCallback(
    async (ids: string[], source: UploadRow[]) => {
      cancelRef.current = false
      setRunning(true)
      setRows((current) =>
        current.map((row) =>
          ids.includes(row.id)
            ? { ...row, status: 'queued', detail: undefined }
            : row
        )
      )
      const targets = source.filter((row) => ids.includes(row.id))
      const skipped = await runPool(
        targets,
        UPLOAD_CONCURRENCY,
        async (row) => {
          patch(row.id, { status: 'uploading' })
          try {
            patch(row.id, classifyResult(await uploadOne(row.file)))
          } catch (error) {
            patch(row.id, {
              status: 'failed',
              detail: getApiErrorReason(error) ?? 'No se pudo enviar el archivo'
            })
          }
        },
        () => cancelRef.current
      )
      skipped.forEach((row) =>
        patch(row.id, {
          status: 'cancelled',
          detail: 'Cancelado antes de subir'
        })
      )
      setRunning(false)
      queryClient.invalidateQueries(RELEASE_QUERY_KEYS.all)
    },
    [queryClient, uploadOne]
  )

  const start = useCallback(
    (files: File[], target: QueueTarget) => {
      targetRef.current = target
      const created = files.map(newRow)
      setRows(created)
      return process(
        created.map((row) => row.id),
        created
      )
    },
    [process]
  )

  const retryFailed = useCallback(() => {
    const pending = rows.filter(
      (row) => row.status === 'failed' || row.status === 'cancelled'
    )
    return process(
      pending.map((row) => row.id),
      rows
    )
  }, [process, rows])

  const cancel = useCallback(() => {
    cancelRef.current = true
  }, [])

  const reset = useCallback(() => {
    setRows([])
    setRunning(false)
  }, [])

  return { rows, running, start, retryFailed, cancel, reset }
}
