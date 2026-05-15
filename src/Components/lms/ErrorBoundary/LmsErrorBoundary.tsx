import React, { Component, ErrorInfo, ReactNode } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Stack,
  Chip,
  Collapse
} from '@mui/material'
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Home as HomeIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showErrorDetails?: boolean
  section?: string
  enableRetry?: boolean
  enableNavigation?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  showDetails: boolean
  retryCount: number
}

class LmsErrorBoundaryClass extends Component<Props, State> {
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log error for debugging
    console.error('LMS Error Boundary caught an error:', error, errorInfo)

    // Report error to monitoring service (if available)
    this.reportError(error, errorInfo)
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Send error to logging service
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        section: this.props.section || 'unknown',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }

      // You can integrate with your error reporting service here
      console.log('Error Report:', errorReport)
      
      // Example: Send to API endpoint
      // fetch('/api/errors/report', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport)
      // }).catch(console.error)
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        showDetails: false,
        retryCount: prevState.retryCount + 1
      }))
    }
  }

  private toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }))
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const canRetry = this.props.enableRetry !== false && this.state.retryCount < this.maxRetries
      const sectionName = this.props.section || 'Componente'

      return (
        <ErrorBoundaryFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          sectionName={sectionName}
          canRetry={canRetry}
          retryCount={this.state.retryCount}
          maxRetries={this.maxRetries}
          showDetails={this.state.showDetails}
          showErrorDetails={this.props.showErrorDetails}
          enableNavigation={this.props.enableNavigation}
          onRetry={this.handleRetry}
          onToggleDetails={this.toggleDetails}
        />
      )
    }

    return this.props.children
  }
}

interface FallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  sectionName: string
  canRetry: boolean
  retryCount: number
  maxRetries: number
  showDetails: boolean
  showErrorDetails?: boolean
  enableNavigation?: boolean
  onRetry: () => void
  onToggleDetails: () => void
}

const ErrorBoundaryFallback: React.FC<FallbackProps> = ({
  error,
  errorInfo,
  sectionName,
  canRetry,
  retryCount,
  maxRetries,
  showDetails,
  showErrorDetails = false,
  enableNavigation = true,
  onRetry,
  onToggleDetails
}) => {
  const navigate = useNavigate()

  const handleGoHome = () => {
    navigate('/lms/admin')
  }

  const handleReload = () => {
    window.location.reload()
  }

  return (
    <Card
      sx={{
        borderRadius: '16px',
        border: '2px solid #fee2e2',
        bgcolor: '#fef2f2',
        minHeight: '200px'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Error Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ErrorIcon sx={{ color: '#dc2626', fontSize: 32 }} />
            <Box>
              <Typography variant="h6" sx={{ color: '#dc2626', fontWeight: 700 }}>
                Error en {sectionName}
              </Typography>
              <Typography variant="body2" sx={{ color: '#7f1d1d' }}>
                Se produjo un error inesperado al cargar este componente
              </Typography>
            </Box>
          </Box>

          {/* Error Message */}
          <Alert severity="error" sx={{ borderRadius: '12px' }}>
            <AlertTitle>Detalles del Error</AlertTitle>
            {error?.message || 'Error desconocido'}
            {retryCount > 0 && (
              <Box sx={{ mt: 1 }}>
                <Chip
                  size="small"
                  label={`Intento ${retryCount}/${maxRetries}`}
                  sx={{ bgcolor: '#fee2e2', color: '#dc2626' }}
                />
              </Box>
            )}
          </Alert>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {canRetry && (
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={onRetry}
                sx={{
                  bgcolor: '#dc2626',
                  '&:hover': { bgcolor: '#b91c1c' }
                }}
              >
                Reintentar
              </Button>
            )}
            
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleReload}
              sx={{
                borderColor: '#dc2626',
                color: '#dc2626',
                '&:hover': {
                  borderColor: '#b91c1c',
                  bgcolor: '#fee2e2'
                }
              }}
            >
              Recargar Página
            </Button>

            {enableNavigation && (
              <Button
                variant="outlined"
                startIcon={<HomeIcon />}
                onClick={handleGoHome}
                sx={{
                  borderColor: '#6b7280',
                  color: '#6b7280',
                  '&:hover': {
                    borderColor: '#4b5563',
                    bgcolor: '#f9fafb'
                  }
                }}
              >
                Ir al Dashboard
              </Button>
            )}
          </Stack>

          {/* Error Details Toggle */}
          {showErrorDetails && error && (
            <Box>
              <Button
                variant="text"
                startIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={onToggleDetails}
                sx={{ color: '#6b7280', textTransform: 'none' }}
              >
                {showDetails ? 'Ocultar' : 'Mostrar'} detalles técnicos
              </Button>
              
              <Collapse in={showDetails}>
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    <strong>Error:</strong> {error.message}
                    <br />
                    <strong>Stack:</strong>
                    <pre style={{ whiteSpace: 'pre-wrap', marginTop: '8px' }}>
                      {error.stack}
                    </pre>
                    {errorInfo && (
                      <>
                        <strong>Component Stack:</strong>
                        <pre style={{ whiteSpace: 'pre-wrap', marginTop: '8px' }}>
                          {errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </Typography>
                </Box>
              </Collapse>
            </Box>
          )}

          {/* Help Text */}
          <Alert severity="info" sx={{ borderRadius: '12px' }}>
            <Typography variant="body2">
              Si el problema persiste, contacte al administrador del sistema o 
              intente recargar la página completa.
            </Typography>
          </Alert>
        </Stack>
      </CardContent>
    </Card>
  )
}

// HOC wrapper for functional components
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <LmsErrorBoundaryClass {...errorBoundaryProps}>
      <Component {...props} />
    </LmsErrorBoundaryClass>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

export default LmsErrorBoundaryClass
