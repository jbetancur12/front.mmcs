import { useQuery, useMutation, useQueryClient } from 'react-query'
import { axiosPrivate, axiosPublic } from '../utils/api'
import {
  MaintenanceTicket,
  MaintenanceCreateRequest,
  MaintenanceUpdateRequest,
  MaintenanceResponse,
  MaintenanceFilters,
  MaintenanceStats,
  MaintenanceTechnician,
  MaintenanceComment,
  MaintenanceFile,
  MaintenanceTrackingResponse
} from '../types/maintenance'

// API functions
const maintenanceAPI = {
  // Public endpoints (no auth required)
  createTicket: async (
    data: MaintenanceCreateRequest
  ): Promise<MaintenanceTicket> => {
    const formData = new FormData()

    // Add text fields
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'files' && value !== undefined) {
        formData.append(key, String(value))
      }
    })

    // Add files
    if (data.files) {
      data.files.forEach((file) => {
        formData.append('files', file)
      })
    }

    const response = await axiosPublic.post<MaintenanceTicket>(
      `/public/maintenance/tickets`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
    return response.data
  },

  trackTicket: async (
    ticketNumber: string
  ): Promise<MaintenanceTrackingResponse> => {
    const response = await axiosPublic.get<MaintenanceTrackingResponse>(
      `/maintenance/tickets/track/${ticketNumber}`
    )
    return response.data
  },

  // Private endpoints (auth required)
  getTickets: async (
    filters?: MaintenanceFilters,
    page = 1,
    limit = 10
  ): Promise<MaintenanceResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    })

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, String(v)))
          } else if (typeof value === 'object' && value.from && value.to) {
            params.append('dateFrom', value.from)
            params.append('dateTo', value.to)
          } else {
            params.append(key, String(value))
          }
        }
      })
    }

    const response = await axiosPrivate.get<MaintenanceResponse>(
      `/maintenance/tickets?${params.toString()}`
    )
    return response.data
  },

  getTicketById: async (id: string): Promise<MaintenanceTicket> => {
    const response = await axiosPrivate.get<MaintenanceTicket>(
      `/maintenance/tickets/${id}`
    )
    return response.data
  },

  updateTicket: async (
    id: string,
    data: MaintenanceUpdateRequest
  ): Promise<MaintenanceTicket> => {
    const response = await axiosPrivate.put<MaintenanceTicket>(
      `/maintenance/tickets/${id}`,
      data
    )
    return response.data
  },

  deleteTicket: async (id: string): Promise<void> => {
    await axiosPrivate.delete(`/maintenance/tickets/${id}`)
  },

  getStats: async (): Promise<MaintenanceStats> => {
    const response =
      await axiosPrivate.get<MaintenanceStats>(`/maintenance/stats`)
    return response.data
  },

  // Comments
  addComment: async (
    ticketId: string,
    comment: string,
    isInternal: boolean
  ): Promise<MaintenanceComment> => {
    const response = await axiosPrivate.post<MaintenanceComment>(
      `/maintenance/tickets/${ticketId}/comments`,
      { comment, isInternal }
    )
    return response.data
  },

  // Files
  uploadFiles: async (
    ticketId: string,
    files: File[]
  ): Promise<MaintenanceFile[]> => {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })

    const response = await axiosPrivate.post<MaintenanceFile[]>(
      `/maintenance/tickets/${ticketId}/files`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
    return response.data
  },

  deleteFile: async (ticketId: string, fileId: string): Promise<void> => {
    await axiosPrivate.delete(
      `/maintenance/tickets/${ticketId}/files/${fileId}`
    )
  },

  // Technicians
  getTechnicians: async (): Promise<MaintenanceTechnician[]> => {
    const response = await axiosPrivate.get<{
      technicians: MaintenanceTechnician[]
      pagination: any
    }>(`/maintenance/technicians`)
    return response.data.technicians
  },

  createTechnician: async (
    data: Partial<MaintenanceTechnician>
  ): Promise<MaintenanceTechnician> => {
    const response = await axiosPrivate.post<MaintenanceTechnician>(
      `/maintenance/technicians`,
      data
    )
    return response.data
  },

  updateTechnician: async (
    id: string,
    data: Partial<MaintenanceTechnician>
  ): Promise<MaintenanceTechnician> => {
    const response = await axiosPrivate.put<MaintenanceTechnician>(
      `/maintenance/technicians/${id}`,
      data
    )
    return response.data
  },

  deleteTechnician: async (id: string): Promise<void> => {
    await axiosPrivate.delete(`/maintenance/technicians/${id}`)
  }
}

