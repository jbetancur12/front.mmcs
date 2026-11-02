// Módulo de plantillas: reexporta lo que usan otras pantallas
export { default as TemplatesPage } from './Templates/TemplatesPage'
export { default as TemplatesTable } from './Templates/TemplatesTable'
export { default as CreateTemplateModal } from './Templates/CreateTemplateModal'
export { default as EditTemplateModal } from './Templates/EditTemplateModal'
export { default as DuplicateTemplateModal } from './Templates/DuplicateTemplateModal'
export { default as TemplateFormDialog } from './Templates/TemplateFormDialog'

// Re-export types
export type { TemplateData, TemplatesData, ErrorState } from './Templates/types'

// Export TemplatesPage as default for backward compatibility
import TemplatesPageComponent from './Templates/TemplatesPage'
export default TemplatesPageComponent
