import { useQuery } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'

export const LMS_USER_OPTIONS_QUERY_KEY = ['lms-user-options'] as const

/**
 * Opciones para formularios de LMS (roles, clientes y valores por defecto).
 * Lo comparten la gestión de usuarios y la de cursos; cada pantalla tipa solo
 * los campos que usa.
 */
export const useLmsUserOptions = <T = unknown>() => {
  const axiosPrivate = useAxiosPrivate()

  return useQuery<T>(LMS_USER_OPTIONS_QUERY_KEY, async () => {
    const response = await axiosPrivate.get('/lms/users/options')
    return response.data.data
  })
}

export default useLmsUserOptions
