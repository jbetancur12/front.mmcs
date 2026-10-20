import { useMutation, useQuery, useQueryClient, UseQueryOptions } from 'react-query'
import type { AxiosResponse } from 'axios'
import useAxiosPrivate from '@utils/use-axios-private'
import { ROLES } from 'src/constants/roles'

/**
 * Query keys de clientes. Los params del listado van en la key para que
 * añadir paginación/filtros en servidor sea solo pasar más params.
 */
export type CustomersListParams = Record<string, unknown>

export const customersKeys = {
  all: ['customers'] as const,
  lists: () => [...customersKeys.all, 'list'] as const,
  list: (params?: CustomersListParams) =>
    [...customersKeys.all, 'list', params ?? {}] as const,
  detail: (id: number | string) =>
    [...customersKeys.all, 'detail', String(id)] as const,
  users: (id: number | string) =>
    [...customersKeys.detail(id), 'users'] as const,
  modules: (id: number | string) =>
    [...customersKeys.detail(id), 'modules'] as const
}

interface CustomerWithRol {
  rol?: string
}

type ListOptions<T> = Omit<
  UseQueryOptions<T[], unknown, T[], ReturnType<typeof customersKeys.list>>,
  'queryKey' | 'queryFn'
>

/**
 * Listado de clientes (GET /customers) sin los registros con rol Admin.
 */
export const useCustomers = <T extends CustomerWithRol = CustomerWithRol>(
  params?: CustomersListParams,
  options: ListOptions<T> = {}
) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(
    customersKeys.list(params),
    async () => {
      const response = await axiosPrivate.get(
        `/customers`,
        params ? { params } : {}
      )
      return (response.data as T[]).filter(
        (customer) => customer.rol !== ROLES.ADMIN
      )
    },
    options
  )
}

/** POST /customers */
export const useCreateCustomer = <T extends object = Record<string, unknown>>() => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation<AxiosResponse, unknown, T>(
    (values) => axiosPrivate.post(`/customers`, values, {}),
    {
      retry: false,
      onSuccess: () => {
        queryClient.invalidateQueries(customersKeys.lists())
      }
    }
  )
}

/** PUT /customers/:id */
export const useUpdateCustomer = <T extends object = Record<string, unknown>>() => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation<AxiosResponse, unknown, { id: number | string; values: T }>(
    ({ id, values }) => axiosPrivate.put(`/customers/${id}`, values, {}),
    {
      retry: false,
      onSuccess: () => {
        queryClient.invalidateQueries(customersKeys.lists())
      }
    }
  )
}

/** DELETE /customers/:id */
export const useDeleteCustomer = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation<AxiosResponse, unknown, number | string>(
    (id) => axiosPrivate.delete(`/customers/${id}`, {}),
    {
      retry: false,
      onSuccess: () => {
        queryClient.invalidateQueries(customersKeys.lists())
      }
    }
  )
}
