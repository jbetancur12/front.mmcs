import { useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { CalibrationServiceCut } from '../../types/calibrationService'

interface CalibrationServiceCutInvoiceDialogProps {
  open: boolean
  cut: CalibrationServiceCut
  isLoading?: boolean
  onClose: () => void
  onSubmit: (values: {
    invoiceReference: string
    invoicedAt: string
    invoiceNotes?: string | null
    invoiceFile?: File | null
  }) => void | Promise<void>
}

const buildTodayValue = () => new Date().toISOString().slice(0, 16)

const CalibrationServiceCutInvoiceDialog = ({
  open,
  cut,
  isLoading = false,
  onClose,
  onSubmit
}: CalibrationServiceCutInvoiceDialogProps) => {
  const [invoiceReference, setInvoiceReference] = useState('')
  const [invoicedAt, setInvoicedAt] = useState(buildTodayValue())
  const [invoiceNotes, setInvoiceNotes] = useState('')
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    setInvoiceReference(cut.invoiceReference || '')
    setInvoicedAt(
      cut.invoicedAt
        ? new Date(cut.invoicedAt).toISOString().slice(0, 16)
        : buildTodayValue()
    )
    setInvoiceNotes(cut.invoiceNotes || '')
    setInvoiceFile(null)
  }, [cut.invoiceNotes, cut.invoiceReference, cut.invoicedAt, open])

  const trimmedReference = invoiceReference.trim()

  const handleSubmit = () => {
    if (!trimmedReference) {
      return
    }

    void onSubmit({
      invoiceReference: trimmedReference,
      invoicedAt: new Date(invoicedAt).toISOString(),
      invoiceNotes: invoiceNotes.trim() || null,
      invoiceFile
    })
  }

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} fullWidth maxWidth='sm'>
      <DialogTitle>Registrar facturación del corte</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Typography variant='body2' color='text.secondary'>
            {cut.cutCode} · registra la referencia y fecha de factura para cerrar esta etapa
            administrativa del corte.
          </Typography>
          <TextField
            label='Referencia o número de factura'
            value={invoiceReference}
            onChange={(event) => setInvoiceReference(event.target.value)}
            fullWidth
            required
            autoFocus
          />
          <TextField
            label='Fecha de facturación'
            type='datetime-local'
            value={invoicedAt}
            onChange={(event) => setInvoicedAt(event.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label='Notas de facturación'
            value={invoiceNotes}
            onChange={(event) => setInvoiceNotes(event.target.value)}
            fullWidth
            multiline
            minRows={3}
          />
          <Stack spacing={1}>
            <Typography variant='body2' color='text.secondary'>
              Soporte de factura opcional. Si lo adjuntas aquí, el corte guarda el
              número de factura junto con el archivo para auditoría.
            </Typography>
            <Button variant='outlined' component='label' disabled={isLoading}>
              {invoiceFile ? 'Cambiar soporte de factura' : 'Adjuntar soporte de factura'}
              <input
                hidden
                type='file'
                accept='.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx'
                onChange={(event) =>
                  setInvoiceFile(event.target.files?.[0] || null)
                }
              />
            </Button>
            {invoiceFile ? (
              <Typography variant='body2'>{invoiceFile.name}</Typography>
            ) : (
              <Typography variant='body2' color='text.secondary'>
                Sin archivo adjunto.
              </Typography>
            )}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          variant='contained'
          onClick={handleSubmit}
          disabled={isLoading || !trimmedReference}
        >
          Marcar facturado
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationServiceCutInvoiceDialog
