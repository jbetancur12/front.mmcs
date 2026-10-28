import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import {
  CalibrationService,
  CalibrationServiceSequenceConfig,
  CalibrationServiceUserSummary
} from '../../../types/calibrationService'
import PDFViewer from '../../../Components/PDFViewer'
import CalibrationServiceAdjustmentDialog from '../CalibrationServiceAdjustmentDialog'
import CalibrationServiceAdjustmentReviewDialog from '../CalibrationServiceAdjustmentReviewDialog'
import CalibrationServiceAdjustmentCustomerResponseDialog from '../CalibrationServiceAdjustmentCustomerResponseDialog'
import CalibrationServiceSendAdjustmentToCustomerDialog from '../CalibrationServiceSendAdjustmentToCustomerDialog'
import CalibrationServiceApprovalDialog from '../CalibrationServiceApprovalDialog'
import CalibrationServiceOdsDialog from '../CalibrationServiceOdsDialog'
import CalibrationServiceCutDialog from '../CalibrationServiceCutDialog'
import CalibrationServiceCutDocumentControlDialog from '../CalibrationServiceCutDocumentControlDialog'
import CalibrationServiceCutInvoiceDialog from '../CalibrationServiceCutInvoiceDialog'
import CalibrationServiceCutPaymentDialog from '../CalibrationServiceCutPaymentDialog'
import CalibrationServiceScheduleDialog from '../CalibrationServiceScheduleDialog'
import CalibrationServiceSequenceConfigDialog from '../CalibrationServiceSequenceConfigDialog'
import CalibrationServiceRescheduleDialog from '../CalibrationServiceRescheduleDialog'
import CalibrationServiceReassignDialog from '../CalibrationServiceReassignDialog'
import CalibrationServicePauseDialog from '../CalibrationServicePauseDialog'
import CalibrationServicePhysicalTraceabilityDialog from '../CalibrationServicePhysicalTraceabilityDialog'
import CalibrationServiceLogisticsControlDialog from '../CalibrationServiceLogisticsControlDialog'
import CalibrationServiceSendLogisticsEmailDialog from '../CalibrationServiceSendLogisticsEmailDialog'
import { primaryActionSx } from './calibrationServiceDetailUtils'
import {
  CalibrationServiceDetailData,
  CalibrationServiceDetailDialogs,
  CalibrationServiceDetailActions,
  CalibrationServiceDetailBusy
} from './calibrationServiceDetailTypes'

interface CalibrationServiceDetailDialogsHostProps {
  service: CalibrationService
  data: CalibrationServiceDetailData
  dialogs: CalibrationServiceDetailDialogs
  actions: CalibrationServiceDetailActions
  busy: CalibrationServiceDetailBusy
  assignableMetrologists: CalibrationServiceUserSummary[]
  sequenceConfig: CalibrationServiceSequenceConfig | undefined
  canManageSequenceConfig: boolean
  canResetSequence: boolean
}

