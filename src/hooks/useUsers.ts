import { useQuery, useMutation, useQueryClient } from 'react-query'
import { axiosPrivate } from '@utils/api'
import { UserData } from '../Components/TableOwnUsers'
import { AxiosError } from 'axios'

// Query Keys
export const QUERY_KEYS = {
  USERS: 'users',
  ROLES: 'roles'
} as const

// Types for mutations
export interface CreateUserData {
  nombre: string
  email: string
  phone?: string | null
  roles: Array<{ id: number; name: string; description: string }>
  contraseña?: string
}

export interface UpdateUserData {
  id: number
  nombre: string
  email: string
  phone?: string | null
  roles: Array<{ id: number; name: string; description: string }>
}

// API functions
const fetchUsers = async (): Promise<UserData[]> => {
  const { data } = await axiosPrivate.get('/users/own-users')
  return data
}

const createUser = async (userData: CreateUserData): Promise<UserData> => {
  const { data } = await axiosPrivate.post('/auth/register', {
    ...userData,
    contraseña: userData.contraseña || 'Metromedics@2025'
  })
  return data
}

const updateUser = async (userData: UpdateUserData): Promise<UserData> => {
  const { id, ...updateData } = userData
  const { data } = await axiosPrivate.put(`/users/own/${id}`, updateData)
  return data
}

const fetchRoles = async () => {
  const { data } = await axiosPrivate.get('/roles')
  return data
}

const deleteUser = async (userId: number): Promise<void> => {
  await axiosPrivate.delete(`/users/${userId}`)
}

// Enhanced error handling function
const handleQueryError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    // Don't retry on client errors (4xx) except for timeout
    if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
      // Retry on timeout (408) or rate limiting (429)
      return error.response.status === 408 || error.response.status === 429
    }
    // Retry on network errors and server errors (5xx)
    return error.code === 'NETWORK_ERROR' || !error.response || (error.response.status >= 500)
  }
  // Retry on unknown errors
  return true
}

// Enhanced retry delay function with exponential backoff
const getRetryDelay = (attemptIndex: number): number => {
  // Exponential backoff: 1s, 2s, 4s
  return Math.min(1000 * Math.pow(2, attemptIndex), 10000)
}

// Custom hook for fetching users
export const useUsers = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.USERS],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Max 3 retries
      if (failureCount >= 3) return false
      return handleQueryError(error)
    },
    retryDelay: getRetryDelay,
    // Enable background refetching
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

// Roles disponibles (`GET /roles`)
export const useRoles = () => useQuery(QUERY_KEYS.ROLES, fetchRoles)

// Custom hook for user mutations
export const useUserMutations = () => {
  const queryClient = useQueryClient()

  const createUserMutation = useMutation(createUser, {
    onSuccess: (newUser) => {
      // Optimistic update: Add the new user to the cache immediately
      queryClient.setQueryData([QUERY_KEYS.USERS], (oldData: UserData[] | undefined) => {
        if (!oldData) return [newUser]
        return [...oldData, newUser]
      })

      // Also invalidate to ensure fresh data from server
      queryClient.invalidateQueries([QUERY_KEYS.USERS])
    },
    onError: (error) => {
      console.error('Error creating user:', error)
      // Error handling will be done in the component
    },
    retry: (failureCount, error) => {
      // Max 3 retries for mutations
      if (failureCount >= 3) return false
      return handleQueryError(error)
    },
    retryDelay: getRetryDelay,
  })

  const updateUserMutation = useMutation(updateUser, {
    onMutate: async (updatedUser) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries([QUERY_KEYS.USERS])

      // Snapshot the previous value
      const previousUsers = queryClient.getQueryData<UserData[]>([QUERY_KEYS.USERS])

      // Optimistically update to the new value
      queryClient.setQueryData([QUERY_KEYS.USERS], (oldData: UserData[] | undefined) => {
        if (!oldData) return []
        return oldData.map(user =>
          user.id === updatedUser.id
            ? { ...user, ...updatedUser }
            : user
        )
      })

      // Return a context object with the snapshotted value
      return { previousUsers }
    },
    onError: (error, _updatedUser, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousUsers) {
        queryClient.setQueryData([QUERY_KEYS.USERS], context.previousUsers)
      }
      console.error('Error updating user:', error)
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server state
      queryClient.invalidateQueries([QUERY_KEYS.USERS])
    },
    retry: (failureCount, error) => {
      // Max 3 retries for mutations
      if (failureCount >= 3) return false
      return handleQueryError(error)
    },
    retryDelay: getRetryDelay,
  })

  const deleteUserMutation = useMutation(deleteUser, {
    onMutate: async (userId) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries([QUERY_KEYS.USERS])

      // Snapshot the previous value
      const previousUsers = queryClient.getQueryData<UserData[]>([QUERY_KEYS.USERS])

      // Optimistically remove the user from the cache
      queryClient.setQueryData([QUERY_KEYS.USERS], (oldData: UserData[] | undefined) => {
        if (!oldData) return []
        return oldData.filter(user => user.id !== userId)
      })

      // Return a context object with the snapshotted value
      return { previousUsers }
    },
    onError: (error, _userId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousUsers) {
        queryClient.setQueryData([QUERY_KEYS.USERS], context.previousUsers)
      }
      console.error('Error deleting user:', error)
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server state
      queryClient.invalidateQueries([QUERY_KEYS.USERS])
    },
    retry: (failureCount, error) => {
      // Max 3 retries for mutations
      if (failureCount >= 3) return false
      return handleQueryError(error)
    },
    retryDelay: getRetryDelay,
  })

  return {
    createUser: createUserMutation,
    updateUser: updateUserMutation,
    deleteUser: deleteUserMutation,
  }
}

