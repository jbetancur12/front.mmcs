import { useMutation, useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'

/** Repositorio de documentos/formatos (`/repositories`). */
export const REPOSITORY_QUERY_KEYS = {
  all: ['repositories'] as const,
  list: () => [...REPOSITORY_QUERY_KEYS.all, 'list'] as const
}

export const useRepositories = <T = unknown>() => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(REPOSITORY_QUERY_KEYS.list(), async () => {
    const response = await axiosPrivate.get('/repositories', {})
    return (Array.isArray(response.data) ? response.data : []) as T[]
  })
}

export const useCreateRepository = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation(
    (payload: object) => axiosPrivate.post('/repositories', payload, {}),
    {
      onSuccess: () =>
        queryClient.invalidateQueries(REPOSITORY_QUERY_KEYS.all)
    }
  )
}

export const useDeleteRepository = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation(
    (id: number | string) => axiosPrivate.delete(`/repositories/${id}`, {}),
    {
      onSuccess: () =>
        queryClient.invalidateQueries(REPOSITORY_QUERY_KEYS.all)
    }
  )
}
