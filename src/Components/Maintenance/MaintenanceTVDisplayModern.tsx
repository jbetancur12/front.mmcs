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
  Container,
  Chip
} from '@mui/material'
import {
  AccessTime,
  Build,
  Warning,
  Person,
  TrendingUp,
  CheckCircle,
  Schedule,
  Assignment,
  Error as ErrorIcon
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

/**
 * MaintenanceTVDisplayModern - Modern TV display component for maintenance tickets
 * Features clean white design with company branding and improved readability
 * Optimized for large screens (1920x1080+) with real-time WebSocket updates
 * 
 * Key Features:
 * - Clean white background with company primary color (#7bff7f)
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

  // Modern display configuration
  const [displayConfig] = useState({
    autoRefresh: true,
    slideInterval: 30, // seconds
    showAnimations: true,
    compactView: false,
    primaryColor: '#7bff7f'
  })

  // Smart Pagination System
  const [smartPagination, setSmartPagination] = useState({
    isActive: true,
    isPaused: false,
    baseSpeed: 30,
    urgentSpeed: 45,
    currentSpeed: 30,
    smoothTransitions: true,
    stickyUrgents: true
  })

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

  // Smart organization: Fixed critical tickets + paginated regular tickets
  const organizedTickets = useMemo(() => {
    if (!tvDisplayData?.tickets) return { stickyUrgents: [], paginatedTickets: [], allActive: [] }

    const tickets = tvDisplayData.tickets
    const allUrgent = tickets.urgent || []

    // Sticky urgents: Max 2 most critical tickets
    const maxStickyUrgents = 2
    const stickyUrgents = smartPagination.stickyUrgents
      ? allUrgent.slice(0, maxStickyUrgents)
      : []

    // Remaining tickets for pagination
    const remainingUrgents = allUrgent.slice(maxStickyUrgents)
    const paginatedTickets = [
      ...remainingUrgents,
      ...(tickets.high || []),
      ...(tickets.medium || []),
      ...(tickets.low || [])
    ]

    // All active for metrics
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
          }, 800)

        }, smartPagination.currentSpeed * 1000)

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
    smartPagination.currentSpeed,
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

  // Modern color system
  const modernColors = {
    primary: '#7bff7f',
    primaryLight: '#a3ff9f',
    primaryDark: '#5ed65a',
    background: '#ffffff',
    cardBackground: '#ffffff',
    secondaryBackground: '#f8f9fa',
    textPrimary: '#212529',
    textSecondary: '#6c757d',
    textMuted: '#adb5bd',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    info: '#17a2b8',
    border: '#e9ecef',
    borderLight: '#f1f3f4'
  }

  // Calculate elapsed time since ticket creation
  const getElapsedTime = (createdAt: string) => {
    return formatDistanceToNow(new Date(createdAt), {
      locale: es,
      addSuffix: false
    })
  }

  // Get connection status
  const getConnectionStatus = () => {
    if (error) return 'disconnected'
    if (isLoading) return 'connecting'
    return 'connected'
  }

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
        minHeight: '100vh',
        backgroundColor: modernColors.background,
        color: modernColors.textPrimary,
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Modern Header */}
      <Box
        sx={{
          backgroundColor: modernColors.background,
          borderBottom: `2px solid ${modernColors.borderLight}`,
          py: 2,
          px: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          minHeight: '80px'
        }}
      >
        {/* Logo and Title Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box
            sx={{
              backgroundColor: modernColors.primary,
              borderRadius: '12px',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Build sx={{ fontSize: '2rem', color: 'white' }} />
          </Box>
          <Box>
            <Typography
              variant='h4'
              sx={{
                fontWeight: 800,
                color: modernColors.textPrimary,
                lineHeight: 1,
                mb: 0.5
              }}
            >
              <Box component="span" sx={{ color: modernColors.primary }}>Metro</Box>Medics
            </Typography>
            <Typography
              variant='h6'
              sx={{
                color: modernColors.textSecondary,
                fontWeight: 500,
                lineHeight: 1
              }}
            >
              Centro de Mantenimiento
            </Typography>
          </Box>
        </Box>

        {/* Status and Time Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Connection Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: getConnectionStatus() === 'connected' 
                  ? modernColors.primary 
                  : getConnectionStatus() === 'connecting'
                  ? modernColors.warning
                  : modernColors.danger,
                boxShadow: `0 0 12px ${
                  getConnectionStatus() === 'connected' 
                    ? modernColors.primary 
                    : getConnectionStatus() === 'connecting'
                    ? modernColors.warning
                    : modernColors.danger
                }40`
              }}
            />
            <Typography
              variant='body2'
              sx={{
                color: modernColors.textSecondary,
                fontWeight: 600,
                fontSize: '0.9rem'
              }}
            >
              {getConnectionStatus() === 'connected' && 'Conectado'}
              {getConnectionStatus() === 'connecting' && 'Conectando...'}
              {getConnectionStatus() === 'disconnected' && 'Desconectado'}
            </Typography>
          </Box>

          {/* Digital Clock */}
          <Card
            sx={{
              backgroundColor: modernColors.secondaryBackground,
              border: `1px solid ${modernColors.border}`,
              borderRadius: '12px',
              p: 2,
              minWidth: '200px',
              textAlign: 'center'
            }}
          >
            <Typography
              variant='h3'
              sx={{
                fontWeight: 700,
                color: modernColors.textPrimary,
                lineHeight: 1,
                mb: 0.5,
                fontFamily: 'monospace'
              }}
            >
              {format(currentTime, 'HH:mm:ss')}
            </Typography>
            <Typography
              variant='body2'
              sx={{
                color: modernColors.textSecondary,
                fontSize: '0.85rem',
                fontWeight: 500,
                textTransform: 'capitalize'
              }}
            >
              {format(currentTime, "EEEE, d 'de' MMMM", { locale: es })}
            </Typography>
          </Card>
        </Box>
      </Box>

      <Container maxWidth={false} sx={{ px: 4, pt: 3, pb: 4, flex: 1 }}>
        {/* Metrics Dashboard */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Total Active Tickets */}
          <Grid item xs={2.4}>
            <Card
              sx={{
                backgroundColor: modernColors.cardBackground,
                border: `2px solid ${modernColors.borderLight}`,
                borderLeft: `6px solid ${modernColors.primary}`,
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                height: '140px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <CardContent
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Box
                    sx={{
                      backgroundColor: modernColors.primary,
                      borderRadius: '50%',
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Assignment sx={{ fontSize: '1.5rem', color: 'white' }} />
                  </Box>
                  <Typography
                    variant='h3'
                    sx={{
                      fontWeight: 800,
                      color: modernColors.textPrimary,
                      lineHeight: 1
                    }}
                  >
                    {metrics.totalTickets}
                  </Typography>
                </Box>
                <Typography
                  variant='body1'
                  sx={{
                    color: modernColors.textSecondary,
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  Total Activos
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Pending Tickets */}
          <Grid item xs={2.4}>
            <Card
              sx={{
                backgroundColor: modernColors.cardBackground,
                border: `2px solid ${modernColors.borderLight}`,
                borderLeft: `6px solid ${modernColors.warning}`,
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                height: '140px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <CardContent
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Box
                    sx={{
                      backgroundColor: modernColors.warning,
                      borderRadius: '50%',
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Schedule sx={{ fontSize: '1.5rem', color: 'white' }} />
                  </Box>
                  <Typography
                    variant='h3'
                    sx={{
                      fontWeight: 800,
                      color: modernColors.textPrimary,
                      lineHeight: 1
                    }}
                  >
                    {metrics.pendingTickets}
                  </Typography>
                </Box>
                <Typography
                  variant='body1'
                  sx={{
                    color: modernColors.textSecondary,
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  Pendientes
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* In Progress Tickets */}
          <Grid item xs={2.4}>
            <Card
              sx={{
                backgroundColor: modernColors.cardBackground,
                border: `2px solid ${modernColors.borderLight}`,
                borderLeft: `6px solid ${modernColors.info}`,
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                height: '140px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <CardContent
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Box
                    sx={{
                      backgroundColor: modernColors.info,
                      borderRadius: '50%',
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Build sx={{ fontSize: '1.5rem', color: 'white' }} />
                  </Box>
                  <Typography
                    variant='h3'
                    sx={{
                      fontWeight: 800,
                      color: modernColors.textPrimary,
                      lineHeight: 1
                    }}
                  >
                    {metrics.inProgressTickets}
                  </Typography>
                </Box>
                <Typography
                  variant='body1'
                  sx={{
                    color: modernColors.textSecondary,
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  En Progreso
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Completed Tickets */}
          <Grid item xs={2.4}>
            <Card
              sx={{
                backgroundColor: modernColors.cardBackground,
                border: `2px solid ${modernColors.borderLight}`,
                borderLeft: `6px solid ${modernColors.success}`,
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                height: '140px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <CardContent
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Box
                    sx={{
                      backgroundColor: modernColors.success,
                      borderRadius: '50%',
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <CheckCircle sx={{ fontSize: '1.5rem', color: 'white' }} />
                  </Box>
                  <Typography
                    variant='h3'
                    sx={{
                      fontWeight: 800,
                      color: modernColors.textPrimary,
                      lineHeight: 1
                    }}
                  >
                    {metrics.completedTickets}
                  </Typography>
                </Box>
                <Typography
                  variant='body1'
                  sx={{
                    color: modernColors.textSecondary,
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  Completados Hoy
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Urgent Tickets */}
          <Grid item xs={2.4}>
            <Card
              sx={{
                backgroundColor: modernColors.cardBackground,
                border: `2px solid ${metrics.urgentTickets > 0 ? modernColors.danger : modernColors.borderLight}`,
                borderLeft: `6px solid ${modernColors.danger}`,
                borderRadius: '16px',
                boxShadow: metrics.urgentTickets > 0 
                  ? '0 4px 16px rgba(220, 53, 69, 0.15)' 
                  : '0 4px 16px rgba(0, 0, 0, 0.1)',
                height: '140px',
                transition: 'all 0.2s ease',
                backgroundColor: metrics.urgentTickets > 0 
                  ? 'rgba(220, 53, 69, 0.02)' 
                  : modernColors.cardBackground,
                '&:hover': {
                  boxShadow: metrics.urgentTickets > 0 
                    ? '0 8px 24px rgba(220, 53, 69, 0.25)' 
                    : '0 8px 24px rgba(0, 0, 0, 0.15)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <CardContent
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Box
                    sx={{
                      backgroundColor: modernColors.danger,
                      borderRadius: '50%',
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Warning sx={{ fontSize: '1.5rem', color: 'white' }} />
                  </Box>
                  <Typography
                    variant='h3'
                    sx={{
                      fontWeight: 800,
                      color: modernColors.textPrimary,
                      lineHeight: 1
                    }}
                  >
                    {metrics.urgentTickets}
                  </Typography>
                </Box>
                <Typography
                  variant='body1'
                  sx={{
                    color: modernColors.textSecondary,
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  Urgentes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Critical Tickets Section */}
        {organizedTickets.stickyUrgents.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Card
              sx={{
                backgroundColor: 'rgba(220, 53, 69, 0.02)',
                border: `2px solid ${modernColors.danger}`,
                borderRadius: '16px',
                p: 3,
                mb: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Warning sx={{ fontSize: '2rem', color: modernColors.danger }} />
                <Typography
                  variant='h5'
                  sx={{
                    color: modernColors.danger,
                    fontWeight: 800
                  }}
                >
                  TICKETS CRÍTICOS - ATENCIÓN INMEDIATA
                </Typography>
                <Box sx={{ ml: 'auto' }}>
                  <Chip
                    label={`${organizedTickets.urgent?.length || 0} total`}
                    color="error"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Box>
            </Card>

            <Grid container spacing={3}>
              {organizedTickets.stickyUrgents.map((ticket) => (
                <Grid item xs={6} key={ticket.id}>
                  <Card
                    sx={{
                      backgroundColor: modernColors.cardBackground,
                      border: `2px solid ${modernColors.danger}`,
                      borderLeft: `6px solid ${modernColors.danger}`,
                      borderRadius: '16px',
                      boxShadow: '0 4px 16px rgba(220, 53, 69, 0.15)',
                      minHeight: '200px',
                      backgroundColor: 'rgba(220, 53, 69, 0.02)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 8px 24px rgba(220, 53, 69, 0.25)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography
                          variant='h5'
                          sx={{
                            fontWeight: 800,
                            color: modernColors.primary,
                            fontSize: '1.5rem'
                          }}
                        >
                          {ticket.ticketCode}
                        </Typography>
                        <MaintenancePriorityBadge priority={ticket.priority} size='small' />
                      </Box>

                      <Typography
                        variant='h6'
                        sx={{
                          color: modernColors.textPrimary,
                          mb: 1,
                          fontWeight: 700,
                          fontSize: '1.25rem'
                        }}
                      >
                        {ticket.equipmentType}
                      </Typography>

                      <Typography
                        variant='body1'
                        sx={{
                          color: modernColors.textSecondary,
                          mb: 2,
                          fontSize: '1rem'
                        }}
                      >
                        {ticket.equipmentBrand} {ticket.equipmentModel}
                      </Typography>

                      <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <MaintenanceStatusBadge status={ticket.status} size='small' />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccessTime sx={{ color: modernColors.textSecondary, fontSize: '1.2rem' }} />
                          <Typography
                            variant='body2'
                            sx={{
                              color: modernColors.textSecondary,
                              fontWeight: 600
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

        {/* Regular Tickets Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography
              variant='h4'
              sx={{
                color: modernColors.textPrimary,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}
            >
              <TrendingUp sx={{ fontSize: '2.5rem', color: modernColors.primary }} />
              Tickets Activos
            </Typography>

            {/* Pagination Info */}
            {tvDisplayData &&
              gridCalculation &&
              organizedTickets.paginatedTickets.length > gridCalculation.ticketsPerPage && (
                <Card
                  sx={{
                    backgroundColor: modernColors.secondaryBackground,
                    border: `1px solid ${modernColors.primary}`,
                    borderRadius: '12px',
                    px: 3,
                    py: 1.5
                  }}
                >
                  <Typography
                    variant='h6'
                    sx={{
                      color: modernColors.primary,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    Página {slideIndex + 1} de{' '}
                    {Math.ceil(organizedTickets.paginatedTickets.length / gridCalculation.ticketsPerPage)}
                  </Typography>
                </Card>
              )}
          </Box>

          {/* Regular Tickets Grid */}
          <Grid container spacing={2}>
            {currentPageTickets.map((ticket, index) => (
              <Grid
                item
                xs={gridCalculation ? 12 / gridCalculation.columns : 3}
                key={ticket.id}
              >
                <Card
                  sx={{
                    backgroundColor: modernColors.cardBackground,
                    border: `1px solid ${modernColors.border}`,
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    height: '180px',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Typography
                        variant='h6'
                        sx={{
                          fontWeight: 800,
                          color: modernColors.primary,
                          fontSize: '1.2rem'
                        }}
                      >
                        {ticket.ticketCode}
                      </Typography>
                      <MaintenancePriorityBadge priority={ticket.priority} size='small' />
                    </Box>

                    <Typography
                      variant='subtitle1'
                      sx={{
                        color: modernColors.textPrimary,
                        mb: 0.5,
                        fontWeight: 700,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {ticket.equipmentType}
                    </Typography>

                    <Typography
                      variant='body2'
                      sx={{
                        color: modernColors.textSecondary,
                        mb: 1.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {ticket.equipmentBrand} {ticket.equipmentModel}
                    </Typography>

                    <Box sx={{ mt: 'auto' }}>
                      <Box sx={{ mb: 1 }}>
                        <MaintenanceStatusBadge status={ticket.status} size='small' />
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime sx={{ color: modernColors.textSecondary, fontSize: '1rem' }} />
                        <Typography
                          variant='body2'
                          sx={{
                            color: modernColors.textSecondary,
                            fontWeight: 600,
                            fontSize: '0.85rem'
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

        {/* Pagination Progress */}
        {tvDisplayData &&
          gridCalculation &&
          organizedTickets.paginatedTickets.length > gridCalculation.ticketsPerPage && (
            <Card
              sx={{
                backgroundColor: modernColors.secondaryBackground,
                border: `1px solid ${modernColors.border}`,
                borderRadius: '12px',
                p: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Typography
                  variant='body1'
                  sx={{
                    color: modernColors.textSecondary,
                    fontWeight: 600,
                    minWidth: '140px'
                  }}
                >
                  Mostrando: {Math.min((slideIndex + 1) * gridCalculation.ticketsPerPage, organizedTickets.paginatedTickets.length)} de {organizedTickets.paginatedTickets.length}
                </Typography>

                <Box sx={{ flex: 1, maxWidth: '400px' }}>
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
                      backgroundColor: modernColors.borderLight,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: modernColors.primary,
                        borderRadius: '6px'
                      }
                    }}
                  />
                </Box>

                <Typography
                  variant='body1'
                  sx={{
                    color: modernColors.textSecondary,
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
              </Box>
            </Card>
          )}
      </Container>
    </Box>
  )
}

export default MaintenanceTVDisplayModern