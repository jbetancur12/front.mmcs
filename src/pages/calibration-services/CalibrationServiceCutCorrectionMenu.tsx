import { useState } from 'react'
import { Button, Menu, MenuItem, Stack, TextField } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useCan } from '@utils/functions'
import { notify } from 'src/utils/notify'
import { PERMISSIONS } from 'src/constants/permissions'
import FormDialog from 'src/Components/Common/FormDialog'
import { useCalibrationServiceMutations } from '../../hooks/useCalibrationServices'
import { getApiErrorMessage } from '../../utils/apiError'
import {
  CalibrationService,
  CalibrationServiceCut
} from '../../types/calibrationService'
import CalibrationServiceCutDialog from './CalibrationServiceCutDialog'

type CorrectionKind = 'void' | 'revert' | 'invoice'

interface Props {
  serviceId: number | string
  /** Servicio completo: hace falta para editar las cantidades de un corte en borrador. */
  service?: CalibrationService
  cut: CalibrationServiceCut
  /** El servicio cerrado, cancelado o pausado no admite correcciones. */
  disabled?: boolean
}

const DIALOG_COPY: Record<
  CorrectionKind,
  { title: string; subtitle: string; submit: string }
> = {
  void: {
    title: 'Anular corte',
    subtitle:
      'El corte se elimina y sus cantidades vuelven a quedar por liberar.',
    submit: 'Anular corte'
  },
  revert: {
    title: 'Devolver a borrador',
    subtitle:
      'El corte deja de estar listo para facturar y se puede editar de nuevo.',
    submit: 'Devolver a borrador'
  },
  invoice: {
    title: 'Corregir factura',
    subtitle:
      'Cambia la referencia de factura del corte. Queda en el historial.',
    submit: 'Guardar corrección'
  }
}

/**
 * Correcciones de un corte (H-12): anular un borrador, devolver un corte listo para facturar a borrador y corregir
 * la referencia de factura. Anular y devolver piden la capacidad de ejecutar; corregir factura, la de facturar.
 */
const CalibrationServiceCutCorrectionMenu = ({
  serviceId,
  service,
  cut,
  disabled = false
}: Props) => {
  const canExecute = useCan(PERMISSIONS.CALIBRATION_SERVICE_EXECUTE)
  const canInvoice = useCan(PERMISSIONS.CALIBRATION_SERVICE_INVOICING)
  const { voidCut, revertCutToDraft, correctCutInvoice, updateDraftCut } =
    useCalibrationServiceMutations()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [kind, setKind] = useState<CorrectionKind | null>(null)
  const [reason, setReason] = useState('')
  const [invoiceReference, setInvoiceReference] = useState('')

  const canEdit = canExecute && cut.status === 'draft' && Boolean(service)

  const options: { kind: CorrectionKind; label: string }[] = [
    ...(canExecute && cut.status === 'draft'
      ? [{ kind: 'void' as const, label: 'Anular corte' }]
      : []),
    ...(canExecute && cut.status === 'ready_for_invoicing'
      ? [{ kind: 'revert' as const, label: 'Devolver a borrador' }]
      : []),
    ...(canInvoice && cut.status === 'invoiced'
      ? [{ kind: 'invoice' as const, label: 'Corregir factura' }]
      : [])
  ]

  if (!options.length && !canEdit) {
    return null
  }

  const isLoading =
    voidCut.isLoading ||
    revertCutToDraft.isLoading ||
    correctCutInvoice.isLoading

  const open = (next: CorrectionKind) => {
    setAnchor(null)
    setReason('')
    setInvoiceReference(next === 'invoice' ? cut.invoiceReference || '' : '')
    setKind(next)
  }

  const handleSubmit = async () => {
    if (!kind) return
    if (reason.trim().length < 5) {
      notify.error('Escribe el motivo de la corrección.')
      return
    }
    if (kind === 'invoice' && !invoiceReference.trim()) {
      notify.error('Indica la referencia de factura correcta.')
      return
    }
    const base = { serviceId, cutId: cut.id, reason }
    try {
      if (kind === 'void') await voidCut.mutateAsync(base)
      if (kind === 'revert') await revertCutToDraft.mutateAsync(base)
      if (kind === 'invoice') {
        await correctCutInvoice.mutateAsync({ ...base, invoiceReference })
      }
      notify.success('Corrección registrada.')
      setKind(null)
    } catch (error) {
      notify.error(
        getApiErrorMessage(error, 'No fue posible registrar la corrección')
      )
    }
  }

  return (
    <>
      <Button
        size='small'
        variant='text'
        endIcon={<ExpandMoreIcon />}
        onClick={(event) => setAnchor(event.currentTarget)}
        disabled={disabled || isLoading}
        aria-haspopup='menu'
        sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
      >
        Corregir
      </Button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
      >
        {canEdit ? (
          <MenuItem
            onClick={() => {
              setAnchor(null)
              setIsEditOpen(true)
            }}
          >
            Editar corte
          </MenuItem>
        ) : null}
        {options.map((option) => (
          <MenuItem key={option.kind} onClick={() => open(option.kind)}>
            {option.label}
          </MenuItem>
        ))}
      </Menu>
      {service ? (
        <CalibrationServiceCutDialog
          open={isEditOpen}
          service={service}
          editingCut={cut}
          isLoading={updateDraftCut.isLoading}
          onClose={() => setIsEditOpen(false)}
          onSubmit={async (values) => {
            try {
              await updateDraftCut.mutateAsync({
                serviceId,
                cutId: cut.id,
                reason: values.reason || '',
                cutType: values.cutType,
                notes: values.notes,
                items: values.items
              })
              setIsEditOpen(false)
              notify.success('Corte actualizado.')
            } catch (error) {
              notify.error(
                getApiErrorMessage(error, 'No fue posible editar el corte')
              )
            }
          }}
        />
      ) : null}
      <FormDialog
        open={Boolean(kind)}
        onClose={isLoading ? () => undefined : () => setKind(null)}
        title={kind ? DIALOG_COPY[kind].title : ''}
        subtitle={kind ? `${cut.cutCode} · ${DIALOG_COPY[kind].subtitle}` : ''}
        submitLabel={kind ? DIALOG_COPY[kind].submit : ''}
        onSubmit={() => void handleSubmit()}
        loading={isLoading}
      >
        <Stack spacing={2}>
          {kind === 'invoice' ? (
            <TextField
              fullWidth
              label='Referencia de factura correcta'
              value={invoiceReference}
              onChange={(event) => setInvoiceReference(event.target.value)}
            />
          ) : null}
          <TextField
            fullWidth
            multiline
            minRows={3}
            label='Motivo'
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </Stack>
      </FormDialog>
    </>
  )
}

export default CalibrationServiceCutCorrectionMenu
