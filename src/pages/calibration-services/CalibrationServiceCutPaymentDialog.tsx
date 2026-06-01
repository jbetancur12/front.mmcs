import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography
} from '@mui/material'
import { CalibrationServiceCut } from '../../types/calibrationService'

interface CalibrationServiceCutPaymentDialogProps {
  open: boolean
  cut: CalibrationServiceCut
  isLoading?: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
}

const CalibrationServiceCutPaymentDialog = ({
  open,
  cut,
  isLoading = false,
  onClose,
  onConfirm
}: CalibrationServiceCutPaymentDialogProps) => {
  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} fullWidth maxWidth='sm'>
      <DialogTitle>Registrar pago del corte</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Alert severity='warning'>
            Estás a punto de confirmar el pago del corte <strong>{cut.cutCode}</strong>.
            Esta acción no se puede deshacer.
          </Alert>
          <Typography variant='body2' color='text.secondary'>
            El cliente indicó que <strong>no tiene crédito</strong>, por lo que debes
            confirmar que el pago fue recibido antes de continuar con el control documental.
          </Typography>
          {cut.invoiceReference ? (
            <Typography variant='body2'>
              Factura: <strong>{cut.invoiceReference}</strong>
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          variant='contained'
          color='warning'
          onClick={() => void onConfirm()}
          disabled={isLoading}
        >
          Confirmar pago recibido
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationServiceCutPaymentDialog
