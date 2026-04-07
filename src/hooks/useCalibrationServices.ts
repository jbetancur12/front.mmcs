import { useMutation, useQuery, useQueryClient } from 'react-query'
import { axiosPrivate } from '@utils/api'
import {
  CalibrationServiceApprovePayload,
  CalibrationService,
  CalibrationServiceDocumentActionPayload,
  CalibrationServiceDocument,
  CalibrationServiceDocumentUploadPayload,
  CalibrationServiceFilters,
  CalibrationServiceIssueOdsPayload,
  CalibrationServiceListResponse,
  CalibrationServicePayload,
  CalibrationServiceRejectPayload,
  CalibrationServiceRequestApprovalPayload
} from '../types/calibrationService'

export const CALIBRATION_SERVICE_QUERY_KEYS = {
  all: 'calibration-services',
  detail: 'calibration-service-detail'
} as const

const calibrationServiceApi = {
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

  const issueOds = useMutation(calibrationServiceApi.issueOds, {
    onSuccess: (service) => {
      queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.all])
      queryClient.invalidateQueries([
        CALIBRATION_SERVICE_QUERY_KEYS.detail,
        String(service.id)
      ])
    }
  })

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

  return {
    createService,
    updateService,
    uploadDocument,
    requestApproval,
    approveService,
    rejectService,
    issueOds,
    generateQuotePdf,
    generateOdsPdf,
    downloadDocument
  }
}
