import SignalLoader from 'src/Components/Common/SignalLoader'
import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  Container,
  Card,
  Chip,
  IconButton
} from '@mui/material'
import { Error as ErrorIcon, Fullscreen, WifiOff } from '@mui/icons-material'
import { useTVDisplayDataWithWebSocket } from '../../../hooks/useMaintenancePublic'

// Import modular components
import ModernHeader from './components/ModernHeader'
import MetricsDashboard from './components/MetricsDashboard'
import StatusBoard from './components/StatusBoard'
import ReportsStrip from './components/ReportsStrip'

// Import types and hooks
import { TVMetrics, ConnectionStatus } from './types'
import { useModernStyles } from './hooks/useModernStyles'
import { useTvKiosk } from './hooks/useTvKiosk'
import { brand, intent, neutral, withAlpha } from 'src/theme/designTokens'

/**
 * MaintenanceTVDisplayModern - Modern TV display component for maintenance tickets
 * Features clean white design with company branding and improved readability
 * Optimized for large screens (1920x1080+) with real-time WebSocket updates
 *
 * Key Features:
 * - Clean white background with company primary color
 * - Modular component architecture for better maintainability
 * - Modern card design with subtle shadows
 * - High contrast typography for better readability
 * - Real-time updates via WebSocket
 * - Responsive grid layout
 * - Professional corporate branding
 */
