import SignalLoader from 'src/Components/Common/SignalLoader'
import { Alert, Box, Button } from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useCalibrationService,
  useCalibrationServiceSequenceConfig,
  useCalibrationServiceSlaConfig
} from '../../hooks/useCalibrationServices'
import { getApiErrorMessage } from '../../utils/apiError'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import CalibrationServiceDetailsView from './detail/CalibrationServiceDetailsView'
import useCalibrationServiceDetailTab from './detail/useCalibrationServiceDetailTab'

const CalibrationServiceDetailsPage = () => {
  const navigate = useNavigate()
  const { serviceId } = useParams<{ serviceId: string }>()
  const {
    data: service,
    isLoading,
    isError,
    error
  } = useCalibrationService(serviceId)
  const canManageSequenceConfig = useCan(PERMISSIONS.CALIBRATION_CONFIG_SEQUENCE)
  const { data: sequenceConfig, isLoading: isLoadingSequenceConfig } =
    useCalibrationServiceSequenceConfig(canManageSequenceConfig)
  const { data: slaConfig } = useCalibrationServiceSlaConfig(Boolean(serviceId))
  const [activeTab, setActiveTab] = useCalibrationServiceDetailTab(serviceId)

  if (isLoading || isLoadingSequenceConfig) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='55vh'
      >
        <SignalLoader />
      </Box>
    )
  }

  if (isError || !service) {
    return (
      <Box p={3}>
        <Alert
          severity='error'
          action={
            <Button color='inherit' size='small' onClick={() => navigate('/calibration-services')}>
              Volver a la bandeja
            </Button>
          }
        >
          {getApiErrorMessage(error, 'No pudimos cargar el detalle del servicio.')}
        </Alert>
      </Box>
    )
  }

  return (
    <CalibrationServiceDetailsView
      service={service}
      sequenceConfig={sequenceConfig}
      canManageSequenceConfig={canManageSequenceConfig}
      isLoadingSequenceConfig={isLoadingSequenceConfig}
      slaConfig={slaConfig}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  )
}

export default CalibrationServiceDetailsPage
