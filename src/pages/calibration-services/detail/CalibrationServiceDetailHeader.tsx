import {
  Box,
  Button,
  Chip,
  Menu,
  MenuItem,
  Stack,
  Typography
} from '@mui/material'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import EventOutlinedIcon from '@mui/icons-material/EventOutlined'
import EventRepeatOutlinedIcon from '@mui/icons-material/EventRepeatOutlined'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import PauseCircleOutlineOutlinedIcon from '@mui/icons-material/PauseCircleOutlineOutlined'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined'
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined'
import NoteAddOutlinedIcon from '@mui/icons-material/NoteAddOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined'
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CALIBRATION_SERVICE_APPROVAL_COLORS,
  CALIBRATION_SERVICE_APPROVAL_LABELS
} from '../../../constants/calibrationServices'
import { CalibrationService } from '../../../types/calibrationService'
import CalibrationServiceStatusChip from '../CalibrationServiceStatusChip'
import CalibrationServiceStageDecisionHelp from '../CalibrationServiceStageDecisionHelp'
import CalibrationNotificationBell from '../CalibrationNotificationBell'
import CalibrationServiceQuoteLifecycleActions from './CalibrationServiceQuoteLifecycleActions'
import CalibrationServiceOdsReissueAction from './CalibrationServiceOdsReissueAction'
import { BlockedActionTooltip } from './CalibrationServiceDetailLayout'
import {
  formatDateValue,
  primaryActionSx,
  secondaryActionSx,
  cautionActionSx
} from './calibrationServiceDetailUtils'
import {
  CalibrationServiceDetailPermissions,
  CalibrationServiceDetailData,
  CalibrationServiceDetailDialogs,
  CalibrationServiceDetailActions,
  CalibrationServiceDetailBusy
} from './calibrationServiceDetailTypes'

interface CalibrationServiceDetailHeaderProps {
  service: CalibrationService
  permissions: CalibrationServiceDetailPermissions
  data: CalibrationServiceDetailData
  dialogs: CalibrationServiceDetailDialogs
  actions: CalibrationServiceDetailActions
  busy: CalibrationServiceDetailBusy
}

