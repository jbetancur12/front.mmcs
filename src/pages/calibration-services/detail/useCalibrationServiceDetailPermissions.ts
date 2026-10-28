import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import useCalibrationVisibility from '../../../hooks/useCalibrationVisibility'
import {
  CalibrationService,
  CalibrationServiceSequenceConfig
} from '../../../types/calibrationService'
import { getEffectiveServiceItemQuantity } from './calibrationServiceDetailUtils'

/**
 * Permisos del usuario y reglas de negocio que deciden qué acciones se muestran
 * (y cuáles quedan bloqueadas, con su motivo) en el detalle del servicio.
 */
const useCalibrationServiceDetailPermissions = (
  service: CalibrationService,
  sequenceConfig: CalibrationServiceSequenceConfig | undefined
) => {
  const canEditService = useCan(PERMISSIONS.CALIBRATION_SERVICE_UPDATE)
  const canTakeApprovalDecision = useCan(PERMISSIONS.CALIBRATION_SERVICE_DECIDE)
  const canIssueOdsRole = useCan(PERMISSIONS.CALIBRATION_SERVICE_ODS)
  const canScheduleServiceRole = useCan(PERMISSIONS.CALIBRATION_SERVICE_SCHEDULE)
  const canReprogramServiceRole = useCan(PERMISSIONS.CALIBRATION_SERVICE_RESCHEDULE)
  const canReassignServiceRole = useCan(PERMISSIONS.CALIBRATION_SERVICE_REASSIGN)
  const canRunExecutionRole = useCan(PERMISSIONS.CALIBRATION_SERVICE_EXECUTE)
  const canPauseServiceRole = useCan(PERMISSIONS.CALIBRATION_SERVICE_PAUSE)
  const canCancelServiceRole = useCan(PERMISSIONS.CALIBRATION_SERVICE_CANCEL)
  const canRegisterPhysicalTraceabilityRole = useCan(PERMISSIONS.CALIBRATION_SERVICE_TRACEABILITY)
  const canReportAdjustmentRole = useCan(PERMISSIONS.CALIBRATION_SERVICE_EXECUTE)
  const canReviewAdjustmentTechnically = useCan(PERMISSIONS.CALIBRATION_ADJUSTMENT_REVIEW_TECHNICAL)
  const canReviewAdjustmentCommercially = useCan(PERMISSIONS.CALIBRATION_ADJUSTMENT_COMMERCIAL)
  const canUpdateDocumentControlRole = useCan(PERMISSIONS.CALIBRATION_SERVICE_DOCUMENT_CONTROL)
  const canCloseServiceRole = useCan(PERMISSIONS.CALIBRATION_SERVICE_CLOSE)
  const canInvoiceCutRole = useCan(PERMISSIONS.CALIBRATION_SERVICE_INVOICING)
  const canUploadDocuments = useCan(PERMISSIONS.CALIBRATION_SERVICE_DOCUMENT_UPLOAD)
  // Qué ve de los servicios: sale de capacidades de visibilidad, no del nombre del rol
  const { isTechnicalOnlyView, isAnalystOnlyView, hideFinancialInfo } =
    useCalibrationVisibility()
  const canGenerateQuotePdf = useCan(PERMISSIONS.CALIBRATION_SERVICE_QUOTE_PDF)
  const canGenerateOdsPdf = useCan(PERMISSIONS.CALIBRATION_SERVICE_ODS)
  const canEditExecutionCustomerRole =
    useCan(PERMISSIONS.CALIBRATION_SERVICE_EXECUTION_CUSTOMER)
  const canIssueOds =
    canIssueOdsRole &&
    service?.status === 'approved' &&
    service?.approvalStatus === 'approved' &&
    !service?.odsCode &&
    Boolean(sequenceConfig?.initialized)
  const canScheduleService =
    canScheduleServiceRole &&
    !service?.isPaused &&
    service?.status !== 'cancelled' &&
    ['ods_issued', 'pending_programming'].includes(service?.status || '')
  const canReprogramService =
    canReprogramServiceRole &&
    !service?.isPaused &&
    service?.status === 'scheduled'
  const canReassignService =
    canReassignServiceRole &&
    service?.status !== 'cancelled' &&
    ['scheduled', 'in_execution', 'technically_completed'].includes(
      service?.status || ''
    )
  const canPauseService =
    canPauseServiceRole &&
    !service?.isPaused &&
    service?.status !== 'cancelled' &&
    [
      'ods_issued',
      'pending_programming',
      'scheduled',
      'in_execution',
      'technically_completed'
    ].includes(service?.status || '')
  const canResumeService =
    canPauseServiceRole &&
    Boolean(service?.isPaused) &&
    service?.status !== 'cancelled' &&
    [
      'ods_issued',
      'pending_programming',
      'scheduled',
      'in_execution',
      'technically_completed'
    ].includes(service?.status || '')
  const canCancelService =
    canCancelServiceRole &&
    service?.status !== 'cancelled' &&
    service?.status !== 'closed' &&
    // El backend no cancela servicios que ya tienen cortes registrados
    !(service?.cuts?.length) &&
    [
      'draft',
      'pending_approval',
      'approved',
      'ods_issued',
      'pending_programming',
      'scheduled',
      'in_execution',
      'technically_completed'
    ].includes(service?.status || '')
  const canStartExecution =
    canRunExecutionRole && !service?.isPaused && service?.status === 'scheduled'
  const allItemsOperationallyCompleted = (service?.items || []).every(
    (item) => {
      const status = item.otherFields?.operationalStatus
      return status === 'completed'
    }
  )
  const hasReleasableItems = (service?.items || []).some((item) => {
    const operationalStatus = item.otherFields?.operationalStatus
    const releasedQuantity = Number(item.otherFields?.releasedQuantity || 0)
    const quantity = service
      ? getEffectiveServiceItemQuantity(service, item)
      : 0

    return (
      ['completed', 'in_progress'].includes(operationalStatus as string) &&
      Math.max(quantity - releasedQuantity, 0) > 0
    )
  })
  const canCompleteExecution =
    canRunExecutionRole &&
    service?.status === 'in_execution' &&
    allItemsOperationallyCompleted
  const canCreateCut =
    canRunExecutionRole &&
    !service?.isPaused &&
    ['in_execution', 'technically_completed'].includes(service?.status || '') &&
    hasReleasableItems
  const showCompleteExecution =
    canRunExecutionRole && service?.status === 'in_execution'
  const pendingExecutionItems = (service?.items || []).filter(
    (item) => item.otherFields?.operationalStatus !== 'completed'
  ).length
  const completeExecutionBlockedReason = allItemsOperationallyCompleted
    ? null
    : `Faltan ${pendingExecutionItems} ítem(s) por marcar como Completado en la pestaña Operación.`
  const showCreateCut =
    canRunExecutionRole &&
    !service?.isPaused &&
    ['in_execution', 'technically_completed'].includes(service?.status || '')
  const createCutBlockedReason = hasReleasableItems
    ? null
    : 'No hay ítems en progreso o completados con cantidad por liberar. Registra el avance en la pestaña Operación.'
  const showTechnicalProgressPdf =
    canRunExecutionRole && Boolean(service?.items?.length)
  const canMarkCutReady =
    canRunExecutionRole &&
    !service?.isPaused &&
    ['in_execution', 'technically_completed'].includes(service?.status || '')
  const canReportAdjustment =
    canReportAdjustmentRole &&
    !service?.isPaused &&
    ['in_execution', 'technically_completed'].includes(service?.status || '')
  const canReviewAdjustment =
    canReviewAdjustmentTechnically || canReviewAdjustmentCommercially
  const canUpdateOperationalProgress =
    canRunExecutionRole &&
    !service?.isPaused &&
    ['scheduled', 'in_execution'].includes(service?.status || '')
  const canInvoiceCuts =
    canInvoiceCutRole && !service?.isPaused && service?.status !== 'cancelled'
  const canRegisterPayment =
    canInvoiceCutRole && !service?.isPaused && service?.status !== 'cancelled'
  const canUpdateDocumentControl =
    canUpdateDocumentControlRole &&
    service?.status !== 'closed' &&
    service?.status !== 'cancelled' &&
    !service?.isPaused
  const canRegisterPhysicalTraceability =
    canRegisterPhysicalTraceabilityRole &&
    service?.status !== 'cancelled' &&
    service?.status !== 'closed' &&
    [
      'ods_issued',
      'pending_programming',
      'scheduled',
      'in_execution',
      'technically_completed'
    ].includes(service?.status || '')
  const canManageLogisticsControl =
    canRegisterPhysicalTraceabilityRole &&
    service?.status !== 'cancelled' &&
    service?.status !== 'closed' &&
    [
      'ods_issued',
      'pending_programming',
      'scheduled',
      'in_execution',
      'technically_completed'
    ].includes(service?.status || '')
  const canGenerateLogisticsPdf =
    canRegisterPhysicalTraceabilityRole &&
    service?.status !== 'cancelled' &&
    [
      'ods_issued',
      'pending_programming',
      'scheduled',
      'in_execution',
      'technically_completed',
      'closed'
    ].includes(service?.status || '')
  const canSendLogisticsEmail = canGenerateLogisticsPdf
  const canStillRegisterAdjustmentsAfterTechnicalCompletion =
    service?.status === 'technically_completed' && canReportAdjustment
  const hasCuts = Boolean(service?.cuts?.length)
  const allCutsSent =
    Boolean(service?.cuts?.length) &&
    (service?.cuts || []).every(
      (cut) => cut.otherFields?.documentControl?.status === 'sent'
    )
  const shouldShowPostTechnicalCompletionGuidance =
    service?.status === 'technically_completed'
  const shouldShowCutsNextStepGuidance =
    service?.status === 'technically_completed' && !hasCuts
  const canCloseService =
    canCloseServiceRole &&
    !service?.isPaused &&
    service?.status === 'technically_completed' &&
    allCutsSent &&
    !hasReleasableItems
  const showCloseService =
    canCloseServiceRole &&
    !service?.isPaused &&
    service?.status === 'technically_completed' &&
    hasCuts
  const closeServiceBlockedReason = !allCutsSent
    ? 'Faltan cortes con el certificado enviado (control documental).'
    : hasReleasableItems
      ? 'Aún hay cantidades por liberar: crea un nuevo corte para ellas.'
      : null
  const canEdit = canEditService && service.status === 'draft'
  const canRequestApproval = canEditService && service.status === 'draft'
  const canDecideApproval =
    canTakeApprovalDecision && service.status === 'pending_approval'
  const canEditExecutionCustomer =
    canEditExecutionCustomerRole &&
    service.status !== 'cancelled' &&
    service.status !== 'closed'

  return {
    canEditService,
    canTakeApprovalDecision,
    canIssueOdsRole,
    canScheduleServiceRole,
    canReprogramServiceRole,
    canReassignServiceRole,
    canRunExecutionRole,
    canPauseServiceRole,
    canCancelServiceRole,
    canRegisterPhysicalTraceabilityRole,
    canReportAdjustmentRole,
    canReviewAdjustmentTechnically,
    canReviewAdjustmentCommercially,
    canUpdateDocumentControlRole,
    canCloseServiceRole,
    canInvoiceCutRole,
    canUploadDocuments,
    canGenerateQuotePdf,
    canGenerateOdsPdf,
    canEditExecutionCustomerRole,
    isTechnicalOnlyView,
    isAnalystOnlyView,
    hideFinancialInfo,
    canIssueOds,
    canScheduleService,
    canReprogramService,
    canReassignService,
    canPauseService,
    canResumeService,
    canCancelService,
    canStartExecution,
    allItemsOperationallyCompleted,
    hasReleasableItems,
    canCompleteExecution,
    canCreateCut,
    showCompleteExecution,
    pendingExecutionItems,
    completeExecutionBlockedReason,
    showCreateCut,
    createCutBlockedReason,
    showTechnicalProgressPdf,
    canMarkCutReady,
    canReportAdjustment,
    canReviewAdjustment,
    canUpdateOperationalProgress,
    canInvoiceCuts,
    canRegisterPayment,
    canUpdateDocumentControl,
    canRegisterPhysicalTraceability,
    canManageLogisticsControl,
    canGenerateLogisticsPdf,
    canSendLogisticsEmail,
    canStillRegisterAdjustmentsAfterTechnicalCompletion,
    hasCuts,
    allCutsSent,
    shouldShowPostTechnicalCompletionGuidance,
    shouldShowCutsNextStepGuidance,
    canCloseService,
    showCloseService,
    closeServiceBlockedReason,
    canEdit,
    canRequestApproval,
    canDecideApproval,
    canEditExecutionCustomer
  }
}

export type CalibrationServiceDetailPermissions = ReturnType<
  typeof useCalibrationServiceDetailPermissions
>

export default useCalibrationServiceDetailPermissions
