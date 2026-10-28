import { useMutation, useQuery, useQueryClient } from 'react-query'
import { axiosPrivate } from '@utils/api'
import {
  CalibrationServiceApprovePayload,
  CalibrationServiceAdjustmentSendResult,
  CalibrationService,
  CalibrationServiceAnalyticsFilters,
  CalibrationServiceAnalyticsResponse,
  CalibrationServiceCancelPayload,
  CalibrationServiceClosePayload,
  CalibrationServiceCreateAdjustmentPayload,
  CalibrationServiceCreateCutPayload,
  CalibrationServiceDocumentActionPayload,
  CalibrationServiceDocument,
  CalibrationServiceDocumentUploadPayload,
  CalibrationServiceFilters,
  CalibrationServiceItemProgressPayload,
  CalibrationServiceMarkCutInvoicedPayload,
  CalibrationServiceRegisterCutPaymentPayload,
  CalibrationServiceIssueOdsPayload,
  CalibrationServiceListResponse,
  CalibrationServiceMyQueue,
  CalibrationServiceMarkCutReadyPayload,
  CalibrationServicePayload,
  CalibrationServicePausePayload,
  CalibrationServicePhysicalTraceabilityPayload,
  CalibrationServiceQuoteTerms,
  CalibrationServiceQuoteTermsTemplate,
  CalibrationServiceReassignPayload,
  CalibrationServiceReschedulePayload,
  CalibrationServiceUpdateLogisticsControlPayload,
  CalibrationServiceUpdateCutDocumentControlPayload,
  CalibrationServiceReviewAdjustmentPayload,
  CalibrationServiceRespondAdjustmentPayload,
  CalibrationServiceRequestChangesPayload,
  CalibrationServiceRejectPayload,
  CalibrationServiceRequestApprovalPayload,
  CalibrationServiceSendAdjustmentToCustomerPayload,
  CalibrationServiceSendLogisticsControlEmailPayload,
  CalibrationServiceLogisticsEmailSendResult,
  CalibrationServiceLoanEquipment,
  CalibrationServiceLoanEquipmentOption,
  CalibrationServiceLoanOutPayload,
  CalibrationServiceLoanReturnPayload,
  CalibrationServiceCertificateSendResult,
  CalibrationServiceCustomer,
  CalibrationServiceProductSummary,
  CalibrationServiceResumePayload,
  CalibrationServiceSchedulePayload,
  CalibrationServiceSequenceConfig,
  CalibrationServiceSequenceConfigPayload,
  CalibrationServiceSlaConfig,
  CalibrationServiceSlaConfigPayload,
  CalibrationServiceStartExecutionPayload,
  CalibrationServiceUserSummary
} from '../types/calibrationService'

export const CALIBRATION_SERVICE_QUERY_KEYS = {
  all: 'calibration-services',
  detail: 'calibration-service-detail',
  loans: 'calibration-service-loan-equipment',
  availableLoans: 'calibration-available-loan-equipment'
} as const

/** Claves de los catálogos de clientes y productos usados por el formulario de cotización. */
export const CALIBRATION_SERVICE_CUSTOMERS_QUERY_KEY = ['calibration-service-customers'] as const
export const CALIBRATION_SERVICE_PRODUCTS_QUERY_KEY = ['calibration-service-products'] as const

