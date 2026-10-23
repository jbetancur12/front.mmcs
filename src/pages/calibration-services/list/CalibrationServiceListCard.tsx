import { Fragment, ReactNode } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined'
import EventOutlinedIcon from '@mui/icons-material/EventOutlined'
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

const iconButtonSx = {
  border: `1px solid ${ui.border}`,
  borderRadius: '10px',
  width: 40,
  height: 40,
  color: '#374151',
  '&:hover': {
    borderColor: '#00897B',
    color: '#00695C',
    backgroundColor: '#E0F7F4'
  }
}

/**
 * Tarjeta compacta de un servicio en la vista de lista: el cliente manda,
 * una sola acción principal y los datos secundarios en una línea.
 */
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
  const isAssignedToCurrentMetrologist = Boolean(
    hasTechnicalRole &&
      currentUserEmail &&
      assignedMetrologistEmail &&
      assignedMetrologistEmail.toLowerCase() === currentUserEmail.toLowerCase()
  )
  const canEdit = canCreateServices && service.status === 'draft'
  const canRequestApproval = canCreateServices && service.status === 'draft'
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
    canRunExecution && ['scheduled', 'in_execution'].includes(service.status)

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
  // El mensaje del plazo solo se muestra cuando hay algo que atender
  const showAlertMessage =
    hasCustomerChangeRequest(service) || ['yellow', 'red'].includes(slaColor)
  const customerName =
    service.customer?.nombre ||
    service.executionCustomerName ||
    'Cliente pendiente'
  const showMoney = !isTechnicalOnlyView && !isAnalystOnlyView
  const itemsCount = service.items?.length ?? 0

  // Acción principal contextual: una sola por tarjeta
  let primaryAction: ReactNode = null
  if (isAnalystOnlyView) {
    primaryAction = (
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
    )
  } else if (canRequestApproval) {
    primaryAction = (
      <Button
        variant='contained'
        startIcon={<SendOutlinedIcon />}
        onClick={() => void handleRequestApproval(service)}
        disabled={requestApproval.isLoading}
        sx={primaryButtonSx}
      >
        Enviar cotización
      </Button>
    )
  } else if (canResolveApproval) {
    primaryAction = (
      <Button
        variant='contained'
        startIcon={<WarningAmberOutlinedIcon />}
        onClick={() => openServiceDetail(service.id)}
        sx={primaryButtonSx}
      >
        Registrar respuesta cliente
      </Button>
    )
  } else if (canOpenOds) {
    primaryAction = (
      <Button
        variant='contained'
        startIcon={<DescriptionOutlinedIcon />}
        onClick={() => openOdsWorkflow(service.id)}
        sx={primaryButtonSx}
      >
        Emitir ODS
      </Button>
    )
  } else if (canOpenScheduling) {
    primaryAction = (
      <Button
        variant='contained'
        startIcon={<EventOutlinedIcon />}
        onClick={() => openScheduleWorkflow(service.id)}
        sx={primaryButtonSx}
      >
        Programar
      </Button>
    )
  } else if (canManageExecution) {
    primaryAction = (
      <Button
        variant='contained'
        startIcon={<EngineeringOutlinedIcon />}
        onClick={() => openServiceDetail(service.id)}
        sx={primaryButtonSx}
      >
        Operación
      </Button>
    )
  }

  const metaItems: ReactNode[] = [
    <span key='items'>
      <strong>{itemsCount}</strong> {itemsCount === 1 ? 'ítem' : 'ítems'}
    </span>,
    showMoney ? (
      <Box
        key='total'
        component='span'
        title='Total estimado'
        sx={{ color: '#00695C', fontWeight: 700 }}
      >
        {currencyFormatter.format(getItemsTotal(service))}
      </Box>
    ) : service.odsCode ? null : (
      <span key='ods'>ODS pendiente</span>
    ),
    <span key='contact' title='Contacto del cliente'>
      {service.contactName || 'Sin contacto'}
    </span>,
    assignedMetrologistName ? (
      <Box
        key='metrologist'
        component='span'
        title={
          assignedMetrologistEmails.length > 0 && !isTechnicalOnlyView
            ? assignedMetrologistEmails.join(', ')
            : undefined
        }
      >
        Resp.: <strong>{assignedMetrologistNames.join(', ')}</strong>
      </Box>
    ) : null,
    <span key='updated' title='Última actualización'>
      Act. {new Date(service.updatedAt).toLocaleDateString('es-CO')}
    </span>
  ].filter(Boolean)

  return (
    <Card elevation={0} sx={softCardSx}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          justifyContent='space-between'
          alignItems={{ xs: 'stretch', lg: 'flex-start' }}
          spacing={2}
        >
          <Box flex={1} minWidth={0}>
            <Typography
              variant='subtitle1'
              fontWeight={700}
              sx={{ color: ui.text, lineHeight: 1.3 }}
            >
              {customerName}
            </Typography>
            <Typography
              variant='body2'
              sx={{ color: ui.textSecondary, lineHeight: 1.4 }}
            >
              <Box
                component='span'
                title='Código interno del servicio (SCL)'
                sx={{ fontWeight: 700, color: ui.text, cursor: 'help' }}
              >
                {service.serviceCode}
              </Box>
              {service.quoteCode ? (
                <Box
                  component='span'
                  title='Consecutivo de cotización'
                  sx={{ cursor: 'help' }}
                >
                  {' · '}Cotización {service.quoteCode}
                </Box>
              ) : null}
              {service.odsCode ? (
                <Box
                  component='span'
                  title='Orden de servicio'
                  sx={{ cursor: 'help' }}
                >
                  {' · '}ODS {service.odsCode}
                </Box>
              ) : null}
              {service.scopeType === 'site'
                ? ` · Sede: ${getServiceSiteLabel(service)}`
                : ''}
            </Typography>

            <Stack
              direction='row'
              spacing={1}
              alignItems='center'
              flexWrap='wrap'
              useFlexGap
              sx={{ mt: 1 }}
            >
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
              {service.otherFields?.hasEquipmentSale === true ? (
                <Chip
                  size='small'
                  variant='outlined'
                  label='Con venta de equipos'
                />
              ) : null}
            </Stack>

            {showAlertMessage ? (
              <Typography
                variant='body2'
                sx={{ mt: 1, color: ui.textSecondary, lineHeight: 1.5 }}
              >
                {hasCustomerChangeRequest(service)
                  ? 'La cotización volvió a edición porque el cliente pidió cambios.'
                  : service.slaIndicator?.message}
              </Typography>
            ) : null}

            <Stack
              direction='row'
              alignItems='center'
              flexWrap='wrap'
              useFlexGap
              columnGap={1}
              rowGap={0.5}
              sx={{ mt: 1.25, color: ui.muted, fontSize: '0.8125rem' }}
            >
              {metaItems.map((item, index) => (
                <Fragment key={index}>
                  {index > 0 ? (
                    <Box aria-hidden component='span' sx={{ color: '#d1d5db' }}>
                      ·
                    </Box>
                  ) : null}
                  {item}
                </Fragment>
              ))}
            </Stack>
          </Box>

          <Stack
            direction='row'
            spacing={1}
            alignItems='center'
            justifyContent={{ xs: 'flex-start', lg: 'flex-end' }}
            flexShrink={0}
          >
            {primaryAction}
            {canEdit ? (
              <Tooltip title='Editar'>
                <IconButton
                  aria-label='Editar servicio'
                  onClick={() =>
                    navigate(`/calibration-services/${service.id}/edit`)
                  }
                  sx={iconButtonSx}
                >
                  <EditOutlinedIcon fontSize='small' />
                </IconButton>
              </Tooltip>
            ) : null}
            <Tooltip title='Ver detalle'>
              <IconButton
                aria-label='Ver detalle del servicio'
                onClick={() => openServiceDetail(service.id)}
                sx={iconButtonSx}
              >
                <VisibilityOutlinedIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default CalibrationServiceListCard
