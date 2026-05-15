// Enhanced Templates Module Exports
export { default as TemplatesPage } from './TemplatesPage'
export { default as TemplatesTable } from './TemplatesTable'
export { default as TemplateCard } from './TemplateCard'
export { default as CreateTemplateModal } from './CreateTemplateModal'
export { default as EditTemplateModal } from './EditTemplateModal'
export { default as DuplicateTemplateModal } from './DuplicateTemplateModal'
export { default as TemplateActions } from './TemplateActions'
export { default as EmptyState } from './EmptyState'
export {
  default as LoadingState,
  TableSkeleton,
  CardsSkeleton
} from './LoadingState'
export { default as LoadingIndicator } from './LoadingIndicators'

// Loading indicator variants
export {
  ButtonLoadingIndicator,
  TableLoadingIndicator,
  PageLoadingIndicator,
  ProgressLoadingIndicator,
  OverlayLoadingIndicator
} from './LoadingIndicators'

// Re-export types
export type { TemplateData, TemplatesData, ErrorState } from './types'
