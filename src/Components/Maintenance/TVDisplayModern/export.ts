// Main component export
export { default as MaintenanceTVDisplayModern } from './index'

// Individual component exports for potential reuse
export { default as ModernHeader } from './components/ModernHeader'
export { default as MetricsDashboard } from './components/MetricsDashboard'
export { default as CriticalTicketsSection } from './components/CriticalTicketsSection'
export { default as RegularTicketsGrid } from './components/RegularTicketsGrid'
export { default as PaginationProgress } from './components/PaginationProgress'
export { default as SystemHealthIndicator } from './components/SystemHealthIndicator'
export { default as EnhancedTimeDisplay } from './components/EnhancedTimeDisplay'
export { default as EnhancedMetricCard } from './components/EnhancedMetricCard'
export { default as RotatingInfo } from './components/RotatingInfo'

// Hooks export
export { useModernStyles } from './hooks/useModernStyles'

// Types export
export * from './types'