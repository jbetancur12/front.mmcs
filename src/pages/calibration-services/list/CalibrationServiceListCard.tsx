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
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import { useNavigate } from 'react-router-dom'
import {
  CALIBRATION_SERVICE_APPROVAL_COLORS,
  CALIBRATION_SERVICE_APPROVAL_LABELS,
  CALIBRATION_SERVICE_SLA_COLORS,
  chipColorToStatusTone,
  isSlaLabelRedundantWithStatus
} from '../../../constants/calibrationServices'
import { CalibrationService } from '../../../types/calibrationService'
import CalibrationServiceStatusChip from '../CalibrationServiceStatusChip'
import StatusPill from 'src/Components/Common/StatusPill'
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

  // La aprobación del cliente se omite cuando la etapa ya la implica
  // (aprobada y siguientes) o cuando todavía se espera su respuesta.
  const showApprovalPill =
    !isTechnicalOnlyView &&
    service.approvalStatus !== 'approved' &&
    !(
      service.approvalStatus === 'pending' &&
      ['draft', 'pending_approval'].includes(service.status)
    )
  // Plazo y alerta van en una sola pastilla, con el color de su gravedad
  const slaColor = service.slaIndicator?.color || 'gray'
  const showSlaPill =
    ['yellow', 'red'].includes(slaColor) ||
    !isSlaLabelRedundantWithStatus(service.status, service.slaIndicator?.label)

  return (
    <Card key={service.id} elevation={0} sx={softCardSx}>
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
                  <Box component='span' title='Consecutivo de cotización' sx={{ ml: 1.25, color: ui.textSecondary, fontWeight: 600, fontSize: '0.85rem', cursor: 'help' }}>
                    Cotización {service.quoteCode}
                  </Box>
                ) : null}
              </Typography>
              <CalibrationServiceStatusChip status={service.status} />
              {showApprovalPill ? (
                <StatusPill
                  size='small'
                  tone={chipColorToStatusTone(
                    CALIBRATION_SERVICE_APPROVAL_COLORS[service.approvalStatus]
                  )}
                  label={
                    CALIBRATION_SERVICE_APPROVAL_LABELS[service.approvalStatus]
                  }
                />
              ) : null}
              {showSlaPill ? (
                <StatusPill
                  size='small'
                  tone={chipColorToStatusTone(
                    CALIBRATION_SERVICE_SLA_COLORS[slaColor]
                  )}
                  label={
                    slaColor === 'red'
                      ? `Vencido: ${service.slaIndicator?.label || 'plazo'}`
                      : service.slaIndicator?.label || 'SLA no iniciado'
                  }
                />
              ) : null}
              {serviceOperationalFocus ? (
                <StatusPill
                  size='small'
                  tone={chipColorToStatusTone(serviceOperationalFocus.color)}
                  label={serviceOperationalFocus.label}
                />
              ) : null}
              {!isTechnicalOnlyView && hasCustomerChangeRequest(service) ? (
                <StatusPill
                  size='small'
                  tone='warning'
                  label='Cliente pidió modificación'
                />
              ) : null}
              {isAssignedToCurrentMetrologist ? (
                <StatusPill size='small' tone='live' label='Asignado a ti' />
              ) : null}
              {service.odsCode ? (
                <Chip size='small' variant='outlined' label={service.odsCode} />
              ) : null}
              {service.otherFields?.hasEquipmentSale === true ? (
                <Chip size='small' variant='outlined' label='Con venta de equipos' />
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
                  ? ` (${assignedMetrologistEmails.join(', ')})`
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
                  sx={{ color: '#00695C' }}
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
                startIcon={<WarningAmberOutlinedIcon />}
                onClick={() => openServiceDetail(service.id)}
                sx={primaryButtonSx}
              >
                Registrar respuesta cliente
              </Button>
            ) : null}
            {canOpenOds ? (
              <Button
                variant='contained'
                startIcon={<DescriptionOutlinedIcon />}
                onClick={() => openOdsWorkflow(service.id)}
                sx={primaryButtonSx}
              >
                Emitir ODS
              </Button>
            ) : null}
            {canOpenScheduling ? (
              <Button
                variant='contained'
                startIcon={<DescriptionOutlinedIcon />}
                onClick={() => openScheduleWorkflow(service.id)}
                sx={primaryButtonSx}
              >
                Programar
              </Button>
            ) : null}
            {canManageExecution ? (
              <Button
                variant='outlined'
                startIcon={<VisibilityOutlinedIcon />}
                onClick={() => openServiceDetail(service.id)}
                sx={secondaryButtonSx}
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
