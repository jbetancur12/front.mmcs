import { useQuery, UseQueryOptions } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import { purchaseKeys } from './queryKeys'

/** Estadísticas generales del módulo de compras (GET /purchase-statistics). */
export const usePurchaseStatistics = <TStatistics>(
  options?: Omit<
    UseQueryOptions<TStatistics, unknown, TStatistics>,
    'queryKey' | 'queryFn'
  >
) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<TStatistics, unknown>(
    purchaseKeys.statistics,
    async () => {
      const response = await axiosPrivate.get<TStatistics>(
        '/purchase-statistics'
      )
      return response.data
    },
    options
  )
}
