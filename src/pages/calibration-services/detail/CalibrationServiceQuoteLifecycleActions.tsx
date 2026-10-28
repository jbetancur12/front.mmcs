import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@mui/material'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined'
import { useCan } from '@utils/functions'
import { notify } from 'src/utils/notify'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCalibrationServiceMutations } from '../../../hooks/useCalibrationServices'
import { getApiErrorMessage } from '../../../utils/apiError'
import { CalibrationService } from '../../../types/calibrationService'
import CalibrationServicePauseDialog from '../CalibrationServicePauseDialog'
import { secondaryActionSx } from './calibrationServiceDetailUtils'

interface Props {
  service: CalibrationService
}

const REOPENABLE_STATUSES = ['expired', 'rejected']

/**
 * Reabrir una cotización vencida o rechazada y duplicar cualquier cotización (H-09, H-11).
 * Cada acción aparece solo con su capacidad: reabrir = decidir sobre la cotización, duplicar = crear servicios.
 */
const CalibrationServiceQuoteLifecycleActions = ({ service }: Props) => {
  const navigate = useNavigate()
  const canReopen = useCan(PERMISSIONS.CALIBRATION_SERVICE_DECIDE)
  const canDuplicate = useCan(PERMISSIONS.CALIBRATION_SERVICE_CREATE)
  const { reopenQuote, duplicateService } = useCalibrationServiceMutations()
  const [isReopenOpen, setIsReopenOpen] = useState(false)

  const showReopen = canReopen && REOPENABLE_STATUSES.includes(service.status)

  const handleReopen = async ({ notes }: { notes: string }) => {
    if (!notes.trim()) {
      notify.error('Indica el motivo para reabrir la cotización.')
      return
    }
    try {
      await reopenQuote.mutateAsync({ serviceId: service.id, reason: notes })
      setIsReopenOpen(false)
      notify.success(
        'Cotización reabierta: vuelve a quedar enviada al cliente.'
      )
    } catch (error) {
      notify.error(
        getApiErrorMessage(error, 'No fue posible reabrir la cotización')
      )
    }
  }

  const handleDuplicate = async () => {
    try {
      const copy = await duplicateService.mutateAsync(service.id)
      notify.success(`Copia creada: ${copy.quoteCode || copy.serviceCode}`)
      navigate(`/calibration-services/${copy.id}`)
    } catch (error) {
      notify.error(
        getApiErrorMessage(error, 'No fue posible duplicar la cotización')
      )
    }
  }

  if (!showReopen && !canDuplicate) {
    return null
  }

  return (
    <>
      {showReopen ? (
        <Button
          variant='contained'
          startIcon={<ReplayOutlinedIcon />}
          onClick={() => setIsReopenOpen(true)}
          disabled={reopenQuote.isLoading}
          disableElevation
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Reabrir cotización
        </Button>
      ) : null}
      {canDuplicate ? (
        <Button
          variant='outlined'
          startIcon={<ContentCopyOutlinedIcon />}
          onClick={() => void handleDuplicate()}
          disabled={duplicateService.isLoading}
          sx={secondaryActionSx}
        >
          Duplicar
        </Button>
      ) : null}
      <CalibrationServicePauseDialog
        open={isReopenOpen}
        title='Reabrir cotización'
        subtitle='Vuelve a quedar enviada al cliente y el plazo de vencimiento empieza de nuevo.'
        fieldLabel='Motivo'
        actionLabel='Reabrir'
        initialValues={{ notes: '' }}
        isLoading={reopenQuote.isLoading}
        onClose={() => setIsReopenOpen(false)}
        onSubmit={handleReopen}
      />
    </>
  )
}

export default CalibrationServiceQuoteLifecycleActions
