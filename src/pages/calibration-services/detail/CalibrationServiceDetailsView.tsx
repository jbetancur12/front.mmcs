import {
  Alert,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Tab,
  Tabs
} from '@mui/material'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  useCalibrationAssignableMetrologists,
  useCalibrationServiceMutations
} from '../../../hooks/useCalibrationServices'
import {
  CalibrationService,
  CalibrationServiceSequenceConfig,
  CalibrationServiceSlaConfig
} from '../../../types/calibrationService'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import CalibrationServiceAdjustmentsPanel from '../CalibrationServiceAdjustmentsPanel'
import CalibrationServiceDocumentsPanel from '../CalibrationServiceDocumentsPanel'
import CalibrationServiceOperationsPanel from '../CalibrationServiceOperationsPanel'
import CalibrationServiceTimeline from '../CalibrationServiceTimeline'
import CalibrationServiceGuidePanel from '../CalibrationServiceGuidePanel'
import CalibrationServiceLogisticsPanel from '../CalibrationServiceLogisticsPanel'
import CalibrationDeliveryReadyAction from './CalibrationDeliveryReadyAction'
import CalibrationServiceStageTracker from '../CalibrationServiceStageTracker'
import { DetailTabPanel } from './CalibrationServiceDetailLayout'
import {
  DetailTab,
  getEmailSendPreview
} from './calibrationServiceDetailUtils'
import CalibrationServiceCompactSummary from './CalibrationServiceCompactSummary'
import CalibrationServiceCutsTab from './CalibrationServiceCutsTab'
import CalibrationServiceDetailDialogsHost from './CalibrationServiceDetailDialogs'
import CalibrationServiceDetailHeader from './CalibrationServiceDetailHeader'
import CalibrationServiceItemsTab from './CalibrationServiceItemsTab'
import CalibrationServiceSummaryTab from './CalibrationServiceSummaryTab'
import { getCalibrationServiceDetailData } from './calibrationServiceDetailData'
import useCalibrationServiceDetailDialogs from './useCalibrationServiceDetailDialogs'
import useCalibrationServiceDetailPermissions from './useCalibrationServiceDetailPermissions'
import useCalibrationServiceDocumentActions from './useCalibrationServiceDocumentActions'
import useCalibrationServiceDocumentViewer from './useCalibrationServiceDocumentViewer'
import useCalibrationServiceWorkflowActions from './useCalibrationServiceWorkflowActions'
import useCalibrationServiceLogisticsActions from './useCalibrationServiceLogisticsActions'
import useCalibrationServiceCutActions from './useCalibrationServiceCutActions'
import useCalibrationServiceAdjustmentActions from './useCalibrationServiceAdjustmentActions'
import {
  CalibrationServiceDetailActions,
  CalibrationServiceDetailBusy
} from './calibrationServiceDetailTypes'

interface CalibrationServiceDetailsViewProps {
  service: CalibrationService
  sequenceConfig: CalibrationServiceSequenceConfig | undefined
  canManageSequenceConfig: boolean
  isLoadingSequenceConfig: boolean
  slaConfig: CalibrationServiceSlaConfig | undefined
  activeTab: DetailTab
  setActiveTab: (tab: DetailTab) => void
}

/**
 * Detalle de un servicio de calibración ya cargado. Compone el encabezado, las
 * pestañas y los diálogos; la lógica vive en los hooks de esta carpeta.
 */
