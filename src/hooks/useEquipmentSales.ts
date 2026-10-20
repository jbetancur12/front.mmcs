import { useMutation, useQuery, useQueryClient } from 'react-query'
import { axiosPrivate } from '@utils/api'
import {
  EquipmentQuotation,
  EquipmentQuotationDocument,
  EquipmentQuotationListResponse,
  EquipmentQuotationPayload,
  EquipmentQuotationSequenceConfig,
  EquipmentProduct,
  EquipmentProductListResponse,
  EquipmentProductPayload
} from '../types/equipmentSales'
import type { EquipmentCustomerOption } from '../types/equipmentSales'
import type { EquipmentSalesCustomerDialogValues } from '../pages/equipment-sales/EquipmentSalesCustomerDialog'

export const EQUIPMENT_SALES_QUERY_KEYS = {
  all: 'equipment-sales',
  quotations: 'equipment-quotations',
  quotation: 'equipment-quotation',
  products: 'equipment-products',
  quoteTermsTemplate: 'equipment-quote-terms-template',
  sequenceConfig: 'equipment-sequence-config',
  documents: 'equipment-quotation-documents'
} as const

export interface EquipmentQuotationDecisionPayload {
  quotationId: number | string
  approvalChannel?: string
  approvalReference?: string | null
  approvalNotes?: string | null
  approvedAt?: string
  rejectedAt?: string
  rejectionReason?: string
  changeRequestReason?: string
  requestedAt?: string
  evidenceDocumentId?: number | null
}

