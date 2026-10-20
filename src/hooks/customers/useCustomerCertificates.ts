import { useQuery } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'

/**
 * Certificados de un cliente (GET /files/customer/:id).
 * La key empieza por ['certificates-data', id] para que las invalidaciones
 * existentes (EquipmentCard, ModernCustomerProfile) sigan aplicando.
 */
export interface CustomerCertificatesParams {
  search: string
  headquarter: string | null
  page: number
}

export const customerCertificatesKeys = {
  all: ['certificates-data'] as const,
  byCustomer: (id: string | number | undefined) =>
    [...customerCertificatesKeys.all, id] as const,
  byHeadquarter: (
    id: string | number | undefined,
    params: CustomerCertificatesParams
  ) => [...customerCertificatesKeys.byCustomer(id), 'headquarter', params] as const
}

export const useCustomerCertificatesByHeadquarter = <T = unknown>(
  id: string | number | undefined,
  params: CustomerCertificatesParams
) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<T>(
    customerCertificatesKeys.byHeadquarter(id, params),
    async () => {
      if (!id) throw new Error('No customer ID provided')
      const response = await axiosPrivate.get(`/files/customer/${id}`, {
        params
      })
      return response.data
    },
    {
      enabled: !!id
    }
  )
}
