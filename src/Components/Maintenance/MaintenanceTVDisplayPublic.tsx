import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  CircularProgress,
  Container
} from '@mui/material'
import {
  AccessTime,
  Build,
  Warning,
  Person,
  TrendingUp
} from '@mui/icons-material'
import { formatDistanceToNow, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useTVDisplayDataWithWebSocket } from '../../hooks/useMaintenancePublic'
import { MaintenancePriority } from '../../types/maintenance'
import MaintenancePriorityBadge from './MaintenancePriorityBadge'
import MaintenanceStatusBadge from './MaintenanceStatusBadge'
import { useResponsiveTicketGrid } from '../../hooks/useResponsiveTicketGrid'

interface TVMetrics {
  totalTickets: number
  pendingTickets: number
  inProgressTickets: number
  completedTickets: number
  urgentTickets: number
  overdueTickets: number
  techniciansAvailable: string
  averageWorkload: number
  avgResolutionTimeHours: number
  completedLast30Days: number
}

/* interface SystemStatus {
  operationalStatus: string
  lastSystemUpdate: string
  queueHealth: string
  averageResponseTime: string
  overdueStatus: string
  technicianUtilization: number
} */

/**
 * MaintenanceTVDisplayPublic - A public TV display component for maintenance tickets
 * Optimized for large screens (1920x1080+) with real-time WebSocket updates
 * No authentication required - uses public endpoints
 *
 * Features:
 * - Real-time clock and date display
 * - Live metrics dashboard via WebSocket
 * - Priority-based ticket organization
 * - Urgent ticket animations
 * - Real-time updates (no auto-refresh needed)
 * - Error handling and loading states
 * - Dark theme optimized for office environments
 */
