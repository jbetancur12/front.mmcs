export type ReleaseStatus =
  | 'pendiente_revision'
  | 'requiere_ajustes'
  | 'verificado'
  | 'firmado'
  | 'liberado'
  | 'descartado'

export type ReleaseKind = 'principal' | 'anexo' | 'tercero'

export type ReleaseReadStatus = 'ok' | 'parcial' | 'fallida'

export const RELEASE_STATUS_LABELS: Record<ReleaseStatus, string> = {
  pendiente_revision: 'Pendiente de revisión',
  requiere_ajustes: 'Requiere ajustes',
  verificado: 'Verificado',
  firmado: 'Firmado',
  liberado: 'Liberado',
  descartado: 'Descartado'
}

export const RELEASE_KIND_LABELS: Record<ReleaseKind, string> = {
  principal: 'Principal',
  anexo: 'Anexo',
  tercero: 'De tercero'
}

export const RELEASE_READ_LABELS: Record<ReleaseReadStatus, string> = {
  ok: 'Lectura completa',
  parcial: 'Lectura parcial',
  fallida: 'No se pudo leer'
}

export interface ReleaseAnomaly {
  code: string
  field?: string
  message: string
}

export interface ReleaseUserRef {
  id: number
  nombre: string
}

export interface ReleaseCertificate {
  id: number
  status: ReleaseStatus
  kind: ReleaseKind
  parentId: number | null
  documentType: string | null
  documentNumber: string | null
  magnitude: string | null
  instrument: string | null
  manufacturer: string | null
  model: string | null
  serie: string | null
  activoFijo: string | null
  location: string | null
  customerName: string | null
  customerAddress: string | null
  /** `yyyy-MM-dd` */
  calibrationDate: string | null
  issueDate: string | null
  anomalies: ReleaseAnomaly[]
  readStatus: ReleaseReadStatus
  customerId: number | null
  serviceId?: number | null
  cutId?: number | null
  currentVersionId: number | null
  signedAt?: string | null
  releasedAt?: string | null
  driveStatus?: 'pendiente' | 'copiado' | 'error' | null
  driveError?: string | null
  drivePath?: string | null
  driveCopiedAt?: string | null
  fileId?: number | null
  createdAt: string
  uploader?: ReleaseUserRef | null
  customer?: { id: number; nombre: string } | null
  /** Servicio de calibración (ODS) al que pertenece, si se ligó. */
  service?: {
    id: number
    serviceCode: string
    status: string
    cuts?: ReleaseServiceCut[]
  } | null
  /** Corte del servicio al que pertenece, si se ligó. */
  cut?: { id: number; cutCode: string } | null
}

export interface ReleaseServiceCut {
  id: number
  cutCode: string
  cutType?: string
  status?: string
}

/** Servicio que se puede elegir al ligar un certificado. */
export interface ReleaseServiceOption {
  id: number
  serviceCode: string
  status: string
  customerId: number | null
  customerName: string | null
  certificates: { total: number; released: number }
  cuts?: ReleaseServiceCut[]
  /** Con un cliente de referencia: si el servicio es de ese mismo cliente. */
  sameCustomer?: boolean | null
}

export interface ReleaseVersion {
  id: number
  versionNumber: number
  originalName: string
  fileSize: number
  createdAt: string
  uploader?: ReleaseUserRef | null
}

export interface ReleaseHistoryEntry {
  id: number
  fromStatus: ReleaseStatus | null
  toStatus: ReleaseStatus
  observation: string | null
  reasons?: string[] | null
  createdAt: string
  user?: ReleaseUserRef | null
}

export interface ReleaseCertificateDetail extends ReleaseCertificate {
  versions: ReleaseVersion[]
  history: ReleaseHistoryEntry[]
  annexes?: {
    id: number
    documentNumber: string | null
    status: ReleaseStatus
  }[]
  parent?: {
    id: number
    documentNumber: string | null
    status: ReleaseStatus
  } | null
  detected?: { calibrationDates?: string[]; range?: string | null } | null
}

export interface ReleaseListResponse {
  items: ReleaseCertificate[]
  total: number
  page: number
  limit: number
  counts: Record<ReleaseStatus, number>
}

export interface ReleaseFilters {
  status?: ReleaseStatus
  kind?: ReleaseKind | ''
  customerId?: number | null
  withoutCustomer?: boolean
  uploadedBy?: number | null
  search?: string
  withAnomalies?: boolean
  page: number
  limit: number
}

export interface ReleaseUploadResult {
  fileName: string
  ok: boolean
  error?: string
  certificate?: ReleaseCertificate
}

export interface ReleaseEquipmentCandidate {
  id: number
  deviceId: number
  deviceName: string | null
  serie: string | null
  activoFijo: string | null
  location: string | null
  sede: string | null
  city: string | null
  calibrationDate: string | null
  nextCalibrationDate: string | null
  suggestedMonths: 6 | 12
  matchBy: 'serie' | 'activo_fijo' | 'ubicacion' | 'mismo_tipo' | 'manual'
  confidence: 'alta' | 'media' | 'baja'
  typeMatches: boolean | null
  /** El certificado y el equipo no traen la misma serie. */
  serieDiffers: boolean
  certificateTypeName?: string | null
  /** Es el registro de la otra clase (calibración vs. seguridad eléctrica): no se puede actualizar con este certificado. */
  otherCertificateType?: boolean
}

export interface ReleaseEquipmentMatches {
  certificateId: number
  candidates: ReleaseEquipmentCandidate[]
  sameType: ReleaseEquipmentCandidate[]
  deviceSuggestions: { id: number; name: string; source: string }[]
  prefill: {
    deviceId: number | null
    certificateTypeId: number | null
    city: string
    headquarter: string
    copiedFrom: { id: number; certificateTypeName: string | null } | null
    serie: string
    activoFijo: string
    location: string
    sede: string
    months: 6 | 12
  }
}

export interface ReleaseCatalogs {
  devices: { id: number; name: string; magnitude?: string | null }[]
  certificateTypes: { id: number; name: string }[]
}

export interface ReleaseNewEquipment {
  deviceId: number | ''
  certificateTypeId: number | ''
  city: string
  location: string
  sede: string
  headquarter: string
  activoFijo: string
  serie: string
}

export type ReleaseTarget =
  | { mode: 'existing'; fileId: number; months: 6 | 12; updateSerie?: boolean }
  | ({ mode: 'new'; months: 6 | 12 } & ReleaseNewEquipment)

export const RELEASE_MATCH_LABELS: Record<
  ReleaseEquipmentCandidate['matchBy'],
  string
> = {
  serie: 'Misma serie',
  activo_fijo: 'Mismo activo fijo',
  ubicacion: 'Misma ubicación',
  mismo_tipo: 'Mismo tipo de equipo',
  manual: 'Elegido a mano'
}

/** Firma de una persona del laboratorio en el registro. */
export interface ReleaseSignatory {
  id: number
  name: string
  role: string | null
  active: boolean
  mimeType: string
}

/** Una firma o el sello en el documento. `x`, `y` (esquina superior izquierda) y `w` son fracciones de la página. */
export interface ReleasePlacement {
  type: 'signature' | 'seal'
  signatoryId?: number
  /** Desde 1; -1 es la última. */
  page: number
  x: number
  y: number
  w: number
}

export interface ReleaseSignPlan {
  certificateId: number
  documentNumber: string | null
  pages: { width: number; height: number }[]
  category: { key: string; label: string }
  /** De dónde sale la posición propuesta. */
  source: 'layout' | 'names' | 'none'
  placements: ReleasePlacement[]
  signatories: ReleaseSignatory[]
}
