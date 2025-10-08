import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Alert,
  Pagination,
  Snackbar,
  AlertTitle,
  LinearProgress,
  useMediaQuery,
  useTheme
} from '@mui/material'
import {
  Dashboard,
  Assignment,
  Build,
  CheckCircle,
  TrendingUp,
  Refresh,
  Add,
  FilterList,
  Cancel
} from '@mui/icons-material'
import {
  useMaintenanceStats,
  useMaintenanceTickets,
  useMaintenanceTechnicians,
  useUpdateMaintenanceTicket
} from '../../hooks/useMaintenance'
import {
  MaintenanceFilters,
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceTicket,
  MaintenanceUpdateRequest
} from '../../types/maintenance'
import MaintenanceTicketCard from '../../Components/Maintenance/MaintenanceTicketCard'
import MaintenanceFiltersComponent from '../../Components/Maintenance/MaintenanceFilters'
import MaintenanceStatusBadge from '../../Components/Maintenance/MaintenanceStatusBadge'
import MaintenancePriorityBadge from '../../Components/Maintenance/MaintenancePriorityBadge'
import StatCardSkeleton from '../../Components/Maintenance/StatCardSkeleton'
import TicketCardSkeleton from '../../Components/Maintenance/TicketCardSkeleton'
import useMaintenanceWebSocket from '../../hooks/useMaintenanceWebSocket'
import useAxiosPrivate from '../../utils/use-axios-private'
import { useStore } from '@nanostores/react'
import { userStore } from '../../store/userStore'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import KeyboardShortcutsHelp from '../../Components/Maintenance/KeyboardShortcutsHelp'

/**
 * MaintenanceDashboard component provides an admin interface for managing maintenance tickets
 * Includes statistics, ticket management, and real-time updates
 */
