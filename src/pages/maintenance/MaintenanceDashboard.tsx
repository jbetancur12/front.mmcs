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
import useMaintenanceWebSocket from '../../hooks/useMaintenanceWebSocket'
import useAxiosPrivate from '../../utils/use-axios-private'
import { useStore } from '@nanostores/react'
import { userStore } from '../../store/userStore'

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
  const { data: stats, refetch: refetchStats } = useMaintenanceStats(
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

  // Equipment types for filters (this could come from an API)
  const equipmentTypes = useMemo(() => {
    if (!ticketsData?.tickets) return []
    const types = new Set(ticketsData.tickets.map((t) => t.equipmentType))
    return Array.from(types)
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
    <Container maxWidth={false} sx={{ py: { xs: 2, sm: 3, md: 3 }, px: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box
        display='flex'
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={{ xs: 2, sm: 3, md: 3 }}
        gap={{ xs: 2, sm: 0 }}
      >
        <Box display='flex' alignItems='center' gap={{ xs: 1, sm: 2 }}>
          <Dashboard color='primary' sx={{ fontSize: { xs: 28, sm: 32 } }} />
          <Typography
            variant='h4'
            component='h1'
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.875rem', md: '2.125rem' }
            }}
          >
            Dashboard de Mantenimiento
          </Typography>
        </Box>

        <Box display='flex' gap={{ xs: 0.5, sm: 1 }} flexWrap='wrap'>
          <Tooltip title='Actualizar datos'>
            <IconButton
              onClick={handleRefresh}
              color='primary'
              aria-label='Actualizar datos del dashboard'
              sx={{
                minWidth: 48,
                minHeight: 48
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
              fontSize: { xs: '0.813rem', sm: '0.875rem' }
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
                fontSize: { xs: '0.813rem', sm: '0.875rem' }
              }}
            >
              {isMobile ? <Add /> : 'Nueva Solicitud'}
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} mb={{ xs: 2, sm: 3, md: 3 }} role='region' aria-label='Estadísticas del dashboard'>
        <Grid item xs={12} sm={6} md={3}>
          <Card role='article' aria-label='Total de tickets'>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Box>
                  <Typography
                    variant='h4'
                    color='primary'
                    aria-label={`Total de tickets: ${stats?.metrics?.totalTickets || 0}`}
                    sx={{ fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' } }}
                  >
                    {stats?.metrics?.totalTickets || 0}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    Total Tickets
                  </Typography>
                </Box>
                <Assignment color='primary' sx={{ fontSize: { xs: 32, sm: 40 } }} aria-hidden='true' />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card role='article' aria-label='Tickets pendientes'>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Box>
                  <Typography
                    variant='h4'
                    color='warning.main'
                    aria-label={`Tickets pendientes: ${stats?.metrics?.pendingTickets || 0}`}
                    sx={{ fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' } }}
                  >
                    {stats?.metrics?.pendingTickets || 0}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    Pendientes
                  </Typography>
                </Box>
                <Build color='warning' sx={{ fontSize: { xs: 32, sm: 40 } }} aria-hidden='true' />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card role='article' aria-label='Tickets completados'>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Box>
                  <Typography
                    variant='h4'
                    color='success.main'
                    aria-label={`Tickets completados: ${stats?.metrics?.completedTickets || 0}`}
                    sx={{ fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' } }}
                  >
                    {stats?.metrics?.completedTickets || 0}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    Completados
                  </Typography>
                </Box>
                <CheckCircle color='success' sx={{ fontSize: { xs: 32, sm: 40 } }} aria-hidden='true' />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card role='article' aria-label='Tiempo promedio de resolución'>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Box>
                  <Typography
                    variant='h4'
                    color='info.main'
                    aria-label={`Tiempo promedio de resolución: ${stats?.metrics?.avgResolutionTimeHours || 0} horas`}
                    sx={{ fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' } }}
                  >
                    {stats?.metrics?.avgResolutionTimeHours || 0}h
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    Tiempo Promedio
                  </Typography>
                </Box>
                <TrendingUp color='info' sx={{ fontSize: { xs: 32, sm: 40 } }} aria-hidden='true' />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Stats */}
      <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} mb={{ xs: 2, sm: 3, md: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography
              variant='h6'
              gutterBottom
              sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}
            >
              Tickets por Prioridad
            </Typography>
            <Grid container spacing={{ xs: 1, sm: 2 }}>
              {stats?.priorityStats &&
                stats.priorityStats.map(({ priority, count }) => (
                  <Grid item xs={6} sm={3} key={priority}>
                    <Box textAlign='center'>
                      <Typography
                        variant='h5'
                        color='primary'
                        sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
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
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
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
            sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}
          >
            Tickets de Mantenimiento
            {ticketsData?.pagination.totalItems && (
              <Chip
                label={`${ticketsData.pagination.totalItems} total`}
                size='small'
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </Box>

        {ticketsLoading ? (
          <Box display='flex' justifyContent='center' py={4} role='status' aria-live='polite'>
            <Typography>Cargando tickets...</Typography>
          </Box>
        ) : !ticketsData?.tickets.length ? (
          <Alert severity='info' role='status'>
            No se encontraron tickets con los filtros aplicados.
          </Alert>
        ) : (
          <>
            <Grid container spacing={{ xs: 2, sm: 2, md: 3 }}>
              {ticketsData.tickets.map((ticket) => (
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
            {ticketsData.pagination.totalPages > 1 && (
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
    </Container>
  )
}

export default MaintenanceDashboard
