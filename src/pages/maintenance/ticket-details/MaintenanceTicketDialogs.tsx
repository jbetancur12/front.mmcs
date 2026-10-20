import {
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  LinearProgress
} from '@mui/material'
import {
  Error,
  Warning,
  Info,
  Download
} from '@mui/icons-material'
import { MaintenanceTicket } from '../../../types/maintenance'
import CompletionCostsDialog from '../../../Components/Maintenance/CompletionCostsDialog'
import MaintenanceSignaturesDialog from '../../../Components/Maintenance/MaintenanceSignaturesDialog'
import MaintenanceTechnicalReportDialog from '../../../Components/Maintenance/MaintenanceTechnicalReportDialog'
import CostsListDialog from 'src/Components/Maintenance/CostsList'
import { maintenanceSignaturesEnabled } from '../../../features/maintenanceFlags'
import {
  getFileDisplayName,
  getFilePreviewType
} from './maintenanceTicketDetailUtils'
import { MaintenanceTicketDetailsState } from './useMaintenanceTicketDetails'

interface MaintenanceTicketDialogsProps {
  ticket: MaintenanceTicket
  details: MaintenanceTicketDetailsState
}

/** Barra de carga, vista previa de archivos, confirmación, diálogos de cierre/firmas/costos/informe técnico y avisos. */
const MaintenanceTicketDialogs = ({ ticket, details }: MaintenanceTicketDialogsProps) => {
  const {
    isMobile,
    isTechnician,
    updateTicketMutation,
    upsertTechnicalReportMutation,
    addCommentMutation,
    uploadFilesMutation,
    deleteFileMutation,
    updateTechnicianMutation,
    generateTechnicalReportMutation,
    handleCompleteWithCosts,
    handleInvoice,
    handleSavePendingSignatures,
    handleGenerateTechnicalReport,
    handleSaveTechnicalReport,
    costsDialogOpen,
    setCostsDialogOpen,
    signaturesDialogOpen,
    setSignaturesDialogOpen,
    briefCostsDialogOpen,
    setBriefCostsDialogOpen,
    technicalReportDialogOpen,
    setTechnicalReportDialogOpen,
    ticketLoading,
    currentTechnician,
    timelineLoading,
    technicalReport,
    technicalReportLoading,
    closeConfirmDialog,
    closeToast,
    confirmDialog,
    toast,
    handleClosePreview,
    handleDownloadPreviewFile,
    previewOpen,
    previewFile,
    previewUrl,
    previewLoading,
    previewError,
    setEditData
  } = details

  return (
    <>
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
        <DialogTitle>
          {previewFile ? getFileDisplayName(previewFile) : 'Vista previa'}
        </DialogTitle>
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
                Este tipo de archivo no tiene vista previa inline. Puedes
                descargarlo si lo necesitas.
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
          currentTicketTechnicianSignature={
            ticket?.technicianSignatureData || null
          }
          currentCustomerSignerName={
            ticket?.customerSignerName || ticket?.customerName || ''
          }
          currentCustomerSignature={ticket?.customerSignatureData || null}
          canCaptureTechnicianSignature={
            !(
              currentTechnician?.signatureData ||
              ticket?.assignedTechnician?.signatureData ||
              ticket?.technicianSignatureData
            )
          }
          loading={
            updateTicketMutation.isLoading ||
            updateTechnicianMutation.isLoading
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
    </>
  )
}

export default MaintenanceTicketDialogs
