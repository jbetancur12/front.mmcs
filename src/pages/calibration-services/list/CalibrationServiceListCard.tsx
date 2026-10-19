import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'
import { useNavigate } from 'react-router-dom'
import {
  CALIBRATION_SERVICE_APPROVAL_COLORS,
  CALIBRATION_SERVICE_APPROVAL_LABELS,
  CALIBRATION_SERVICE_SLA_COLORS,
  getCalibrationServiceStatusAccent,
  isSlaLabelRedundantWithStatus
} from '../../../constants/calibrationServices'
import { CalibrationService } from '../../../types/calibrationService'
import CalibrationServiceStatusChip from '../CalibrationServiceStatusChip'
import {
  currencyFormatter,
  primaryButtonSx,
  secondaryButtonSx,
  softCardSx,
  ui
} from './calibrationServicesListConstants'
import {
  getItemsTotal,
  getMetrologistEmails,
  getMetrologistNames,
  getServiceOperationalFocus,
  getServiceSiteLabel,
  hasCustomerChangeRequest
} from './calibrationServicesListUtils'
import { CalibrationServicesListPermissions } from './useCalibrationServicesListPermissions'
import { CalibrationServicesListActions } from './useCalibrationServicesListActions'

interface CalibrationServiceListCardProps {
  service: CalibrationService
  permissions: CalibrationServicesListPermissions
  actions: CalibrationServicesListActions
  currentUserEmail?: string | null
}

