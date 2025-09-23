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
  Pagination
} from '@mui/material'
import {
  Dashboard,
  Assignment,
  Build,
  CheckCircle,
  Cancel,
  TrendingUp,
  People,
  Refresh,
  Add,
  FilterList
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
  const $userStore = useStore(userStore)
  const [filters, setFilters] = useState<MaintenanceFilters>({})
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] =
    useState<MaintenanceTicket | null>(null)
  const [editData, setEditData] = useState<MaintenanceUpdateRequest>({})

  const limit = 12

  // Check user permissions
  const isTechnician = $userStore.rol.includes('technician')
  const isAdmin = $userStore.rol.includes('admin')

  // For technicians, filter to only show their assigned tickets
  const technicianFilters = useMemo(() => {
    if (!isTechnician) return filters

    // Hardcode technician ID 4 for kat34433@laoia.com for testing
    const technicianId = $userStore.email === 'kat34433@laoia.com' ? 4 : null

    if (!technicianId) return filters

    return {
      ...filters,
      assignedTechnicianId: technicianId // Using numeric technician ID
    }
  }, [filters, isTechnician, $userStore.email])

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
  const { data: stats, refetch: refetchStats } = useMaintenanceStats()
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
    } catch (error) {
      console.error('Error updating ticket:', error)
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
    <Container maxWidth={false} sx={{ py: 3 }}>
      {/* Header */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={3}
      >
        <Box display='flex' alignItems='center' gap={2}>
          <Dashboard color='primary' sx={{ fontSize: 32 }} />
          <Typography variant='h4' component='h1'>
            Dashboard de Mantenimiento
          </Typography>
        </Box>

        <Box display='flex' gap={1}>
          <Tooltip title='Actualizar datos'>
            <IconButton onClick={handleRefresh} color='primary'>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant='outlined'
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtros
          </Button>
          {!isTechnician && (
            <Button
              variant='contained'
              startIcon={<Add />}
              href='/maintenance/report'
            >
              Nueva Solicitud
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Box>
                  <Typography variant='h4' color='primary'>
                    {stats?.metrics?.totalTickets || 0}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Total Tickets
                  </Typography>
                </Box>
                <Assignment color='primary' sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Box>
                  <Typography variant='h4' color='warning.main'>
                    {stats?.metrics?.pendingTickets || 0}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Pendientes
                  </Typography>
                </Box>
                <Build color='warning' sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Box>
                  <Typography variant='h4' color='success.main'>
                    {stats?.metrics?.completedTickets || 0}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Completados
                  </Typography>
                </Box>
                <CheckCircle color='success' sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Box>
                  <Typography variant='h4' color='info.main'>
                    {stats?.metrics?.avgResolutionTimeHours || 0}h
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Tiempo Promedio
                  </Typography>
                </Box>
                <TrendingUp color='info' sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Stats */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant='h6' gutterBottom>
              Tickets por Prioridad
            </Typography>
            <Grid container spacing={2}>
              {stats?.priorityStats &&
                stats.priorityStats.map(({ priority, count }) => (
                  <Grid item xs={6} sm={3} key={priority}>
                    <Box textAlign='center'>
                      <Typography variant='h5' color='primary'>
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
        <Box mb={3}>
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
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          mb={3}
        >
          <Typography variant='h6'>
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
          <Box display='flex' justifyContent='center' py={4}>
            <Typography>Cargando tickets...</Typography>
          </Box>
        ) : !ticketsData?.tickets.length ? (
          <Alert severity='info'>
            No se encontraron tickets con los filtros aplicados.
          </Alert>
        ) : (
          <>
            <Grid container spacing={3}>
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
              <Box display='flex' justifyContent='center' mt={3}>
                <Pagination
                  count={ticketsData.pagination.totalPages}
                  page={page}
                  onChange={(_, newPage) => setPage(newPage)}
                  color='primary'
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
      >
        <DialogTitle>Editar Ticket #{selectedTicket?.ticketCode}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={editData.status || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      status: e.target.value as MaintenanceStatus
                    }))
                  }
                  label='Estado'
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
                <FormControl fullWidth>
                  <InputLabel>Prioridad</InputLabel>
                  <Select
                    value={editData.priority || ''}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        priority: e.target.value as MaintenancePriority
                      }))
                    }
                    label='Prioridad'
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
                <FormControl fullWidth>
                  <InputLabel>Técnico Asignado</InputLabel>
                  <Select
                    value={editData.assignedTechnician || ''}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        assignedTechnician: e.target.value
                      }))
                    }
                    label='Técnico Asignado'
                  >
                    <MenuItem value=''>Sin asignar</MenuItem>
                    {technicians?.map((technician) => (
                      <MenuItem key={technician.id} value={technician.id}>
                        <Box display='flex' alignItems='center' gap={1}>
                          <Avatar
                            sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                          >
                            {technician.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()}
                          </Avatar>
                          {technician.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {!isTechnician && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
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
                />
              </Grid>
            )}
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
    </Container>
  )
}

export default MaintenanceDashboard