const equipmentSalesApi = {
  listQuotations: async (params?: Record<string, unknown>): Promise<EquipmentQuotationListResponse> => {
    const { data } = await axiosPrivate.get<EquipmentQuotationListResponse>('/equipment-sales', { params })
    return data
  },
  getQuotationById: async (id: number | string): Promise<EquipmentQuotation> => {
    const { data } = await axiosPrivate.get<EquipmentQuotation>(`/equipment-sales/${id}`)
    return data
  },
  createQuotation: async (payload: EquipmentQuotationPayload): Promise<EquipmentQuotation> => {
    const { data } = await axiosPrivate.post<EquipmentQuotation>('/equipment-sales', payload)
    return data
  },
  updateQuotation: async ({ id, payload }: { id: number | string; payload: Partial<EquipmentQuotationPayload> }): Promise<EquipmentQuotation> => {
    const { data } = await axiosPrivate.put<EquipmentQuotation>(`/equipment-sales/${id}`, payload)
    return data
  },
  requestApproval: async (id: number | string): Promise<EquipmentQuotation> => {
    const { data } = await axiosPrivate.post<EquipmentQuotation>(`/equipment-sales/${id}/request-approval`)
    return data
  },
  approveQuotation: async ({ quotationId, ...body }: EquipmentQuotationDecisionPayload): Promise<EquipmentQuotation> => {
    const { data } = await axiosPrivate.post<EquipmentQuotation>(`/equipment-sales/${quotationId}/approve`, body)
    return data
  },
  rejectQuotation: async ({ quotationId, ...body }: EquipmentQuotationDecisionPayload): Promise<EquipmentQuotation> => {
    const { data } = await axiosPrivate.post<EquipmentQuotation>(`/equipment-sales/${quotationId}/reject`, body)
    return data
  },
  requestChanges: async ({ quotationId, ...body }: EquipmentQuotationDecisionPayload): Promise<EquipmentQuotation> => {
    const { data } = await axiosPrivate.post<EquipmentQuotation>(`/equipment-sales/${quotationId}/request-changes`, body)
    return data
  },
  markAsReadyForInvoice: async (id: number | string): Promise<EquipmentQuotation> => {
    const { data } = await axiosPrivate.post<EquipmentQuotation>(`/equipment-sales/${id}/ready-for-invoicing`)
    return data
  },
  invoiceQuotation: async (id: number | string): Promise<EquipmentQuotation> => {
    const { data } = await axiosPrivate.post<EquipmentQuotation>(`/equipment-sales/${id}/invoice`)
    return data
  },
  cancelQuotation: async (id: number | string, reason?: string): Promise<EquipmentQuotation> => {
    const { data } = await axiosPrivate.post<EquipmentQuotation>(`/equipment-sales/${id}/cancel`, { reason })
    return data
  },
  generateQuotePdf: async (quotationId: number | string): Promise<EquipmentQuotationDocument> => {
    const { data } = await axiosPrivate.post<EquipmentQuotationDocument>(`/equipment-sales/${quotationId}/generate-pdf`)
    return data
  },
  getDocuments: async (quotationId: number | string): Promise<{ quotationId: number; documents: EquipmentQuotationDocument[] }> => {
    const { data } = await axiosPrivate.get(`/equipment-sales/${quotationId}/documents`)
    return data
  },
  uploadDocument: async ({
    quotationId,
    file,
    documentType,
    title,
    notes
  }: {
    quotationId: number | string
    file: File
    documentType: string
    title?: string
    notes?: string
  }): Promise<EquipmentQuotationDocument> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentType', documentType)
    if (title) formData.append('title', title)
    if (notes) formData.append('notes', notes)
    const { data } = await axiosPrivate.post<EquipmentQuotationDocument>(
      `/equipment-sales/${quotationId}/documents`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return data
  },
  downloadDocument: async ({ quotationId, documentId }: { quotationId: number | string; documentId: number | string }): Promise<Blob> => {
    const { data } = await axiosPrivate.get(`/equipment-sales/${quotationId}/documents/${documentId}/download`, { responseType: 'blob' })
    return data
  },
  listProducts: async (params?: Record<string, unknown>): Promise<EquipmentProductListResponse> => {
    const { data } = await axiosPrivate.get<EquipmentProductListResponse>('/equipment-sales/products', { params })
    return data
  },
  getProductById: async (id: number | string): Promise<EquipmentProduct> => {
    const { data } = await axiosPrivate.get<EquipmentProduct>(`/equipment-sales/products/${id}`)
    return data
  },
  createProduct: async (payload: EquipmentProductPayload): Promise<EquipmentProduct> => {
    const { data } = await axiosPrivate.post<EquipmentProduct>('/equipment-sales/products', payload)
    return data
  },
  updateProduct: async ({ id, payload }: { id: number | string; payload: Partial<EquipmentProductPayload> }): Promise<EquipmentProduct> => {
    const { data } = await axiosPrivate.put<EquipmentProduct>(`/equipment-sales/products/${id}`, payload)
    return data
  },
  deleteProduct: async (id: number | string): Promise<void> => {
    await axiosPrivate.delete(`/equipment-sales/products/${id}`)
  },
  getQuoteTermsTemplate: async (): Promise<{ terms: Record<string, string>; updatedAt: string | null; updatedByName: string | null }> => {
    const { data } = await axiosPrivate.get('/equipment-sales/config/quote-terms')
    return data
  },
  upsertQuoteTermsTemplate: async (terms: Record<string, string>): Promise<{ terms: Record<string, string>; updatedAt: string; updatedByName: string }> => {
    const { data } = await axiosPrivate.put('/equipment-sales/config/quote-terms', { terms })
    return data
  },
  getSequenceConfig: async (): Promise<EquipmentQuotationSequenceConfig> => {
    const { data } = await axiosPrivate.get('/equipment-sales/config/sequence')
    return data
  },
  upsertSequenceConfig: async (values: { nextQuoteNumber: number }): Promise<EquipmentQuotationSequenceConfig> => {
    const { data } = await axiosPrivate.put('/equipment-sales/config/sequence', values)
    return data
  }
}

export const useEquipmentQuotations = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: [EQUIPMENT_SALES_QUERY_KEYS.quotations, params],
    queryFn: () => equipmentSalesApi.listQuotations(params),
    keepPreviousData: true,
    staleTime: 30 * 1000
  })
}

export const useEquipmentQuotation = (id?: number | string | null) => {
  return useQuery({
    queryKey: [EQUIPMENT_SALES_QUERY_KEYS.quotation, id],
    queryFn: () => equipmentSalesApi.getQuotationById(id!),
    enabled: !!id,
    staleTime: 30 * 1000
  })
}

export const useEquipmentProducts = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: [EQUIPMENT_SALES_QUERY_KEYS.products, params],
    queryFn: () => equipmentSalesApi.listProducts(params),
    keepPreviousData: true,
    staleTime: 60 * 1000
  })
}