// ---------------------------------------------------------------------------
// Usuarios (listado general, usuarios de un cliente y mutaciones por id)
// (imports locales a este bloque para no chocar con otros cambios del archivo)
// ---------------------------------------------------------------------------
import type { AxiosResponse } from 'axios'
import useAxiosPrivateHook from '@utils/use-axios-private'
import { ROLES } from 'src/constants/roles'
import { customersKeys } from './customers/useCustomers'
import {
  fetchPaginated,
  type PaginatedResponse,
  type ServerListParams
} from './useServerTable'

export const usersKeys = {
  all: ['users-admin'] as const,
  list: () => [...usersKeys.all, 'list'] as const,
  paginated: (params: ServerListParams) =>
    [...usersKeys.all, 'paginated', params] as const,
  byCustomer: (customerId: number | string | undefined) =>
    customersKeys.users(String(customerId))
}

interface UserWithRol {
  rol?: string
}

const excludeAdmins = <T extends UserWithRol>(users: T[]): T[] =>
  users.filter((user) => user.rol !== ROLES.ADMIN)

/** GET /users (sin usuarios admin) */
export const useAllUsers = <T extends UserWithRol = UserWithRol>(
  options: { onError?: (error: unknown) => void } = {}
) => {
  const axiosPrivate = useAxiosPrivateHook()
  return useQuery<T[]>(
    usersKeys.list(),
    async () => {
      const response = await axiosPrivate.get(`/users`, {})
      return excludeAdmins(response.data as T[])
    },
    options
  )
}

/** Columnas que `GET /users` acepta en `sortBy`. */
export const USER_SORTABLE_FIELDS = ['id', 'nombre', 'email'] as const

/**
 * GET /users?page=&limit=... (búsqueda en nombre, email y teléfono).
 * El backend no filtra por rol: los admin se quitan de la página recibida,
 * igual que en `useAllUsers`, así que una página puede traer menos filas.
 */
export const useUsersPaginated = <T extends UserWithRol = UserWithRol>(
  params: ServerListParams,
  options: { onError?: (error: unknown) => void } = {}
) => {
  const axiosPrivate = useAxiosPrivateHook()
  return useQuery<PaginatedResponse<T>>(
    usersKeys.paginated(params),
    async () => {
      const page = await fetchPaginated<T>(axiosPrivate, '/users', params)
      return { ...page, items: excludeAdmins(page.items) }
    },
    { keepPreviousData: true, ...options }
  )
}

/** GET /customers/:id/users (sin usuarios admin) */
export const useCustomerUsers = <T extends UserWithRol = UserWithRol>(
  customerId: number | string | undefined,
  options: { onError?: (error: unknown) => void } = {}
) => {
  const axiosPrivate = useAxiosPrivateHook()
  return useQuery<T[]>(
    usersKeys.byCustomer(customerId),
    async () => {
      const response = await axiosPrivate.get(
        `/customers/${customerId}/users`,
        {}
      )
      return excludeAdmins(response.data as T[])
    },
    { enabled: !!customerId, keepPreviousData: false, ...options }
  )
}

const invalidateUserLists = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries(usersKeys.all)
  queryClient.invalidateQueries({
    predicate: (query) =>
      query.queryKey[0] === customersKeys.all[0] && query.queryKey[3] === 'users'
  })
}

/** POST /auth/register */
export const useRegisterUser = <T extends object = Record<string, unknown>>() => {
  const axiosPrivate = useAxiosPrivateHook()
  const queryClient = useQueryClient()
  return useMutation<AxiosResponse, unknown, T>(
    (userData) => axiosPrivate.post(`/auth/register`, userData, {}),
    { retry: false, onSuccess: () => invalidateUserLists(queryClient) }
  )
}

/** PUT /users/:id */
export const useUpdateUserById = <T extends object = Record<string, unknown>>() => {
  const axiosPrivate = useAxiosPrivateHook()
  const queryClient = useQueryClient()
  return useMutation<AxiosResponse, unknown, { id: number | string; values: T }>(
    ({ id, values }) => axiosPrivate.put(`/users/${id}`, values, {}),
    { retry: false, onSuccess: () => invalidateUserLists(queryClient) }
  )
}

/** DELETE /users/:id */
export const useDeleteUserById = () => {
  const axiosPrivate = useAxiosPrivateHook()
  const queryClient = useQueryClient()
  return useMutation<AxiosResponse, unknown, number | string>(
    (id) => axiosPrivate.delete(`/users/${id}`, {}),
    { retry: false, onSuccess: () => invalidateUserLists(queryClient) }
  )
}

/** PUT /auth/:id/password */
export const useResetUserPassword = () => {
  const axiosPrivate = useAxiosPrivateHook()
  return useMutation<
    AxiosResponse,
    unknown,
    { userId: number | string; newPassword: string }
  >(
    ({ userId, newPassword }) =>
      axiosPrivate.put(`/auth/${userId}/password`, { newPassword }),
    { retry: false }
  )
}
