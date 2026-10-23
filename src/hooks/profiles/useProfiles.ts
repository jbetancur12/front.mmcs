import { useMutation, useQuery, useQueryClient } from 'react-query'
import type { AxiosResponse } from 'axios'
import useAxiosPrivate from '@utils/use-axios-private'

export const profilesKeys = {
  all: ['profiles'] as const,
  list: () => [...profilesKeys.all, 'list'] as const,
  detail: (id: number | string | undefined) =>
    [...profilesKeys.all, 'detail', String(id)] as const
}

interface QueryCallbacks<T> {
  onError?: (error: unknown) => void
  onSuccess?: (data: T) => void
}

/** Perfiles de metrólogos (GET /profiles) */
export const useProfiles = <T = Record<string, unknown>>(
  options: QueryCallbacks<T[]> = {}
) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<T[]>(
    profilesKeys.list(),
    async () => {
      const response = await axiosPrivate.get(`/profiles`, {})
      return response.data && response.data.length > 0 ? response.data : []
    },
    options
  )
}

/** Detalle de un perfil (GET /profiles/:id) */
export const useProfile = <T = Record<string, unknown>>(
  id: number | string | undefined,
  options: QueryCallbacks<T> & { refetchOnWindowFocus?: boolean } = {}
) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<T>(
    profilesKeys.detail(id),
    async () => {
      const response = await axiosPrivate.get(`/profiles/${id}`, {})
      return response.data
    },
    { keepPreviousData: false, ...options }
  )
}

/** DELETE /profiles/:id */
export const useDeleteProfile = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation<AxiosResponse, unknown, number | string>(
    (id) => axiosPrivate.delete(`/profiles/${id}`, {}),
    {
      retry: false,
      onSuccess: () => {
        queryClient.invalidateQueries(profilesKeys.list())
      }
    }
  )
}

/** PUT /profiles/:id — actualiza la caché del detalle con los valores enviados */
export const useUpdateProfile = <T extends object>(
  id: number | string | undefined
) => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation<AxiosResponse, unknown, T>(
    (values) => axiosPrivate.put(`/profiles/${id}`, values, {}),
    {
      retry: false,
      onSuccess: (_response, values) => {
        queryClient.setQueryData<T | undefined>(
          profilesKeys.detail(id),
          (prev) => (prev ? { ...prev, ...values } : prev)
        )
        queryClient.invalidateQueries(profilesKeys.list())
      }
    }
  )
}

/** POST /profiles/:id/{avatar|cv} (multipart) */
export const useUploadProfileFile = (
  id: number | string | undefined,
  kind: 'avatar' | 'cv'
) => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation<AxiosResponse, unknown, FormData>(
    (formData) =>
      axiosPrivate.post(`/profiles/${id}/${kind}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }),
    {
      retry: false,
      onSuccess: (response) => {
        const updated = response.data?.profile
        if (updated) {
          const field = kind === 'avatar' ? 'avatarUrl' : 'cvUrl'
          queryClient.setQueryData<Record<string, unknown> | undefined>(
            profilesKeys.detail(id),
            (prev) => (prev ? { ...prev, [field]: updated[field] } : prev)
          )
        }
        if (kind === 'avatar') {
          queryClient.invalidateQueries(profilesKeys.list())
        }
      }
    }
  )
}

/** POST /profiles (multipart: datos, foto y CV) y refresca el listado */
export const useCreateProfile = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation<
    AxiosResponse,
    unknown,
    { formData: FormData; onProgress?: (progress: number) => void }
  >(
    ({ formData, onProgress }) =>
      axiosPrivate.post('/profiles', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          onProgress?.(
            Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            )
          )
        }
      }),
    {
      retry: false,
      onSuccess: () => {
        queryClient.invalidateQueries(profilesKeys.list())
      }
    }
  )
}
