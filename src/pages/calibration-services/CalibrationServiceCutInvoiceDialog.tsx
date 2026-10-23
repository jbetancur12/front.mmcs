import { useEffect, useState } from 'react'
import { MenuItem, Stack, TextField, Typography } from '@mui/material'
import FormDialog from '../../Components/Common/FormDialog'
import FileDropZone from '../../Components/Common/FileDropZone'
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

const buildTodayValue = () => new Date().toISOString().slice(0, 10)

/** Registra la factura de un corte; si el cliente no tiene crédito, luego se pide el pago. */
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
  const [customerHasCredit, setCustomerHasCredit] = useState<boolean | null>(
    null
  )
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    if (!open) {
      return
    }

    setInvoiceReference(cut.invoiceReference || '')
    setInvoicedAt(
      cut.invoicedAt
        ? new Date(cut.invoicedAt).toISOString().slice(0, 10)
        : buildTodayValue()
    )
    setInvoiceNotes(cut.invoiceNotes || '')
    setInvoiceFile(null)
    setCustomerHasCredit(null)
    setUploadError('')
  }, [cut.invoiceNotes, cut.invoiceReference, cut.invoicedAt, open])

  const trimmedReference = invoiceReference.trim()

  const handleSubmit = () => {
    if (!trimmedReference || customerHasCredit === null) {
      return
    }

    void onSubmit({
      invoiceReference: trimmedReference,
      invoicedAt: new Date(`${invoicedAt}T12:00:00`).toISOString(),
      invoiceNotes: invoiceNotes.trim() || null,
      invoiceFile,
      customerHasCredit
    })
  }

  return (
    <FormDialog
      open={open}
      onClose={isLoading ? () => undefined : onClose}
      title='Registrar facturación del corte'
      subtitle={cut.cutCode}
      submitLabel='Marcar facturado'
      onSubmit={handleSubmit}
      loading={isLoading}
      submitDisabled={!trimmedReference || customerHasCredit === null}
    >
      <Stack spacing={2}>
        <TextField
          select
          required
          label='Cliente con crédito'
          value={
            customerHasCredit === null ? '' : customerHasCredit ? 'si' : 'no'
          }
          disabled={isLoading}
          onChange={(event) =>
            setCustomerHasCredit(
              event.target.value === 'si'
                ? true
                : event.target.value === 'no'
                  ? false
                  : null
            )
          }
          helperText='Si eliges No, después de facturar se pedirá registrar el pago.'
        >
          <MenuItem value='si'>Sí</MenuItem>
          <MenuItem value='no'>No</MenuItem>
        </TextField>
        <TextField
          label='Referencia o número de factura'
          value={invoiceReference}
          onChange={(event) => setInvoiceReference(event.target.value)}
          required
          autoFocus
        />
        <TextField
          label='Fecha de facturación'
          type='date'
          value={invoicedAt}
          onChange={(event) => setInvoicedAt(event.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label='Notas de facturación'
          value={invoiceNotes}
          onChange={(event) => setInvoiceNotes(event.target.value)}
          multiline
          minRows={3}
        />
        <div>
          <Typography
            variant='body2'
            fontWeight={600}
            sx={{ color: '#374151', mb: 0.5 }}
          >
            Soporte de factura (opcional)
          </Typography>
          <FileDropZone
            file={invoiceFile}
            onFileSelected={(file) => {
              setUploadError('')
              setInvoiceFile(file)
            }}
            onReject={setUploadError}
            accept='.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx'
            acceptLabel='soporte'
            title='Arrastra el soporte aquí o haz clic para elegirlo'
            hint='PDF, imagen, Word o Excel · máximo 10 MB'
            disabled={isLoading}
          />
          {uploadError ? (
            <Typography variant='caption' color='error'>
              {uploadError}
            </Typography>
          ) : null}
        </div>
      </Stack>
    </FormDialog>
  )
}

export default CalibrationServiceCutInvoiceDialog
