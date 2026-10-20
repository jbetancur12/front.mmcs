import { useMutation, useQuery, useQueryClient } from 'react-query'
import { axiosPrivate, axiosPublic } from '@utils/api'
import {
  AuditEntry,
  Compliance,
  CustomerEquipment,
  CustomerSite,
  EquipmentActivity,
  EquipmentDetail,
  EquipmentPayload,
  InvimaAlert,
  InvimaAlertMatch,
  Paged,
  PublicEquipment,
  QuarterlyReport,
  SurveillanceAction,
  SurveillanceAnalysis,
  SurveillanceProgram,
  SurveillanceReport,
  TechCustomer,
  TechDashboard
} from 'src/types/techManagement'

// Datos del módulo de Gestión tecnológica y tecnovigilancia (api.mmcs: /tech-management).

const BASE = '/tech-management'
const forCustomer = (customerId: number | string) => `${BASE}/customers/${customerId}`

export const TECH_KEYS = {
  all: 'tech-management',
  customers: ['tech-management', 'customers'],
  customer: (customerId: number | string) => ['tech-management', 'customer', String(customerId)],
  dashboard: (customerId: number | string, params?: object) => [
    'tech-management',
    'customer',
    String(customerId),
    'dashboard',
    params || {}
  ],
  equipment: (customerId: number | string, params?: object) => [
    'tech-management',
    'customer',
    String(customerId),
    'equipment',
    params || {}
  ],
  alerts: (params?: object) => ['tech-management', 'alerts', params || {}]
}

/** Mensaje de error de la API ({ error } o { message }) o uno genérico. */
export const techErrorMessage = (error: unknown, fallback = 'Ocurrió un error') => {
  const data = (error as { response?: { data?: { error?: string; message?: string } } })?.response?.data
  return data?.error || data?.message || fallback
}

/** Descarga un archivo binario autenticado (PDF, evidencia, certificado). */
export const downloadFile = async (url: string, filename: string, params?: Record<string, unknown>) => {
  const response = await axiosPrivate.get<Blob>(url, { params, responseType: 'blob' })
  const href = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = href
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  window.URL.revokeObjectURL(href)
  document.body.removeChild(link)
}

const get = async <T>(url: string, params?: object): Promise<T> => (await axiosPrivate.get<T>(url, { params })).data

/** Invalida todo lo de una empresa (inventario, cronograma, tablero, reportes...). */
const useInvalidateCustomer = (customerId: number | string) => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries(TECH_KEYS.customer(customerId))
}

// ---------- Empresas y tablero

export const useTechCustomers = () =>
  useQuery(TECH_KEYS.customers, () => get<TechCustomer[]>(`${BASE}/customers`))

export const useTechDashboard = (customerId: number | string, params: { from?: string; to?: string } = {}) =>
  useQuery(TECH_KEYS.dashboard(customerId, params), () => get<TechDashboard>(`${forCustomer(customerId)}/dashboard`, params))

export const useTechCompliance = (customerId: number | string, params: Record<string, string | undefined>) =>
  useQuery([...TECH_KEYS.customer(customerId), 'compliance', params], () =>
    get<Compliance>(`${forCustomer(customerId)}/compliance`, params)
  )

// ---------- Inventario

export interface EquipmentQuery {
  page?: number
  pageSize?: number
  search?: string
  scheduleStatus?: string
  riskClass?: string
  sede?: string
  service?: string
  status?: string
}

export const useEquipmentList = (customerId: number | string, params: EquipmentQuery) =>
  useQuery(
    TECH_KEYS.equipment(customerId, params),
    () => get<Paged<CustomerEquipment>>(`${forCustomer(customerId)}/equipment`, params),
    { keepPreviousData: true }
  )

export const useEquipmentFilters = (customerId: number | string) =>
  useQuery([...TECH_KEYS.customer(customerId), 'equipment-filters'], () =>
    get<{ sedes: string[]; services: string[]; sites: CustomerSite[] }>(`${forCustomer(customerId)}/equipment/filters`)
  )

export const useEquipmentDetail = (customerId: number | string, id: number | string) =>
  useQuery([...TECH_KEYS.customer(customerId), 'equipment-detail', String(id)], () =>
    get<EquipmentDetail>(`${forCustomer(customerId)}/equipment/${id}`)
  )

