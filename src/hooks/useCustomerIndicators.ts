import { useMutation, useQuery, useQueryClient } from 'react-query'
import { axiosPrivate } from '@utils/api'
import {
  ContractedServicesResponse,
  CreateTypeAliasPayload,
  CustomerIndicators,
  SaveGoalPayload,
  SaveGoalResponse,
  SaveObservationsPayload,
  SaveObservationsResponse,
  TypeAliasEntry
} from 'src/types/customerIndicators'

export const customerIndicatorsKey = 'customerIndicators'
export const contractedServicesKey = 'customerContractedServices'
export const typeAliasesKey = 'calibrationIndicatorTypeAliases'

export const useCustomerIndicators = (
  customerId: number | string | undefined,
  year: number | undefined,
  headquarter?: string | null
) =>
  useQuery<CustomerIndicators>(
    [customerIndicatorsKey, customerId, year, headquarter ?? 'all'],
    async () => {
      const { data } = await axiosPrivate.get(
        `/customers/${customerId}/calibration-indicators`,
        { params: { year, headquarter: headquarter || undefined } }
      )
      return data
    },
    // Los números cambian al subir un certificado o emitir una ODS: siempre se piden al abrir la pestaña.
    { enabled: !!customerId && !!year, keepPreviousData: true, staleTime: 0 }
  )

/** Solo personal interno: el backend responde 403 a usuarios de empresa. */
export const useContractedServices = (
  customerId: number | string | undefined,
  year: number | undefined,
  enabled: boolean
) =>
  useQuery<ContractedServicesResponse>(
    [contractedServicesKey, customerId, year],
    async () => {
      const { data } = await axiosPrivate.get(
        `/customers/${customerId}/calibration-indicators/contracted-services`,
        { params: { year } }
      )
      return data
    },
    { enabled: enabled && !!customerId && !!year, staleTime: 0 }
  )

export const useSaveIndicatorObservations = () => {
  const queryClient = useQueryClient()
  return useMutation<
    SaveObservationsResponse,
    unknown,
    SaveObservationsPayload
  >(
    async ({ customerId, year, text }) => {
      const { data } = await axiosPrivate.put(
        `/customers/${customerId}/calibration-indicators/observations`,
        { year, text }
      )
      return data
    },
    {
      onSuccess: () => queryClient.invalidateQueries(customerIndicatorsKey)
    }
  )
}

export const useSaveIndicatorGoal = () => {
  const queryClient = useQueryClient()
  return useMutation<SaveGoalResponse, unknown, SaveGoalPayload>(
    async ({ customerId, ...body }) => {
      const { data } = await axiosPrivate.put(
        `/customers/${customerId}/calibration-indicators/goal`,
        body
      )
      return data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(customerIndicatorsKey)
        queryClient.invalidateQueries(contractedServicesKey)
      }
    }
  )
}

export const useCreateTypeAlias = () => {
  const queryClient = useQueryClient()
  return useMutation<unknown, unknown, CreateTypeAliasPayload>(
    async (payload) => {
      const { data } = await axiosPrivate.post(
        '/calibration-indicators/type-aliases',
        payload
      )
      return data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(customerIndicatorsKey)
        queryClient.invalidateQueries(contractedServicesKey)
        queryClient.invalidateQueries(typeAliasesKey)
      }
    }
  )
}

/** Asociaciones y exclusiones guardadas (solo personal interno que gestiona la meta). */
export const useTypeAliases = (enabled: boolean) =>
  useQuery<TypeAliasEntry[]>(
    typeAliasesKey,
    async () => {
      const { data } = await axiosPrivate.get(
        '/calibration-indicators/type-aliases'
      )
      return data.aliases
    },
    { enabled, refetchOnWindowFocus: false }
  )

/** Deshace una asociación o exclusión: el nombre vuelve a la lista por revisar. */
export const useDeleteTypeAlias = () => {
  const queryClient = useQueryClient()
  return useMutation<unknown, unknown, number>(
    async (id) => {
      const { data } = await axiosPrivate.delete(
        `/calibration-indicators/type-aliases/${id}`
      )
      return data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(customerIndicatorsKey)
        queryClient.invalidateQueries(contractedServicesKey)
        queryClient.invalidateQueries(typeAliasesKey)
      }
    }
  )
}