/** Encabezado del detalle: código, estado, cliente y acciones disponibles según la etapa. */
const CalibrationServiceDetailHeader = ({
  service,
  permissions,
  data,
  dialogs,
  actions,
  busy
}: CalibrationServiceDetailHeaderProps) => {
  const {
    isTechnicalOnlyView,
    isAnalystOnlyView,
    canIssueOds,
    canScheduleService,
    canReprogramService,
    canReassignService,
    canPauseService,
    canResumeService,
    canCancelService,
    canStartExecution,
    canCompleteExecution,
    canCreateCut,
    showCompleteExecution,
    completeExecutionBlockedReason,
    showCreateCut,
    createCutBlockedReason,
    hasCuts,
    allCutsSent,
    canCloseService,
    showCloseService,
    closeServiceBlockedReason,
    canEdit,
    canRequestApproval,
    canDecideApproval
  } = permissions
  const {
    customerResponseType,
    unresolvedCommercialAdjustments,
    lastCertificateSent
  } = data
  const {
    setDecisionMode,
    setIsOdsDialogOpen,
    setIsScheduleDialogOpen,
    setIsRescheduleDialogOpen,
    setIsReassignDialogOpen,
    setIsPauseDialogOpen,
    setIsResumeDialogOpen,
    setIsCancelDialogOpen,
    setIsCutDialogOpen,
    setIsCloseDialogOpen
  } = dialogs
  const {
    handleRequestApproval,
    handleSendCertificate,
    handleStartExecution,
    handleCompleteExecution
  } = actions
  const {
    isDecisionLoading,
    isOdsLoading,
    isOperationalBusy,
    isSendingCertificate
  } = busy
  const navigate = useNavigate()
  const [moreActionsAnchor, setMoreActionsAnchor] =
    useState<HTMLElement | null>(null)

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      justifyContent='space-between'
      spacing={3}
      mb={4}
    >
      <Box flex={1} maxWidth={{ xs: '100%', md: '60%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Button
          startIcon={<ArrowBackOutlinedIcon />}
          onClick={() => navigate('/calibration-services')}
          sx={{ ml: -1, color: 'text.secondary', textTransform: 'none', fontWeight: 600 }}
          size='small'
        >
          Volver a la bandeja
        </Button>
        <CalibrationNotificationBell />
        </Box>

        <Stack
          direction='row'
          alignItems='center'
          spacing={1.5}
          flexWrap='wrap'
          sx={{ mb: 1.5 }}
        >
          <Typography
            variant='h4'
            fontWeight={700}
            color='text.primary'
            sx={{ mr: 1, lineHeight: 1.1 }}
          >
            {service.serviceCode}
          </Typography>

          <CalibrationServiceStatusChip status={service.status} />
          {service.isPaused ? (
            <Chip
              size='small'
              color='warning'
              variant='outlined'
              label='Pausado'
              sx={{ fontWeight: 600 }}
            />
          ) : null}
          {!isTechnicalOnlyView ? (
            <Chip
              size='small'
              variant='outlined'
              color={
                CALIBRATION_SERVICE_APPROVAL_COLORS[service.approvalStatus]
              }
              label={
                CALIBRATION_SERVICE_APPROVAL_LABELS[service.approvalStatus]
              }
              sx={{ fontWeight: 600 }}
            />
          ) : null}
          {(service.otherFields as any)?.hasEquipmentSale === true ? (
            <Chip size='small' color='warning' variant='outlined' label='Venta equipo' sx={{ fontWeight: 600 }} />
          ) : null}
          <CalibrationServiceStageDecisionHelp
            status={service.status}
            approvalStatus={service.approvalStatus}
            customerResponseType={customerResponseType}
            hasCommercialAdjustments={Boolean(
              unresolvedCommercialAdjustments.length
            )}
            hasCuts={hasCuts}
            allCutsSent={allCutsSent}
          />
        </Stack>

        <Typography
          variant='subtitle1'
          color='text.secondary'
          fontWeight={500}
        >
          {service.customer?.nombre ||
            service.executionCustomerName ||
            'Cliente pendiente'}
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
          {service.customerSite ||
            service.executionSiteName ||
            'Sede pendiente'}{' '}
          · {service.contactName || 'Sin contacto principal'}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1.5,
          justifyContent: { xs: 'flex-start', md: 'flex-end' },
          alignItems: 'flex-start',
          flex: 1
        }}
      >
        {customerResponseType === 'changes_requested' ? (
          <Chip
            color='warning'
            variant='outlined'
            label='Cliente pidió modificación'
          />
        ) : null}
        {isTechnicalOnlyView || isAnalystOnlyView ? null : (
          <>
            <CalibrationServiceQuoteLifecycleActions service={service} />
            <CalibrationServiceOdsReissueAction service={service} />
          </>
        )}
        {canRequestApproval ? (
          <Button
            variant='contained'
            startIcon={<SendOutlinedIcon />}
            onClick={() => void handleRequestApproval()}
            disabled={isDecisionLoading}
            disableElevation
            sx={primaryActionSx}
          >
            Enviar cotización
          </Button>
        ) : null}
        {isAnalystOnlyView && lastCertificateSent ? (
          <Chip
            color='success'
            variant='outlined'
            icon={<CheckCircleOutlineOutlinedIcon />}
            label={`Certificado enviado ${formatDateValue(
              lastCertificateSent.occurredAt
            )} por ${lastCertificateSent.performedByName}`}
          />
        ) : null}
        {isAnalystOnlyView ? (
          <Button
            variant='contained'
            startIcon={<SendOutlinedIcon />}
            onClick={() => void handleSendCertificate()}
            disabled={
              !(service.cuts ?? []).some((cut) => cut.status === 'invoiced') ||
              isSendingCertificate
            }
            disableElevation
            sx={primaryActionSx}
          >
            {lastCertificateSent
              ? 'Reenviar certificado'
              : 'Marcar certificado enviado'}
          </Button>
        ) : null}
        {canDecideApproval ? (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ '& .MuiButton-root': { whiteSpace: 'nowrap' } }}>
            <Button
              variant='outlined'
              color='warning'
              title='Registrar que el cliente pidió modificar la cotización'
              startIcon={<AutorenewOutlinedIcon />}
              onClick={() => setDecisionMode('request_changes')}
              disabled={isDecisionLoading}
              sx={cautionActionSx}
            >
              Registrar cambios
            </Button>
            <Button
              variant='outlined'
              color='warning'
              title='Registrar que el cliente rechazó la cotización'
              startIcon={<HighlightOffOutlinedIcon />}
              onClick={() => setDecisionMode('reject')}
              disabled={isDecisionLoading}
              sx={cautionActionSx}
            >
              Registrar rechazo
            </Button>
            <Button
              variant='contained'
              title='Registrar que el cliente aprobó la cotización'
              startIcon={<CheckCircleOutlineOutlinedIcon />}
              onClick={() => setDecisionMode('approve')}
              disabled={isDecisionLoading}
              disableElevation
              sx={primaryActionSx}
            >
              Registrar aprobación
            </Button>
          </Stack>
        ) : null}
        {canIssueOds ? (
          <Button
            variant='contained'
            startIcon={<DescriptionOutlinedIcon />}
            onClick={() => setIsOdsDialogOpen(true)}
            disabled={isOdsLoading}
            disableElevation
            sx={primaryActionSx}
          >
            Emitir ODS
          </Button>
        ) : null}
        {canScheduleService ? (
          <Button
            variant='contained'
            startIcon={<EventOutlinedIcon />}
            onClick={() => setIsScheduleDialogOpen(true)}
            disabled={isOperationalBusy}
            disableElevation
            sx={primaryActionSx}
          >
            Programar servicio
          </Button>
        ) : null}
        {canReprogramService ||
        canReassignService ||
        canPauseService ||
        canCancelService ? (
          <>
            <Button
              variant='outlined'
              endIcon={<ExpandMoreIcon />}
              onClick={(event) => setMoreActionsAnchor(event.currentTarget)}
              disabled={isOperationalBusy}
              aria-haspopup='menu'
              sx={{ ...secondaryActionSx, color: 'text.primary', borderColor: '#d1d5db' }}
            >
              Más acciones
            </Button>
            <Menu
              anchorEl={moreActionsAnchor}
              open={Boolean(moreActionsAnchor)}
              onClose={() => setMoreActionsAnchor(null)}
            >
              {canReprogramService ? (
                <MenuItem
                  onClick={() => {
                    setMoreActionsAnchor(null)
                    setIsRescheduleDialogOpen(true)
                  }}
                >
                  <EventRepeatOutlinedIcon fontSize='small' sx={{ mr: 1.25 }} />
                  Reprogramar
                </MenuItem>
              ) : null}
              {canReassignService ? (
                <MenuItem
                  onClick={() => {
                    setMoreActionsAnchor(null)
                    setIsReassignDialogOpen(true)
                  }}
                >
                  <PersonOutlineOutlinedIcon fontSize='small' sx={{ mr: 1.25 }} />
                  Reasignar metrólogo
                </MenuItem>
              ) : null}
              {canPauseService ? (
                <MenuItem
                  onClick={() => {
                    setMoreActionsAnchor(null)
                    setIsPauseDialogOpen(true)
                  }}
                >
                  <PauseCircleOutlineOutlinedIcon fontSize='small' sx={{ mr: 1.25 }} />
                  Pausar servicio
                </MenuItem>
              ) : null}
              {canCancelService ? (
                <MenuItem
                  onClick={() => {
                    setMoreActionsAnchor(null)
                    setIsCancelDialogOpen(true)
                  }}
                  sx={{ color: 'error.main' }}
                >
                  <CancelOutlinedIcon fontSize='small' sx={{ mr: 1.25 }} />
                  Cancelar servicio
                </MenuItem>
              ) : null}
            </Menu>
          </>
        ) : null}
        {canResumeService ? (
          <Button
            variant='contained'
            startIcon={<PlayArrowOutlinedIcon />}
            onClick={() => setIsResumeDialogOpen(true)}
            disabled={isOperationalBusy}
            disableElevation
            sx={primaryActionSx}
          >
            Reanudar servicio
          </Button>
        ) : null}
        {canStartExecution ? (
          <Button
            variant='contained'
            startIcon={<PlayArrowOutlinedIcon />}
            onClick={() => void handleStartExecution()}
            disabled={isOperationalBusy}
            disableElevation
            sx={primaryActionSx}
          >
            Iniciar ejecución
          </Button>
        ) : null}
        {showCompleteExecution ? (
          <BlockedActionTooltip reason={completeExecutionBlockedReason}>
            <Button
              variant='contained'
              startIcon={<TaskAltOutlinedIcon />}
              onClick={() => void handleCompleteExecution()}
              disabled={isOperationalBusy || !canCompleteExecution}
              disableElevation
              sx={primaryActionSx}
            >
              Finalizar ejecución
            </Button>
          </BlockedActionTooltip>
        ) : null}
        {showCreateCut ? (
          <BlockedActionTooltip reason={createCutBlockedReason}>
            <Button
              variant='outlined'
              startIcon={<NoteAddOutlinedIcon />}
              onClick={() => setIsCutDialogOpen(true)}
              disabled={isOperationalBusy || !canCreateCut}
              sx={secondaryActionSx}
            >
              {service.status === 'technically_completed' ? 'Crear corte final' : 'Crear corte'}
            </Button>
          </BlockedActionTooltip>
        ) : null}
        {showCloseService ? (
          <BlockedActionTooltip reason={closeServiceBlockedReason}>
            <Button
              variant='contained'
              startIcon={<LockOutlinedIcon />}
              onClick={() => setIsCloseDialogOpen(true)}
              disabled={isOperationalBusy || !canCloseService}
              disableElevation
              sx={primaryActionSx}
            >
              Cerrar servicio
            </Button>
          </BlockedActionTooltip>
        ) : null}
        {canEdit ? (
          <Button
            variant='outlined'
            startIcon={<EditOutlinedIcon />}
            onClick={() =>
              navigate(`/calibration-services/${service.id}/edit`)
            }
            sx={secondaryActionSx}
          >
            Editar servicio
          </Button>
        ) : null}
      </Box>
    </Stack>
  )
}

export default CalibrationServiceDetailHeader
