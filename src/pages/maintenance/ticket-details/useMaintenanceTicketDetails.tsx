import React, { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Chip, useMediaQuery, useTheme } from '@mui/material'
import { AttachMoney, Receipt } from '@mui/icons-material'
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
} from '../../../hooks/useMaintenance'
import {
  MaintenanceStatus,
  MaintenanceTechnicalReportRequest
} from '../../../types/maintenance'
import { maintenanceSignaturesEnabled } from '../../../features/maintenanceFlags'
import type {
  CompletionPhotoInput,
  CompletionSignatureInput
} from '../../../Components/Maintenance/CompletionCostsDialog'
import useMaintenanceWebSocket from '../../../hooks/useMaintenanceWebSocket'
import { useStore } from '@nanostores/react'
import { userStore } from '../../../store/userStore'
import { ROLES } from 'src/constants/roles'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import useMaintenanceTicketFeedback from './useMaintenanceTicketFeedback'
import useMaintenanceFilePreview from './useMaintenanceFilePreview'
import useMaintenanceTicketEditing from './useMaintenanceTicketEditing'

/**
 * Estado y acciones del detalle de un ticket de mantenimiento: datos del
 * ticket, permisos, edición, comentarios, archivos, firmas, PDFs y tiempo real.
 */
const useMaintenanceTicketDetails = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const $userStore = useStore(userStore)
  const { ticketId } = useParams<{ ticketId: string }>()
  const navigate = useNavigate()
  const [showTimeline, setShowTimeline] = useState(true)
  const [showComments, setShowComments] = useState(true)
  const [showFiles, setShowFiles] = useState(true)
  const [pdfMenuAnchor, setPdfMenuAnchor] = useState<null | HTMLElement>(null)
  // const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [costsDialogOpen, setCostsDialogOpen] = useState(false)
  const [signaturesDialogOpen, setSignaturesDialogOpen] = useState(false)
  const [briefCostsDialogOpen, setBriefCostsDialogOpen] = useState(false)
  const [technicalReportDialogOpen, setTechnicalReportDialogOpen] =
    useState(false)
  const [realTimeUpdatesEnabled, setRealTimeUpdatesEnabled] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  // Asignar técnicos exige poder listarlos (GET /maintenance/technicians)
  const canManageTechnicians = useCan(PERMISSIONS.MAINTENANCE_TECHNICIAN_LIST)
  const currentUserRole = $userStore.rol[0] || ROLES.USER
  // Sin alcance total sobre los tickets (capacidad), solo se ven y operan los asignados a uno mismo
  const isTechnician = !useCan(PERMISSIONS.MAINTENANCE_TICKET_MANAGE_ALL)

  const feedback = useMaintenanceTicketFeedback()
  const { showToast, showConfirmDialog } = feedback
  const filePreview = useMaintenanceFilePreview(showToast)
  const { filePreviewCache, setFilePreviewCache } = filePreview
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
  const hasCustomerSignature = maintenanceSignaturesEnabled
    ? Boolean(ticket?.customerSignatureData)
    : false
  const hasTechnicianSignature = maintenanceSignaturesEnabled
    ? Boolean(
        ticket?.technicianSignatureData ||
          ticket?.assignedTechnician?.signatureData
      )
    : false
  const isCustomerApprovalLocked =
    maintenanceSignaturesEnabled && hasCustomerSignature
  const signaturesMissing =
    maintenanceSignaturesEnabled &&
    ticket?.status === MaintenanceStatus.COMPLETED &&
    (!hasCustomerSignature || !hasTechnicianSignature)

  const editing = useMaintenanceTicketEditing({
    ticket,
    isTechnician,
    canEditTicket,
    isCustomerApprovalLocked,
    showToast
  })
  const {
    editMode,
    setEditMode,
    editData,
    setEditErrors,
    validateEditData
  } = editing

  const { data: technicians } = useMaintenanceTechnicians(canManageTechnicians)
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
    technicianWorkMinutes: number,
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
            technicianWorkMinutes,
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
            technicianWorkMinutes,
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

  const handleRevokeCustomerSignature = async () => {
    if (!ticket || !canManageTechnicians) return

    try {
      await updateTicketMutation.mutateAsync({
        id: ticket.id,
        data: {
          customerSignerName: null,
          customerSignatureData: null
        }
      })

      await refetchTicket()
      await refetchTimeline()
      await refetchTechnicalReport()
      showToast(
        'La firma del cliente fue revocada. El contenido técnico vuelve a estar editable.',
        'success'
      )
    } catch (error: any) {
      console.error('Error revoking customer signature:', error)
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Error al revocar la firma del cliente'
      showToast(errorMessage, 'error')
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

  return {
    ...feedback,
    ...filePreview,
    ...editing,
    $userStore,
    theme,
    isMobile,
    navigate,
    canManageTechnicians,
    currentUserRole,
    isTechnician,
    canEditTicket,
    hasCustomerSignature,
    hasTechnicianSignature,
    isCustomerApprovalLocked,
    signaturesMissing,
    updateTicketMutation,
    upsertTechnicalReportMutation,
    addCommentMutation,
    updateCommentMutation,
    deleteCommentMutation,
    uploadFilesMutation,
    deleteFileMutation,
    updateTechnicianMutation,
    generateServiceOrderMutation,
    generateTechnicalReportMutation,
    generateStatusReportMutation,
    generateServiceCertificateMutation,
    generateServiceInvoiceMutation,
    statusChip,
    technicalReportCompletion,
    handleSaveEdit,
    handleCompleteWithCosts,
    handleInvoice,
    handleAddComment,
    handleSavePendingSignatures,
    handleRevokeCustomerSignature,
    handleUpdateComment,
    handleDeleteComment,
    handleFileUpload,
    handleFileDelete,
    handleGenerateServiceOrder,
    handleGenerateTechnicalReport,
    handleSaveTechnicalReport,
    handlePdfMenuOpen,
    handlePdfMenuClose,
    handleRefresh,
    handleBack,
    showTimeline,
    setShowTimeline,
    showComments,
    setShowComments,
    showFiles,
    setShowFiles,
    pdfMenuAnchor,
    setPdfMenuAnchor,
    costsDialogOpen,
    setCostsDialogOpen,
    signaturesDialogOpen,
    setSignaturesDialogOpen,
    briefCostsDialogOpen,
    setBriefCostsDialogOpen,
    technicalReportDialogOpen,
    setTechnicalReportDialogOpen,
    realTimeUpdatesEnabled,
    setRealTimeUpdatesEnabled,
    lastUpdate,
    setLastUpdate,
    ticketId,
    ticket,
    ticketLoading,
    ticketError,
    refetchTicket,
    currentTechnician,
    technicians,
    timelineData,
    timelineLoading,
    refetchTimeline,
    technicalReport,
    technicalReportLoading,
    refetchTechnicalReport
  }
}

export type MaintenanceTicketDetailsState = ReturnType<
  typeof useMaintenanceTicketDetails
>

export default useMaintenanceTicketDetails
