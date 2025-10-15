// Enhanced Template Types with additional metadata

export interface TemplateData {
  name: string
  description: string
  password: string
  city: string
  location: string
  sede: string
  activoFijo: string
  serie: string
  solicitante: string
  instrumento: string
  calibrationDate: string
}

export interface TemplatesData extends TemplateData {
  id: number
  created_at: Date
  updated_at: Date
  duplicated_from?: number // Reference to original template for duplicates
}

export interface TemplateFormData extends TemplateData {
  // Form-specific validation states can be added here
}

export interface ErrorState {
  type: 'network' | 'validation' | 'server' | 'unknown'
  message: string
  field?: string
  code?: string
}

export interface TemplateValidationErrors {
  [fieldName: string]: string
}
