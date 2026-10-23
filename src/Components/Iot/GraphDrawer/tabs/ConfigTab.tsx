// components/DeviceGraphs/GraphDrawer/tabs/ConfigTab.tsx
import { Grid, Typography, Box, Button } from '@mui/material'

import { ConfigButton } from '../parts/ConfigButton'
import { SensorType } from '../types'
import { ArrowBack } from '@mui/icons-material'
import ModuleConfigForm from 'src/Components/Iot/ModuleConfigForm'
import { notify } from 'src/utils/notify'


interface ConfigTabProps {
  selectedSensorType: SensorType | null
  sensorTypes: SensorType[]
  currentDevice?: any
  deviceId: number | string | null
  selectedConfig?: any
  onSelectSensorType: (type: SensorType) => void
  onResetSelection: () => void
  onSuccess: () => void
  onConfigUpdated: () => void
}

export const ConfigTab = ({
  selectedSensorType,
  sensorTypes,
  currentDevice,
  deviceId,
  selectedConfig,
  onSelectSensorType,
  onResetSelection,
  onConfigUpdated
}: ConfigTabProps) => {
  const handleSuccess = async () => {
    try {
      await onConfigUpdated()
      onResetSelection()
      notify.success('¡Configuración actualizada!', 'Los cambios se han aplicado correctamente')
    } catch (error) {
      {
        notify.error('No se pudo actualizar la configuración')
        onResetSelection()
      }
    }
  }
  return (
    <Box sx={{ mt: 2 }}>
      {!selectedSensorType ? (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant='h6' gutterBottom>
              Seleccionar tipo de sensor para configurar
            </Typography>
          </Grid>
          {sensorTypes.map((sensorType) => (
            <ConfigButton
              key={sensorType}
              sensorType={sensorType}
              existingConfig={currentDevice?.deviceIotConfigs?.find(
                (c: any) => c.sensorType === sensorType
              )}
              onClick={onSelectSensorType}
            />
          ))}
        </Grid>
      ) : (
        <Box>
          <Button
            startIcon={<ArrowBack />}
            onClick={onResetSelection}
            sx={{ mb: 2 }}
          >
            Volver a selección
          </Button>
          <ModuleConfigForm
            deviceIotId={Number(deviceId)}
            initialData={selectedConfig}
            onSuccess={handleSuccess}
          />
        </Box>
      )}
    </Box>
  )
}
