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
  MaintenanceTrackingResponse,
  MaintenanceTimelineResponse,
  BackendTimelineEntry,
  MaintenanceTimelineEntry,
  MaintenanceAction
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
    try {
      const response = await axiosPublic.get<any>(
        `public/maintenance/tickets/${ticketNumber}`
      )

      // Map backend timeline format to frontend format
      const mappedTimeline =
        response.data.timeline?.map((entry: any) => ({
          id: entry.id,
          ticketId: response.data.id,
          action: mapBackendTypeToAction(entry.type),
          description: entry.description || entry.title,
          performedBy: entry.author || 'Sistema',
          performedAt: entry.timestamp || entry.createdAt,
          metadata: {
            title: entry.title,
            icon: entry.icon,
            authorType: entry.authorType
          }
        })) || []

      const ticket: MaintenanceTicket = {
        ...response.data,
        timeline: mappedTimeline
      }

      return {
        ticket,
        found: true,
        message: 'Ticket encontrado'
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          ticket: null,
          found: false,
          message: 'Ticket no encontrado'
        }
      }
      throw error
    }
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
    // Map frontend field names to backend field names
    const requestData = {
      ...data,
      // Map assignedTechnician to assignedTechnicianId for backend compatibility
      assignedTechnicianId: data.assignedTechnician
        ? parseInt(data.assignedTechnician)
        : null
    }

    // Remove the frontend field name to avoid conflicts
    delete requestData.assignedTechnician

    const response = await axiosPrivate.put<MaintenanceTicket>(
      `/maintenance/tickets/${id}`,
      requestData
    )
    return response.data
  },

  deleteTicket: async (id: string): Promise<void> => {
    await axiosPrivate.delete(`/maintenance/tickets/${id}`)
  },

  getStats: async (
    technicianEmail?: string | null
  ): Promise<MaintenanceStats> => {
    const params = technicianEmail ? { technicianEmail } : {}
    const response = await axiosPrivate.get<MaintenanceStats>(
      `/maintenance/stats`,
      { params }
    )
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
      { content: comment, isInternal }
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
    await axiosPrivate.delete(`/maintenance/files/${fileId}`)
  },

  // Technicians
  getTechnicians: async (): Promise<MaintenanceTechnician[]> => {
    const response = await axiosPrivate.get<{
      technicians: MaintenanceTechnician[]
      pagination: any
    }>(`/maintenance/technicians`)
    return response.data.technicians
  },

  getTechnicianByEmail: async (
    email: string
  ): Promise<MaintenanceTechnician | null> => {
    try {
      const response = await axiosPrivate.get<{
        technician: MaintenanceTechnician
      }>(`/maintenance/technicians/by-email/${encodeURIComponent(email)}`)
      return response.data.technician
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
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
  },

  // Timeline
  getTimeline: async (
    ticketId: string
  ): Promise<MaintenanceTimelineResponse> => {
    const response = await axiosPrivate.get<MaintenanceTimelineResponse>(
      `/maintenance/tickets/${ticketId}/timeline`
    )
    return response.data
  },

  // PDF Generation
  generateServiceOrder: async (ticketId: string): Promise<Blob> => {
    const response = await axiosPrivate.get(
      `/maintenance/tickets/${ticketId}/pdf/service-order`,
      { responseType: 'blob' }
    )
    return response.data
  },

  generateStatusReport: async (ticketId: string): Promise<Blob> => {
    const response = await axiosPrivate.get(
      `/maintenance/tickets/${ticketId}/pdf/status-report`,
      { responseType: 'blob' }
    )
    return response.data
  },

  generateServiceCertificate: async (ticketId: string): Promise<Blob> => {
    const response = await axiosPrivate.get(
      `/maintenance/tickets/${ticketId}/pdf/certificate`,
      { responseType: 'blob' }
    )
    return response.data
  },

  generateServiceInvoice: async (ticketId: string): Promise<Blob> => {
    const response = await axiosPrivate.get(
      `/maintenance/tickets/${ticketId}/pdf/invoice`,
      { responseType: 'blob' }
    )
    return response.data
  },

  getPDFOptions: async (ticketId: string): Promise<any> => {
    const response = await axiosPrivate.get(
      `/maintenance/tickets/${ticketId}/pdf/options`
    )
    return response.data
  }
}

// Helper function to map backend type to frontend action
const mapBackendTypeToAction = (backendType: string): MaintenanceAction => {
  switch (backendType) {
    case 'ticket_created':
      return MaintenanceAction.CREATED
    case 'status_update':
    case 'status_changed':
      return MaintenanceAction.STATUS_CHANGED
    case 'assigned':
    case 'technician_assigned':
      return MaintenanceAction.ASSIGNED
    case 'priority_changed':
      return MaintenanceAction.PRIORITY_CHANGED
    case 'comment_added':
      return MaintenanceAction.COMMENT_ADDED
    case 'file_uploaded':
    case 'file_upload':
      return MaintenanceAction.FILE_UPLOADED
    case 'scheduled':
    case 'work_scheduled':
      return MaintenanceAction.SCHEDULED
    case 'completed':
    case 'work_completed':
      return MaintenanceAction.COMPLETED
    case 'cancelled':
    case 'ticket_cancelled':
      return MaintenanceAction.CANCELLED
    case 'cost_updated':
      return MaintenanceAction.COST_UPDATED
    // Map additional backend event types to existing actions
    case 'work_started':
      return MaintenanceAction.STATUS_CHANGED
    case 'customer_contacted':
      return MaintenanceAction.COMMENT_ADDED
    case 'parts_ordered':
      return MaintenanceAction.STATUS_CHANGED
    case 'timeline_updated':
      return MaintenanceAction.STATUS_CHANGED
    default:
      return MaintenanceAction.STATUS_CHANGED
  }
}

