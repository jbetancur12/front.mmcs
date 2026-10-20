import { useMutation, useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import { Module } from 'src/store/userStore'
import { customersKeys } from '../customers/useCustomers'

export const modulesKeys = {
  all: ['modules'] as const,
  list: () => [...modulesKeys.all, 'list'] as const,
  byCustomer: (customerId: number | string | undefined) =>
    customersKeys.modules(String(customerId))
}

interface QueryCallbacks {
  onError?: (error: unknown) => void
}

/** Catálogo de módulos de la plataforma (GET /modules) */
export const useModules = <T = unknown>(options: QueryCallbacks = {}) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<T[]>(
    modulesKeys.list(),
    async () => {
      const response = await axiosPrivate.get('/modules')
      return response.data
    },
    options
  )
}

/** Módulos de un cliente con su estado (GET /customers/:id/modules) */
export const useCustomerModules = <T = unknown>(
  customerId: number | string | undefined,
  options: QueryCallbacks = {}
) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<T[]>(
    modulesKeys.byCustomer(customerId),
    async () => {
      const response = await axiosPrivate.get(
        `/customers/${customerId}/modules`
      )
      return response.data
    },
    { enabled: !!customerId, keepPreviousData: false, ...options }
  )
}

/**
 * Activa/desactiva un módulo de un cliente (PUT /customers/:id/modules).
 * Al terminar actualiza la caché localmente (sin volver a pedir el listado),
 * incluida la fecha y quién hizo el cambio para el tooltip del switch.
 */
export const useToggleCustomerModule = (
  customerId: number | string | undefined
) => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation(
    async ({
      moduleId,
      isActive
    }: {
      moduleId: number
      isActive: boolean
      updaterName?: string
    }) =>
      axiosPrivate.put(`/customers/${customerId}/modules`, {
        moduleId,
        isActive
      }),
    {
      retry: false,
      onSuccess: (_response, { moduleId, isActive, updaterName }) => {
        queryClient.setQueryData<Module[]>(
          modulesKeys.byCustomer(customerId),
          (prevModules = []) =>
            prevModules.map((module) =>
              module.id === moduleId
                ? {
                    ...module,
                    customerModules: {
                      ...module.customerModules,
                      isActive,
                      updatedAt: new Date().toISOString(),
                      updater: updaterName ? { id: 0, nombre: updaterName } : null
                    }
                  }
                : module
            )
        )
      }
    }
  )
}
