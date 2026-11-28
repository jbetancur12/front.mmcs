import { useEffect, useState } from 'react'
import { Alert, MenuItem, Stack, TextField } from '@mui/material'
import FormDialog from '../../../Components/Common/FormDialog'
import FileDropZone from '../../../Components/Common/FileDropZone'
import { useRegisterDeliveries } from '../../../hooks/useCalibrationVisits'
import {
  DeliveryMethod,
  PendingDelivery
} from '../../../types/calibrationVisit'
import { DELIVERY_METHOD_LABELS } from './visitUtils'

interface Props {
  open: boolean
  certificates: PendingDelivery[]
  onClose: () => void
  onDone: () => void
}

/** Dejar constancia de cómo y a quién se entregaron certificados. La plataforma no envía nada. */
const RegisterDeliveryDialog = ({
  open,
  certificates,
  onClose,
  onDone
}: Props) => {
  const [method, setMethod] = useState<DeliveryMethod>('correo')
  const [recipient, setRecipient] = useState('')
  const [note, setNote] = useState('')
  const [support, setSupport] = useState<File | null>(null)
  const mutation = useRegisterDeliveries()
  const everyoneOnPortal =
    certificates.length > 0 && certificates.every((c) => c.hasPortal)
  const customers = [...new Set(certificates.map((c) => c.customerName))]

  useEffect(() => {
    if (!open) return
    setMethod(everyoneOnPortal ? 'plataforma' : 'correo')
    setRecipient('')
    setNote('')
    setSupport(null)
    // Solo al abrir: la lista se recrea en cada render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const submit = () => {
    const data = new FormData()
    data.append('ids', certificates.map((c) => c.id).join(','))
    data.append('method', method)
    data.append('recipient', recipient)
    if (note.trim()) data.append('note', note)
    if (support) data.append('support', support)
    mutation.mutate(data, {
      onSuccess: () => {
        onDone()
        onClose()
      }
    })
  }

  return (
    <FormDialog
      open={open}
      onClose={mutation.isLoading ? () => undefined : onClose}
      title='Registrar entrega'
      subtitle={`${certificates.length} ${certificates.length === 1 ? 'certificado' : 'certificados'}`}
      submitLabel='Registrar entrega'
      onSubmit={submit}
      loading={mutation.isLoading}
      submitDisabled={!recipient.trim()}
      maxWidth='sm'
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        {customers.length > 1 && (
          <Alert severity='warning'>
            Elegiste certificados de {customers.length} clientes: todos quedarán
            con el mismo destinatario.
          </Alert>
        )}
        <TextField
          select
          label='Medio de entrega'
          value={method}
          onChange={(event) => setMethod(event.target.value as DeliveryMethod)}
        >
          {(Object.keys(DELIVERY_METHOD_LABELS) as DeliveryMethod[]).map(
            (key) => (
              <MenuItem key={key} value={key}>
                {DELIVERY_METHOD_LABELS[key]}
              </MenuItem>
            )
          )}
        </TextField>
        <TextField
          label='¿A quién se entregó?'
          value={recipient}
          onChange={(event) => setRecipient(event.target.value)}
          placeholder='Nombre, correo o número'
          required
        />
        <TextField
          label='Nota (opcional)'
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        <FileDropZone
          file={support}
          onFileSelected={setSupport}
          accept='.pdf,.png,.jpg,.jpeg'
          title='Soporte de la entrega (opcional)'
          hint='PDF o imagen · máximo 10 MB'
          disabled={mutation.isLoading}
        />
      </Stack>
    </FormDialog>
  )
}

export default RegisterDeliveryDialog
