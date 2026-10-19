import {
  Alert,
  Box,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import { CalibrationService } from '../../../types/calibrationService'
import {
  currencyFormatter,
  toNumber,
  getEffectiveServiceItemQuantity,
  getApprovedFinancialImpactForItem,
  getApprovedPricingAdjustmentsForItem
} from './calibrationServiceDetailUtils'
import { CalibrationServiceDetailPermissions } from './calibrationServiceDetailTypes'

interface CalibrationServiceItemsTabProps {
  service: CalibrationService
  permissions: CalibrationServiceDetailPermissions
}

/** Pestaña Ítems: cantidades y valores efectivos, incluyendo novedades aprobadas. */
const CalibrationServiceItemsTab = ({
  service,
  permissions
}: CalibrationServiceItemsTabProps) => {
  const { hideFinancialInfo } = permissions
  const showInstrumentColumn = (service.items ?? []).some(
    (item) => item.instrumentName && item.instrumentName !== item.itemName
  )

  return (
    <>
      {service.items?.length ? (
        <Box
          sx={{
            overflowX: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2
          }}
        >
          <Table size='small'>
            <TableHead sx={{ bgcolor: '#f5f5f5', '& .MuiTableCell-root': { fontWeight: 600 } }}>
              <TableRow>
                <TableCell>Ítem</TableCell>
                {showInstrumentColumn ? <TableCell>Instrumento</TableCell> : null}
                <TableCell>Tipo servicio</TableCell>
                <TableCell align='right'>Cantidad</TableCell>
                {!hideFinancialInfo ? (
                  <TableCell align='right'>Precio unitario</TableCell>
                ) : null}
                {!hideFinancialInfo ? (
                  <TableCell align='right'>Subtotal</TableCell>
                ) : null}
                {!hideFinancialInfo ? (
                  <TableCell align='right'>Total</TableCell>
                ) : null}
              </TableRow>
            </TableHead>
            <TableBody>
              {service.items.map((item) => {
                const effectiveQuantity =
                  getEffectiveServiceItemQuantity(service, item)
                const approvedFinancialImpact =
                  getApprovedFinancialImpactForItem(service, item.id)
                const effectiveSubtotal =
                  toNumber(item.subtotal) +
                  approvedFinancialImpact.subtotal
                const effectiveTotal =
                  toNumber(item.total) + approvedFinancialImpact.total
                const hasQuantityAdjustment =
                  effectiveQuantity !== toNumber(item.quantity)
                const isAdjustmentItem = Boolean(
                  item.otherFields?.isAdditionalExecutionItem
                )
                const pricingAdjustments =
                  getApprovedPricingAdjustmentsForItem(
                    service,
                    item.id
                  )

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant='body2'>
                          {item.itemName}
                        </Typography>
                        {item.otherFields?.hasCalibrationPoints !== false ? (
                          <Typography variant='caption' sx={{ color: '#9ca3af', display: 'block' }}>
                            {[
                              item.otherFields?.calibrationPointCount ? `Cantidad puntos: ${item.otherFields.calibrationPointCount}` : '',
                              item.otherFields?.measurementRange ? `Rango medición: ${item.otherFields.measurementRange}` : ''
                            ].filter(Boolean).join(' · ')}
                          </Typography>
                        ) : null}
                        {hasQuantityAdjustment ||
                        approvedFinancialImpact.hasImpact ||
                        isAdjustmentItem ? (
                          <Stack
                            direction='row'
                            spacing={0.5}
                            flexWrap='wrap'
                          >
                            {hasQuantityAdjustment ||
                            approvedFinancialImpact.hasImpact ? (
                              <Chip
                                size='small'
                                color='success'
                                label='Ajustado por novedad'
                              />
                            ) : null}
                            {isAdjustmentItem ? (
                              <Chip
                                size='small'
                                color='info'
                                label='No cotizado aprobado'
                              />
                            ) : null}
                          </Stack>
                        ) : null}
                      </Stack>
                    </TableCell>
                    {showInstrumentColumn ? (
                      <TableCell>
                        {item.instrumentName || 'N/A'}
                      </TableCell>
                    ) : null}
                    <TableCell>{item.serviceType || 'N/A'}</TableCell>
                    <TableCell align='right'>
                      <Stack spacing={0.25} alignItems='flex-end'>
                        <Typography variant='body2'>
                          {effectiveQuantity}
                        </Typography>
                        {hasQuantityAdjustment ? (
                          <Typography
                            variant='caption'
                            color='text.secondary'
                          >
                            Cotizado: {item.quantity}
                          </Typography>
                        ) : null}
                      </Stack>
                    </TableCell>
                    {!hideFinancialInfo ? (
                      <TableCell align='right'>
                        <Stack spacing={0.5} alignItems='flex-end'>
                          <Typography variant='body2'>
                            {currencyFormatter.format(
                              toNumber(item.unitPrice)
                            )}
                          </Typography>
                          <Typography
                            variant='caption'
                            color='text.secondary'
                          >
                            Cotizado original
                          </Typography>
                          {pricingAdjustments.map((adjustment) => (
                            <Box key={adjustment.id}>
                              <Typography
                                variant='body2'
                                color='success.main'
                              >
                                {currencyFormatter.format(
                                  toNumber(
                                    adjustment.approvedUnitPrice
                                  )
                                )}
                              </Typography>
                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                Novedad:{' '}
                                {adjustment.differenceQuantity > 0
                                  ? '+'
                                  : ''}
                                {adjustment.differenceQuantity} und.
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </TableCell>
                    ) : null}
                    {!hideFinancialInfo ? (
                      <TableCell align='right'>
                        <Stack spacing={0.5} alignItems='flex-end'>
                          <Typography variant='body2'>
                            {currencyFormatter.format(
                              effectiveSubtotal
                            )}
                          </Typography>
                          {pricingAdjustments.length ? (
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              Incluye novedades aprobadas
                            </Typography>
                          ) : null}
                        </Stack>
                      </TableCell>
                    ) : null}
                    {!hideFinancialInfo ? (
                      <TableCell align='right'>
                        {currencyFormatter.format(effectiveTotal)}
                      </TableCell>
                    ) : null}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Box>
      ) : (
        <Alert severity='info'>
          Este servicio aún no tiene ítems.
        </Alert>
      )}
    </>
  )
}

export default CalibrationServiceItemsTab
