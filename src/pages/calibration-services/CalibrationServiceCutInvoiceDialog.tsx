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
  }, [cut.invoiceNotes, cut.invoiceReference, cut.invoicedAt, open])

  const trimmedReference = invoiceReference.trim()

  const handleSubmit = () => {
    if (!trimmedReference) {
      return
    }

    void onSubmit({
      invoiceReference: trimmedReference,
      invoicedAt: new Date(invoicedAt).toISOString(),
      invoiceNotes: invoiceNotes.trim() || null
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
