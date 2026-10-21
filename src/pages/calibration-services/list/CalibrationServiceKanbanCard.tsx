import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import {
  CALIBRATION_SERVICE_APPROVAL_COLORS,
  CALIBRATION_SERVICE_APPROVAL_LABELS,
  CALIBRATION_SERVICE_SLA_COLORS,
  chipColorToStatusTone
} from '../../../constants/calibrationServices'
import StatusPill from 'src/Components/Common/StatusPill'
import { CalibrationService } from '../../../types/calibrationService'
import CalibrationServiceStatusChip from '../CalibrationServiceStatusChip'
import { currencyFormatter, ui } from './calibrationServicesListConstants'
import {
  getCompactSlaLabel,
  getItemsTotal,
  getMetrologistNames,
  getServiceOperationalFocus,
  getServiceSiteLabel
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
        // Tarjeta blanca del sistema; el semáforo va en la pastilla
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        backgroundColor: '#fff',
        boxShadow: 'none',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'border-color .15s, box-shadow .15s',
        '&:hover': {
          borderColor: '#9ca3af',
          boxShadow: '0 4px 12px rgba(17, 24, 39, 0.08)'
        },
        '&:focus-visible': { outline: '3px solid #00695C', outlineOffset: 2 },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' }
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
                  <Box component='span' title='Consecutivo de cotización' sx={{ ml: 1, color: ui.textSecondary, fontWeight: 600, fontSize: '0.75rem', cursor: 'help' }}>
                    {service.quoteCode}
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
            <StatusPill
              size='small'
              label={getCompactSlaLabel(service.slaIndicator?.color)}
              tone={chipColorToStatusTone(
                CALIBRATION_SERVICE_SLA_COLORS[service.slaIndicator?.color || 'gray']
              )}
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
            {!isTechnicalOnlyView &&
            service.approvalStatus !== 'approved' &&
            !(
              service.approvalStatus === 'pending' &&
              ['draft', 'pending_approval'].includes(service.status)
            ) ? (
              <StatusPill
                size='small'
                tone={chipColorToStatusTone(
                  CALIBRATION_SERVICE_APPROVAL_COLORS[service.approvalStatus]
                )}
                label={CALIBRATION_SERVICE_APPROVAL_LABELS[service.approvalStatus]}
              />
            ) : null}
            {serviceFocus ? (
              <StatusPill
                size='small'
                tone={chipColorToStatusTone(serviceFocus.color)}
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
              <Chip size='small' color='warning' variant='outlined' label='Venta de equipos' sx={{ height: 20, '& .MuiChip-label': { fontSize: '0.65rem', px: 0.5 } }} />
            ) : null}
            <Typography
              variant='caption'
              fontWeight={700}
              sx={{ color: '#00695C' }}
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