const MaintenanceTVDisplayPublic: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [slideIndex, setSlideIndex] = useState(0)
  const [animationKey] = useState(0)

  // TV Public Optimized Mode - Perfect for public viewing
  const [tvPublicMode, setTvPublicMode] = useState({
    enabled: true, // Enable TV public optimizations by default
    autoAdjustByTime: true, // Auto-adjust brightness/contrast by time of day
    maxCriticalTickets: 3, // Show 3 critical tickets instead of 2
    enhancedSizes: true, // 20% larger elements
    highContrast: false, // Better contrast for distance viewing
    simplifiedInfo: true // Less information per card, easier to read
  })

  // Smart Pagination System - Optimized for TV Public
  const [smartPagination, setSmartPagination] = useState({
    isActive: true,
    isPaused: false,
    baseSpeed: tvPublicMode.enabled ? 30 : 20, // Slower for public viewing
    urgentSpeed: tvPublicMode.enabled ? 50 : 35, // Much slower for critical content
    currentSpeed: tvPublicMode.enabled ? 30 : 20,
    smoothTransitions: true,
    stickyUrgents: true
  })

  const [hoveredTicket, setHoveredTicket] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Auto-adjust mode based on time of day
  useEffect(() => {    
    if (tvPublicMode.autoAdjustByTime) {
      const hour = new Date().getHours()
      const isNightMode = hour < 7 || hour > 20 // Night mode between 8 PM and 7 AM

      setTvPublicMode(prev => ({
        ...prev,
        highContrast: isNightMode ? true : prev.highContrast
      }))
    }
  }, [tvPublicMode.autoAdjustByTime])

  // Fetch data with auto-refresh using public endpoint
  const {
    data: tvDisplayData,
    isLoading: isLoading,
    error: error
  } = useTVDisplayDataWithWebSocket()

  // Get responsive grid calculations
  const { gridCalculation } = useResponsiveTicketGrid()

  // Update animation key for visual refresh (removed auto-refresh as WebSocket handles real-time updates)
  // useEffect(() => {
  //   const animationInterval = setInterval(() => {
  //     setAnimationKey((prev) => prev + 1)
  //   }, 30000)

  //   return () => clearInterval(animationInterval)
  // }, [])

  // Update clock every second
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(clockInterval)
  }, [])

  // Smart organization: Fixed critical tickets + paginated regular tickets
  const organizedTickets = useMemo(() => {
    if (!tvDisplayData?.tickets) return { stickyUrgents: [], paginatedTickets: [], allActive: [] }

    const tickets = tvDisplayData.tickets
    const allUrgent = tickets.urgent || []

    // Sticky urgents: Max 3 most critical tickets for TV public mode
    const maxStickyUrgents = tvPublicMode.enabled ? tvPublicMode.maxCriticalTickets : 2
    const stickyUrgents = smartPagination.stickyUrgents
      ? allUrgent.slice(0, maxStickyUrgents)
      : []

    // Remaining tickets for pagination (including remaining urgents)
    const remainingUrgents = allUrgent.slice(maxStickyUrgents) // Urgents beyond the sticky ones
    const paginatedTickets = [
      ...remainingUrgents,
      ...(tickets.high || []),
      ...(tickets.medium || []),
      ...(tickets.low || [])
    ]

    // All active for metrics and total count
    const allActive = [
      ...(tickets.urgent || []),
      ...(tickets.high || []),
      ...(tickets.medium || []),
      ...(tickets.low || [])
    ]

    return {
      stickyUrgents,
      paginatedTickets,
      allActive,
      urgent: tickets.urgent || [],
      high: tickets.high || [],
      normal: [...(tickets.medium || []), ...(tickets.low || [])]
    }
  }, [tvDisplayData?.tickets, smartPagination.stickyUrgents])

  // Smart Pagination System with Intelligent Timing
  useEffect(() => {
    if (!smartPagination.isActive || smartPagination.isPaused || hoveredTicket || isTransitioning) {
      return
    }

    if (organizedTickets?.paginatedTickets && gridCalculation) {
      const totalTickets = organizedTickets.paginatedTickets.length
      const { ticketsPerPage } = gridCalculation

      if (totalTickets > ticketsPerPage) {
        const slideInterval = setInterval(() => {
          // Start smooth transition
          setIsTransitioning(true)

          setTimeout(() => {
            setSlideIndex((prev) => {
              const nextIndex = prev >= Math.ceil(totalTickets / ticketsPerPage) - 1 ? 0 : prev + 1

              // Calculate intelligent timing for next page
              const startIdx = nextIndex * ticketsPerPage
              const nextPageTickets = organizedTickets.paginatedTickets.slice(startIdx, startIdx + ticketsPerPage)

              // Check if next page has critical tickets
              const hasCriticalTickets = nextPageTickets.some(ticket =>
                ticket.priority === 'urgent' || ticket.priority === MaintenancePriority.HIGH
              )

              // Set intelligent speed for next cycle
              const nextSpeed = hasCriticalTickets ? smartPagination.urgentSpeed : smartPagination.baseSpeed
              setSmartPagination(current => ({
                ...current,
                currentSpeed: nextSpeed
              }))

              return nextIndex
            })

            // End transition
            setIsTransitioning(false)
          }, 800) // Smooth transition duration

        }, smartPagination.currentSpeed * 1000)

        return () => clearInterval(slideInterval)
      } else {
        // Reset slide index if all tickets fit on one page
        setSlideIndex(0)
      }
    }
  }, [
    organizedTickets?.paginatedTickets,
    gridCalculation,
    smartPagination.isActive,
    smartPagination.isPaused,
    smartPagination.currentSpeed,
    smartPagination.baseSpeed,
    smartPagination.urgentSpeed,
    hoveredTicket,
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

  // System status from backend
  /* const systemStatus: SystemStatus = useMemo(() => {
    if (!tvDisplayData?.systemStatus) {
      return {
        operationalStatus: 'offline',
        lastSystemUpdate: new Date().toISOString(),
        queueHealth: 'unknown',
        averageResponseTime: 'N/A',
        overdueStatus: 'unknown',
        technicianUtilization: 0
      }
    }

    return tvDisplayData.systemStatus
  }, [tvDisplayData]) */

  // Format resolution time
  /* const formatResolutionTime = (hours: number) => {
    if (hours === 0) return 'N/A'
    if (hours < 24) return `${hours.toFixed(1)}h`
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return remainingHours > 0
      ? `${days}d ${remainingHours.toFixed(1)}h`
      : `${days}d`
  } */

  // Get status color
  /* const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'online':
      case 'normal':
        return '#4caf50'
      case 'warning':
        return '#ff9800'
      case 'critical':
      case 'offline':
        return '#f44336'
      default:
        return '#888'
    }
  } */

  // Get tickets for current page (excluding sticky urgents)
  const currentPageTickets = useMemo(() => {
    if (!gridCalculation) return []

    const { ticketsPerPage } = gridCalculation
    const startIndex = slideIndex * ticketsPerPage
    return organizedTickets.paginatedTickets.slice(
      startIndex,
      startIndex + ticketsPerPage
    )
  }, [organizedTickets.paginatedTickets, slideIndex, gridCalculation])

  // TV Public Optimized Styles
  const tvStyles = useMemo(() => {
    const baseScale = tvPublicMode.enabled && tvPublicMode.enhancedSizes ? 1.2 : 1
    const contrastMode = tvPublicMode.enabled && tvPublicMode.highContrast

    return {
      // Enhanced sizes for TV viewing
      criticalCardHeight: 160 * baseScale,
      regularCardHeight: 170 * baseScale,

      // Typography scales
      typography: {
        ticketCode: `${1.2 * baseScale}rem`,
        equipment: `${1.0 * baseScale}rem`,
        details: `${0.85 * baseScale}rem`,
        status: `${0.8 * baseScale}rem`
      },

      // High contrast colors
      colors: {
        background: contrastMode ? '#1a1a1a' : '#1a1a1a',
        cardBackground: contrastMode ? '#1E1E1E' : '#1a1a1a',
        text: contrastMode ? '#F5F5F5' : 'white',
        textSecondary: contrastMode ? '#B0B0B0' : 'rgba(255,255,255,0.8)',
        critical: contrastMode ? '#FF0000' : '#f44336',
        success: contrastMode ? '#00FF00' : '#4caf50',
        warning: contrastMode ? '#FFAA00' : '#ff9800'
      },

      // Spacing adjustments
      spacing: {
        cardPadding: 2 * baseScale,
        gridSpacing: 2 * baseScale,
        sectionMargin: 4 * baseScale
      }
    }
  }, [tvPublicMode.enabled, tvPublicMode.enhancedSizes, tvPublicMode.highContrast])

  // Calculate elapsed time since ticket creation
  const getElapsedTime = (createdAt: string) => {
    return formatDistanceToNow(new Date(createdAt), {
      locale: es,
      addSuffix: false
    })
  }

  const enterFullScreen = () => {
  document.documentElement.requestFullscreen()
}

const exitFullScreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  }
}

  // Error state
  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#121212',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4
        }}
      >
        <Alert
          severity='error'
          sx={{
            fontSize: '1.5rem',
            '& .MuiAlert-message': { fontSize: '1.5rem' }
          }}
        >
          Error al cargar los datos de mantenimiento. Reintentando
          automáticamente...
        </Alert>
      </Box>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#121212',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 3
        }}
      >
        <CircularProgress size={80} sx={{ color: '#2FB158' }} />
        <Typography variant='h4' sx={{ color: '#2FB158' }}>
          Cargando Dashboard de Mantenimiento...
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: tvStyles.colors.background,
        color: tvStyles.colors.text,
        overflow: 'hidden',
        fontFamily: 'Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        // TV Public Mode enhancements
        ...(tvPublicMode.enabled && {
          fontSize: '1.1rem', // Base font size increase
          lineHeight: 1.4, // Better line spacing for distance reading
        })
      }}
    >
      {/* Header with Clock and Title - COMPACT */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2FB158 100%)',
          py: 0.8,
          px: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          minHeight: '50px'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              p: 1,
              backdropFilter: 'blur(10px)'
            }}
          >
            <Build sx={{ fontSize: '1.5rem', color: 'white' }} />
          </Box>
          <Box>
            <Typography
              variant='h5'
              sx={{
                fontWeight: 700,
                color: 'white',
                lineHeight: 1
              }}
            >
              MetroMedics - Centro de Mantenimiento
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            textAlign: 'right',
            minWidth: '180px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            p: 1.5,
            backdropFilter: 'blur(10px)'
          }}
        >
          <Typography
            variant='h4'
            sx={{
              fontWeight: 700,
              color: 'white',
              lineHeight: 1,
              mb: 0.2,
              fontFamily: 'monospace'
            }}
          >
            {format(currentTime, 'HH:mm:ss')}
          </Typography>
          <Typography
            variant='body2'
            sx={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: '0.8rem',
              fontWeight: 500,
              textTransform: 'capitalize'
            }}
          >
            {format(currentTime, "EEEE, d 'de' MMMM", { locale: es })}
          </Typography>
        </Box>
      </Box>

      <Container maxWidth={false} sx={{ px: 2, pt: 2, pb: 4, flex: 1 }}>
        {/* TV Public Optimized Metrics Row */}
        <Grid container spacing={tvStyles.spacing.gridSpacing} sx={{ mb: tvStyles.spacing.sectionMargin }}>
          <Grid item xs={2.4}>
            <Card
              sx={{
                backgroundColor: tvStyles.colors.cardBackground,
                borderLeft: `${4 * (tvPublicMode.enhancedSizes ? 1.2 : 1)}px solid ${tvStyles.colors.success}`,
                height: `${90 * (tvPublicMode.enhancedSizes ? 1.2 : 1)}px`,
                borderRadius: '12px',
                boxShadow: tvPublicMode.highContrast
                  ? '0 4px 20px rgba(0, 255, 0, 0.2)'
                  : '0 4px 16px rgba(0,0,0,0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              <CardContent
                sx={{
                  textAlign: 'center',
                  py: 1,
                  px: 1.5,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Typography
                  variant='h3'
                  sx={{
                    fontWeight: 800,
                    color: tvStyles.colors.success,
                    mb: 0.5,
                    lineHeight: 1,
                    fontSize: tvPublicMode.enhancedSizes ? '2.5rem' : '2rem',
                    textShadow: tvPublicMode.highContrast ? '0 0 10px rgba(0, 255, 0, 0.3)' : 'none'
                  }}
                >
                  {metrics.totalTickets}
                </Typography>
                <Typography
                  variant='body1'
                  sx={{
                    color: tvStyles.colors.textSecondary,
                    fontSize: tvStyles.typography.status,
                    fontWeight: 600,
                    letterSpacing: '0.05em'
                  }}
                >
                  TOTAL ACTIVOS
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={2.4}>
            <Card
              sx={{
                backgroundColor: '#1a1a1a',
                borderLeft: '3px solid #ff9800',
                height: '80px',
                borderRadius: '8px'
              }}
            >
              <CardContent
                sx={{
                  textAlign: 'center',
                  py: 1,
                  px: 1.5,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Typography
                  variant='h4'
                  sx={{
                    fontWeight: 700,
                    color: '#ff9800',
                    mb: 0.5,
                    lineHeight: 1
                  }}
                >
                  {metrics.pendingTickets}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{
                    color: '#888',
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }}
                >
                  PENDIENTES
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={2.4}>
            <Card
              sx={{
                backgroundColor: '#1a1a1a',
                borderLeft: '3px solid #3f50b5',
                height: '80px',
                borderRadius: '8px'
              }}
            >
              <CardContent
                sx={{
                  textAlign: 'center',
                  py: 1,
                  px: 1.5,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Typography
                  variant='h4'
                  sx={{
                    fontWeight: 700,
                    color: '#3f50b5',
                    mb: 0.5,
                    lineHeight: 1
                  }}
                >
                  {metrics.inProgressTickets}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{
                    color: '#888',
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }}
                >
                  EN PROGRESO
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={2.4}>
            <Card
              sx={{
                backgroundColor: '#1a1a1a',
                borderLeft: '3px solid #4caf50',
                height: '80px',
                borderRadius: '8px'
              }}
            >
              <CardContent
                sx={{
                  textAlign: 'center',
                  py: 1,
                  px: 1.5,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Typography
                  variant='h4'
                  sx={{
                    fontWeight: 700,
                    color: '#4caf50',
                    mb: 0.5,
                    lineHeight: 1
                  }}
                >
                  {metrics.completedTickets}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{
                    color: '#888',
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }}
                >
                  COMPLETADOS HOY
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={2.4}>
            <Card
              sx={{
                backgroundColor: '#1a1a1a',
                borderLeft: '3px solid #f44336',
                height: '80px',
                borderRadius: '8px',
                animation: metrics.urgentTickets > 0 ? 'pulse 2s infinite' : 'none'
              }}
            >
              <CardContent
                sx={{
                  textAlign: 'center',
                  py: 1,
                  px: 1.5,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Typography
                  variant='h4'
                  sx={{
                    fontWeight: 700,
                    color: '#f44336',
                    mb: 0.5,
                    lineHeight: 1
                  }}
                >
                  {metrics.urgentTickets}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{
                    color: '#888',
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }}
                >
                  URGENTES
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>



        {/* Fixed Critical Tickets Zone - Always Visible */}
        {organizedTickets.stickyUrgents.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 2,
                p: 2,
                background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.15) 0%, rgba(255, 87, 34, 0.08) 100%)',
                borderRadius: '12px',
                border: '2px solid rgba(244, 67, 54, 0.4)',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                backdropFilter: 'blur(10px)'
              }}
            >
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #f44336 0%, #ff5722 100%)',
                  borderRadius: '8px',
                  p: 1,
                  animation: 'urgentPulse 2s ease-in-out infinite'
                }}
              >
                <Warning sx={{
                  fontSize: '1.8rem',
                  color: 'white',
                  filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))'
                }} />
              </Box>
              <Typography
                variant='h5'
                sx={{
                  color: '#f44336',
                  fontWeight: 800,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                TICKETS CRÍTICOS - ATENCIÓN INMEDIATA
              </Typography>
              <Box
                sx={{
                  ml: 'auto',
                  background: 'rgba(244, 67, 54, 0.2)',
                  borderRadius: '6px',
                  px: 2,
                  py: 0.5,
                  border: '1px solid rgba(244, 67, 54, 0.4)'
                }}
              >
                <Typography
                  variant='body2'
                  sx={{
                    color: 'white',
                    fontWeight: 600
                  }}
                >
                  {organizedTickets.urgent?.length || 0} total
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={tvStyles.spacing.gridSpacing}>
              <style>
                {`
                  @keyframes urgentGlow {
                    0% { box-shadow: 0 0 20px rgba(255, 0, 0, 0.4); }
                    50% { box-shadow: 0 0 40px rgba(255, 50, 50, 0.8); }
                    100% { box-shadow: 0 0 20px rgba(255, 0, 0, 0.4); }
                  }

                  @keyframes moveBar {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                  }
              `}
              </style>
              {organizedTickets.stickyUrgents.map((ticket) => (
                <Grid item xs={tvPublicMode.maxCriticalTickets === 3 ? 4 : 6} key={ticket.id}>
                  <Card
                    sx={{
                      background: tvPublicMode.highContrast
                        ? 'linear-gradient(135deg, rgba(60, 0, 0, 0.95) 0%, rgba(80, 20, 20, 0.9) 100%)'
                        : 'linear-gradient(135deg, rgba(42, 26, 26, 0.95) 0%, rgba(60, 30, 30, 0.9) 100%)',
                      border: `3px solid ${tvStyles.colors.critical}`,
                      borderRadius: '20px',
                      backdropFilter: 'blur(15px)',
                      position: 'relative',
                      overflow: 'hidden',
                      animation: 'urgentGlow 3s ease-in-out infinite',
                      minHeight: `${tvStyles.criticalCardHeight}px`,
                      boxShadow: tvPublicMode.highContrast
                        ? '0 0 40px rgba(255, 0, 0, 0.6)'
                        : '0 0 30px rgba(244, 67, 54, 0.5)',
                      willChange: 'transform, box-shadow',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        boxShadow: tvPublicMode.highContrast
                          ? '0 0 50px rgba(255, 0, 0, 0.8)'
                          : '0 0 40px rgba(244, 67, 54, 0.7)',
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '5px',
                        background: `linear-gradient(90deg, ${tvStyles.colors.critical} 0%, #ff5722 100%)`,
                      },
                      // Barra de progreso sutil
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        height: '3px',
                        width: '100%',
                        background: 'linear-gradient(90deg, rgba(255,0,0,0.6), rgba(255,255,255,0.2))',
                        animation: 'moveBar 4s linear infinite',
                      },
                    }} 
                    onMouseEnter={() => setHoveredTicket(ticket.id)}
                    onMouseLeave={() => setHoveredTicket(null)}
                  >
                    <CardContent sx={{
                      p: tvStyles.spacing.cardPadding,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 1.5
                        }}
                      >
                        <Typography
                          variant='h5'
                          sx={{
                            fontWeight: 900,
                            color: tvStyles.colors.critical,
                            fontSize: tvStyles.typography.ticketCode,
                            textShadow: '0 0 10px rgba(255, 0, 0, 0.5)',
                            letterSpacing: '0.02em'
                          }}
                        >
                          {ticket.ticketCode}
                        </Typography>
                        <Box sx={{ transform: `scale(${tvPublicMode.enhancedSizes ? 1.3 : 1.1})` }}>
                          <MaintenancePriorityBadge
                            priority={ticket.priority}
                            size='small'
                          />
                        </Box>
                      </Box>

                      <Typography
                        variant='h6'
                        sx={{
                          color: tvStyles.colors.text,
                          mb: tvPublicMode.simplifiedInfo ? 1 : 0.5,
                          fontWeight: 700,
                          fontSize: tvStyles.typography.equipment,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          textShadow: tvPublicMode.highContrast ? '0 1px 2px rgba(0,0,0,0.5)' : 'none'
                        }}
                      >
                        {ticket.equipmentType}
                      </Typography>

                      {/* Simplified info mode shows less details */}
                      {!tvPublicMode.simplifiedInfo && (
                        <Typography
                          variant='body1'
                          sx={{
                            color: tvStyles.colors.textSecondary,
                            mb: 1,
                            fontSize: tvStyles.typography.details,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {ticket.equipmentBrand} {ticket.equipmentModel}
                        </Typography>
                      )}

                      <Box sx={{
                        mt: 'auto',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <Box sx={{ transform: `scale(${tvPublicMode.enhancedSizes ? 1.2 : 1})` }}>
                          <MaintenanceStatusBadge
                            status={ticket.status}
                            size='small'
                            tvMode={tvPublicMode.enabled}
                          />
                        </Box>
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.8,
                          background: 'rgba(255, 0, 0, 0.1)',
                          borderRadius: '8px',
                          px: 1,
                          py: 0.5
                        }}>
                          <AccessTime sx={{
                            color: tvStyles.colors.critical,
                            fontSize: `${1.2 * (tvPublicMode.enhancedSizes ? 1.2 : 1)}rem`
                          }} />
                          <Typography
                            variant='body2'
                            sx={{
                              color: tvStyles.colors.text,
                              fontWeight: 700,
                              fontSize: tvStyles.typography.status
                            }}
                          >
                            {getElapsedTime(ticket.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Paginated Tickets Grid - MAIN FOCUS */}
        <Box sx={{ flex: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
              pb: 1,
              borderBottom: '2px solid #2FB158'
            }}
          >
            <Typography
              variant='h3'
              sx={{
                color: '#2FB158',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                letterSpacing: '-0.02em'
              }}
            >
              <TrendingUp sx={{ fontSize: '2.5rem' }} />
              TICKETS ACTIVOS
              {organizedTickets.stickyUrgents.length > 0 && (
                <Typography
                  variant='h6'
                  sx={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontWeight: 500,
                    fontSize: '1rem'
                  }}
                >
                  (Críticos fijos arriba)
                </Typography>
              )}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {organizedTickets.urgent && organizedTickets?.urgent?.length > 0 && (
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, #f44336 0%, #ff5722 100%)',
                    borderRadius: '12px',
                    px: 3,
                    py: 1.5,
                    animation: 'urgentPulse 2s ease-in-out infinite',
                    boxShadow: '0 8px 24px rgba(244, 67, 54, 0.5)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                      animation: 'shimmer 2s infinite'
                    }
                  }}
                >
                  <Typography
                    variant='h5'
                    sx={{
                      color: 'white',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    <Warning sx={{
                      fontSize: '2rem',
                      animation: 'urgentShake 1s ease-in-out infinite',
                      filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))'
                    }} />
                    {organizedTickets.urgent.length} CRÍTICO{organizedTickets.urgent.length > 1 ? 'S' : ''}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                {/* Smart Pagination Status */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: smartPagination.isActive ? '#51cf66' : '#ffc107',
                      animation: smartPagination.isPaused ? 'pulse 1.5s infinite' : isTransitioning ? 'urgentPulse 1s infinite' : 'none',
                      boxShadow: smartPagination.isActive
                        ? '0 0 12px rgba(81, 207, 102, 0.6)'
                        : '0 0 12px rgba(255, 193, 7, 0.6)'
                    }}
                  />
                  <Typography
                    variant='body2'
                    sx={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      
                    }}
                  >
                    {smartPagination.isPaused ? 'Pausado por usuario' :
                      isTransitioning ? 'Cambiando página...' :
                        smartPagination.isActive ? `Activo (${smartPagination.currentSpeed}s)` : 'Detenido'}
                  </Typography>
                </Box>

                {/* Page Information */}
                {tvDisplayData &&
                  gridCalculation &&
                  organizedTickets.paginatedTickets.length > gridCalculation.ticketsPerPage && (
                    <Box
                      sx={{
                        background: 'linear-gradient(135deg, rgba(47, 177, 88, 0.2) 0%, rgba(0, 212, 255, 0.1) 100%)',
                        border: '1px solid #2FB158',
                        borderRadius: '12px',
                        px: 3,
                        py: 1.5,
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      <Typography
                        variant='h6'
                        sx={{
                          color: '#2FB158',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: '#2FB158',
                            animation: isTransitioning ? 'urgentPulse 0.5s infinite' : 'pulse 2s infinite'
                          }}
                        />
                        Página {slideIndex + 1} de{' '}
                        {Math.ceil(
                          organizedTickets.paginatedTickets.length / gridCalculation.ticketsPerPage
                        )}
                      </Typography>
                    </Box>
                  )}

                {/* Smart Speed Control */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography
                    variant='caption'
                    sx={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontWeight: 500,
                      fontSize: '0.75rem'
                    }}
                  >
                    Velocidad:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {[
                      { base: 15, urgent: 25, label: 'Rápida' },
                      { base: 20, urgent: 35, label: 'Normal' },
                      { base: 30, urgent: 45, label: 'Lenta' }
                    ].map((config, index) => (
                      <Box
                        key={index}
                        onClick={() => setSmartPagination(prev => ({
                          ...prev,
                          baseSpeed: config.base,
                          urgentSpeed: config.urgent,
                          currentSpeed: config.base
                        }))}
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          borderRadius: '6px',
                          backgroundColor: smartPagination.baseSpeed === config.base ? '#2FB158' : 'rgba(255, 255, 255, 0.1)',
                          color: smartPagination.baseSpeed === config.base ? 'white' : 'rgba(255, 255, 255, 0.7)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          '&:hover': {
                            backgroundColor: smartPagination.baseSpeed === config.base ? '#2FB158' : 'rgba(255, 255, 255, 0.2)'
                          }
                        }}
                      >
                        {config.label}
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* TV Public Mode Toggle */}
                <Box
                  onClick={() => {
                    setTvPublicMode(prev => ({ ...prev, enabled: !prev.enabled }))
                    // Update pagination speeds when toggling mode
                    setSmartPagination(prev => ({
                      ...prev,
                      baseSpeed: !tvPublicMode.enabled ? 30 : 20,
                      urgentSpeed: !tvPublicMode.enabled ? 50 : 35,
                      currentSpeed: !tvPublicMode.enabled ? 30 : 20
                    }))
                    tvPublicMode.enabled ? enterFullScreen() : exitFullScreen()
                  }}
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: '8px',
                    background: tvPublicMode.enabled
                      ? 'linear-gradient(135deg, #00d4ff 0%, #2FB158 100%)'
                      : 'linear-gradient(135deg, #666 0%, #888 100%)',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    border: tvPublicMode.enabled ? '2px solid rgba(0, 212, 255, 0.3)' : '1px solid rgba(255,255,255,0.2)',
                    '&:hover': {
                      boxShadow: tvPublicMode.enabled ? '0 0 15px rgba(0, 212, 255, 0.4)' : 'none'
                    }
                  }}
                >
                  {tvPublicMode.enabled ? 'MODO TV' : 'MODO NORMAL'}
                </Box>

                {/* Pause/Resume Control */}
                <Box
                  onClick={() => setSmartPagination(prev => ({ ...prev, isActive: !prev.isActive }))}
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: '8px',
                    background: smartPagination.isActive
                      ? 'linear-gradient(135deg, #ff9800 0%, #f44336 100%)'
                      : 'linear-gradient(135deg, #2FB158 0%, #00d4ff 100%)',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                  
                  }}
                >
                  {smartPagination.isActive ? 'PAUSAR' : 'REANUDAR'}
                </Box>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              animation: smartPagination.smoothTransitions
                ? `smartSlideIn 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)`
                : 'none',
              animationFillMode: 'both',
              transition: 'all 0.8s ease-in-out',
              opacity: isTransitioning ? 0.7 : 1,
              transform: isTransitioning ? 'translateY(10px)' : 'translateY(0)',
              filter: isTransitioning ? 'blur(1px)' : 'blur(0)'
            }}
            key={`smart-page-${slideIndex}-${animationKey}`}
            // onMouseEnter={() => setSmartPagination(prev => ({ ...prev, isPaused: true }))}
            // onMouseLeave={() => setSmartPagination(prev => ({ ...prev, isPaused: false }))}
          >
            <Grid
              container
              spacing={gridCalculation ? gridCalculation.cardSpacing / 8 : 1.5}
              sx={{
                minHeight: gridCalculation
                  ? gridCalculation.containerHeight - (organizedTickets.stickyUrgents.length > 0 ? 180 : 0) // Adjust for sticky urgents
                  : 'auto'
              }}
            >
              {currentPageTickets.map((ticket, index) => (
                <Grid
                  item
                  xs={gridCalculation ? 12 / gridCalculation.columns : 3}
                  key={ticket.id}
                >
                  <Box
                    sx={{
                      animation: `cardFloatIn 2s cubic-bezier(0.34, 1.56, 0.64, 1)`,
                      animationDelay: `${index * 120}ms`,
                      animationFillMode: 'both',
                      transition: 'transform 0.3s ease-out'
                    }}
                  >
                    <Card
                      sx={{
                        background: ticket.priority === 'urgent'
                          ? (tvPublicMode.highContrast
                            ? 'linear-gradient(135deg, rgba(60, 0, 0, 0.95) 0%, rgba(80, 20, 20, 0.9) 100%)'
                            : 'linear-gradient(135deg, rgba(42, 26, 26, 0.95) 0%, rgba(60, 30, 30, 0.9) 100%)')
                          : ticket.priority === MaintenancePriority.HIGH
                            ? (tvPublicMode.highContrast
                              ? 'linear-gradient(135deg, rgba(40, 0, 0, 0.1) 0%, rgba(26, 26, 26, 0.95) 100%)'
                              : 'linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(26, 26, 26, 0.95) 100%)')
                            : `linear-gradient(135deg, ${tvStyles.colors.cardBackground} 0%, rgba(40, 40, 40, 0.9) 100%)`,
                        backdropFilter: 'blur(15px)',
                        borderRadius: '16px',
                        border: ticket.priority === 'urgent'
                          ? `3px solid ${tvStyles.colors.critical}`
                          : ticket.priority === MaintenancePriority.HIGH
                            ? `2px solid rgba(${tvPublicMode.highContrast ? '255, 0, 0' : '244, 67, 54'}, 0.4)`
                            : '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: ticket.priority === 'urgent'
                          ? (tvPublicMode.highContrast
                            ? '0 0 40px rgba(255, 0, 0, 0.5)'
                            : '0 0 30px rgba(244, 67, 54, 0.4)')
                          : ticket.priority === MaintenancePriority.HIGH
                            ? '0 8px 24px rgba(244, 67, 54, 0.2)'
                            : '0 6px 20px rgba(0,0,0,0.3)',
                        animation: ticket.priority === 'urgent'
                          ? 'urgentGlow 3s ease-in-out infinite'
                          : 'none',
                        height: `${tvStyles.regularCardHeight}px`,
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease-in-out',
                        cursor: 'pointer',
                        '&:hover': {
                          boxShadow: ticket.priority === 'urgent'
                            ? (tvPublicMode.highContrast
                              ? '0 0 50px rgba(255, 0, 0, 0.7)'
                              : '0 0 40px rgba(244, 67, 54, 0.6)')
                            : ticket.priority === MaintenancePriority.HIGH
                              ? '0 12px 32px rgba(244, 67, 54, 0.3)'
                              : '0 10px 28px rgba(0, 212, 255, 0.25)',
                          zIndex: 10
                        },
                        '&::before': ticket.priority === 'urgent' || ticket.priority === MaintenancePriority.HIGH ? {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '4px',
                          background: `linear-gradient(90deg, ${tvStyles.colors.critical} 0%, #ff5722 100%)`
                        } : {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '3px',
                          background: 'linear-gradient(90deg, #00d4ff 0%, #2FB158 100%)'
                        }
                      }}
                      onMouseEnter={() => setHoveredTicket(ticket.id)}
                      onMouseLeave={() => setHoveredTicket(null)}
                    >
                      <CardContent
                        sx={{
                          p: tvStyles.spacing.cardPadding,
                          flexGrow: 1,
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 1.5
                          }}
                        >
                          <Typography
                            variant='h6'
                            sx={{
                              fontWeight: 800,
                              color: ticket.priority === 'urgent'
                                ? tvStyles.colors.critical
                                : tvStyles.colors.text,
                              fontSize: tvStyles.typography.ticketCode,
                              textShadow: tvPublicMode.highContrast && ticket.priority === 'urgent'
                                ? '0 0 8px rgba(255, 0, 0, 0.4)'
                                : 'none'
                            }}
                          >
                            {ticket.ticketCode}
                          </Typography>
                          <Box sx={{ transform: `scale(${tvPublicMode.enhancedSizes ? 1.2 : 1})` }}>
                            <MaintenancePriorityBadge
                              priority={ticket.priority}
                              size='small'
                            />
                          </Box>
                        </Box>

                        <Typography
                          variant='subtitle1'
                          sx={{
                            color: tvStyles.colors.text,
                            mb: tvPublicMode.simplifiedInfo ? 1.5 : 0.8,
                            fontWeight: 700,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: tvStyles.typography.equipment,
                            textShadow: tvPublicMode.highContrast ? '0 1px 2px rgba(0,0,0,0.5)' : 'none'
                          }}
                        >
                          {ticket.equipmentType}
                        </Typography>

                        {/* Show equipment details only in non-simplified mode */}

                        {!tvPublicMode.simplifiedInfo && (
                          <Typography
                            variant='body2'
                            sx={{
                              color: tvStyles.colors.textSecondary,
                              mb: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: tvStyles.typography.details
                            }}
                          >
                            {ticket.equipmentBrand} {ticket.equipmentModel}
                          </Typography>
                        )}

                        <Box sx={{ mt: 'auto' }}>
                          <Box sx={{ mb: 1.5 }}>
                            <Box sx={{ transform: `scale(${tvPublicMode.enhancedSizes ? 1.1 : 1})`, ml: 3 }}>
                              <MaintenanceStatusBadge
                                status={ticket.status}
                                size='small'
                              />
                            </Box>
                          </Box>

                          {/* Show technician info only in non-simplified mode */}
                          {!tvPublicMode.simplifiedInfo && (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.8,
                                mb: 1,
                                p: 1,
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '6px'
                              }}
                            >
                              <Person sx={{
                                color: tvStyles.colors.textSecondary,
                                fontSize: `${1.1 * (tvPublicMode.enhancedSizes ? 1.2 : 1)}rem`
                              }} />
                              <Typography
                                variant='body2'
                                sx={{
                                  color: tvStyles.colors.textSecondary,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  flex: 1,
                                  fontSize: tvStyles.typography.status,
                                  fontWeight: 600
                                }}
                              >
                                {ticket.assignedTechnician?.name || 'Sin asignar'}
                              </Typography>
                            </Box>
                          )}

                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.8,
                              p: 1,
                              background: 'rgba(0, 212, 255, 0.08)',
                              borderRadius: '8px',
                              border: '1px solid rgba(0, 212, 255, 0.2)'
                            }}
                          >
                            <AccessTime
                              sx={{
                                color: '#00d4ff',
                                fontSize: `${1.1 * (tvPublicMode.enhancedSizes ? 1.2 : 1)}rem`
                              }}
                            />
                            <Typography
                              variant='body2'
                              sx={{
                                color: tvStyles.colors.text,
                                fontSize: tvStyles.typography.status,
                                fontWeight: 600
                              }}
                            >
                              {getElapsedTime(ticket.createdAt)}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>

        {/* Smart Pagination Progress Indicator */}
        {tvDisplayData &&
          gridCalculation &&
          organizedTickets.paginatedTickets.length >
          gridCalculation.ticketsPerPage && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                mt: 3,
                mb: 2,
                gap: 3,
                p: 2,
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* Progress Info */}
              <Typography
                variant='body2'
                sx={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: 600,
                  minWidth: '140px'
                }}
              >
                Paginados: {Math.min((slideIndex + 1) * gridCalculation.ticketsPerPage, organizedTickets.paginatedTickets.length)} de {organizedTickets.paginatedTickets.length}
                {organizedTickets.stickyUrgents.length > 0 && (
                  <Typography component="span" sx={{ display: 'block', fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                    +{organizedTickets.stickyUrgents.length} críticos fijos
                  </Typography>
                )}
              </Typography>

              {/* Enhanced Progress Bar */}
              <Box
                sx={{
                  flex: 1,
                  maxWidth: '400px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  p: 0.5,
                  position: 'relative'
                }}
              >
                <LinearProgress
                  variant='determinate'
                  value={
                    ((slideIndex + 1) /
                      Math.ceil(
                        organizedTickets.paginatedTickets.length /
                        gridCalculation.ticketsPerPage
                      )) *
                    100
                  }
                  sx={{
                    height: '8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(90deg, #2FB158 0%, #00d4ff 100%)',
                      borderRadius: '6px',
                      boxShadow: '0 0 12px rgba(47, 177, 88, 0.4)',
                      animation: 'progressGlow 3s ease-in-out infinite'
                    }
                  }}
                />
              </Box>

              {/* Percentage */}
              <Typography
                variant='body2'
                sx={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: 600,
                  minWidth: '50px',
                  textAlign: 'right'
                }}
              >
                {Math.round(((slideIndex + 1) /
                  Math.ceil(
                    organizedTickets.paginatedTickets.length /
                    gridCalculation.ticketsPerPage
                  )) * 100)}%
              </Typography>

              {/* Manual Navigation */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Box
                  onClick={() => {
                    if (slideIndex > 0) {
                      setIsTransitioning(true)
                      setTimeout(() => {
                        setSlideIndex(prev => prev - 1)
                        setIsTransitioning(false)
                      }, 400)
                    }
                  }}
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '6px',
                    background: slideIndex > 0 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    color: slideIndex > 0 ? 'white' : 'rgba(255, 255, 255, 0.3)',
                    cursor: slideIndex > 0 ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    '&:hover': slideIndex > 0 ? {
                      background: 'rgba(255, 255, 255, 0.2)'
                    } : {}
                  }}
                >
                  ←
                </Box>
                <Box
                  onClick={() => {
                    // const maxPages = Math.ceil(organizedTickets.paginatedTickets.length / (gridCalculation?.ticketsPerPage || 12))
                    // if (slideIndex < maxPages - 1) {
                    //   setIsTransitioning(true)
                    //   setTimeout(() => {
                    //     setSlideIndex(prev => prev + 1)
                    //     setIsTransitioning(false)
                    //   }, 400)
                    // }
                  }}
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '6px',
                    background: slideIndex < Math.ceil(organizedTickets.paginatedTickets.length / (gridCalculation?.ticketsPerPage || 12)) - 1
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(255, 255, 255, 0.05)',
                    color: slideIndex < Math.ceil(organizedTickets.paginatedTickets.length / (gridCalculation?.ticketsPerPage || 12)) - 1
                      ? 'white'
                      : 'rgba(255, 255, 255, 0.3)',
                    cursor: slideIndex < Math.ceil(organizedTickets.paginatedTickets.length / (gridCalculation?.ticketsPerPage || 12)) - 1
                      ? 'pointer'
                      : 'not-allowed',
                    transition: 'all 0.2s ease',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    '&:hover': slideIndex < Math.ceil(organizedTickets.paginatedTickets.length / (gridCalculation?.ticketsPerPage || 12)) - 1 ? {
                      background: 'rgba(255, 255, 255, 0.2)'
                    } : {}
                  }}
                >
                  →
                </Box>
              </Box>
            </Box>
          )}
      </Container>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
          }

          @keyframes urgentGlow {
            0% { box-shadow: 0 0 20px rgba(244, 67, 54, 0.3); }
            50% { box-shadow: 0 0 30px rgba(244, 67, 54, 0.6); }
            100% { box-shadow: 0 0 20px rgba(244, 67, 54, 0.3); }
          }

          /* Smooth marquee-like slide transitions */
          @keyframes smoothSlideIn {
            0% {
              opacity: 0;
              transform: translateX(120px) scale(0.92) rotateY(15deg);
              filter: blur(3px);
            }
            15% {
              opacity: 0.2;
              transform: translateX(80px) scale(0.96) rotateY(8deg);
              filter: blur(2px);
            }
            40% {
              opacity: 0.6;
              transform: translateX(30px) scale(0.98) rotateY(3deg);
              filter: blur(1px);
            }
            70% {
              opacity: 0.9;
              transform: translateX(5px) scale(0.99) rotateY(1deg);
              filter: blur(0.2px);
            }
            100% {
              opacity: 1;
              transform: translateX(0) scale(1) rotateY(0deg);
              filter: blur(0);
            }
          }

          @keyframes smoothSlideOut {
            0% {
              opacity: 1;
              transform: translateX(0) scale(1) rotateY(0deg);
              filter: blur(0);
            }
            30% {
              opacity: 0.9;
              transform: translateX(-5px) scale(0.99) rotateY(-1deg);
              filter: blur(0.2px);
            }
            60% {
              opacity: 0.6;
              transform: translateX(-30px) scale(0.98) rotateY(-3deg);
              filter: blur(1px);
            }
            85% {
              opacity: 0.2;
              transform: translateX(-80px) scale(0.96) rotateY(-8deg);
              filter: blur(2px);
            }
            100% {
              opacity: 0;
              transform: translateX(-120px) scale(0.92) rotateY(-15deg);
              filter: blur(3px);
            }
          }

          /* Enhanced animations for smart scroll system */
          @keyframes progressGlow {
            0% { box-shadow: 0 0 5px rgba(47, 177, 88, 0.3); }
            50% { box-shadow: 0 0 15px rgba(47, 177, 88, 0.6); }
            100% { box-shadow: 0 0 5px rgba(47, 177, 88, 0.3); }
          }

          @keyframes urgentPulse {
            0% { 
              transform: scale(1);
              box-shadow: 0 8px 24px rgba(244, 67, 54, 0.5);
            }
            50% { 
              transform: scale(1.05);
              box-shadow: 0 12px 32px rgba(244, 67, 54, 0.7);
            }
            100% { 
              transform: scale(1);
              box-shadow: 0 8px 24px rgba(244, 67, 54, 0.5);
            }
          }

          @keyframes urgentShake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
            20%, 40%, 60%, 80% { transform: translateX(2px); }
          }

          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }

          /* Smart pagination transitions */
          @keyframes smartSlideIn {
            0% {
              opacity: 0;
              transform: translateX(60px) scale(0.95);
              filter: blur(2px);
            }
            30% {
              opacity: 0.4;
              transform: translateX(20px) scale(0.98);
              filter: blur(1px);
            }
            70% {
              opacity: 0.8;
              transform: translateX(5px) scale(0.99);
              filter: blur(0.5px);
            }
            100% {
              opacity: 1;
              transform: translateX(0) scale(1);
              filter: blur(0);
            }
          }

          @keyframes smartSlideOut {
            0% {
              opacity: 1;
              transform: translateX(0) scale(1);
              filter: blur(0);
            }
            30% {
              opacity: 0.8;
              transform: translateX(-5px) scale(0.99);
              filter: blur(0.5px);
            }
            70% {
              opacity: 0.4;
              transform: translateX(-20px) scale(0.98);
              filter: blur(1px);
            }
            100% {
              opacity: 0;
              transform: translateX(-60px) scale(0.95);
              filter: blur(2px);
            }
          }

          /* Enhanced card entrance animation */
          @keyframes cardFloatIn {
            0% {
              opacity: 0;
              transform: translateY(40px) rotateX(15deg) scale(0.8);
              filter: blur(1px);
            }
            30% {
              opacity: 0.4;
              transform: translateY(10px) rotateX(5deg) scale(0.95);
              filter: blur(0.5px);
            }
            70% {
              opacity: 0.9;
              transform: translateY(-8px) rotateX(-3deg) scale(1.05);
              filter: blur(0);
            }
            85% {
              opacity: 1;
              transform: translateY(2px) rotateX(1deg) scale(0.98);
            }
            100% {
              opacity: 1;
              transform: translateY(0) rotateX(0deg) scale(1);
            }
          }
        `}
      </style>
    </Box>
  )
}

export default MaintenanceTVDisplayPublic