// Helper function to map backend timeline to frontend format
const mapBackendTimelineToFrontend = (
  backendTimeline: BackendTimelineEntry[]
): MaintenanceTimelineEntry[] => {
  return backendTimeline.map((entry) => {
    // Map backend type to frontend action
    let action: MaintenanceAction
    switch (entry.type) {
      case 'ticket_created':
        action = MaintenanceAction.CREATED
        break
      case 'status_update':
      case 'status_changed':
        action = MaintenanceAction.STATUS_CHANGED
        break
      case 'assigned':
      case 'technician_assigned':
        action = MaintenanceAction.ASSIGNED
        break
      case 'priority_changed':
        action = MaintenanceAction.PRIORITY_CHANGED
        break
      case 'comment_added':
        action = MaintenanceAction.COMMENT_ADDED
        break
      case 'file_uploaded':
      case 'file_upload':
        action = MaintenanceAction.FILE_UPLOADED
        break
      case 'scheduled':
      case 'work_scheduled':
        action = MaintenanceAction.SCHEDULED
        break
      case 'completed':
      case 'work_completed':
        action = MaintenanceAction.COMPLETED
        break
      case 'cancelled':
      case 'ticket_cancelled':
        action = MaintenanceAction.CANCELLED
        break
      case 'cost_updated':
        action = MaintenanceAction.COST_UPDATED
        break
      // Map additional backend event types to existing actions
      case 'work_started':
        action = MaintenanceAction.STATUS_CHANGED
        break
      case 'customer_contacted':
        action = MaintenanceAction.COMMENT_ADDED
        break
      case 'parts_ordered':
        action = MaintenanceAction.STATUS_CHANGED
        break
      case 'timeline_updated':
        action = MaintenanceAction.STATUS_CHANGED
        break
      default:
        action = MaintenanceAction.STATUS_CHANGED
        break
    }

    return {
      id: entry.id,
      ticketId: '', // Will be set from the response
      action,
      description: entry.description,
      performedBy: entry.author,
      performedAt: entry.timestamp,
      metadata: {
        title: entry.title,
        icon: entry.icon,
        authorType: entry.authorType
      }
    }
  })
}

// Custom hooks
export const useMaintenanceTickets = (
  filters?: MaintenanceFilters,
  page = 1,
  limit = 10
) => {
  console.log(
    'Fetching maintenance tickets with filters:',
    filters,
    'page:',
    page,
    'limit:',
    limit
  )
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

export const useMaintenanceStats = (technicianEmail?: string | null) => {
  return useQuery({
    queryKey: ['maintenance-stats', technicianEmail],
    queryFn: () => maintenanceAPI.getStats(technicianEmail),
    staleTime: 60000 // 1 minute
  })
}

export const useMaintenanceTechnicians = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['maintenance-technicians'],
    queryFn: maintenanceAPI.getTechnicians,
    enabled: enabled,
    staleTime: 300000 // 5 minutes
  })
}

export const useTechnicianByEmail = (email: string) => {
  return useQuery({
    queryKey: ['technician-by-email', email],
    queryFn: () => maintenanceAPI.getTechnicianByEmail(email),
    enabled: !!email,
    staleTime: 300000 // 5 minutes
  })
}

export const useMaintenanceTimeline = (ticketId: string) => {
  return useQuery({
    queryKey: ['maintenance-timeline', ticketId],
    queryFn: async () => {
      const response = await maintenanceAPI.getTimeline(ticketId)
      const mappedTimeline = mapBackendTimelineToFrontend(response.timeline)
      // Set the ticketId for each entry
      const timelineWithTicketId = mappedTimeline.map((entry) => ({
        ...entry,
        ticketId: response.ticketId
      }))
      return timelineWithTicketId
    },
    enabled: !!ticketId,
    staleTime: 30000 // 30 seconds
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

// PDF generation hooks
export const useGenerateServiceOrder = () => {
  return useMutation({
    mutationFn: maintenanceAPI.generateServiceOrder,
    onSuccess: (pdfBlob, ticketId) => {
      // Download the PDF
      const url = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `orden-servicio-${ticketId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }
  })
}

export const useGenerateStatusReport = () => {
  return useMutation({
    mutationFn: maintenanceAPI.generateStatusReport,
    onSuccess: (pdfBlob, ticketId) => {
      // Download the PDF
      const url = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `reporte-estado-${ticketId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }
  })
}

export const useGenerateServiceCertificate = () => {
  return useMutation({
    mutationFn: maintenanceAPI.generateServiceCertificate,
    onSuccess: (pdfBlob, ticketId) => {
      // Download the PDF
      const url = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `certificado-servicio-${ticketId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }
  })
}

export const useGenerateServiceInvoice = () => {
  return useMutation({
    mutationFn: maintenanceAPI.generateServiceInvoice,
    onSuccess: (pdfBlob, ticketId) => {
      // Download the PDF
      const url = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `factura-servicio-${ticketId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }
  })
}

export const useGetPDFOptions = (ticketId: string) => {
  return useQuery({
    queryKey: ['pdf-options', ticketId],
    queryFn: () => maintenanceAPI.getPDFOptions(ticketId),
    enabled: !!ticketId,
    staleTime: 300000 // 5 minutes
  })
}
