import ConfirmDialog from '../../Components/Common/ConfirmDialog'
import { CalibrationServiceCut } from '../../types/calibrationService'

interface CalibrationServiceCutPaymentDialogProps {
  open: boolean
  cut: CalibrationServiceCut
  isLoading?: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
}

/** Confirma que el pago del corte fue recibido (clientes sin crédito). */
const CalibrationServiceCutPaymentDialog = ({
  open,
  cut,
  isLoading = false,
  onClose,
  onConfirm
}: CalibrationServiceCutPaymentDialogProps) => (
  <ConfirmDialog
    open={open}
    title='Registrar pago del corte'
    message={
      <>
        Vas a confirmar el pago del corte <strong>{cut.cutCode}</strong>. Esta
        acción no se puede deshacer.
        <br />
        <br />
        El cliente indicó que <strong>no tiene crédito</strong>, así que confirma
        que el pago ya fue recibido antes de seguir con el control documental.
        {cut.invoiceReference ? (
          <>
            <br />
            <br />
            Factura: <strong>{cut.invoiceReference}</strong>
          </>
        ) : null}
      </>
    }
    confirmLabel='Confirmar pago recibido'
    loading={isLoading}
    onConfirm={() => void onConfirm()}
    onClose={onClose}
  />
)

export default CalibrationServiceCutPaymentDialog
