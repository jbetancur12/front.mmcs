import { useQuery } from 'react-query'
import { axiosPublic } from '../utils/api'
import {
  MaintenanceTicket,
  MaintenanceResponse,
  MaintenanceStats
} from '../types/maintenance'

// Interface for TV display data - matches actual API response
interface TVDisplayData {
  lastUpdated: string
  updateFrequency: number
  metrics: {
    totalActive: number
    pending: number
    inProgress: number
    completedToday: number
    urgent: number
    overdue: number
    techniciansAvailable: string
    averageWorkload: number
    avgResolutionTimeHours: number
    completedLast30Days: number
  }
  tickets: {
    urgent: MaintenanceTicket[]
    high: MaintenanceTicket[]
    medium: MaintenanceTicket[]
    low: MaintenanceTicket[]
  }
  technicians: Array<{
    id: string
    name: string
    isAvailable: boolean
    workload: number
    maxWorkload: number
  }>
  systemStatus: {
    operationalStatus: string
    lastSystemUpdate: string
    queueHealth: string
    averageResponseTime: string
    overdueStatus: string
    technicianUtilization: number
  }
}

// Public API functions for TV display (no auth required)
const maintenancePublicAPI = {
  // Get TV display data - single endpoint with all data
  getTVDisplayData: async (): Promise<TVDisplayData> => {
    const response = await axiosPublic.get<TVDisplayData>(
      `/public/maintenance/tv-display`
    )
    return response.data
  }
}

// Public hooks for TV display
export const useTVDisplayData = () => {
  return useQuery({
    queryKey: ['tv-display-data'],
    queryFn: maintenancePublicAPI.getTVDisplayData,
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: 1000
  })
}
