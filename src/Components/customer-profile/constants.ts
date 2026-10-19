import { StatusFilter, TabValue } from './types'

export const STATUS_FILTERS: StatusFilter[] = ['expired', 'upcoming', 'active']

export const STATUS_LABELS: Record<StatusFilter, string> = {
  expired: 'Vencidos',
  upcoming: 'Próximos a vencer',
  active: 'Activos'
}

export const VALID_TABS: TabValue[] = [
  'overview',
  'equipment',
  'headquarters',
  'schedule',
  'users',
  'modules',
  'lmsCourses'
]

export const DEFAULT_AVATAR = '/images/pngaaa.com-4811116.png'

export const minioUrl = import.meta.env.VITE_MINIO_URL

export const customerProfileKeys = {
  customer: (id?: string) => ['customer-data', id] as const,
  certificatesAll: (id?: string) => ['certificates-data', id] as const,
  certificates: (
    id: string | undefined,
    searchTerm: string,
    currentPage: number,
    statusFilter: StatusFilter | null
  ) =>
    ['certificates-data', id, searchTerm, currentPage, statusFilter] as const,
  lmsCourses: (id?: string) => ['customer-lms-courses', id] as const
}