const calibrationServiceApi = {
  getLoanEquipment: async (
    serviceId: string
  ): Promise<CalibrationServiceLoanEquipment[]> => {
    const response = await axiosPrivate.get<CalibrationServiceLoanEquipment[]>(
      `/calibration-services/${serviceId}/loan-equipment`
    )
    return response.data
  },

  getAvailableLoanEquipment: async (
    search: string
  ): Promise<CalibrationServiceLoanEquipmentOption[]> => {
    const response = await axiosPrivate.get<CalibrationServiceLoanEquipmentOption[]>(
      '/calibration-services/loan-equipment/available',
      { params: { search: search || undefined } }
    )
    return response.data
  },

  createLoanEquipment: async ({
    serviceId,
    ...payload
  }: CalibrationServiceLoanOutPayload): Promise<CalibrationServiceLoanEquipment> => {
    const response = await axiosPrivate.post<CalibrationServiceLoanEquipment>(
      `/calibration-services/${serviceId}/loan-equipment`,
      payload
    )
    return response.data
  },

  returnLoanEquipment: async ({
    serviceId,
    loanId,
    ...payload
  }: CalibrationServiceLoanReturnPayload): Promise<CalibrationServiceLoanEquipment> => {
    const response = await axiosPrivate.post<CalibrationServiceLoanEquipment>(
      `/calibration-services/${serviceId}/loan-equipment/${loanId}/return`,
      payload
    )
    return response.data
  },

  cancelLoanEquipment: async ({
    serviceId,
    loanId
  }: {
    serviceId: string
    loanId: number
  }): Promise<{ cancelled: boolean }> => {
    const response = await axiosPrivate.delete<{ cancelled: boolean }>(
      `/calibration-services/${serviceId}/loan-equipment/${loanId}`
    )
    return response.data
  },

  getSequenceConfig: async (): Promise<CalibrationServiceSequenceConfig> => {
    const response = await axiosPrivate.get<CalibrationServiceSequenceConfig>(
      '/calibration-services/config/sequence'
    )
    return response.data
  },

  getSlaConfig: async (): Promise<CalibrationServiceSlaConfig> => {
    const response = await axiosPrivate.get<CalibrationServiceSlaConfig>(
      '/calibration-services/config/sla'
    )
    return response.data
  },

  getQuoteTermsTemplate: async (): Promise<CalibrationServiceQuoteTermsTemplate> => {
    const response = await axiosPrivate.get<CalibrationServiceQuoteTermsTemplate>(
      '/calibration-services/config/quote-terms'
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

  getAnalytics: async (
    filters?: CalibrationServiceAnalyticsFilters
  ): Promise<CalibrationServiceAnalyticsResponse> => {
    const response = await axiosPrivate.get<CalibrationServiceAnalyticsResponse>(
      '/calibration-services/analytics',
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

  getAssignableMetrologists: async (): Promise<CalibrationServiceUserSummary[]> => {
    const response = await axiosPrivate.get<CalibrationServiceUserSummary[]>(
      '/calibration-services/assignable-metrologists'
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

  getMyQueue: async (): Promise<CalibrationServiceMyQueue> => {
    const response = await axiosPrivate.get<CalibrationServiceMyQueue>(
      '/calibration-services/my-queue'
    )
    return response.data
  },

  reopenQuote: async ({
    serviceId,
    reason
  }: {
    serviceId: number | string
    reason: string
  }): Promise<CalibrationService> => {
    const response = await axiosPrivate.post<CalibrationService>(
      `/calibration-services/${serviceId}/reopen`,
      { reason }
    )
    return response.data
  },

  duplicateService: async (
    serviceId: number | string
  ): Promise<CalibrationService> => {
    const response = await axiosPrivate.post<CalibrationService>(
      `/calibration-services/${serviceId}/duplicate`
    )
    return response.data
  },

  voidCut: async ({
    serviceId,
    cutId,
    reason
  }: CalibrationServiceCutCorrectionPayload): Promise<CalibrationService> => {
    const response = await axiosPrivate.post<CalibrationService>(
      `/calibration-services/${serviceId}/cuts/${cutId}/void`,
      { reason }
    )
    return response.data
  },

  revertCutToDraft: async ({
    serviceId,
    cutId,
    reason
  }: CalibrationServiceCutCorrectionPayload): Promise<CalibrationService> => {
    const response = await axiosPrivate.post<CalibrationService>(
      `/calibration-services/${serviceId}/cuts/${cutId}/revert-to-draft`,
      { reason }
    )
    return response.data
  },

  correctCutInvoice: async ({
    serviceId,
    cutId,
    reason,
    invoiceReference
  }: CalibrationServiceCutCorrectionPayload & {
    invoiceReference: string
  }): Promise<CalibrationService> => {
    const response = await axiosPrivate.patch<CalibrationService>(
      `/calibration-services/${serviceId}/cuts/${cutId}/invoice-reference`,
      { reason, invoiceReference }
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

  rescheduleService: async ({
    serviceId,
    ...payload
  }: CalibrationServiceReschedulePayload): Promise<CalibrationService> => {
    const response = await axiosPrivate.post<CalibrationService>(
      `/calibration-services/${serviceId}/reschedule`,
      payload
    )
    return response.data
  },

  reassignService: async ({
    serviceId,
    ...payload
  }: CalibrationServiceReassignPayload): Promise<CalibrationService> => {
    const response = await axiosPrivate.post<CalibrationService>(
      `/calibration-services/${serviceId}/reassign`,
      payload
    )
    return response.data
  },

  pauseService: async ({
    serviceId,
    ...payload
  }: CalibrationServicePausePayload): Promise<CalibrationService> => {
    const response = await axiosPrivate.post<CalibrationService>(
      `/calibration-services/${serviceId}/pause`,
      payload
    )
    return response.data
  },

  resumeService: async ({
    serviceId,
    ...payload
  }: CalibrationServiceResumePayload): Promise<CalibrationService> => {
    const response = await axiosPrivate.post<CalibrationService>(
      `/calibration-services/${serviceId}/resume`,
      payload
    )
    return response.data
  },

  cancelService: async ({
    serviceId,
    ...payload
  }: CalibrationServiceCancelPayload): Promise<CalibrationService> => {
    const response = await axiosPrivate.post<CalibrationService>(
      `/calibration-services/${serviceId}/cancel`,
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

  registerPhysicalTraceability: async ({
    serviceId,
    ...payload
  }: CalibrationServicePhysicalTraceabilityPayload): Promise<CalibrationService> => {
    const response = await axiosPrivate.post<CalibrationService>(
      `/calibration-services/${serviceId}/physical-traceability`,
      payload
    )
    return response.data
  },

  updateLogisticsControl: async ({
    serviceId,
    ...payload
  }: CalibrationServiceUpdateLogisticsControlPayload): Promise<CalibrationService> => {
    const response = await axiosPrivate.put<CalibrationService>(
      `/calibration-services/${serviceId}/logistics-control`,
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

  sendAdjustmentToCustomer: async ({
    serviceId,
    adjustmentId,
    ...payload
  }: CalibrationServiceSendAdjustmentToCustomerPayload): Promise<CalibrationServiceAdjustmentSendResult> => {
    const response = await axiosPrivate.post<CalibrationServiceAdjustmentSendResult>(
      `/calibration-services/${serviceId}/adjustments/${adjustmentId}/send-to-customer`,
      payload
    )
    return response.data
  },

  batchSendAdjustmentsToCustomer: async ({
    serviceId,
    ...payload
  }: {
    serviceId: string
    adjustmentIds: number[]
    recipientEmail?: string | null
    recipientName?: string | null
    sentAt?: string
  }): Promise<{ service: CalibrationService; delivery: CalibrationServiceAdjustmentSendResult['delivery'] }> => {
    const response = await axiosPrivate.post<{ service: CalibrationService; delivery: CalibrationServiceAdjustmentSendResult['delivery'] }>(
      `/calibration-services/${serviceId}/adjustments/batch/send-to-customer`,
      payload
    )
    return response.data
  },

  respondAdjustment: async ({
    serviceId,
    adjustmentId,
    ...payload
  }: CalibrationServiceRespondAdjustmentPayload): Promise<CalibrationService> => {
    const response = await axiosPrivate.put<CalibrationService>(
      `/calibration-services/${serviceId}/adjustments/${adjustmentId}/customer-response`,
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

  registerCutPayment: async ({
    serviceId,
    cutId,
  }: CalibrationServiceRegisterCutPaymentPayload): Promise<CalibrationService> => {
    const response = await axiosPrivate.post<CalibrationService>(
      `/calibration-services/${serviceId}/cuts/${cutId}/payment`
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

  generateAdjustmentPdf: async ({
    serviceId,
    adjustmentId
  }: CalibrationServiceDocumentActionPayload): Promise<CalibrationServiceDocument> => {
    const response = await axiosPrivate.post<CalibrationServiceDocument>(
      `/calibration-services/${serviceId}/adjustments/${adjustmentId}/generate-pdf`
    )
    return response.data
  },

  generateAdjustmentSummaryPdf: async ({
    serviceId
  }: CalibrationServiceDocumentActionPayload): Promise<CalibrationServiceDocument> => {
    const response = await axiosPrivate.post<CalibrationServiceDocument>(
      `/calibration-services/${serviceId}/adjustments/generate-summary-pdf`
    )
    return response.data
  },

  generateLogisticsPdf: async ({
    serviceId
  }: CalibrationServiceDocumentActionPayload): Promise<CalibrationServiceDocument> => {
    const response = await axiosPrivate.post<CalibrationServiceDocument>(
      `/calibration-services/${serviceId}/generate-logistics-pdf`
    )
    return response.data
  },

  generateTechnicalProgressPdf: async ({
    serviceId
  }: CalibrationServiceDocumentActionPayload): Promise<CalibrationServiceDocument> => {
    const response = await axiosPrivate.post<CalibrationServiceDocument>(
      `/calibration-services/${serviceId}/generate-technical-progress-pdf`
    )
    return response.data
  },

  sendLogisticsControlEmail: async ({
    serviceId,
    ...payload
  }: CalibrationServiceSendLogisticsControlEmailPayload): Promise<CalibrationServiceLogisticsEmailSendResult> => {
    const response = await axiosPrivate.post<CalibrationServiceLogisticsEmailSendResult>(
      `/calibration-services/${serviceId}/logistics-control/send-email`,
      payload
    )
    return response.data
  },

  sendCertificate: async ({
    serviceId,
    method
  }: {
    serviceId: string
    method?: string
  }): Promise<CalibrationServiceCertificateSendResult> => {
    const response = await axiosPrivate.post<CalibrationServiceCertificateSendResult>(
      `/calibration-services/${serviceId}/certificate/send`,
      { method }
    )
    return response.data
  },

  updateCustomerSignature: async ({
    serviceId,
    customerSignatureData
  }: {
    serviceId: string
    customerSignatureData: string | null
  }): Promise<CalibrationService> => {
    const response = await axiosPrivate.put<CalibrationService>(
      `/calibration-services/${serviceId}/customer-signature`,
      { customerSignatureData }
    )
    return response.data
  },

  createRemoteSignatureLink: async ({
    serviceId,
    expiresInHours
  }: {
    serviceId: string
    expiresInHours?: number
  }): Promise<{ url: string; expiresAt: string }> => {
    const response = await axiosPrivate.post<{ url: string; expiresAt: string }>(
      `/calibration-services/${serviceId}/remote-signature-link`,
      { expiresInHours }
    )
    return response.data
  },

  revokeRemoteSignatureLink: async ({
    serviceId
  }: {
    serviceId: string
  }): Promise<{ revoked: boolean }> => {
    const response = await axiosPrivate.delete<{ revoked: boolean }>(
      `/calibration-services/${serviceId}/remote-signature-link`
    )
    return response.data
  },

  updateDeliverySignature: async ({
    serviceId,
    deliveryName,
    deliveryRole,
    deliverySignatureData
  }: {
    serviceId: string
    deliveryName: string | null
    deliveryRole: string | null
    deliverySignatureData: string | null
  }): Promise<CalibrationService> => {
    const response = await axiosPrivate.put<CalibrationService>(
      `/calibration-services/${serviceId}/delivery-signature`,
      { deliveryName, deliveryRole, deliverySignatureData }
    )
    return response.data
  },

  updateExecutionCustomer: async ({
    serviceId,
    executionCustomerName,
    executionSiteName
  }: {
    serviceId: string
    executionCustomerName: string | null
    executionSiteName: string | null
  }): Promise<CalibrationService> => {
    const response = await axiosPrivate.put<CalibrationService>(
      `/calibration-services/${serviceId}/execution-customer`,
      { executionCustomerName, executionSiteName }
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
  },

  upsertSlaConfig: async (
    payload: CalibrationServiceSlaConfigPayload
  ): Promise<CalibrationServiceSlaConfig> => {
    const response = await axiosPrivate.put<CalibrationServiceSlaConfig>(
      '/calibration-services/config/sla',
      payload
    )
    return response.data
  },

  upsertQuoteTermsTemplate: async (
    terms: CalibrationServiceQuoteTerms
  ): Promise<CalibrationServiceQuoteTermsTemplate> => {
    const response = await axiosPrivate.put<CalibrationServiceQuoteTermsTemplate>(
      '/calibration-services/config/quote-terms',
      { terms }
    )
    return response.data
  }
}

export const useCalibrationServices = (filters?: CalibrationServiceFilters) => {
  return useQuery({
    queryKey: [CALIBRATION_SERVICE_QUERY_KEYS.all, filters],
    queryFn: () => calibrationServiceApi.getServices(filters),
    staleTime: 60 * 1000,
    retry: 1,
    // Mientras llega la consulta nueva (otra etapa, otra búsqueda, "Cargar
    // más") se sigue mostrando la lista anterior en vez de vaciar la pantalla
    keepPreviousData: true
  })
}

/** Pendientes del usuario según sus capacidades; se refresca solo cada minuto. */
export const useCalibrationServiceMyQueue = () =>
  useQuery({
    queryKey: [CALIBRATION_SERVICE_QUERY_KEYS.all, 'my-queue'],
    queryFn: () => calibrationServiceApi.getMyQueue(),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    retry: 1
  })

export const useCalibrationServiceAnalytics = (
  filters?: CalibrationServiceAnalyticsFilters,
  enabled = true
) => {
  return useQuery({
    queryKey: [CALIBRATION_SERVICE_QUERY_KEYS.all, 'analytics', filters],
    queryFn: () => calibrationServiceApi.getAnalytics(filters),
    enabled,
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

export const useCalibrationServiceSlaConfig = (enabled = true) => {
  return useQuery({
    queryKey: [CALIBRATION_SERVICE_QUERY_KEYS.all, 'sla-config'],
    queryFn: calibrationServiceApi.getSlaConfig,
    enabled,
    staleTime: 60 * 1000,
    retry: 1
  })
}

/**
 * Quién hace cada paso del flujo según el panel de roles: { capacidad: [nombres de rol] }. Lo usa la pestaña Guía
 * del servicio, para no repetir listas de roles que se desfasan de lo que el API permite.
 */
export const useCalibrationServiceStepRoles = () => {
  return useQuery({
    queryKey: [CALIBRATION_SERVICE_QUERY_KEYS.all, 'step-roles'],
    queryFn: async (): Promise<Record<string, string[]>> => {
      const { data } = await axiosPrivate.get(
        '/calibration-services/step-roles'
      )
      return data.steps ?? {}
    },
    staleTime: 60 * 1000,
    retry: 1
  })
}

export const useCalibrationServiceQuoteTermsTemplate = (enabled = true) => {
  return useQuery({
    queryKey: [CALIBRATION_SERVICE_QUERY_KEYS.all, 'quote-terms-template'],
    queryFn: calibrationServiceApi.getQuoteTermsTemplate,
    enabled,
    staleTime: 0
  })
}

export const useCalibrationServiceLoanEquipment = (serviceId?: string) => {
  return useQuery({
    queryKey: [CALIBRATION_SERVICE_QUERY_KEYS.loans, serviceId],
    queryFn: () => calibrationServiceApi.getLoanEquipment(serviceId as string),
    enabled: Boolean(serviceId),
    retry: 1
  })
}

export const useAvailableLoanEquipment = (search: string, enabled = true) => {
  return useQuery({
    queryKey: [CALIBRATION_SERVICE_QUERY_KEYS.availableLoans, search],
    queryFn: () => calibrationServiceApi.getAvailableLoanEquipment(search),
    enabled,
    keepPreviousData: true,
    retry: 1
  })
}

export const useCalibrationServiceLoanMutations = () => {
  const queryClient = useQueryClient()
  // Un préstamo cambia la lista del servicio, los equipos disponibles y el reporte de préstamos.
  const refresh = () => {
    queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.loans])
    queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.availableLoans])
  }

  return {
    createLoan: useMutation(calibrationServiceApi.createLoanEquipment, { onSuccess: refresh }),
    returnLoan: useMutation(calibrationServiceApi.returnLoanEquipment, { onSuccess: refresh }),
    cancelLoan: useMutation(calibrationServiceApi.cancelLoanEquipment, { onSuccess: refresh })
  }
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

/** Clientes con alcance de calibración para el selector del formulario de cotización. */
export const useCalibrationServiceCustomerOptions = (enabled = true) => {
  return useQuery({
    queryKey: CALIBRATION_SERVICE_CUSTOMERS_QUERY_KEY,
    queryFn: async () => {
      const response = await axiosPrivate.get<CalibrationServiceCustomer[]>('/customers', {
        params: { scope: 'calibration' }
      })
      return response.data
    },
    enabled,
    staleTime: 5 * 60 * 1000
  })
}

/** Catálogo de productos para los ítems del formulario de cotización. */
export const useCalibrationServiceProductOptions = (enabled = true) => {
  return useQuery({
    queryKey: CALIBRATION_SERVICE_PRODUCTS_QUERY_KEY,
    queryFn: async () => {
      const response = await axiosPrivate.get<CalibrationServiceProductSummary[]>('/products')
      return response.data
    },
    enabled,
    staleTime: 5 * 60 * 1000
  })
}

export const useCalibrationAssignableMetrologists = (enabled = true) => {
  return useQuery({
    queryKey: [CALIBRATION_SERVICE_QUERY_KEYS.all, 'assignable-metrologists'],
    queryFn: calibrationServiceApi.getAssignableMetrologists,
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1
  })
}

const invalidateAll = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.all])
}

const invalidateDetail = (queryClient: ReturnType<typeof useQueryClient>, id: string | number) => {
  queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.detail, String(id)])
}

export interface CalibrationServiceCutCorrectionPayload {
  serviceId: number | string
  cutId: number | string
  reason: string
}

export const useCalibrationServiceMutations = () => {
  const queryClient = useQueryClient()
  const iA = () => invalidateAll(queryClient)
  const iD = (id: string | number) => invalidateDetail(queryClient, id)

  const createService = useMutation(calibrationServiceApi.createService, { onSuccess: iA })
  const updateService = useMutation(calibrationServiceApi.updateService, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const uploadDocument = useMutation(calibrationServiceApi.uploadDocument, { onSuccess: (_: any, v: any) => { iA(); iD(v.serviceId) } })
  const requestApproval = useMutation(calibrationServiceApi.requestApproval, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const approveService = useMutation(calibrationServiceApi.approveService, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const rejectService = useMutation(calibrationServiceApi.rejectService, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const reopenQuote = useMutation(calibrationServiceApi.reopenQuote, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const duplicateService = useMutation(calibrationServiceApi.duplicateService, { onSuccess: iA })
  const voidCut = useMutation(calibrationServiceApi.voidCut, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const revertCutToDraft = useMutation(calibrationServiceApi.revertCutToDraft, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const correctCutInvoice = useMutation(calibrationServiceApi.correctCutInvoice, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const requestChanges = useMutation(calibrationServiceApi.requestChanges, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const issueOds = useMutation(calibrationServiceApi.issueOds, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const scheduleService = useMutation(calibrationServiceApi.scheduleService, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const rescheduleService = useMutation(calibrationServiceApi.rescheduleService, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const reassignService = useMutation(calibrationServiceApi.reassignService, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const pauseService = useMutation(calibrationServiceApi.pauseService, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const resumeService = useMutation(calibrationServiceApi.resumeService, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const cancelService = useMutation(calibrationServiceApi.cancelService, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const startExecution = useMutation(calibrationServiceApi.startExecution, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const completeExecution = useMutation(calibrationServiceApi.completeExecution, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const closeService = useMutation(calibrationServiceApi.closeService, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const updateItemProgress = useMutation(calibrationServiceApi.updateItemProgress, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const registerPhysicalTraceability = useMutation(calibrationServiceApi.registerPhysicalTraceability, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const updateLogisticsControl = useMutation(calibrationServiceApi.updateLogisticsControl, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const createCut = useMutation(calibrationServiceApi.createCut, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const createAdjustment = useMutation(calibrationServiceApi.createAdjustment, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const reviewAdjustment = useMutation(calibrationServiceApi.reviewAdjustment, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const sendAdjustmentToCustomer = useMutation(calibrationServiceApi.sendAdjustmentToCustomer, { onSuccess: ({ service }: any) => { iA(); iD(service.id) } })
  const batchSendAdjustmentsToCustomer = useMutation(calibrationServiceApi.batchSendAdjustmentsToCustomer, { onSuccess: ({ service }: any) => { iA(); iD(service.id) } })
  const respondAdjustment = useMutation(calibrationServiceApi.respondAdjustment, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const markCutReadyForInvoicing = useMutation(calibrationServiceApi.markCutReadyForInvoicing, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const markCutInvoiced = useMutation(calibrationServiceApi.markCutInvoiced, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const registerCutPayment = useMutation(calibrationServiceApi.registerCutPayment, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const updateCutDocumentControl = useMutation(calibrationServiceApi.updateCutDocumentControl, { onSuccess: (s: any) => { iA(); iD(s.id) } })
  const generateQuotePdf = useMutation(calibrationServiceApi.generateQuotePdf, { onSuccess: (_: any, v: any) => { iD(v.serviceId) } })
  const generateOdsPdf = useMutation(calibrationServiceApi.generateOdsPdf, { onSuccess: (_: any, v: any) => { iD(v.serviceId) } })
  const generateAdjustmentPdf = useMutation(calibrationServiceApi.generateAdjustmentPdf, { onSuccess: (_: any, v: any) => { iD(v.serviceId) } })
  const generateAdjustmentSummaryPdf = useMutation(calibrationServiceApi.generateAdjustmentSummaryPdf, { onSuccess: (_: any, v: any) => { iD(v.serviceId) } })
  const generateLogisticsPdf = useMutation(calibrationServiceApi.generateLogisticsPdf, { onSuccess: (_: any, v: any) => { iD(v.serviceId) } })
  const generateTechnicalProgressPdf = useMutation(calibrationServiceApi.generateTechnicalProgressPdf, { onSuccess: (_: any, v: any) => { iD(v.serviceId) } })
  const sendLogisticsControlEmail = useMutation(calibrationServiceApi.sendLogisticsControlEmail, { onSuccess: (r: any, v: any) => { queryClient.setQueryData([CALIBRATION_SERVICE_QUERY_KEYS.detail, v.serviceId], r.service); iD(v.serviceId) } })
  const sendCertificate = useMutation(calibrationServiceApi.sendCertificate, { onSuccess: (_: any, v: any) => { iA(); iD(v.serviceId) } })
  const downloadDocument = useMutation(calibrationServiceApi.downloadDocument)
  const upsertSequenceConfig = useMutation(calibrationServiceApi.upsertSequenceConfig, { onSuccess: () => { queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.all, 'sequence-config']) } })
  const upsertSlaConfig = useMutation(calibrationServiceApi.upsertSlaConfig)
  const updateCustomerSignature = useMutation(calibrationServiceApi.updateCustomerSignature, { onSuccess: () => { queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.detail]) } })
  const createRemoteSignatureLink = useMutation(calibrationServiceApi.createRemoteSignatureLink, { onSuccess: (_: any, v: any) => { iD(v.serviceId) } })
  const revokeRemoteSignatureLink = useMutation(calibrationServiceApi.revokeRemoteSignatureLink, { onSuccess: (_: any, v: any) => { iD(v.serviceId) } })
  const updateDeliverySignature = useMutation(calibrationServiceApi.updateDeliverySignature, { onSuccess: () => { queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.detail]) } })
  const updateExecutionCustomer = useMutation(calibrationServiceApi.updateExecutionCustomer, { onSuccess: () => { queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.detail]) } })
  const upsertQuoteTermsTemplate = useMutation(calibrationServiceApi.upsertQuoteTermsTemplate, { onSuccess: () => { queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.all, 'quote-terms-template']) } })

  return { createService, updateService, uploadDocument, requestApproval, approveService, rejectService, reopenQuote, duplicateService, voidCut, revertCutToDraft, correctCutInvoice, requestChanges, issueOds, scheduleService, rescheduleService, reassignService, pauseService, resumeService, cancelService, startExecution, completeExecution, closeService, updateItemProgress, registerPhysicalTraceability, updateLogisticsControl, createCut, createAdjustment, reviewAdjustment, sendAdjustmentToCustomer, batchSendAdjustmentsToCustomer, respondAdjustment, markCutReadyForInvoicing, markCutInvoiced, registerCutPayment, updateCutDocumentControl, generateQuotePdf, generateOdsPdf, generateAdjustmentPdf, generateAdjustmentSummaryPdf, generateLogisticsPdf, generateTechnicalProgressPdf, sendLogisticsControlEmail, sendCertificate, downloadDocument, upsertSequenceConfig, upsertSlaConfig, upsertQuoteTermsTemplate, updateCustomerSignature, createRemoteSignatureLink, revokeRemoteSignatureLink, updateDeliverySignature, updateExecutionCustomer }
}
