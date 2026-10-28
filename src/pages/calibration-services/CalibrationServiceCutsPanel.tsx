import { useState } from 'react'
import { Alert, Box, Button, Chip, Dialog, DialogContent, DialogTitle, Grid, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material'
import { CalibrationServiceAdjustment, CalibrationServiceCut } from '../../types/calibrationService'
import {
  CALIBRATION_SERVICE_CUT_DOCUMENT_STATUS_LABELS,
  CALIBRATION_SERVICE_CUT_STATUS_LABELS
} from '../../constants/calibrationServices'

import { DetailField } from './CalibrationServiceDetailBlocks'
import CalibrationServiceCutCorrectionMenu from './CalibrationServiceCutCorrectionMenu'
interface CalibrationServiceCutsPanelProps {
  cuts: CalibrationServiceCut[]
  canMarkReady?: boolean
  canMarkInvoiced?: boolean
  canRegisterPayment?: boolean
  canUpdateDocumentControl?: boolean
  /** Id del servicio y si admite correcciones de cortes (no cerrado, cancelado ni pausado). */
  serviceId?: number | string
  canCorrectCuts?: boolean
  /** Novedades del servicio: sirven para avisar antes del clic que un corte no puede quedar listo para facturar. */
  adjustments?: CalibrationServiceAdjustment[]
  isBusy?: boolean
  onMarkReady?: (cutId: number) => void | Promise<void>
  onMarkInvoiced?: (cut: CalibrationServiceCut) => void
  onRegisterPayment?: (cut: CalibrationServiceCut) => void
  onUpdateDocumentControl?: (cut: CalibrationServiceCut) => void
}

// H-08: solo bloquean la factura las novedades abiertas de los ítems del corte (las que no están ligadas a un ítem
// afectan a todos). Misma regla que el API en billing.controller.js (hasBlockingAdjustmentsForInvoicing).
const OPEN_ADJUSTMENT_STATUSES = [
  'reported',
  'pending_customer_approval',
  'customer_changes_requested'
]

const getBlockingAdjustments = (
  cut: CalibrationServiceCut,
  adjustments: CalibrationServiceAdjustment[]
) => {
  const cutItemIds = (cut.items || []).map((item) => item.serviceItemId)

  return adjustments.filter((adjustment) => {
    if (adjustment.serviceItemId && !cutItemIds.includes(adjustment.serviceItemId)) {
      return false
    }
    if (OPEN_ADJUSTMENT_STATUSES.includes(adjustment.status)) {
      return true
    }
    return (
      adjustment.status === 'customer_rejected' &&
      adjustment.otherFields?.contractModificationRequired !== false
    )
  })
}

const cutTypeLabels = {
  partial: 'Parcial',
  final: 'Final'
} as const

const CalibrationServiceCutsPanel = ({
  cuts,
  canMarkReady = false,
  canMarkInvoiced = false,
  canUpdateDocumentControl = false,
  canRegisterPayment = false,
  serviceId,
  canCorrectCuts = false,
  adjustments = [],
  isBusy = false,
  onMarkReady,
  onMarkInvoiced,
  onRegisterPayment,
  onUpdateDocumentControl
}: CalibrationServiceCutsPanelProps) => {
  const [detailCut, setDetailCut] = useState<CalibrationServiceCut | null>(null)

  if (!cuts.length) {
    return <Alert severity='info'>Este servicio todavía no tiene cortes creados.</Alert>
  }

  return (
    <>
    <Stack spacing={2}>
      {cuts.map((cut) => {
        const documentControl = cut.otherFields?.documentControl
                    const invoiceEvidenceCount =
                      cut.invoiceEvidenceDocumentIds?.length ||
                      ((cut.otherFields?.invoiceEvidenceDocumentIds as number[] | undefined)
                        ?.length ?? 0)

        return (
          <Paper key={cut.id} variant='outlined' sx={{ p: 2, borderRadius: '12px', borderColor: '#e5e7eb' }}>
            <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap sx={{ mb: 2 }}>
              <Typography fontWeight={700}>{cut.cutCode}</Typography>
              <Chip size='small' label={cutTypeLabels[cut.cutType]} />
              <Typography variant='body2' color='text.secondary'>
                {CALIBRATION_SERVICE_CUT_STATUS_LABELS[cut.status]}
              </Typography>
              <Box sx={{ ml: { sm: 'auto' } }}>
                <Chip
                  size='small'
                  color={
                    cut.slaIndicator?.color === 'green'
                      ? 'success'
                      : cut.slaIndicator?.color === 'yellow'
                        ? 'warning'
                        : cut.slaIndicator?.color === 'red'
                          ? 'error'
                          : cut.slaIndicator?.color === 'blue'
                            ? 'info'
                            : 'default'
                  }
                  label={cut.slaIndicator?.label || 'Sin iniciar'}
                />
              </Box>
            </Stack>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <DetailField label='Ítems'>
                  <Chip
                  size='small'
                  color='primary'
                  variant='filled'
                  label={`${(cut.items || []).length} ítems`}
                  onClick={() => setDetailCut(cut)}
                  sx={{
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                    '&:hover': { transform: 'scale(1.06)' }
                  }}
                />
                </DetailField>
              </Grid>
              <Grid item xs={6} md={3}>
                <DetailField label='Fecha de liberación'>
                  {cut.releasedAt
                  ? new Date(cut.releasedAt).toLocaleDateString('es-CO')
                  : 'Sin fecha'}
                </DetailField>
              </Grid>
              <Grid item xs={12} md={3}>
                <DetailField label='Factura'>
                  {cut.invoiceReference ? (
                  <Stack spacing={0.5}>
                    <Typography variant='body2'>
                      {`${cut.invoiceReference}${cut.invoicedAt ? ` · ${new Date(cut.invoicedAt).toLocaleDateString('es-CO')}` : ''}`}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {invoiceEvidenceCount
                        ? `Soporte factura: ${invoiceEvidenceCount}`
                        : 'Sin soporte adjunto'}
                    </Typography>
                    {cut.status === 'invoiced' ? (
                      <Chip
                        size='small'
                        variant='outlined'
                        color={cut.paymentRegisteredAt ? 'success' : cut.customerHasCredit ? 'info' : 'warning'}
                        label={
                          cut.paymentRegisteredAt
                            ? `Pagado ${new Date(cut.paymentRegisteredAt).toLocaleDateString('es-CO')}`
                            : cut.customerHasCredit
                              ? 'Crédito: por cobrar'
                              : 'Contado: sin pago'
                        }
                        sx={{ alignSelf: 'flex-start' }}
                      />
                    ) : null}
                  </Stack>
                ) : (
                  'Pendiente'
                )}
                </DetailField>
              </Grid>
              <Grid item xs={12} md={3}>
                <DetailField label='Control documental'>
                  {documentControl ? (
                  <Stack spacing={0.5}>
                    <Chip
                      size='small'
                      color={
                        documentControl.status === 'sent'
                          ? 'success'
                          : documentControl.status === 'reviewed'
                            ? 'info'
                            : documentControl.status === 'certificates_ready'
                              ? 'primary'
                              : documentControl.status === 'certificates_partial'
                                ? 'warning'
                                : 'default'
                      }
                      label={
                        CALIBRATION_SERVICE_CUT_DOCUMENT_STATUS_LABELS[
                          documentControl.status
                        ]
                      }
                    />
                    <Typography variant='body2' color='text.secondary'>
                      Esp. {documentControl.expectedCertificates} · Car. {documentControl.uploadedCertificates} · Rev. {documentControl.reviewedCertificates} · Env. {documentControl.sentCertificates}
                    </Typography>
                    {documentControl.sentCertificates > 0 ? (
                      <Typography variant='body2' color='text.secondary'>
                        {documentControl.sendChannel || 'Canal pendiente'} ·{' '}
                        {documentControl.sentTo || 'Destinatario pendiente'}
                      </Typography>
                    ) : null}
                    {documentControl.evidenceDocumentIds?.length ? (
                      <Typography variant='body2' color='text.secondary'>
                        Soportes: {documentControl.evidenceDocumentIds.length}
                      </Typography>
                    ) : null}
                  </Stack>
                ) : (
                  'Sin control'
                )}
                </DetailField>
              </Grid>
              <Grid item xs={12} md={9}>
                <DetailField label='Notas'>
                  {cut.notes || 'Sin notas'}
                </DetailField>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', justifyContent: { md: 'flex-end' }, alignItems: 'flex-end', height: '100%' }}>
                  {canMarkReady && cut.status === 'draft' ? (
                  <Tooltip
                    title={
                      getBlockingAdjustments(cut, adjustments).length
                        ? `Hay ${getBlockingAdjustments(cut, adjustments).length} novedad(es) abierta(s) en los ítems de este corte: resuélvelas antes de facturar.`
                        : ''
                    }
                  >
                    <span>
                      <Button
                        size='small'
                        variant='outlined'
                        onClick={() => void onMarkReady?.(cut.id)}
                        disabled={
                          isBusy ||
                          getBlockingAdjustments(cut, adjustments).length > 0
                        }
                      >
                        Listo para facturar
                      </Button>
                    </span>
                  </Tooltip>
                ) : canMarkInvoiced && cut.status === 'ready_for_invoicing' ? (
                  <Button
                    size='small'
                    variant='contained'
                    onClick={() => onMarkInvoiced?.(cut)}
                    disabled={isBusy}
                  >
                    Marcar facturado
                  </Button>
                ) : (canUpdateDocumentControl || canRegisterPayment) && cut.status === 'invoiced' && cut.customerHasCredit === false && !cut.paymentRegisteredAt ? (
                  canRegisterPayment && onRegisterPayment ? (
                    <Button
                      size='small'
                      variant='contained'
                      color='warning'
                      onClick={() => onRegisterPayment(cut)}
                      disabled={isBusy}
                    >
                      ⚠ Registrar pago
                    </Button>
                  ) : (
                    <Typography variant='body2' color='text.secondary'>
                      Esperando pago de facturación
                    </Typography>
                  )
                ) : canUpdateDocumentControl && cut.status === 'invoiced' ? (
                  <Stack spacing={0.5}>
                    <Button
                      size='small'
                      variant='outlined'
                      onClick={() => onUpdateDocumentControl?.(cut)}
                      disabled={isBusy}
                    >
                      Control documental
                    </Button>
                    {/* A crédito el pago pendiente no bloquea certificados, pero se registra igual */}
                    {canRegisterPayment &&
                    onRegisterPayment &&
                    cut.customerHasCredit &&
                    !cut.paymentRegisteredAt ? (
                      <Button
                        size='small'
                        variant='text'
                        onClick={() => onRegisterPayment(cut)}
                        disabled={isBusy}
                        sx={{ textTransform: 'none', color: '#00695C' }}
                      >
                        Registrar pago
                      </Button>
                    ) : null}
                  </Stack>
                ) : canRegisterPayment &&
                  onRegisterPayment &&
                  cut.status === 'invoiced' &&
                  cut.customerHasCredit &&
                  !cut.paymentRegisteredAt ? (
                  <Button
                    size='small'
                    variant='outlined'
                    onClick={() => onRegisterPayment(cut)}
                    disabled={isBusy}
                  >
                    Registrar pago
                  </Button>
                ) : (
                  'Sin acción'
                )}
                {serviceId !== undefined ? (
                  <CalibrationServiceCutCorrectionMenu
                    serviceId={serviceId}
                    cut={cut}
                    disabled={!canCorrectCuts || isBusy}
                  />
                ) : null}
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )
      })}
    </Stack>
    <Dialog open={!!detailCut} onClose={() => setDetailCut(null)} maxWidth='xs' fullWidth>
      <DialogTitle>Items del corte</DialogTitle>
      <DialogContent>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell align='right'>Cantidad</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(detailCut?.items || []).map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.serviceItem?.itemName || `Ítem ${item.serviceItemId}`}</TableCell>
                <TableCell align='right'>{item.quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
    </>
  )
}

export default CalibrationServiceCutsPanel
