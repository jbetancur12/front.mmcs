import React, { ReactNode } from 'react'
import LmsErrorBoundary from './LmsErrorBoundary'

// Specific error boundaries for different dashboard sections

interface SectionErrorBoundaryProps {
  children: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export const MetricsErrorBoundary: React.FC<SectionErrorBoundaryProps> = ({ 
  children, 
  onError 
}) => (
  <LmsErrorBoundary
    section="Métricas del Dashboard"
    onError={onError}
    enableRetry={true}
    enableNavigation={false}
    showErrorDetails={false}
  >
    {children}
  </LmsErrorBoundary>
)

export const AnalyticsErrorBoundary: React.FC<SectionErrorBoundaryProps> = ({ 
  children, 
  onError 
}) => (
  <LmsErrorBoundary
    section="Analíticas"
    onError={onError}
    enableRetry={true}
    enableNavigation={true}
    showErrorDetails={true}
  >
    {children}
  </LmsErrorBoundary>
)

export const AssignmentErrorBoundary: React.FC<SectionErrorBoundaryProps> = ({ 
  children, 
  onError 
}) => (
  <LmsErrorBoundary
    section="Gestión de Asignaciones"
    onError={onError}
    enableRetry={true}
    enableNavigation={true}
    showErrorDetails={false}
  >
    {children}
  </LmsErrorBoundary>
)

export const NotificationErrorBoundary: React.FC<SectionErrorBoundaryProps> = ({ 
  children, 
  onError 
}) => (
  <LmsErrorBoundary
    section="Notificaciones"
    onError={onError}
    enableRetry={true}
    enableNavigation={false}
    showErrorDetails={false}
  >
    {children}
  </LmsErrorBoundary>
)

export const ReportErrorBoundary: React.FC<SectionErrorBoundaryProps> = ({ 
  children, 
  onError 
}) => (
  <LmsErrorBoundary
    section="Reportes"
    onError={onError}
    enableRetry={true}
    enableNavigation={true}
    showErrorDetails={true}
  >
    {children}
  </LmsErrorBoundary>
)

export const SystemHealthErrorBoundary: React.FC<SectionErrorBoundaryProps> = ({ 
  children, 
  onError 
}) => (
  <LmsErrorBoundary
    section="Estado del Sistema"
    onError={onError}
    enableRetry={true}
    enableNavigation={false}
    showErrorDetails={true}
  >
    {children}
  </LmsErrorBoundary>
)

export const QuickActionsErrorBoundary: React.FC<SectionErrorBoundaryProps> = ({ 
  children, 
  onError 
}) => (
  <LmsErrorBoundary
    section="Acciones Rápidas"
    onError={onError}
    enableRetry={true}
    enableNavigation={false}
    showErrorDetails={false}
  >
    {children}
  </LmsErrorBoundary>
)

export const RealTimeErrorBoundary: React.FC<SectionErrorBoundaryProps> = ({ 
  children, 
  onError 
}) => (
  <LmsErrorBoundary
    section="Dashboard en Tiempo Real"
    onError={onError}
    enableRetry={true}
    enableNavigation={false}
    showErrorDetails={false}
  >
    {children}
  </LmsErrorBoundary>
)

// Composite error boundary that wraps the entire dashboard
export const DashboardErrorBoundary: React.FC<SectionErrorBoundaryProps> = ({ 
  children, 
  onError 
}) => (
  <LmsErrorBoundary
    section="Dashboard LMS"
    onError={(error, errorInfo) => {
      // Log critical dashboard errors
      console.error('Critical Dashboard Error:', error, errorInfo)
      
      // Report to error tracking service
      if (typeof window !== 'undefined' && (window as any).errorTracker) {
        (window as any).errorTracker.captureException(error, {
          tags: {
            section: 'dashboard',
            critical: true
          },
          extra: {
            componentStack: errorInfo.componentStack
          }
        })
      }
      
      // Call custom error handler
      if (onError) {
        onError(error, errorInfo)
      }
    }}
    enableRetry={true}
    enableNavigation={true}
    showErrorDetails={true}
  >
    {children}
  </LmsErrorBoundary>
)

// Error boundary for individual widgets
export const WidgetErrorBoundary: React.FC<SectionErrorBoundaryProps & {
  widgetName: string
}> = ({ children, widgetName, onError }) => (
  <LmsErrorBoundary
    section={`Widget: ${widgetName}`}
    onError={onError}
    enableRetry={true}
    enableNavigation={false}
    showErrorDetails={false}
  >
    {children}
  </LmsErrorBoundary>
)

// HOC for wrapping components with appropriate error boundaries
export const withDashboardErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  sectionName: string
) => {
  const WrappedComponent = (props: P) => (
    <LmsErrorBoundary
      section={sectionName}
      enableRetry={true}
      enableNavigation={false}
      showErrorDetails={false}
    >
      <Component {...props} />
    </LmsErrorBoundary>
  )
  
  WrappedComponent.displayName = `withDashboardErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

export default {
  MetricsErrorBoundary,
  AnalyticsErrorBoundary,
  AssignmentErrorBoundary,
  NotificationErrorBoundary,
  ReportErrorBoundary,
  SystemHealthErrorBoundary,
  QuickActionsErrorBoundary,
  RealTimeErrorBoundary,
  DashboardErrorBoundary,
  WidgetErrorBoundary,
  withDashboardErrorBoundary
}
