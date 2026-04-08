import { useMutation, useQuery, useQueryClient } from 'react-query'
import { axiosPrivate } from '@utils/api'
import {
  CalibrationServiceApprovePayload,
  CalibrationService,
  CalibrationServiceClosePayload,
  CalibrationServiceCreateAdjustmentPayload,
  CalibrationServiceCreateCutPayload,
  CalibrationServiceDocumentActionPayload,
  CalibrationServiceDocument,
  CalibrationServiceDocumentUploadPayload,
  CalibrationServiceFilters,
  CalibrationServiceItemProgressPayload,
  CalibrationServiceMarkCutInvoicedPayload,
  CalibrationServiceIssueOdsPayload,
  CalibrationServiceListResponse,
  CalibrationServiceMarkCutReadyPayload,
  CalibrationServicePayload,
  CalibrationServiceUpdateCutDocumentControlPayload,
  CalibrationServiceReviewAdjustmentPayload,
  CalibrationServiceRequestChangesPayload,
  CalibrationServiceRejectPayload,
  CalibrationServiceRequestApprovalPayload,
  CalibrationServiceSchedulePayload,
  CalibrationServiceSequenceConfig,
  CalibrationServiceSequenceConfigPayload,
  CalibrationServiceStartExecutionPayload
} from '../types/calibrationService'

export const CALIBRATION_SERVICE_QUERY_KEYS = {
  all: 'calibration-services',
  detail: 'calibration-service-detail'
} as const