/** Tarjeta de un servicio en la vista de lista, con sus chips de estado y acciones del flujo. */
const CalibrationServiceListCard = ({
  service,
  permissions,
  actions,
  currentUserEmail
}: CalibrationServiceListCardProps) => {
  const navigate = useNavigate()
  const {
    hasTechnicalRole,
    canCreateServices,
    canTakeApprovalDecision,
    canIssueOds,
    canScheduleService,
    canRunExecution,
    isTechnicalOnlyView,
    isAnalystOnlyView
  } = permissions
  const {
    requestApproval,
    sendCertificate,
    openServiceDetail,
    openOdsWorkflow,
    openScheduleWorkflow,
    handleRequestApproval,
    handleSendCertificate
  } = actions
  const serviceOperationalFocus = getServiceOperationalFocus(service)
  const assignedMetrologistNames = getMetrologistNames(service)
  const assignedMetrologistName = assignedMetrologistNames[0] || ''
  const assignedMetrologistEmails = getMetrologistEmails(service)
  const assignedMetrologistEmail = assignedMetrologistEmails[0] || ''
  const isAssignedToCurrentMetrologist =
    Boolean(
      hasTechnicalRole &&
        currentUserEmail &&
        assignedMetrologistEmail &&
        assignedMetrologistEmail.toLowerCase() ===
          currentUserEmail.toLowerCase()
    )
  const canEdit = canCreateServices && service.status === 'draft'
  const canRequestApproval =
    canCreateServices && service.status === 'draft'
  const canResolveApproval =
    canTakeApprovalDecision && service.status === 'pending_approval'
  const canOpenOds =
    canIssueOds &&
    service.status === 'approved' &&
    service.approvalStatus === 'approved' &&
    !service.odsCode
  const canOpenScheduling =
    canScheduleService &&
    ['ods_issued', 'pending_programming'].includes(service.status)
  const canManageExecution =
    canRunExecution &&
    ['scheduled', 'in_execution'].includes(service.status)

  return (
    <Card key={service.id} elevation={0} sx={{
      ...softCardSx, position: 'relative', overflow: 'visible',
      '&::before': {
        content: '""', position: 'absolute', left: 0, top: 12, bottom: 12,
        width: 3, borderRadius: '2px',
        background: `linear-gradient(180deg, ${getCalibrationServiceStatusAccent(service.status)}, ${alpha(getCalibrationServiceStatusAccent(service.status), 0.3)})`
      }
    }}>
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack
          direction={{ xs: 'column', xl: 'row' }}
          justifyContent='space-between'
          spacing={2}
        >
          <Box flex={1}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1}
              alignItems={{ xs: 'flex-start', md: 'center' }}
              mb={1.5}
              flexWrap='wrap'
            >
              <Typography
                variant='h6'
                fontWeight={700}
                sx={{ color: ui.text, lineHeight: 1.2 }}
              >
                <Box component='span' title='Código interno del servicio (SCL)' sx={{ cursor: 'help' }}>
                  {service.serviceCode}
                </Box>
                {service.quoteCode ? (
                  <Box component='span' title='Consecutivo de cotización' sx={{ ml: 1, color: '#059669', fontWeight: 800, fontSize: '0.85rem', cursor: 'help' }}>
                    · {service.quoteCode}
                  </Box>
                ) : null}
              </Typography>
              <CalibrationServiceStatusChip status={service.status} />
              {!isTechnicalOnlyView ? (
                <Chip
                  size='small'
                  variant='outlined'
                  color={
                    CALIBRATION_SERVICE_APPROVAL_COLORS[
                      service.approvalStatus
                    ]
                  }
                  label={
                    CALIBRATION_SERVICE_APPROVAL_LABELS[
                      service.approvalStatus
                    ]
                  }
                />
              ) : null}
              {isSlaLabelRedundantWithStatus(
                service.status,
                service.slaIndicator?.label
              ) ? null : (
                <Chip
                  size='small'
                  color={
                    CALIBRATION_SERVICE_SLA_COLORS[
                      service.slaIndicator?.color || 'gray'
                    ]
                  }
                  label={service.slaIndicator?.label || 'SLA no iniciado'}
                />
              )}
              {['yellow', 'red'].includes(
                service.slaIndicator?.color || 'gray'
              ) ? (
                <Chip
                  size='small'
                  icon={
                    service.slaIndicator?.color === 'red' ? (
                      <ReportProblemOutlinedIcon />
                    ) : (
                      <WarningAmberOutlinedIcon />
                    )
                  }
                  color={
                    service.slaIndicator?.color === 'red'
                      ? 'error'
                      : 'warning'
                  }
                  label={
                    service.slaIndicator?.color === 'red'
                      ? 'Alerta vencida'
                      : 'Alerta activa'
                  }
                />
              ) : null}
              {serviceOperationalFocus ? (
                <Chip
                  size='small'
                  color={serviceOperationalFocus.color}
                  variant='filled'
                  label={serviceOperationalFocus.label}
                />
              ) : null}
              {service.odsCode ? (
                <Chip size='small' variant='outlined' label={service.odsCode} />
              ) : null}
              {service.otherFields?.hasEquipmentSale === true ? (
                <Chip size='small' color='warning' variant='outlined' label='Venta Eq.' />
              ) : null}
              {!isTechnicalOnlyView && hasCustomerChangeRequest(service) ? (
                <Chip
                  size='small'
                  color='warning'
                  variant='outlined'
                  label='Cliente pidió modificación'
                />
              ) : null}
              {assignedMetrologistName ? (
                <Chip
                  size='small'
                  color={isAssignedToCurrentMetrologist ? 'success' : 'default'}
                  variant={
                    isAssignedToCurrentMetrologist ? 'filled' : 'outlined'
                  }
                  label={
                    isAssignedToCurrentMetrologist
                      ? 'Asignado a ti'
                      : assignedMetrologistNames.length > 1
                        ? `Metrólogos: ${assignedMetrologistNames.join(', ')}`
                        : `Metrólogo: ${assignedMetrologistName}`
                  }
                />
              ) : null}
            </Stack>

            <Typography
              variant='body1'
              fontWeight={700}
              sx={{ color: ui.textSecondary, lineHeight: 1.5 }}
            >
              {service.customer?.nombre ||
                service.executionCustomerName ||
                'Cliente pendiente'}
            </Typography>
            {service.scopeType === 'site' ? (
              <Typography
                variant='body2'
                sx={{ mt: 0.5, color: ui.muted, lineHeight: 1.5 }}
              >
                Sede: {getServiceSiteLabel(service)}
              </Typography>
            ) : null}
            <Typography
              variant='body2'
              sx={{ mt: 1, color: ui.muted, lineHeight: 1.5 }}
            >
              {hasCustomerChangeRequest(service)
                ? 'La cotización volvió a edición porque el cliente pidió cambios.'
                : service.slaIndicator?.message ||
                  'Todavía no hay una alerta operativa activa.'}
            </Typography>
            {assignedMetrologistName ? (
              <Typography
                variant='body2'
                sx={{ mt: 0.75, color: ui.muted, lineHeight: 1.5 }}
              >
                {assignedMetrologistNames.length > 1
                  ? `Metrólogos: ${assignedMetrologistNames.join(', ')}`
                  : (
                    <>
                      Responsable metrológico:{' '}
                      <strong>{assignedMetrologistName}</strong>
                    </>
                  )}
                {assignedMetrologistEmails.length > 0 && !isTechnicalOnlyView
                  ? ` · ${assignedMetrologistEmails.join(', ')}`
                  : ''}
              </Typography>
            ) : null}

            <Divider sx={{ my: 2, borderColor: ui.border }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography
                  variant='caption'
                  sx={{ color: ui.muted, fontWeight: 500 }}
                >
                  Ítems del servicio
                </Typography>
                <Typography
                  variant='body1'
                  fontWeight={700}
                  sx={{ color: ui.text }}
                >
                  {service.items?.length ?? 0}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography
                  variant='caption'
                  sx={{ color: ui.muted, fontWeight: 500 }}
                >
                  {isTechnicalOnlyView || isAnalystOnlyView
                    ? 'ODS'
                    : 'Total estimado'}
                </Typography>
                <Typography
                  variant='body1'
                  fontWeight={700}
                  sx={{ color: ui.success }}
                >
                  {isTechnicalOnlyView || isAnalystOnlyView
                    ? service.odsCode || 'Pendiente'
                    : currencyFormatter.format(getItemsTotal(service))}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography
                  variant='caption'
                  sx={{ color: ui.muted, fontWeight: 500 }}
                >
                  Contacto
                </Typography>
                <Typography
                  variant='body1'
                  fontWeight={700}
                  sx={{ color: ui.text }}
                >
                  {service.contactName || 'Sin contacto'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography
                  variant='caption'
                  sx={{ color: ui.muted, fontWeight: 500 }}
                >
                  Actualizado
                </Typography>
                <Typography
                  variant='body1'
                  fontWeight={700}
                  sx={{ color: ui.text }}
                >
                  {new Date(service.updatedAt).toLocaleDateString('es-CO')}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Stack
            direction={{ xs: 'column', sm: 'row', xl: 'column' }}
            spacing={1}
            justifyContent='flex-start'
            alignItems={{ xs: 'stretch', sm: 'flex-start' }}
          >
            <Button
              variant='outlined'
              startIcon={<VisibilityOutlinedIcon />}
              onClick={() => openServiceDetail(service.id)}
              sx={secondaryButtonSx}
            >
              Ver detalle
            </Button>
            {isAnalystOnlyView ? (
              <Button
                variant='contained'
                startIcon={<SendOutlinedIcon />}
                onClick={() => void handleSendCertificate(service)}
                disabled={
                  !(service.cuts ?? []).some((cut) => cut.status === 'invoiced') ||
                  sendCertificate.isLoading
                }
                sx={primaryButtonSx}
              >
                Enviar certificado
              </Button>
            ) : null}
            {canEdit ? (
              <Button
                variant='outlined'
                startIcon={<EditOutlinedIcon />}
                onClick={() =>
                  navigate(`/calibration-services/${service.id}/edit`)
                }
                sx={secondaryButtonSx}
              >
                Editar
              </Button>
            ) : null}
            {canRequestApproval ? (
              <Button
                variant='contained'
                startIcon={<SendOutlinedIcon />}
                onClick={() => void handleRequestApproval(service)}
                disabled={requestApproval.isLoading}
                sx={primaryButtonSx}
              >
                Enviar cotización
              </Button>
            ) : null}
            {canResolveApproval ? (
              <Button
                variant='contained'
                color='warning'
                startIcon={<WarningAmberOutlinedIcon />}
                onClick={() => openServiceDetail(service.id)}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 700,
                  minHeight: 44
                }}
              >
                Registrar respuesta cliente
              </Button>
            ) : null}
            {canOpenOds ? (
              <Button
                variant='contained'
                color='info'
                startIcon={<DescriptionOutlinedIcon />}
                onClick={() => openOdsWorkflow(service.id)}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 700,
                  minHeight: 44
                }}
              >
                Emitir ODS
              </Button>
            ) : null}
            {canOpenScheduling ? (
              <Button
                variant='contained'
                color='primary'
                startIcon={<DescriptionOutlinedIcon />}
                onClick={() => openScheduleWorkflow(service.id)}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 700,
                  minHeight: 44
                }}
              >
                Programar
              </Button>
            ) : null}
            {canManageExecution ? (
              <Button
                variant='outlined'
                color='success'
                startIcon={<VisibilityOutlinedIcon />}
                onClick={() => openServiceDetail(service.id)}
                sx={{
                  ...secondaryButtonSx,
                  color: ui.success,
                  borderColor: alpha(ui.success, 0.35)
                }}
              >
                Operación
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default CalibrationServiceListCard