const CalibrationServiceDetailsView = ({
  service,
  sequenceConfig,
  canManageSequenceConfig,
  isLoadingSequenceConfig,
  slaConfig,
  activeTab,
  setActiveTab
}: CalibrationServiceDetailsViewProps) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const canResetSequence = useCan(PERMISSIONS.CALIBRATION_CONFIG_SEQUENCE_RESET)
  const mutations = useCalibrationServiceMutations()
  const dialogs = useCalibrationServiceDetailDialogs()
  const permissions = useCalibrationServiceDetailPermissions(service, sequenceConfig)
  const { data: assignableMetrologists = [] } =
    useCalibrationAssignableMetrologists(permissions.canScheduleServiceRole)
  const data = getCalibrationServiceDetailData(service)
  const { canIssueOds, canScheduleService } = permissions
  const {
    isOdsDialogOpen,
    setIsOdsDialogOpen,
    isScheduleDialogOpen,
    setIsScheduleDialogOpen,
    setIsSequenceDialogOpen
  } = dialogs
  const requestedAction = searchParams.get('open')

  useEffect(() => {
    if (!canManageSequenceConfig || isLoadingSequenceConfig) {
      return
    }

    if (!sequenceConfig?.initialized) {
      setIsSequenceDialogOpen(true)
    }
  }, [
    canManageSequenceConfig,
    isLoadingSequenceConfig,
    sequenceConfig?.initialized
  ])

  useEffect(() => {
    if (requestedAction !== 'ods' || !canIssueOds || isOdsDialogOpen) {
      return
    }

    setIsOdsDialogOpen(true)
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('open')
    setSearchParams(nextSearchParams, { replace: true })
  }, [
    canIssueOds,
    isOdsDialogOpen,
    requestedAction,
    searchParams,
    setSearchParams
  ])

  useEffect(() => {
    if (
      requestedAction !== 'schedule' ||
      !canScheduleService ||
      isScheduleDialogOpen
    ) {
      return
    }

    setIsScheduleDialogOpen(true)
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('open')
    setSearchParams(nextSearchParams, { replace: true })
  }, [
    canScheduleService,
    isScheduleDialogOpen,
    requestedAction,
    searchParams,
    setSearchParams
  ])

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
    registerPhysicalTraceability,
    updateLogisticsControl,
    updateDeliverySignature,
    updateExecutionCustomer,
    createCut,
    createAdjustment,
    reviewAdjustment,
    sendAdjustmentToCustomer,
    respondAdjustment,
    updateCustomerSignature,
    markCutReadyForInvoicing,
    markCutInvoiced,
    registerCutPayment,
    updateCutDocumentControl,
    generateQuotePdf,
    generateOdsPdf,
    generateAdjustmentPdf,
    generateAdjustmentSummaryPdf,
    generateLogisticsPdf,
    generateTechnicalProgressPdf,
    sendLogisticsControlEmail,
    sendCertificate,
    downloadDocument,
    upsertSequenceConfig
  } = mutations
  const isDecisionLoading =
    requestApproval.isLoading ||
    approveService.isLoading ||
    rejectService.isLoading ||
    requestChanges.isLoading ||
    uploadDocument.isLoading
  const isOdsLoading = issueOds.isLoading || generateOdsPdf.isLoading
  const isOperationalBusy =
    scheduleService.isLoading ||
    rescheduleService.isLoading ||
    reassignService.isLoading ||
    pauseService.isLoading ||
    resumeService.isLoading ||
    cancelService.isLoading ||
    startExecution.isLoading ||
    completeExecution.isLoading ||
    updateItemProgress.isLoading ||
    updateLogisticsControl.isLoading ||
    registerPhysicalTraceability.isLoading ||
    createCut.isLoading ||
    createAdjustment.isLoading ||
    reviewAdjustment.isLoading ||
    sendAdjustmentToCustomer.isLoading ||
    sendLogisticsControlEmail.isLoading ||
    respondAdjustment.isLoading ||
    updateCustomerSignature.isLoading ||
    updateDeliverySignature.isLoading ||
    updateExecutionCustomer.isLoading ||
    markCutReadyForInvoicing.isLoading ||
    markCutInvoiced.isLoading ||
    registerCutPayment.isLoading ||
    updateCutDocumentControl.isLoading ||
    closeService.isLoading
  const isDocumentBusy =
    uploadDocument.isLoading ||
    generateQuotePdf.isLoading ||
    generateOdsPdf.isLoading ||
    generateAdjustmentPdf.isLoading ||
    generateAdjustmentSummaryPdf.isLoading ||
    generateLogisticsPdf.isLoading ||
    generateTechnicalProgressPdf.isLoading ||
    sendLogisticsControlEmail.isLoading ||
    downloadDocument.isLoading
  const busy: CalibrationServiceDetailBusy = {
    isDecisionLoading,
    isOdsLoading,
    isOperationalBusy,
    isDocumentBusy,
    isSendingCertificate: sendCertificate.isLoading,
    isUpdatingExecutionCustomer: updateExecutionCustomer.isLoading,
    isSavingSequenceConfig: upsertSequenceConfig.isLoading,
    isUpdatingDeliverySignature: updateDeliverySignature.isLoading,
    isUpdatingCustomerSignature: updateCustomerSignature.isLoading
  }

  const documentActions = useCalibrationServiceDocumentActions({ service, mutations })
  const documentViewer = useCalibrationServiceDocumentViewer(service.id)
  const workflowActions = useCalibrationServiceWorkflowActions({
    service,
    mutations,
    dialogs,
    setActiveTab,
    handleDownloadDocument: documentActions.handleDownloadDocument,
    operationsCompletionNotes: data.operationsCompletionNotes
  })
  const logisticsActions = useCalibrationServiceLogisticsActions({
    service,
    mutations,
    dialogs,
    setActiveTab,
    handleDownloadDocument: documentActions.handleDownloadDocument
  })
  const cutActions = useCalibrationServiceCutActions({
    service,
    mutations,
    dialogs,
    setActiveTab
  })
  const adjustmentActions = useCalibrationServiceAdjustmentActions({
    service,
    mutations,
    dialogs,
    setActiveTab
  })
  const actions: CalibrationServiceDetailActions = {
    ...documentActions,
    ...documentViewer,
    ...workflowActions,
    ...logisticsActions,
    ...cutActions,
    ...adjustmentActions
  }
  const {
    canReviewAdjustmentTechnically,
    canReviewAdjustmentCommercially,
    canUploadDocuments,
    canGenerateQuotePdf,
    canGenerateOdsPdf,
    isTechnicalOnlyView,
    hideFinancialInfo,
    allItemsOperationallyCompleted,
    canReportAdjustment,
    canReviewAdjustment,
    canUpdateOperationalProgress,
    canRegisterPhysicalTraceability,
    canManageLogisticsControl,
    canGenerateLogisticsPdf,
    canSendLogisticsEmail,
    canStillRegisterAdjustmentsAfterTechnicalCompletion,
    shouldShowPostTechnicalCompletionGuidance
  } = permissions
  const {
    logisticsHistory,
    logisticsControlSheet,
    deliveryName,
    deliveryRole,
    deliverySignatureData,
    decisionDocuments,
    adjustmentCustomerResponseDocuments,
    officialPdfDocuments,
    supportDocuments,
    customerSignatureData
  } = data
  const {
    setIsLogisticsControlDialogOpen,
    setIsPhysicalTraceabilityDialogOpen,
    setIsAdjustmentDialogOpen,
    setSelectedAdjustmentsForReview,
    setSelectedAdjustmentReviewStage,
    setSelectedAdjustmentsForCustomerResponse,
    setSelectedAdjustmentsForSend,
    setSendAdjustmentPreview
  } = dialogs
  const {
    handleUpdateDeliverySignature,
    handleSaveOperationalProgress,
    handleGenerateLogisticsPdf,
    handleOpenSendLogisticsEmail,
    handleUpdateCustomerSignature,
    handleDownloadDocument,
    handleGenerateQuotePdf,
    handleGenerateOdsPdf,
    handleGenerateAdjustmentPdf,
    handleGenerateTechnicalProgressPdf,
    handleGenerateAdjustmentSummaryPdf,
    handleUploadSupportDocument,
    handleViewDocument
  } = actions

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <CalibrationServiceDetailHeader
        service={service}
        permissions={permissions}
        data={data}
        dialogs={dialogs}
        actions={actions}
        busy={busy}
      />

      {canManageSequenceConfig && sequenceConfig ? (
        <Alert
          severity={sequenceConfig.initialized ? 'info' : 'warning'}
          sx={{ mb: 2 }}
          action={
            <Button
              color='inherit'
              size='small'
              onClick={() => setIsSequenceDialogOpen(true)}
            >
              Configurar
            </Button>
          }
        >
          {sequenceConfig.initialized
            ? 'Puedes ajustar el metrólogo de laboratorio y los consecutivos desde la configuración.'
            : 'Antes de emitir la primera ODS, define el consecutivo inicial de oferta y ODS para este módulo.'}
        </Alert>
      ) : null}

      {isTechnicalOnlyView ? (
        <Alert severity='info' sx={{ mb: 2 }}>
          Vista técnica activa: aquí solo ves la ODS, el semáforo y los
          datos operativos del servicio.
        </Alert>
      ) : null}
      <CalibrationServiceStageTracker
        status={service.status}
        sla={service.slaIndicator}
        technicalOnly={isTechnicalOnlyView}
      />

      <Grid container spacing={2}>
        <Grid item xs={12} lg={9}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Tabs
                value={activeTab}
                onChange={(_, value: DetailTab) => setActiveTab(value)}
                variant='scrollable'
                allowScrollButtonsMobile
                sx={{
                  mb: 2,
                  borderBottom: '1px solid #e5e7eb',
                  '& .MuiTabs-indicator': { backgroundColor: '#00BFA5', height: 3 },
                  '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minWidth: 0, px: 1.1, fontSize: '0.85rem' },
                  '& .Mui-selected': { color: '#00695C' }
                }}
              >
                <Tab label='Resumen' value='summary' />
                <Tab
                  label={`Ítems (${service.items?.length || 0})`}
                  value='items'
                />
                <Tab label='Operación' value='operations' />
                <Tab
                  label={`Novedades (${service.adjustments?.length || 0})`}
                  value='adjustments'
                />
                <Tab
                  label={`Cortes (${service.cuts?.length || 0})`}
                  value='cuts'
                />
                <Tab
                  label={`Documentos (${service.documents?.length || 0})`}
                  value='documents'
                />
                <Tab label='Logística' value='logistics' />
                <Tab
                  label={`Historial (${service.events?.length || 0})`}
                  value='history'
                />
                <Tab label='Guía' value='guide' />
              </Tabs>

              <DetailTabPanel value={activeTab} tab='summary'>
                <CalibrationServiceSummaryTab
                  service={service}
                  permissions={permissions}
                  data={data}
                  dialogs={dialogs}
                />
              </DetailTabPanel>

              <DetailTabPanel value={activeTab} tab='items'>
                <CalibrationServiceItemsTab
                  service={service}
                  permissions={permissions}
                />
              </DetailTabPanel>

              <DetailTabPanel value={activeTab} tab='operations'>
                {service.odsCode ? (
                  <>
                    {service.status === 'in_execution' &&
                    !allItemsOperationallyCompleted ? (
                      <Alert severity='info' sx={{ mb: 2 }}>
                        Para finalizar la ejecución técnica, primero marca todos
                        los ítems como
                        <strong> Completado</strong>.
                      </Alert>
                    ) : null}
                    {shouldShowPostTechnicalCompletionGuidance ? (
                      <Alert severity='success' sx={{ mb: 2 }}>
                        El servicio ya quedó{' '}
                        <strong>finalizado técnicamente</strong>. Aún puedes
                        registrar novedades si apareció alguna diferencia final,
                        y después sacar el corte parcial o final según lo que
                        realmente vaya a salir.
                      </Alert>
                    ) : null}
                    <CalibrationServiceOperationsPanel
                      service={service}
                      canEditProgress={canUpdateOperationalProgress}
                      isBusy={isOperationalBusy}
                      onSaveProgress={handleSaveOperationalProgress}
                      onGenerateProgressPdf={handleGenerateTechnicalProgressPdf}
                      isGeneratingProgressPdf={isDocumentBusy}
                      deliveryName={deliveryName}
                      deliveryRole={deliveryRole}
                      deliverySignatureData={deliverySignatureData}
                      onUpdateDeliverySignature={handleUpdateDeliverySignature}
                      isUpdatingDeliverySignature={updateDeliverySignature.isLoading}
                    />
                  </>
                ) : (
                  <Alert severity='info'>
                    La vista operativa se habilita una vez la ODS ha sido
                    emitida.
                  </Alert>
                )}
              </DetailTabPanel>

              <DetailTabPanel value={activeTab} tab='adjustments'>
                {canStillRegisterAdjustmentsAfterTechnicalCompletion ? (
                  <Alert severity='info' sx={{ mb: 2 }}>
                    Aunque la ejecución ya terminó, todavía puedes registrar
                    novedades para dejar trazabilidad de diferencias finales
                    antes de sacar el corte administrativo.
                  </Alert>
                ) : null}
                <CalibrationServiceAdjustmentsPanel
                  service={service}
                  canReport={canReportAdjustment}
                  canTechnicalReview={canReviewAdjustmentTechnically}
                  canCommercialReview={canReviewAdjustmentCommercially}
                  canGenerateDocument={canReviewAdjustment}
                  canGenerateSummaryDocument={canReviewAdjustment}
                  hideFinancialInfo={hideFinancialInfo}
                  isBusy={isOperationalBusy}
                  onCreate={() => setIsAdjustmentDialogOpen(true)}
                  onReview={(adjustments, reviewStage) => {
                    setSelectedAdjustmentsForReview(adjustments)
                    setSelectedAdjustmentReviewStage(reviewStage)
                  }}
                  onSendToCustomer={(adjustments) => {
                    setSelectedAdjustmentsForSend(adjustments)
                    setSendAdjustmentPreview(
                      getEmailSendPreview(
                        service.contactEmail,
                        service.customer?.email
                      )
                    )
                  }}
                  onRegisterCustomerResponse={(adjustments) =>
                    setSelectedAdjustmentsForCustomerResponse(adjustments)
                  }
                  onGenerateDocument={handleGenerateAdjustmentPdf}
                  onGenerateSummaryDocument={handleGenerateAdjustmentSummaryPdf}
                  customerSignatureData={customerSignatureData}
                  onUpdateCustomerSignature={handleUpdateCustomerSignature}
                  isUpdatingSignature={updateCustomerSignature.isLoading}
                />
              </DetailTabPanel>

              <DetailTabPanel value={activeTab} tab='cuts'>
                <CalibrationServiceCutsTab
                  service={service}
                  permissions={permissions}
                  data={data}
                  dialogs={dialogs}
                  actions={actions}
                  busy={busy}
                  setActiveTab={setActiveTab}
                />
              </DetailTabPanel>

              <DetailTabPanel value={activeTab} tab='documents'>
                <CalibrationServiceDocumentsPanel
                  serviceCode={service.serviceCode}
                  hasCustomer={Boolean(service.customerId)}
                  hasItems={Boolean(service.items?.length)}
                  hasOds={Boolean(service.odsCode)}
                  canUploadDocuments={canUploadDocuments}
                  canGenerateQuotePdf={canGenerateQuotePdf}
                  canGenerateOdsPdf={canGenerateOdsPdf}
                  officialPdfDocuments={officialPdfDocuments || []}
                  adjustmentCustomerResponseDocuments={
                    adjustmentCustomerResponseDocuments || []
                  }
                  supportDocuments={supportDocuments || []}
                  decisionDocuments={decisionDocuments || []}
                  isBusy={isDocumentBusy}
                  onGenerateQuotePdf={handleGenerateQuotePdf}
                  onGenerateOdsPdf={handleGenerateOdsPdf}
                  onDownloadDocument={handleDownloadDocument}
                  onViewDocument={handleViewDocument}
                  onUploadDocument={handleUploadSupportDocument}
                />
              </DetailTabPanel>

              <DetailTabPanel value={activeTab} tab='logistics'>
                <CalibrationServiceLogisticsPanel
                  controlSheet={logisticsControlSheet}
                  entries={logisticsHistory}
                  canManageControl={canManageLogisticsControl}
                  canRegisterMovement={canRegisterPhysicalTraceability}
                  canGeneratePdf={canGenerateLogisticsPdf}
                  canSendEmail={canSendLogisticsEmail}
                  isBusy={isOperationalBusy}
                  onEditControl={() => setIsLogisticsControlDialogOpen(true)}
                  onRegisterMovement={() =>
                    setIsPhysicalTraceabilityDialogOpen(true)
                  }
                  onGeneratePdf={handleGenerateLogisticsPdf}
                  onSendEmail={handleOpenSendLogisticsEmail}
                  deliveryAction={
                    <CalibrationDeliveryReadyAction
                      service={service}
                      canManage={canManageLogisticsControl}
                    />
                  }
                />
              </DetailTabPanel>

              <DetailTabPanel value={activeTab} tab='guide'>
                <CalibrationServiceGuidePanel slaConfig={slaConfig} />
              </DetailTabPanel>

              <DetailTabPanel value={activeTab} tab='history'>
                <CalibrationServiceTimeline events={service.events || []} />
              </DetailTabPanel>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={3}>
          <CalibrationServiceCompactSummary
            service={service}
            permissions={permissions}
            data={data}
          />
        </Grid>
      </Grid>
      <CalibrationServiceDetailDialogsHost
        service={service}
        data={data}
        dialogs={dialogs}
        actions={actions}
        busy={busy}
        assignableMetrologists={assignableMetrologists}
        sequenceConfig={sequenceConfig}
        canManageSequenceConfig={canManageSequenceConfig}
        canResetSequence={canResetSequence}
      />
    </Container>
  )
}

export default CalibrationServiceDetailsView
