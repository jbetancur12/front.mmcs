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
            background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.02) 0%, rgba(255, 255, 255, 0.8) 100%)'
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              maxWidth: 500,
              width: '100%',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(244, 67, 54, 0.15)',
              border: '1px solid rgba(244, 67, 54, 0.1)'
            }}
          >
            <Box
              sx={{
                background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                borderRadius: '50%',
                width: 80,
                height: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 4px 20px rgba(244, 67, 54, 0.3)'
              }}
            >
              <ErrorIcon sx={{ fontSize: 40, color: 'white' }} />
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
                  background: 'linear-gradient(135deg, #6dc662 0%, #5ab052 100%)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(109, 198, 98, 0.3)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5ab052 0%, #4a9642 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(109, 198, 98, 0.4)'
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
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    borderColor: '#d32f2f',
                    background: 'rgba(244, 67, 54, 0.1)',
                    transform: 'translateY(-1px)'
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
