import { QueryKey, useQuery, UseQueryOptions } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'

/**
 * Query keys del dashboard de certificados por vencer.
 */
export const certificatesDueKeys = {
  all: ['certificates-due'] as const,
  grouped: () => [...certificatesDueKeys.all, 'grouped'] as const,
  byCustomer: (customerId: number | null) =>
    [...certificatesDueKeys.all, 'customer', customerId] as const
}

type QueryOpts<T> = Omit<UseQueryOptions<T[], unknown, T[], QueryKey>, 'queryKey' | 'queryFn'>

/**
 * Clientes con certificados próximos a vencer (agrupados por cliente).
 * GET /files/next-to-expire-grouped — compartido por DashboardMmcs y sus vistas.
 */
export const useCertificatesNextToExpireGrouped = <T = unknown>(
  options: QueryOpts<T> = {}
) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<T[], unknown, T[], QueryKey>(
    certificatesDueKeys.grouped(),
    async () => {
      const response = await axiosPrivate.get(`/files/next-to-expire-grouped`, {})
      return response.data || []
    },
    options
  )
}

/**
 * Certificados próximos a vencer de un cliente.
 * GET /files/next-to-expire?customerId=
 */
export const useCertificatesNextToExpire = <T = unknown>(
  customerId: number | null,
  options: QueryOpts<T> = {}
) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<T[], unknown, T[], QueryKey>(
    certificatesDueKeys.byCustomer(customerId),
    async () => {
      const response = await axiosPrivate.get(`/files/next-to-expire`, {
        params: {
          customerId: customerId
        }
      })
      return response.data || []
    },
    { keepPreviousData: false, ...options }
  )
}
