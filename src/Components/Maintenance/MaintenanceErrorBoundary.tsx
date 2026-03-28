import React, { Component, ReactNode } from 'react'
import { Box, Paper, Typography, Button, Alert } from '@mui/material'
import { Error as ErrorIcon, Refresh } from '@mui/icons-material'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * MaintenanceErrorBoundary component catches React errors and displays a fallback UI
 * This prevents the entire application from crashing when there are issues in maintenance components
 */
class MaintenanceErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      'Maintenance Error Boundary caught an error:',
      error,
      errorInfo
    )
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          minHeight='400px'
          p={3}
          sx={{
            backgroundColor: '#f8fafc'
          }}
        >
          <Paper
            sx={{
              p: 4,
              textAlign: 'center',
              maxWidth: 500,
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
              border: '1px solid #e5e7eb'
            }}
          >
            <Box
              sx={{
                backgroundColor: '#fef2f2',
                borderRadius: '50%',
                width: 80,
                height: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <ErrorIcon sx={{ fontSize: 40, color: '#dc2626' }} />
            </Box>
            <Typography 
              variant='h5' 
              gutterBottom 
              sx={{
                color: '#f44336',
                fontWeight: 700
              }}
            >
              Error en el Módulo de Mantenimiento
            </Typography>
            <Typography 
              variant='body1' 
              color='text.secondary' 
              paragraph
              sx={{ fontWeight: 500 }}
            >
              Ha ocurrido un error inesperado. Por favor, intente recargar la
              página o contacte al administrador.
            </Typography>

            {this.state.error && (
              <Alert 
                severity='error' 
                sx={{ 
                  mb: 2, 
                  textAlign: 'left',
                  background: 'rgba(244, 67, 54, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(244, 67, 54, 0.2)'
                }}
              >
                <Typography
                  variant='body2'
                  component='pre'
                  sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.75rem',
                    color: '#d32f2f'
                  }}
                >
                  {this.state.error.message}
                </Typography>
              </Alert>
            )}

            <Box display='flex' gap={2} justifyContent='center'>
              <Button
                variant='contained'
                onClick={this.handleRetry}
                startIcon={<Refresh />}
                sx={{
                  backgroundColor: '#2f7d32',
                  borderRadius: '12px',
                  '&:hover': {
                    backgroundColor: '#27672a'
                  }
                }}
              >
                Intentar Nuevamente
              </Button>
              <Button
                variant='outlined'
                onClick={() => window.location.reload()}
                sx={{
                  borderColor: '#f44336',
                  color: '#f44336',
                  borderRadius: '12px',
                  '&:hover': {
                    borderColor: '#d32f2f',
                    backgroundColor: '#fef2f2'
                  }
                }}
              >
                Recargar Página
              </Button>
            </Box>
          </Paper>
        </Box>
      )
    }

    return this.props.children
  }
}

export default MaintenanceErrorBoundary