const calibrationServiceApi = {
  getSequenceConfig: async (): Promise<CalibrationServiceSequenceConfig> => {
    const response = await axiosPrivate.get<CalibrationServiceSequenceConfig>(
      '/calibration-services/config/sequence'
    )
    return response.data
  },

  getServices: async (
    filters?: CalibrationServiceFilters
  ): Promise<CalibrationServiceListResponse> => {
    const response = await axiosPrivate.get<CalibrationServiceListResponse>(
      '/calibration-services',
      {
        params: filters
      }
    )
    return response.data
  },

  getServiceById: async (serviceId: string): Promise<CalibrationService> => {
    const response = await axiosPrivate.get<CalibrationService>(
      `/calibration-services/${serviceId}`
    )
    return response.data
  },

  createService: async (
    payload: CalibrationServicePayload
  ): Promise<CalibrationService> => {
    const response = await axiosPrivate.post<CalibrationService>(
      '/calibration-services',
      payload
    )
    return response.data
  },

  updateService: async ({
    serviceId,
    payload
  }: {
    serviceId: string
    payload: CalibrationServicePayload
  }): Promise<CalibrationService> => {
    const response = await axiosPrivate.put<CalibrationService>(
      `/calibration-services/${serviceId}`,
      payload
    )
    return response.data
  },

  uploadDocument: async ({
    serviceId,
    file,
    documentType,
    title,
    notes,
    cutId,
    generatedBySystem = false
  }: CalibrationServiceDocumentUploadPayload): Promise<CalibrationServiceDocument> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentType', documentType)

    if (title) {
      formData.append('title', title)
    }

    if (notes) {
      formData.append('notes', notes)
    }

    if (cutId !== undefined && cutId !== null) {
      formData.append('cutId', String(cutId))
    }

    formData.append('generatedBySystem', String(generatedBySystem))

    const response = await axiosPrivate.post<CalibrationServiceDocument>(
      `/calibration-services/${serviceId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
    return response.data
  },

  requestApproval: async ({
    serviceId
  }: CalibrationServiceRequestApprovalPayload): Promise<CalibrationService> => {
    const response = await axiosPrivate.post<CalibrationService>(
      `/calibration-services/${serviceId}/request-approval`
    )
    return response.data
  },

  approveService: async ({
    serviceId,
    ...payload
  }: CalibrationServiceApprovePayload): Promise<CalibrationService> => {
    const response = await axiosPrivate.post<CalibrationService>(
      `/calibration-services/${serviceId}/approve`,
      payload
    )
    return response.data
  },

  rejectService: async ({
    serviceId,
    ...payload
  }: CalibrationServiceRejectPayload): Promise<CalibrationService> => {
    const response = await axiosPrivate.post<CalibrationService>(
      `/calibration-services/${serviceId}/reject`,
      payload
    )
    return response.data
  },

  requestChanges: async ({
    serviceId,
    ...payload
  }: CalibrationServiceRequestChangesPayload): Promise<CalibrationService> => {
    const response = await axiosPrivate.post<CalibrationService>(
      `/calibration-services/${serviceId}/request-changes`,
      payload
    )
    return response.data
  },

  issueOds: async ({
    serviceId,
    ...payload
  }: CalibrationServiceIssueOdsPayload): Promise<CalibrationService> => {
    const response = await axiosPrivate.post<CalibrationService>(
      `/calibration-services/${serviceId}/issue-ods`,
      payload
    )
    return response.data
  },

  scheduleService: async ({
    serviceId,
    ...payload
  }: CalibrationServiceSchedulePayload): Promise<CalibrationService> => {
    const response = await axiosPrivate.post<CalibrationService>(
      `/calibration-services/${serviceId}/schedule`,
      payload
    )
    return response.data
  },

  startExecution: async ({
    serviceId,
    ...payload
  }: CalibrationServiceStartExecutionPayload): Promise<CalibrationService> => {
    const response = await axiosPrivate.post<CalibrationService>(
      `/calibration-services/${serviceId}/start-execution`,
      payload
    )
    return response.data
  },

  completeExecution: async ({
    serviceId,
    ...payload
  }: {
    serviceId: string
    technicallyCompletedAt?: string
    completionNotes?: string | null
  }): Promise<CalibrationService> => {
    const response = await axiosPrivate.post<CalibrationService>(
      `/calibration-services/${serviceId}/complete-execution`,
      payload
    )
    return response.data
  },

  closeService: async ({
    serviceId,
    ...payload
  }: CalibrationServiceClosePayload): Promise<CalibrationService> => {
    const response = await axiosPrivate.post<CalibrationService>(
      `/calibration-services/${serviceId}/close`,
      payload
    )
    return response.data
  },

  updateItemProgress: async ({
    serviceId,
    ...payload
  }: CalibrationServiceItemProgressPayload): Promise<CalibrationService> => {
    const response = await axiosPrivate.put<CalibrationService>(
      `/calibration-services/${serviceId}/item-progress`,
      payload
    )
    return response.data
  },

  createCut: async ({
    serviceId,
    ...payload
  }: CalibrationServiceCreateCutPayload): Promise<CalibrationService> => {
    const response = await axiosPrivate.post<CalibrationService>(
      `/calibration-services/${serviceId}/cuts`,
      payload
    )
    return response.data
  },

  createAdjustment: async ({
    serviceId,
    ...payload
  }: CalibrationServiceCreateAdjustmentPayload): Promise<CalibrationService> => {
    const response = await axiosPrivate.post<CalibrationService>(
      `/calibration-services/${serviceId}/adjustments`,
      payload
    )
    return response.data
  },

  reviewAdjustment: async ({
    serviceId,
    adjustmentId,
    ...payload
  }: CalibrationServiceReviewAdjustmentPayload): Promise<CalibrationService> => {
    const response = await axiosPrivate.put<CalibrationService>(
      `/calibration-services/${serviceId}/adjustments/${adjustmentId}/review`,
      payload
    )
    return response.data
  },

  markCutReadyForInvoicing: async ({
    serviceId,
    cutId,
    ...payload
  }: CalibrationServiceMarkCutReadyPayload): Promise<CalibrationService> => {
    const response = await axiosPrivate.post<CalibrationService>(
      `/calibration-services/${serviceId}/cuts/${cutId}/ready-for-invoicing`,
      payload
    )
    return response.data
  },

  markCutInvoiced: async ({
    serviceId,
    cutId,
    ...payload
  }: CalibrationServiceMarkCutInvoicedPayload): Promise<CalibrationService> => {
    const response = await axiosPrivate.post<CalibrationService>(
      `/calibration-services/${serviceId}/cuts/${cutId}/invoiced`,
      payload
    )
    return response.data
  },

  updateCutDocumentControl: async ({
    serviceId,
    cutId,
    ...payload
  }: CalibrationServiceUpdateCutDocumentControlPayload): Promise<CalibrationService> => {
    const response = await axiosPrivate.put<CalibrationService>(
      `/calibration-services/${serviceId}/cuts/${cutId}/document-control`,
      payload
    )
    return response.data
  },

  generateQuotePdf: async ({
    serviceId
  }: CalibrationServiceDocumentActionPayload): Promise<CalibrationServiceDocument> => {
    const response = await axiosPrivate.post<CalibrationServiceDocument>(
      `/calibration-services/${serviceId}/generate-quote-pdf`
    )
    return response.data
  },

  generateOdsPdf: async ({
    serviceId
  }: CalibrationServiceDocumentActionPayload): Promise<CalibrationServiceDocument> => {
    const response = await axiosPrivate.post<CalibrationServiceDocument>(
      `/calibration-services/${serviceId}/generate-ods-pdf`
    )
    return response.data
  },

  downloadDocument: async ({
    serviceId,
    documentId
  }: CalibrationServiceDocumentActionPayload): Promise<Blob> => {
    const response = await axiosPrivate.get(
      `/calibration-services/${serviceId}/documents/${documentId}/download`,
      {
        responseType: 'blob'
      }
    )
    return response.data
  },

  upsertSequenceConfig: async (
    payload: CalibrationServiceSequenceConfigPayload
  ): Promise<CalibrationServiceSequenceConfig> => {
    const response = await axiosPrivate.put<CalibrationServiceSequenceConfig>(
      '/calibration-services/config/sequence',
      payload
    )
    return response.data
  }
}

export const useCalibrationServices = (filters?: CalibrationServiceFilters) => {
  return useQuery({
    queryKey: [CALIBRATION_SERVICE_QUERY_KEYS.all, filters],
    queryFn: () => calibrationServiceApi.getServices(filters),
    staleTime: 60 * 1000,
    retry: 1
  })
}

export const useCalibrationServiceSequenceConfig = (enabled = true) => {
  return useQuery({
    queryKey: [CALIBRATION_SERVICE_QUERY_KEYS.all, 'sequence-config'],
    queryFn: calibrationServiceApi.getSequenceConfig,
    enabled,
    staleTime: 60 * 1000,
    retry: 1
  })
}

export const useCalibrationService = (serviceId?: string) => {
  return useQuery({
    queryKey: [CALIBRATION_SERVICE_QUERY_KEYS.detail, serviceId],
    queryFn: () => calibrationServiceApi.getServiceById(serviceId as string),
    enabled: Boolean(serviceId),
    staleTime: 60 * 1000,
    retry: 1
  })
}

export const useCalibrationServiceMutations = () => {
  const queryClient = useQueryClient()

  const createService = useMutation(calibrationServiceApi.createService, {
    onSuccess: () => {
      queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.all])
    }
  })

  const updateService = useMutation(calibrationServiceApi.updateService, {
    onSuccess: (service) => {
      queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.all])
      queryClient.invalidateQueries([
        CALIBRATION_SERVICE_QUERY_KEYS.detail,
        String(service.id)
      ])
    }
  })

  const uploadDocument = useMutation(calibrationServiceApi.uploadDocument, {
    onSuccess: (_document, variables) => {
      queryClient.invalidateQueries([
        CALIBRATION_SERVICE_QUERY_KEYS.detail,
        variables.serviceId
      ])
      queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.all])
    }
  })

  const requestApproval = useMutation(calibrationServiceApi.requestApproval, {
    onSuccess: (service) => {
      queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.all])
      queryClient.invalidateQueries([
        CALIBRATION_SERVICE_QUERY_KEYS.detail,
        String(service.id)
      ])
    }
  })

  const approveService = useMutation(calibrationServiceApi.approveService, {
    onSuccess: (service) => {
      queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.all])
      queryClient.invalidateQueries([
        CALIBRATION_SERVICE_QUERY_KEYS.detail,
        String(service.id)
      ])
    }
  })

  const rejectService = useMutation(calibrationServiceApi.rejectService, {
    onSuccess: (service) => {
      queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.all])
      queryClient.invalidateQueries([
        CALIBRATION_SERVICE_QUERY_KEYS.detail,
        String(service.id)
      ])
    }
  })

  const requestChanges = useMutation(calibrationServiceApi.requestChanges, {
    onSuccess: (service) => {
      queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.all])
      queryClient.invalidateQueries([
        CALIBRATION_SERVICE_QUERY_KEYS.detail,
        String(service.id)
      ])
    }
  })

  const issueOds = useMutation(calibrationServiceApi.issueOds, {
    onSuccess: (service) => {
      queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.all])
      queryClient.invalidateQueries([
        CALIBRATION_SERVICE_QUERY_KEYS.detail,
        String(service.id)
      ])
    }
  })

  const scheduleService = useMutation(calibrationServiceApi.scheduleService, {
    onSuccess: (service) => {
      queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.all])
      queryClient.invalidateQueries([
        CALIBRATION_SERVICE_QUERY_KEYS.detail,
        String(service.id)
      ])
    }
  })

  const startExecution = useMutation(calibrationServiceApi.startExecution, {
    onSuccess: (service) => {
      queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.all])
      queryClient.invalidateQueries([
        CALIBRATION_SERVICE_QUERY_KEYS.detail,
        String(service.id)
      ])
    }
  })

  const completeExecution = useMutation(
    calibrationServiceApi.completeExecution,
    {
      onSuccess: (service) => {
        queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.all])
        queryClient.invalidateQueries([
          CALIBRATION_SERVICE_QUERY_KEYS.detail,
          String(service.id)
        ])
      }
    }
  )

  const closeService = useMutation(calibrationServiceApi.closeService, {
    onSuccess: (service) => {
      queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.all])
      queryClient.invalidateQueries([
        CALIBRATION_SERVICE_QUERY_KEYS.detail,
        String(service.id)
      ])
    }
  })

  const updateItemProgress = useMutation(
    calibrationServiceApi.updateItemProgress,
    {
      onSuccess: (service) => {
        queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.all])
        queryClient.invalidateQueries([
          CALIBRATION_SERVICE_QUERY_KEYS.detail,
          String(service.id)
        ])
      }
    }
  )

  const createCut = useMutation(calibrationServiceApi.createCut, {
    onSuccess: (service) => {
      queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.all])
      queryClient.invalidateQueries([
        CALIBRATION_SERVICE_QUERY_KEYS.detail,
        String(service.id)
      ])
    }
  })

  const createAdjustment = useMutation(calibrationServiceApi.createAdjustment, {
    onSuccess: (service) => {
      queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.all])
      queryClient.invalidateQueries([
        CALIBRATION_SERVICE_QUERY_KEYS.detail,
        String(service.id)
      ])
    }
  })

  const reviewAdjustment = useMutation(calibrationServiceApi.reviewAdjustment, {
    onSuccess: (service) => {
      queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.all])
      queryClient.invalidateQueries([
        CALIBRATION_SERVICE_QUERY_KEYS.detail,
        String(service.id)
      ])
    }
  })

  const markCutReadyForInvoicing = useMutation(
    calibrationServiceApi.markCutReadyForInvoicing,
    {
      onSuccess: (service) => {
        queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.all])
        queryClient.invalidateQueries([
          CALIBRATION_SERVICE_QUERY_KEYS.detail,
          String(service.id)
        ])
      }
    }
  )

  const markCutInvoiced = useMutation(calibrationServiceApi.markCutInvoiced, {
    onSuccess: (service) => {
      queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.all])
      queryClient.invalidateQueries([
        CALIBRATION_SERVICE_QUERY_KEYS.detail,
        String(service.id)
      ])
    }
  })

  const updateCutDocumentControl = useMutation(
    calibrationServiceApi.updateCutDocumentControl,
    {
      onSuccess: (service) => {
        queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.all])
        queryClient.invalidateQueries([
          CALIBRATION_SERVICE_QUERY_KEYS.detail,
          String(service.id)
        ])
      }
    }
  )

  const generateQuotePdf = useMutation(calibrationServiceApi.generateQuotePdf, {
    onSuccess: (_document, variables) => {
      queryClient.invalidateQueries([
        CALIBRATION_SERVICE_QUERY_KEYS.detail,
        variables.serviceId
      ])
    }
  })

  const generateOdsPdf = useMutation(calibrationServiceApi.generateOdsPdf, {
    onSuccess: (_document, variables) => {
      queryClient.invalidateQueries([
        CALIBRATION_SERVICE_QUERY_KEYS.detail,
        variables.serviceId
      ])
    }
  })

  const downloadDocument = useMutation(calibrationServiceApi.downloadDocument)

  const upsertSequenceConfig = useMutation(
    calibrationServiceApi.upsertSequenceConfig,
    {
      onSuccess: () => {
        queryClient.invalidateQueries([
          CALIBRATION_SERVICE_QUERY_KEYS.all,
          'sequence-config'
        ])
      }
    }
  )

  return {
    createService,
    updateService,
    uploadDocument,
    requestApproval,
    approveService,
    rejectService,
    requestChanges,
    issueOds,
    scheduleService,
    startExecution,
    completeExecution,
    closeService,
    updateItemProgress,
    createCut,
    createAdjustment,
    reviewAdjustment,
    markCutReadyForInvoicing,
    markCutInvoiced,
    updateCutDocumentControl,
    generateQuotePdf,
    generateOdsPdf,
    downloadDocument,
    upsertSequenceConfig
  }
}
