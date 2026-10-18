import { useMutation, useQuery, useQueryClient } from 'react-query'
import { axiosPrivate } from '@utils/api'
import {
  BulkCustomerModulesInput,
  BulkCustomerModulesResult,
  CustomerModulesMatrix
} from 'src/types/customerModules'

export const customerModulesKeys = {
  matrix: ['customerModules', 'matrix'] as const
}

/** Todos los clientes × módulos licenciables. Pantalla de administración: se refresca al volver. */
export const useCustomerModulesMatrix = (enabled = true) =>
  useQuery<CustomerModulesMatrix>(
    customerModulesKeys.matrix,
    async () =>
      (await axiosPrivate.get<CustomerModulesMatrix>('/customers/modules-matrix')).data,
    { enabled, staleTime: 0, refetchOnWindowFocus: true }
  )

/**
 * Activa o desactiva un módulo para uno o varios clientes. Pinta el cambio de inmediato
 * y lo revierte si el servidor lo rechaza.
 */
export const useSetCustomersModule = () => {
  const queryClient = useQueryClient()
  return useMutation<
    BulkCustomerModulesResult,
    unknown,
    BulkCustomerModulesInput,
    { previous?: CustomerModulesMatrix }
  >(
    async (input) =>
      (await axiosPrivate.put<BulkCustomerModulesResult>('/customers/modules/bulk', input)).data,
    {
      onMutate: async ({ customerIds, moduleId, isActive }) => {
        await queryClient.cancelQueries(customerModulesKeys.matrix)
        const previous = queryClient.getQueryData<CustomerModulesMatrix>(customerModulesKeys.matrix)
        if (previous) {
          const ids = new Set(customerIds)
          queryClient.setQueryData<CustomerModulesMatrix>(customerModulesKeys.matrix, {
            ...previous,
            customers: previous.customers.map((c) =>
              ids.has(c.id)
                ? {
                    ...c,
                    modules: {
                      ...c.modules,
                      [moduleId]: {
                        updatedAt: new Date().toISOString(),
                        updatedBy: c.modules[moduleId]?.updatedBy ?? null,
                        isActive
                      }
                    }
                  }
                : c
            )
          })
        }
        return { previous }
      },
      onError: (_error, _input, context) => {
        if (context?.previous) {
          queryClient.setQueryData(customerModulesKeys.matrix, context.previous)
        }
      },
      // Trae el quién/cuándo real que guardó el servidor
      onSettled: () => queryClient.invalidateQueries(customerModulesKeys.matrix)
    }
  )
}