export const useEquipmentQuoteTermsTemplate = (enabled?: boolean) => {
  return useQuery({
    queryKey: [EQUIPMENT_SALES_QUERY_KEYS.quoteTermsTemplate],
    queryFn: () => equipmentSalesApi.getQuoteTermsTemplate(),
    enabled,
    staleTime: 5 * 60 * 1000
  })
}

export const useEquipmentSequenceConfig = (enabled?: boolean) => {
  return useQuery({
    queryKey: [EQUIPMENT_SALES_QUERY_KEYS.sequenceConfig],
    queryFn: () => equipmentSalesApi.getSequenceConfig(),
    enabled,
    staleTime: 5 * 60 * 1000
  })
}

export const useEquipmentQuotationDocuments = (quotationId?: number | string | null) => {
  return useQuery({
    queryKey: [EQUIPMENT_SALES_QUERY_KEYS.documents, quotationId],
    queryFn: () => equipmentSalesApi.getDocuments(quotationId!),
    enabled: !!quotationId,
    staleTime: 30 * 1000
  })
}

export const useEquipmentSalesMutations = () => {
  const queryClient = useQueryClient()

  const invalidateQuotation = (id: number | string | undefined) => {
    queryClient.invalidateQueries([EQUIPMENT_SALES_QUERY_KEYS.quotations])
    if (id !== undefined) {
      const key = String(id)
      queryClient.invalidateQueries([EQUIPMENT_SALES_QUERY_KEYS.quotation, key])
      queryClient.invalidateQueries([EQUIPMENT_SALES_QUERY_KEYS.documents, key])
    }
  }

  const createQuotation = useMutation({
    mutationFn: equipmentSalesApi.createQuotation,
    onSuccess: () => invalidateQuotation(undefined)
  })

  const updateQuotation = useMutation({
    mutationFn: equipmentSalesApi.updateQuotation,
    onSuccess: (data) => invalidateQuotation(data.id)
  })

  const requestApproval = useMutation({
    mutationFn: equipmentSalesApi.requestApproval,
    onSuccess: (data) => invalidateQuotation(data.id)
  })

  const approveQuotation = useMutation({
    mutationFn: equipmentSalesApi.approveQuotation,
    onSuccess: (data) => invalidateQuotation(data.id)
  })

  const rejectQuotation = useMutation({
    mutationFn: equipmentSalesApi.rejectQuotation,
    onSuccess: (data) => invalidateQuotation(data.id)
  })

  const requestChanges = useMutation({
    mutationFn: equipmentSalesApi.requestChanges,
    onSuccess: (data) => invalidateQuotation(data.id)
  })

  const readyForInvoice = useMutation({
    mutationFn: equipmentSalesApi.markAsReadyForInvoice,
    onSuccess: (data) => invalidateQuotation(data.id)
  })

  const invoiceQuotation = useMutation({
    mutationFn: equipmentSalesApi.invoiceQuotation,
    onSuccess: (data) => invalidateQuotation(data.id)
  })

  const cancelQuotation = useMutation({
    mutationFn: ({ id, reason }: { id: number | string; reason?: string }) =>
      equipmentSalesApi.cancelQuotation(id, reason),
    onSuccess: (data) => invalidateQuotation(data.id)
  })

  const generateQuotePdf = useMutation({
    mutationFn: equipmentSalesApi.generateQuotePdf,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries([EQUIPMENT_SALES_QUERY_KEYS.documents, String(variables)])
    }
  })

  const uploadDocument = useMutation({
    mutationFn: equipmentSalesApi.uploadDocument,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries([EQUIPMENT_SALES_QUERY_KEYS.documents, String(variables.quotationId)])
    }
  })

  const downloadDocument = useMutation({
    mutationFn: equipmentSalesApi.downloadDocument
  })

  const createProduct = useMutation({
    mutationFn: equipmentSalesApi.createProduct,
    onSuccess: () => queryClient.invalidateQueries([EQUIPMENT_SALES_QUERY_KEYS.products])
  })

  const updateProduct = useMutation({
    mutationFn: equipmentSalesApi.updateProduct,
    onSuccess: () => queryClient.invalidateQueries([EQUIPMENT_SALES_QUERY_KEYS.products])
  })

  const deleteProduct = useMutation({
    mutationFn: equipmentSalesApi.deleteProduct,
    onSuccess: () => queryClient.invalidateQueries([EQUIPMENT_SALES_QUERY_KEYS.products])
  })

  const saveQuoteTermsTemplate = useMutation({
    mutationFn: equipmentSalesApi.upsertQuoteTermsTemplate,
    onSuccess: () => queryClient.invalidateQueries([EQUIPMENT_SALES_QUERY_KEYS.quoteTermsTemplate])
  })

  const upsertSequenceConfig = useMutation({
    mutationFn: equipmentSalesApi.upsertSequenceConfig,
    onSuccess: () => queryClient.invalidateQueries([EQUIPMENT_SALES_QUERY_KEYS.sequenceConfig])
  })

  return {
    createQuotation,
    updateQuotation,
    requestApproval,
    approveQuotation,
    rejectQuotation,
    requestChanges,
    readyForInvoice,
    invoiceQuotation,
    cancelQuotation,
    generateQuotePdf,
    uploadDocument,
    downloadDocument,
    createProduct,
    updateProduct,
    deleteProduct,
    saveQuoteTermsTemplate,
    upsertSequenceConfig
  }
}

