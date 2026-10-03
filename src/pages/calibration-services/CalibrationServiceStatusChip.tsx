import { Chip, ChipProps } from '@mui/material'
import {
  CALIBRATION_SERVICE_STATUS_COLORS,
  CALIBRATION_SERVICE_STATUS_LABELS,
  CALIBRATION_SERVICE_STATUS_VARIANTS
} from '../../constants/calibrationServices'
import { CalibrationServiceStatus } from '../../types/calibrationService'

interface CalibrationServiceStatusChipProps {
  status: CalibrationServiceStatus
  sx?: ChipProps['sx']
}

const CalibrationServiceStatusChip = ({
  status,
  sx
}: CalibrationServiceStatusChipProps) => (
  <Chip
    size='small'
    color={CALIBRATION_SERVICE_STATUS_COLORS[status]}
    variant={CALIBRATION_SERVICE_STATUS_VARIANTS[status]}
    label={CALIBRATION_SERVICE_STATUS_LABELS[status]}
    sx={{ fontWeight: 600, ...sx }}
  />
)

export default CalibrationServiceStatusChip
