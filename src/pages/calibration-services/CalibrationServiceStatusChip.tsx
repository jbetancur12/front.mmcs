import { Box, SxProps, Theme } from '@mui/material'
import StatusPill from 'src/Components/Common/StatusPill'
import {
  CALIBRATION_SERVICE_STATUS_LABELS,
  CALIBRATION_SERVICE_STATUS_TONES
} from '../../constants/calibrationServices'
import { CalibrationServiceStatus } from '../../types/calibrationService'

interface CalibrationServiceStatusChipProps {
  status: CalibrationServiceStatus
  sx?: SxProps<Theme>
}

/**
 * Estado de un servicio de calibración con StatusPill: fondo suave y texto
 * oscuro (legible), en lugar del chip sólido con texto blanco.
 */
const CalibrationServiceStatusChip = ({
  status,
  sx
}: CalibrationServiceStatusChipProps) => {
  const pill = (
    <StatusPill
      size='small'
      label={CALIBRATION_SERVICE_STATUS_LABELS[status] || status}
      tone={CALIBRATION_SERVICE_STATUS_TONES[status] || 'idle'}
    />
  )
  return sx ? (
    <Box component='span' sx={sx}>
      {pill}
    </Box>
  ) : (
    pill
  )
}

export default CalibrationServiceStatusChip