// --- Clientes del workspace de cotizaciones de equipos ---

export const EQUIPMENT_SALES_CUSTOMERS_QUERY_KEY = ['equipment-sales-customers'] as const

export const useEquipmentSalesCustomers = (enabled: boolean) => {
  return useQuery({
    queryKey: EQUIPMENT_SALES_CUSTOMERS_QUERY_KEY,
    queryFn: async () => {
      const response = await axiosPrivate.get<EquipmentCustomerOption[]>('/customers')
      return response.data
    },
    enabled,
    staleTime: 5 * 60 * 1000
  })
}

/** Crea un cliente (con su primera sede) y lo agrega a la caché de clientes */
export const useCreateEquipmentSalesCustomer = (
  onCreated?: (customer: EquipmentCustomerOption) => void
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: EquipmentSalesCustomerDialogValues) => {
      const response = await axiosPrivate.post<{ customer: EquipmentCustomerOption }>(
        '/customers',
        {
          ...values.customer,
          direccion: values.customer.direccion || values.site.address || '',
          ciudad: values.customer.ciudad || values.site.city || '',
          departamento: values.customer.departamento || values.site.department || '',
          email: values.customer.email || values.site.contactEmail || '',
          telefono: values.customer.telefono || values.site.contactPhone || '',
          pais: values.customer.pais || values.site.country || 'Colombia',
          sites: [values.site]
        }
      )
      return response.data.customer
    },
    onSuccess: (customer) => {
      queryClient.setQueryData<EquipmentCustomerOption[]>(
        EQUIPMENT_SALES_CUSTOMERS_QUERY_KEY,
        (previous = []) => {
          const withoutDuplicate = previous.filter((item) => item.id !== customer.id)
          return [...withoutDuplicate, customer].sort((left, right) =>
            left.nombre.localeCompare(right.nombre)
          )
        }
      )
      onCreated?.(customer)
    }
  })
}

/** Crea una sede para un cliente existente y actualiza la caché de clientes */
export const useCreateEquipmentSalesCustomerSite = (
  onCreated?: (customer: EquipmentCustomerOption) => void
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      customerId,
      values
    }: {
      customerId?: number
      values: EquipmentSalesCustomerDialogValues
    }) => {
      if (!customerId) {
        throw new Error('Selecciona un cliente antes de crear la sede.')
      }
      const response = await axiosPrivate.post<EquipmentCustomerOption>(
        `/customers/${customerId}/sedes`,
        values.site
      )
      return response.data
    },
    onSuccess: (customer) => {
      queryClient.setQueryData<EquipmentCustomerOption[]>(
        EQUIPMENT_SALES_CUSTOMERS_QUERY_KEY,
        (previous = []) =>
          previous.map((item) => (item.id === customer.id ? customer : item))
      )
      onCreated?.(customer)
    }
  })
}
