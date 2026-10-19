import { useMutation, useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import {
  NonConformWorkReport,
  NonConformWorkReportAlert
} from 'src/Components/NonConformWorkReport/NonConformWorkReport.types'

export const NON_CONFORM_QUERY_KEYS = {
  all: ['nonConformWorkReports'] as const,
  list: ['nonConformWorkReports', 'list'] as const,
  alerts: ['nonConformWorkReports', 'alerts'] as const
}

/** Listado de reportes de trabajo no conforme */
export const useNonConformWorkReports = () => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(
    NON_CONFORM_QUERY_KEYS.list,
    async (): Promise<NonConformWorkReport[]> => {
      const res = await axiosPrivate.get('/non-conform-work-report')
      return res.data || []
    },
    {
      // El formulario (fuera de esta caché) crea/edita reportes: refrescar al montar
      staleTime: 0,
      onError: () => {
        alert('Error al obtener los reportes')
      }
    }
  )
}

/** Reportes con alertas activas (si falla, la lista queda vacía) */
export const useNonConformWorkReportAlerts = () => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(
    NON_CONFORM_QUERY_KEYS.alerts,
    async (): Promise<NonConformWorkReportAlert[]> => {
      const res = await axiosPrivate.get('/non-conform-work-report/alerts')
      return res.data || []
    },
    { staleTime: 0 }
  )
}

/** Elimina un reporte y lo quita del listado en caché */
export const useDeleteNonConformWorkReport = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation(
    async (id: number) => {
      await axiosPrivate.delete(`/non-conform-work-report/${id}`)
    },
    {
      retry: false,
      onSuccess: (_data, id) => {
        queryClient.setQueryData<NonConformWorkReport[]>(
          NON_CONFORM_QUERY_KEYS.list,
          (current) => (current ?? []).filter((r) => r.id !== id)
        )
      }
    }
  )
}
