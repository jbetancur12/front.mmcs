import { useState } from 'react'
import { Button, Chip, Stack } from '@mui/material'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import { notify } from 'src/utils/notify'
import { useCalibrationDeliveryMutations } from '../../../hooks/useCalibrationDeliveries'
import { getApiErrorMessage } from '../../../utils/apiError'
import { CalibrationService } from '../../../types/calibrationService'
import CalibrationServicePauseDialog from '../CalibrationServicePauseDialog'

interface Props {
  service: CalibrationService
  /** Capacidad de trazabilidad: quien puede marcar el servicio como listo para entregar. */
  canManage: boolean
}

const ALLOWED_STATUSES = [
  'ods_issued',
  'pending_programming',
  'scheduled',
  'in_execution',
  'technically_completed'
]

interface DeliveryState {
  status?: 'ready' | 'in_transit' | 'delivered' | null
  takenByName?: string | null
  receivedByName?: string | null
}

/**
 * Estado de la entrega del servicio y el botón del laboratorio "Lista para entregar": con él, el servicio aparece en la
 * pantalla Entregas para quien tenga la capacidad de entregar. Si nadie la tomó, se puede retirar de la lista.
 */
const CalibrationDeliveryReadyAction = ({ service, canManage }: Props) => {
  const { setReady } = useCalibrationDeliveryMutations()
  const [isOpen, setIsOpen] = useState(false)
  const logistics = (service.otherFields?.logistics || {}) as {
    delivery?: DeliveryState
  }
  const delivery = logistics.delivery || {}

  if (!ALLOWED_STATUSES.includes(service.status)) {
    return null
  }

  const submit = async ({ notes }: { notes: string }) => {
    try {
      await setReady.mutateAsync({
        serviceId: Number(service.id),
        ready: true,
        notes: notes.trim() || undefined
      })
      setIsOpen(false)
      notify.success('Lista para entregar: ya aparece en Entregas.')
    } catch (error) {
      notify.error(
        getApiErrorMessage(error, 'No fue posible marcar la entrega')
      )
    }
  }

  const unready = async () => {
    try {
      await setReady.mutateAsync({
        serviceId: Number(service.id),
        ready: false
      })
      notify.success('Se retiró de la lista de entregas.')
    } catch (error) {
      notify.error(
        getApiErrorMessage(error, 'No fue posible retirar la entrega')
      )
    }
  }

  return (
    <>
      <Stack
        direction='row'
        spacing={1}
        alignItems='center'
        useFlexGap
        flexWrap='wrap'
      >
        {delivery.status === 'ready' ? (
          <Chip size='small' color='info' label='Lista para entregar' />
        ) : null}
        {delivery.status === 'in_transit' ? (
          <Chip
            size='small'
            color='primary'
            label={`La lleva ${delivery.takenByName}`}
          />
        ) : null}
        {delivery.status === 'delivered' ? (
          <Chip
            size='small'
            color='success'
            label={`Entregada · recibió ${delivery.receivedByName}`}
          />
        ) : null}
        {canManage && (!delivery.status || delivery.status === 'delivered') ? (
          <Button
            variant='outlined'
            startIcon={<LocalShippingOutlinedIcon />}
            onClick={() => setIsOpen(true)}
            disabled={setReady.isLoading}
            sx={{
              color: '#00897B',
              borderColor: '#00BFA5',
              textTransform: 'none',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' }
            }}
          >
            {delivery.status === 'delivered'
              ? 'Marcar otra entrega'
              : 'Lista para entregar'}
          </Button>
        ) : null}
        {canManage && delivery.status === 'ready' ? (
          <Button
            variant='text'
            onClick={() => void unready()}
            disabled={setReady.isLoading}
            sx={{ textTransform: 'none' }}
          >
            Quitar de la lista
          </Button>
        ) : null}
      </Stack>
      <CalibrationServicePauseDialog
        open={isOpen}
        title='Lista para entregar'
        subtitle='Aparece en la pantalla Entregas para que alguien la lleve al cliente.'
        fieldLabel='Nota para quien entrega (opcional)'
        actionLabel='Marcar lista'
        initialValues={{ notes: '' }}
        isLoading={setReady.isLoading}
        onClose={() => setIsOpen(false)}
        onSubmit={submit}
      />
    </>
  )
}

export default CalibrationDeliveryReadyAction