const MaintenanceDashboard: React.FC = () => {
  useAxiosPrivate() // Initialize axios interceptors for automatic token refresh
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const $userStore = useStore(userStore)
  const [filters, setFilters] = useState<MaintenanceFilters>({})
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] =
    useState<MaintenanceTicket | null>(null)
  const [editData, setEditData] = useState<MaintenanceUpdateRequest>({})
  const [toast, setToast] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'warning' | 'info'
  }>({
    open: false,
    message: '',
    severity: 'info'
  })
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false)

  const limit = 12

  const showToast = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setToast({ open: true, message, severity })
  }

  const handleCloseToast = () => {
    setToast(prev => ({ ...prev, open: false }))
  }

  // Check user permissions
  const isTechnician = $userStore.rol.includes('technician')
  const isAdmin =
    $userStore.rol.includes('admin') ||
    $userStore.rol.includes('maintenance_coordinator')

  // Get technician ID if user is a technician
  const currentTechnicianEmail = useMemo(() => {
    if (!isTechnician) return null
    console.log('User email:', $userStore)
    // Hardcode technician ID 4 for kat34433@laoia.com for testing
    return $userStore.email
  }, [isTechnician, $userStore.email])

  // For technicians, filter to only show their assigned tickets
  const technicianFilters = useMemo(() => {
    if (!isTechnician || !currentTechnicianEmail) return filters

    return {
      ...filters,
      assignedTechnicianEmail: currentTechnicianEmail // Using numeric technician ID
    }
  }, [filters, isTechnician, currentTechnicianEmail])

  // Filter allowed statuses for technicians (they can't change to 'new' or 'assigned')
  const allowedStatuses = useMemo(() => {
    if (!isTechnician) return Object.values(MaintenanceStatus)

    return [
      MaintenanceStatus.IN_PROGRESS,
      MaintenanceStatus.ON_HOLD,
      MaintenanceStatus.WAITING_PARTS,
      MaintenanceStatus.WAITING_CUSTOMER,
      MaintenanceStatus.COMPLETED
    ]
  }, [isTechnician])

  // API hooks
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useMaintenanceStats(
    currentTechnicianEmail
  )
  const {
    data: ticketsData,
    isLoading: ticketsLoading,
    refetch: refetchTickets
  } = useMaintenanceTickets(technicianFilters, page, limit)
  // Only admins can access technicians list
  const { data: technicians } = useMaintenanceTechnicians(isAdmin)
  const updateTicketMutation = useUpdateMaintenanceTicket()

  // WebSocket for real-time updates
  useMaintenanceWebSocket({
    onTicketUpdate: (ticket) => {
      console.log('Ticket updated via WebSocket:', ticket)
      refetchTickets()
      refetchStats()
    },
    onNotification: (notification) => {
      console.log('New notification:', notification)
      // You could integrate with a notification system here
    }
  })

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewTicket: () => {
      if (isAdmin) {
        navigate('/maintenance/new')
      }
    },
    onToggleFilters: () => {
      setShowFilters(prev => !prev)
    },
    onRefreshData: () => {
      refetchTickets()
      refetchStats()
      showToast('Datos actualizados', 'success')
    },
    onFocusSearch: () => {
      // Focus search field in filters
      const searchField = document.getElementById('quick-search-field')
      if (searchField) {
        searchField.focus()
      } else {
        // If filters are collapsed, expand them first
        if (!showFilters) {
          setShowFilters(true)
          // Focus after a brief delay to allow expansion
          setTimeout(() => {
            const searchFieldDelayed = document.getElementById('quick-search-field')
            searchFieldDelayed?.focus()
          }, 100)
        }
      }
    },
    onShowHelp: () => {
      setShortcutsHelpOpen(true)
    },
    onCloseModal: () => {
      if (editDialogOpen) {
        setEditDialogOpen(false)
      } else if (shortcutsHelpOpen) {
        setShortcutsHelpOpen(false)
      }
    },
    enabled: true
  })

  // Equipment types for filters (this could come from an API)
  const equipmentTypes = useMemo(() => {
    if (!ticketsData?.tickets) return []
    const types = new Set(ticketsData.tickets.map((t) => t.equipmentType))
    return Array.from(types)
  }, [ticketsData?.tickets])

  // Sort tickets by priority (urgent -> high -> medium -> low) then by creation date (oldest first)
  const sortedTickets = useMemo(() => {
    if (!ticketsData?.tickets) return []

    const priorityOrder = {
      [MaintenancePriority.URGENT]: 1,
      [MaintenancePriority.HIGH]: 2,
      [MaintenancePriority.MEDIUM]: 3,
      [MaintenancePriority.LOW]: 4
    }

    return [...ticketsData.tickets].sort((a, b) => {
      // First sort by priority (urgent first)
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) {
        return priorityDiff
      }

      // If priorities are the same, sort by creation date (oldest first)
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateA - dateB
    })
  }, [ticketsData?.tickets])

  const handleEditTicket = (ticket: MaintenanceTicket) => {
    // For technicians, only allow editing tickets assigned to them
    const technicianId = $userStore.email === 'kat34433@laoia.com' ? 4 : null
    if (
      isTechnician &&
      technicianId &&
      Number(ticket.assignedTechnician?.id) !== technicianId
    ) {
      console.warn('Technician can only edit their assigned tickets')
      return
    }

    setSelectedTicket(ticket)
    setEditData({
      status: ticket.status,
      assignedTechnician: ticket.technicianId || '',
      scheduledDate: ticket.scheduledDate || '',
      priority: ticket.priority
    })
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedTicket) return

    try {
      await updateTicketMutation.mutateAsync({
        id: selectedTicket.id,
        data: editData
      })
      // Refresh tickets to ensure proper re-ordering after priority/status changes
      refetchTickets()
      refetchStats()
      setEditDialogOpen(false)
      setSelectedTicket(null)
      setEditData({})
      showToast('Ticket actualizado exitosamente', 'success')
    } catch (error: any) {
      console.error('Error updating ticket:', error)
      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.message ||
                          'Error al actualizar el ticket'
      showToast(errorMessage, 'error')
    }
  }

  const handleViewTicket = (ticket: MaintenanceTicket) => {
    // Navigate to ticket details page using React Router
    navigate(`/maintenance/tickets/${ticket.id}`)
  }

  const handleRefresh = () => {
    refetchStats()
    refetchTickets()
  }

  return (
    <Container 
      maxWidth={false} 
      sx={{ 
        py: { xs: 2, sm: 3, md: 3 }, 
        px: { xs: 1, sm: 2, md: 3 },
        background: 'linear-gradient(135deg, rgba(109, 198, 98, 0.02) 0%, rgba(255, 255, 255, 0.8) 100%)',
        minHeight: '100vh'
      }}
    >
      {/* Header */}
      <Box
        display='flex'
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={{ xs: 2, sm: 3, md: 3 }}
        gap={{ xs: 2, sm: 0 }}
        sx={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          p: { xs: 2, sm: 3 },
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(109, 198, 98, 0.1)'
        }}
      >
        <Box display='flex' alignItems='center' gap={{ xs: 1, sm: 2 }}>
          <Box
            sx={{
              background: 'linear-gradient(135deg, #6dc662 0%, #5ab052 100%)',
              borderRadius: '12px',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(109, 198, 98, 0.3)'
            }}
          >
            <Dashboard sx={{ fontSize: { xs: 28, sm: 32 }, color: 'white' }} />
          </Box>
          <Box>
            <Typography
              variant='h4'
              component='h1'
              sx={{
                fontSize: { xs: '1.5rem', sm: '1.875rem', md: '2.125rem' },
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6dc662 0%, #5ab052 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em'
              }}
            >
              Dashboard de Mantenimiento
            </Typography>
            <Typography
              variant='subtitle1'
              color='text.secondary'
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Gestión integral de tickets y técnicos
            </Typography>
          </Box>
        </Box>

        <Box display='flex' gap={{ xs: 0.5, sm: 1 }} flexWrap='wrap'>
          <Tooltip title='Actualizar datos'>
            <IconButton
              onClick={handleRefresh}
              aria-label='Actualizar datos del dashboard'
              sx={{
                minWidth: 48,
                minHeight: 48,
                background: 'rgba(109, 198, 98, 0.1)',
                color: '#6dc662',
                borderRadius: '12px',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  background: 'linear-gradient(135deg, #6dc662 0%, #5ab052 100%)',
                  color: 'white',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(109, 198, 98, 0.3)'
                }
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant='outlined'
            startIcon={!isMobile && <FilterList />}
            onClick={() => setShowFilters(!showFilters)}
            aria-label={showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            aria-expanded={showFilters}
            aria-controls='maintenance-filters-section'
            size={isMobile ? 'small' : 'medium'}
            sx={{
              minHeight: 48,
              fontSize: { xs: '0.813rem', sm: '0.875rem' },
              borderColor: '#6dc662',
              color: '#6dc662',
              borderRadius: '12px',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                borderColor: '#5ab052',
                background: 'rgba(109, 198, 98, 0.1)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            {isMobile ? <FilterList /> : 'Filtros'}
          </Button>
          {!isTechnician && (
            <Button
              variant='contained'
              startIcon={!isMobile && <Add />}
              href='/maintenance/report'
              size={isMobile ? 'small' : 'medium'}
              sx={{
                minHeight: 48,
                fontSize: { xs: '0.813rem', sm: '0.875rem' },
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
              {isMobile ? <Add /> : 'Nueva Solicitud'}
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} mb={{ xs: 2, sm: 3, md: 3 }} role='region' aria-label='Estadísticas del dashboard'>
        {statsLoading ? (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <StatCardSkeleton />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCardSkeleton />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCardSkeleton />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCardSkeleton />
            </Grid>
          </>
        ) : (
          <>
            <Grid item xs={12} sm={6} md={3}>
          <Card 
            role='article' 
            aria-label='Total de tickets'
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(109, 198, 98, 0.1)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 30px rgba(109, 198, 98, 0.15)',
                border: '1px solid rgba(109, 198, 98, 0.2)'
              }
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Box>
                  <Typography
                    variant='h4'
                    aria-label={`Total de tickets: ${stats?.metrics?.totalTickets || 0}`}
                    sx={{ 
                      fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' },
                      fontWeight: 700,
                      color: '#6dc662'
                    }}
                  >
                    {stats?.metrics?.totalTickets || 0}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      fontWeight: 500
                    }}
                  >
                    Total Tickets
                  </Typography>
                </Box>
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, #6dc662 0%, #5ab052 100%)',
                    borderRadius: '12px',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Assignment sx={{ fontSize: { xs: 32, sm: 40 }, color: 'white' }} aria-hidden='true' />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            role='article' 
            aria-label='Tickets pendientes'
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(255, 152, 0, 0.1)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 30px rgba(255, 152, 0, 0.15)',
                border: '1px solid rgba(255, 152, 0, 0.2)'
              }
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Box>
                  <Typography
                    variant='h4'
                    aria-label={`Tickets pendientes: ${stats?.metrics?.pendingTickets || 0}`}
                    sx={{ 
                      fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' },
                      fontWeight: 700,
                      color: '#ff9800'
                    }}
                  >
                    {stats?.metrics?.pendingTickets || 0}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      fontWeight: 500
                    }}
                  >
                    Pendientes
                  </Typography>
                </Box>
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                    borderRadius: '12px',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Build sx={{ fontSize: { xs: 32, sm: 40 }, color: 'white' }} aria-hidden='true' />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            role='article' 
            aria-label='Tickets completados'
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(76, 175, 80, 0.1)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 30px rgba(76, 175, 80, 0.15)',
                border: '1px solid rgba(76, 175, 80, 0.2)'
              }
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Box>
                  <Typography
                    variant='h4'
                    aria-label={`Tickets completados: ${stats?.metrics?.completedTickets || 0}`}
                    sx={{ 
                      fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' },
                      fontWeight: 700,
                      color: '#4caf50'
                    }}
                  >
                    {stats?.metrics?.completedTickets || 0}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      fontWeight: 500
                    }}
                  >
                    Completados
                  </Typography>
                </Box>
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                    borderRadius: '12px',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CheckCircle sx={{ fontSize: { xs: 32, sm: 40 }, color: 'white' }} aria-hidden='true' />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            role='article' 
            aria-label='Tiempo promedio de resolución'
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(33, 150, 243, 0.1)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 30px rgba(33, 150, 243, 0.15)',
                border: '1px solid rgba(33, 150, 243, 0.2)'
              }
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Box>
                  <Typography
                    variant='h4'
                    aria-label={`Tiempo promedio de resolución: ${stats?.metrics?.avgResolutionTimeHours || 0} horas`}
                    sx={{ 
                      fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' },
                      fontWeight: 700,
                      color: '#2196f3'
                    }}
                  >
                    {stats?.metrics?.avgResolutionTimeHours || 0}h
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      fontWeight: 500
                    }}
                  >
                    Tiempo Promedio
                  </Typography>
                </Box>
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                    borderRadius: '12px',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <TrendingUp sx={{ fontSize: { xs: 32, sm: 40 }, color: 'white' }} aria-hidden='true' />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
          </>
        )}
      </Grid>

      {/* Additional Stats */}
      <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} mb={{ xs: 2, sm: 3, md: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: { xs: 2, sm: 3 },
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(109, 198, 98, 0.1)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 30px rgba(109, 198, 98, 0.12)'
              }
            }}
          >
            <Typography
              variant='h6'
              gutterBottom
              sx={{ 
                fontSize: { xs: '1.125rem', sm: '1.25rem' },
                fontWeight: 600,
                color: '#6dc662',
                mb: 3
              }}
            >
              Tickets por Prioridad
            </Typography>
            <Grid container spacing={{ xs: 1, sm: 2 }}>
              {stats?.priorityStats &&
                stats.priorityStats.map(({ priority, count }) => (
                  <Grid item xs={6} sm={3} key={priority}>
                    <Box 
                      textAlign='center'
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        background: 'rgba(109, 198, 98, 0.05)',
                        border: '1px solid rgba(109, 198, 98, 0.1)',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          background: 'rgba(109, 198, 98, 0.1)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Typography
                        variant='h5'
                        sx={{ 
                          fontSize: { xs: '1.25rem', sm: '1.5rem' },
                          fontWeight: 700,
                          color: '#6dc662',
                          mb: 1
                        }}
                      >
                        {count}
                      </Typography>
                      <MaintenancePriorityBadge
                        priority={priority as MaintenancePriority}
                        size='small'
                      />
                    </Box>
                  </Grid>
                ))}
            </Grid>
          </Paper>
        </Grid>

        {/* <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Información Financiera
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Ingresos Totales
                </Typography>
                <Typography variant="h5" color="success.main">
                  ${stats?.totalRevenue?.toLocaleString() || 0}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Costo Promedio
                </Typography>
                <Typography variant="h5" color="primary">
                  ${stats?.averageCost?.toLocaleString() || 0}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid> */}
      </Grid>

      {/* Filters */}
      {showFilters && (
        <Box mb={3} id='maintenance-filters-section' role='region' aria-label='Sección de filtros'>
          <MaintenanceFiltersComponent
            filters={filters}
            onFiltersChange={setFilters}
            technicians={technicians || []}
            equipmentTypes={equipmentTypes}
            loading={ticketsLoading}
            resultsCount={ticketsData?.pagination.totalItems}
          />
        </Box>
      )}

      {/* Tickets Grid */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: { xs: 2, sm: 3 },
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(109, 198, 98, 0.1)'
        }}
      >
        <Box
          display='flex'
          flexDirection={{ xs: 'column', sm: 'row' }}
          justifyContent='space-between'
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          mb={{ xs: 2, sm: 3 }}
          gap={{ xs: 1, sm: 0 }}
        >
          <Typography
            variant='h6'
            sx={{ 
              fontSize: { xs: '1.125rem', sm: '1.25rem' },
              fontWeight: 600,
              color: '#6dc662'
            }}
          >
            Tickets de Mantenimiento
            {ticketsData?.pagination.totalItems && (
              <Chip
                label={`${ticketsData.pagination.totalItems} total`}
                size='small'
                sx={{ 
                  ml: 1,
                  background: 'linear-gradient(135deg, #6dc662 0%, #5ab052 100%)',
                  color: 'white',
                  fontWeight: 500
                }}
              />
            )}
          </Typography>
        </Box>

        {ticketsLoading ? (
          <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} role='status' aria-live='polite'>
            {[...Array(6)].map((_, index) => (
              <Grid item xs={12} sm={6} lg={4} key={index}>
                <TicketCardSkeleton />
              </Grid>
            ))}
          </Grid>
        ) : !sortedTickets.length ? (
          <Alert severity='info' role='status'>
            No se encontraron tickets con los filtros aplicados.
          </Alert>
        ) : (
          <>
            <Grid container spacing={{ xs: 2, sm: 2, md: 3 }}>
              {sortedTickets.map((ticket) => (
                <Grid item xs={12} sm={6} lg={4} key={ticket.id}>
                  <MaintenanceTicketCard
                    ticket={ticket}
                    onView={handleViewTicket}
                    onEdit={handleEditTicket}
                    showActions={true}
                  />
                </Grid>
              ))}
            </Grid>

            {/* Pagination */}
            {ticketsData && ticketsData.pagination.totalPages > 1 && (
              <Box display='flex' justifyContent='center' mt={{ xs: 2, sm: 3 }}>
                <Pagination
                  count={ticketsData.pagination.totalPages}
                  page={page}
                  onChange={(_, newPage) => setPage(newPage)}
                  color='primary'
                  aria-label='Paginación de tickets'
                  size={isMobile ? 'small' : 'medium'}
                  siblingCount={isMobile ? 0 : 1}
                  boundaryCount={1}
                  sx={{
                    '& .MuiPaginationItem-root': {
                      minWidth: { xs: 32, sm: 36 },
                      height: { xs: 32, sm: 36 },
                      fontSize: { xs: '0.813rem', sm: '0.875rem' }
                    }
                  }}
                />
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Edit Ticket Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth='sm'
        fullWidth
        fullScreen={isMobile}
        aria-labelledby='edit-ticket-dialog-title'
        aria-describedby='edit-ticket-dialog-description'
      >
        <DialogTitle id='edit-ticket-dialog-title'>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Typography variant='h6' sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
              Editar Ticket #{selectedTicket?.ticketCode}
            </Typography>
            {isMobile && (
              <IconButton
                onClick={() => setEditDialogOpen(false)}
                aria-label='Cerrar'
                sx={{ minWidth: 44, minHeight: 44 }}
              >
                <Cancel />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
        <DialogContent id='edit-ticket-dialog-description'>
          <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                <InputLabel id='edit-status-label'>Estado</InputLabel>
                <Select
                  labelId='edit-status-label'
                  id='edit-status-select'
                  value={editData.status || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      status: e.target.value as MaintenanceStatus
                    }))
                  }
                  label='Estado'
                  aria-label='Seleccionar estado del ticket'
                >
                  {allowedStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      <MaintenanceStatusBadge status={status} size='small' />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {!isTechnician && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                  <InputLabel id='edit-priority-label'>Prioridad</InputLabel>
                  <Select
                    labelId='edit-priority-label'
                    id='edit-priority-select'
                    value={editData.priority || ''}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        priority: e.target.value as MaintenancePriority
                      }))
                    }
                    label='Prioridad'
                    aria-label='Seleccionar prioridad del ticket'
                  >
                    {Object.values(MaintenancePriority).map((priority) => (
                      <MenuItem key={priority} value={priority}>
                        <MaintenancePriorityBadge
                          priority={priority}
                          size='small'
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {!isTechnician && (
              <Grid item xs={12}>
                <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                  <InputLabel id='edit-technician-label'>Técnico Asignado</InputLabel>
                  <Select
                    labelId='edit-technician-label'
                    id='edit-technician-select'
                    value={editData.assignedTechnician || ''}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        assignedTechnician: e.target.value
                      }))
                    }
                    label='Técnico Asignado'
                    aria-label='Seleccionar técnico asignado'
                  >
                    <MenuItem value=''>Sin asignar</MenuItem>
                    {technicians
                      ?.filter(t => t.status === 'active')
                      .sort((a, b) => {
                        const aCapacity = a.maxWorkload - a.workload
                        const bCapacity = b.maxWorkload - b.workload
                        return bCapacity - aCapacity
                      })
                      .map((technician) => {
                        const utilizationPct = (technician.workload / technician.maxWorkload) * 100
                        const isFull = technician.workload >= technician.maxWorkload
                        const isNearFull = utilizationPct >= 80

                        return (
                          <MenuItem
                            key={technician.id}
                            value={technician.id}
                            disabled={isFull}
                          >
                            <Box display='flex' flexDirection='column' width='100%'>
                              <Box display='flex' alignItems='center' gap={1} width='100%'>
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    fontSize: '0.875rem',
                                    bgcolor: isFull ? 'error.main' : isNearFull ? 'warning.main' : 'success.main'
                                  }}
                                >
                                  {technician.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                                </Avatar>

                                <Box flex={1}>
                                  <Typography variant='body2' fontWeight='medium'>
                                    {technician.name}
                                  </Typography>
                                  <Typography variant='caption' color='text.secondary'>
                                    {technician.specialization || 'General'}
                                  </Typography>
                                </Box>

                                <Box display='flex' gap={0.5} alignItems='center'>
                                  <Chip
                                    size='small'
                                    label={`${technician.workload}/${technician.maxWorkload}`}
                                    color={
                                      isFull ? 'error' :
                                      isNearFull ? 'warning' :
                                      'success'
                                    }
                                    variant='outlined'
                                  />
                                  {isFull && (
                                    <Chip
                                      size='small'
                                      label='Completo'
                                      color='error'
                                    />
                                  )}
                                </Box>
                              </Box>

                              <Box width='100%' mt={1}>
                                <LinearProgress
                                  variant='determinate'
                                  value={utilizationPct}
                                  color={
                                    isFull ? 'error' :
                                    isNearFull ? 'warning' :
                                    'success'
                                  }
                                  sx={{ height: 4, borderRadius: 2 }}
                                />
                              </Box>
                            </Box>
                          </MenuItem>
                        )
                      })}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {!isTechnician && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size={isMobile ? 'small' : 'medium'}
                  id='edit-scheduled-date'
                  label='Fecha Programada'
                  type='datetime-local'
                  value={
                    editData.scheduledDate
                      ? new Date(editData.scheduledDate)
                          .toISOString()
                          .slice(0, 16)
                      : ''
                  }
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      scheduledDate: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : undefined
                    }))
                  }
                  InputLabelProps={{ shrink: true }}
                  aria-label='Seleccionar fecha y hora programada'
                  inputProps={{
                    'aria-describedby': 'scheduled-date-helper'
                  }}
                />
              </Grid>
            )}

            {/* Capacity Warning Alert */}
            {editData.assignedTechnician && (() => {
              const selectedTech = technicians?.find(t => t.id === editData.assignedTechnician)
              if (!selectedTech) return null

              const utilizationPct = (selectedTech.workload / selectedTech.maxWorkload) * 100

              if (utilizationPct >= 80 && utilizationPct < 100) {
                return (
                  <Grid item xs={12}>
                    <Alert severity='warning' sx={{ mt: 2 }}>
                      <AlertTitle>Técnico casi en capacidad máxima</AlertTitle>
                      <Typography variant='body2'>
                        <strong>{selectedTech.name}</strong> tiene{' '}
                        <strong>{selectedTech.workload}</strong> de{' '}
                        <strong>{selectedTech.maxWorkload}</strong> tickets asignados{' '}
                        ({utilizationPct.toFixed(0)}% utilización).
                        {' '}Considere asignar a un técnico con menos carga de trabajo.
                      </Typography>
                    </Alert>
                  </Grid>
                )
              }

              if (utilizationPct >= 100) {
                return (
                  <Grid item xs={12}>
                    <Alert severity='error' sx={{ mt: 2 }}>
                      <AlertTitle>Técnico en capacidad máxima</AlertTitle>
                      <Typography variant='body2'>
                        <strong>{selectedTech.name}</strong> ha alcanzado su capacidad máxima{' '}
                        ({selectedTech.workload}/{selectedTech.maxWorkload} tickets).
                        {' '}Por favor seleccione otro técnico disponible.
                      </Typography>
                    </Alert>
                  </Grid>
                )
              }

              return null
            })()}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleSaveEdit}
            variant='contained'
            disabled={updateTicketMutation.isLoading}
          >
            {updateTicketMutation.isLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notifications */}
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseToast}
          severity={toast.severity}
          variant='filled'
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        open={shortcutsHelpOpen}
        onClose={() => setShortcutsHelpOpen(false)}
      />
    </Container>
  )
}

export default MaintenanceDashboard
