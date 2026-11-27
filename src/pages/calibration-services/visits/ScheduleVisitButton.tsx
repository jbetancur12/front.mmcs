import { useState } from 'react'
import { Button, SxProps, Theme } from '@mui/material'
import EventOutlinedIcon from '@mui/icons-material/EventOutlined'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import { useFeature } from 'src/hooks/useFeatureFlags'
import { CalibrationService } from '../../../types/calibrationService'
import VisitFormDialog from './VisitFormDialog'

/** Acción principal del encabezado cuando la orden está lista para su primera visita. */
const ScheduleVisitButton = ({
  service,
  sx
}: {
  service: CalibrationService
  sx?: SxProps<Theme>
}) => {
  const [open, setOpen] = useState(false)
  const visitsOn = useFeature('calibration_visits')
  const canSchedule = useCan(PERMISSIONS.CALIBRATION_SERVICE_SCHEDULE)
  const ready =
    ['ods_issued', 'pending_programming'].includes(service.status) &&
    !service.isPaused

  if (!visitsOn || !canSchedule || !ready) return null

  return (
    <>
      <Button
        variant='contained'
        startIcon={<EventOutlinedIcon />}
        onClick={() => setOpen(true)}
        disableElevation
        sx={sx}
      >
        Programar visita
      </Button>
      <VisitFormDialog
        open={open}
        service={service}
        onClose={() => setOpen(false)}
      />
    </>
  )
}

export default ScheduleVisitButton
