import { useMutation, useQuery, useQueryClient } from 'react-query'
import { axiosPrivate } from '@utils/api'
import {
  EquipmentQuotation,
  EquipmentQuotationListResponse,
  EquipmentQuotationPayload,
  EquipmentProduct,
  EquipmentProductListResponse,
  EquipmentProductPayload
} from '../types/equipmentSales'

export const EQUIPMENT_SALES_QUERY_KEYS = {
  all: 'equipment-sales',
  quotations: 'equipment-quotations',
  quotation: 'equipment-quotation',
  products: 'equipment-products',
  quoteTermsTemplate: 'equipment-quote-terms-template'
} as const

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
  sendQuotation: async (id: number | string): Promise<EquipmentQuotation> => {
    const { data } = await axiosPrivate.post<EquipmentQuotation>(`/equipment-sales/${id}/send`)
    return data
  },
  acceptQuotation: async (id: number | string): Promise<EquipmentQuotation> => {
    const { data } = await axiosPrivate.post<EquipmentQuotation>(`/equipment-sales/${id}/accept`)
    return data
  },
  markAsReadyForInvoice: async (id: number | string): Promise<EquipmentQuotation> => {
    const { data } = await axiosPrivate.post<EquipmentQuotation>(`/equipment-sales/${id}/ready-for-invoicing`)
    return data
  },
  rejectQuotation: async (id: number | string, reason?: string): Promise<EquipmentQuotation> => {
    const { data } = await axiosPrivate.post<EquipmentQuotation>(`/equipment-sales/${id}/reject`, { reason })
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

export const useEquipmentSalesMutations = () => {
  const queryClient = useQueryClient()

  const invalidateAll = () => {
    queryClient.invalidateQueries([EQUIPMENT_SALES_QUERY_KEYS.quotations])
    queryClient.invalidateQueries([EQUIPMENT_SALES_QUERY_KEYS.quotation])
  }

  const createQuotation = useMutation({
    mutationFn: equipmentSalesApi.createQuotation,
    onSuccess: () => invalidateAll()
  })

  const updateQuotation = useMutation({
    mutationFn: equipmentSalesApi.updateQuotation,
    onSuccess: () => invalidateAll()
  })

  const sendQuotation = useMutation({
    mutationFn: equipmentSalesApi.sendQuotation,
    onSuccess: () => invalidateAll()
  })

  const acceptQuotation = useMutation({
    mutationFn: equipmentSalesApi.acceptQuotation,
    onSuccess: () => invalidateAll()
  })

  const readyForInvoice = useMutation({
    mutationFn: equipmentSalesApi.markAsReadyForInvoice,
    onSuccess: () => invalidateAll()
  })

  const rejectQuotation = useMutation({
    mutationFn: ({ id, reason }: { id: number | string; reason?: string }) =>
      equipmentSalesApi.rejectQuotation(id, reason),
    onSuccess: () => invalidateAll()
  })

  const invoiceQuotation = useMutation({
    mutationFn: equipmentSalesApi.invoiceQuotation,
    onSuccess: () => invalidateAll()
  })

  const cancelQuotation = useMutation({
    mutationFn: ({ id, reason }: { id: number | string; reason?: string }) =>
      equipmentSalesApi.cancelQuotation(id, reason),
    onSuccess: () => invalidateAll()
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

  return {
    createQuotation,
    updateQuotation,
    sendQuotation,
    acceptQuotation,
    readyForInvoice,
    rejectQuotation,
    invoiceQuotation,
    cancelQuotation,
    createProduct,
    updateProduct,
    deleteProduct,
    saveQuoteTermsTemplate
  }
}
