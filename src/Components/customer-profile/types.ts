export interface CustomerProfileData {
  nombre: string
  email: string
  telefono: string
  avatar?: string
  sede: string[]
  isActive: boolean
}

export interface Certificate {
  id: number
  name: string
  city: string
  location: string
  sede: string
  activoFijo: string
  serie: string
  calibrationDate: string
  nextCalibrationDate: string
  filePath: string
  customerId: number
  deviceId: number
  certificateTypeId: number
  createdAt: string
  updatedAt: string
  headquarter: string
  device: {
    id: number
    name: string
    createdAt: string
    updatedAt: string
  }
  searchMatches?: { field: string }[]
}

export type StatusFilter = 'expired' | 'upcoming' | 'active'

export interface CertificatesApiResponse {
  totalFiles: number
  totalPages: number
  currentPage: number
  files: Certificate[]
  searchInfo?: {
    term: string
    searchableFields: string[]
  }
  statistics: {
    expired: number
    expiringSoon: number
    active: number
    total: number
  }
}

export type TabValue =
  | 'overview'
  | 'equipment'
  | 'indicators'
  | 'services'
  | 'headquarters'
  | 'schedule'
  | 'users'
  | 'modules'
  | 'lmsCourses'

export type CustomerLmsCourse = {
  id: number
  title: string
  description: string
  status: 'draft' | 'published' | 'archived'
  audience: 'client' | 'both'
  all_clients: boolean
  isAssignedToCustomer: boolean
}

export type CustomerLmsCoursesResponse = {
  customer: {
    id: number
    nombre: string
    isActive: boolean
  }
  visibleCourses: CustomerLmsCourse[]
  assignableCourses: CustomerLmsCourse[]
}

export interface CustomerStats {
  total: number
  expired: number
  upcoming: number
  active: number
}

export type DownloadFilter = 'all' | 'nextOrExpired'
