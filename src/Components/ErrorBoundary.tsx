import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Box, Typography, Button, Alert, AlertTitle } from '@mui/material'
import { Refresh as RefreshIcon, BugReport as BugIcon } from '@mui/icons-material'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            p: 4,
            textAlign: 'center'
          }}
        >
          <Alert
            severity="error"
            sx={{
              maxWidth: '600px',
              mb: 3,
              '& .MuiAlert-icon': {
                fontSize: '2rem'
              }
            }}
          >
            <AlertTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BugIcon />
              Algo salió mal
            </AlertTitle>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Ha ocurrido un error inesperado. Puedes intentar recargar la página o contactar al soporte técnico.
            </Typography>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: 'rgba(0,0,0,0.1)',
                  borderRadius: 1,
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace'
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                  Error Details (Development):
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                  {this.state.error.message}
                </Typography>
                {this.state.error.stack && (
                  <Typography variant="caption" sx={{ display: 'block', whiteSpace: 'pre-wrap' }}>
                    {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                  </Typography>
                )}
              </Box>
            )}
          </Alert>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={this.handleRetry}
              sx={{ minWidth: '120px' }}
            >
              Reintentar
            </Button>
            <Button
              variant="outlined"
              onClick={this.handleReload}
              sx={{ minWidth: '120px' }}
            >
              Recargar Página
            </Button>
          </Box>
        </Box>
      )
    }

    return this.props.children as ReactNode
  }
}

export default ErrorBoundary