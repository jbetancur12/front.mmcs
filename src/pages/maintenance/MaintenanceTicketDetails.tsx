import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  Divider,
  Skeleton,
  Breadcrumbs,
  Link,
  Collapse,
  ListItemIcon,
  ListItemText,
  Snackbar,
  AlertTitle,
  CircularProgress,
  Menu,
  MenuList,
  ListItemButton,
  Switch,
  FormControlLabel,
  Badge,
  Stack,
  LinearProgress
} from '@mui/material'
import {
  ArrowBack,
  Edit,
  Save,
  Cancel,
  Description,
  Assignment,
  Person,
  Schedule,
  Build,
  PictureAsPdf,
  Refresh,
  ExpandMore,
  ExpandLess,
  Phone,
  Email,
  LocationOn,
  CalendarToday,
  AttachMoney,
  Star,
  Print,
  Error,
  Warning,
  Info,
  Receipt,
  AssignmentTurnedIn,
  Share,
  NotificationsActive,
  TrendingUp,
  Assessment
} from '@mui/icons-material'
import {
  useMaintenanceTicket,
  useUpdateMaintenanceTicket,
  useAddMaintenanceComment,
  useUploadMaintenanceFiles,
  useDeleteMaintenanceFile,
  useMaintenanceTechnicians
} from '../../hooks/useMaintenance'
import {
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceUpdateRequest,
  MaintenanceFile
} from '../../types/maintenance'
import MaintenanceStatusBadge from '../../Components/Maintenance/MaintenanceStatusBadge'
import MaintenancePriorityBadge from '../../Components/Maintenance/MaintenancePriorityBadge'
import MaintenanceCommentsList from '../../Components/Maintenance/MaintenanceCommentsList'
import MaintenanceFileUpload from '../../Components/Maintenance/MaintenanceFileUpload'
import MaintenanceTimeline from '../../Components/Maintenance/MaintenanceTimeline'
import MaintenanceErrorBoundary from '../../Components/Maintenance/MaintenanceErrorBoundary'
import useMaintenanceWebSocket from '../../hooks/useMaintenanceWebSocket'
import useAxiosPrivate from '../../utils/use-axios-private'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * MaintenanceTicketDetails component provides a comprehensive ticket management interface
 * Features: ticket info display, editing, comments, file management, timeline, PDF generation
 */
