import React, { useCallback } from 'react'
import { useQuery } from 'react-query'

import useAxiosPrivate from '@utils/use-axios-private'

import { customerProfileKeys } from './constants'
import {
  Certificate,
  CertificatesApiResponse,
  CustomerLmsCoursesResponse,
  CustomerProfileData,
  CustomerStats,
  DownloadFilter,
  StatusFilter
} from './types'

/** Datos del cliente (`GET /customers/:id`). */
export const useCustomerData = (
  id: string | undefined,
  onLoaded?: (data: CustomerProfileData) => void
) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<CustomerProfileData>(
    customerProfileKeys.customer(id),
    async () => {
      if (!id) throw new Error('No customer ID provided')
      const response = await axiosPrivate.get(`/customers/${id}`)
      return response.data
    },
    {
      enabled: !!id,
      onSuccess: onLoaded
    }
  )
}

/** Certificados del cliente paginados (`GET /files/customer/:id`). */
export const useCustomerCertificates = (
  id: string | undefined,
  searchTerm: string,
  currentPage: number,
  statusFilter: StatusFilter | null
) => {
  const axiosPrivate = useAxiosPrivate()
  const query = useQuery<CertificatesApiResponse>(
    customerProfileKeys.certificates(id, searchTerm, currentPage, statusFilter),
    async () => {
      if (!id) throw new Error('No customer ID provided')
      const response = await axiosPrivate.get(`/files/customer/${id}`, {
        params: {
          search: searchTerm,
          page: currentPage,
          ...(statusFilter && { status: statusFilter })
        }
      })
      return response.data
    },
    { enabled: !!id }
  )

  const apiResponse = query.data

  // Calculate statistics
  const stats = React.useMemo<CustomerStats>(() => {
    if (!apiResponse?.files)
      return { total: 0, expired: 0, upcoming: 0, active: 0 }

    return {
      total: apiResponse.statistics.total || 0,
      expired: apiResponse.statistics?.expired || 0,
      upcoming: apiResponse.statistics?.expiringSoon || 0,
      active: apiResponse.statistics?.active || 0
    }
  }, [apiResponse])

  return { ...query, apiResponse, stats }
}

/** Datos de la pestaña Resumen: los 5 que vencen primero y los equipos por sede. */
export const useCustomerOverview = (id: string | undefined) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<CertificatesApiResponse>(
    customerProfileKeys.overview(id),
    async () => {
      if (!id) throw new Error('No customer ID provided')
      const response = await axiosPrivate.get(`/files/customer/${id}`, {
        params: {
          filter: 'nextOrExpired',
          sort: 'nextCalibrationDate',
          limit: 5,
          withHeadquarters: true
        }
      })
      return response.data
    },
    { enabled: !!id }
  )
}

/** Cursos LMS visibles/asignables del cliente. */
export const useCustomerLmsCourses = (
  id: string | undefined,
  enabled: boolean
) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<CustomerLmsCoursesResponse>(
    customerProfileKeys.lmsCourses(id),
    async () => {
      if (!id) throw new Error('No customer ID provided')
      const response = await axiosPrivate.get(`/customers/${id}/lms-courses`)
      return response.data
    },
    {
      enabled: Boolean(id && enabled)
    }
  )
}

/**
 * Todos los certificados para exportar a Excel. Es una descarga puntual
 * disparada por el usuario, así que no se cachea como query.
 */
export const useFetchAllCertificates = (id: string | undefined) => {
  const axiosPrivate = useAxiosPrivate()
  return useCallback(
    async (filterType: DownloadFilter): Promise<Certificate[]> => {
      if (!id) throw new Error('No customer ID provided')
      const params: Record<string, unknown> = { all: true }
      if (filterType === 'nextOrExpired') params.filter = 'nextOrExpired'
      const response = await axiosPrivate.get(`/files/customer/${id}`, {
        params
      })
      return response.data.files || []
    },
    [axiosPrivate, id]
  )
}
