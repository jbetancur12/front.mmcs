export type LibraryCategory = 'management' | 'technical'

export const LIBRARY_CATEGORY_LABELS: Record<LibraryCategory, string> = {
  management: 'Documentos de gestión',
  technical: 'Documentos técnicos'
}

export interface LibraryDocument {
  id: number
  groupKey: string
  category: LibraryCategory
  name: string
  version: string
  /** Fecha del documento, `yyyy-MM-dd`. */
  documentDate: string
  fileName: string
  fileSize: number
  isCurrent: boolean
  createdAt: string
  uploader?: { id: number; nombre: string } | null
}

export interface LibraryDocumentForm {
  name: string
  version: string
  documentDate: string
  file: File | null
}
