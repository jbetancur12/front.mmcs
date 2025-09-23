import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Alert,
  Fade,
  Slide,
  Grow,
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
import {
  useMaintenanceTickets,
  useMaintenanceStats
} from '../../hooks/useMaintenance'
import {
  MaintenancePriority,
  MaintenanceStatus
} from '../../types/maintenance'
import MaintenancePriorityBadge from './MaintenancePriorityBadge'
import MaintenanceStatusBadge from './MaintenanceStatusBadge'

interface TVMetrics {
  totalTickets: number
  pendingTickets: number
  inProgressTickets: number
  completedTickets: number
  urgentTickets: number
}

/**
 * MaintenanceTVDisplay - A comprehensive TV display component for maintenance tickets
 * Optimized for large screens (1920x1080+) with real-time updates and auto-refresh
 *
 * Features:
 * - Real-time clock and date display
 * - Live metrics dashboard
 * - Priority-based ticket organization
 * - Urgent ticket animations
 * - Auto-refresh every 30 seconds
 * - Error handling and loading states
 * - Dark theme optimized for office environments
 */
const MaintenanceTVDisplay: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [slideIndex, setSlideIndex] = useState(0)
  const [animationKey, setAnimationKey] = useState(0)

  // Fetch data with auto-refresh
  const {
    data: ticketsResponse,
    isLoading: ticketsLoading,
    error: ticketsError,
    refetch: refetchTickets
  } = useMaintenanceTickets(
    {}, // No filters to get all tickets
    1,
    50 // Get more tickets for TV display
  )

  const {
    // data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useMaintenanceStats()

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      refetchTickets()
      refetchStats()
      setAnimationKey((prev) => prev + 1)
    }, 30000)

    return () => clearInterval(refreshInterval)
  }, [refetchTickets, refetchStats])

  // Update clock every second
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(clockInterval)
  }, [])

  // Auto-slide tickets every 10 seconds if there are many
  useEffect(() => {
    if (ticketsResponse?.tickets && ticketsResponse.tickets.length > 12) {
      const slideInterval = setInterval(() => {
        setSlideIndex((prev) =>
          prev >= Math.ceil(ticketsResponse.tickets.length / 12) - 1
            ? 0
            : prev + 1
        )
      }, 10000)

      return () => clearInterval(slideInterval)
    }
  }, [ticketsResponse?.tickets])

  // Calculate metrics
  const metrics: TVMetrics = useMemo(() => {
    if (!ticketsResponse?.tickets) {
      return {
        totalTickets: 0,
        pendingTickets: 0,
        inProgressTickets: 0,
        completedTickets: 0,
        urgentTickets: 0
      }
    }

    const tickets = ticketsResponse.tickets
    return {
      totalTickets: tickets.length,
      pendingTickets: tickets.filter(
        (t) => t.status === MaintenanceStatus.PENDING
      ).length,
      inProgressTickets: tickets.filter(
        (t) =>
          t.status === MaintenanceStatus.IN_PROGRESS ||
          t.status === MaintenanceStatus.ASSIGNED
      ).length,
      completedTickets: tickets.filter(
        (t) => t.status === MaintenanceStatus.COMPLETED
      ).length,
      urgentTickets: tickets.filter(
        (t) =>
          t.priority === MaintenancePriority.URGENT ||
          t.priority === MaintenancePriority.HIGH
      ).length
    }
  }, [ticketsResponse?.tickets])

  // Organize tickets by priority
  const organizedTickets = useMemo(() => {
    if (!ticketsResponse?.tickets) return { urgent: [], high: [], normal: [] }

    const tickets = ticketsResponse.tickets
    return {
      urgent: tickets.filter((t) => t.priority === MaintenancePriority.URGENT),
      high: tickets.filter((t) => t.priority === MaintenancePriority.HIGH),
      normal: tickets.filter(
        (t) =>
          t.priority === MaintenancePriority.MEDIUM ||
          t.priority === MaintenancePriority.LOW
      )
    }
  }, [ticketsResponse?.tickets])

  // Get tickets for current slide
  const currentSliceTickets = useMemo(() => {
    const allNormalTickets = [
      ...organizedTickets.high,
      ...organizedTickets.normal
    ]
    const startIndex = slideIndex * 12
    return allNormalTickets.slice(startIndex, startIndex + 12)
  }, [organizedTickets, slideIndex])

  // Calculate elapsed time since ticket creation
  const getElapsedTime = (createdAt: string) => {
    return formatDistanceToNow(new Date(createdAt), {
      locale: es,
      addSuffix: false
    })
  }

  // Error state
  if (ticketsError || statsError) {
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
  if (ticketsLoading || statsLoading) {
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
        fontFamily: 'Roboto, sans-serif'
      }}
    >
      {/* Header with Clock and Title */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2FB158 100%)',
          p: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Build sx={{ fontSize: '3rem', color: 'white' }} />
          <Typography variant='h2' sx={{ fontWeight: 'bold', color: 'white' }}>
            MetroMedics - Centro de Mantenimiento
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'right' }}>
          <Typography
            variant='h3'
            sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}
          >
            {format(currentTime, 'HH:mm:ss')}
          </Typography>
          <Typography variant='h5' sx={{ color: 'rgba(255,255,255,0.9)' }}>
            {format(currentTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </Typography>
        </Box>
      </Box>

      <Container maxWidth={false} sx={{ px: 4, py: 3 }}>
        {/* Metrics Dashboard */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={2.4}>
            <Card
              sx={{
                backgroundColor: '#1a1a1a',
                borderLeft: '6px solid #2FB158',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Assignment
                  sx={{ fontSize: '3rem', color: '#2FB158', mb: 2 }}
                />
                <Typography
                  variant='h3'
                  sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}
                >
                  {metrics.totalTickets}
                </Typography>
                <Typography variant='h6' sx={{ color: '#888' }}>
                  Total Tickets
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={2.4}>
            <Card
              sx={{
                backgroundColor: '#1a1a1a',
                borderLeft: '6px solid #ff9800',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <AccessTime
                  sx={{ fontSize: '3rem', color: '#ff9800', mb: 2 }}
                />
                <Typography
                  variant='h3'
                  sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}
                >
                  {metrics.pendingTickets}
                </Typography>
                <Typography variant='h6' sx={{ color: '#888' }}>
                  Pendientes
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={2.4}>
            <Card
              sx={{
                backgroundColor: '#1a1a1a',
                borderLeft: '6px solid #3f50b5',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Build sx={{ fontSize: '3rem', color: '#3f50b5', mb: 2 }} />
                <Typography
                  variant='h3'
                  sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}
                >
                  {metrics.inProgressTickets}
                </Typography>
                <Typography variant='h6' sx={{ color: '#888' }}>
                  En Progreso
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={2.4}>
            <Card
              sx={{
                backgroundColor: '#1a1a1a',
                borderLeft: '6px solid #4caf50',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <CheckCircle
                  sx={{ fontSize: '3rem', color: '#4caf50', mb: 2 }}
                />
                <Typography
                  variant='h3'
                  sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}
                >
                  {metrics.completedTickets}
                </Typography>
                <Typography variant='h6' sx={{ color: '#888' }}>
                  Completados
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={2.4}>
            <Card
              sx={{
                backgroundColor: '#1a1a1a',
                borderLeft: '6px solid #f44336',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                animation:
                  metrics.urgentTickets > 0 ? 'pulse 2s infinite' : 'none'
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Warning sx={{ fontSize: '3rem', color: '#f44336', mb: 2 }} />
                <Typography
                  variant='h3'
                  sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}
                >
                  {metrics.urgentTickets}
                </Typography>
                <Typography variant='h6' sx={{ color: '#888' }}>
                  Urgentes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Urgent Tickets Section */}
        {organizedTickets.urgent.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography
              variant='h4'
              sx={{
                mb: 3,
                color: '#f44336',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                animation: 'pulse 2s infinite'
              }}
            >
              <Warning sx={{ fontSize: '2.5rem' }} />
              TICKETS URGENTES
            </Typography>

            <Grid container spacing={2}>
              {organizedTickets.urgent.map((ticket) => (
                <Grid item xs={6} key={ticket.id}>
                  <Grow
                    in={true}
                    timeout={1000}
                    key={`urgent-${ticket.id}-${animationKey}`}
                  >
                    <Card
                      sx={{
                        backgroundColor: '#2a1a1a',
                        border: '2px solid #f44336',
                        borderRadius: 3,
                        boxShadow: '0 0 20px rgba(244, 67, 54, 0.3)',
                        animation: 'urgentGlow 3s ease-in-out infinite'
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 2
                          }}
                        >
                          <Typography
                            variant='h5'
                            sx={{ fontWeight: 'bold', color: '#f44336' }}
                          >
                            {ticket.ticketCode}
                          </Typography>
                          <MaintenancePriorityBadge
                            priority={ticket.priority}
                            size='medium'
                          />
                        </Box>

                        <Typography
                          variant='h6'
                          sx={{ color: 'white', mb: 1, fontWeight: 'medium' }}
                        >
                          {ticket.equipmentType} - {ticket.equipmentBrand}
                        </Typography>

                        <Typography
                          variant='body1'
                          sx={{ color: '#ccc', mb: 2 }}
                        >
                          {ticket.equipmentModel} ({ticket.equipmentSerial})
                        </Typography>

                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2
                          }}
                        >
                          <MaintenanceStatusBadge
                            status={ticket.status}
                            size='medium'
                          />
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}
                          >
                            <Person sx={{ color: '#888' }} />
                            <Typography variant='body2' sx={{ color: '#888' }}>
                              {ticket.assignedTechnician?.name || 'Sin asignar'}
                            </Typography>
                          </Box>
                        </Box>

                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <AccessTime
                            sx={{ color: '#888', fontSize: '1.2rem' }}
                          />
                          <Typography variant='body2' sx={{ color: '#888' }}>
                            Hace {getElapsedTime(ticket.createdAt)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grow>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Regular Tickets Grid */}
        <Box>
          <Typography
            variant='h4'
            sx={{
              mb: 3,
              color: '#2FB158',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <TrendingUp sx={{ fontSize: '2.5rem' }} />
            TICKETS ACTIVOS
            {ticketsResponse && ticketsResponse.tickets.length > 12 && (
              <Chip
                label={`${slideIndex + 1} de ${Math.ceil((organizedTickets.high.length + organizedTickets.normal.length) / 12)}`}
                sx={{ ml: 2, fontSize: '1rem' }}
              />
            )}
          </Typography>

          <Slide
            direction='left'
            in={true}
            timeout={800}
            key={`slide-${slideIndex}-${animationKey}`}
          >
            <Grid container spacing={2}>
              {currentSliceTickets.map((ticket, index) => (
                <Grid item xs={3} key={ticket.id}>
                  <Fade
                    in={true}
                    timeout={1000}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <Card
                      sx={{
                        backgroundColor: '#1a1a1a',
                        borderRadius: 2,
                        border:
                          ticket.priority === MaintenancePriority.HIGH
                            ? '1px solid #f44336'
                            : '1px solid #333',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                        height: '280px',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <CardContent
                        sx={{
                          p: 2,
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
                              color: 'white',
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
                            mb: 1,
                            fontWeight: 'medium',
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
                            color: '#ccc',
                            mb: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
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
                              gap: 1,
                              mb: 1
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
                                flex: 1
                              }}
                            >
                              {ticket.assignedTechnician?.name || 'Sin asignar'}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}
                          >
                            <AccessTime
                              sx={{ color: '#888', fontSize: '1rem' }}
                            />
                            <Typography
                              variant='caption'
                              sx={{ color: '#888' }}
                            >
                              {getElapsedTime(ticket.createdAt)}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Fade>
                </Grid>
              ))}
            </Grid>
          </Slide>
        </Box>

        {/* Progress indicator for sliding */}
        {ticketsResponse && ticketsResponse.tickets.length > 12 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <LinearProgress
              variant='determinate'
              value={
                ((slideIndex + 1) /
                  Math.ceil(
                    (organizedTickets.high.length +
                      organizedTickets.normal.length) /
                      12
                  )) *
                100
              }
              sx={{
                width: '200px',
                height: '6px',
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
        `}
      </style>
    </Box>
  )
}

export default MaintenanceTVDisplay
