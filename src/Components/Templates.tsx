// Modern Templates Module - Re-export from Templates directory
export { default as TemplatesPage } from './Templates/TemplatesPage'
export { default as TemplatesTable } from './Templates/TemplatesTable'
export { default as TemplateCard } from './Templates/TemplateCard'
export { default as CreateTemplateModal } from './Templates/CreateTemplateModal'
export { default as EditTemplateModal } from './Templates/EditTemplateModal'
export { default as DuplicateTemplateModal } from './Templates/DuplicateTemplateModal'
export { default as TemplateActions } from './Templates/TemplateActions'
export { default as EmptyState } from './Templates/EmptyState'
export { default as LoadingState } from './Templates/LoadingState'

// Re-export types
export type { TemplateData, TemplatesData, ErrorState } from './Templates/types'

// Export TemplatesPage as default for backward compatibility
import TemplatesPageComponent from './Templates/TemplatesPage'
export default TemplatesPageComponent
