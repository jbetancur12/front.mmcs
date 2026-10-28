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
  // Las reglas de estado y de capacidad de cada acción las calcula el API (availableActions): aquí solo se leen.
  // Cambiar una capacidad en el panel de roles cambia los botones sin tocar este archivo.
  const actionByKey = new Map(
    (service?.availableActions || []).map((action) => [action.key, action])
  )
  const isVisible = (key: string) => Boolean(actionByKey.get(key)?.visible)
  const isEnabled = (key: string) => Boolean(actionByKey.get(key)?.enabled)
  const reasonOf = (key: string) => actionByKey.get(key)?.reason ?? null

  const canIssueOds = isVisible('issue_ods') && Boolean(sequenceConfig?.initialized)
  const canScheduleService = isVisible('schedule')
  const canReprogramService = isVisible('reschedule')
  const canReassignService = isVisible('reassign')
  const canPauseService = isVisible('pause')
  const canResumeService = isVisible('resume')
  const canCancelService = isEnabled('cancel')
  const canStartExecution = isVisible('start_execution')
  const allItemsOperationallyCompleted = (service?.items || []).every(
    (item) => item.otherFields?.operationalStatus === 'completed'
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
  const canCompleteExecution = isEnabled('complete_execution')
  const canCreateCut = isEnabled('create_cut')
  const showCompleteExecution = isVisible('complete_execution')
  const pendingExecutionItems = (service?.items || []).filter(
    (item) => item.otherFields?.operationalStatus !== 'completed'
  ).length
  const completeExecutionBlockedReason = reasonOf('complete_execution')
  const showCreateCut = isVisible('create_cut')
  const createCutBlockedReason = reasonOf('create_cut')
  const showTechnicalProgressPdf =
    canRunExecutionRole && Boolean(service?.items?.length)
  const canMarkCutReady = isVisible('mark_cut_ready')
  const canReportAdjustment = isVisible('report_adjustment')
  const canReviewAdjustment =
    canReviewAdjustmentTechnically || canReviewAdjustmentCommercially
  const canUpdateOperationalProgress = isVisible('update_progress')
  const canInvoiceCuts = isVisible('invoice_cut')
  const canRegisterPayment = isVisible('register_payment')
  const canUpdateDocumentControl = isVisible('document_control')
  const canRegisterPhysicalTraceability = isVisible('register_traceability')
  const canManageLogisticsControl = isVisible('register_traceability')
  // El PDF y el correo de logística también están disponibles con el servicio cerrado
  const canGenerateLogisticsPdf =
    canRegisterPhysicalTraceabilityRole &&
    (isVisible('register_traceability') || service?.status === 'closed')
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
  const canCloseService = isEnabled('close_service')
  const showCloseService = isVisible('close_service')
  const closeServiceBlockedReason = reasonOf('close_service')
  const canEdit = isVisible('edit')
  const canRequestApproval = isVisible('request_approval')
  const canDecideApproval = isVisible('decide')
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
