import { toast } from 'react-hot-toast'
import { CalibrationService } from '../../../types/calibrationService'
import { getApiErrorMessage, getApiErrorReason } from '../../../utils/apiError'
import { useCalibrationServiceMutations } from '../../../hooks/useCalibrationServices'
import { CalibrationServiceDetailDialogs } from './useCalibrationServiceDetailDialogs'
import { DetailTab } from './calibrationServiceDetailUtils'

type CalibrationServiceMutations = ReturnType<typeof useCalibrationServiceMutations>

interface CalibrationServiceAdjustmentActionsParams {
  service: CalibrationService
  mutations: CalibrationServiceMutations
  dialogs: CalibrationServiceDetailDialogs
  setActiveTab: (tab: DetailTab) => void
}

/** Acciones de novedades: registro, revisión, envío al cliente, respuesta y firma del cliente. */
const useCalibrationServiceAdjustmentActions = ({
  service,
  mutations,
  dialogs,
  setActiveTab
}: CalibrationServiceAdjustmentActionsParams) => {
  const {
    uploadDocument,
    createAdjustment,
    reviewAdjustment,
    batchSendAdjustmentsToCustomer,
    respondAdjustment,
    updateCustomerSignature
  } = mutations
  const {
    setIsAdjustmentDialogOpen,
    selectedAdjustmentsForCustomerResponse,
    setSelectedAdjustmentsForCustomerResponse,
    selectedAdjustmentsForSend,
    setSelectedAdjustmentsForSend,
    setSendAdjustmentPreview
  } = dialogs

  const handleCreateAdjustment = async (values: {
    adjustments: Array<{
      serviceItemId?: number | null
      changeType:
        | 'quantity_less'
        | 'quantity_more'
        | 'extra_item'
        | 'not_received'
        | 'scope_change'
      itemName?: string | null
      quotedQuantity?: number
      actualQuantity: number
      description: string
      technicalNotes?: string | null
      requiresCommercialAdjustment: boolean
      contractModificationRequired?: boolean
      supportChannel?: string | null
      supportReference?: string | null
      supportNotifiedAt?: string
    }>
  }) => {
    try {
      for (const adjustmentValues of values.adjustments) {
        await createAdjustment.mutateAsync({
          serviceId: String(service.id),
          ...adjustmentValues
        })
      }
      toast.success(
        values.adjustments.length > 1
          ? 'Las novedades quedaron registradas.'
          : 'La novedad quedó registrada.'
      )
      setIsAdjustmentDialogOpen(false)
      setActiveTab('adjustments')
    } catch (adjustmentError) {
      console.error(adjustmentError)
      const serverMessage = getApiErrorReason(adjustmentError)

      toast.error(
        serverMessage
          ? `No pudimos registrar la novedad. ${serverMessage}`
          : 'No pudimos registrar la novedad.'
      )
    }
  }

  const handleReviewAdjustment = async (
    adjustmentId: number,
    values: {
      reviewStage?: 'technical' | 'commercial'
      decision?: 'approved' | 'rejected'
      technicalDecision?: 'approved' | 'rejected'
      technicalReviewNotes?: string | null
      technicalReviewerRole?: string | null
      technicalSignatureData?: string | null
      contractModificationRequired?: boolean
      supportChannel?: string | null
      supportReference?: string | null
      supportNotifiedAt?: string
      commercialNotes?: string | null
      pricingNotes?: string | null
      approvedUnitPrice?: number | null
      approvedTaxRate?: number | null
      approvedTaxTotal?: number | null
      approvedSubtotal?: number | null
      approvedTotal?: number | null
      useQuotedPrice?: boolean
      applyDiscount?: boolean
      customerApprovalRequired?: boolean
    }
  ) => {
    try {
      await reviewAdjustment.mutateAsync({
        serviceId: String(service.id),
        adjustmentId: String(adjustmentId),
        ...values
      })
      toast.success('La revisión de la novedad quedó guardada.')
      setActiveTab('adjustments')
    } catch (adjustmentError) {
      console.error(adjustmentError)
      toast.error(getApiErrorMessage(adjustmentError, 'No pudimos guardar la revisión de la novedad.'))
    }
  }

  const handleSendAdjustmentToCustomer = async (values: {
    recipientEmail?: string | null
    recipientName?: string | null
  }) => {
    const pending = selectedAdjustmentsForSend
    if (!pending.length) {
      return
    }

    try {
      const result = await batchSendAdjustmentsToCustomer.mutateAsync({
        serviceId: String(service.id),
        adjustmentIds: pending.map((a) => a.id),
        recipientEmail: values.recipientEmail,
        recipientName: values.recipientName,
        sentAt: new Date().toISOString()
      })
      if (result.delivery?.actualRecipient) {
        toast(
          `${result.delivery.adjustmentCount} novedades enviadas a ${result.delivery.actualRecipient}`,
          { duration: 5000, icon: '📧' }
        )
      } else {
        toast.success(`${pending.length} novedad(es) enviada(s) al cliente.`)
      }
    } catch (sendError) {
      console.error(sendError)
      toast.error(getApiErrorMessage(sendError, 'No pudimos enviar las novedades al cliente.'))
    }

    setSelectedAdjustmentsForSend([])
    setSendAdjustmentPreview(null)
    setActiveTab('adjustments')
  }

  const handleRegisterAdjustmentCustomerResponse = async (
    entries: Array<{
      adjustmentId: number
      decision: 'approved' | 'rejected' | 'changes_requested'
      responseChannel?: string | null
      responseReference?: string | null
      notes?: string | null
      evidenceFile?: File | null
    }>
  ) => {
    const pending = selectedAdjustmentsForCustomerResponse
    if (!pending.length) {
      return
    }

    let successCount = 0
    let failCount = 0

    for (const entry of entries) {
      try {
        let evidenceDocumentId: number | null = null

        if (entry.evidenceFile) {
          const uploadedDocument = await uploadDocument.mutateAsync({
            serviceId: String(service.id),
            file: entry.evidenceFile,
            documentType: 'supporting_attachment',
            title: `Evidencia respuesta novedad`,
            notes: entry.notes?.trim() || undefined
          })
          evidenceDocumentId = uploadedDocument.id
        }

        await respondAdjustment.mutateAsync({
          serviceId: String(service.id),
          adjustmentId: String(entry.adjustmentId),
          decision: entry.decision,
          responseChannel: entry.responseChannel,
          responseReference: entry.responseReference,
          notes: entry.notes,
          evidenceDocumentId,
          respondedAt: new Date().toISOString()
        })
        successCount++
      } catch (adjustmentError) {
        console.error(adjustmentError)
        failCount++
      }
    }

    setSelectedAdjustmentsForCustomerResponse([])
    setActiveTab('adjustments')

    if (failCount === 0) {
      toast.success(`${successCount} respuesta(s) registrada(s).`)
    } else {
      toast.error(`${successCount} registrada(s), ${failCount} fallida(s).`)
    }
  }

  const handleUpdateCustomerSignature = async (data: string | null) => {
    try {
      await updateCustomerSignature.mutateAsync({
        serviceId: String(service.id),
        customerSignatureData: data
      })
      toast.success('Firma del cliente guardada.')
    } catch (error) {
      console.error(error)
      toast.error(getApiErrorMessage(error, 'No pudimos guardar la firma del cliente.'))
    }
  }

  return {
    handleCreateAdjustment,
    handleReviewAdjustment,
    handleSendAdjustmentToCustomer,
    handleRegisterAdjustmentCustomerResponse,
    handleUpdateCustomerSignature
  }
}

export default useCalibrationServiceAdjustmentActions
