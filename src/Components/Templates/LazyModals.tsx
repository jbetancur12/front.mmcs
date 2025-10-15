// Lazy-loaded modal components for code splitting
import { lazy } from 'react'

// Lazy load modal components to reduce initial bundle size
export const LazyCreateTemplateModal = lazy(
  () => import('./CreateTemplateModal')
)
export const LazyEditTemplateModal = lazy(() => import('./EditTemplateModal'))
export const LazyDuplicateTemplateModal = lazy(
  () => import('./DuplicateTemplateModal')
)
// export const LazyConfirmationDialog = lazy(() => import('./ConfirmationDialog'))

// Preload components when user hovers over trigger buttons
export const preloadCreateModal = () => import('./CreateTemplateModal')
export const preloadEditModal = () => import('./EditTemplateModal')
export const preloadDuplicateModal = () => import('./DuplicateTemplateModal')
// export const preloadConfirmationDialog = () => import('./ConfirmationDialog')

export default {
  LazyCreateTemplateModal,
  LazyEditTemplateModal,
  LazyDuplicateTemplateModal,
  // LazyConfirmationDialog,
  preloadCreateModal,
  preloadEditModal,
  preloadDuplicateModal
  // preloadConfirmationDialog,
}