export const useSaveEquipment = (customerId: number | string) => {
  const invalidate = useInvalidateCustomer(customerId)
  return useMutation(
    async ({ id, payload }: { id?: number; payload: EquipmentPayload }) =>
      id
        ? (await axiosPrivate.put<CustomerEquipment>(`${forCustomer(customerId)}/equipment/${id}`, payload)).data
        : (await axiosPrivate.post<CustomerEquipment>(`${forCustomer(customerId)}/equipment`, payload)).data,
    { onSuccess: invalidate }
  )
}

export const useDeleteEquipment = (customerId: number | string) => {
  const invalidate = useInvalidateCustomer(customerId)
  return useMutation((id: number) => axiosPrivate.delete(`${forCustomer(customerId)}/equipment/${id}`), {
    onSuccess: invalidate
  })
}

export const useImportEquipment = (customerId: number | string) => {
  const invalidate = useInvalidateCustomer(customerId)
  return useMutation(
    async (rows: EquipmentPayload[]) =>
      (
        await axiosPrivate.post<{ created: number; updated: number; errors: { row: number; message: string }[] }>(
          `${forCustomer(customerId)}/equipment/import`,
          { rows }
        )
      ).data,
    { onSuccess: invalidate }
  )
}

export const useSyncCertificates = (customerId: number | string) => {
  const invalidate = useInvalidateCustomer(customerId)
  return useMutation(
    async () => (await axiosPrivate.post(`${forCustomer(customerId)}/equipment/sync-certificates`)).data,
    { onSuccess: invalidate }
  )
}

export const useRegenerateQr = (customerId: number | string) => {
  const invalidate = useInvalidateCustomer(customerId)
  return useMutation(
    async (id: number) => (await axiosPrivate.post<CustomerEquipment>(`${forCustomer(customerId)}/equipment/${id}/qr`)).data,
    { onSuccess: invalidate }
  )
}

export const useServiceRequest = (customerId: number | string) =>
  useMutation(
    async (payload: { customerEquipmentIds: number[]; message: string }) =>
      (await axiosPrivate.post<{ sent: boolean; equipment: number }>(
        `${forCustomer(customerId)}/equipment/service-request`,
        payload
      )).data
  )

// ---------- Cronograma

export interface ActivityQuery {
  page?: number
  pageSize?: number
  type?: string
  status?: string
  overdue?: string
  from?: string
  to?: string
  customerEquipmentId?: number
}

export const useActivities = (customerId: number | string, params: ActivityQuery) =>
  useQuery(
    [...TECH_KEYS.customer(customerId), 'activities', params],
    () => get<Paged<EquipmentActivity>>(`${forCustomer(customerId)}/activities`, params),
    { keepPreviousData: true }
  )

export const useScheduleActivity = (customerId: number | string) => {
  const invalidate = useInvalidateCustomer(customerId)
  return useMutation(
    async (payload: { customerEquipmentIds: number[]; type: string; dueDate: string; notes?: string }) =>
      payload.customerEquipmentIds.length === 1
        ? (
            await axiosPrivate.post(`${forCustomer(customerId)}/activities`, {
              customerEquipmentId: payload.customerEquipmentIds[0],
              type: payload.type,
              dueDate: payload.dueDate,
              notes: payload.notes
            })
          ).data
        : (await axiosPrivate.post(`${forCustomer(customerId)}/activities/bulk`, payload)).data,
    { onSuccess: invalidate }
  )
}

export const useUpdateActivity = (customerId: number | string) => {
  const invalidate = useInvalidateCustomer(customerId)
  return useMutation(
    async ({ id, payload }: { id: number; payload: Partial<EquipmentActivity> }) =>
      (await axiosPrivate.put(`${forCustomer(customerId)}/activities/${id}`, payload)).data,
    { onSuccess: invalidate }
  )
}

export const useDeleteActivity = (customerId: number | string) => {
  const invalidate = useInvalidateCustomer(customerId)
  return useMutation((id: number) => axiosPrivate.delete(`${forCustomer(customerId)}/activities/${id}`), {
    onSuccess: invalidate
  })
}

export interface ExecutePayload {
  activityId?: number
  customerEquipmentId?: number
  type?: string
  executedAt: string
  result: string
  origin: string
  provider?: string
  notes?: string
  nextDueDate?: string
  evidence?: File | null
}

