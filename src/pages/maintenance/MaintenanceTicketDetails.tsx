import React, { useState, useEffect, useMemo, useRef } from 'react'
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
  InputAdornment,
  FormHelperText,
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
  LinearProgress,
  useMediaQuery,
  useTheme
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
  // AssignmentTurnedIn,
  Share,
  NotificationsActive,
  TrendingUp,
  Download,
  Draw,
  Science,
  // Assessment,
  Lock,
  CheckCircle
} from '@mui/icons-material'
import {
  useMaintenanceTicket,
  useUpdateMaintenanceTicket,
  useAddMaintenanceComment,
  useUpdateMaintenanceComment,
  useDeleteMaintenanceComment,
  useUploadMaintenanceFiles,
  useDeleteMaintenanceFile,
  useUpdateMaintenanceTechnician,
  useMaintenanceTechnicians,
  useTechnicianByEmail,
  useMaintenanceTimeline,
  useGenerateServiceOrder,
  useGenerateTechnicalReport,
  useMaintenanceTechnicalReport,
  useUpsertMaintenanceTechnicalReport,
  useGenerateStatusReport,
  useGenerateServiceCertificate,
  useGenerateServiceInvoice
  // useGetPDFOptions
} from '../../hooks/useMaintenance'
import {
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceUpdateRequest,
  MaintenanceFile,
  MaintenanceTechnicalReportRequest
} from '../../types/maintenance'
import MaintenanceStatusBadge from '../../Components/Maintenance/MaintenanceStatusBadge'
import MaintenancePriorityBadge from '../../Components/Maintenance/MaintenancePriorityBadge'
import MaintenanceCommentsList from '../../Components/Maintenance/MaintenanceCommentsList'
import MaintenanceFileUpload from '../../Components/Maintenance/MaintenanceFileUpload'
import MaintenanceTimeline from '../../Components/Maintenance/MaintenanceTimeline'
import MaintenanceErrorBoundary from '../../Components/Maintenance/MaintenanceErrorBoundary'
import CompletionCostsDialog from '../../Components/Maintenance/CompletionCostsDialog'
import MaintenanceSignaturesDialog from '../../Components/Maintenance/MaintenanceSignaturesDialog'
import MaintenanceTechnicalReportDialog from '../../Components/Maintenance/MaintenanceTechnicalReportDialog'
import { maintenanceSignaturesEnabled } from '../../features/maintenanceFlags'
import type {
  CompletionPhotoInput,
  CompletionSignatureInput
} from '../../Components/Maintenance/CompletionCostsDialog'
import useMaintenanceWebSocket from '../../hooks/useMaintenanceWebSocket'
import useAxiosPrivate from '../../utils/use-axios-private'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import CostsListDialog from 'src/Components/Maintenance/CostsList'
import { useStore } from '@nanostores/react'
import { userStore } from '../../store/userStore'

export const formatCurrency = (amount: number | undefined) => {
  if (!amount) return 'No especificado'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP'
  }).format(amount)
}
/**
 * MaintenanceTicketDetails component provides a comprehensive ticket management interface
 * Features: ticket info display, editing, comments, file management, timeline, PDF generation
 */
