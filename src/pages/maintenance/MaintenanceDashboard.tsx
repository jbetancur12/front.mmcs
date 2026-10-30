import { getApiErrorReason } from 'src/utils/apiError'
import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
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
  Cancel,
  Help,
  Science,
  Assessment
} from '@mui/icons-material'
import {
  useMaintenanceStats,
  useMaintenanceTickets,
  useMaintenanceTechnicians,
  useTechnicianByEmail,
  useUpdateMaintenanceTicket,
  useUpdateMaintenanceTechnician,
  useDeleteMaintenanceTicket,
  useUploadMaintenanceFiles,
  useMaintenanceTechnicalReport,
  useUpsertMaintenanceTechnicalReport,
  useGenerateTechnicalReport
} from '../../hooks/useMaintenance'
import {
  MaintenanceFilters,
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceTicket,
  MaintenanceUpdateRequest,
  MaintenanceTechnicalReportRequest
} from '../../types/maintenance'
import MaintenanceTicketCard from '../../Components/Maintenance/MaintenanceTicketCard'
import MaintenanceFiltersComponent from '../../Components/Maintenance/MaintenanceFilters'
import MaintenanceStatusBadge from '../../Components/Maintenance/MaintenanceStatusBadge'
import MaintenancePriorityBadge from '../../Components/Maintenance/MaintenancePriorityBadge'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import StatCardSkeleton from '../../Components/Maintenance/StatCardSkeleton'
import TicketCardSkeleton from '../../Components/Maintenance/TicketCardSkeleton'
import useMaintenanceWebSocket from '../../hooks/useMaintenanceWebSocket'
import useAxiosPrivate from '../../utils/use-axios-private'
import { useStore } from '@nanostores/react'
import { userStore } from '../../store/userStore'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import KeyboardShortcutsHelp from '../../Components/Maintenance/KeyboardShortcutsHelp'
import CompletionCostsDialog from '../../Components/Maintenance/CompletionCostsDialog'
import MaintenanceTechnicalReportDialog from '../../Components/Maintenance/MaintenanceTechnicalReportDialog'
import { maintenanceSignaturesEnabled } from '../../features/maintenanceFlags'
import type { CompletionPhotoInput } from '../../Components/Maintenance/CompletionCostsDialog'

