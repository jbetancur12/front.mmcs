import { Alert, Box, Button, Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { CalibrationServiceCut } from '../../types/calibrationService'
import {
  CALIBRATION_SERVICE_CUT_DOCUMENT_STATUS_LABELS,
  CALIBRATION_SERVICE_CUT_STATUS_LABELS
} from '../../constants/calibrationServices'

interface CalibrationServiceCutsPanelProps {
  cuts: CalibrationServiceCut[]
  canMarkReady?: boolean
  canMarkInvoiced?: boolean
  canUpdateDocumentControl?: boolean
  isBusy?: boolean
  onMarkReady?: (cutId: number) => void | Promise<void>
  onMarkInvoiced?: (cut: CalibrationServiceCut) => void
  onUpdateDocumentControl?: (cut: CalibrationServiceCut) => void
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
  isBusy = false,
  onMarkReady,
  onMarkInvoiced,
  onUpdateDocumentControl
}: CalibrationServiceCutsPanelProps) => {
  if (!cuts.length) {
    return <Alert severity='info'>Este servicio todavía no tiene cortes creados.</Alert>
  }

  return (
    <Box sx={{ overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>Código</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Semáforo</TableCell>
            <TableCell>Items</TableCell>
            <TableCell>Fecha liberación</TableCell>
            <TableCell>Factura</TableCell>
            <TableCell>Control documental</TableCell>
            <TableCell>Notas</TableCell>
            <TableCell>Acción</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cuts.map((cut) => {
            const documentControl = cut.otherFields?.documentControl
            const invoiceEvidenceCount =
              cut.invoiceEvidenceDocumentIds?.length ||
              ((cut.otherFields?.invoiceEvidenceDocumentIds as number[] | undefined)
                ?.length ?? 0)

            return (
            <TableRow key={cut.id}>
              <TableCell>{cut.cutCode}</TableCell>
              <TableCell>
                <Chip size='small' label={cutTypeLabels[cut.cutType]} />
              </TableCell>
              <TableCell>{CALIBRATION_SERVICE_CUT_STATUS_LABELS[cut.status]}</TableCell>
              <TableCell>
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
              </TableCell>
              <TableCell>
                <Stack spacing={0.5}>
                  {(cut.items || []).map((item) => (
                    <Typography key={item.id} variant='body2'>
                      {item.serviceItem?.itemName || `Ítem ${item.serviceItemId}`} · {item.quantity}
                    </Typography>
                  ))}
                </Stack>
              </TableCell>
              <TableCell>
                {cut.releasedAt
                  ? new Date(cut.releasedAt).toLocaleDateString('es-CO')
                  : 'Sin fecha'}
              </TableCell>
              <TableCell>
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
                  </Stack>
                ) : (
                  'Pendiente'
                )}
              </TableCell>
              <TableCell>
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
              </TableCell>
              <TableCell>{cut.notes || 'Sin notas'}</TableCell>
              <TableCell>
                {canMarkReady && cut.status === 'draft' ? (
                  <Button
                    size='small'
                    variant='outlined'
                    onClick={() => void onMarkReady?.(cut.id)}
                    disabled={isBusy}
                  >
                    Listo para facturar
                  </Button>
                ) : canMarkInvoiced && cut.status === 'ready_for_invoicing' ? (
                  <Button
                    size='small'
                    variant='contained'
                    onClick={() => onMarkInvoiced?.(cut)}
                    disabled={isBusy}
                  >
                    Marcar facturado
                  </Button>
                ) : canUpdateDocumentControl && cut.status === 'invoiced' ? (
                  <Button
                    size='small'
                    variant='outlined'
                    onClick={() => onUpdateDocumentControl?.(cut)}
                    disabled={isBusy}
                  >
                    Control documental
                  </Button>
                ) : (
                  'Sin acción'
                )}
              </TableCell>
            </TableRow>
          )})}
        </TableBody>
      </Table>
    </Box>
  )
}

export default CalibrationServiceCutsPanel