const MaintenanceTicketDetails: React.FC = () => {
  useAxiosPrivate() // Initialize axios interceptors for automatic token refresh

  const { ticketId } = useParams<{ ticketId: string }>()
  const navigate = useNavigate()

  // State management
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState<MaintenanceUpdateRequest>({})
  const [showTimeline, setShowTimeline] = useState(true)
  const [showComments, setShowComments] = useState(true)
  const [showFiles, setShowFiles] = useState(true)
  const [currentUserRole] = useState('admin') // This would come from auth context

  // New state for enhanced functionality
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    message: string
    onConfirm: () => void
    severity?: 'warning' | 'error' | 'info'
  }>({ open: false, title: '', message: '', onConfirm: () => {} })

  const [toast, setToast] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'warning' | 'info'
  }>({ open: false, message: '', severity: 'info' })

  const [pdfMenuAnchor, setPdfMenuAnchor] = useState<null | HTMLElement>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [realTimeUpdatesEnabled, setRealTimeUpdatesEnabled] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [isEditValid, setIsEditValid] = useState(true)

  // API hooks
  const {
    data: ticket,
    isLoading: ticketLoading,
    error: ticketError,
    refetch: refetchTicket
  } = useMaintenanceTicket(ticketId || '')

  const { data: technicians } = useMaintenanceTechnicians()
  const updateTicketMutation = useUpdateMaintenanceTicket()
  const addCommentMutation = useAddMaintenanceComment()
  const uploadFilesMutation = useUploadMaintenanceFiles()
  const deleteFileMutation = useDeleteMaintenanceFile()

  // WebSocket for real-time updates
  useMaintenanceWebSocket({
    enabled: realTimeUpdatesEnabled,
    onTicketUpdate: (updatedTicket) => {
      if (updatedTicket.id === ticketId) {
        console.log('Ticket updated via WebSocket:', updatedTicket)
        setLastUpdate(new Date())
        refetchTicket()
        showToast('Ticket actualizado en tiempo real', 'info')
      }
    },
    onNotification: (notification) => {
      if (notification.ticketId === ticketId) {
        console.log('New notification for this ticket:', notification)
        setLastUpdate(new Date())
        refetchTicket()
        showToast('Nueva notificación recibida', 'info')
      }
    }
  })

  // Initialize edit data when ticket loads
  useEffect(() => {
    if (ticket && !editMode) {
      setEditData({
        status: ticket.status,
        assignedTechnician: ticket.technicianId || '',
        scheduledDate: ticket.scheduledDate || '',
        priority: ticket.priority,
        estimatedCost: ticket.estimatedCost,
        actualCost: ticket.actualCost,
        location: ticket.location
      })
    }
  }, [ticket, editMode])

  // Validate edit data when it changes
  useEffect(() => {
    if (editMode) {
      validateEditData()
    }
  }, [editData, editMode])

  // Helper functions
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'No programada'
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es })
    } catch {
      return 'Fecha inválida'
    }
  }

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return 'No especificado'
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount)
  }

  // Toast notification helper
  const showToast = (
    message: string,
    severity: 'success' | 'error' | 'warning' | 'info'
  ) => {
    setToast({ open: true, message, severity })
  }

  // Confirmation dialog helper
  const showConfirmDialog = (
    title: string,
    message: string,
    onConfirm: () => void,
    severity: 'warning' | 'error' | 'info' = 'warning'
  ) => {
    setConfirmDialog({ open: true, title, message, onConfirm, severity })
  }

  // Close dialogs
  const closeConfirmDialog = () => {
    setConfirmDialog({
      open: false,
      title: '',
      message: '',
      onConfirm: () => {}
    })
  }

  const closeToast = () => {
    setToast({ open: false, message: '', severity: 'info' })
  }

  // Event handlers
  const handleEdit = () => {
    setEditMode(true)
    setEditErrors({})
    setIsEditValid(true)
  }

  const handleCancelEdit = () => {
    setEditMode(false)
    if (ticket) {
      setEditData({
        status: ticket.status,
        assignedTechnician: ticket.technicianId || '',
        scheduledDate: ticket.scheduledDate || '',
        priority: ticket.priority,
        estimatedCost: ticket.estimatedCost,
        actualCost: ticket.actualCost,
        location: ticket.location
      })
    }
  }

  const validateEditData = () => {
    const errors: Record<string, string> = {}

    if (editData.estimatedCost !== undefined && editData.estimatedCost < 0) {
      errors.estimatedCost = 'El costo estimado no puede ser negativo'
    }

    if (editData.actualCost !== undefined && editData.actualCost < 0) {
      errors.actualCost = 'El costo real no puede ser negativo'
    }

    if (
      editData.location !== undefined &&
      editData.location.trim().length < 5
    ) {
      errors.location = 'La ubicación debe tener al menos 5 caracteres'
    }

    if (editData.scheduledDate) {
      const scheduledDate = new Date(editData.scheduledDate)
      const now = new Date()
      if (scheduledDate < now && ticket?.status === MaintenanceStatus.PENDING) {
        errors.scheduledDate =
          'No se puede programar una fecha en el pasado para tickets pendientes'
      }
    }

    setEditErrors(errors)
    const valid = Object.keys(errors).length === 0
    setIsEditValid(valid)
    return valid
  }

  const handleSaveEdit = async () => {
    if (!ticket) return

    if (!validateEditData()) {
      showToast('Por favor corrige los errores antes de guardar', 'error')
      return
    }

    try {
      await updateTicketMutation.mutateAsync({
        id: ticket.id,
        data: editData
      })
      setEditMode(false)
      setEditErrors({})
      // Refetch ticket data to show updated information
      await refetchTicket()
      showToast('Ticket actualizado exitosamente', 'success')
    } catch (error) {
      console.error('Error updating ticket:', error)
      showToast('Error al actualizar el ticket', 'error')
    }
  }

  const handleAddComment = async (comment: string, isInternal: boolean) => {
    if (!ticketId) return

    try {
      await addCommentMutation.mutateAsync({
        ticketId,
        comment,
        isInternal
      })
      // Refetch ticket data to show new comment
      await refetchTicket()
      showToast('Comentario agregado exitosamente', 'success')
    } catch (error) {
      console.error('Error adding comment:', error)
      showToast('Error al agregar comentario', 'error')
      throw error
    }
  }

  const handleFileUpload = async (files: File[]) => {
    if (!ticketId || files.length === 0) return

    try {
      await uploadFilesMutation.mutateAsync({
        ticketId,
        files
      })
      // Refetch ticket data to show new files
      await refetchTicket()
      showToast(`${files.length} archivo(s) subido(s) exitosamente`, 'success')
    } catch (error) {
      console.error('Error uploading files:', error)
      showToast('Error al subir archivos', 'error')
    }
  }

  const handleFileDelete = async (fileId: string) => {
    if (!ticketId) return

    showConfirmDialog(
      'Eliminar archivo',
      '¿Estás seguro de que deseas eliminar este archivo? Esta acción no se puede deshacer.',
      async () => {
        try {
          await deleteFileMutation.mutateAsync({
            ticketId,
            fileId
          })
          // Refetch ticket data to update file list
          await refetchTicket()
          showToast('Archivo eliminado exitosamente', 'success')
        } catch (error) {
          console.error('Error deleting file:', error)
          showToast('Error al eliminar archivo', 'error')
        }
      },
      'warning'
    )
  }

  const handleFileView = (file: MaintenanceFile) => {
    // Open file in new tab/window
    window.open(
      `/api/maintenance/tickets/${ticketId}/files/${file.id}/download`,
      '_blank'
    )
  }

  const handleGenerateServiceOrder = async () => {
    setIsGeneratingPdf(true)
    try {
      window.open(
        `/api/maintenance/tickets/${ticketId}/pdf/service-order`,
        '_blank'
      )
      showToast('Orden de servicio generada exitosamente', 'success')
    } catch (error) {
      showToast('Error al generar orden de servicio', 'error')
    } finally {
      setIsGeneratingPdf(false)
      setPdfMenuAnchor(null)
    }
  }

  const handleGenerateStatusReport = async () => {
    setIsGeneratingPdf(true)
    try {
      window.open(
        `/api/maintenance/tickets/${ticketId}/pdf/status-report`,
        '_blank'
      )
      showToast('Reporte de estado generado exitosamente', 'success')
    } catch (error) {
      showToast('Error al generar reporte de estado', 'error')
    } finally {
      setIsGeneratingPdf(false)
      setPdfMenuAnchor(null)
    }
  }

  const handleGenerateServiceCertificate = async () => {
    if (ticket?.status !== MaintenanceStatus.COMPLETED) {
      showToast(
        'El certificado solo se puede generar para tickets completados',
        'warning'
      )
      return
    }

    setIsGeneratingPdf(true)
    try {
      window.open(
        `/api/maintenance/tickets/${ticketId}/pdf/service-certificate`,
        '_blank'
      )
      showToast('Certificado de servicio generado exitosamente', 'success')
    } catch (error) {
      showToast('Error al generar certificado de servicio', 'error')
    } finally {
      setIsGeneratingPdf(false)
      setPdfMenuAnchor(null)
    }
  }

  const handleGenerateInvoice = async () => {
    if (!ticket?.actualCost && !ticket?.estimatedCost) {
      showToast(
        'Debe haber un costo especificado para generar factura',
        'warning'
      )
      return
    }

    setIsGeneratingPdf(true)
    try {
      window.open(`/api/maintenance/tickets/${ticketId}/pdf/invoice`, '_blank')
      showToast('Factura generada exitosamente', 'success')
    } catch (error) {
      showToast('Error al generar factura', 'error')
    } finally {
      setIsGeneratingPdf(false)
      setPdfMenuAnchor(null)
    }
  }

  const handlePdfMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setPdfMenuAnchor(event.currentTarget)
  }

  const handlePdfMenuClose = () => {
    setPdfMenuAnchor(null)
  }

  const handleRefresh = () => {
    refetchTicket()
    showToast('Datos actualizados', 'info')
    setLastUpdate(new Date())
  }

  const handleBack = () => {
    if (editMode) {
      showConfirmDialog(
        'Descartar cambios',
        '¿Estás seguro de que deseas salir? Los cambios no guardados se perderán.',
        () => {
          setEditMode(false)
          navigate('/maintenance')
        }
      )
    } else {
      navigate('/maintenance')
    }
  }

  // Loading state
  if (ticketLoading) {
    return (
      <Container maxWidth={false} sx={{ py: 3 }}>
        <Skeleton
          variant='rectangular'
          width='100%'
          height={60}
          sx={{ mb: 3 }}
        />
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton variant='rectangular' width='100%' height={400} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant='rectangular' width='100%' height={300} />
          </Grid>
        </Grid>
      </Container>
    )
  }

  // Error state
  if (ticketError || !ticket) {
    return (
      <Container maxWidth={false} sx={{ py: 3 }}>
        <Alert severity='error' sx={{ mb: 3 }}>
          {ticketError?.message ||
            'Error al cargar el ticket. El ticket no existe o no tienes permisos para verlo.'}
        </Alert>
        <Button
          variant='outlined'
          startIcon={<ArrowBack />}
          onClick={handleBack}
        >
          Volver al Dashboard
        </Button>
      </Container>
    )
  }

  return (
    <MaintenanceErrorBoundary>
      <Container maxWidth={false} sx={{ py: 3 }}>
        {/* Header with breadcrumbs */}
        <Box mb={3}>
          <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 2 }}>
            <Link
              color='inherit'
              href='/maintenance'
              underline='hover'
              sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              onClick={(e) => {
                e.preventDefault()
                handleBack()
              }}
            >
              Dashboard de Mantenimiento
            </Link>
            <Typography color='text.primary'>
              Ticket #{ticket.ticketCode}
            </Typography>
          </Breadcrumbs>

          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='center'
          >
            <Box display='flex' alignItems='center' gap={2}>
              <IconButton onClick={handleBack} color='primary'>
                <ArrowBack />
              </IconButton>
              <Box>
                <Typography variant='h4' component='h1'>
                  Ticket #{ticket.ticketCode}
                </Typography>
                <Typography variant='subtitle1' color='text.secondary'>
                  {ticket.customerName} - {ticket.equipmentType}
                </Typography>
              </Box>
            </Box>

            <Box display='flex' gap={1} alignItems='center'>
              {/* Real-time updates indicator */}
              <Box display='flex' alignItems='center' gap={1} mr={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={realTimeUpdatesEnabled}
                      onChange={(e) =>
                        setRealTimeUpdatesEnabled(e.target.checked)
                      }
                      size='small'
                    />
                  }
                  label='Tiempo Real'
                  sx={{ m: 0 }}
                />
                {lastUpdate && (
                  <Tooltip
                    title={`Última actualización: ${formatDate(lastUpdate.toISOString())}`}
                  >
                    <Badge color='primary' variant='dot'>
                      <NotificationsActive fontSize='small' color='action' />
                    </Badge>
                  </Tooltip>
                )}
              </Box>

              <Tooltip title='Actualizar datos'>
                <IconButton onClick={handleRefresh} color='primary'>
                  <Refresh />
                </IconButton>
              </Tooltip>

              {/* PDF Generation Menu */}
              <Button
                variant='outlined'
                startIcon={
                  isGeneratingPdf ? (
                    <CircularProgress size={16} />
                  ) : (
                    <PictureAsPdf />
                  )
                }
                onClick={handlePdfMenuOpen}
                disabled={isGeneratingPdf}
                size='small'
                endIcon={<ExpandMore />}
              >
                Documentos
              </Button>

              <Menu
                anchorEl={pdfMenuAnchor}
                open={Boolean(pdfMenuAnchor)}
                onClose={handlePdfMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right'
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right'
                }}
              >
                <MenuList dense>
                  <ListItemButton onClick={handleGenerateServiceOrder}>
                    <ListItemIcon>
                      <Print fontSize='small' />
                    </ListItemIcon>
                    <ListItemText
                      primary='Orden de Servicio'
                      secondary='Documento de trabajo'
                    />
                  </ListItemButton>

                  <ListItemButton onClick={handleGenerateStatusReport}>
                    <ListItemIcon>
                      <Assessment fontSize='small' />
                    </ListItemIcon>
                    <ListItemText
                      primary='Reporte de Estado'
                      secondary='Estado actual del ticket'
                    />
                  </ListItemButton>

                  <ListItemButton
                    onClick={handleGenerateServiceCertificate}
                    disabled={ticket.status !== MaintenanceStatus.COMPLETED}
                  >
                    <ListItemIcon>
                      <AssignmentTurnedIn fontSize='small' />
                    </ListItemIcon>
                    <ListItemText
                      primary='Certificado de Servicio'
                      secondary={
                        ticket?.status !== MaintenanceStatus.COMPLETED
                          ? 'Solo para tickets completados'
                          : 'Certificado oficial'
                      }
                    />
                  </ListItemButton>

                  <ListItemButton
                    onClick={handleGenerateInvoice}
                    disabled={!ticket.actualCost && !ticket.estimatedCost}
                  >
                    <ListItemIcon>
                      <Receipt fontSize='small' />
                    </ListItemIcon>
                    <ListItemText
                      primary='Factura'
                      secondary={
                        !ticket?.actualCost && !ticket?.estimatedCost
                          ? 'Requiere costo especificado'
                          : 'Documento de facturación'
                      }
                    />
                  </ListItemButton>
                </MenuList>
              </Menu>

              {editMode ? (
                <>
                  <Button
                    variant='outlined'
                    startIcon={<Cancel />}
                    onClick={handleCancelEdit}
                    disabled={updateTicketMutation.isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant='contained'
                    startIcon={
                      updateTicketMutation.isLoading ? (
                        <CircularProgress size={16} />
                      ) : (
                        <Save />
                      )
                    }
                    onClick={handleSaveEdit}
                    disabled={updateTicketMutation.isLoading || !isEditValid}
                    color='primary'
                  >
                    {updateTicketMutation.isLoading
                      ? 'Guardando...'
                      : 'Guardar'}
                  </Button>
                </>
              ) : (
                <Button
                  variant='contained'
                  startIcon={<Edit />}
                  onClick={handleEdit}
                  color='primary'
                >
                  Editar
                </Button>
              )}
            </Box>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Main Content */}
          <Grid item xs={12} lg={8}>
            {/* Ticket Status and Priority */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
                mb={2}
              >
                <Typography variant='h6'>Estado del Ticket</Typography>
                <Box display='flex' gap={1}>
                  <MaintenanceStatusBadge status={ticket.status} />
                  <MaintenancePriorityBadge priority={ticket.priority} />
                </Box>
              </Box>

              {editMode ? (
                <Grid container spacing={2}>
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
                        {Object.values(MaintenanceStatus).map((status) => (
                          <MenuItem key={status} value={status}>
                            <MaintenanceStatusBadge
                              status={status}
                              size='small'
                            />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

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
                </Grid>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Creado
                    </Typography>
                    <Typography variant='body1'>
                      {formatDate(ticket.createdAt)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Última actualización
                    </Typography>
                    <Typography variant='body1'>
                      {formatDate(ticket.updatedAt)}
                    </Typography>
                  </Grid>

                  {ticket.completedDate && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Completado
                      </Typography>
                      <Typography variant='body1'>
                        {formatDate(ticket.completedDate)}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              )}
            </Paper>

            {/* Customer Information */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
                mb={2}
              >
                <Typography variant='h6'>Información del Cliente</Typography>
                <Box display='flex' gap={1}>
                  <Tooltip title='Enviar email al cliente'>
                    <IconButton
                      size='small'
                      onClick={() =>
                        window.open(`mailto:${ticket.customerEmail}`, '_blank')
                      }
                      color='primary'
                    >
                      <Email />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='Llamar al cliente'>
                    <IconButton
                      size='small'
                      onClick={() =>
                        window.open(`tel:${ticket.customerPhone}`, '_blank')
                      }
                      color='primary'
                    >
                      <Phone />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box display='flex' alignItems='center' gap={1} mb={1}>
                    <Person color='action' />
                    <Typography variant='body2' color='text.secondary'>
                      Nombre
                    </Typography>
                  </Box>
                  <Typography variant='body1' fontWeight='medium'>
                    {ticket.customerName}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box display='flex' alignItems='center' gap={1} mb={1}>
                    <Email color='action' />
                    <Typography variant='body2' color='text.secondary'>
                      Email
                    </Typography>
                  </Box>
                  <Typography variant='body1' sx={{ wordBreak: 'break-word' }}>
                    {ticket.customerEmail}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box display='flex' alignItems='center' gap={1} mb={1}>
                    <Phone color='action' />
                    <Typography variant='body2' color='text.secondary'>
                      Teléfono
                    </Typography>
                  </Box>
                  <Typography variant='body1'>
                    {ticket.customerPhone}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box display='flex' alignItems='center' gap={1} mb={1}>
                    <LocationOn color='action' />
                    <Typography variant='body2' color='text.secondary'>
                      Ubicación
                    </Typography>
                  </Box>
                  {editMode ? (
                    <TextField
                      fullWidth
                      value={editData.location || ''}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          location: e.target.value
                        }))
                      }
                      size='small'
                      multiline
                      rows={2}
                      placeholder='Ingrese la ubicación del servicio'
                      error={!!editErrors.location}
                      helperText={editErrors.location}
                    />
                  ) : (
                    <Typography variant='body1' sx={{ whiteSpace: 'pre-wrap' }}>
                      {ticket.location}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Paper>

            {/* Equipment Information */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Box display='flex' alignItems='center' gap={1} mb={2}>
                <Build color='action' />
                <Typography variant='h6'>Información del Equipo</Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box mb={2}>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      gutterBottom
                    >
                      Tipo de Equipo
                    </Typography>
                    <Chip
                      label={ticket.equipmentType}
                      color='primary'
                      variant='outlined'
                      sx={{ fontWeight: 'medium' }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box mb={2}>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      gutterBottom
                    >
                      Marca
                    </Typography>
                    <Typography variant='body1' fontWeight='medium'>
                      {ticket.equipmentBrand}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box mb={2}>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      gutterBottom
                    >
                      Modelo
                    </Typography>
                    <Typography variant='body1'>
                      {ticket.equipmentModel}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box mb={2}>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      gutterBottom
                    >
                      Número de Serie
                    </Typography>
                    <Typography variant='body1' fontWeight='medium'>
                      {ticket.equipmentSerial}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Issue Description */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Box display='flex' alignItems='center' gap={1} mb={2}>
                <Description color='action' />
                <Typography variant='h6'>Descripción del Problema</Typography>
              </Box>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.200'
                }}
              >
                <Typography
                  variant='body1'
                  sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
                >
                  {ticket.issueDescription}
                </Typography>
              </Box>
            </Paper>

            {/* Timeline Section */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
                mb={2}
              >
                <Typography variant='h6'>Historial del Ticket</Typography>
                <IconButton
                  onClick={() => setShowTimeline(!showTimeline)}
                  color='primary'
                >
                  {showTimeline ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>

              <Collapse in={showTimeline}>
                {console.log('Rendering timeline with events:', ticket)}
                <MaintenanceTimeline timeline={ticket.timeline || []} />
              </Collapse>
            </Paper>

            {/* Comments Section */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
                mb={2}
              >
                <Typography variant='h6'>Comentarios</Typography>
                <IconButton
                  onClick={() => setShowComments(!showComments)}
                  color='primary'
                >
                  {showComments ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>

              <Collapse in={showComments}>
                <MaintenanceCommentsList
                  comments={ticket.comments || []}
                  onAddComment={handleAddComment}
                  currentUserRole={currentUserRole}
                  loading={addCommentMutation.isLoading}
                />
              </Collapse>
            </Paper>

            {/* Files Section */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
                mb={2}
              >
                <Typography variant='h6'>Archivos Adjuntos</Typography>
                <IconButton
                  onClick={() => setShowFiles(!showFiles)}
                  color='primary'
                >
                  {showFiles ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>

              <Collapse in={showFiles}>
                <MaintenanceFileUpload
                  files={ticket.files || []}
                  onFilesChange={handleFileUpload}
                  onFileRemove={handleFileDelete}
                  onFileView={handleFileView}
                  uploading={uploadFilesMutation.isLoading}
                  disabled={deleteFileMutation.isLoading}
                />
              </Collapse>
            </Paper>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={4}>
            {/* Assigned Technician */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Box display='flex' alignItems='center' gap={1} mb={2}>
                <Assignment color='action' />
                <Typography variant='h6'>Técnico Asignado</Typography>
              </Box>

              {editMode ? (
                <FormControl fullWidth>
                  <InputLabel>Técnico</InputLabel>
                  <Select
                    value={editData.assignedTechnician || ''}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        assignedTechnician: e.target.value
                      }))
                    }
                    label='Técnico'
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
                          <Box>
                            <Typography variant='body2'>
                              {technician.name}
                            </Typography>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              {technician.specialties?.slice(0, 2).join(', ')}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : ticket.assignedTechnician ? (
                <Box>
                  <Box display='flex' alignItems='center' gap={2} mb={2}>
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: 'primary.main'
                      }}
                    >
                      {ticket.assignedTechnician.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant='body1' fontWeight='bold'>
                        {ticket.assignedTechnician.name}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {ticket.assignedTechnician.email}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {ticket.assignedTechnician.phone}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Rating
                      </Typography>
                      <Box display='flex' alignItems='center' gap={0.5}>
                        <Star color='warning' fontSize='small' />
                        <Typography variant='body2' fontWeight='medium'>
                          {ticket.assignedTechnician.rating.toFixed(1)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Tickets
                      </Typography>
                      <Typography variant='body2' fontWeight='medium'>
                        {ticket.assignedTechnician.completedTickets}/
                        {ticket.assignedTechnician.totalTickets}
                      </Typography>
                    </Grid>
                  </Grid>

                  {ticket.assignedTechnician.specialties &&
                    ticket.assignedTechnician.specialties.length > 0 && (
                      <Box mt={2}>
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          gutterBottom
                        >
                          Especialidades
                        </Typography>
                        <Box display='flex' flexWrap='wrap' gap={0.5}>
                          {ticket.assignedTechnician.specialties
                            .slice(0, 3)
                            .map((specialty) => (
                              <Chip
                                key={specialty}
                                label={specialty}
                                size='small'
                                variant='outlined'
                                color='primary'
                              />
                            ))}
                        </Box>
                      </Box>
                    )}
                </Box>
              ) : (
                <Alert severity='info' icon={<Person />}>
                  <AlertTitle>Sin asignar</AlertTitle>
                  No hay técnico asignado a este ticket
                </Alert>
              )}
            </Paper>

            {/* Schedule */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Box display='flex' alignItems='center' gap={1} mb={2}>
                <Schedule color='action' />
                <Typography variant='h6'>Programación</Typography>
              </Box>

              {editMode ? (
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
                  helperText={
                    editErrors.scheduledDate ||
                    'Seleccione fecha y hora del servicio'
                  }
                  error={!!editErrors.scheduledDate}
                />
              ) : (
                <Box>
                  <Box display='flex' alignItems='center' gap={1} mb={1}>
                    <CalendarToday color='action' fontSize='small' />
                    <Typography variant='body2' color='text.secondary'>
                      Fecha Programada
                    </Typography>
                  </Box>
                  <Typography variant='body1' fontWeight='medium'>
                    {formatDate(ticket.scheduledDate)}
                  </Typography>

                  {ticket.scheduledDate && (
                    <Box mt={2}>
                      <Typography variant='body2' color='text.secondary'>
                        Estado del Cronograma
                      </Typography>
                      <Chip
                        size='small'
                        label={
                          new Date(ticket.scheduledDate) < new Date()
                            ? ticket.status === MaintenanceStatus.COMPLETED
                              ? 'Completado a tiempo'
                              : 'Retrasado'
                            : 'En cronograma'
                        }
                        color={
                          new Date(ticket.scheduledDate) < new Date()
                            ? ticket.status === MaintenanceStatus.COMPLETED
                              ? 'success'
                              : 'error'
                            : 'primary'
                        }
                        variant='outlined'
                      />
                    </Box>
                  )}
                </Box>
              )}
            </Paper>

            {/* Costs */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Box display='flex' alignItems='center' gap={1} mb={2}>
                <AttachMoney color='action' />
                <Typography variant='h6'>Costos</Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box mb={2}>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      gutterBottom
                    >
                      Costo Estimado
                    </Typography>
                    {editMode ? (
                      <TextField
                        fullWidth
                        type='number'
                        value={editData.estimatedCost || ''}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            estimatedCost: e.target.value
                              ? Number(e.target.value)
                              : undefined
                          }))
                        }
                        size='small'
                        InputProps={{
                          startAdornment: '$'
                        }}
                        helperText={
                          editErrors.estimatedCost ||
                          'Costo estimado del servicio'
                        }
                        error={!!editErrors.estimatedCost}
                      />
                    ) : (
                      <Typography variant='h6' color='warning.main'>
                        {formatCurrency(ticket.estimatedCost)}
                      </Typography>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box mb={2}>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      gutterBottom
                    >
                      Costo Real
                    </Typography>
                    {editMode ? (
                      <TextField
                        fullWidth
                        type='number'
                        value={editData.actualCost || ''}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            actualCost: e.target.value
                              ? Number(e.target.value)
                              : undefined
                          }))
                        }
                        size='small'
                        InputProps={{
                          startAdornment: '$'
                        }}
                        helperText={
                          editErrors.actualCost || 'Costo final del servicio'
                        }
                        error={!!editErrors.actualCost}
                      />
                    ) : (
                      <Typography variant='h6' color='success.main'>
                        {formatCurrency(ticket.actualCost)}
                      </Typography>
                    )}
                  </Box>
                </Grid>

                {ticket.estimatedCost && ticket.actualCost && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Box>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        gutterBottom
                      >
                        Variación
                      </Typography>
                      <Typography
                        variant='body1'
                        fontWeight='medium'
                        color={
                          ticket.actualCost <= ticket.estimatedCost
                            ? 'success.main'
                            : 'error.main'
                        }
                      >
                        {ticket.actualCost <= ticket.estimatedCost ? '-' : '+'}
                        {formatCurrency(
                          Math.abs(ticket.actualCost - ticket.estimatedCost)
                        )}{' '}
                        (
                        {(
                          ((ticket.actualCost - ticket.estimatedCost) /
                            ticket.estimatedCost) *
                          100
                        ).toFixed(1)}
                        %)
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* Customer Satisfaction */}
            {ticket.customerSatisfaction && (
              <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Box display='flex' alignItems='center' gap={1} mb={2}>
                  <Star color='warning' />
                  <Typography variant='h6'>Satisfacción del Cliente</Typography>
                </Box>

                <Box textAlign='center' py={2}>
                  <Typography
                    variant='h4'
                    color='warning.main'
                    fontWeight='bold'
                  >
                    {ticket.customerSatisfaction.toFixed(1)}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    de 5 estrellas
                  </Typography>

                  <Box display='flex' justifyContent='center' mt={1}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        color={
                          star <= ticket.customerSatisfaction!
                            ? 'warning'
                            : 'disabled'
                        }
                        fontSize='small'
                      />
                    ))}
                  </Box>

                  <Box mt={2}>
                    <Chip
                      label={
                        ticket.customerSatisfaction >= 4.5
                          ? 'Excelente'
                          : ticket.customerSatisfaction >= 3.5
                            ? 'Bueno'
                            : ticket.customerSatisfaction >= 2.5
                              ? 'Regular'
                              : 'Necesita mejorar'
                      }
                      color={
                        ticket.customerSatisfaction >= 4.5
                          ? 'success'
                          : ticket.customerSatisfaction >= 3.5
                            ? 'primary'
                            : ticket.customerSatisfaction >= 2.5
                              ? 'warning'
                              : 'error'
                      }
                      variant='filled'
                    />
                  </Box>
                </Box>
              </Paper>
            )}

            {/* Quick Actions */}
            <Paper elevation={2} sx={{ p: 3 }}>
              <Box display='flex' alignItems='center' gap={1} mb={2}>
                <TrendingUp color='action' />
                <Typography variant='h6'>Acciones Rápidas</Typography>
              </Box>

              <Stack spacing={1}>
                <Button
                  fullWidth
                  variant='outlined'
                  startIcon={<Print />}
                  onClick={handleGenerateServiceOrder}
                  size='small'
                  disabled={isGeneratingPdf}
                >
                  Orden de Servicio
                </Button>

                <Button
                  fullWidth
                  variant='outlined'
                  startIcon={<Assessment />}
                  onClick={handleGenerateStatusReport}
                  size='small'
                  disabled={isGeneratingPdf}
                >
                  Reporte de Estado
                </Button>

                <Button
                  fullWidth
                  variant='outlined'
                  startIcon={<AssignmentTurnedIn />}
                  onClick={handleGenerateServiceCertificate}
                  size='small'
                  disabled={
                    isGeneratingPdf ||
                    ticket.status !== MaintenanceStatus.COMPLETED
                  }
                >
                  Certificado
                </Button>

                <Button
                  fullWidth
                  variant='outlined'
                  startIcon={<Receipt />}
                  onClick={handleGenerateInvoice}
                  size='small'
                  disabled={
                    isGeneratingPdf ||
                    (!ticket.actualCost && !ticket.estimatedCost)
                  }
                >
                  Factura
                </Button>

                <Divider sx={{ my: 1 }} />

                <Button
                  fullWidth
                  variant='outlined'
                  startIcon={<Share />}
                  onClick={() => {
                    const url = window.location.href
                    navigator.clipboard.writeText(url)
                    showToast('Enlace copiado al portapapeles', 'success')
                  }}
                  size='small'
                >
                  Compartir Ticket
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Loading progress bar */}
        {(ticketLoading ||
          updateTicketMutation.isLoading ||
          uploadFilesMutation.isLoading ||
          deleteFileMutation.isLoading ||
          addCommentMutation.isLoading) && (
          <Box
            sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}
          >
            <LinearProgress color='primary' />
          </Box>
        )}

        {/* Confirmation Dialog */}
        <Dialog
          open={confirmDialog.open}
          onClose={closeConfirmDialog}
          maxWidth='sm'
          fullWidth
        >
          <DialogTitle>
            <Box display='flex' alignItems='center' gap={1}>
              {confirmDialog.severity === 'error' && <Error color='error' />}
              {confirmDialog.severity === 'warning' && (
                <Warning color='warning' />
              )}
              {confirmDialog.severity === 'info' && <Info color='info' />}
              {confirmDialog.title}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography>{confirmDialog.message}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeConfirmDialog} color='inherit'>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                confirmDialog.onConfirm()
                closeConfirmDialog()
              }}
              color={confirmDialog.severity === 'error' ? 'error' : 'primary'}
              variant='contained'
              autoFocus
            >
              Confirmar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Toast Notifications */}
        <Snackbar
          open={toast.open}
          autoHideDuration={6000}
          onClose={closeToast}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={closeToast}
            severity={toast.severity}
            variant='filled'
            sx={{ width: '100%' }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      </Container>
    </MaintenanceErrorBoundary>
  )
}

export default MaintenanceTicketDetails
