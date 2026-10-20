import {
  Card,
  CardContent,
  Divider,
  Stack,
  Typography
} from '@mui/material'
import { CalibrationService } from '../../../types/calibrationService'
import {
  currencyFormatter,
  formatDateValue
} from './calibrationServiceDetailUtils'
import {
  CalibrationServiceDetailPermissions,
  CalibrationServiceDetailData
} from './calibrationServiceDetailTypes'

interface CalibrationServiceCompactSummaryProps {
  service: CalibrationService
  permissions: CalibrationServiceDetailPermissions
  data: CalibrationServiceDetailData
}

/** Tarjeta lateral con conteos, totales y el próximo foco del servicio. */
const CalibrationServiceCompactSummary = ({
  service,
  permissions,
  data
}: CalibrationServiceCompactSummaryProps) => {
  const {
    isTechnicalOnlyView,
    isAnalystOnlyView
  } = permissions
  const {
    subtotal,
    discountAmount,
    taxTotal,
    grandTotal
  } = data

  return (
    <Card
      sx={{
        borderRadius: 3,
        position: { lg: 'sticky' },
        top: { lg: 24 }
      }}
    >
      <CardContent>
        <Typography variant='h6' fontWeight={700} gutterBottom>
          Resumen compacto
        </Typography>
        <Stack spacing={1.25}>
          <Stack direction='row' justifyContent='space-between'>
            <Typography color='text.secondary'>Ítems</Typography>
            <Typography fontWeight={600}>
              {service.items?.length || 0}
            </Typography>
          </Stack>
          <Stack direction='row' justifyContent='space-between'>
            <Typography color='text.secondary'>Documentos</Typography>
            <Typography fontWeight={600}>
              {service.documents?.length || 0}
            </Typography>
          </Stack>
          <Stack direction='row' justifyContent='space-between'>
            <Typography color='text.secondary'>Eventos</Typography>
            <Typography fontWeight={600}>
              {service.events?.length || 0}
            </Typography>
          </Stack>
          {!isTechnicalOnlyView && !isAnalystOnlyView ? (
            <>
              <Divider />
              <Stack direction='row' justifyContent='space-between'>
                <Typography color='text.secondary'>Subtotal</Typography>
                <Typography fontWeight={600}>
                  {currencyFormatter.format(subtotal)}
                </Typography>
              </Stack>
              {discountAmount > 0 ? (
                <Stack direction='row' justifyContent='space-between'>
                  <Typography color='text.secondary'>Descuento</Typography>
                  <Typography fontWeight={600} color='error'>
                    -{currencyFormatter.format(discountAmount)}
                  </Typography>
                </Stack>
              ) : null}
              <Stack direction='row' justifyContent='space-between'>
                <Typography color='text.secondary'>IVA</Typography>
                <Typography fontWeight={600}>
                  {currencyFormatter.format(taxTotal)}
                </Typography>
              </Stack>
              <Stack direction='row' justifyContent='space-between'>
                <Typography variant='subtitle1' fontWeight={700}>Total</Typography>
                <Typography variant='subtitle1' fontWeight={700} sx={{ color: '#00897B' }}>
                  {currencyFormatter.format(grandTotal)}
                </Typography>
              </Stack>
            </>
          ) : null}
          <Divider />
          <Typography variant='subtitle2' fontWeight={700}>
            Próximo foco
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {service.slaIndicator?.message ||
              'Todavía no hay una alerta operativa activa.'}
          </Typography>
          {service.status === 'closed' ? (
            <Typography variant='body2' color='text.secondary'>
              Estado final: el servicio ya no tiene acciones operativas
              pendientes.
            </Typography>
          ) : null}
          <Typography variant='body2' color='text.secondary'>
            Inicio SLA: {formatDateValue(service.slaIndicator?.startedAt)}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default CalibrationServiceCompactSummary
