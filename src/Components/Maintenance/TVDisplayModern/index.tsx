import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  CircularProgress,
  Container,
  Card,
  Chip
} from '@mui/material'
import {
  TrendingUp,
  Error as ErrorIcon
} from '@mui/icons-material'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useTVDisplayDataWithWebSocket } from '../../../hooks/useMaintenancePublic'
import { useResponsiveTicketGrid } from '../../../hooks/useResponsiveTicketGrid'

// Import modular components
import ModernHeader from './components/ModernHeader'
import MetricsDashboard from './components/MetricsDashboard'
import RegularTicketsGrid from './components/RegularTicketsGrid'
import PaginationProgress from './components/PaginationProgress'

// Import types and hooks
import { TVMetrics, SmartPagination, OrganizedTickets, ConnectionStatus } from './types'
import { useModernStyles } from './hooks/useModernStyles'

/**
 * MaintenanceTVDisplayModern - Modern TV display component for maintenance tickets
 * Features clean white design with company branding and improved readability
 * Optimized for large screens (1920x1080+) with real-time WebSocket updates
 * 
 * Key Features:
 * - Clean white background with company primary color (#7bff7f)
 * - Modular component architecture for better maintainability
 * - Modern card design with subtle shadows
 * - High contrast typography for better readability
 * - Real-time updates via WebSocket
 * - Responsive grid layout
 * - Professional corporate branding
 */