// Custom hooks
export const useMaintenanceTickets = (
  filters?: MaintenanceFilters,
  page = 1,
  limit = 10
) => {
  return useQuery({
    queryKey: ['maintenance-tickets', filters, page, limit],
    queryFn: () => maintenanceAPI.getTickets(filters, page, limit),
    staleTime: 30000 // 30 seconds
  })
}

export const useMaintenanceTicket = (id: string) => {
  return useQuery({
    queryKey: ['maintenance-ticket', id],
    queryFn: () => maintenanceAPI.getTicketById(id),
    enabled: !!id
  })
}

export const useMaintenanceStats = () => {
  return useQuery({
    queryKey: ['maintenance-stats'],
    queryFn: maintenanceAPI.getStats,
    staleTime: 60000 // 1 minute
  })
}

export const useMaintenanceTechnicians = () => {
  return useQuery({
    queryKey: ['maintenance-technicians'],
    queryFn: maintenanceAPI.getTechnicians,
    staleTime: 300000 // 5 minutes
  })
}

// Public tracking hook (no auth required)
export const useTrackMaintenanceTicket = (ticketNumber: string) => {
  return useQuery({
    queryKey: ['track-maintenance-ticket', ticketNumber],
    queryFn: () => maintenanceAPI.trackTicket(ticketNumber),
    enabled: !!ticketNumber,
    retry: false
  })
}

// Mutation hooks
export const useCreateMaintenanceTicket = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: maintenanceAPI.createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-tickets'] })
      queryClient.invalidateQueries({ queryKey: ['maintenance-stats'] })
    }
  })
}

export const useUpdateMaintenanceTicket = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data
    }: {
      id: string
      data: MaintenanceUpdateRequest
    }) => maintenanceAPI.updateTicket(id, data),
    onSuccess: (updatedTicket) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-tickets'] })
      queryClient.invalidateQueries({
        queryKey: ['maintenance-ticket', updatedTicket.id]
      })
      queryClient.invalidateQueries({ queryKey: ['maintenance-stats'] })
    }
  })
}

export const useDeleteMaintenanceTicket = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: maintenanceAPI.deleteTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-tickets'] })
      queryClient.invalidateQueries({ queryKey: ['maintenance-stats'] })
    }
  })
}

export const useAddMaintenanceComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      ticketId,
      comment,
      isInternal
    }: {
      ticketId: string
      comment: string
      isInternal: boolean
    }) => maintenanceAPI.addComment(ticketId, comment, isInternal),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({
        queryKey: ['maintenance-ticket', ticketId]
      })
    }
  })
}

export const useUploadMaintenanceFiles = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ticketId, files }: { ticketId: string; files: File[] }) =>
      maintenanceAPI.uploadFiles(ticketId, files),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({
        queryKey: ['maintenance-ticket', ticketId]
      })
    }
  })
}

export const useDeleteMaintenanceFile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ticketId, fileId }: { ticketId: string; fileId: string }) =>
      maintenanceAPI.deleteFile(ticketId, fileId),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({
        queryKey: ['maintenance-ticket', ticketId]
      })
    }
  })
}

// Technician mutations
export const useCreateMaintenanceTechnician = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: maintenanceAPI.createTechnician,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-technicians'] })
    }
  })
}

export const useUpdateMaintenanceTechnician = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data
    }: {
      id: string
      data: Partial<MaintenanceTechnician>
    }) => maintenanceAPI.updateTechnician(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-technicians'] })
    }
  })
}

export const useDeleteMaintenanceTechnician = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: maintenanceAPI.deleteTechnician,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-technicians'] })
    }
  })
}
