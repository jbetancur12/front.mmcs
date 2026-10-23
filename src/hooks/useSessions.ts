import { useMutation, useQuery, useQueryClient } from 'react-query'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import useAxiosPrivate from '@utils/use-axios-private'

/** Una sesión abierta del usuario (GET /auth/sessions). */
export interface UserSession {
  id: string
  deviceLabel: string
  ip: string | null
  loggedInAt: string
  lastSeenAt: string
  /** La sesión desde la que se está mirando la lista. */
  current: boolean
}

/** Lo que el login muestra de una sesión ajena (sin id: no se puede actuar sobre ella). */
export type ActiveSessionInfo = Omit<UserSession, 'id' | 'current'>

export const SESSIONS_QUERY_KEY = ['auth-sessions']

/** "Activa ahora" o "Activa hace 5 minutos". */
export const formatSessionActivity = (lastSeenAt: string): string => {
  const date = parseISO(lastSeenAt)
  if (Number.isNaN(date.getTime())) return ''
  if (Date.now() - date.getTime() < 2 * 60 * 1000) return 'Activa ahora'
  return `Activa ${formatDistanceToNow(date, { addSuffix: true, locale: es })}`
}

export const useSessions = (enabled: boolean) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<UserSession[]>(
    SESSIONS_QUERY_KEY,
    async () => {
      const response = await axiosPrivate.get('/auth/sessions')
      return response.data.sessions
    },
    { enabled, refetchOnWindowFocus: false, staleTime: 0 }
  )
}

export const useCloseSession = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation(
    (sessionId: string) => axiosPrivate.delete(`/auth/sessions/${sessionId}`),
    { onSuccess: () => queryClient.invalidateQueries(SESSIONS_QUERY_KEY) }
  )
}

export const useCloseOtherSessions = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation(() => axiosPrivate.delete('/auth/sessions'), {
    onSuccess: () => queryClient.invalidateQueries(SESSIONS_QUERY_KEY)
  })
}
