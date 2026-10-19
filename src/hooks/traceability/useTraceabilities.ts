import { useMutation, useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import toast from 'react-hot-toast'

export interface TraceabilityDocument {
  id: number
  name: string
  filePath: string
  createdAt: string
}

export const TRACEABILITY_QUERY_KEYS = {
  list: ['traceabilities', 'list'] as const
}

interface UploadVariables {
  formData: FormData
  onProgress?: (progress: number) => void
}

const buildUploadConfig = (onProgress?: (progress: number) => void) => ({
  headers: {
    'Content-Type': 'multipart/form-data'
  },
  onUploadProgress: (progressEvent: { loaded: number; total?: number }) => {
    const progress = Math.round(
      (progressEvent.loaded * 100) / (progressEvent.total || 1)
    )
    onProgress?.(progress)
  }
})

/** Listado de documentos de trazabilidad */
export const useTraceabilities = () => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(
    TRACEABILITY_QUERY_KEYS.list,
    async (): Promise<TraceabilityDocument[]> => {
      const response = await axiosPrivate.get(`/traceabilities`, {})
      return response.data
    },
    {
      onError: (error) => {
        console.error('Error al cargar las trazabilidades:', error)
        toast.error('Error al cargar las trazabilidades')
      }
    }
  )
}

/**
 * Mutaciones de trazabilidad. Actualizan la caché con la respuesta del
 * servidor (sin volver a pedir el listado), igual que hacía el estado local.
 */
export const useTraceabilityMutations = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()

  const setList = (
    updater: (current: TraceabilityDocument[]) => TraceabilityDocument[]
  ) => {
    queryClient.setQueryData<TraceabilityDocument[]>(
      TRACEABILITY_QUERY_KEYS.list,
      (current) => updater(current ?? [])
    )
  }

  const createTraceability = useMutation(
    async ({ formData, onProgress }: UploadVariables) => {
      const response = await axiosPrivate.post(
        `/traceabilities`,
        formData,
        buildUploadConfig(onProgress)
      )
      return response.data as TraceabilityDocument
    },
    {
      retry: false,
      onSuccess: (created) => {
        setList((current) => [...current, created])
      }
    }
  )

  const updateTraceability = useMutation(
    async ({ id, formData, onProgress }: UploadVariables & { id: number }) => {
      const response = await axiosPrivate.put(
        `/traceabilities/${id}`,
        formData,
        buildUploadConfig(onProgress)
      )
      return response.data as TraceabilityDocument
    },
    {
      retry: false,
      onSuccess: (updated, { id }) => {
        setList((current) =>
          current.map((traceability) =>
            traceability.id === id ? updated : traceability
          )
        )
      }
    }
  )

  const deleteTraceability = useMutation(
    async (id: number) => {
      const response = await axiosPrivate.delete(`/traceabilities/${id}`, {})
      return response
    },
    {
      retry: false,
      onSuccess: (response, id) => {
        if (response.status >= 200 && response.status < 300) {
          setList((current) =>
            current.filter((traceability) => traceability.id !== id)
          )
        }
      }
    }
  )

  return { createTraceability, updateTraceability, deleteTraceability }
}
