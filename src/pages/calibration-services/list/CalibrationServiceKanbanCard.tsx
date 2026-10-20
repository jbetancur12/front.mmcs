import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import {
  CALIBRATION_SERVICE_APPROVAL_COLORS,
  CALIBRATION_SERVICE_APPROVAL_LABELS
} from '../../../constants/calibrationServices'
import { CalibrationService } from '../../../types/calibrationService'
import CalibrationServiceStatusChip from '../CalibrationServiceStatusChip'
import { currencyFormatter, ui } from './calibrationServicesListConstants'
import {
  getCompactSlaLabel,
  getItemsTotal,
  getMetrologistNames,
  getServiceOperationalFocus,
  getServiceSiteLabel,
  getSlaVisualTone
} from './calibrationServicesListUtils'

interface CalibrationServiceKanbanCardProps {
  service: CalibrationService
  isTechnicalOnlyView: boolean
  openServiceDetail: (serviceId: number) => void
}

/** Tarjeta compacta de un servicio dentro de una columna del kanban. */
const CalibrationServiceKanbanCard = ({
  service,
  isTechnicalOnlyView,
  openServiceDetail
}: CalibrationServiceKanbanCardProps) => {
  const slaTone = getSlaVisualTone(
    service.slaIndicator?.color || 'gray'
  )
  const assignedMetrologistNames = getMetrologistNames(service)
  const assignedMetrologistName = assignedMetrologistNames[0] || ''
  const customerLabel =
    service.customer?.nombre ||
    service.executionCustomerName ||
    'Cliente pendiente'
  const serviceFocus = getServiceOperationalFocus(service)

  return (
    <Card
      key={service.id}
      elevation={0}
      onClick={() => openServiceDetail(service.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openServiceDetail(service.id)
        }
      }}
      role='button'
      tabIndex={0}
      sx={{
        borderRadius: '14px',
        border: `1px solid ${slaTone.border}`,
        background: slaTone.background,
        boxShadow: slaTone.glow,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: `0 10px 22px ${alpha(slaTone.accent, 0.16)}`
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 4,
          backgroundColor: slaTone.accent
        }
      }}
    >
      <CardContent sx={{ p: 1.5 }}>
        <Stack spacing={1.1}>
          <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='flex-start'
            spacing={1}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant='subtitle2'
                fontWeight={800}
                sx={{ color: ui.text, lineHeight: 1.2 }}
              >
                <Box component='span' title='Código interno del servicio (SCL)' sx={{ cursor: 'help' }}>
                  {service.serviceCode}
                </Box>
                {service.quoteCode ? (
                  <Box component='span' title='Consecutivo de cotización' sx={{ ml: 1, color: '#059669', fontWeight: 700, fontSize: '0.75rem', cursor: 'help' }}>
                    · {service.quoteCode}
                  </Box>
                ) : null}
              </Typography>
              <Typography
                variant='caption'
                title={customerLabel}
                sx={{
                  color: ui.textSecondary,
                  mt: 0.25,
                  fontWeight: 700,
                  lineHeight: 1.35,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  minHeight: '2.7em'
                }}
              >
                {customerLabel}
              </Typography>
            </Box>
            <Chip
              size='small'
              label={getCompactSlaLabel(service.slaIndicator?.color)}
              sx={{
                bgcolor: alpha(slaTone.accent, 0.12),
                color: slaTone.accent,
                fontWeight: 800,
                height: 24
              }}
            />
          </Stack>

          <Stack
            direction='row'
            spacing={0.75}
            flexWrap='wrap'
            useFlexGap
          >
            <CalibrationServiceStatusChip
              status={service.status}
            />
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
            {serviceFocus ? (
              <Chip
                size='small'
                color={serviceFocus.color}
                variant='outlined'
                label={serviceFocus.label}
              />
            ) : null}
          </Stack>

          {service.scopeType === 'site' ? (
            <Typography
              variant='caption'
              sx={{ color: ui.muted, lineHeight: 1.35 }}
            >
              Sede: {getServiceSiteLabel(service)}
            </Typography>
          ) : null}

          {assignedMetrologistName ? (
            <Typography
              variant='caption'
              sx={{
                color: ui.textSecondary,
                lineHeight: 1.3,
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {assignedMetrologistNames.length > 1
                ? `Metrólogos: ${assignedMetrologistNames.join(', ')}`
                : `Metrólogo: ${assignedMetrologistName}`}
            </Typography>
          ) : null}

          <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='center'
            sx={{
              pt: 0.25,
              color: ui.textSecondary
            }}
          >
            <Typography variant='caption' fontWeight={700}>
              {service.items?.length ?? 0} item
              {(service.items?.length ?? 0) === 1 ? '' : 's'}
            </Typography>
            {service.otherFields?.hasEquipmentSale === true ? (
              <Chip size='small' color='warning' variant='outlined' label='Venta' sx={{ height: 20, '& .MuiChip-label': { fontSize: '0.65rem', px: 0.5 } }} />
            ) : null}
            <Typography
              variant='caption'
              fontWeight={800}
              sx={{ color: ui.greenDark }}
            >
              {isTechnicalOnlyView
                ? service.odsCode || 'ODS pendiente'
                : currencyFormatter.format(
                    getItemsTotal(service)
                  )}
            </Typography>
          </Stack>

        </Stack>
      </CardContent>
    </Card>
  )
}

export default CalibrationServiceKanbanCard
