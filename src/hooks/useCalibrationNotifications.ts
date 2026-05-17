import { useQuery, useMutation, useQueryClient } from 'react-query'
import { axiosPrivate } from '@utils/api'

export interface CalibrationNotification {
  id: number
  type: 'ods_issued' | 'adjustment_reported' | 'adjustment_technical_reviewed' | 'cut_ready_for_invoicing' | 'cut_invoiced'
  title: string
  message: string | null
  data: Record<string, unknown> | null
  priority: 'low' | 'normal' | 'high' | 'urgent'
  actionUrl: string | null
  readAt: string | null
  createdAt: string
}

interface NotificationsResponse {
  notifications: CalibrationNotification[]
  totalItems: number
  unreadCount: number
  page: number
  limit: number
}

interface UnreadCountResponse {
  unreadCount: number
}

const QUERY_KEY = 'calibration-notifications'

const fetchNotifications = async ({
  page = 0,
  limit = 20,
  showRead = false
}: {
  page?: number
  limit?: number
  showRead?: boolean
}): Promise<NotificationsResponse> => {
  const { data } = await axiosPrivate.get<NotificationsResponse>(
    '/calibration-services/notifications/my',
    { params: { page, limit, showRead } }
  )
  return data
}

const fetchUnreadCount = async (): Promise<UnreadCountResponse> => {
  const { data } = await axiosPrivate.get<UnreadCountResponse>(
    '/calibration-services/notifications/unread-count'
  )
  return data
}

const markAsRead = async (notificationId: number): Promise<void> => {
  await axiosPrivate.put(`/calibration-services/notifications/${notificationId}/read`)
}

const markAllAsRead = async (): Promise<void> => {
  await axiosPrivate.put('/calibration-services/notifications/read-all')
}

export const useCalibrationNotifications = ({
  page = 0,
  limit = 20,
  showRead = false
}: {
  page?: number
  limit?: number
  showRead?: boolean
} = {}) => {
  return useQuery({
    queryKey: [QUERY_KEY, 'list', page, limit, showRead],
    queryFn: () => fetchNotifications({ page, limit, showRead }),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000
  })
}

export const useCalibrationUnreadCount = () => {
  return useQuery({
    queryKey: [QUERY_KEY, 'unread-count'],
    queryFn: fetchUnreadCount,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000
  })
}

export const useCalibrationNotificationMutations = () => {
  const queryClient = useQueryClient()

  const markAsReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEY])
    }
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEY])
    }
  })

  return {
    markAsRead: markAsReadMutation,
    markAllAsRead: markAllAsReadMutation
  }
}
