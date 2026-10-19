import { useMutation, useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'

export interface NotificationEmail {
  id: number
  email: string
  [key: string]: unknown
}

export const iotNotificationEmailsKey = (customerId?: number | string) =>
  ['iot', 'notificationEmails', customerId] as const

interface Options {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}

/** Correos que reciben las notificaciones de alarmas IoT de un cliente */
export const useIotNotificationEmails = (
  customerId?: number | string,
  { onSuccess, onError }: Options = {}
) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(
    iotNotificationEmailsKey(customerId),
    async (): Promise<NotificationEmail[]> => {
      const response = await axiosPrivate.get(
        '/customers/emails-notifications/' + customerId
      )
      return response.data || []
    },
    { keepPreviousData: false, onSuccess, onError }
  )
}

/** Alta y baja de correos de notificación (actualizan la caché con la respuesta) */
export const useIotNotificationEmailMutations = (
  customerId?: number | string
) => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  const key = iotNotificationEmailsKey(customerId)

  const addEmail = useMutation(
    async (email: string): Promise<NotificationEmail> => {
      const response = await axiosPrivate.post(
        '/customers/emails-notifications/' + customerId,
        { email }
      )
      return response.data
    },
    {
      retry: false,
      onSuccess: (created) => {
        queryClient.setQueryData<NotificationEmail[]>(key, (current) => [
          ...(current ?? []),
          created
        ])
      }
    }
  )

  const removeEmail = useMutation(
    async (emailId: number) => {
      await axiosPrivate.delete('/customers/emails-notifications/' + emailId)
    },
    {
      retry: false,
      onSuccess: (_data, emailId) => {
        queryClient.setQueryData<NotificationEmail[]>(key, (current) =>
          (current ?? []).filter((emailItem) => emailItem.id !== emailId)
        )
      }
    }
  )

  return { addEmail, removeEmail }
}
