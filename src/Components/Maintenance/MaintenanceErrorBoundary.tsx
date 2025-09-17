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
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              maxWidth: 500,
              width: '100%'
            }}
          >
            <ErrorIcon color='error' sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant='h5' gutterBottom color='error'>
              Error en el Módulo de Mantenimiento
            </Typography>
            <Typography variant='body1' color='text.secondary' paragraph>
              Ha ocurrido un error inesperado. Por favor, intente recargar la
              página o contacte al administrador.
            </Typography>

            {this.state.error && (
              <Alert severity='error' sx={{ mb: 2, textAlign: 'left' }}>
                <Typography
                  variant='body2'
                  component='pre'
                  sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
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
              >
                Intentar Nuevamente
              </Button>
              <Button
                variant='outlined'
                onClick={() => window.location.reload()}
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
