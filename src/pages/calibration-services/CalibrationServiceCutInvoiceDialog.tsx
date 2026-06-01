import { useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
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
    customerHasCredit: boolean
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
  const [customerHasCredit, setCustomerHasCredit] = useState<boolean | null>(null)

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
    setCustomerHasCredit(null)
  }, [cut.invoiceNotes, cut.invoiceReference, cut.invoicedAt, open])

  const trimmedReference = invoiceReference.trim()

  const handleSubmit = () => {
    if (!trimmedReference) {
      return
    }

    if (customerHasCredit === null) {
      return
    }

    void onSubmit({
      invoiceReference: trimmedReference,
      invoicedAt: new Date(invoicedAt).toISOString(),
      invoiceNotes: invoiceNotes.trim() || null,
      invoiceFile,
      customerHasCredit
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
          <FormControl fullWidth required error={customerHasCredit === null}>
            <InputLabel>Cliente con crédito</InputLabel>
            <Select
              value={customerHasCredit === null ? '' : customerHasCredit ? 'si' : 'no'}
              label='Cliente con crédito'
              disabled={isLoading}
              onChange={(event) =>
                setCustomerHasCredit(event.target.value === 'si' ? true : event.target.value === 'no' ? false : null)
              }
            >
              <MenuItem value='si'>Sí</MenuItem>
              <MenuItem value='no'>No</MenuItem>
            </Select>
            <FormHelperText>
              Indica si el cliente tiene crédito. Si seleccionas No, se solicitará registrar el pago después de facturar.
            </FormHelperText>
          </FormControl>
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
          disabled={isLoading || !trimmedReference || customerHasCredit === null}
        >
          Marcar facturado
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationServiceCutInvoiceDialog
