import { toast } from 'react-hot-toast'
import {
  CalibrationService,
  CalibrationServiceItemProgressEntryPayload
} from '../../../types/calibrationService'
import { CalibrationServiceDecisionValues } from '../CalibrationServiceApprovalDialog'
import { CalibrationServiceOdsDialogValues } from '../CalibrationServiceOdsDialog'
import { CalibrationServiceScheduleDialogValues } from '../CalibrationServiceScheduleDialog'
import { CalibrationServiceRescheduleDialogValues } from '../CalibrationServiceRescheduleDialog'
import { CalibrationServiceReassignDialogValues } from '../CalibrationServiceReassignDialog'
import { CalibrationServicePauseDialogValues } from '../CalibrationServicePauseDialog'
import { getApiErrorMessage } from '../../../utils/apiError'
import { useCalibrationServiceMutations } from '../../../hooks/useCalibrationServices'
import { CalibrationServiceDetailDialogs } from './useCalibrationServiceDetailDialogs'
import { DetailTab } from './calibrationServiceDetailUtils'

import { logger } from 'src/utils/logger'
type CalibrationServiceMutations = ReturnType<typeof useCalibrationServiceMutations>

interface CalibrationServiceWorkflowActionsParams {
  service: CalibrationService
  mutations: CalibrationServiceMutations
  dialogs: CalibrationServiceDetailDialogs
  setActiveTab: (tab: DetailTab) => void
  handleDownloadDocument: (documentId: number, fileName: string) => Promise<void>
  operationsCompletionNotes: string
}

/** Acciones del ciclo de vida del servicio: cotización, ODS, programación, ejecución y cierre. */
const useCalibrationServiceWorkflowActions = ({
  service,
  mutations,
  dialogs,
  setActiveTab,
  handleDownloadDocument,
  operationsCompletionNotes
}: CalibrationServiceWorkflowActionsParams) => {
  const {
    requestApproval,
    approveService,
    rejectService,
    requestChanges,
    uploadDocument,
    issueOds,
    scheduleService,
    rescheduleService,
    reassignService,
    pauseService,
    resumeService,
    cancelService,
    startExecution,
    completeExecution,
    closeService,
    updateItemProgress,
    updateDeliverySignature,
    updateExecutionCustomer,
    generateOdsPdf,
    sendCertificate,
    upsertSequenceConfig
  } = mutations
  const {
    decisionMode,
    setDecisionMode,
    setIsOdsDialogOpen,
    setIsScheduleDialogOpen,
    setIsRescheduleDialogOpen,
    setIsReassignDialogOpen,
    setIsPauseDialogOpen,
    setIsResumeDialogOpen,
    setIsCancelDialogOpen,
    setIsSequenceDialogOpen,
    setIsCloseDialogOpen,
    setIsExecutionCustomerDialogOpen
  } = dialogs

  const handleRequestApproval = async () => {
    if (!service.paymentMethod) {
      setActiveTab('summary')
      toast.error('Completa la forma de pago antes de enviar.')
      return
    }
    if (!service.instrumentDeliveryTime) {
      setActiveTab('summary')
      toast.error('Completa el tiempo de entrega de equipos antes de enviar.')
      return
    }
    if (!service.certificateDeliveryTime) {
      setActiveTab('summary')
      toast.error('Completa el tiempo de entrega de certificados antes de enviar.')
      return
    }
    const missingItems = (service.items || []).filter(
      (item) =>
        item.otherFields?.hasCalibrationPoints !== false &&
        (!item.otherFields?.calibrationPointCount || !item.otherFields?.measurementRange)
    )
    if (missingItems.length) {
      setActiveTab('items')
      toast.error(`Completa cantidad de puntos y rango de medición en ${missingItems.length} item${missingItems.length > 1 ? 's' : ''} antes de enviar.`)
      return
    }
    try {
      await requestApproval.mutateAsync({ serviceId: String(service.id) })
      toast.success('La cotización quedó enviada al cliente.')
    } catch (requestError) {
      logger.error(requestError)
      toast.error(getApiErrorMessage(requestError, 'No pudimos marcar la cotización como enviada al cliente.'))
    }
  }

  const handleSendCertificate = async () => {
    try {
      await sendCertificate.mutateAsync({ serviceId: String(service.id) })
      toast.success('El certificado quedó registrado como enviado.')
    } catch (sendError) {
      logger.error(sendError)
      toast.error(getApiErrorMessage(sendError, 'No pudimos registrar el envío del certificado.'))
    }
  }

  const handleDecisionSubmit = async (
    values: CalibrationServiceDecisionValues
  ) => {
    try {
      if (decisionMode === 'approve') {
        if (values.onSiteCalibration === null) {
          toast.error(
            'Selecciona si la calibración es en sitio o en laboratorio.'
          )
          return
        }

        if (!values.approvalChannel.trim()) {
          toast.error('Selecciona el medio por el que respondió el cliente.')
          return
        }

        if (!values.approvalReference.trim()) {
          toast.error(
            'Indica el email o teléfono del contacto que aprobó la cotización.'
          )
          return
        }
      }

      if (decisionMode === 'reject') {
        if (!values.approvalChannel.trim()) {
          toast.error('Selecciona el medio por el que respondió el cliente.')
          return
        }

        if (!values.lossReason) {
          toast.error('Selecciona el motivo de pérdida.')
          return
        }

        if (!values.notes.trim() || values.notes.trim().length < 5) {
          toast.error('Describe brevemente el motivo del rechazo.')
          return
        }
      }

      if (decisionMode === 'request_changes') {
        if (!values.approvalChannel.trim()) {
          toast.error('Selecciona el medio por el que respondió el cliente.')
          return
        }

        if (!values.notes.trim() || values.notes.trim().length < 5) {
          toast.error('Describe brevemente qué pidió modificar el cliente.')
          return
        }
      }

      let evidenceDocumentId: number | null = null

      if (values.evidenceFile) {
        const uploadedDocument = await uploadDocument.mutateAsync({
          serviceId: String(service.id),
          file: values.evidenceFile,
          documentType:
            decisionMode === 'approve'
              ? 'approval_evidence'
              : decisionMode === 'reject'
                ? 'rejection_evidence'
                : 'supporting_attachment',
          title:
            decisionMode === 'approve'
              ? `Aprobación cliente ${service.serviceCode}`
              : decisionMode === 'reject'
                ? `Rechazo cliente ${service.serviceCode}`
                : `Solicitud modificación cliente ${service.serviceCode}`,
          notes: values.notes?.trim() || undefined
        })

        evidenceDocumentId = uploadedDocument.id
      }

      const decisionIsoDate = values.decisionDate
        ? new Date(`${values.decisionDate}T12:00:00`).toISOString()
        : undefined

      if (decisionMode === 'approve') {
        await approveService.mutateAsync({
          serviceId: String(service.id),
          approvalChannel: values.approvalChannel.trim(),
          approvalReference: values.approvalReference.trim(),
          approvalNotes: values.notes.trim() || null,
          approvedAt: decisionIsoDate,
          evidenceDocumentId,
          onSiteCalibration: values.onSiteCalibration as boolean,
          hasEquipmentSale: values.hasEquipmentSale as boolean
        })

        toast.success('La aprobación del cliente quedó registrada.')
      }

      if (decisionMode === 'reject') {
        await rejectService.mutateAsync({
          serviceId: String(service.id),
          approvalChannel: values.approvalChannel.trim(),
          approvalReference: values.approvalReference.trim() || null,
          rejectionReason: values.notes.trim(),
          lossReason: values.lossReason,
          rejectedAt: decisionIsoDate,
          evidenceDocumentId
        })

        toast.success('El rechazo del cliente quedó registrado.')
      }

      if (decisionMode === 'request_changes') {
        await requestChanges.mutateAsync({
          serviceId: String(service.id),
          approvalChannel: values.approvalChannel.trim(),
          approvalReference: values.approvalReference.trim() || null,
          changeRequestReason: values.notes.trim(),
          requestedAt: decisionIsoDate,
          evidenceDocumentId
        })

        toast.success(
          'La solicitud de modificación del cliente quedó registrada.'
        )
      }

      setDecisionMode(null)
    } catch (decisionError) {
      logger.error(decisionError)
      toast.error(
        getApiErrorMessage(
          decisionError,
          decisionMode === 'approve'
            ? 'No pudimos registrar la aprobación del cliente.'
            : decisionMode === 'reject'
              ? 'No pudimos registrar el rechazo del cliente.'
              : 'No pudimos registrar la solicitud de modificación.'
        )
      )
    }
  }

  const handleIssueOds = async (values: CalibrationServiceOdsDialogValues) => {
    try {
      const updatedService = await issueOds.mutateAsync({
        serviceId: String(service.id),
        issuedAt: values.issuedAt
          ? new Date(`${values.issuedAt}T12:00:00`).toISOString()
          : undefined,
        executionCustomerName: values.executionCustomerName.trim() || null,
        executionSiteName: values.executionSiteName.trim() || null,
        internalNotes: values.internalNotes.trim() || null,
        scheduledFor: values.scheduledFor
          ? new Date(`${values.scheduledFor}T12:00:00`).toISOString()
          : null,
        scheduleWindow: values.scheduleWindow.trim() || null,
        serviceComments: values.serviceComments.trim() || null,
        modificationReason: values.modificationReason.trim() || null,
        customerAgreements: values.customerAgreements.trim() || null,
        signerName: values.signerName.trim() || null,
        signerRole: values.signerRole.trim() || null,
        externalReference: values.externalReference.trim() || null,
        receptionNotes: values.receptionNotes.trim() || null
      })

      if (values.generatePdfImmediately) {
        try {
          const document = await generateOdsPdf.mutateAsync({
            serviceId: String(service.id)
          })
          toast.success('La ODS quedó emitida y el PDF oficial ya está listo.')
          await handleDownloadDocument(
            document.id,
            document.originalFileName ||
              `ods-${updatedService.odsCode || service.serviceCode}.pdf`
          )
        } catch (pdfError) {
          logger.error(pdfError)
          toast.success('La ODS quedó emitida y el semáforo ya está activo.')
          toast.error(
            'La ODS se emitió, pero no pudimos generar el PDF oficial.'
          )
        }
      } else {
        toast.success('La ODS quedó emitida y el semáforo ya está activo.')
      }

      setIsOdsDialogOpen(false)
    } catch (odsError) {
      logger.error(odsError)
      toast.error(getApiErrorMessage(odsError, 'No pudimos emitir la ODS.'))
    }
  }

  const handleScheduleService = async (
    values: CalibrationServiceScheduleDialogValues
  ) => {
    try {
      if (!values.commitmentDate) {
        toast.error('Define la fecha compromiso del servicio.')
        return
      }

      if (!values.scheduledDate) {
        toast.error('Define la fecha programada del servicio.')
        return
      }

      if (!values.operationalResponsibleName.trim()) {
        toast.error('Indica el responsable operativo del servicio.')
        return
      }

      const assignedMetrologistUserIds = values.assignedMetrologistUserIds
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0)

      if (assignedMetrologistUserIds.length === 0) {
        toast.error('Selecciona al menos un metrólogo asignado para el servicio.')
        return
      }

      await scheduleService.mutateAsync({
        serviceId: String(service.id),
        commitmentDate: new Date(
          `${values.commitmentDate}T12:00:00`
        ).toISOString(),
        scheduledDate: new Date(
          `${values.scheduledDate}T12:00:00`
        ).toISOString(),
        assignedMetrologistUserIds,
        operationalResponsibleName: values.operationalResponsibleName.trim(),
        operationalResponsibleRole:
          values.operationalResponsibleRole.trim() || null,
        programmingNotes: values.programmingNotes.trim() || null
      })

      toast.success('El servicio quedó programado.')
      setIsScheduleDialogOpen(false)
      setActiveTab('operations')
    } catch (scheduleError) {
      logger.error(scheduleError)
      toast.error(getApiErrorMessage(scheduleError, 'No pudimos guardar la programación del servicio.'))
    }
  }

  const handleRescheduleService = async (
    values: CalibrationServiceRescheduleDialogValues
  ) => {
    try {
      if (!values.commitmentDate || !values.scheduledDate) {
        toast.error('Debes definir las nuevas fechas del servicio.')
        return
      }

      if (!values.reprogrammingReason.trim()) {
        toast.error('Indica el motivo de la reprogramación.')
        return
      }

      await rescheduleService.mutateAsync({
        serviceId: String(service.id),
        commitmentDate: new Date(
          `${values.commitmentDate}T12:00:00`
        ).toISOString(),
        scheduledDate: new Date(
          `${values.scheduledDate}T12:00:00`
        ).toISOString(),
        reprogrammingReason: values.reprogrammingReason.trim(),
        programmingNotes: values.programmingNotes.trim() || null,
        rescheduledAt: new Date().toISOString()
      })

      toast.success('La reprogramación formal quedó registrada.')
      setIsRescheduleDialogOpen(false)
      setActiveTab('operations')
    } catch (rescheduleError) {
      logger.error(rescheduleError)
      toast.error(getApiErrorMessage(rescheduleError, 'No pudimos registrar la reprogramación del servicio.'))
    }
  }

  const handleReassignService = async (
    values: CalibrationServiceReassignDialogValues
  ) => {
    try {
      const assignedMetrologistUserIds = values.assignedMetrologistUserIds
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0)

      if (assignedMetrologistUserIds.length === 0) {
        toast.error('Selecciona al menos un metrólogo asignado.')
        return
      }

      if (!values.reassignmentReason.trim()) {
        toast.error('Indica el motivo de la reasignación.')
        return
      }

      await reassignService.mutateAsync({
        serviceId: String(service.id),
        assignedMetrologistUserIds,
        reassignmentReason: values.reassignmentReason.trim(),
        operationalResponsibleName:
          values.operationalResponsibleName.trim() || null,
        operationalResponsibleRole:
          values.operationalResponsibleRole.trim() || null,
        effectiveAt: new Date().toISOString()
      })

      toast.success('La reasignación quedó registrada.')
      setIsReassignDialogOpen(false)
      setActiveTab('operations')
    } catch (reassignError) {
      logger.error(reassignError)
      toast.error(getApiErrorMessage(reassignError, 'No pudimos reasignar el metrólogo.'))
    }
  }

  const handlePauseService = async (
    values: CalibrationServicePauseDialogValues
  ) => {
    try {
      if (!values.notes.trim()) {
        toast.error('Indica el motivo de la pausa.')
        return
      }

      await pauseService.mutateAsync({
        serviceId: String(service.id),
        pauseReason: values.notes.trim(),
        pausedAt: new Date().toISOString()
      })

      toast.success('El servicio quedó pausado.')
      setIsPauseDialogOpen(false)
    } catch (pauseError) {
      logger.error(pauseError)
      toast.error(getApiErrorMessage(pauseError, 'No pudimos pausar el servicio.'))
    }
  }

  const handleResumeService = async (
    values: CalibrationServicePauseDialogValues
  ) => {
    try {
      await resumeService.mutateAsync({
        serviceId: String(service.id),
        resumeNotes: values.notes.trim() || null,
        resumedAt: new Date().toISOString()
      })

      toast.success('El servicio quedó reanudado.')
      setIsResumeDialogOpen(false)
    } catch (resumeError) {
      logger.error(resumeError)
      toast.error(getApiErrorMessage(resumeError, 'No pudimos reanudar el servicio.'))
    }
  }

  const handleCancelService = async (
    values: CalibrationServicePauseDialogValues
  ) => {
    try {
      if (!values.notes.trim()) {
        toast.error('Indica el motivo de la cancelación.')
        return
      }

      await cancelService.mutateAsync({
        serviceId: String(service.id),
        cancellationReason: values.notes.trim(),
        cancelledAt: new Date().toISOString()
      })

      toast.success('El servicio quedó cancelado formalmente.')
      setIsCancelDialogOpen(false)
      setActiveTab('summary')
    } catch (cancelError) {
      logger.error(cancelError)
      toast.error(getApiErrorMessage(cancelError, 'No pudimos cancelar el servicio.'))
    }
  }

  const handleStartExecution = async () => {
    try {
      await startExecution.mutateAsync({
        serviceId: String(service.id),
        startedAt: new Date().toISOString(),
        executionNotes: null
      })
      toast.success('La ejecución del servicio quedó iniciada.')
      setActiveTab('operations')
    } catch (executionError) {
      logger.error(executionError)
      toast.error(getApiErrorMessage(executionError, 'No pudimos iniciar la ejecución del servicio.'))
    }
  }

  const handleCompleteExecution = async () => {
    try {
      await completeExecution.mutateAsync({
        serviceId: String(service.id),
        technicallyCompletedAt: new Date().toISOString(),
        completionNotes: operationsCompletionNotes || null
      })
      toast.success('La ejecución técnica quedó finalizada.')
      setActiveTab('operations')
    } catch (completeError) {
      logger.error(completeError)
      toast.error(getApiErrorMessage(completeError, 'No pudimos finalizar técnicamente el servicio.'))
    }
  }

  const handleCloseService = async () => {
    if (!service) {
      return
    }

    try {
      await closeService.mutateAsync({
        serviceId: String(service.id),
        closedAt: new Date().toISOString(),
        closingNotes: 'Cierre final registrado desde el detalle del servicio.'
      })
      toast.success('El servicio quedó cerrado.')
      setIsCloseDialogOpen(false)
      setActiveTab('summary')
    } catch (closeError) {
      logger.error(closeError)
      toast.error(getApiErrorMessage(closeError, 'No pudimos cerrar el servicio.'))
    }
  }

  const handleUpdateDeliverySignature = async (data: {
    deliveryName: string | null
    deliveryRole: string | null
    deliverySignatureData: string | null
  }) => {
    try {
      await updateDeliverySignature.mutateAsync({
        serviceId: String(service.id),
        ...data
      })
      toast.success('Recepción conforme guardada.')
    } catch (error) {
      logger.error(error)
      toast.error(getApiErrorMessage(error, 'No pudimos guardar la recepción conforme.'))
    }
  }

  const handleSaveExecutionCustomer = async (data: {
    executionCustomerName: string | null
    executionSiteName: string | null
  }) => {
    try {
      await updateExecutionCustomer.mutateAsync({
        serviceId: String(service.id),
        ...data
      })
      toast.success('Cliente de ejecución actualizado.')
      setIsExecutionCustomerDialogOpen(false)
    } catch (error) {
      logger.error(error)
      toast.error(getApiErrorMessage(error, 'No pudimos actualizar el cliente de ejecución.'))
    }
  }

  const handleSaveOperationalProgress = async (
    items: CalibrationServiceItemProgressEntryPayload[]
  ) => {
    try {
      await updateItemProgress.mutateAsync({
        serviceId: String(service.id),
        items: items.map((item) => ({
          ...item,
          technicalNotes: item.technicalNotes?.trim() || null
        }))
      })
      toast.success('El avance técnico por ítem quedó actualizado.')
      return true
    } catch (progressError) {
      logger.error(progressError)
      toast.error(getApiErrorMessage(progressError, 'No pudimos guardar el avance técnico por ítem.'))
      return false
    }
  }

  const handleSaveSequenceConfig = async (values: {
    nextQuoteNumber: number
    nextOdsNumber: number
  }) => {
    try {
      await upsertSequenceConfig.mutateAsync(values)
      toast.success('Los consecutivos iniciales quedaron configurados.')
      setIsSequenceDialogOpen(false)
    } catch (configError) {
      logger.error(configError)
      toast.error(getApiErrorMessage(configError, 'No pudimos guardar la configuración inicial del módulo.'))
    }
  }

  return {
    handleRequestApproval,
    handleSendCertificate,
    handleDecisionSubmit,
    handleIssueOds,
    handleScheduleService,
    handleRescheduleService,
    handleReassignService,
    handlePauseService,
    handleResumeService,
    handleCancelService,
    handleStartExecution,
    handleCompleteExecution,
    handleCloseService,
    handleUpdateDeliverySignature,
    handleSaveExecutionCustomer,
    handleSaveOperationalProgress,
    handleSaveSequenceConfig
  }
}

export default useCalibrationServiceWorkflowActions
