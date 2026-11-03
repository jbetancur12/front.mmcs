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
  /** La versión se publicó con su archivo original editable (Word o Excel). */
  hasSource: boolean
  sourceName?: string | null
  sourceSize?: number | null
  createdAt: string
  uploader?: { id: number; nombre: string } | null
  /** Archivos reemplazados en esta versión (solo viene en el historial), el más reciente primero. */
  replacements?: LibraryReplacement[]
}

export interface LibraryReplacement {
  id: number
  createdAt: string
  replacer?: { id: number; nombre: string } | null
  /** Nombre del PDF que se reemplazó, si se cambió el PDF. */
  previousFileName?: string | null
  /** Nombre del original editable que se reemplazó, si se cambió. */
  previousSourceName?: string | null
}

export interface LibraryDocumentForm {
  name: string
  version: string
  documentDate: string
  file: File | null
  /** Archivo original editable; opcional. */
  source: File | null
}

export const LIBRARY_SOURCE_ACCEPT = '.doc,.docx,.xls,.xlsx'
