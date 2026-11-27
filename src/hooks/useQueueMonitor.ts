import { useQuery } from 'react-query'
import { axiosPrivate } from 'src/utils/api'

export interface FailedJob {
  id: string
  type: string
  attempts: number
  createdAt: string | null
  failedAt: string | null
  reason: string
  reference: Record<string, string | number>
}

export interface QueueStatus {
  key: string
  name: string
  counts: {
    waiting: number
    active: number
    delayed: number
    completed: number
    failed: number
  }
  failed: FailedJob[]
}

/** Estado de las colas de correos y reportes (solo lectura, panel de desarrollador). */
export const useQueueMonitor = () =>
  useQuery(
    ['queue-monitor'],
    async () => {
      const { data } = await axiosPrivate.get<{ data: QueueStatus[] }>(
        '/queue-monitor'
      )
      return data.data
    },
    { staleTime: 0, refetchInterval: 30 * 1000 }
  )
