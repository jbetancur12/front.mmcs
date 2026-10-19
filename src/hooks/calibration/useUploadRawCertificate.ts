import { useMutation, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'

/**
 * Sube un certificado (PDF + datos del Excel) a `/files/raw`.
 * Devuelve la respuesta completa de axios: el llamador revisa `status` y
 * maneja el 409 (duplicado) para reintentar con `replace`/`update`.
 */
export const useUploadRawCertificate = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation(
    async (data: FormData) =>
      axiosPrivate.post(`/files/raw`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }),
    {
      // Sin reintentos automáticos: el 409 lo resuelve el usuario
      retry: false,
      onSuccess: () => {
        queryClient.invalidateQueries(['calibration', 'customerSchedule'])
      }
    }
  )
}
