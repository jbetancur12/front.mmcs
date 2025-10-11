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
  roles: Array<{ id: number; name: string; description: string }>
  contraseña?: string
}

export interface UpdateUserData {
  id: number
  nombre: string
  email: string
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