const MaintenanceTVDisplayModern: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [slideIndex, setSlideIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Modern display configuration (for future use)
  // const [displayConfig] = useState<DisplayConfig>({
  //   autoRefresh: true,
  //   slideInterval: 30, // seconds
  //   showAnimations: true,
  //   compactView: false,
  //   primaryColor: '#7bff7f'
  // })

  // Smart Pagination System
  const [smartPagination] = useState<SmartPagination>({
    isActive: true,
    isPaused: false,
    baseSpeed: 30,
    urgentSpeed: 45,
    currentSpeed: 30,
    smoothTransitions: true,
    stickyUrgents: true
  })

  // Get modern styles
  const { modernColors } = useModernStyles()

  // Fetch data with WebSocket
  const {
    data: tvDisplayData,
    isLoading,
    error
  } = useTVDisplayDataWithWebSocket()

  // Get responsive grid calculations
  const { gridCalculation } = useResponsiveTicketGrid()

  // Update clock every second
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(clockInterval)
  }, [])

  // Smart organization: All tickets in one pagination system for fullscreen display
  const organizedTickets: OrganizedTickets = useMemo(() => {
    if (!tvDisplayData?.tickets) return { stickyUrgents: [], paginatedTickets: [], allActive: [], urgent: [], high: [], normal: [] }

    const tickets = tvDisplayData.tickets

    // Para pantalla completa, incluir TODOS los tickets en la paginación
    // Ordenar por prioridad: urgentes primero, luego por fecha
    const allTickets = [
      ...(tickets.urgent || []),
      ...(tickets.high || []),
      ...(tickets.medium || []),
      ...(tickets.low || [])
    ].sort((a, b) => {
      // Primero por prioridad
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      const aPriority = priorityOrder[a.priority?.toLowerCase() as keyof typeof priorityOrder] ?? 4
      const bPriority = priorityOrder[b.priority?.toLowerCase() as keyof typeof priorityOrder] ?? 4

      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }

      // Luego por fecha (más antiguos primero)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })

    // All active for metrics
    const allActive = allTickets

    return {
      stickyUrgents: [], // No usar sticky urgents en pantalla completa
      paginatedTickets: allTickets, // Todos los tickets paginados
      allActive,
      urgent: tickets.urgent || [],
      high: tickets.high || [],
      normal: [...(tickets.medium || []), ...(tickets.low || [])],
      totalUrgentPages: 0,
      currentUrgentPage: 0
    }
  }, [tvDisplayData?.tickets])

  // Remover paginación separada para tickets urgentes en pantalla completa

  // Smart Pagination System - Optimizado para pantalla completa
  useEffect(() => {
    if (!smartPagination.isActive || smartPagination.isPaused || isTransitioning) {
      return
    }

    if (organizedTickets?.paginatedTickets && gridCalculation) {
      const totalTickets = organizedTickets.paginatedTickets.length
      const { ticketsPerPage } = gridCalculation

      if (totalTickets > ticketsPerPage) {
        const slideInterval = setInterval(() => {
          setIsTransitioning(true)

          setTimeout(() => {
            setSlideIndex((prev) => {
              const nextIndex = prev >= Math.ceil(totalTickets / ticketsPerPage) - 1 ? 0 : prev + 1
              return nextIndex
            })
            setIsTransitioning(false)
          }, 500) // Transición más rápida

        }, 20000) // 20 segundos por página para ver más tickets

        return () => clearInterval(slideInterval)
      } else {
        setSlideIndex(0)
      }
    }
  }, [
    organizedTickets?.paginatedTickets,
    gridCalculation,
    smartPagination.isActive,
    smartPagination.isPaused,
    isTransitioning
  ])

  // Use metrics from backend
  const metrics: TVMetrics = useMemo(() => {
    if (!tvDisplayData?.metrics) {
      return {
        totalTickets: 0,
        pendingTickets: 0,
        inProgressTickets: 0,
        completedTickets: 0,
        urgentTickets: 0,
        overdueTickets: 0,
        techniciansAvailable: '0/0',
        averageWorkload: 0,
        avgResolutionTimeHours: 0,
        completedLast30Days: 0
      }
    }

    const backendMetrics = tvDisplayData.metrics
    return {
      totalTickets: backendMetrics.totalActive,
      pendingTickets: backendMetrics.pending,
      inProgressTickets: backendMetrics.inProgress,
      completedTickets: backendMetrics.completedToday,
      urgentTickets: backendMetrics.urgent,
      overdueTickets: backendMetrics.overdue,
      techniciansAvailable: backendMetrics.techniciansAvailable,
      averageWorkload: backendMetrics.averageWorkload,
      avgResolutionTimeHours: backendMetrics.avgResolutionTimeHours,
      completedLast30Days: backendMetrics.completedLast30Days
    }
  }, [tvDisplayData])

  // Get tickets for current page
  const currentPageTickets = useMemo(() => {
    if (!gridCalculation) return []

    const { ticketsPerPage } = gridCalculation
    const startIndex = slideIndex * ticketsPerPage
    return organizedTickets.paginatedTickets.slice(
      startIndex,
      startIndex + ticketsPerPage
    )
  }, [organizedTickets.paginatedTickets, slideIndex, gridCalculation])

  // Calculate elapsed time since ticket creation
  const getElapsedTime = (createdAt: string) => {
    return formatDistanceToNow(new Date(createdAt), {
      locale: es,
      addSuffix: false
    })
  }

  // Get connection status
  const connectionStatus: ConnectionStatus = useMemo(() => {
    if (error) return { status: 'disconnected', lastUpdate: new Date() }
    if (isLoading) return { status: 'connecting', lastUpdate: new Date() }
    return { status: 'connected', lastUpdate: new Date() }
  }, [error, isLoading])

  // Error state
  if (error) {
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
            boxShadow: `0 8px 32px rgba(220, 53, 69, 0.15)`
          }}
        >
          <ErrorIcon sx={{ fontSize: '4rem', color: modernColors.danger, mb: 2 }} />
          <Typography variant='h4' sx={{ color: modernColors.textPrimary, mb: 2, fontWeight: 700 }}>
            Error de Conexión
          </Typography>
          <Typography variant='body1' sx={{ color: modernColors.textSecondary, mb: 3 }}>
            No se pueden cargar los datos de mantenimiento. El sistema está intentando reconectar automáticamente.
          </Typography>
          <Chip
            label="Reintentando..."
            color="error"
            variant="outlined"
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
        <CircularProgress
          size={80}
          sx={{
            color: modernColors.primary,
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }}
        />
        <Typography
          variant='h4'
          sx={{
            color: modernColors.textPrimary,
            fontWeight: 600,
            textAlign: 'center'
          }}
        >
          Cargando Dashboard de Mantenimiento
        </Typography>
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
        width: '100vw',   // Ancho fijo para evitar scroll horizontal
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
        companyName="MetroMedics"
        showLogo={true}
      />

      {/* CSS Animations for TV Display */}
      <style>
        {`
          @keyframes subtlePulse {
            0% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4); }
            70% { box-shadow: 0 0 0 15px rgba(244, 67, 54, 0); }
            100% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0); }
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
          pt: 0.5, // Mínimo padding top
          pb: 0.5, // Mínimo padding bottom
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          height: 'calc(100vh - 60px)' // Usar toda la altura disponible menos header
        }}
      >
        {/* Metrics Dashboard - Ultra compacto */}
        <Box sx={{ flexShrink: 0, mb: 0.5 }}>
          <MetricsDashboard
            metrics={metrics}
            colors={modernColors}
          />
        </Box>

        {/* Tickets Section - Maximizar espacio disponible */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5, flexShrink: 0 }}>
            <Typography
              variant='h4'
              sx={{
                color: modernColors.textPrimary,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontSize: '1.8rem' // Reducir tamaño del título
              }}
            >
              <TrendingUp sx={{ fontSize: '2rem', color: modernColors.primary }} />
              Tickets Activos ({organizedTickets.paginatedTickets.length})
            </Typography>

            {/* Pagination Info */}
            {tvDisplayData &&
              gridCalculation &&
              organizedTickets.paginatedTickets.length > gridCalculation.ticketsPerPage && (
                <Card
                  sx={{
                    backgroundColor: modernColors.secondaryBackground,
                    border: `1px solid ${modernColors.primary}`,
                    borderRadius: '6px',
                    px: 1.5,
                    py: 0.5
                  }}
                >
                  <Typography
                    variant='body2'
                    sx={{
                      color: modernColors.primary,
                      fontWeight: 700,
                      fontSize: '0.85rem'
                    }}
                  >
                    Página {slideIndex + 1}/{Math.ceil(organizedTickets.paginatedTickets.length / gridCalculation.ticketsPerPage)}
                  </Typography>
                </Card>
              )}
          </Box>

          {/* Tickets Grid - Maximizar altura disponible */}
          <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
            <RegularTicketsGrid
              tickets={currentPageTickets}
              gridCalculation={gridCalculation}
              colors={modernColors}
              getElapsedTime={getElapsedTime}
            />
          </Box>
        </Box>

        {/* Pagination Progress - Mínimo espacio */}
        {gridCalculation && organizedTickets.paginatedTickets.length > gridCalculation.ticketsPerPage && (
          <Box sx={{ flexShrink: 0, mt: 0.5 }}>
            <PaginationProgress
              slideIndex={slideIndex}
              totalTickets={organizedTickets.paginatedTickets.length}
              ticketsPerPage={gridCalculation.ticketsPerPage}
              colors={modernColors}
            />
          </Box>
        )}
      </Container>
    </Box>
  )
}

export default MaintenanceTVDisplayModern