export const useExecuteActivity = (customerId: number | string) => {
  const invalidate = useInvalidateCustomer(customerId)
  return useMutation(
    async ({ activityId, evidence, ...fields }: ExecutePayload) => {
      const form = new FormData()
      Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') form.append(key, String(value))
      })
      if (evidence) form.append('evidence', evidence)
      const url = activityId
        ? `${forCustomer(customerId)}/activities/${activityId}/execute`
        : `${forCustomer(customerId)}/activities/execute`
      return (await axiosPrivate.post<EquipmentActivity>(url, form)).data
    },
    { onSuccess: invalidate }
  )
}

// ---------- Tecnovigilancia

export const useProgram = (customerId: number | string) =>
  useQuery([...TECH_KEYS.customer(customerId), 'program'], () =>
    get<SurveillanceProgram>(`${forCustomer(customerId)}/program`)
  )

export const useSaveProgram = (customerId: number | string) => {
  const invalidate = useInvalidateCustomer(customerId)
  return useMutation(
    async (payload: SurveillanceProgram) => (await axiosPrivate.put(`${forCustomer(customerId)}/program`, payload)).data,
    { onSuccess: invalidate }
  )
}

export const useReports = (customerId: number | string, params: Record<string, string | number | undefined>) =>
  useQuery(
    [...TECH_KEYS.customer(customerId), 'reports', params],
    () => get<Paged<SurveillanceReport>>(`${forCustomer(customerId)}/reports`, params),
    { keepPreviousData: true }
  )

export const useReport = (customerId: number | string, id: number | null) =>
  useQuery(
    [...TECH_KEYS.customer(customerId), 'report', String(id)],
    () => get<SurveillanceReport>(`${forCustomer(customerId)}/reports/${id}`),
    { enabled: !!id }
  )

export const useSaveReport = (customerId: number | string) => {
  const invalidate = useInvalidateCustomer(customerId)
  return useMutation(
    async ({ id, payload }: { id?: number; payload: Partial<SurveillanceReport> }) =>
      id
        ? (await axiosPrivate.put<SurveillanceReport>(`${forCustomer(customerId)}/reports/${id}`, payload)).data
        : (await axiosPrivate.post<SurveillanceReport>(`${forCustomer(customerId)}/reports`, payload)).data,
    { onSuccess: invalidate }
  )
}

export const useDeleteReport = (customerId: number | string) => {
  const invalidate = useInvalidateCustomer(customerId)
  return useMutation((id: number) => axiosPrivate.delete(`${forCustomer(customerId)}/reports/${id}`), {
    onSuccess: invalidate
  })
}

export const useSaveAnalysis = (customerId: number | string) => {
  const invalidate = useInvalidateCustomer(customerId)
  return useMutation(
    async ({ reportId, payload }: { reportId: number; payload: SurveillanceAnalysis }) =>
      (await axiosPrivate.put(`${forCustomer(customerId)}/reports/${reportId}/analysis`, payload)).data,
    { onSuccess: invalidate }
  )
}

export const useSaveAction = (customerId: number | string) => {
  const invalidate = useInvalidateCustomer(customerId)
  return useMutation(
    async ({ reportId, id, payload }: { reportId: number; id?: number; payload: Partial<SurveillanceAction> }) =>
      id
        ? (await axiosPrivate.put(`${forCustomer(customerId)}/reports/${reportId}/actions/${id}`, payload)).data
        : (await axiosPrivate.post(`${forCustomer(customerId)}/reports/${reportId}/actions`, payload)).data,
    { onSuccess: invalidate }
  )
}

export const useDeleteAction = (customerId: number | string) => {
  const invalidate = useInvalidateCustomer(customerId)
  return useMutation(
    ({ reportId, id }: { reportId: number; id: number }) =>
      axiosPrivate.delete(`${forCustomer(customerId)}/reports/${reportId}/actions/${id}`),
    { onSuccess: invalidate }
  )
}

export const useQuarterly = (customerId: number | string, year: number, quarter: number) =>
  useQuery([...TECH_KEYS.customer(customerId), 'quarterly', year, quarter], () =>
    get<QuarterlyReport>(`${forCustomer(customerId)}/reports/quarterly`, { year, quarter })
  )