const MaintenanceTVDisplayModern: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date())

  const { isFullscreen, toggleFullscreen } = useTvKiosk()

  // Get modern styles
  const { modernColors } = useModernStyles()

  // Fetch data with WebSocket
  const {
    data: tvDisplayData,
    isLoading,
    error,
    isWebSocketConnected,
    isSocketConnecting,
    retryCount
  } = useTVDisplayDataWithWebSocket()

  // Update clock every second
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(clockInterval)
  }, [])

  // Abiertos (para el tablero) y completados que esperan reporte técnico (para la franja)
  const { openTickets, reportTickets } = useMemo(() => {
    const grouped = tvDisplayData?.tickets
    const all = [
      ...(grouped?.urgent || []),
      ...(grouped?.high || []),
      ...(grouped?.medium || []),
      ...(grouped?.low || [])
    ]
    return {
      openTickets: all.filter((t) => !t.requiresTechnicalReport),
      reportTickets: all.filter((t) => t.requiresTechnicalReport)
    }
  }, [tvDisplayData?.tickets])

  // Use metrics from backend
  const metrics: TVMetrics = useMemo(() => {
    if (!tvDisplayData?.metrics) {
      return {
        totalTickets: 0,
        pendingTickets: 0,
        assignedTickets: 0,
        inProgressTickets: 0,
        pendingTechnicalReport: 0,
        completedTickets: 0,
        urgentTickets: 0,
        overdueTickets: 0,
        techniciansAvailable: '0/0',
        averageWorkload: 0,
        avgResolutionTimeHours: 0,
        completedLast30Days: 0,
        isInvoiced: 0
      }
    }

    const backendMetrics = tvDisplayData.metrics
    return {
      // «Total activos» son los abiertos; los completados sin reporte tienen su propio indicador
      totalTickets:
        backendMetrics.totalActive -
        (backendMetrics.pendingTechnicalReport || 0),
      pendingTickets: backendMetrics.pending,
      assignedTickets: backendMetrics.assigned,
      inProgressTickets: backendMetrics.inProgress,
      pendingTechnicalReport: backendMetrics.pendingTechnicalReport,
      completedTickets: backendMetrics.completedToday,
      urgentTickets: backendMetrics.urgent,
      overdueTickets: backendMetrics.overdue,
      techniciansAvailable: backendMetrics.techniciansAvailable,
      averageWorkload: backendMetrics.averageWorkload,
      avgResolutionTimeHours: backendMetrics.avgResolutionTimeHours,
      completedLast30Days: backendMetrics.completedLast30Days,
      isInvoiced: backendMetrics.isInvoiced || 0
    }
  }, [tvDisplayData])

  // Get connection status
  const connectionStatus: ConnectionStatus = useMemo(() => {
    if (error) return { status: 'disconnected', lastUpdate: new Date() }
    if (isLoading || isSocketConnecting) {
      return { status: 'connecting', lastUpdate: new Date(), retryCount }
    }
    if (!isWebSocketConnected) {
      return {
        status: 'disconnected',
        lastUpdate: tvDisplayData?.lastUpdated
          ? new Date(tvDisplayData.lastUpdated)
          : new Date(),
        retryCount,
        usingPollingFallback: true
      }
    }
    return {
      status: 'connected',
      lastUpdate: tvDisplayData?.lastUpdated
        ? new Date(tvDisplayData.lastUpdated)
        : new Date(),
      retryCount
    }
  }, [
    error,
    isLoading,
    isSocketConnecting,
    isWebSocketConnected,
    retryCount,
    tvDisplayData?.lastUpdated
  ])

  // Datos viejos: con el WebSocket conectado los datos se consideran al día; sin él,
  // se espera una actualización cada 30 s, así que más de 2 minutos es una falla
  const lastUpdate = tvDisplayData?.lastUpdated
    ? new Date(tvDisplayData.lastUpdated)
    : null
  const staleMinutes = lastUpdate
    ? Math.floor((currentTime.getTime() - lastUpdate.getTime()) / 60000)
    : 0
  const isStale =
    Boolean(error) ||
    (!isWebSocketConnected && !isSocketConnecting && staleMinutes >= 2)

  // Error state: solo si nunca hubo datos; con datos viejos se avisa con un banner
  if (error && !tvDisplayData) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: modernColors.background,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4
        }}
      >
        <Card
          sx={{
            maxWidth: 600,
            p: 4,
            textAlign: 'center',
            border: `2px solid ${modernColors.danger}`,
            borderRadius: '16px',
            boxShadow: `0 8px 32px ${withAlpha(intent.danger, 0.15)}`
          }}
        >
          <ErrorIcon
            sx={{ fontSize: '4rem', color: modernColors.danger, mb: 2 }}
          />
          <Typography
            variant='h4'
            sx={{ color: modernColors.textPrimary, mb: 2, fontWeight: 700 }}
          >
            Error de Conexión
          </Typography>
          <Typography
            variant='body1'
            sx={{ color: modernColors.textSecondary, mb: 3 }}
          >
            No se pueden cargar los datos de mantenimiento. El sistema está
            intentando reconectar automáticamente.
          </Typography>
          <Chip
            label='Reintentando...'
            color='error'
            variant='outlined'
            sx={{ fontSize: '1rem', py: 2, px: 3 }}
          />
        </Card>
      </Box>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: modernColors.background,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 4
        }}
      >
        <SignalLoader
          size='large'
          message='Cargando Dashboard de Mantenimiento'
        />
        <Typography
          variant='body1'
          sx={{
            color: modernColors.textSecondary,
            textAlign: 'center'
          }}
        >
          Conectando con el sistema en tiempo real...
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        height: '100vh', // Altura fija para evitar scroll vertical
        width: '100vw', // Ancho fijo para evitar scroll horizontal
        backgroundColor: modernColors.background,
        color: modernColors.textPrimary,
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden' // Evitar cualquier scroll
      }}
    >
      {/* Modern Header */}
      <ModernHeader
        currentTime={currentTime}
        connectionStatus={connectionStatus}
        companyName='MetroMedics'
        showLogo={true}
      />

      {isStale && (
        <Box
          role='alert'
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            py: 0.75,
            bgcolor: intent.dangerInk,
            color: neutral.surface
          }}
        >
          <WifiOff sx={{ fontSize: { xs: '1.2rem', xl: '1.8rem' } }} />
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1rem', xl: '1.5rem' }
            }}
          >
            Sin conexión: estos datos pueden estar desactualizados
            {lastUpdate &&
              ` (última actualización ${lastUpdate.toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit'
              })})`}
          </Typography>
        </Box>
      )}

      {/* CSS Animations for TV Display */}
      <style>
        {`
          @keyframes subtlePulse {
            0% { box-shadow: 0 0 0 0 ${withAlpha(intent.danger, 0.4)}; }
            70% { box-shadow: 0 0 0 15px ${withAlpha(intent.danger, 0)}; }
            100% { box-shadow: 0 0 0 0 ${withAlpha(intent.danger, 0)}; }
          }

          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }

          @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
            100% { opacity: 1; transform: scale(1); }
          }

          @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(30px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>

      <Container
        maxWidth={false}
        sx={{
          px: 1, // Mínimo padding horizontal para pantalla completa
          pt: 0.35,
          pb: 0.25,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          height: 'calc(100vh - 60px)' // Usar toda la altura disponible menos header
        }}
      >
        {/* Metrics Dashboard - Ultra compacto */}
        <Box sx={{ flexShrink: 0, mb: 0.35 }}>
          <MetricsDashboard metrics={metrics} colors={modernColors} />
        </Box>

        {/* Tablero por estado: todo lo abierto a la vez */}
        <StatusBoard tickets={openTickets} />

        {/* Completados que esperan reporte técnico, por técnico */}
        <Box sx={{ flexShrink: 0, mt: 1 }}>
          <ReportsStrip tickets={reportTickets} />
        </Box>
      </Container>

      {!isFullscreen && (
        <IconButton
          onClick={toggleFullscreen}
          aria-label='Pantalla completa (tecla F)'
          title='Pantalla completa (tecla F)'
          sx={{
            position: 'fixed',
            right: 12,
            bottom: 84,
            color: brand.ink,
            bgcolor: brand.soft,
            opacity: 0.55,
            '&:hover': { opacity: 1, bgcolor: brand.soft }
          }}
        >
          <Fullscreen />
        </IconButton>
      )}
    </Box>
  )
}

export default MaintenanceTVDisplayModern