import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import { notify } from 'src/utils/notify'
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
  // Por defecto, no mostrar los tickets completados
  const [filters, setFilters] = useState<MaintenanceFilters>({
    status: Object.values(MaintenanceStatus).filter(
      (s) => s !== MaintenanceStatus.COMPLETED
    )
  })
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] =
    useState<MaintenanceTicket | null>(null)
  const [editData, setEditData] = useState<MaintenanceUpdateRequest>({})
  const [costsDialogOpen, setCostsDialogOpen] = useState(false)
  const [technicalReportDialogOpen, setTechnicalReportDialogOpen] =
    useState(false)
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ticketToDelete, setTicketToDelete] =
    useState<MaintenanceTicket | null>(null)

  const limit = 12
  const surfaceSx = {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)'
  }

  const showToast = (
    message: string,
    severity: 'success' | 'error' | 'warning' | 'info'
  ) => {
    notify[severity](message)
  }

  // Check user permissions
  // Sin alcance total sobre los tickets (capacidad), solo se ven y operan los asignados a uno mismo
  const isTechnician = !useCan(PERMISSIONS.MAINTENANCE_TICKET_MANAGE_ALL)
  const canListTechnicians = useCan(PERMISSIONS.MAINTENANCE_TECHNICIAN_LIST)
  const canCreateTickets = useCan(PERMISSIONS.MAINTENANCE_TICKET_CREATE)

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
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats
  } = useMaintenanceStats(currentTechnicianEmail)
  const {
    data: ticketsData,
    isLoading: ticketsLoading,
    refetch: refetchTickets
  } = useMaintenanceTickets(technicianFilters, page, limit)
  const { data: currentTechnician } = useTechnicianByEmail(
    currentTechnicianEmail || ''
  )
  const {
    data: technicalReport,
    isLoading: technicalReportLoading,
    refetch: refetchTechnicalReport
  } = useMaintenanceTechnicalReport(
    selectedTicket?.status === MaintenanceStatus.COMPLETED && selectedTicket?.id
      ? selectedTicket.id
      : ''
  )
  // Only admins can access technicians list
  const { data: technicians } = useMaintenanceTechnicians(canListTechnicians)
  const updateTicketMutation = useUpdateMaintenanceTicket()
  const updateTechnicianMutation = useUpdateMaintenanceTechnician()
  const deleteTicketMutation = useDeleteMaintenanceTicket()
  const uploadFilesMutation = useUploadMaintenanceFiles()
  const upsertTechnicalReportMutation = useUpsertMaintenanceTechnicalReport()
  const generateTechnicalReportMutation = useGenerateTechnicalReport()

  const completionRate = useMemo(() => {
    const total = stats?.metrics?.totalTickets || 0
    const completed = stats?.metrics?.completedTickets || 0
    if (!total) return 0
    return Math.round((completed / total) * 100)
  }, [stats?.metrics?.completedTickets, stats?.metrics?.totalTickets])

  const urgentTickets = useMemo(() => {
    return (
      stats?.priorityStats?.find(
        ({ priority }) => priority === MaintenancePriority.URGENT
      )?.count || 0
    )
  }, [stats?.priorityStats])

  const activeTickets = useMemo(() => {
    return stats?.metrics?.pendingTickets || 0
  }, [stats?.metrics?.pendingTickets])

  const avgResolutionTimeDisplay = useMemo(() => {
    const value = stats?.metrics?.avgResolutionTimeHours || 0
    if (value >= 24) {
      const days = value / 24
      return days >= 10 ? `${Math.round(days)}d` : `${days.toFixed(1)}d`
    }
    return value >= 10 ? `${Math.round(value)}h` : `${value.toFixed(1)}h`
  }, [stats?.metrics?.avgResolutionTimeHours])

  const technicalReportCompletion = useMemo(() => {
    if (!technicalReport) return 0

    const checkpoints = [
      technicalReport.finalDiagnosis,
      technicalReport.rootCause,
      technicalReport.activities?.length,
      technicalReport.parts?.length,
      technicalReport.verificationProtocolType,
      technicalReport.verificationTests?.length,
      technicalReport.recommendations,
      technicalReport.scopeClause,
      technicalReport.responsibilityClause
    ]

    const completed = checkpoints.filter(Boolean).length
    return Math.round((completed / checkpoints.length) * 100)
  }, [technicalReport])

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
      if (canCreateTickets) {
        navigate('/maintenance/new')
      }
    },
    onToggleFilters: () => {
      setShowFilters((prev) => !prev)
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
            const searchFieldDelayed =
              document.getElementById('quick-search-field')
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

  // Ordenar tickets por prioridad (urgente -> alta -> media -> baja) y luego por fecha de creación (más antiguos primero)
  const sortedTickets = useMemo(() => {
    if (!ticketsData?.tickets) return []

    const priorityOrder = {
      [MaintenancePriority.URGENT]: 4,
      [MaintenancePriority.HIGH]: 3,
      [MaintenancePriority.MEDIUM]: 2,
      [MaintenancePriority.LOW]: 1
    }

    return [...ticketsData.tickets].sort((a, b) => {
      // Primero ordenar por prioridad (más alta primero)
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
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
    if (maintenanceSignaturesEnabled && ticket.customerSignatureData) {
      showToast(
        'Este ticket ya fue firmado por el cliente y su contenido técnico quedó bloqueado',
        'warning'
      )
      return
    }

    if (
      isTechnician &&
      ticket.assignedTechnician?.email !== $userStore.email &&
      Number(ticket.assignedTechnician?.id) !== Number(currentTechnician?.id)
    ) {
      showToast('Solo puedes editar tickets asignados a tu usuario', 'warning')
      return
    }

    setSelectedTicket(ticket)
    console.log('🚀 ~ handleEditTicket ~ ticket:', ticket)
    setEditData({
      status: ticket.status,
      assignedTechnician: ticket.assignedTechnicianId || '',
      scheduledDate: ticket.scheduledDate || '',
      equipmentType: ticket.equipmentType || '',
      equipmentBrand: ticket.equipmentBrand || '',
      equipmentModel: ticket.equipmentModel || '',
      equipmentSerial: ticket.equipmentSerial || '',
      location: ticket.location || '',
      priority: ticket.priority,
      intakePhysicalCondition: ticket.intakePhysicalCondition || '',
      receivedAccessories: ticket.receivedAccessories || ''
    })
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedTicket) return

    // Check if changing to COMPLETED status
    if (
      editData.status === MaintenanceStatus.COMPLETED &&
      selectedTicket.status !== MaintenanceStatus.COMPLETED
    ) {
      // Open costs dialog instead of saving directly
      setCostsDialogOpen(true)
      return
    }

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
      const errorMessage =
        getApiErrorReason(error) ||
        'Error al actualizar el ticket'
      showToast(errorMessage, 'error')
    }
  }

  const handleCompleteWithCosts = async (
    workPerformed: string,
    technicianWorkMinutes: number,
    costs: any[],
    completionPhotos: CompletionPhotoInput[],
    technicianSignature: {
      technicianSignatureData?: string | null
      saveTechnicianSignature?: boolean
    }
  ) => {
    if (!selectedTicket) return

    try {
      const targetTechnicianId =
        currentTechnician?.id || selectedTicket.assignedTechnician?.id

      if (
        technicianSignature.saveTechnicianSignature &&
        targetTechnicianId &&
        technicianSignature.technicianSignatureData
      ) {
        await updateTechnicianMutation.mutateAsync({
          id: targetTechnicianId,
          data: {
            signatureData: technicianSignature.technicianSignatureData
          }
        })
      }

      const completionPayload = isTechnician
        ? {
            status: MaintenanceStatus.COMPLETED,
            workPerformed,
            technicianWorkMinutes,
            costs,
            technicianSignatureData: maintenanceSignaturesEnabled
              ? technicianSignature.technicianSignatureData ||
                selectedTicket.technicianSignatureData ||
                currentTechnician?.signatureData ||
                selectedTicket.assignedTechnician?.signatureData ||
                null
              : null
          }
        : {
            ...editData,
            status: MaintenanceStatus.COMPLETED,
            workPerformed,
            technicianWorkMinutes,
            costs,
            technicianSignatureData: maintenanceSignaturesEnabled
              ? technicianSignature.technicianSignatureData ||
                selectedTicket.technicianSignatureData ||
                selectedTicket.assignedTechnician?.signatureData ||
                null
              : null
          }

      await updateTicketMutation.mutateAsync({
        id: selectedTicket.id,
        data: completionPayload
      })
      if (completionPhotos.length > 0) {
        await Promise.all(
          completionPhotos.map((photo) =>
            uploadFilesMutation.mutateAsync({
              ticketId: selectedTicket.id,
              files: [photo.file],
              category: 'repair_photo',
              description:
                photo.description?.trim() ||
                'Evidencia fotográfica del servicio completado',
              isPublic: false
            })
          )
        )
      }
      setCostsDialogOpen(false)
      setEditDialogOpen(false)
      setSelectedTicket(null)
      setEditData({})
      refetchTickets()
      refetchStats()
      showToast(
        completionPhotos.length > 0
          ? 'Ticket completado y fotos adjuntadas exitosamente'
          : 'Ticket completado exitosamente',
        'success'
      )
    } catch (error: any) {
      console.error('Error completing ticket:', error)
      const errorMessage =
        getApiErrorReason(error) ||
        'Error al completar el ticket'
      showToast(errorMessage, 'error')
      throw error
    }
  }

  const handleViewTicket = (ticket: MaintenanceTicket) => {
    // Navigate to ticket details page using React Router
    navigate(`/maintenance/tickets/${ticket.id}`)
  }

  const handleOpenTechnicalReport = (ticket: MaintenanceTicket) => {
    if (maintenanceSignaturesEnabled && ticket.customerSignatureData) {
      showToast(
        'El reporte técnico ya no puede editarse después de la firma del cliente',
        'warning'
      )
      return
    }
    setSelectedTicket(ticket)
    setTechnicalReportDialogOpen(true)
  }

  const handleSaveTechnicalReport = async (
    reportData: MaintenanceTechnicalReportRequest
  ) => {
    if (!selectedTicket?.id) return

    try {
      await upsertTechnicalReportMutation.mutateAsync({
        ticketId: selectedTicket.id,
        data: reportData
      })
      await refetchTechnicalReport()
      refetchTickets()
      refetchStats()
      showToast('Reporte técnico guardado exitosamente', 'success')
    } catch (error: any) {
      console.error('Error saving technical report:', error)
      const errorMessage =
        getApiErrorReason(error) ||
        'Error al guardar el reporte técnico'
      showToast(errorMessage, 'error')
      throw error
    }
  }

  const handleGenerateTechnicalReport = () => {
    if (!selectedTicket?.id) return

    generateTechnicalReportMutation.mutate(selectedTicket.id, {
      onSuccess: () => {
        showToast('Reporte técnico generado exitosamente', 'success')
      },
      onError: (error: any) => {
        console.error('Error generating technical report:', error)
        showToast('Error al generar reporte técnico', 'error')
      }
    })
  }

  const handleDeleteClick = (ticket: MaintenanceTicket) => {
    setTicketToDelete(ticket)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!ticketToDelete) return

    try {
      await deleteTicketMutation.mutateAsync(ticketToDelete.id)
      setDeleteDialogOpen(false)
      setTicketToDelete(null)
      refetchTickets()
      refetchStats()
      showToast('Ticket eliminado exitosamente', 'success')
    } catch (error: any) {
      console.error('Error deleting ticket:', error)
      const errorMessage =
        getApiErrorReason(error) ||
        'Error al eliminar el ticket'
      showToast(errorMessage, 'error')
    }
  }

  const handleRefresh = () => {
    refetchStats()
    refetchTickets()
  }

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Dashboard de Mantenimiento'
        subtitle='Gestión integral de tickets y técnicos'
        icon={<Dashboard />}
        actions={
          <Box display='flex' gap={1} flexWrap='wrap' alignItems='center'>
            <Tooltip title='Actualizar datos'>
              <IconButton onClick={handleRefresh} aria-label='Actualizar datos del dashboard'>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title='Atajos de teclado (Shift + ?)'>
              <IconButton onClick={() => setShortcutsHelpOpen(true)} aria-label='Mostrar atajos de teclado'>
                <Help />
              </IconButton>
            </Tooltip>
            <Button
              variant='outlined'
              startIcon={!isMobile && <FilterList />}
              onClick={() => setShowFilters(!showFilters)}
              aria-label={showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
              aria-expanded={showFilters}
              aria-controls='maintenance-filters-section'
              sx={{ color: '#00897B', borderColor: '#00BFA5', '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' } }}
            >
              {isMobile ? <FilterList /> : 'Filtros'}
            </Button>
            <Button
              variant='outlined'
              startIcon={!isMobile && <Assessment />}
              href='/maintenance/analytics'
              sx={{ color: '#00897B', borderColor: '#00BFA5', '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' } }}
            >
              {isMobile ? <Assessment /> : 'Analíticas'}
            </Button>
            {!isTechnician && (
              <Button
                variant='contained'
                startIcon={!isMobile && <Add />}
                href='/maintenance/report'
                sx={{ bgcolor: '#00BFA5', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#00ACC1' } }}
              >
                {isMobile ? <Add /> : 'Nueva Solicitud'}
              </Button>
            )}
          </Box>
        }
      />

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3} role='region' aria-label='Estadísticas del dashboard'>
        {statsLoading ? (
          <>
            <Grid item xs={12}><StatCardSkeleton /></Grid>
          </>
        ) : (
          <>
            <Grid item xs={6} md={3}>
              <LmsStatCard label='Total Tickets' value={stats?.metrics?.totalTickets || 0} icon={<Assignment />} tone='teal' />
            </Grid>
            <Grid item xs={6} md={3}>
              <LmsStatCard label='Pendientes' value={stats?.metrics?.pendingTickets || 0} icon={<Build />} tone='orange' />
            </Grid>
            <Grid item xs={6} md={3}>
              <LmsStatCard label='Completados' value={stats?.metrics?.completedTickets || 0} icon={<CheckCircle />} tone='green' />
            </Grid>
            <Grid item xs={6} md={3}>
              <LmsStatCard label='Tiempo Promedio' value={avgResolutionTimeDisplay} caption='Promedio de cierre' icon={<TrendingUp />} tone='blue' />
            </Grid>
          </>
        )}
      </Grid>

      {/* Additional Stats */}
      <Grid
        container
        spacing={{ xs: 2, sm: 2, md: 3 }}
        mb={{ xs: 2, sm: 3, md: 3 }}
      >
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: { xs: 2, sm: 3 },
              ...surfaceSx
            }}
          >
            <Box mb={3}>
              <Typography
                variant='h6'
                gutterBottom
                sx={{
                  fontSize: { xs: '1.125rem', sm: '1.25rem' },
                  fontWeight: 600,
                  color: '#0f172a',
                  mb: 0.5
                }}
              >
                Tickets por Prioridad
              </Typography>
              <Typography variant='body2' sx={{ color: '#64748b' }}>
                Vista rápida para detectar carga operativa y urgencias sin
                saturar el tablero.
              </Typography>
            </Box>
            <Grid container spacing={{ xs: 1, sm: 2 }}>
              {stats?.priorityStats &&
                stats.priorityStats.map(({ priority, count }) => (
                  <Grid item xs={6} sm={4} key={priority}>
                    <Box
                      textAlign='center'
                      sx={{
                        p: { xs: 1.75, sm: 2 },
                        borderRadius: '12px',
                        backgroundColor: '#fbfdfb',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <Typography
                        variant='h5'
                        sx={{
                          fontSize: { xs: '1.25rem', sm: '1.5rem' },
                          fontWeight: 700,
                          color: '#0f172a',
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

        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: { xs: 2, sm: 3 },
              height: '100%',
              ...surfaceSx
            }}
          >
            <Box mb={2.5}>
              <Typography
                variant='h6'
                gutterBottom
                sx={{
                  fontSize: { xs: '1.125rem', sm: '1.25rem' },
                  fontWeight: 600,
                  color: '#0f172a',
                  mb: 0.5
                }}
              >
                Panorama Rápido
              </Typography>
              <Typography variant='body2' sx={{ color: '#64748b' }}>
                Resumen operativo para leer el tablero de un vistazo.
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gap: 1.5 }}>
              {[
                {
                  label: 'Cierre efectivo',
                  value: `${completionRate}%`,
                  helper: 'Tickets completados sobre el total',
                  color: '#00A651',
                  background: '#e8f7ef'
                },
                {
                  label: 'Carga activa',
                  value: `${activeTickets}`,
                  helper: 'Tickets que siguen en operación',
                  color: '#b45309',
                  background: '#fff7ed'
                },
                {
                  label: 'Urgencias abiertas',
                  value: `${urgentTickets}`,
                  helper: 'Casos que necesitan más atención',
                  color: '#dc2626',
                  background: '#fef2f2'
                }
              ].map((item) => (
                <Box
                  key={item.label}
                  sx={{
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    p: 1.75,
                    backgroundColor: '#ffffff'
                  }}
                >
                  <Box
                    display='flex'
                    alignItems='center'
                    justifyContent='space-between'
                    gap={2}
                  >
                    <Box>
                      <Typography
                        variant='body2'
                        sx={{ fontWeight: 600, color: '#0f172a', mb: 0.25 }}
                      >
                        {item.label}
                      </Typography>
                      <Typography variant='caption' sx={{ color: '#64748b' }}>
                        {item.helper}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        minWidth: 68,
                        px: 1.25,
                        py: 0.75,
                        borderRadius: '999px',
                        textAlign: 'center',
                        fontWeight: 700,
                        color: item.color,
                        backgroundColor: item.background
                      }}
                    >
                      {item.value}
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
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
        <Box
          mb={3}
          id='maintenance-filters-section'
          role='region'
          aria-label='Sección de filtros'
        >
          <MaintenanceFiltersComponent
            filters={filters}
            onFiltersChange={(newFilters) => setFilters({ ...newFilters })}
            technicians={technicians || []}
            equipmentTypes={equipmentTypes}
            loading={ticketsLoading}
            resultsCount={ticketsData?.pagination.totalItems}
          />
        </Box>
      )}

      {/* Tickets Grid */}
      <Paper
        sx={{
          p: { xs: 2, sm: 3 },
          ...surfaceSx
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
          <Box>
            <Typography
              variant='h6'
              sx={{
                fontSize: { xs: '1.125rem', sm: '1.25rem' },
                fontWeight: 600,
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1
              }}
            >
              Tickets de Mantenimiento
              {ticketsData?.pagination.totalItems && (
                <Chip
                  label={`${ticketsData.pagination.totalItems} total`}
                  size='small'
                  sx={{
                    backgroundColor: '#e8f7ef',
                    color: '#00A651',
                    fontWeight: 600
                  }}
                />
              )}
            </Typography>
            <Typography variant='body2' sx={{ mt: 0.5, color: '#64748b' }}>
              Tarjetas más ligeras para priorizar lectura rápida y acciones
              frecuentes.
            </Typography>
          </Box>
        </Box>

        {ticketsLoading ? (
          <Grid
            container
            spacing={{ xs: 2, sm: 2, md: 3 }}
            role='status'
            aria-live='polite'
          >
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
                    onDelete={
                      !isTechnician &&
                      [
                        MaintenanceStatus.PENDING,
                        MaintenanceStatus.ASSIGNED,
                        MaintenanceStatus.CANCELLED
                      ].includes(ticket.status as MaintenanceStatus)
                        ? handleDeleteClick
                        : undefined
                    }
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>
          {'¿Eliminar ticket de mantenimiento?'}
        </DialogTitle>
        <DialogContent>
          <Typography variant='body1' gutterBottom>
            ¿Estás seguro de que deseas eliminar el ticket{' '}
            <strong>#{ticketToDelete?.ticketCode}</strong>?
          </Typography>
          <Alert severity='warning' sx={{ mt: 2 }}>
            Esta acción no se puede deshacer. Se eliminarán todos los
            comentarios y archivos asociados.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            color='primary'
            disabled={deleteTicketMutation.isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmDelete}
            color='error'
            variant='contained'
            autoFocus
            disabled={deleteTicketMutation.isLoading}
          >
            {deleteTicketMutation.isLoading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

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
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='center'
          >
            <Typography
              variant='h6'
              sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}
            >
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
        <DialogContent
          id='edit-ticket-dialog-description'
          sx={{ pt: { xs: 2.5, sm: 3 }, overflowY: 'auto' }}
        >
          <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                <Typography
                  variant='caption'
                  sx={{
                    mb: 0.75,
                    px: 0.5,
                    fontWeight: 600,
                    color: '#64748b',
                    letterSpacing: '0.02em'
                  }}
                >
                  Estado
                </Typography>
                <Select
                  id='edit-status-select'
                  value={editData.status || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      status: e.target.value as MaintenanceStatus
                    }))
                  }
                  aria-label='Seleccionar estado del ticket'
                  disabled={
                    selectedTicket?.status === MaintenanceStatus.COMPLETED
                  }
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
                  <Typography
                    variant='caption'
                    sx={{
                      mb: 0.75,
                      px: 0.5,
                      fontWeight: 600,
                      color: '#64748b',
                      letterSpacing: '0.02em'
                    }}
                  >
                    Prioridad
                  </Typography>
                  <Select
                    id='edit-priority-select'
                    value={editData.priority || ''}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        priority: e.target.value as MaintenancePriority
                      }))
                    }
                    aria-label='Seleccionar prioridad del ticket'
                    disabled={
                      selectedTicket?.status === MaintenanceStatus.COMPLETED
                    }
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
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size={isMobile ? 'small' : 'medium'}
                  label='Tipo de equipo'
                  value={editData.equipmentType || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      equipmentType: e.target.value
                    }))
                  }
                />
              </Grid>
            )}

            {!isTechnician && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size={isMobile ? 'small' : 'medium'}
                  label='Marca'
                  value={editData.equipmentBrand || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      equipmentBrand: e.target.value
                    }))
                  }
                />
              </Grid>
            )}

            {!isTechnician && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size={isMobile ? 'small' : 'medium'}
                  label='Modelo'
                  value={editData.equipmentModel || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      equipmentModel: e.target.value
                    }))
                  }
                />
              </Grid>
            )}

            {!isTechnician && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size={isMobile ? 'small' : 'medium'}
                  label='Número de serie'
                  value={editData.equipmentSerial || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      equipmentSerial: e.target.value
                    }))
                  }
                />
              </Grid>
            )}

            {!isTechnician && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size={isMobile ? 'small' : 'medium'}
                  label='Ubicación del equipo'
                  value={editData.location || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      location: e.target.value
                    }))
                  }
                />
              </Grid>
            )}

            {!isTechnician && (
              <Grid item xs={12}>
                <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                  <InputLabel id='edit-technician-label'>
                    Técnico Asignado
                  </InputLabel>
                  <Select
                    labelId='edit-technician-label'
                    id='edit-technician-select'
                    value={editData.assignedTechnician || ''}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        assignedTechnician: e.target.value,
                        status:
                          prev.status === MaintenanceStatus.PENDING &&
                          Boolean(e.target.value)
                            ? MaintenanceStatus.ASSIGNED
                            : prev.status
                      }))
                    }
                    label='Técnico Asignado'
                    aria-label='Seleccionar técnico asignado'
                    disabled={
                      selectedTicket?.status === MaintenanceStatus.COMPLETED
                    }
                  >
                    <MenuItem value=''>Sin asignar</MenuItem>
                    {technicians
                      ?.filter((t) => t.status === 'active')
                      .sort((a, b) => {
                        const aCapacity = a.maxWorkload - a.workload
                        const bCapacity = b.maxWorkload - b.workload
                        return bCapacity - aCapacity
                      })
                      .map((technician) => {
                        const utilizationPct =
                          (technician.workload / technician.maxWorkload) * 100
                        const isFull =
                          technician.workload >= technician.maxWorkload
                        const isNearFull = utilizationPct >= 80

                        return (
                          <MenuItem
                            key={technician.id}
                            value={technician.id}
                            disabled={isFull}
                          >
                            <Box
                              display='flex'
                              flexDirection='column'
                              width='100%'
                            >
                              <Box
                                display='flex'
                                alignItems='center'
                                gap={1}
                                width='100%'
                              >
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    fontSize: '0.875rem',
                                    bgcolor: isFull
                                      ? 'error.main'
                                      : isNearFull
                                        ? 'warning.main'
                                        : 'success.main'
                                  }}
                                >
                                  {technician.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase()}
                                </Avatar>

                                <Box flex={1}>
                                  <Typography
                                    variant='body2'
                                    fontWeight='medium'
                                  >
                                    {technician.name}
                                  </Typography>
                                  <Typography
                                    variant='caption'
                                    color='text.secondary'
                                  >
                                    {technician.specialization || 'General'}
                                  </Typography>
                                </Box>

                                <Box
                                  display='flex'
                                  gap={0.5}
                                  alignItems='center'
                                >
                                  <Chip
                                    size='small'
                                    label={`${technician.workload}/${technician.maxWorkload}`}
                                    color={
                                      isFull
                                        ? 'error'
                                        : isNearFull
                                          ? 'warning'
                                          : 'success'
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
                                    isFull
                                      ? 'error'
                                      : isNearFull
                                        ? 'warning'
                                        : 'success'
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

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size={isMobile ? 'small' : 'medium'}
                id='edit-intake-physical-condition'
                label='Condición inicial del equipo'
                value={editData.intakePhysicalCondition || ''}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    intakePhysicalCondition: e.target.value
                  }))
                }
                multiline
                minRows={3}
                placeholder='Rayones, golpes, faltantes o condición general al iniciar la intervención'
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size={isMobile ? 'small' : 'medium'}
                id='edit-received-accessories'
                label='Accesorios disponibles'
                value={editData.receivedAccessories || ''}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    receivedAccessories: e.target.value
                  }))
                }
                multiline
                minRows={3}
                placeholder='Cables, sensores, fuente, batería, adaptadores u otros accesorios disponibles durante el servicio'
              />
            </Grid>

            {/* Capacity Warning Alert */}
            {editData.assignedTechnician &&
              (() => {
                const selectedTech = technicians?.find(
                  (t) => t.id === editData.assignedTechnician
                )
                if (!selectedTech) return null

                const utilizationPct =
                  (selectedTech.workload / selectedTech.maxWorkload) * 100

                if (utilizationPct >= 80 && utilizationPct < 100) {
                  return (
                    <Grid item xs={12}>
                      <Alert severity='warning' sx={{ mt: 2 }}>
                        <AlertTitle>
                          Técnico casi en capacidad máxima
                        </AlertTitle>
                        <Typography variant='body2'>
                          <strong>{selectedTech.name}</strong> tiene{' '}
                          <strong>{selectedTech.workload}</strong> de{' '}
                          <strong>{selectedTech.maxWorkload}</strong> tickets
                          asignados ({utilizationPct.toFixed(0)}% utilización).{' '}
                          Considere asignar a un técnico con menos carga de
                          trabajo.
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
                          <strong>{selectedTech.name}</strong> ha alcanzado su
                          capacidad máxima ({selectedTech.workload}/
                          {selectedTech.maxWorkload} tickets). Por favor
                          seleccione otro técnico disponible.
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
          {selectedTicket?.status === MaintenanceStatus.COMPLETED && (
            <Button
              onClick={() => handleOpenTechnicalReport(selectedTicket)}
              variant='outlined'
              startIcon={<Science />}
            >
              {technicalReport?.updatedAt
                ? `Reporte técnico ${technicalReportCompletion}%`
                : 'Reporte técnico'}
            </Button>
          )}
          <Button
            onClick={handleSaveEdit}
            variant='contained'
            disabled={updateTicketMutation.isLoading}
          >
            {updateTicketMutation.isLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <MaintenanceTechnicalReportDialog
        open={technicalReportDialogOpen}
        onClose={() => setTechnicalReportDialogOpen(false)}
        report={technicalReport}
        equipmentType={selectedTicket?.equipmentType}
        loading={technicalReportLoading}
        saving={upsertTechnicalReportMutation.isLoading}
        generatingPdf={generateTechnicalReportMutation.isLoading}
        onSave={handleSaveTechnicalReport}
        onGeneratePdf={handleGenerateTechnicalReport}
      />

      {/* Completion Costs Dialog */}
      <CompletionCostsDialog
        open={costsDialogOpen}
        onClose={() => setCostsDialogOpen(false)}
        onComplete={handleCompleteWithCosts}
        technicianName={selectedTicket?.assignedTechnician?.name}
        storedTechnicianSignature={
          selectedTicket?.technicianSignatureData ||
          (isTechnician
            ? currentTechnician?.signatureData ||
              selectedTicket?.assignedTechnician?.signatureData ||
              null
            : selectedTicket?.assignedTechnician?.signatureData || null)
        }
        canCaptureTechnicianSignature={
          !(
            selectedTicket?.technicianSignatureData ||
            currentTechnician?.signatureData ||
            selectedTicket?.assignedTechnician?.signatureData
          )
        }
        signaturesEnabled={maintenanceSignaturesEnabled}
        loading={
          updateTicketMutation.isLoading ||
          uploadFilesMutation.isLoading ||
          updateTechnicianMutation.isLoading
        }
      />


      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        open={shortcutsHelpOpen}
        onClose={() => setShortcutsHelpOpen(false)}
      />
    </Container>
  )
}

export default MaintenanceDashboard
