import {
  Alert,
  Box,
  Button,
  Stack,
  Typography
} from '@mui/material'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import { CALIBRATION_SERVICE_ADJUSTMENT_STATUS_LABELS } from '../../../constants/calibrationServices'
import { CalibrationService } from '../../../types/calibrationService'
import CalibrationServiceCutsPanel from '../CalibrationServiceCutsPanel'
import { BlockedActionTooltip } from './CalibrationServiceDetailLayout'
import { DetailTab } from './calibrationServiceDetailUtils'
import {
  CalibrationServiceDetailPermissions,
  CalibrationServiceDetailData,
  CalibrationServiceDetailDialogs,
  CalibrationServiceDetailActions,
  CalibrationServiceDetailBusy
} from './calibrationServiceDetailTypes'

interface CalibrationServiceCutsTabProps {
  service: CalibrationService
  permissions: CalibrationServiceDetailPermissions
  data: CalibrationServiceDetailData
  dialogs: CalibrationServiceDetailDialogs
  actions: CalibrationServiceDetailActions
  busy: CalibrationServiceDetailBusy
  setActiveTab: (tab: DetailTab) => void
}

/** Pestaña Cortes: acciones, avisos del siguiente paso y listado de cortes. */
const CalibrationServiceCutsTab = ({
  service,
  permissions,
  data,
  dialogs,
  actions,
  busy,
  setActiveTab
}: CalibrationServiceCutsTabProps) => {
  const {
    hasReleasableItems,
    canCreateCut,
    showCreateCut,
    createCutBlockedReason,
    showTechnicalProgressPdf,
    canMarkCutReady,
    canInvoiceCuts,
    canRegisterPayment,
    canUpdateDocumentControl,
    allCutsSent,
    shouldShowCutsNextStepGuidance
  } = permissions
  const { blockingAdjustments } = data
  const {
    setIsCutDialogOpen,
    setSelectedCutForInvoice,
    setSelectedCutForPayment,
    setSelectedCutForDocumentControl
  } = dialogs
  const {
    handleMarkCutReady,
    handleGenerateTechnicalProgressPdf
  } = actions
  const {
    isOperationalBusy,
    isDocumentBusy
  } = busy

  return (
    <>
      {showCreateCut || showTechnicalProgressPdf ? (
        <Stack
          direction='row'
          spacing={1}
          justifyContent='flex-end'
          flexWrap='wrap'
          useFlexGap
          sx={{ mb: 2 }}
        >
          {showTechnicalProgressPdf ? (
            <Button
              variant='outlined'
              startIcon={<PictureAsPdfOutlinedIcon />}
              onClick={() => void handleGenerateTechnicalProgressPdf()}
              disabled={isDocumentBusy}
              sx={{ borderRadius: 2 }}
            >
              Anexo de avance técnico
            </Button>
          ) : null}
          {showCreateCut ? (
            <BlockedActionTooltip reason={createCutBlockedReason}>
              <Button
                variant='contained'
                startIcon={<DescriptionOutlinedIcon />}
                onClick={() => setIsCutDialogOpen(true)}
                disabled={isOperationalBusy || !canCreateCut}
                disableElevation
                sx={{ borderRadius: 2 }}
              >
                Nuevo corte
              </Button>
            </BlockedActionTooltip>
          ) : null}
        </Stack>
      ) : null}
      {shouldShowCutsNextStepGuidance ? (
        <Alert severity='info' sx={{ mb: 2 }}>
          El servicio ya terminó técnicamente y todavía no tiene
          cortes. Este es el paso para definir qué sale ahora: puedes
          crear un corte parcial si quedan pendientes, o un corte
          final si todo ya está listo.
        </Alert>
      ) : null}
      {service.status === 'technically_completed' &&
      allCutsSent &&
      hasReleasableItems ? (
        <Alert severity='warning' sx={{ mb: 2 }}>
          Los cortes existentes ya fueron enviados, pero todavía hay
          cantidades aprobadas pendientes por liberar. Crea un nuevo
          corte para esas cantidades antes del cierre final.
        </Alert>
      ) : null}
      {service.status === 'technically_completed' &&
      allCutsSent &&
      !hasReleasableItems ? (
        <Alert severity='success' sx={{ mb: 2 }}>
          Todos los cortes ya están enviados. El servicio quedó listo
          para
          <strong> cierre final</strong>.
        </Alert>
      ) : null}
      {blockingAdjustments.length ? (
        <Alert
          severity='warning'
          sx={{ mb: 2, '& .MuiAlert-message': { overflow: 'visible' } }}
          action={
            <Button
              color='inherit'
              size='small'
              sx={{ whiteSpace: 'nowrap' }}
              onClick={() => setActiveTab('adjustments')}
            >
              Ver novedades
            </Button>
          }
        >
          <Typography variant='body2' fontWeight={700}>
            {blockingAdjustments.length === 1
              ? 'Hay 1 novedad por resolver antes de dejar un corte listo para facturar:'
              : `Hay ${blockingAdjustments.length} novedades por resolver antes de dejar un corte listo para facturar:`}
          </Typography>
          <Box component='ul' sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
            {blockingAdjustments.slice(0, 5).map((adjustment) => (
              <li key={adjustment.id}>
                <Typography variant='body2'>
                  {adjustment.itemName} ·{' '}
                  {
                    CALIBRATION_SERVICE_ADJUSTMENT_STATUS_LABELS[
                      adjustment.status
                    ]
                  }
                </Typography>
              </li>
            ))}
            {blockingAdjustments.length > 5 ? (
              <li>
                <Typography variant='body2'>
                  y {blockingAdjustments.length - 5} más
                </Typography>
              </li>
            ) : null}
          </Box>
        </Alert>
      ) : null}
      <CalibrationServiceCutsPanel
        cuts={service.cuts || []}
        canMarkReady={canMarkCutReady}
        canMarkInvoiced={canInvoiceCuts}
        canRegisterPayment={canRegisterPayment}
        canUpdateDocumentControl={canUpdateDocumentControl}
        serviceId={service.id}
        canCorrectCuts={
          !service.isPaused &&
          service.status !== 'closed' &&
          service.status !== 'cancelled'
        }
        isBusy={isOperationalBusy}
        onMarkReady={handleMarkCutReady}
        onMarkInvoiced={(cut) => setSelectedCutForInvoice(cut)}
        onRegisterPayment={(cut) => setSelectedCutForPayment(cut)}
        onUpdateDocumentControl={(cut) =>
          setSelectedCutForDocumentControl(cut)
        }
      />
    </>
  )
}

export default CalibrationServiceCutsTab