/** Diálogos del detalle del servicio (aprobación, ODS, programación, cortes, novedades, etc.). */
const CalibrationServiceDetailDialogsHost = ({
  service,
  data,
  dialogs,
  actions,
  busy,
  assignableMetrologists,
  sequenceConfig,
  canManageSequenceConfig,
  canResetSequence
}: CalibrationServiceDetailDialogsHostProps) => {
  const {
    odsDialogInitialValues,
    scheduleDialogInitialValues,
    rescheduleDialogInitialValues,
    reassignDialogInitialValues,
    physicalTraceabilityInitialValues,
    logisticsControlInitialValues
  } = data
  const {
    decisionMode,
    setDecisionMode,
    isOdsDialogOpen,
    setIsOdsDialogOpen,
    isScheduleDialogOpen,
    setIsScheduleDialogOpen,
    isRescheduleDialogOpen,
    setIsRescheduleDialogOpen,
    isReassignDialogOpen,
    setIsReassignDialogOpen,
    isPauseDialogOpen,
    setIsPauseDialogOpen,
    isResumeDialogOpen,
    setIsResumeDialogOpen,
    isCancelDialogOpen,
    setIsCancelDialogOpen,
    isLogisticsControlDialogOpen,
    setIsLogisticsControlDialogOpen,
    isSendLogisticsEmailDialogOpen,
    setIsSendLogisticsEmailDialogOpen,
    sendLogisticsPreview,
    setSendLogisticsPreview,
    isPhysicalTraceabilityDialogOpen,
    setIsPhysicalTraceabilityDialogOpen,
    isCutDialogOpen,
    setIsCutDialogOpen,
    isAdjustmentDialogOpen,
    setIsAdjustmentDialogOpen,
    isSequenceDialogOpen,
    setIsSequenceDialogOpen,
    isCloseDialogOpen,
    setIsCloseDialogOpen,
    isExecutionCustomerDialogOpen,
    setIsExecutionCustomerDialogOpen,
    executionCustomerDraft,
    setExecutionCustomerDraft,
    executionSiteDraft,
    setExecutionSiteDraft,
    selectedCutForInvoice,
    setSelectedCutForInvoice,
    selectedCutForPayment,
    setSelectedCutForPayment,
    selectedCutForDocumentControl,
    setSelectedCutForDocumentControl,
    selectedAdjustmentsForReview,
    setSelectedAdjustmentsForReview,
    selectedAdjustmentReviewStage,
    setSelectedAdjustmentReviewStage,
    selectedAdjustmentsForCustomerResponse,
    setSelectedAdjustmentsForCustomerResponse,
    selectedAdjustmentsForSend,
    setSelectedAdjustmentsForSend,
    sendAdjustmentPreview,
    setSendAdjustmentPreview
  } = dialogs
  const {
    handleDecisionSubmit,
    handleIssueOds,
    handleScheduleService,
    handleRescheduleService,
    handleReassignService,
    handlePauseService,
    handleResumeService,
    handleCancelService,
    handleCloseService,
    handleSaveExecutionCustomer,
    handleSaveSequenceConfig,
    handleRegisterPhysicalTraceability,
    handleSaveLogisticsControl,
    handleSendLogisticsEmail,
    handleCreateCut,
    handleMarkCutInvoiced,
    handleRegisterCutPayment,
    handleUpdateCutDocumentControl,
    handleCreateAdjustment,
    handleReviewAdjustment,
    handleSendAdjustmentToCustomer,
    handleRegisterAdjustmentCustomerResponse,
    viewDocumentId,
    viewDocumentFileName,
    viewDocumentBlobUrl,
    viewDocumentIsImage,
    handleCloseViewDocument
  } = actions
  const {
    isDecisionLoading,
    isOdsLoading,
    isOperationalBusy,
    isUpdatingExecutionCustomer,
    isSavingSequenceConfig
  } = busy

  return (
    <>
      {decisionMode ? (
        <CalibrationServiceApprovalDialog
          open={Boolean(decisionMode)}
          mode={decisionMode}
          serviceCode={service.serviceCode}
          isLoading={isDecisionLoading}
          onClose={() => setDecisionMode(null)}
          onSubmit={handleDecisionSubmit}
        />
      ) : null}
      {isOdsDialogOpen ? (
        <CalibrationServiceOdsDialog
          open={isOdsDialogOpen}
          serviceCode={service.serviceCode}
          initialValues={odsDialogInitialValues}
          isLoading={isOdsLoading}
          isLabCalibration={service.onSiteCalibration === false}
          onClose={() => setIsOdsDialogOpen(false)}
          onSubmit={handleIssueOds}
        />
      ) : null}
      {isScheduleDialogOpen ? (
        <CalibrationServiceScheduleDialog
          open={isScheduleDialogOpen}
          serviceCode={service.serviceCode}
          initialValues={scheduleDialogInitialValues}
          metrologists={assignableMetrologists}
          isLoading={isOperationalBusy}
          onClose={() => setIsScheduleDialogOpen(false)}
          onSubmit={handleScheduleService}
        />
      ) : null}
      {isRescheduleDialogOpen ? (
        <CalibrationServiceRescheduleDialog
          open={isRescheduleDialogOpen}
          serviceCode={service.serviceCode}
          initialValues={rescheduleDialogInitialValues}
          isLoading={isOperationalBusy}
          onClose={() => setIsRescheduleDialogOpen(false)}
          onSubmit={handleRescheduleService}
        />
      ) : null}
      {isReassignDialogOpen ? (
        <CalibrationServiceReassignDialog
          open={isReassignDialogOpen}
          serviceCode={service.serviceCode}
          initialValues={reassignDialogInitialValues}
          metrologists={assignableMetrologists}
          isLoading={isOperationalBusy}
          onClose={() => setIsReassignDialogOpen(false)}
          onSubmit={handleReassignService}
        />
      ) : null}
      {isPauseDialogOpen ? (
        <CalibrationServicePauseDialog
          open={isPauseDialogOpen}
          title='Pausar servicio'
          subtitle='La pausa detiene el avance operativo y administrativo hasta que el servicio sea reanudado.'
          fieldLabel='Motivo de pausa o suspensión'
          actionLabel='Pausar'
          initialValues={{ notes: service.pauseReason || '' }}
          isLoading={isOperationalBusy}
          onClose={() => setIsPauseDialogOpen(false)}
          onSubmit={handlePauseService}
        />
      ) : null}
      {isResumeDialogOpen ? (
        <CalibrationServicePauseDialog
          open={isResumeDialogOpen}
          title='Reanudar servicio'
          subtitle='Registra por qué el servicio vuelve al flujo activo y retoma su seguimiento.'
          fieldLabel='Observación de reanudación'
          actionLabel='Reanudar'
          initialValues={{ notes: '' }}
          isLoading={isOperationalBusy}
          onClose={() => setIsResumeDialogOpen(false)}
          onSubmit={handleResumeService}
        />
      ) : null}
      {isCancelDialogOpen ? (
        <CalibrationServicePauseDialog
          open={isCancelDialogOpen}
          title='Cancelar servicio'
          subtitle='La cancelación formal saca el servicio del flujo. Úsala cuando el caso ya no vaya a ejecutarse.'
          fieldLabel='Motivo de cancelación'
          actionLabel='Cancelar servicio'
          initialValues={{ notes: '' }}
          isLoading={isOperationalBusy}
          onClose={() => setIsCancelDialogOpen(false)}
          onSubmit={handleCancelService}
        />
      ) : null}
      {isLogisticsControlDialogOpen ? (
        <CalibrationServiceLogisticsControlDialog
          open={isLogisticsControlDialogOpen}
          serviceId={String(service.id)}
          serviceCode={service.serviceCode}
          initialValues={logisticsControlInitialValues}
          isLoading={isOperationalBusy}
          onClose={() => setIsLogisticsControlDialogOpen(false)}
          onSubmit={handleSaveLogisticsControl}
        />
      ) : null}
      {isSendLogisticsEmailDialogOpen ? (
        <CalibrationServiceSendLogisticsEmailDialog
          open={isSendLogisticsEmailDialogOpen}
          service={service}
          isLoading={isOperationalBusy}
          sendPreview={sendLogisticsPreview}
          onClose={() => {
            setIsSendLogisticsEmailDialogOpen(false)
            setSendLogisticsPreview(null)
          }}
          onSubmit={handleSendLogisticsEmail}
        />
      ) : null}
      {isPhysicalTraceabilityDialogOpen ? (
        <CalibrationServicePhysicalTraceabilityDialog
          open={isPhysicalTraceabilityDialogOpen}
          serviceCode={service.serviceCode}
          initialValues={physicalTraceabilityInitialValues}
          isLoading={isOperationalBusy}
          onClose={() => setIsPhysicalTraceabilityDialogOpen(false)}
          onSubmit={handleRegisterPhysicalTraceability}
        />
      ) : null}
      {isCutDialogOpen ? (
        <CalibrationServiceCutDialog
          open={isCutDialogOpen}
          service={service}
          isLoading={isOperationalBusy}
          onClose={() => setIsCutDialogOpen(false)}
          onSubmit={handleCreateCut}
        />
      ) : null}
      {selectedCutForInvoice ? (
        <CalibrationServiceCutInvoiceDialog
          open={Boolean(selectedCutForInvoice)}
          cut={selectedCutForInvoice}
          isLoading={isOperationalBusy}
          onClose={() => setSelectedCutForInvoice(null)}
          onSubmit={handleMarkCutInvoiced}
        />
      ) : null}
      {selectedCutForPayment ? (
        <CalibrationServiceCutPaymentDialog
          open={Boolean(selectedCutForPayment)}
          cut={selectedCutForPayment}
          isLoading={isOperationalBusy}
          onClose={() => setSelectedCutForPayment(null)}
          onConfirm={handleRegisterCutPayment}
        />
      ) : null}
      {selectedCutForDocumentControl ? (
        <CalibrationServiceCutDocumentControlDialog
          open={Boolean(selectedCutForDocumentControl)}
          cut={selectedCutForDocumentControl}
          isLoading={isOperationalBusy}
          onClose={() => setSelectedCutForDocumentControl(null)}
          onSubmit={handleUpdateCutDocumentControl}
        />
      ) : null}
      {isAdjustmentDialogOpen ? (
        <CalibrationServiceAdjustmentDialog
          open={isAdjustmentDialogOpen}
          service={service}
          isLoading={isOperationalBusy}
          onClose={() => setIsAdjustmentDialogOpen(false)}
          onSubmit={handleCreateAdjustment}
        />
      ) : null}
      <Dialog
        open={isCloseDialogOpen}
        onClose={
          isOperationalBusy ? undefined : () => setIsCloseDialogOpen(false)
        }
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Cerrar servicio</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            <Typography variant='body1'>
              ¿Deseas cerrar definitivamente el servicio{' '}
              <strong>{service.serviceCode}</strong>?
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Este paso deja el servicio como cerrado, sin acciones operativas o
              documentales pendientes dentro del módulo.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsCloseDialogOpen(false)}
            disabled={isOperationalBusy}
          >
            Cancelar
          </Button>
          <Button
            variant='contained'
            disableElevation
            onClick={() => void handleCloseService()}
            disabled={isOperationalBusy}
            sx={primaryActionSx}
          >
            Confirmar cierre
          </Button>
        </DialogActions>
      </Dialog>
      {selectedAdjustmentsForReview.length > 0 ? (
        <CalibrationServiceAdjustmentReviewDialog
          open={selectedAdjustmentsForReview.length > 0}
          adjustments={selectedAdjustmentsForReview}
          reviewStage={selectedAdjustmentReviewStage}
          isLoading={isOperationalBusy}
          onClose={() => {
            setSelectedAdjustmentsForReview([])
            setSelectedAdjustmentReviewStage('technical')
          }}
          onSubmit={handleReviewAdjustment}
        />
      ) : null}
      {selectedAdjustmentsForSend.length > 0 ? (
        <CalibrationServiceSendAdjustmentToCustomerDialog
          open={selectedAdjustmentsForSend.length > 0}
          service={service}
          adjustments={selectedAdjustmentsForSend}
          isLoading={isOperationalBusy}
          sendPreview={sendAdjustmentPreview}
          onClose={() => {
            setSelectedAdjustmentsForSend([])
            setSendAdjustmentPreview(null)
          }}
          onSubmit={handleSendAdjustmentToCustomer}
        />
      ) : null}
      {selectedAdjustmentsForCustomerResponse.length > 0 ? (
        <CalibrationServiceAdjustmentCustomerResponseDialog
          open={selectedAdjustmentsForCustomerResponse.length > 0}
          adjustments={selectedAdjustmentsForCustomerResponse}
          isLoading={isOperationalBusy}
          onClose={() => setSelectedAdjustmentsForCustomerResponse([])}
          onSubmit={handleRegisterAdjustmentCustomerResponse}
        />
      ) : null}
      {canManageSequenceConfig ? (
        <CalibrationServiceSequenceConfigDialog
          open={isSequenceDialogOpen}
          isLoading={isSavingSequenceConfig}
          config={sequenceConfig}
          canResetSequence={canResetSequence}
          onClose={() => setIsSequenceDialogOpen(false)}
          onSubmit={handleSaveSequenceConfig}
        />
      ) : null}
      <Dialog
        open={isExecutionCustomerDialogOpen}
        onClose={() => setIsExecutionCustomerDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Cliente de ejecución</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Typography variant='body2' color='text.secondary'>
              Define o actualiza el cliente y sede donde realmente se presta el
              servicio.
            </Typography>
            <TextField
              fullWidth
              label='Cliente de ejecución'
              value={executionCustomerDraft}
              onChange={(e) => setExecutionCustomerDraft(e.target.value)}
              helperText='Nombre del cliente donde se ejecuta el servicio'
            />
            <TextField
              fullWidth
              label='Sede o referencia de ejecución'
              value={executionSiteDraft}
              onChange={(e) => setExecutionSiteDraft(e.target.value)}
              helperText='Sede, dirección o referencia del lugar de ejecución'
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsExecutionCustomerDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant='contained'
            onClick={() =>
              void handleSaveExecutionCustomer({
                executionCustomerName:
                  executionCustomerDraft.trim() || null,
                executionSiteName: executionSiteDraft.trim() || null
              })
            }
            disabled={isUpdatingExecutionCustomer}
            disableElevation
            sx={primaryActionSx}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={Boolean(viewDocumentId)}
        onClose={handleCloseViewDocument}
        maxWidth='lg'
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='center'
          >
            <Typography variant='h6' fontWeight={700}>
              {viewDocumentFileName}
            </Typography>
            <IconButton onClick={handleCloseViewDocument} size='small'>
              <CloseOutlinedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {viewDocumentBlobUrl && viewDocumentIsImage ? (
            <Box
              component='img'
              src={viewDocumentBlobUrl}
              alt={viewDocumentFileName}
              sx={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            />
          ) : viewDocumentId && !viewDocumentIsImage ? (
            <Box sx={{ flex: 1, width: '100%' }}>
              <PDFViewer
                view='preview'
                buttons
                downloadUrl={`/calibration-services/${service.id}/documents/${viewDocumentId}/download`}
              />
            </Box>
          ) : (
            <Typography color='text.secondary'>Cargando vista previa...</Typography>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CalibrationServiceDetailDialogsHost
