// Comprehensive validation schema for Excel cell references
import { TemplateData, TemplateValidationErrors } from './types'

// Excel cell reference pattern (e.g., A1, B5, AA10, Z999)
const EXCEL_CELL_PATTERN = /^[A-Z]{1,3}[1-9]\d*$/

// Validation rules for template fields
export const validateTemplateData = (
  data: TemplateData
): TemplateValidationErrors => {
  const errors: TemplateValidationErrors = {}

  // Name validation
  if (!data.name.trim()) {
    errors.name = 'El nombre de la plantilla es requerido'
  } else if (data.name.length < 3) {
    errors.name = 'El nombre debe tener al menos 3 caracteres'
  } else if (data.name.length > 100) {
    errors.name = 'El nombre no puede exceder 100 caracteres'
  } else if (!/^[a-zA-Z0-9\s\-_áéíóúñÁÉÍÓÚÑ]+$/.test(data.name)) {
    errors.name =
      'El nombre solo puede contener letras, números, espacios y guiones'
  }

  // Description validation
  if (!data.description.trim()) {
    errors.description = 'La descripción es requerida'
  } else if (data.description.length < 10) {
    errors.description = 'La descripción debe tener al menos 10 caracteres'
  } else if (data.description.length > 500) {
    errors.description = 'La descripción no puede exceder 500 caracteres'
  }

  // Password validation (optional but if provided, must meet criteria)
  if (data.password && data.password.length > 0) {
    if (data.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres'
    } else if (data.password.length > 50) {
      errors.password = 'La contraseña no puede exceder 50 caracteres'
    }
  }

  // Excel cell reference validations
  const cellFields = [
    { field: 'city', label: 'Ciudad' },
    { field: 'location', label: 'Ubicación' },
    { field: 'sede', label: 'Sede' },
    { field: 'solicitante', label: 'Solicitante' },
    { field: 'instrumento', label: 'Instrumento' }
  ] as const

  cellFields.forEach(({ field, label }) => {
    const value = data[field]
    if (!value.trim()) {
      errors[field] = `La referencia de celda para ${label} es requerida`
    } else if (!EXCEL_CELL_PATTERN.test(value.trim().toUpperCase())) {
      errors[field] =
        `Formato inválido. Use formato de celda Excel (ej: A1, B5, L14)`
    }
  })

  // Optional cell reference validations
  const optionalCellFields = [
    { field: 'activoFijo', label: 'Activo Fijo' },
    { field: 'serie', label: 'Serie' },
    { field: 'calibrationDate', label: 'Fecha de Calibración' }
  ] as const

  optionalCellFields.forEach(({ field }) => {
    const value = data[field]
    if (
      value &&
      value.trim() &&
      !EXCEL_CELL_PATTERN.test(value.trim().toUpperCase())
    ) {
      errors[field] =
        `Formato inválido. Use formato de celda Excel (ej: A1, B5, L14)`
    }
  })

  return errors
}

// Real-time field validation for individual fields
export const validateField = (
  fieldName: keyof TemplateData,
  value: string,
  allData?: TemplateData
): string | undefined => {
  const tempData = allData || ({} as TemplateData)
  const dataWithField = { ...tempData, [fieldName]: value }
  const errors = validateTemplateData(dataWithField)
  return errors[fieldName]
}

// Check for duplicate cell references within the same template
export const validateUniqueReferences = (
  data: TemplateData
): TemplateValidationErrors => {
  const errors: TemplateValidationErrors = {}
  const cellReferences: { [key: string]: string[] } = {}

  // Collect all non-empty cell references
  Object.entries(data).forEach(([field, value]) => {
    if (
      field !== 'name' &&
      field !== 'description' &&
      field !== 'password' &&
      value &&
      value.trim()
    ) {
      const normalizedRef = value.trim().toUpperCase()
      if (EXCEL_CELL_PATTERN.test(normalizedRef)) {
        if (!cellReferences[normalizedRef]) {
          cellReferences[normalizedRef] = []
        }
        cellReferences[normalizedRef].push(field)
      }
    }
  })

  // Check for duplicates
  Object.entries(cellReferences).forEach(([ref, fields]) => {
    if (fields.length > 1) {
      fields.forEach((field) => {
        errors[field as keyof TemplateData] =
          `La referencia ${ref} ya está siendo usada en otro campo`
      })
    }
  })

  return errors
}

// Comprehensive validation combining all rules
export const validateTemplateComprehensive = (
  data: TemplateData
): TemplateValidationErrors => {
  const basicErrors = validateTemplateData(data)
  const uniqueErrors = validateUniqueReferences(data)

  // Merge errors, giving priority to basic validation errors
  return { ...uniqueErrors, ...basicErrors }
}

// Helper function to format Excel cell references
export const formatCellReference = (value: string): string => {
  return value.trim().toUpperCase()
}

// Helper function to suggest valid cell references
export const suggestCellReferences = (currentRefs: string[]): string[] => {
  const suggestions = [
    'A1',
    'B1',
    'C1',
    'D1',
    'E1',
    'F1',
    'G1',
    'H1',
    'I1',
    'J1',
    'K1',
    'L1'
  ]
  const usedRefs = currentRefs.map((ref) => ref.toUpperCase())
  return suggestions.filter((ref) => !usedRefs.includes(ref))
}