const MaintenanceTicketDetails: React.FC = () => {
  const axiosPrivate = useAxiosPrivate() // Initialize axios interceptors for automatic token refresh
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const $userStore = useStore(userStore)
  const { ticketId } = useParams<{ ticketId: string }>()
  const navigate = useNavigate()

  // State management
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState<MaintenanceUpdateRequest>({})
  const [showTimeline, setShowTimeline] = useState(true)
  const [showComments, setShowComments] = useState(true)
  const [showFiles, setShowFiles] = useState(true)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewFile, setPreviewFile] = useState<MaintenanceFile | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [filePreviewCache, setFilePreviewCache] = useState<Record<string, string>>({})
  const filePreviewCacheRef = useRef<Record<string, string>>({})
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
  // const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [costsDialogOpen, setCostsDialogOpen] = useState(false)
  const [signaturesDialogOpen, setSignaturesDialogOpen] = useState(false)
  const [briefCostsDialogOpen, setBriefCostsDialogOpen] = useState(false)
  const [technicalReportDialogOpen, setTechnicalReportDialogOpen] = useState(false)
  const [realTimeUpdatesEnabled, setRealTimeUpdatesEnabled] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [isEditValid, setIsEditValid] = useState(true)
  const surfaceSx = {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)'
  }

  const canManageTechnicians =
    $userStore.rol.includes('admin') ||
    $userStore.rol.includes('maintenance_coordinator')
  const currentUserRole = $userStore.rol[0] || 'user'
  const isTechnician = $userStore.rol.includes('technician')

  // API hooks
  const {
    data: ticket,
    isLoading: ticketLoading,
    error: ticketError,
    refetch: refetchTicket
  } = useMaintenanceTicket(ticketId || '')
  const { data: currentTechnician } = useTechnicianByEmail(
    isTechnician ? $userStore.email || '' : ''
  )
  const canEditTicket =
    !isTechnician ||
    ticket?.assignedTechnician?.email === $userStore.email ||
    (ticket?.assignedTechnicianId !== undefined &&
      currentTechnician?.id !== undefined &&
      String(ticket.assignedTechnicianId) === String(currentTechnician.id))
  const hasCustomerSignature = Boolean(ticket?.customerSignatureData)
  const hasTechnicianSignature = Boolean(
    ticket?.technicianSignatureData || ticket?.assignedTechnician?.signatureData
  )
  const signaturesMissing =
    maintenanceSignaturesEnabled &&
    ticket?.status === MaintenanceStatus.COMPLETED &&
    (!hasCustomerSignature || !hasTechnicianSignature)

  const { data: technicians } = useMaintenanceTechnicians(canManageTechnicians)

  useEffect(() => {
    filePreviewCacheRef.current = filePreviewCache
  }, [filePreviewCache])

  useEffect(() => {
    return () => {
      Object.values(filePreviewCacheRef.current).forEach((url) => {
        window.URL.revokeObjectURL(url)
      })
    }
  }, [])
  const {
    data: timelineData,
    isLoading: timelineLoading,
    refetch: refetchTimeline
  } = useMaintenanceTimeline(ticketId || '')
  const {
    data: technicalReport,
    isLoading: technicalReportLoading,
    refetch: refetchTechnicalReport
  } = useMaintenanceTechnicalReport(ticketId || '')
  const updateTicketMutation = useUpdateMaintenanceTicket()
  const upsertTechnicalReportMutation = useUpsertMaintenanceTechnicalReport()
  const addCommentMutation = useAddMaintenanceComment()
  const updateCommentMutation = useUpdateMaintenanceComment()
  const deleteCommentMutation = useDeleteMaintenanceComment()
  const uploadFilesMutation = useUploadMaintenanceFiles()
  const deleteFileMutation = useDeleteMaintenanceFile()
  const updateTechnicianMutation = useUpdateMaintenanceTechnician()

  // PDF generation mutations
  const generateServiceOrderMutation = useGenerateServiceOrder()
  const generateTechnicalReportMutation = useGenerateTechnicalReport()
  const generateStatusReportMutation = useGenerateStatusReport()
  const generateServiceCertificateMutation = useGenerateServiceCertificate()
  const generateServiceInvoiceMutation = useGenerateServiceInvoice()
  // const { data: pdfOptions } = useGetPDFOptions(ticketId || '')

  // WebSocket for real-time updates
  useMaintenanceWebSocket({
    enabled: realTimeUpdatesEnabled,
    onTicketUpdate: (updatedTicket) => {
      if (updatedTicket.id === ticketId) {
        console.log('Ticket updated via WebSocket:', updatedTicket)
        setLastUpdate(new Date())
        refetchTicket()
        refetchTimeline()
        showToast('Ticket actualizado en tiempo real', 'info')
      }
    },
    onNotification: (notification) => {
      if (notification.ticketId === ticketId) {
        console.log('New notification for this ticket:', notification)
        setLastUpdate(new Date())
        refetchTicket()
        refetchTimeline()
        showToast('Nueva notificación recibida', 'info')
      }
    }
  })

  // Initialize edit data when ticket loads
  useEffect(() => {
    if (ticket && !editMode) {
      if (isTechnician) {
        setEditData({
          status: ticket.status,
          priority: ticket.priority,
          workPerformed: ticket.workPerformed || '',
          intakePhysicalCondition: ticket.intakePhysicalCondition || '',
          receivedAccessories: ticket.receivedAccessories || ''
        })
      } else {
        setEditData({
          status: ticket.status,
          assignedTechnician: ticket.assignedTechnicianId || '',
          scheduledDate: ticket.scheduledDate || '',
          priority: ticket.priority,
          estimatedCost: ticket.estimatedCost,
          actualCost: ticket.actualCost,
          location: ticket.location,
          intakePhysicalCondition: ticket.intakePhysicalCondition || '',
          receivedAccessories: ticket.receivedAccessories || ''
        })
      }
    }
  }, [ticket, editMode, isTechnician])

  // Validate edit data when it changes
  useEffect(() => {
    if (editMode) {
      validateEditData()
    }
  }, [editData, editMode])

  const statusChip = useMemo(() => {
    if (ticket?.isInvoiced) {
      return (
        <Chip
          label='Facturado'
          color='success'
          icon={<Receipt />}
          size='small'
        />
      )
    }
    return (
      <Chip
        label='No Facturado'
        color='warning'
        icon={<AttachMoney />}
        size='small'
      />
    )
  }, [ticket?.isInvoiced])

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

  // Helper functions
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'No programada'
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es })
    } catch {
      return 'Fecha inválida'
    }
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
    if (!canEditTicket) {
      showToast('Solo puedes editar tickets asignados a tu usuario', 'warning')
      return
    }
    setEditMode(true)
    setEditErrors({})
    setIsEditValid(true)
  }

  const handleCancelEdit = () => {
    setEditMode(false)
    if (ticket) {
      if (isTechnician) {
        setEditData({
          status: ticket.status,
          priority: ticket.priority,
          workPerformed: ticket.workPerformed || '',
          intakePhysicalCondition: ticket.intakePhysicalCondition || '',
          receivedAccessories: ticket.receivedAccessories || ''
        })
      } else {
        setEditData({
          status: ticket.status,
          assignedTechnician: ticket.assignedTechnicianId || '',
          scheduledDate: ticket.scheduledDate || '',
          priority: ticket.priority,
          estimatedCost: ticket.estimatedCost,
          actualCost: ticket.actualCost,
          location: ticket.location,
          intakePhysicalCondition: ticket.intakePhysicalCondition || '',
          receivedAccessories: ticket.receivedAccessories || ''
        })
      }
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

    if (
      editData.intakePhysicalCondition &&
      editData.intakePhysicalCondition.trim().length > 0 &&
      editData.intakePhysicalCondition.trim().length < 3
    ) {
      errors.intakePhysicalCondition =
        'Describe un poco mejor cómo se recibió el equipo'
    }

    if (
      editData.receivedAccessories &&
      editData.receivedAccessories.trim().length > 0 &&
      editData.receivedAccessories.trim().length < 3
    ) {
      errors.receivedAccessories =
        'Indica mejor los accesorios recibidos o deja el campo vacío'
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

    // Check if changing to COMPLETED status
    if (
      editData.status === MaintenanceStatus.COMPLETED &&
      ticket.status !== MaintenanceStatus.COMPLETED
    ) {
      // Open costs dialog instead of saving directly
      setCostsDialogOpen(true)
      return
    }

    try {
      const payload = isTechnician
        ? {
            status: editData.status,
            workPerformed: editData.workPerformed,
            intakePhysicalCondition: editData.intakePhysicalCondition,
            receivedAccessories: editData.receivedAccessories
          }
        : editData

      await updateTicketMutation.mutateAsync({
        id: ticket.id,
        data: payload
      })
      setEditMode(false)
      setEditErrors({})
      // Refetch ticket data to show updated information
      await refetchTicket()
      await refetchTimeline()
      showToast('Ticket actualizado exitosamente', 'success')
    } catch (error: any) {
      console.error('Error updating ticket:', error)
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Error al actualizar el ticket'
      showToast(errorMessage, 'error')
    }
  }

  const handleCompleteWithCosts = async (
    workPerformed: string,
    costs: any[],
    completionPhotos: CompletionPhotoInput[],
    technicianSignature: {
      technicianSignatureData?: string | null
      saveTechnicianSignature?: boolean
    }
  ) => {
    if (!ticket) return

    try {
      const targetTechnicianId =
        currentTechnician?.id || ticket.assignedTechnician?.id

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
            costs,
            technicianSignatureData:
              technicianSignature.technicianSignatureData ||
              ticket.technicianSignatureData ||
              currentTechnician?.signatureData ||
              ticket.assignedTechnician?.signatureData ||
              null
          }
        : {
            ...editData,
            status: MaintenanceStatus.COMPLETED,
            workPerformed,
            costs,
            technicianSignatureData:
              technicianSignature.technicianSignatureData ||
              ticket.technicianSignatureData ||
              ticket.assignedTechnician?.signatureData ||
              null
          }

      await updateTicketMutation.mutateAsync({
        id: ticket.id,
        data: completionPayload
      })
      if (completionPhotos.length > 0) {
        await Promise.all(
          completionPhotos.map((photo) =>
            uploadFilesMutation.mutateAsync({
              ticketId: ticket.id,
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
      setEditMode(false)
      setEditErrors({})
      await refetchTicket()
      await refetchTimeline()
      showToast(
        completionPhotos.length > 0
          ? 'Ticket completado y fotos adjuntadas exitosamente'
          : 'Ticket completado exitosamente',
        'success'
      )
    } catch (error: any) {
      console.error('Error completing ticket:', error)
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Error al completar el ticket'
      showToast(errorMessage, 'error')
      throw error
    }
  }

  const handleInvoice = async () => {
    console.log(ticket)
    if (!ticket) return

    try {
      await updateTicketMutation.mutateAsync({
        id: ticket.id,
        data: {
          isInvoiced: true
        }
      })
      setBriefCostsDialogOpen(false)
      await refetchTicket()
      await refetchTimeline()
      showToast('Ticket completado exitosamente', 'success')
    } catch (error: any) {
      console.error('Error completing ticket:', error)
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Error al completar el ticket'
      showToast(errorMessage, 'error')
      throw error
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
      await refetchTimeline()
      showToast('Comentario agregado exitosamente', 'success')
    } catch (error) {
      console.error('Error adding comment:', error)
      showToast('Error al agregar comentario', 'error')
      throw error
    }
  }

  const handleSavePendingSignatures = async (
    signatures: CompletionSignatureInput
  ) => {
    if (!ticket) return

    try {
      const targetTechnicianId =
        currentTechnician?.id || ticket.assignedTechnician?.id

      if (
        signatures.saveTechnicianSignature &&
        targetTechnicianId &&
        signatures.technicianSignatureData
      ) {
        await updateTechnicianMutation.mutateAsync({
          id: targetTechnicianId,
          data: {
            signatureData: signatures.technicianSignatureData
          }
        })
      }

      await updateTicketMutation.mutateAsync({
        id: ticket.id,
        data: {
          customerSignerName: signatures.customerSignerName,
          customerSignatureData: signatures.customerSignatureData,
          technicianSignatureData:
            signatures.technicianSignatureData ||
            ticket.technicianSignatureData ||
            currentTechnician?.signatureData ||
            ticket.assignedTechnician?.signatureData ||
            null
        }
      })

      setSignaturesDialogOpen(false)
      await refetchTicket()
      await refetchTimeline()
      showToast('Firmas registradas exitosamente', 'success')
    } catch (error: any) {
      console.error('Error saving signatures:', error)
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Error al guardar las firmas'
      showToast(errorMessage, 'error')
      throw error
    }
  }

  const handleUpdateComment = async (
    commentId: string,
    content: string,
    isInternal?: boolean
  ) => {
    try {
      await updateCommentMutation.mutateAsync({
        commentId,
        content,
        isInternal
      })
      await refetchTicket()
      await refetchTimeline()
      showToast('Comentario actualizado exitosamente', 'success')
    } catch (error) {
      console.error('Error updating comment:', error)
      showToast('Error al actualizar comentario', 'error')
      throw error
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteCommentMutation.mutateAsync(commentId)
      await refetchTicket()
      await refetchTimeline()
      showToast('Comentario eliminado', 'success')
    } catch (error) {
      console.error('Error deleting comment:', error)
      showToast('Error al eliminar comentario', 'error')
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
      await refetchTimeline()
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
          if (filePreviewCache[fileId]) {
            window.URL.revokeObjectURL(filePreviewCache[fileId])
            setFilePreviewCache((prev) => {
              const updated = { ...prev }
              delete updated[fileId]
              return updated
            })
          }
          // Refetch ticket data to update file list
          await refetchTicket()
          await refetchTimeline()
          showToast('Archivo eliminado exitosamente', 'success')
        } catch (error) {
          console.error('Error deleting file:', error)
          showToast('Error al eliminar archivo', 'error')
        }
      },
      'warning'
    )
  }

  const getFileDisplayName = (file: MaintenanceFile) =>
    file.originalName || file.fileName || 'archivo'

  const getFilePreviewType = (file: MaintenanceFile) => {
    const fileName = getFileDisplayName(file).toLowerCase()

    if (file.isImage || file.fileType === 'image') return 'image'
    if (file.isVideo || file.fileType === 'video') return 'video'
    if (file.fileType === 'document' && fileName.endsWith('.pdf')) return 'pdf'
    if (fileName.endsWith('.pdf')) return 'pdf'

    return 'other'
  }

  const getFilePreviewUrl = async (file: MaintenanceFile) => {
    if (filePreviewCache[file.id]) {
      return filePreviewCache[file.id]
    }

    const response = await axiosPrivate.get(`/maintenance/files/${file.id}/download`, {
      responseType: 'blob'
    })

    const url = window.URL.createObjectURL(response.data)
    setFilePreviewCache((prev) => ({ ...prev, [file.id]: url }))
    return url
  }

  const handleFileView = async (file: MaintenanceFile) => {
    setPreviewOpen(true)
    setPreviewFile(file)
    setPreviewLoading(true)
    setPreviewError(null)

    try {
      const url = await getFilePreviewUrl(file)
      setPreviewUrl(url)
    } catch (error) {
      console.error('Error loading file preview:', error)
      setPreviewError('No se pudo cargar la vista previa del archivo')
      showToast('Error al cargar la vista previa del archivo', 'error')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleClosePreview = () => {
    setPreviewOpen(false)
    setPreviewFile(null)
    setPreviewUrl(null)
    setPreviewLoading(false)
    setPreviewError(null)
  }

  const handleDownloadPreviewFile = async () => {
    if (!previewFile) return

    try {
      const url = await getFilePreviewUrl(previewFile)
      const link = document.createElement('a')
      link.href = url
      link.download = getFileDisplayName(previewFile)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading file:', error)
      showToast('Error al descargar el archivo', 'error')
    }
  }

  const handleGenerateServiceOrder = () => {
    if (!ticketId) return
    generateServiceOrderMutation.mutate(ticketId, {
      onSuccess: () => {
        showToast('Orden de servicio generada exitosamente', 'success')
        setPdfMenuAnchor(null)
      },
      onError: (error) => {
        console.error('Error generating service order:', error)
        showToast('Error al generar orden de servicio', 'error')
      }
    })
  }

  const handleGenerateTechnicalReport = () => {
    if (ticket?.status !== MaintenanceStatus.COMPLETED) {
      showToast(
        'El reporte técnico solo está disponible para tickets completados',
        'warning'
      )
      return
    }

    if (!ticketId) return
    generateTechnicalReportMutation.mutate(ticketId, {
      onSuccess: () => {
        showToast('Reporte técnico generado exitosamente', 'success')
        setPdfMenuAnchor(null)
      },
      onError: (error) => {
        console.error('Error generating technical report:', error)
        showToast('Error al generar reporte técnico', 'error')
      }
    })
  }

  const handleSaveTechnicalReport = async (
    reportData: MaintenanceTechnicalReportRequest
  ) => {
    if (!ticketId) return

    try {
      await upsertTechnicalReportMutation.mutateAsync({
        ticketId,
        data: reportData
      })
      await refetchTechnicalReport()
      await refetchTicket()
      showToast('Reporte técnico guardado exitosamente', 'success')
    } catch (error: any) {
      console.error('Error saving technical report:', error)
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Error al guardar el reporte técnico'
      showToast(errorMessage, 'error')
      throw error
    }
  }

  // const handleGenerateStatusReport = () => {
  //   if (!ticketId) return
  //   generateStatusReportMutation.mutate(ticketId, {
  //     onSuccess: () => {
  //       showToast('Reporte de estado generado exitosamente', 'success')
  //       setPdfMenuAnchor(null)
  //     },
  //     onError: (error) => {
  //       console.error('Error generating status report:', error)
  //       showToast('Error al generar reporte de estado', 'error')
  //     }
  //   })
  // }

  // const handleGenerateServiceCertificate = () => {
  //   if (ticket?.status !== MaintenanceStatus.COMPLETED) {
  //     showToast(
  //       'El certificado solo se puede generar para tickets completados',
  //       'warning'
  //     )
  //     return
  //   }

  //   if (!ticketId) return
  //   generateServiceCertificateMutation.mutate(ticketId, {
  //     onSuccess: () => {
  //       showToast('Certificado de servicio generado exitosamente', 'success')
  //       setPdfMenuAnchor(null)
  //     },
  //     onError: (error) => {
  //       console.error('Error generating service certificate:', error)
  //       showToast('Error al generar certificado de servicio', 'error')
  //     }
  //   })
  // }

  // const handleGenerateInvoice = () => {
  //   if (!ticket?.actualCost && !ticket?.estimatedCost) {
  //     showToast(
  //       'Debe haber un costo especificado para generar factura',
  //       'warning'
  //     )
  //     return
  //   }

  //   if (!ticketId) return
  //   generateServiceInvoiceMutation.mutate(ticketId, {
  //     onSuccess: () => {
  //       showToast('Factura generada exitosamente', 'success')
  //       setPdfMenuAnchor(null)
  //     },
  //     onError: (error) => {
  //       console.error('Error generating invoice:', error)
  //       showToast('Error al generar factura', 'error')
  //     }
  //   })
  // }

  const handlePdfMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setPdfMenuAnchor(event.currentTarget)
  }

  const handlePdfMenuClose = () => {
    setPdfMenuAnchor(null)
  }

  const handleRefresh = () => {
    refetchTicket()
    refetchTimeline()
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
      <Container
        maxWidth={false}
        sx={{
          py: { xs: 2, sm: 3 },
          px: { xs: 1, sm: 2, md: 3 },
          backgroundColor: '#f8fafc',
          minHeight: '100vh'
        }}
      >
        <Skeleton
          variant='rectangular'
          width='100%'
          height={60}
          sx={{
            mb: { xs: 2, sm: 3 },
            borderRadius: '14px',
            backgroundColor: '#ffffff'
          }}
        />
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          <Grid item xs={12} md={8}>
            <Skeleton
              variant='rectangular'
              width='100%'
              height={400}
              sx={{
                borderRadius: '14px',
                backgroundColor: '#ffffff'
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton
              variant='rectangular'
              width='100%'
              height={300}
              sx={{
                borderRadius: '14px',
                backgroundColor: '#ffffff'
              }}
            />
          </Grid>
        </Grid>
      </Container>
    )
  }

  // Error state
  if (ticketError || !ticket) {
    return (
      <Container
        maxWidth={false}
        sx={{
          py: { xs: 2, sm: 3 },
          px: { xs: 1, sm: 2, md: 3 },
          backgroundColor: '#f8fafc',
          minHeight: '100vh'
        }}
      >
        <Alert
          severity='error'
          sx={{
            mb: 3,
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid rgba(244, 67, 54, 0.2)'
          }}
        >
          {(ticketError as any)?.message ||
            'Error al cargar el ticket. El ticket no existe o no tienes permisos para verlo.'}
        </Alert>
        <Button
          variant='outlined'
          startIcon={<ArrowBack />}
          onClick={handleBack}
          sx={{
            minHeight: 48,
            borderColor: '#d1d5db',
            color: '#334155',
            borderRadius: '12px',
            '&:hover': {
              borderColor: '#94a3b8',
              backgroundColor: '#f8fafc'
            }
          }}
        >
          Volver al Dashboard
        </Button>
      </Container>
    )
  }

  return (
    <MaintenanceErrorBoundary>
      <Container
        maxWidth={false}
        sx={{
          py: { xs: 2, sm: 3 },
          px: { xs: 1, sm: 2, md: 3 },
          backgroundColor: '#f8fafc',
          minHeight: '100vh'
        }}
      >
        {/* Header with breadcrumbs */}
        <Box
          mb={{ xs: 2, sm: 3 }}
        sx={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          p: { xs: 2, sm: 3 },
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
          border: '1px solid #e5e7eb'
        }}
        >
          <Breadcrumbs
            aria-label='breadcrumb'
            sx={{
              mb: 2,
              display: { xs: 'none', sm: 'flex' },
              '& .MuiBreadcrumbs-separator': {
                color: '#94a3b8'
              }
            }}
          >
            <Link
              color='inherit'
              href='/maintenance'
              underline='hover'
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                color: '#475569',
                '&:hover': {
                  color: '#0f172a'
                }
              }}
              onClick={(e) => {
                e.preventDefault()
                handleBack()
              }}
            >
              Dashboard de Mantenimiento
            </Link>
            <Typography
              sx={{
                color: '#0f172a',
                fontWeight: 600
              }}
            >
              Ticket #{ticket.ticketCode}
            </Typography>
          </Breadcrumbs>

          <Box
            display='flex'
            flexDirection={{ xs: 'column', sm: 'row' }}
            justifyContent='space-between'
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            gap={{ xs: 2, sm: 0 }}
          >
            <Box
              display='flex'
              alignItems='center'
              gap={{ xs: 1, sm: 2 }}
              width={{ xs: '100%', sm: 'auto' }}
            >
              <IconButton
                onClick={handleBack}
                aria-label='Volver al dashboard de mantenimiento'
                sx={{
                  minWidth: 48,
                  minHeight: 48,
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  '&:hover': {
                    backgroundColor: '#f8fafc'
                  }
                }}
              >
                <ArrowBack />
              </IconButton>
              <Box flex={1}>
                <Typography
                  variant='h4'
                  component='h1'
                  sx={{
                    fontSize: { xs: '1.5rem', sm: '1.875rem', md: '2.125rem' },
                    fontWeight: 700,
                    color: '#0f172a',
                    letterSpacing: '-0.02em'
                  }}
                >
                  Ticket #{ticket.ticketCode}
                </Typography>
                <Typography
                  variant='subtitle1'
                  color='text.secondary'
                  sx={{
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    fontWeight: 500
                  }}
                >
                  {ticket.customerName} - {ticket.equipmentType}
                </Typography>
              </Box>
            </Box>

            <Box
              display='flex'
              gap={{ xs: 0.5, sm: 1 }}
              alignItems='center'
              flexWrap='wrap'
              width={{ xs: '100%', sm: 'auto' }}
            >
              {/* Real-time updates indicator - hide on mobile */}
              <Box
                display={{ xs: 'none', md: 'flex' }}
                alignItems='center'
                gap={1}
                mr={2}
              >
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
                <IconButton
                  onClick={handleRefresh}
                  aria-label='Actualizar datos del ticket'
                  sx={{
                    minWidth: 48,
                    minHeight: 48,
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    '&:hover': {
                      backgroundColor: '#f8fafc',
                      color: '#0f172a'
                    }
                  }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>

              {/* PDF Generation Menu */}
              <Button
                variant='outlined'
                startIcon={
                  !isMobile &&
                  (generateServiceOrderMutation.isLoading ||
                  generateStatusReportMutation.isLoading ||
                  generateServiceCertificateMutation.isLoading ||
                  generateServiceInvoiceMutation.isLoading ? (
                    <CircularProgress size={16} />
                  ) : (
                    <PictureAsPdf />
                  ))
                }
                onClick={handlePdfMenuOpen}
                disabled={
                  generateServiceOrderMutation.isLoading ||
                  generateStatusReportMutation.isLoading ||
                  generateServiceCertificateMutation.isLoading ||
                  generateServiceInvoiceMutation.isLoading
                }
                size={isMobile ? 'small' : 'medium'}
                endIcon={<ExpandMore />}
                aria-label='Menú de generación de documentos PDF'
                aria-haspopup='menu'
                aria-expanded={Boolean(pdfMenuAnchor)}
                aria-controls='pdf-menu'
                sx={{
                  minHeight: 48,
                  fontSize: { xs: '0.813rem', sm: '0.875rem' },
                  borderColor: '#d1d5db',
                  color: '#334155',
                  borderRadius: '12px',
                  '&:hover': {
                    borderColor: '#94a3b8',
                    backgroundColor: '#f8fafc'
                  }
                }}
              >
                {isMobile ? <PictureAsPdf /> : 'Documentos'}
              </Button>

              <Menu
                id='pdf-menu'
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
                aria-labelledby='pdf-menu-button'
                sx={{
                  '& .MuiPaper-root': {
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
                    border: '1px solid #e5e7eb',
                    mt: 1
                  }
                }}
              >
                <MenuList dense role='menu'>
                  <ListItemButton
                    onClick={handleGenerateServiceOrder}
                    role='menuitem'
                    aria-label='Generar orden de servicio'
                    sx={{
                      borderRadius: '8px',
                      mx: 1,
                      mb: 0.5,
                      '&:hover': {
                        backgroundColor: '#f8fafc'
                      }
                    }}
                  >
                    <ListItemIcon>
                      <Print
                        fontSize='small'
                        aria-hidden='true'
                        sx={{ color: '#6dc662' }}
                      />
                    </ListItemIcon>
                  <ListItemText
                      primary='Orden de Servicio'
                      secondary='Documento de trabajo'
                    />
                  </ListItemButton>
                  {ticket.status === MaintenanceStatus.COMPLETED && (
                    <ListItemButton
                      onClick={handleGenerateTechnicalReport}
                      role='menuitem'
                      aria-label='Generar reporte técnico'
                      sx={{
                        borderRadius: '8px',
                        mx: 1,
                        mb: 0.5,
                        '&:hover': {
                          backgroundColor: '#f8fafc'
                        }
                      }}
                    >
                      <ListItemIcon>
                        <Science
                          fontSize='small'
                          aria-hidden='true'
                          sx={{ color: '#2563eb' }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary='Reporte Técnico'
                        secondary='Documento técnico de cierre'
                      />
                    </ListItemButton>
                  )}
                  {/* 
                  <ListItemButton
                    onClick={handleGenerateStatusReport}
                    role='menuitem'
                    aria-label='Generar reporte de estado'
                    sx={{
                      borderRadius: '8px',
                      mx: 1,
                      mb: 0.5,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        background: 'rgba(109, 198, 98, 0.1)',
                        transform: 'translateX(4px)'
                      }
                    }}
                  >
                    <ListItemIcon>
                      <Assessment fontSize='small' aria-hidden='true' sx={{ color: '#6dc662' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary='Reporte de Estado'
                      secondary='Estado actual del ticket'
                    />
                  </ListItemButton> */}
                  {/* 
                  <ListItemButton
                    onClick={handleGenerateServiceCertificate}
                    disabled={ticket.status !== MaintenanceStatus.COMPLETED}
                    role='menuitem'
                    aria-label='Generar certificado de servicio'
                    aria-disabled={ticket.status !== MaintenanceStatus.COMPLETED}
                    sx={{
                      borderRadius: '8px',
                      mx: 1,
                      mb: 0.5,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        background: ticket.status === MaintenanceStatus.COMPLETED
                          ? 'rgba(109, 198, 98, 0.1)'
                          : 'rgba(0, 0, 0, 0.04)',
                        transform: ticket.status === MaintenanceStatus.COMPLETED
                          ? 'translateX(4px)'
                          : 'none'
                      },
                      '&.Mui-disabled': {
                        opacity: 0.5
                      }
                    }}
                  >
                    <ListItemIcon>
                      <AssignmentTurnedIn
                        fontSize='small'
                        aria-hidden='true'
                        sx={{
                          color: ticket.status === MaintenanceStatus.COMPLETED
                            ? '#6dc662'
                            : 'text.disabled'
                        }}
                      />
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
                    role='menuitem'
                    aria-label='Generar factura'
                    aria-disabled={!ticket.actualCost && !ticket.estimatedCost}
                    sx={{
                      borderRadius: '8px',
                      mx: 1,
                      mb: 0.5,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        background: (ticket.actualCost || ticket.estimatedCost)
                          ? 'rgba(109, 198, 98, 0.1)'
                          : 'rgba(0, 0, 0, 0.04)',
                        transform: (ticket.actualCost || ticket.estimatedCost)
                          ? 'translateX(4px)'
                          : 'none'
                      },
                      '&.Mui-disabled': {
                        opacity: 0.5
                      }
                    }}
                  >
                    <ListItemIcon>
                      <Receipt
                        fontSize='small'
                        aria-hidden='true'
                        sx={{
                          color: (ticket.actualCost || ticket.estimatedCost)
                            ? '#6dc662'
                            : 'text.disabled'
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary='Factura'
                      secondary={
                        !ticket?.actualCost && !ticket?.estimatedCost
                          ? 'Requiere costo especificado'
                          : 'Documento de facturación'
                      }
                    />
                  </ListItemButton> */}
                </MenuList>
              </Menu>

              {editMode ? (
                <>
                  <Button
                    variant='outlined'
                    startIcon={!isMobile && <Cancel />}
                    onClick={handleCancelEdit}
                    disabled={updateTicketMutation.isLoading}
                    size={isMobile ? 'small' : 'medium'}
                    sx={{
                      minHeight: 48,
                      fontSize: { xs: '0.813rem', sm: '0.875rem' },
                      borderColor: '#ff5722',
                      color: '#ff5722',
                      borderRadius: '12px',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        borderColor: '#d84315',
                        background: 'rgba(255, 87, 34, 0.1)',
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    {isMobile ? <Cancel /> : 'Cancelar'}
                  </Button>
                  <Button
                    variant='contained'
                    startIcon={
                      !isMobile &&
                      (updateTicketMutation.isLoading ? (
                        <CircularProgress size={16} />
                      ) : (
                        <Save />
                      ))
                    }
                    onClick={handleSaveEdit}
                    disabled={updateTicketMutation.isLoading || !isEditValid}
                    size={isMobile ? 'small' : 'medium'}
                    sx={{
                      minHeight: 48,
                      fontSize: { xs: '0.813rem', sm: '0.875rem' },
                      background:
                        'linear-gradient(135deg, #6dc662 0%, #5ab052 100%)',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(109, 198, 98, 0.3)',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        background:
                          'linear-gradient(135deg, #5ab052 0%, #4a9642 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(109, 198, 98, 0.4)'
                      },
                      '&:disabled': {
                        background: 'rgba(0, 0, 0, 0.12)',
                        color: 'rgba(0, 0, 0, 0.26)'
                      }
                    }}
                  >
                    {isMobile ? (
                      <Save />
                    ) : updateTicketMutation.isLoading ? (
                      'Guardando...'
                    ) : (
                      'Guardar'
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  variant='contained'
                  startIcon={!isMobile && <Edit />}
                  onClick={handleEdit}
                  disabled={!canEditTicket}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    minHeight: 48,
                    fontSize: { xs: '0.813rem', sm: '0.875rem' },
                    background:
                      'linear-gradient(135deg, #6dc662 0%, #5ab052 100%)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(109, 198, 98, 0.3)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      background:
                        'linear-gradient(135deg, #5ab052 0%, #4a9642 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(109, 198, 98, 0.4)'
                    }
                  }}
                >
                  {isMobile ? <Edit /> : 'Editar'}
                </Button>
              )}
            </Box>
          </Box>
        </Box>

        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {/* Main Content */}
          <Grid item xs={12} lg={8}>
            {/* Ticket Status and Priority */}
            <Paper
              sx={{
                ...surfaceSx,
                p: { xs: 2, sm: 3 },
                mb: { xs: 2, sm: 3 },
              }}
            >
              <Box
                display='flex'
                flexDirection={{ xs: 'column', sm: 'row' }}
                justifyContent='space-between'
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                mb={2}
                gap={{ xs: 1, sm: 0 }}
              >
                <Typography
                  variant='h6'
                  sx={{
                    fontSize: { xs: '1.125rem', sm: '1.25rem' },
                    fontWeight: 600,
                    color: '#0f172a'
                  }}
                >
                  Estado del Ticket
                </Typography>
                <Box display='flex' gap={1} flexWrap='wrap'>
                  <MaintenanceStatusBadge status={ticket.status} />
                  <MaintenancePriorityBadge priority={ticket.priority} />
                </Box>
              </Box>

              {editMode ? (
                <Grid container spacing={{ xs: 1, sm: 2 }}>
                  <Grid item xs={12} sm={6}>
                    <FormControl
                      fullWidth
                      size={isMobile ? 'small' : 'medium'}
                      disabled={ticket.status === MaintenanceStatus.COMPLETED}
                    >
                      <InputLabel id='detail-status-label'>
                        Estado{' '}
                        {ticket.status === MaintenanceStatus.COMPLETED &&
                          '(Bloqueado)'}
                      </InputLabel>
                      <Select
                        labelId='detail-status-label'
                        id='detail-status-select'
                        value={editData.status || ''}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            status: e.target.value as MaintenanceStatus
                          }))
                        }
                        label={`Estado${ticket.status === MaintenanceStatus.COMPLETED ? ' (Bloqueado)' : ''}`}
                        startAdornment={
                          ticket.status === MaintenanceStatus.COMPLETED ? (
                            <InputAdornment position='start'>
                              <Lock sx={{ color: '#10b981' }} />
                            </InputAdornment>
                          ) : undefined
                        }
                        aria-label='Seleccionar estado del ticket'
                        sx={
                          ticket.status === MaintenanceStatus.COMPLETED
                            ? {
                                background: 'rgba(16, 185, 129, 0.05)',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#10b981'
                                }
                              }
                            : {}
                        }
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
                      {ticket.status === MaintenanceStatus.COMPLETED && (
                        <FormHelperText>
                          <Box display='flex' alignItems='center' gap={0.5}>
                            <Lock fontSize='small' />
                            Este ticket está completado y no puede cambiar de
                            estado
                          </Box>
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={isTechnician}>
                      <InputLabel id='detail-priority-label'>
                        Prioridad{isTechnician ? ' (Solo coordinador)' : ''}
                      </InputLabel>
                      <Select
                        labelId='detail-priority-label'
                        id='detail-priority-select'
                        value={editData.priority || ''}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            priority: e.target.value as MaintenancePriority
                          }))
                        }
                        label={`Prioridad${isTechnician ? ' (Solo coordinador)' : ''}`}
                        aria-label='Seleccionar prioridad del ticket'
                        startAdornment={
                          isTechnician ? (
                            <InputAdornment position='start'>
                              <Lock sx={{ color: '#10b981' }} />
                            </InputAdornment>
                          ) : undefined
                        }
                        sx={
                          isTechnician
                            ? {
                                background: 'rgba(16, 185, 129, 0.05)',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#10b981'
                                }
                              }
                            : {}
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
                      {isTechnician && (
                        <FormHelperText>
                          <Box display='flex' alignItems='center' gap={0.5}>
                            <Lock fontSize='small' />
                            La prioridad solo puede cambiarla un coordinador o
                            administrador
                          </Box>
                        </FormHelperText>
                      )}
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
            <Paper
              sx={{
                ...surfaceSx,
                p: 3,
                mb: 3,
              }}
            >
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
                mb={2}
              >
                <Typography
                  variant='h6'
                  sx={{
                    fontWeight: 600,
                    color: '#0f172a'
                  }}
                >
                  Información del Cliente
                </Typography>
                <Box display='flex' gap={1}>
                  <Tooltip title='Enviar email al cliente'>
                    <IconButton
                      size='small'
                      onClick={() =>
                        window.open(`mailto:${ticket.customerEmail}`, '_blank')
                      }
                      aria-label={`Enviar email a ${ticket.customerEmail}`}
                      sx={{
                        backgroundColor: '#eef6ee',
                        color: '#2f7d32',
                        borderRadius: '8px',
                        '&:hover': {
                          backgroundColor: '#dbeedb'
                        }
                      }}
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
                      aria-label={`Llamar al cliente ${ticket.customerPhone}`}
                      sx={{
                        backgroundColor: '#eef6ee',
                        color: '#2f7d32',
                        borderRadius: '8px',
                        '&:hover': {
                          backgroundColor: '#dbeedb'
                        }
                      }}
                    >
                      <Phone />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box display='flex' alignItems='center' gap={1} mb={1}>
                    <Person color='action' aria-hidden='true' />
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
                    <Email color='action' aria-hidden='true' />
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
                    <Phone color='action' aria-hidden='true' />
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
                    <LocationOn color='action' aria-hidden='true' />
                    <Typography variant='body2' color='text.secondary'>
                      Ubicación
                    </Typography>
                  </Box>
                  {editMode ? (
                    <TextField
                      fullWidth
                      id='edit-location-field'
                      label='Ubicación del servicio'
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
                      aria-label='Editar ubicación del servicio'
                      aria-invalid={!!editErrors.location}
                      aria-describedby={
                        editErrors.location ? 'location-error' : undefined
                      }
                    />
                  ) : (
                    <Typography variant='body1' sx={{ whiteSpace: 'pre-wrap' }}>
                      {ticket.location}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Paper>

            <Paper
              sx={{
                ...surfaceSx,
                p: 3,
                mb: 3,
              }}
              role='region'
              aria-label='Recepción del equipo'
            >
              <Box display='flex' alignItems='center' gap={1} mb={2}>
                <Box
                  sx={{
                    backgroundColor: '#fff7ed',
                    borderRadius: '8px',
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Assignment
                    sx={{ color: '#c2410c', fontSize: 20 }}
                    aria-hidden='true'
                  />
                </Box>
                <Typography
                  variant='h6'
                  sx={{
                    fontWeight: 600,
                    color: '#0f172a'
                  }}
                >
                  Recepción del Equipo
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Estado físico inicial
                  </Typography>
                  {editMode ? (
                    <TextField
                      fullWidth
                      label='Estado físico inicial'
                      value={editData.intakePhysicalCondition || ''}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          intakePhysicalCondition: e.target.value
                        }))
                      }
                      size='small'
                      multiline
                      minRows={4}
                      placeholder='Rayones, golpes, faltantes o condición general del equipo al recibirlo'
                      error={!!editErrors.intakePhysicalCondition}
                      helperText={
                        editErrors.intakePhysicalCondition ||
                        'Opcional, pero muy útil para la orden de servicio'
                      }
                    />
                  ) : (
                    <Typography variant='body1' sx={{ whiteSpace: 'pre-wrap' }}>
                      {ticket.intakePhysicalCondition ||
                        'Pendiente de registrar en recepción'}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Accesorios recibidos
                  </Typography>
                  {editMode ? (
                    <TextField
                      fullWidth
                      label='Accesorios recibidos'
                      value={editData.receivedAccessories || ''}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          receivedAccessories: e.target.value
                        }))
                      }
                      size='small'
                      multiline
                      minRows={4}
                      placeholder='Cables, sensores, adaptadores, batería, mangueras u otros accesorios'
                      error={!!editErrors.receivedAccessories}
                      helperText={
                        editErrors.receivedAccessories ||
                        'Opcional, pero recomendado para trazabilidad'
                      }
                    />
                  ) : (
                    <Typography variant='body1' sx={{ whiteSpace: 'pre-wrap' }}>
                      {ticket.receivedAccessories ||
                        'Pendiente de registrar en recepción'}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Paper>

            {/* Equipment Information */}
            <Paper
              sx={{
                ...surfaceSx,
                p: 3,
                mb: 3,
              }}
              role='region'
              aria-label='Información del equipo'
            >
              <Box display='flex' alignItems='center' gap={1} mb={2}>
                <Box
                  sx={{
                    backgroundColor: '#eef6ee',
                    borderRadius: '8px',
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Build
                    sx={{ color: '#2f7d32', fontSize: 20 }}
                    aria-hidden='true'
                  />
                </Box>
                <Typography
                  variant='h6'
                  sx={{
                    fontWeight: 600,
                    color: '#0f172a'
                  }}
                >
                  Información del Equipo
                </Typography>
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
                      sx={{
                        fontWeight: 'medium',
                        backgroundColor: '#eef6ee',
                        color: '#2f7d32',
                        borderRadius: '8px',
                        border: '1px solid #dbeedb'
                      }}
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
            <Paper
              sx={{
                ...surfaceSx,
                p: 3,
                mb: 3,
              }}
              role='region'
              aria-label='Descripción del problema'
            >
              <Box display='flex' alignItems='center' gap={1} mb={2}>
                <Box
                  sx={{
                    backgroundColor: '#eef6ee',
                    borderRadius: '8px',
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Description
                    sx={{ color: '#2f7d32', fontSize: 20 }}
                    aria-hidden='true'
                  />
                </Box>
                <Typography
                  variant='h6'
                  sx={{
                    fontWeight: 600,
                    color: '#0f172a'
                  }}
                >
                  Descripción del Problema
                </Typography>
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
            <Paper
              sx={{
                ...surfaceSx,
                p: 3,
                mb: 3,
              }}
              role='region'
              aria-label='Historial del ticket'
            >
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
                mb={2}
              >
                <Typography variant='h6' sx={{ color: '#0f172a', fontWeight: 600 }}>
                  Historial del Ticket
                </Typography>
                <IconButton
                  onClick={() => setShowTimeline(!showTimeline)}
                  sx={{ color: '#475569' }}
                  aria-label={
                    showTimeline ? 'Ocultar historial' : 'Mostrar historial'
                  }
                  aria-expanded={showTimeline}
                  aria-controls='timeline-section'
                >
                  {showTimeline ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>

              <Collapse in={showTimeline} id='timeline-section'>
                {timelineLoading ? (
                  <Box
                    display='flex'
                    justifyContent='center'
                    py={3}
                    role='status'
                    aria-live='polite'
                  >
                    <CircularProgress
                      size={24}
                      aria-label='Cargando historial'
                    />
                  </Box>
                ) : (
                  <MaintenanceTimeline timeline={timelineData || []} />
                )}
              </Collapse>
            </Paper>

            {/* Comments Section */}
            <Paper
              sx={{
                ...surfaceSx,
                p: 3,
                mb: 3,
              }}
              role='region'
              aria-label='Sección de comentarios'
            >
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
                mb={2}
              >
                <Typography variant='h6' sx={{ color: '#0f172a', fontWeight: 600 }}>
                  Comentarios
                </Typography>
                <IconButton
                  onClick={() => setShowComments(!showComments)}
                  sx={{ color: '#475569' }}
                  aria-label={
                    showComments ? 'Ocultar comentarios' : 'Mostrar comentarios'
                  }
                  aria-expanded={showComments}
                  aria-controls='comments-section'
                >
                  {showComments ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>

              <Collapse in={showComments} id='comments-section'>
                <MaintenanceCommentsList
                  comments={ticket.comments || []}
                  onAddComment={handleAddComment}
                  onUpdateComment={handleUpdateComment}
                  onDeleteComment={handleDeleteComment}
                  currentUserRole={currentUserRole}
                  currentUserEmail={$userStore.email}
                  loading={addCommentMutation.isLoading}
                />
              </Collapse>
            </Paper>

            {/* Files Section */}
            <Paper
              sx={{
                ...surfaceSx,
                p: 3,
                mb: 3,
              }}
              role='region'
              aria-label='Archivos adjuntos'
            >
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
                mb={2}
              >
                <Typography variant='h6' sx={{ color: '#0f172a', fontWeight: 600 }}>
                  Archivos Adjuntos
                </Typography>
                <IconButton
                  onClick={() => setShowFiles(!showFiles)}
                  sx={{ color: '#475569' }}
                  aria-label={
                    showFiles ? 'Ocultar archivos' : 'Mostrar archivos'
                  }
                  aria-expanded={showFiles}
                  aria-controls='files-section'
                >
                  {showFiles ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>

              <Collapse in={showFiles} id='files-section'>
                <MaintenanceFileUpload
                  files={ticket.files || []}
                  onFilesChange={handleFileUpload}
                  onFileRemove={handleFileDelete}
                  onFileView={handleFileView}
                  getFilePreviewUrl={getFilePreviewUrl}
                  uploading={uploadFilesMutation.isLoading}
                  disabled={deleteFileMutation.isLoading}
                />
              </Collapse>
            </Paper>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={4}>
            {/* Assigned Technician */}
            <Paper
              elevation={2}
              sx={{
                p: 3,
                mb: 3,
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
              <Box display='flex' alignItems='center' gap={1} mb={2}>
                <Box
                  sx={{
                    background:
                      'linear-gradient(135deg, #6dc662 0%, #5ab052 100%)',
                    borderRadius: '8px',
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Assignment sx={{ color: 'white', fontSize: 20 }} />
                </Box>
                <Typography
                  variant='h6'
                  sx={{
                    fontWeight: 600,
                    color: '#6dc662'
                  }}
                >
                  Técnico Asignado
                </Typography>
              </Box>

              {editMode ? (
                <>
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
                      disabled={ticket.status === MaintenanceStatus.COMPLETED}
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
                          <Alert severity='warning' sx={{ mt: 2 }}>
                            <AlertTitle>
                              Técnico casi en capacidad máxima
                            </AlertTitle>
                            <Typography variant='body2'>
                              <strong>{selectedTech.name}</strong> tiene{' '}
                              <strong>{selectedTech.workload}</strong> de{' '}
                              <strong>{selectedTech.maxWorkload}</strong>{' '}
                              tickets asignados ({utilizationPct.toFixed(0)}%
                              utilización). Considere asignar a un técnico con
                              menos carga de trabajo.
                            </Typography>
                          </Alert>
                        )
                      }

                      if (utilizationPct >= 100) {
                        return (
                          <Alert severity='error' sx={{ mt: 2 }}>
                            <AlertTitle>Técnico en capacidad máxima</AlertTitle>
                            <Typography variant='body2'>
                              <strong>{selectedTech.name}</strong> ha alcanzado
                              su capacidad máxima ({selectedTech.workload}/
                              {selectedTech.maxWorkload} tickets). Por favor
                              seleccione otro técnico disponible.
                            </Typography>
                          </Alert>
                        )
                      }

                      return null
                    })()}
                </>
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
                          {ticket.assignedTechnician.rating?.toFixed(1) ||
                            '0.0'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Carga Actual
                      </Typography>
                      <Typography variant='body2' fontWeight='medium'>
                        {ticket.assignedTechnician.workload || 0}/
                        {ticket.assignedTechnician.maxWorkload || 0}
                      </Typography>
                    </Grid>
                  </Grid>

                  {ticket.assignedTechnician.specialization && (
                    <Box mt={2}>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        gutterBottom
                      >
                        Especialidad
                      </Typography>
                      <Box display='flex' flexWrap='wrap' gap={0.5}>
                        <Chip
                          key={ticket.assignedTechnician.specialization}
                          label={ticket.assignedTechnician.specialization}
                          size='small'
                          variant='outlined'
                          color='primary'
                        />
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
            <Paper
              elevation={2}
              sx={{
                p: 3,
                mb: 3,
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
              <Box display='flex' alignItems='center' gap={1} mb={2}>
                <Box
                  sx={{
                    background:
                      'linear-gradient(135deg, #6dc662 0%, #5ab052 100%)',
                    borderRadius: '8px',
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Schedule sx={{ color: 'white', fontSize: 20 }} />
                </Box>
                <Typography
                  variant='h6'
                  sx={{
                    fontWeight: 600,
                    color: '#6dc662'
                  }}
                >
                  Programación
                </Typography>
              </Box>

              {editMode ? (
                <TextField
                  fullWidth
                  id='detail-scheduled-date'
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
                  aria-label='Seleccionar fecha y hora programada del servicio'
                  aria-invalid={!!editErrors.scheduledDate}
                  aria-describedby={
                    editErrors.scheduledDate
                      ? 'scheduled-date-error'
                      : 'scheduled-date-helper'
                  }
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
            {/* <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                mb: 3,
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
              <Box display='flex' alignItems='center' gap={1} mb={2}>
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, #6dc662 0%, #5ab052 100%)',
                    borderRadius: '8px',
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <AttachMoney sx={{ color: 'white', fontSize: 20 }} />
                </Box>
                <Typography 
                  variant='h6'
                  sx={{
                    fontWeight: 600,
                    color: '#6dc662'
                  }}
                >
                  Costos
                </Typography>
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
                        id='detail-estimated-cost'
                        label='Costo estimado'
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
                        aria-label='Ingresar costo estimado del servicio'
                        aria-invalid={!!editErrors.estimatedCost}
                        aria-describedby={editErrors.estimatedCost ? 'estimated-cost-error' : 'estimated-cost-helper'}
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
                        id='detail-actual-cost'
                        label='Costo real'
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
                        aria-label='Ingresar costo real del servicio'
                        aria-invalid={!!editErrors.actualCost}
                        aria-describedby={editErrors.actualCost ? 'actual-cost-error' : 'actual-cost-helper'}
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
            </Paper> */}

            {/* Service Costs */}
            {ticket.costs && ticket.costs.length > 0 && (
              <Paper
                sx={{
                  ...surfaceSx,
                  p: 3,
                  mb: 3,
                  '&:hover': {
                    borderColor: '#cbd5e1',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)'
                  },
                  cursor: 'pointer'
                }}
                onClick={() => setBriefCostsDialogOpen(true)}
              >
                {/* Contenedor Principal: Asegura la separación y alineación vertical central */}
                <Box
                  display='flex'
                  alignItems='center'
                  justifyContent='space-between'
                  gap={3}
                >
                  {/* 1. Avatar (Ícono) */}
                  <Avatar
                    sx={{
                      backgroundColor: '#dcfce7',
                      color: '#166534',
                      width: 48,
                      height: 48,
                      flexShrink: 0
                    }}
                  >
                    <AttachMoney fontSize='medium' />
                  </Avatar>

                  <Box flexGrow={1} minWidth={0}>
                    <Box display='flex' alignItems='center' mb={0.5}>
                      <Typography
                        variant='body1'
                        sx={{
                          fontWeight: 700,
                          color: '#0f172a',
                          lineHeight: 1
                        }}
                      >
                        Costos del Servicio
                      </Typography>
                      <Box ml={1.5} sx={{ pt: '2px' }}>
                        {statusChip}
                      </Box>
                    </Box>

                    <Typography
                      variant='caption'
                      color='text.secondary'
                      lineHeight={1}
                    >
                      {ticket.costs.length} costo(s) registrado(s)
                    </Typography>
                  </Box>

                  {/* 3. Chip del Monto Total (Monto de mayor jerarquía visual) */}
                  <Chip
                    icon={<CheckCircle sx={{ fontSize: '1.2rem' }} />}
                    label={formatCurrency(
                      ticket.costs.reduce(
                        (sum, cost) => sum + parseFloat(cost.amount.toString()),
                        0
                      )
                    )}
                    sx={{
                      backgroundColor: '#ecfdf5',
                      color: '#166534',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      height: 40,
                      borderRadius: '20px',
                      padding: '0 8px',
                      flexShrink: 0
                    }}
                  />
                </Box>
              </Paper>
            )}

            {ticket.status === MaintenanceStatus.COMPLETED && (
              <Paper
                sx={{
                  ...surfaceSx,
                  p: 3,
                  mb: 3,
                  borderColor: '#bfdbfe'
                }}
              >
                <Box
                  display='flex'
                  justifyContent='space-between'
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  flexDirection={{ xs: 'column', sm: 'row' }}
                  gap={2}
                >
                  <Box>
                    <Typography
                      variant='h6'
                      sx={{ fontWeight: 600, color: '#0f172a' }}
                    >
                      Reporte técnico de mantenimiento
                    </Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                      Documento técnico completo para formalizar el cierre del servicio con diagnóstico, validación y recomendaciones.
                    </Typography>
                    <Stack direction='row' spacing={1} sx={{ mt: 1.5 }} flexWrap='wrap'>
                      <Chip
                        size='small'
                        color='primary'
                        variant='outlined'
                        label={`${technicalReportCompletion}% completo`}
                      />
                      {technicalReport?.serviceFinalStatus && (
                        <Chip
                          size='small'
                          color='success'
                          label={technicalReport.serviceFinalStatus.replace(/_/g, ' ')}
                        />
                      )}
                      {technicalReport?.verificationProtocolType && (
                        <Chip
                          size='small'
                          variant='outlined'
                          label={technicalReport.verificationProtocolType}
                        />
                      )}
                    </Stack>
                  </Box>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <Button
                      variant='outlined'
                      startIcon={<Description />}
                      onClick={() => setTechnicalReportDialogOpen(true)}
                    >
                      {technicalReport?.updatedAt
                        ? 'Editar reporte'
                        : 'Diligenciar reporte'}
                    </Button>
                    <Button
                      variant='contained'
                      startIcon={<PictureAsPdf />}
                      onClick={handleGenerateTechnicalReport}
                      disabled={generateTechnicalReportMutation.isLoading}
                    >
                      PDF técnico
                    </Button>
                  </Stack>
                </Box>
              </Paper>
            )}

            {maintenanceSignaturesEnabled &&
              ticket.status === MaintenanceStatus.COMPLETED && (
              <Paper
                sx={{
                  ...surfaceSx,
                  p: 3,
                  mb: 3,
                  borderColor: signaturesMissing ? '#fcd34d' : '#bbf7d0'
                }}
              >
                <Box
                  display='flex'
                  justifyContent='space-between'
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  flexDirection={{ xs: 'column', sm: 'row' }}
                  gap={2}
                >
                  <Box>
                    <Typography
                      variant='h6'
                      sx={{
                        fontWeight: 600,
                        color: signaturesMissing ? '#d97706' : '#059669'
                      }}
                    >
                      Firmas de conformidad
                    </Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                      {signaturesMissing
                        ? 'Este ticket ya está completado, pero todavía le faltan firmas para que la orden quede cerrada visualmente.'
                        : 'Las firmas ya están registradas y listas para aparecer en la orden de servicio PDF.'}
                    </Typography>
                    <Stack direction='row' spacing={1} sx={{ mt: 1.5 }} flexWrap='wrap'>
                      <Chip
                        size='small'
                        color={hasTechnicianSignature ? 'success' : 'warning'}
                        label={
                          hasTechnicianSignature
                            ? 'Firma técnico OK'
                            : 'Falta firma técnico'
                        }
                      />
                      <Chip
                        size='small'
                        color={hasCustomerSignature ? 'success' : 'warning'}
                        label={
                          hasCustomerSignature
                            ? 'Firma cliente OK'
                            : 'Falta firma cliente'
                        }
                      />
                    </Stack>
                    {(ticket.technicianSignedAt || ticket.customerSignedAt) && (
                      <Stack spacing={0.5} sx={{ mt: 1.5 }}>
                        {ticket.technicianSignedAt && (
                          <Typography variant='caption' color='text.secondary'>
                            Firma técnico: {formatDate(ticket.technicianSignedAt)}
                          </Typography>
                        )}
                        {ticket.customerSignedAt && (
                          <Typography variant='caption' color='text.secondary'>
                            Firma cliente: {formatDate(ticket.customerSignedAt)}
                          </Typography>
                        )}
                      </Stack>
                    )}
                  </Box>

                  <Button
                    variant={signaturesMissing ? 'contained' : 'outlined'}
                    startIcon={<Draw />}
                    onClick={() => setSignaturesDialogOpen(true)}
                  >
                    {signaturesMissing ? 'Registrar firmas' : 'Actualizar firmas'}
                  </Button>
                </Box>
              </Paper>
            )}

            {/* Customer Satisfaction */}
            {ticket.customerSatisfaction && (
              <Paper
                sx={{
                  ...surfaceSx,
                  p: 3,
                  mb: 3,
                  borderColor: '#fde68a'
                }}
              >
                <Box display='flex' alignItems='center' gap={1} mb={2}>
                  <Box
                    sx={{
                      backgroundColor: '#fef3c7',
                      borderRadius: '8px',
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Star sx={{ color: '#b45309', fontSize: 20 }} />
                  </Box>
                  <Typography
                    variant='h6'
                    sx={{
                      fontWeight: 600,
                      color: '#0f172a'
                    }}
                  >
                    Satisfacción del Cliente
                  </Typography>
                </Box>

                <Box textAlign='center' py={2}>
                  <Typography
                    variant='h4'
                    color='warning.main'
                    fontWeight='bold'
                  >
                    {ticket.customerSatisfaction?.toFixed(1) || '0.0'}
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
            <Paper sx={{ ...surfaceSx, p: 3 }}>
              <Box display='flex' alignItems='center' gap={1} mb={2}>
                <TrendingUp sx={{ color: '#64748b' }} />
                <Typography variant='h6' sx={{ color: '#0f172a', fontWeight: 600 }}>
                  Acciones Rápidas
                </Typography>
              </Box>

              <Stack spacing={1}>
                <Button
                  fullWidth
                  variant='outlined'
                  startIcon={<Print />}
                  onClick={handleGenerateServiceOrder}
                  size='small'
                  disabled={generateServiceOrderMutation.isLoading}
                >
                  Orden de Servicio
                </Button>
                {ticket.status === MaintenanceStatus.COMPLETED && (
                  <Button
                    fullWidth
                    variant='outlined'
                    startIcon={<Science />}
                    onClick={() => setTechnicalReportDialogOpen(true)}
                    size='small'
                  >
                    Reporte Técnico
                  </Button>
                )}
                {maintenanceSignaturesEnabled &&
                  ticket.status === MaintenanceStatus.COMPLETED && (
                  <Button
                    fullWidth
                    variant='outlined'
                    startIcon={<Draw />}
                    onClick={() => setSignaturesDialogOpen(true)}
                    size='small'
                  >
                    {signaturesMissing ? 'Registrar firmas' : 'Actualizar firmas'}
                  </Button>
                )}
                {/* 
                <Button
                  fullWidth
                  variant='outlined'
                  startIcon={<Assessment />}
                  onClick={handleGenerateStatusReport}
                  size='small'
                  disabled={generateStatusReportMutation.isLoading}
                >
                  Reporte de Estado
                </Button> */}
                {/* 
                <Button
                  fullWidth
                  variant='outlined'
                  startIcon={<AssignmentTurnedIn />}
                  onClick={handleGenerateServiceCertificate}
                  size='small'
                  disabled={
                    generateServiceCertificateMutation.isLoading ||
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
                    generateServiceInvoiceMutation.isLoading ||
                    (!ticket.actualCost && !ticket.estimatedCost)
                  }
                >
                  Factura
                </Button> */}

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
          timelineLoading ||
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

        <Dialog
          open={previewOpen}
          onClose={handleClosePreview}
          maxWidth='md'
          fullWidth
        >
          <DialogTitle>{previewFile ? getFileDisplayName(previewFile) : 'Vista previa'}</DialogTitle>
          <DialogContent dividers>
            {previewLoading && (
              <Box
                display='flex'
                justifyContent='center'
                alignItems='center'
                minHeight={320}
              >
                <CircularProgress />
              </Box>
            )}

            {!previewLoading && previewError && (
              <Alert severity='error'>{previewError}</Alert>
            )}

            {!previewLoading &&
              !previewError &&
              previewFile &&
              previewUrl &&
              getFilePreviewType(previewFile) === 'image' && (
                <Box
                  component='img'
                  src={previewUrl}
                  alt={getFileDisplayName(previewFile)}
                  sx={{
                    width: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                    borderRadius: 2
                  }}
                />
              )}

            {!previewLoading &&
              !previewError &&
              previewFile &&
              previewUrl &&
              getFilePreviewType(previewFile) === 'video' && (
                <Box
                  component='video'
                  src={previewUrl}
                  controls
                  sx={{
                    width: '100%',
                    maxHeight: '70vh',
                    borderRadius: 2,
                    backgroundColor: '#000'
                  }}
                />
              )}

            {!previewLoading &&
              !previewError &&
              previewFile &&
              previewUrl &&
              getFilePreviewType(previewFile) === 'pdf' && (
                <Box
                  component='iframe'
                  src={previewUrl}
                  title={getFileDisplayName(previewFile)}
                  sx={{
                    width: '100%',
                    height: isMobile ? '60vh' : '75vh',
                    border: 0,
                    borderRadius: 2
                  }}
                />
              )}

            {!previewLoading &&
              !previewError &&
              previewFile &&
              getFilePreviewType(previewFile) === 'other' && (
                <Alert severity='info'>
                  Este tipo de archivo no tiene vista previa inline. Puedes descargarlo si lo necesitas.
                </Alert>
              )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClosePreview} color='inherit'>
              Cerrar
            </Button>
            {previewFile && (
              <Button
                onClick={handleDownloadPreviewFile}
                variant='contained'
                startIcon={<Download />}
              >
                Descargar
              </Button>
            )}
          </DialogActions>
        </Dialog>

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

        {/* Completion Costs Dialog */}
        <CompletionCostsDialog
          open={costsDialogOpen}
          onClose={() => {
            setCostsDialogOpen(false)
            setEditData((prev) => ({ ...prev, status: ticket.status }))
          }}
          onComplete={handleCompleteWithCosts}
          technicianName={ticket?.assignedTechnician?.name}
          storedTechnicianSignature={
            ticket?.technicianSignatureData ||
            (isTechnician
              ? currentTechnician?.signatureData ||
                ticket?.assignedTechnician?.signatureData ||
                null
              : ticket?.assignedTechnician?.signatureData || null)
          }
          canCaptureTechnicianSignature={
            !(
              ticket?.technicianSignatureData ||
              currentTechnician?.signatureData ||
              ticket?.assignedTechnician?.signatureData
            )
          }
          signaturesEnabled={maintenanceSignaturesEnabled}
          loading={
            updateTicketMutation.isLoading ||
            uploadFilesMutation.isLoading ||
            updateTechnicianMutation.isLoading
          }
        />

        {maintenanceSignaturesEnabled && (
          <MaintenanceSignaturesDialog
            open={signaturesDialogOpen}
            onClose={() => setSignaturesDialogOpen(false)}
            onSave={handleSavePendingSignatures}
            technicianName={ticket?.assignedTechnician?.name}
            storedTechnicianSignature={
              ticket?.technicianSignatureData ||
              (isTechnician
                ? currentTechnician?.signatureData ||
                  ticket?.assignedTechnician?.signatureData ||
                  null
                : ticket?.assignedTechnician?.signatureData || null)
            }
            currentTicketTechnicianSignature={ticket?.technicianSignatureData || null}
            currentCustomerSignerName={ticket?.customerSignerName || ticket?.customerName || ''}
            currentCustomerSignature={ticket?.customerSignatureData || null}
            canCaptureTechnicianSignature={
              !(
                currentTechnician?.signatureData ||
                ticket?.assignedTechnician?.signatureData ||
                ticket?.technicianSignatureData
              )
            }
            loading={
              updateTicketMutation.isLoading || updateTechnicianMutation.isLoading
            }
          />
        )}

        <CostsListDialog
          open={briefCostsDialogOpen}
          onClose={() => setBriefCostsDialogOpen(false)}
          costs={ticket.costs || []}
          isProcessingInvoice={updateTicketMutation.isLoading}
          isInitiallyInvoiced={ticket.isInvoiced || false}
          onInvoice={handleInvoice}
        />

        <MaintenanceTechnicalReportDialog
          open={technicalReportDialogOpen}
          onClose={() => setTechnicalReportDialogOpen(false)}
          report={technicalReport}
          equipmentType={ticket?.equipmentType}
          loading={technicalReportLoading}
          saving={upsertTechnicalReportMutation.isLoading}
          generatingPdf={generateTechnicalReportMutation.isLoading}
          onSave={handleSaveTechnicalReport}
          onGeneratePdf={handleGenerateTechnicalReport}
        />

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
