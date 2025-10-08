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
  Grow,
  CircularProgress,
  Container
} from '@mui/material'
import {
  AccessTime,
  Build,
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
  totalOpen: number
  unassigned: number
  inProgress: number
  overdue: number
  urgent: number
  avgResponseTime: string
  techniciansActive: number
  oldestTicket: {
    code: string
    age: string
  } | null
}

interface ConnectionStatus {
  isConnected: boolean
  lastUpdate: Date
  reconnectAttempts: number
}

interface SmartScrollState {
  isScrolling: boolean
  isPaused: boolean
  speed: number
  currentPage: number
  ticketsPerPage: number
}

/**
 * MaintenanceTVDisplay - Enhanced TV display with intelligent scroll system
 * Features:
 * - Fixed urgent tickets always visible
 * - Smart scroll with pause controls
 * - Modern glassmorphism design
 * - Responsive layout
 */
const MaintenanceTVDisplay: React.FC = () => { 
 const [currentTime, setCurrentTime] = useState(new Date())
  const [animationKey, setAnimationKey] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: true,
    lastUpdate: new Date(),
    reconnectAttempts: 0
  })
  
  // Smart scroll system - simplified
  const [scrollState, setScrollState] = useState<SmartScrollState>({
    isScrolling: true,
    isPaused: false,
    speed: 8, // seconds per page
    currentPage: 0,
    ticketsPerPage: 12
  })
  
  const [hoveredTicket, setHoveredTicket] = useState<string | null>(null)

  // Fetch data with auto-refresh
  const {
    data: ticketsResponse,
    isLoading: ticketsLoading,
    error: ticketsError,
    refetch: refetchTickets
  } = useMaintenanceTickets(
    {
      status: [
        MaintenanceStatus.PENDING,
        MaintenanceStatus.ASSIGNED,
        MaintenanceStatus.IN_PROGRESS
      ]
    },
    1,
    100
  )

  const {
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useMaintenanceStats()

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      try {
        await refetchTickets()
        await refetchStats()
        setConnectionStatus(prev => ({
          ...prev,
          isConnected: true,
          lastUpdate: new Date(),
          reconnectAttempts: 0
        }))
        setAnimationKey((prev) => prev + 1)
      } catch (error) {
        setConnectionStatus(prev => ({
          ...prev,
          isConnected: false,
          reconnectAttempts: prev.reconnectAttempts + 1
        }))
      }
    }, 30000)

    return () => clearInterval(refreshInterval)
  }, [refetchTickets, refetchStats])

  // Update clock every second
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(clockInterval)
  }, [])  // Calculate operational metrics
  const metrics: TVMetrics = useMemo(() => {
    if (!ticketsResponse?.tickets) {
      return {
        totalOpen: 0,
        unassigned: 0,
        inProgress: 0,
        overdue: 0,
        urgent: 0,
        avgResponseTime: '0h',
        techniciansActive: 0,
        oldestTicket: null
      }
    }

    const tickets = ticketsResponse.tickets
    const now = new Date()
    
    const overdueTickets = tickets.filter(ticket => {
      const createdAt = new Date(ticket.createdAt)
      const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
      
      if (ticket.priority === MaintenancePriority.URGENT) {
        return hoursElapsed > 24
      }
      return hoursElapsed > 48
    })

    const oldestTicket = tickets.reduce((oldest, current) => {
      return new Date(current.createdAt) < new Date(oldest.createdAt) ? current : oldest
    }, tickets[0])

    const totalHours = tickets.reduce((sum, ticket) => {
      const hours = (now.getTime() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60)
      return sum + hours
    }, 0)
    const avgHours = tickets.length > 0 ? totalHours / tickets.length : 0

    const activeTechnicians = new Set(
      tickets
        .filter(t => t.assignedTechnician)
        .map(t => t.assignedTechnician!.id)
    ).size

    return {
      totalOpen: tickets.length,
      unassigned: tickets.filter(t => !t.assignedTechnician).length,
      inProgress: tickets.filter(t => t.status === MaintenanceStatus.IN_PROGRESS).length,
      overdue: overdueTickets.length,
      urgent: tickets.filter(t => 
        t.priority === MaintenancePriority.URGENT || 
        t.priority === MaintenancePriority.HIGH
      ).length,
      avgResponseTime: avgHours < 24 ? `${Math.round(avgHours)}h` : `${Math.round(avgHours / 24)}d`,
      techniciansActive: activeTechnicians,
      oldestTicket: oldestTicket ? {
        code: oldestTicket.ticketCode,
        age: formatDistanceToNow(new Date(oldestTicket.createdAt), { locale: es })
      } : null
    }
  }, [ticketsResponse?.tickets])  // Organize tickets with intelligent sorting
  const organizedTickets = useMemo(() => {
    if (!ticketsResponse?.tickets) return { urgent: [], high: [], normal: [], all: [] }

    const tickets = ticketsResponse.tickets
    const now = new Date()

    const sortTickets = (a: any, b: any) => {
      const priorityOrder: Record<MaintenancePriority, number> = {
        [MaintenancePriority.URGENT]: 4,
        [MaintenancePriority.HIGH]: 3,
        [MaintenancePriority.MEDIUM]: 2,
        [MaintenancePriority.LOW]: 1
      }
      
      const priorityDiff = priorityOrder[b.priority as MaintenancePriority] - priorityOrder[a.priority as MaintenancePriority]
      if (priorityDiff !== 0) return priorityDiff
      
      const aUnassigned = !a.assignedTechnician
      const bUnassigned = !b.assignedTechnician
      if (aUnassigned && !bUnassigned) return -1
      if (!aUnassigned && bUnassigned) return 1
      
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    }

    const sortedTickets = [...tickets].sort(sortTickets)

    const ticketsWithFlags = sortedTickets.map(ticket => ({
      ...ticket,
      isOverdue: (() => {
        const createdAt = new Date(ticket.createdAt)
        const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
        
        if (ticket.priority === MaintenancePriority.URGENT) {
          return hoursElapsed > 24
        }
        return hoursElapsed > 48
      })()
    }))

    return {
      urgent: ticketsWithFlags.filter((t) => t.priority === MaintenancePriority.URGENT),
      high: ticketsWithFlags.filter((t) => t.priority === MaintenancePriority.HIGH),
      normal: ticketsWithFlags.filter(
        (t) =>
          t.priority === MaintenancePriority.MEDIUM ||
          t.priority === MaintenancePriority.LOW
      ),
      all: ticketsWithFlags
    }
  }, [ticketsResponse?.tickets])

  // Smart scroll system
  useEffect(() => {
    if (!scrollState.isScrolling || scrollState.isPaused || hoveredTicket) {
      return
    }

    const normalTickets = [...organizedTickets.high, ...organizedTickets.normal]
    if (normalTickets.length <= scrollState.ticketsPerPage) {
      return
    }

    const scrollInterval = setInterval(() => {
      setScrollState(prev => {
        const maxPages = Math.ceil(normalTickets.length / prev.ticketsPerPage)
        const nextPage = prev.currentPage >= maxPages - 1 ? 0 : prev.currentPage + 1
        
        return { ...prev, currentPage: nextPage }
      })
    }, scrollState.speed * 1000)

    return () => clearInterval(scrollInterval)
  }, [scrollState.isScrolling, scrollState.isPaused, scrollState.speed, hoveredTicket, organizedTickets, scrollState.currentPage, scrollState.ticketsPerPage])

  // Get visible tickets
  const visibleTickets = useMemo(() => {
    const allNormalTickets = [...organizedTickets.high, ...organizedTickets.normal]
    
    if (allNormalTickets.length <= scrollState.ticketsPerPage) {
      return allNormalTickets
    }
    
    const startIndex = scrollState.currentPage * scrollState.ticketsPerPage
    return allNormalTickets.slice(startIndex, startIndex + scrollState.ticketsPerPage)
  }, [organizedTickets, scrollState.currentPage, scrollState.ticketsPerPage])

  // Fixed urgent tickets (always visible)
  const fixedUrgentTickets = useMemo(() => {
    return organizedTickets.urgent.slice(0, 4)
  }, [organizedTickets.urgent])

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
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
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
            background: 'rgba(244, 67, 54, 0.1)',
            border: '1px solid rgba(244, 67, 54, 0.3)',
            '& .MuiAlert-message': { fontSize: '1.5rem' }
          }}
        >
          Error al cargar los datos de mantenimiento. Reintentando automáticamente...
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
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 3
        }}
      >
        <CircularProgress size={80} sx={{ color: '#00d4ff' }} />
        <Typography variant='h4' sx={{ color: '#00d4ff', fontWeight: 600 }}>
          Cargando Dashboard de Mantenimiento...
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
        color: 'white',
        overflow: 'hidden',
        fontFamily: 'Roboto, sans-serif',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(0, 212, 255, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(102, 198, 98, 0.03) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: -1
        }
      }}
    > 
     {/* Modern Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.12) 0%, rgba(102, 198, 98, 0.08) 50%, rgba(118, 75, 162, 0.12) 100%)',
          backdropFilter: 'blur(60px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          py: 2,
          px: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '80px',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 20,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Logo and Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box
            sx={{
              background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(102, 198, 98, 0.15) 100%)',
              borderRadius: '16px',
              p: 1.5,
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              boxShadow: '0 8px 32px rgba(0, 212, 255, 0.15)'
            }}
          >
            <Build sx={{ 
              fontSize: '2.2rem', 
              color: '#00d4ff',
              filter: 'drop-shadow(0 0 8px rgba(0, 212, 255, 0.5))'
            }} />
          </Box>
          <Box>
            <Typography
              variant='h3'
              sx={{ 
                fontWeight: 900, 
                color: 'white', 
                lineHeight: 1,
                background: 'linear-gradient(135deg, #00d4ff 0%, #6dc662 50%, #667eea 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em'
              }}
            >
              MetroMedics
            </Typography>
            <Typography
              variant='h6'
              sx={{ 
                color: 'rgba(255,255,255,0.9)', 
                fontWeight: 600,
                fontSize: '1.1rem',
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}
            >
              Centro de Mantenimiento
            </Typography>
          </Box>
        </Box>

        {/* Status and Clock */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Connection Status */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            p: 1.5,
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: connectionStatus.isConnected ? '#51cf66' : '#ff6b6b',
                boxShadow: connectionStatus.isConnected 
                  ? '0 0 12px rgba(81, 207, 102, 0.6)' 
                  : '0 0 12px rgba(255, 107, 107, 0.6)'
              }}
            />
            <Box>
              <Typography
                variant='body2'
                sx={{ 
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  lineHeight: 1
                }}
              >
                {connectionStatus.isConnected ? 'En línea' : 'Desconectado'}
              </Typography>
              <Typography
                variant='caption'
                sx={{ 
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.7rem'
                }}
              >
                {format(connectionStatus.lastUpdate, 'HH:mm:ss')}
              </Typography>
            </Box>
          </Box>

          {/* Digital Clock */}
          <Box 
            sx={{ 
              textAlign: 'right',
              background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
              borderRadius: '16px',
              p: 2,
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              minWidth: '200px'
            }}
          >
            <Typography
              variant='h3'
              sx={{ 
                fontWeight: 800, 
                color: 'white', 
                lineHeight: 1, 
                mb: 0.5,
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                letterSpacing: '0.05em',
                textShadow: '0 0 20px rgba(0, 212, 255, 0.3)'
              }}
            >
              {format(currentTime, 'HH:mm:ss')}
            </Typography>
            <Typography
              variant='body1'
              sx={{ 
                color: 'rgba(255,255,255,0.9)', 
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                letterSpacing: '0.02em'
              }}
            >
              {format(currentTime, "EEEE, d MMM", { locale: es })}
            </Typography>
          </Box>
        </Box>
      </Box>      <