export const usePendingReviews = (customerId: number | string) =>
  useQuery([...TECH_KEYS.customer(customerId), 'reviews'], () =>
    get<EquipmentActivity[]>(`${forCustomer(customerId)}/reviews`)
  )

export const useAnswerReview = (customerId: number | string) => {
  const invalidate = useInvalidateCustomer(customerId)
  return useMutation(
    async ({ activityId, affected }: { activityId: number; affected: boolean }) =>
      (
        await axiosPrivate.post<{ report: SurveillanceReport | null }>(
          `${forCustomer(customerId)}/reviews/${activityId}`,
          { affected }
        )
      ).data,
    { onSuccess: invalidate }
  )
}

// ---------- Alertas INVIMA

export const useInvimaAlerts = (params: Record<string, string | number | undefined>) =>
  useQuery(TECH_KEYS.alerts(params), () => get<Paged<InvimaAlert>>(`${BASE}/alerts`, params), {
    keepPreviousData: true
  })

export const useSaveInvimaAlert = () => {
  const queryClient = useQueryClient()
  return useMutation(
    async ({ id, payload }: { id?: number; payload: Partial<InvimaAlert> }) =>
      id
        ? (await axiosPrivate.put<{ alert: InvimaAlert; matches: number }>(`${BASE}/alerts/${id}`, payload)).data
        : (await axiosPrivate.post<{ alert: InvimaAlert; matches: number }>(`${BASE}/alerts`, payload)).data,
    { onSuccess: () => queryClient.invalidateQueries(TECH_KEYS.all) }
  )
}

export const useDeleteInvimaAlert = () => {
  const queryClient = useQueryClient()
  return useMutation((id: number) => axiosPrivate.delete(`${BASE}/alerts/${id}`), {
    onSuccess: () => queryClient.invalidateQueries(TECH_KEYS.all)
  })
}

export const useAlertMatches = (customerId: number | string, params: Record<string, string | number | undefined>) =>
  useQuery([...TECH_KEYS.customer(customerId), 'alert-matches', params], () =>
    get<Paged<InvimaAlertMatch>>(`${forCustomer(customerId)}/alert-matches`, params)
  )

export const useRematchAlerts = (customerId: number | string) => {
  const invalidate = useInvalidateCustomer(customerId)
  return useMutation(
    async () => (await axiosPrivate.post<{ created: number }>(`${forCustomer(customerId)}/alert-matches/rematch`)).data,
    { onSuccess: invalidate }
  )
}

export const useUpdateAlertMatch = (customerId: number | string) => {
  const invalidate = useInvalidateCustomer(customerId)
  return useMutation(
    async ({ id, payload }: { id: number; payload: { status: string; actionTaken?: string } }) =>
      (await axiosPrivate.put(`${forCustomer(customerId)}/alert-matches/${id}`, payload)).data,
    { onSuccess: invalidate }
  )
}

// ---------- Bitácora

export const useAuditLog = (customerId: number | string, params: { page: number; pageSize: number }) =>
  useQuery(
    [...TECH_KEYS.customer(customerId), 'audit', params],
    () => get<Paged<AuditEntry>>(`${forCustomer(customerId)}/audit-log`, params),
    { keepPreviousData: true }
  )

// ---------- Página pública del QR (sin sesión)

export const usePublicEquipment = (token: string) =>
  useQuery(['tech-public-equipment', token], async () => (await axiosPublic.get<PublicEquipment>(`/public/tech-equipment/${token}`)).data, {
    retry: false
  })

export const usePublicFailureReport = (token: string) =>
  useMutation(
    async (payload: { description: string; reporterName?: string; service?: string; patientAffected?: boolean }) =>
      (await axiosPublic.post<{ code: string }>(`/public/tech-equipment/${token}/failure`, payload)).data
  )

export const techPaths = {
  downloadFile,
  programPdf: (customerId: number | string) => `${forCustomer(customerId)}/program/pdf`,
  quarterlyPdf: (customerId: number | string) => `${forCustomer(customerId)}/reports/quarterly/pdf`,
  visitFolder: (customerId: number | string) => `${forCustomer(customerId)}/visit-folder`,
  evidence: (customerId: number | string, activityId: number) => `${forCustomer(customerId)}/activities/${activityId}/evidence`
}
