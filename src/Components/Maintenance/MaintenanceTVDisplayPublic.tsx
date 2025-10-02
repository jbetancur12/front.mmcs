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
  CheckCircle,
  Warning,
  Person,
  Assignment,
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

  // Fetch data with auto-refresh using public endpoint
  const {
    data: tvDisplayData,
    isLoading: isLoading,
    error: error
  } = useTVDisplayDataWithWebSocket()

  // Get responsive grid calculations
  const { gridCalculation, breakpointInfo } = useResponsiveTicketGrid()

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

  // Organize all tickets together with urgent tickets prioritized
  const organizedTickets = useMemo(() => {
    if (!tvDisplayData?.tickets) return { allActive: [] }

    const tickets = tvDisplayData.tickets
    // Combine all tickets in priority order: urgent first, then high, medium, low
    const allActive = [
      ...(tickets.urgent || []),
      ...(tickets.high || []),
      ...(tickets.medium || []),
      ...(tickets.low || [])
    ]

    return {
      allActive,
      urgent: tickets.urgent || [],
      high: tickets.high || [],
      normal: [...(tickets.medium || []), ...(tickets.low || [])]
    }
  }, [tvDisplayData?.tickets])

  // Auto-slide tickets with smooth transitions every 20 seconds if there are many
  useEffect(() => {
    if (organizedTickets?.allActive && gridCalculation) {
      const totalTickets = organizedTickets.allActive.length
      const { ticketsPerPage } = gridCalculation

      if (totalTickets > ticketsPerPage) {
        const slideInterval = setInterval(() => {
          setSlideIndex((prev) =>
            prev >= Math.ceil(totalTickets / ticketsPerPage) - 1 ? 0 : prev + 1
          )
        }, 25000) // Increased to 25 seconds for smoother marquee-like experience

        return () => clearInterval(slideInterval)
      } else {
        // Reset slide index if all tickets fit on one page
        setSlideIndex(0)
      }
    }
  }, [organizedTickets?.allActive, gridCalculation])

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

  // Get tickets for current slide using dynamic calculation
  const currentSliceTickets = useMemo(() => {
    if (!gridCalculation) return []

    const { ticketsPerPage } = gridCalculation
    const startIndex = slideIndex * ticketsPerPage
    return organizedTickets.allActive.slice(
      startIndex,
      startIndex + ticketsPerPage
    )
  }, [organizedTickets, slideIndex, gridCalculation])

  // Calculate elapsed time since ticket creation
  const getElapsedTime = (createdAt: string) => {
    return formatDistanceToNow(new Date(createdAt), {
      locale: es,
      addSuffix: false
    })
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
        backgroundColor: '#121212',
        color: 'white',
        overflow: 'hidden',
        fontFamily: 'Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header with Clock and Title - Compact Version */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2FB158 100%)',
          py: 0.8,
          px: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          minHeight: '56px'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Build sx={{ fontSize: '1.8rem', color: 'white' }} />
          <Typography
            variant='h5'
            sx={{ fontWeight: 'bold', color: 'white', lineHeight: 1 }}
          >
            MetroMedics - Centro de Mantenimiento
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'right', minWidth: '200px' }}>
          <Typography
            variant='h5'
            sx={{ fontWeight: 'bold', color: 'white', lineHeight: 1, mb: 0.2 }}
          >
            {format(currentTime, 'HH:mm:ss')}
          </Typography>
          <Typography
            variant='body2'
            sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem' }}
          >
            {format(currentTime, "EEEE, d 'de' MMMM", { locale: es })}
          </Typography>
        </Box>
      </Box>

      <Container maxWidth={false} sx={{ px: 3, py: 3, flex: 1 }}>
        {/* Main Metrics Row - Compact Primary KPIs */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={2.4}>
            <Card
              sx={{
                backgroundColor: '#1a1a1a',
                borderLeft: '4px solid #2FB158',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                height: '100px'
              }}
            >
              <CardContent
                sx={{
                  textAlign: 'center',
                  py: 1,
                  px: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Assignment
                  sx={{ fontSize: '1.8rem', color: '#2FB158', mb: 1 }}
                />
                <Typography
                  variant='h5'
                  sx={{
                    fontWeight: 'bold',
                    color: 'white',
                    mb: 0.5,
                    lineHeight: 1
                  }}
                >
                  {metrics.totalTickets}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: '#888', fontSize: '0.8rem' }}
                >
                  Total Activos
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={2.4}>
            <Card
              sx={{
                backgroundColor: '#1a1a1a',
                borderLeft: '4px solid #ff9800',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                height: '100px'
              }}
            >
              <CardContent
                sx={{
                  textAlign: 'center',
                  py: 1,
                  px: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <AccessTime
                  sx={{ fontSize: '1.8rem', color: '#ff9800', mb: 1 }}
                />
                <Typography
                  variant='h5'
                  sx={{
                    fontWeight: 'bold',
                    color: 'white',
                    mb: 0.5,
                    lineHeight: 1
                  }}
                >
                  {metrics.pendingTickets}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: '#888', fontSize: '0.8rem' }}
                >
                  Pendientes
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={2.4}>
            <Card
              sx={{
                backgroundColor: '#1a1a1a',
                borderLeft: '4px solid #3f50b5',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                height: '100px'
              }}
            >
              <CardContent
                sx={{
                  textAlign: 'center',
                  py: 1,
                  px: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Build sx={{ fontSize: '1.8rem', color: '#3f50b5', mb: 1 }} />
                <Typography
                  variant='h5'
                  sx={{
                    fontWeight: 'bold',
                    color: 'white',
                    mb: 0.5,
                    lineHeight: 1
                  }}
                >
                  {metrics.inProgressTickets}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: '#888', fontSize: '0.8rem' }}
                >
                  En Progreso
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={2.4}>
            <Card
              sx={{
                backgroundColor: '#1a1a1a',
                borderLeft: '4px solid #4caf50',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                height: '100px'
              }}
            >
              <CardContent
                sx={{
                  textAlign: 'center',
                  py: 1,
                  px: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <CheckCircle
                  sx={{ fontSize: '1.8rem', color: '#4caf50', mb: 1 }}
                />
                <Typography
                  variant='h5'
                  sx={{
                    fontWeight: 'bold',
                    color: 'white',
                    mb: 0.5,
                    lineHeight: 1
                  }}
                >
                  {metrics.completedTickets}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: '#888', fontSize: '0.8rem' }}
                >
                  Completados Hoy
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={2.4}>
            <Card
              sx={{
                backgroundColor: '#1a1a1a',
                borderLeft: '4px solid #f44336',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                animation:
                  metrics.urgentTickets > 0 ? 'pulse 2s infinite' : 'none',
                height: '100px'
              }}
            >
              <CardContent
                sx={{
                  textAlign: 'center',
                  py: 1,
                  px: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Warning sx={{ fontSize: '1.8rem', color: '#f44336', mb: 1 }} />
                <Typography
                  variant='h5'
                  sx={{
                    fontWeight: 'bold',
                    color: 'white',
                    mb: 0.5,
                    lineHeight: 1
                  }}
                >
                  {metrics.urgentTickets}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: '#888', fontSize: '0.8rem' }}
                >
                  Urgentes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Secondary Metrics - Compact Row */}
        <Box sx={{ mb: 2 }}>
          <Card
            sx={{
              backgroundColor: '#1a1a1a',
              borderRadius: 2,
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
            }}
          >
            {/* <CardContent sx={{ py: 1.5, px: 3 }}>
              <Grid container spacing={2} alignItems='center'>
                <Grid item xs={3}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      borderLeft: `3px solid ${metrics.overdueTickets > 0 ? '#e91e63' : '#666'}`,
                      pl: 1.5,
                      animation:
                        metrics.overdueTickets > 0
                          ? 'pulse 2s infinite'
                          : 'none'
                    }}
                  >
                    <Schedule
                      sx={{
                        fontSize: '1.5rem',
                        color: metrics.overdueTickets > 0 ? '#e91e63' : '#666'
                      }}
                    />
                    <Box>
                      <Typography
                        variant='h6'
                        sx={{
                          fontWeight: 'bold',
                          color: 'white',
                          mb: 0,
                          lineHeight: 1
                        }}
                      >
                        {metrics.overdueTickets}
                      </Typography>
                      <Typography
                        variant='caption'
                        sx={{ color: '#888', fontSize: '0.75rem' }}
                      >
                        Vencidos
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={3}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      borderLeft: '3px solid #9c27b0',
                      pl: 1.5
                    }}
                  >
                    <Group sx={{ fontSize: '1.5rem', color: '#9c27b0' }} />
                    <Box>
                      <Typography
                        variant='h6'
                        sx={{
                          fontWeight: 'bold',
                          color: 'white',
                          mb: 0,
                          lineHeight: 1
                        }}
                      >
                        {metrics.techniciansAvailable}
                      </Typography>
                      <Typography
                        variant='caption'
                        sx={{ color: '#888', fontSize: '0.75rem' }}
                      >
                        Técnicos Disponibles
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={3}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      borderLeft: '3px solid #607d8b',
                      pl: 1.5
                    }}
                  >
                    <Speed sx={{ fontSize: '1.5rem', color: '#607d8b' }} />
                    <Box>
                      <Typography
                        variant='h6'
                        sx={{
                          fontWeight: 'bold',
                          color: 'white',
                          mb: 0,
                          lineHeight: 1
                        }}
                      >
                        {formatResolutionTime(metrics.avgResolutionTimeHours)}
                      </Typography>
                      <Typography
                        variant='caption'
                        sx={{ color: '#888', fontSize: '0.75rem' }}
                      >
                        Tiempo Promedio
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={3}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      borderLeft: '3px solid #795548',
                      pl: 1.5
                    }}
                  >
                    <DateRange sx={{ fontSize: '1.5rem', color: '#795548' }} />
                    <Box>
                      <Typography
                        variant='h6'
                        sx={{
                          fontWeight: 'bold',
                          color: 'white',
                          mb: 0,
                          lineHeight: 1
                        }}
                      >
                        {metrics.completedLast30Days}
                      </Typography>
                      <Typography
                        variant='caption'
                        sx={{ color: '#888', fontSize: '0.75rem' }}
                      >
                        Completados 30 días
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent> */}
          </Card>
        </Box>

        {/* All Active Tickets Grid */}
        <Box>
          <Typography
            variant='h5'
            sx={{
              mb: 1.5,
              color: '#2FB158',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5
            }}
          >
            <TrendingUp sx={{ fontSize: '2rem' }} />
            TICKETS ACTIVOS
            {organizedTickets.urgent && organizedTickets?.urgent?.length > 0 && (
              <Box
                sx={{
                  backgroundColor: 'rgba(244, 67, 54, 0.2)',
                  border: '2px solid #f44336',
                  borderRadius: 2,
                  px: 2,
                  py: 0.5,
                  ml: 2,
                  animation: 'pulse 2s infinite'
                }}
              >
                <Typography
                  variant='body1'
                  sx={{
                    color: '#f44336',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  <Warning sx={{ fontSize: '1.2rem' }} />
                  {organizedTickets.urgent.length} URGENTE
                  {organizedTickets.urgent.length > 1 ? 'S' : ''}
                </Typography>
              </Box>
            )}
            {tvDisplayData &&
              gridCalculation &&
              organizedTickets.allActive.length >
                gridCalculation.ticketsPerPage && (
                <Box
                  sx={{
                    backgroundColor: 'rgba(47, 177, 88, 0.2)',
                    border: '1px solid #2FB158',
                    borderRadius: 2,
                    px: 2,
                    py: 0.5,
                    ml: 2
                  }}
                >
                  <Typography
                    variant='body1'
                    sx={{
                      color: '#2FB158',
                      fontWeight: 'bold',
                      fontSize: '1rem'
                    }}
                  >
                    {slideIndex + 1} de{' '}
                    {Math.ceil(
                      organizedTickets.allActive.length /
                        gridCalculation.ticketsPerPage
                    )}
                  </Typography>
                </Box>
              )}
            {/* Debug info for development - remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <Box
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid #666',
                  borderRadius: 2,
                  px: 2,
                  py: 0.5,
                  ml: 2
                }}
              >
                <Typography
                  variant='body2'
                  sx={{
                    color: '#ccc',
                    fontSize: '0.8rem'
                  }}
                >
                  {breakpointInfo.name} | {gridCalculation.columns}x
                  {gridCalculation.rows} | {gridCalculation.ticketsPerPage}
                  /página
                </Typography>
              </Box>
            )}
          </Typography>

          <Box
            sx={{
              animation: `smoothSlideIn 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
              animationFillMode: 'both',
              transition: 'all 0.8s ease-in-out',
              '&.slide-out': {
                animation: `smoothSlideOut 2.5s cubic-bezier(0.55, 0.06, 0.75, 0.54)`
              }
            }}
            key={`smooth-slide-${slideIndex}-${animationKey}`}
          >
            <Grid
              container
              spacing={gridCalculation ? gridCalculation.cardSpacing / 8 : 1.5}
              sx={{
                minHeight: gridCalculation
                  ? gridCalculation.containerHeight
                  : 'auto'
              }}
            >
              {currentSliceTickets.map((ticket, index) => (
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
                        backgroundColor:
                          ticket.priority === 'urgent' ? '#2a1a1a' : '#1a1a1a',
                        borderRadius: 2,
                        border:
                          ticket.priority === 'urgent'
                            ? '2px solid #f44336'
                            : ticket.priority === MaintenancePriority.HIGH
                              ? '1px solid #f44336'
                              : '1px solid #333',
                        boxShadow:
                          ticket.priority === 'urgent'
                            ? '0 0 20px rgba(244, 67, 54, 0.3)'
                            : '0 4px 16px rgba(0,0,0,0.3)',
                        animation:
                          ticket.priority === 'urgent'
                            ? 'urgentGlow 3s ease-in-out infinite'
                            : 'none',
                        height: gridCalculation
                          ? `${gridCalculation.cardHeight}px`
                          : '180px',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <CardContent
                        sx={{
                          p: 1.5,
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
                            mb: 1
                          }}
                        >
                          <Typography
                            variant='h6'
                            sx={{
                              fontWeight: 'bold',
                              color:
                                ticket.priority === 'urgent'
                                  ? '#f44336'
                                  : 'white',
                              fontSize: '1.1rem'
                            }}
                          >
                            {ticket.ticketCode}
                          </Typography>
                          <MaintenancePriorityBadge
                            priority={ticket.priority}
                            size='small'
                          />
                        </Box>

                        <Typography
                          variant='subtitle1'
                          sx={{
                            color: 'white',
                            mb: 0.5,
                            fontWeight: 'medium',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '0.95rem'
                          }}
                        >
                          {ticket.equipmentType}
                        </Typography>

                        <Typography
                          variant='body2'
                          sx={{
                            color: '#ccc',
                            mb: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '0.85rem'
                          }}
                        >
                          {ticket.equipmentBrand} {ticket.equipmentModel}
                        </Typography>

                        <Box sx={{ mt: 'auto' }}>
                          <Box sx={{ mb: 1 }}>
                            <MaintenanceStatusBadge
                              status={ticket.status}
                              size='small'
                            />
                          </Box>

                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              mb: 0.5
                            }}
                          >
                            <Person sx={{ color: '#888', fontSize: '1rem' }} />
                            <Typography
                              variant='caption'
                              sx={{
                                color: '#888',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1,
                                fontSize: '0.75rem'
                              }}
                            >
                              {ticket.assignedTechnician?.name || 'Sin asignar'}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}
                          >
                            <AccessTime
                              sx={{ color: '#888', fontSize: '1rem' }}
                            />
                            <Typography
                              variant='caption'
                              sx={{ color: '#888', fontSize: '0.75rem' }}
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

        {/* Progress indicator for sliding */}
        {tvDisplayData &&
          gridCalculation &&
          organizedTickets.allActive.length >
            gridCalculation.ticketsPerPage && (
            <Box
              sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}
            >
              <LinearProgress
                variant='determinate'
                value={
                  ((slideIndex + 1) /
                    Math.ceil(
                      organizedTickets.allActive.length /
                        gridCalculation.ticketsPerPage
                    )) *
                  100
                }
                sx={{
                  width: '200px',
                  height: '4px',
                  borderRadius: 3,
                  backgroundColor: '#333',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#2FB158'
                  }
                }}
              />
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

          /* Smooth progress bar animation */
          @keyframes progressGlow {
            0% { box-shadow: 0 0 5px rgba(47, 177, 88, 0.3); }
            50% { box-shadow: 0 0 15px rgba(47, 177, 88, 0.6); }
            100% { box-shadow: 0 0 5px rgba(47, 177, 88, 0.3); }
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