Container 
        maxWidth={false} 
        sx={{ 
          px: { xs: 2, sm: 3, md: 4, lg: 5 }, 
          py: { xs: 2, sm: 3, md: 4 },
          maxWidth: '1920px',
          margin: '0 auto'
        }}
      >
        {/* Enhanced Metrics Dashboard */}
        <Fade in={true} timeout={1000}>
          <Grid container spacing={4} sx={{ mb: 6 }}>
            {/* Total Open */}
            <Grid item xs={2.4}>
              <Grow in={true} timeout={800} style={{ transitionDelay: '100ms' }}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(40, 40, 40, 0.9) 100%)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '20px',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(47, 177, 88, 0.3)',
                    minHeight: '180px',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 20px 60px rgba(47, 177, 88, 0.2)'
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: 'linear-gradient(90deg, #2FB158 0%, #51cf66 100%)'
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 4, px: 3 }}>
                    <Box
                      sx={{
                        background: 'linear-gradient(135deg, rgba(47, 177, 88, 0.2) 0%, rgba(81, 207, 102, 0.1) 100%)',
                        borderRadius: '16px',
                        p: 2,
                        display: 'inline-flex',
                        mb: 3,
                        boxShadow: '0 8px 24px rgba(47, 177, 88, 0.2)'
                      }}
                    >
                      <Assignment
                        sx={{ 
                          fontSize: '3.5rem', 
                          color: '#2FB158',
                          filter: 'drop-shadow(0 0 8px rgba(47, 177, 88, 0.4))'
                        }}
                      />
                    </Box>
                    <Typography
                      variant='h2'
                      sx={{ 
                        fontWeight: 900, 
                        color: 'white', 
                        mb: 1,
                        textShadow: '0 0 20px rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      {metrics.totalOpen}
                    </Typography>
                    <Typography 
                      variant='h6' 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontWeight: 600,
                        letterSpacing: '0.05em'
                      }}
                    >
                      Total Abiertos
                    </Typography>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>

            {/* Similar cards for other metrics... */}
            {/* I'll add the remaining metric cards in a simplified way */}
          </Grid>
        </Fade> 
       {/* Fixed Urgent Tickets - Always Visible */}
        {fixedUrgentTickets.length > 0 && (
          <Box 
            sx={{ 
              position: 'sticky', 
              top: 0, 
              zIndex: 15,
              mb: 4,
              background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(26, 26, 26, 0.9) 100%)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: '1px solid rgba(244, 67, 54, 0.3)',
              p: 3
            }}
          >
            <Fade in={true} timeout={1200}>
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 3,
                    p: 2,
                    background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.15) 0%, rgba(255, 87, 34, 0.08) 100%)',
                    borderRadius: '12px',
                    border: '1px solid rgba(244, 67, 54, 0.3)'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Warning sx={{ 
                      fontSize: '2rem', 
                      color: '#f44336',
                      filter: 'drop-shadow(0 0 8px rgba(244, 67, 54, 0.6))'
                    }} />
                    <Typography
                      variant='h4'
                      sx={{
                        color: '#f44336',
                        fontWeight: 800,
                        letterSpacing: '0.02em'
                      }}
                    >
                      CRÍTICOS
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      label={organizedTickets.urgent.length}
                      sx={{
                        background: 'linear-gradient(135deg, #f44336 0%, #ff5722 100%)',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '1rem'
                      }}
                    />
                    {organizedTickets.urgent.length > 4 && (
                      <Typography
                        variant='body2'
                        sx={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontWeight: 500
                        }}
                      >
                        +{organizedTickets.urgent.length - 4} más
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  {fixedUrgentTickets.map((ticket, index) => (
                    <Grid item xs={6} key={ticket.id}>
                      <Grow
                        in={true}
                        timeout={1000}
                        style={{ transitionDelay: `${index * 150}ms` }}
                      >
                        <Card
                          sx={{
                            background: 'linear-gradient(135deg, rgba(42, 26, 26, 0.95) 0%, rgba(60, 30, 30, 0.9) 100%)',
                            backdropFilter: 'blur(20px)',
                            border: '2px solid #f44336',
                            borderRadius: '20px',
                            boxShadow: '0 0 40px rgba(244, 67, 54, 0.4)',
                            minHeight: '280px',
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'all 0.3s ease-in-out',
                            '&:hover': {
                              transform: 'translateY(-8px)',
                              boxShadow: '0 0 60px rgba(244, 67, 54, 0.6)'
                            }
                          }}
                        >
                          <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                mb: 3
                              }}
                            >
                              <Typography
                                variant='h4'
                                sx={{ 
                                  fontWeight: 900, 
                                  background: 'linear-gradient(135deg, #f44336 0%, #ff5722 100%)',
                                  backgroundClip: 'text',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  letterSpacing: '0.02em'
                                }}
                              >
                                {ticket.ticketCode}
                              </Typography>
                              <MaintenancePriorityBadge
                                priority={ticket.priority}
                                size='medium'
                              />
                            </Box>

                            <Typography
                              variant='h5'
                              sx={{ 
                                color: 'white', 
                                mb: 2, 
                                fontWeight: 700
                              }}
                            >
                              {ticket.equipmentType}
                            </Typography>

                            <Typography
                              variant='h6'
                              sx={{ 
                                color: 'rgba(255, 255, 255, 0.8)', 
                                mb: 1,
                                fontWeight: 600
                              }}
                            >
                              {ticket.equipmentBrand}
                            </Typography>

                            <Typography
                              variant='body1'
                              sx={{ 
                                color: 'rgba(255, 255, 255, 0.7)', 
                                mb: 3,
                                fontSize: '1.1rem'
                              }}
                            >
                              {ticket.equipmentModel} ({ticket.equipmentSerial})
                            </Typography>

                            <Box sx={{ mt: 'auto' }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  mb: 2,
                                  p: 2,
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  borderRadius: '12px'
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
                                    gap: 1.5
                                  }}
                                >
                                  <Person sx={{ 
                                    color: 'rgba(255, 255, 255, 0.7)', 
                                    fontSize: '1.3rem' 
                                  }} />
                                  <Typography 
                                    variant='body1' 
                                    sx={{ 
                                      color: 'rgba(255, 255, 255, 0.9)',
                                      fontWeight: 600
                                    }}
                                  >
                                    {ticket.assignedTechnician?.name || 'Sin asignar'}
                                  </Typography>
                                </Box>
                              </Box>

                              <Box
                                sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 1.5,
                                  p: 2,
                                  background: 'rgba(244, 67, 54, 0.1)',
                                  borderRadius: '12px',
                                  border: '1px solid rgba(244, 67, 54, 0.2)'
                                }}
                              >
                                <AccessTime
                                  sx={{ 
                                    color: '#f44336', 
                                    fontSize: '1.4rem'
                                  }}
                                />
                                <Typography 
                                  variant='body1' 
                                  sx={{ 
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '1.1rem'
                                  }}
                                >
                                  Hace {getElapsedTime(ticket.createdAt)}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grow>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Fade>
          </Box>
        )}    
    {/* Smart Scrolling Tickets Grid */}
        <Fade in={true} timeout={1400}>
          <Box>
            {/* Header with Controls */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 4,
                p: 3,
                background: 'linear-gradient(135deg, rgba(47, 177, 88, 0.1) 0%, rgba(0, 212, 255, 0.05) 100%)',
                borderRadius: '16px',
                border: '1px solid rgba(47, 177, 88, 0.2)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, rgba(47, 177, 88, 0.2) 0%, rgba(0, 212, 255, 0.1) 100%)',
                    borderRadius: '16px',
                    p: 2
                  }}
                >
                  <TrendingUp sx={{ 
                    fontSize: '3rem', 
                    color: '#2FB158',
                    filter: 'drop-shadow(0 0 8px rgba(47, 177, 88, 0.4))'
                  }} />
                </Box>
                <Typography
                  variant='h3'
                  sx={{
                    color: '#2FB158',
                    fontWeight: 900,
                    letterSpacing: '0.02em'
                  }}
                >
                  TICKETS ACTIVOS
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                {/* Status Indicator */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: scrollState.isScrolling ? '#51cf66' : '#ffc107',
                      boxShadow: scrollState.isScrolling 
                        ? '0 0 8px rgba(81, 207, 102, 0.6)' 
                        : '0 0 8px rgba(255, 193, 7, 0.6)'
                    }}
                  />
                  <Typography
                    variant='body2'
                    sx={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontWeight: 600
                    }}
                  >
                    {scrollState.isPaused ? 'Pausado' : scrollState.isScrolling ? 'Activo' : 'Detenido'}
                  </Typography>
                </Box>

                {/* Page Counter */}
                <Chip
                  label={`Página ${scrollState.currentPage + 1} de ${Math.ceil((organizedTickets.high.length + organizedTickets.normal.length) / scrollState.ticketsPerPage)}`}
                  sx={{ 
                    fontSize: '1rem',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #2FB158 0%, #00d4ff 100%)',
                    color: 'white'
                  }}
                />

                {/* Pause/Play Control */}
                <Box
                  onClick={() => setScrollState(prev => ({ ...prev, isScrolling: !prev.isScrolling }))}
                  sx={{
                    px: 3,
                    py: 1.5,
                    borderRadius: '12px',
                    background: scrollState.isScrolling 
                      ? 'linear-gradient(135deg, #ff9800 0%, #f44336 100%)'
                      : 'linear-gradient(135deg, #2FB158 0%, #00d4ff 100%)',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    '&:hover': {
                      transform: 'scale(1.05)'
                    }
                  }}
                >
                  {scrollState.isScrolling ? 'PAUSAR' : 'REANUDAR'}
                </Box>
              </Box>
            </Box>

            {/* Tickets Grid with Hover Pause */}
            <Box
              onMouseEnter={() => setScrollState(prev => ({ ...prev, isPaused: true }))}
              onMouseLeave={() => setScrollState(prev => ({ ...prev, isPaused: false }))}
            >
              <Fade in={true} timeout={800} key={`page-${scrollState.currentPage}-${animationKey}`}>
                <Grid container spacing={3}>
                  {visibleTickets.map((ticket, index) => (
                    <Grid item xs={3} key={ticket.id}>
                      <Fade
                        in={true}
                        timeout={1000}
                        style={{ transitionDelay: `${index * 100}ms` }}
                      >
                        <Card
                          sx={{
                            background: ticket.priority === MaintenancePriority.HIGH
                              ? 'linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(26, 26, 26, 0.95) 100%)'
                              : 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(40, 40, 40, 0.9) 100%)',
                            backdropFilter: 'blur(15px)',
                            borderRadius: '16px',
                            border: ticket.priority === MaintenancePriority.HIGH
                              ? '1px solid rgba(244, 67, 54, 0.4)'
                              : '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: ticket.priority === MaintenancePriority.HIGH
                              ? '0 8px 32px rgba(244, 67, 54, 0.2)'
                              : '0 8px 32px rgba(0, 0, 0, 0.3)',
                            minHeight: '320px',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'all 0.3s ease-in-out',
                            cursor: 'pointer',
                            '&:hover': {
                              transform: 'translateY(-6px) scale(1.02)',
                              boxShadow: ticket.priority === MaintenancePriority.HIGH
                                ? '0 12px 40px rgba(244, 67, 54, 0.4)'
                                : '0 12px 40px rgba(0, 212, 255, 0.25)',
                              zIndex: 10
                            },
                            '&::before': ticket.priority === MaintenancePriority.HIGH ? {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              height: '3px',
                              background: 'linear-gradient(90deg, #f44336 0%, #ff5722 100%)'
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
                              p: 3,
                              flexGrow: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              height: '100%'
                            }}
                          >
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
                                sx={{
                                  fontWeight: 800,
                                  background: ticket.priority === MaintenancePriority.HIGH
                                    ? 'linear-gradient(135deg, #f44336 0%, #ff5722 100%)'
                                    : 'linear-gradient(135deg, #00d4ff 0%, #2FB158 100%)',
                                  backgroundClip: 'text',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  fontSize: '1.3rem',
                                  letterSpacing: '0.02em'
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
                              variant='h6'
                              sx={{
                                color: 'white',
                                mb: 1.5,
                                fontWeight: 700,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {ticket.equipmentType}
                            </Typography>

                            <Typography
                              variant='body1'
                              sx={{
                                color: 'rgba(255, 255, 255, 0.8)',
                                mb: 2,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontWeight: 500
                              }}
                            >
                              {ticket.equipmentBrand} {ticket.equipmentModel}
                            </Typography>

                            <Box sx={{ mt: 'auto' }}>
                              <Box 
                                sx={{ 
                                  mb: 2,
                                  p: 1.5,
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  borderRadius: '8px'
                                }}
                              >
                                <MaintenanceStatusBadge
                                  status={ticket.status}
                                  size='small'
                                />
                              </Box>

                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1.5,
                                  mb: 1.5,
                                  p: 1.5,
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  borderRadius: '8px'
                                }}
                              >
                                <Person sx={{ 
                                  color: 'rgba(255, 255, 255, 0.7)', 
                                  fontSize: '1.2rem' 
                                }} />
                                <Typography
                                  variant='body2'
                                  sx={{
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    flex: 1,
                                    fontWeight: 600
                                  }}
                                >
                                  {ticket.assignedTechnician?.name || 'Sin asignar'}
                                </Typography>
                              </Box>

                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1.5,
                                  p: 1.5,
                                  background: 'rgba(0, 212, 255, 0.08)',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(0, 212, 255, 0.2)'
                                }}
                              >
                                <AccessTime
                                  sx={{ 
                                    color: '#00d4ff', 
                                    fontSize: '1.2rem'
                                  }}
                                />
                                <Typography
                                  variant='body2'
                                  sx={{ 
                                    color: 'white',
                                    fontWeight: 600
                                  }}
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
              </Fade>
            </Box>

            {/* Progress Indicator */}
            {(organizedTickets.high.length + organizedTickets.normal.length) > scrollState.ticketsPerPage && (
              <Fade in={true} timeout={1000}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  mt: 4,
                  gap: 4,
                  p: 3,
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  {/* Speed Control */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography
                      variant='body2'
                      sx={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontWeight: 600,
                        minWidth: '80px'
                      }}
                    >
                      Velocidad
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {[5, 8, 12].map((speed) => (
                        <Box
                          key={speed}
                          onClick={() => setScrollState(prev => ({ ...prev, speed }))}
                          sx={{
                            px: 2,
                            py: 1,
                            borderRadius: '8px',
                            background: scrollState.speed === speed 
                              ? 'linear-gradient(135deg, #2FB158 0%, #00d4ff 100%)'
                              : 'rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            '&:hover': {
                              background: scrollState.speed === speed 
                                ? 'linear-gradient(135deg, #2FB158 0%, #00d4ff 100%)'
                                : 'rgba(255, 255, 255, 0.2)'
                            }
                          }}
                        >
                          {speed === 5 ? 'Rápido' : speed === 8 ? 'Normal' : 'Lento'}
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  {/* Progress Bar */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    <Typography
                      variant='body2'
                      sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontWeight: 600
                      }}
                    >
                      Progreso
                    </Typography>
                    <Box
                      sx={{
                        flex: 1,
                        maxWidth: '400px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        p: 1
                      }}
                    >
                      <LinearProgress
                        variant='determinate'
                        value={((scrollState.currentPage + 1) / Math.ceil((organizedTickets.high.length + organizedTickets.normal.length) / scrollState.ticketsPerPage)) * 100}
                        sx={{
                          height: '8px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            background: 'linear-gradient(90deg, #2FB158 0%, #00d4ff 100%)',
                            borderRadius: '6px',
                            boxShadow: '0 0 12px rgba(47, 177, 88, 0.4)'
                          }
                        }}
                      />
                    </Box>
                    <Typography
                      variant='body2'
                      sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontWeight: 600,
                        minWidth: '60px'
                      }}
                    >
                      {Math.round(((scrollState.currentPage + 1) / Math.ceil((organizedTickets.high.length + organizedTickets.normal.length) / scrollState.ticketsPerPage)) * 100)}%
                    </Typography>
                  </Box>
                </Box>
              </Fade>
            )}
          </Box>
        </Fade>
      </Container>
    </Box>
  )
}

export default MaintenanceTVDisplay