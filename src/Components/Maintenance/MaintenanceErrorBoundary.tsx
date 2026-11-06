import React, { Component, ReactNode } from 'react'
import { Box, Paper, Typography, Button, Alert } from '@mui/material'
import { Error as ErrorIcon, Refresh } from '@mui/icons-material'

import { logger } from 'src/utils/logger'
import { neutral, intent } from 'src/theme/designTokens'
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
    logger.error(
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
            backgroundColor: neutral.surfaceAlt
          }}
        >
          <Paper
            sx={{
              p: 4,
              textAlign: 'center',
              maxWidth: 500,
              width: '100%',
              backgroundColor: neutral.surface,
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
              border: `1px solid ${neutral.border}`
            }}
          >
            <Box
              sx={{
                backgroundColor: intent.dangerSoft,
                borderRadius: '50%',
                width: 80,
                height: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <ErrorIcon sx={{ fontSize: 40, color: intent.danger }} />
            </Box>
            <Typography
              variant='h5'
              gutterBottom
              sx={{
                color: intent.danger,
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
                    color: intent.danger
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
                  backgroundColor: intent.successInk,
                  borderRadius: '12px',
                  '&:hover': {
                    backgroundColor: intent.successInk
                  }
                }}
              >
                Intentar Nuevamente
              </Button>
              <Button
                variant='outlined'
                onClick={() => window.location.reload()}
                sx={{
                  borderColor: intent.danger,
                  color: intent.danger,
                  borderRadius: '12px',
                  '&:hover': {
                    borderColor: intent.danger,
                    backgroundColor: intent.dangerSoft
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
