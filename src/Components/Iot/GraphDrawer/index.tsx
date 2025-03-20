import { useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import { $realTimeData, loadDevices } from 'src/store/deviceIotStore'
import { Drawer, Box, Tabs, Tab, Skeleton, Typography } from '@mui/material'
import useAxiosPrivate from '@utils/use-axios-private'

import { DrawerHeader } from './parts/Header'
import { SummaryTab } from './tabs/SummaryTab'
import { HistoryTab } from './tabs/HistoryTab'
import { ConfigTab } from './tabs/ConfigTab'
import { EventsTab } from './tabs/EventsTab'
import { useDeviceData } from './hooks/useDeviceData'
import { useAlarms } from './hooks/useAlarms'
import { useSensorConfig } from './hooks/useSensorConfig'
import { aggregateStats, getGaugeConfig } from './helpers'
import { GraphDrawerProps, RangeOption, SensorType } from './types'
import { RANGE_OPTIONS } from 'src/Components/Iot/constants'
import { useQueryClient } from 'react-query'
import { DeviceIot } from '../types'
import { transformDevice } from '../DeviceIotMap/utils/transformDevice'

const GraphDrawer = ({
  deviceId,
  open,
  onClose,
  deviceName,
  devicesFromApi: deviceDetails
}: GraphDrawerProps) => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  const [needsRefresh, setNeedsRefresh] = useState(false)
  const realTimeData = useStore($realTimeData)
  const [selectedTab, setSelectedTab] = useState<string>('resumen')
  const [selectedRange, setSelectedRange] = useState<RangeOption>(
    RANGE_OPTIONS[0]
  )

  const {
    visibleSeries,
    setVisibleSeries,
    combinedData,
    graphData,
    isLoading,
    error,
    startDateStr,
    endDateStr
  } = useDeviceData(deviceId, selectedRange)

  const {
    selectedConfig,
    selectedSensorType,
    handleSelectSensorType,
    resetConfig
  } = useSensorConfig(deviceId)

  const realTimeDataFlat = useMemo(
    () =>
      Object.entries(realTimeData).flatMap(([_, values]) =>
        values.map((payload) => ({
          ...payload.data,
          timestamp: payload.timestamp
        }))
      ),
    [realTimeData]
  )

  const stats = useMemo(() => aggregateStats(graphData), [graphData])

  const lilygoData = realTimeData?.[deviceName] || []
  const lastEntry = lilygoData[lilygoData.length - 1] || null
  const status = lastEntry ? 'Online' : 'Offline'

  const handleConfigUpdated = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      // 1. Actualizar datos mediante API
      const response = await axiosPrivate.get(`/devicesIot/${deviceId}`)
      const updatedDevice = [response.data].map(transformDevice)

      // 2. Actualizar estado global (nanostores)
      const updatedDevices = deviceDetails.map((device: DeviceIot) =>
        device.id === deviceId ? updatedDevice[0] : device
      )
      loadDevices(updatedDevices)

      // 3. Si usas React Query
      queryClient.invalidateQueries(['devices', deviceId])

      // 4. Forzar actualización local
      setNeedsRefresh((prev) => !prev)
    } catch (error) {
      console.error('Error actualizando dispositivo:', error)
    }
  }

  const currentDevice = useMemo(() => {
    return deviceDetails?.find((device: any) => device.id === deviceId)
  }, [deviceDetails, deviceId, needsRefresh]) //

  const tempConfig = useMemo(
    () => getGaugeConfig(currentDevice?.deviceIotConfigs, 'TEMPERATURA'),
    [currentDevice]
  )

  const humConfig = useMemo(
    () => getGaugeConfig(currentDevice?.deviceIotConfigs, 'HUMEDAD'),
    [currentDevice]
  )

  const { temperatureAlarms, humidityAlarms } = useAlarms(currentDevice)

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: '100%' } }}
    >
      <Box sx={{ flexGrow: 1 }}>
        <DrawerHeader
          deviceName={deviceName}
          status={status}
          onClose={onClose}
        />

        <Tabs
          value={selectedTab}
          onChange={(_, newValue) => setSelectedTab(newValue)}
          variant='fullWidth'
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label='Resumen' value='resumen' />
          <Tab label='Histórico' value='historico' />
          <Tab label='Configuración' value='configuracion' />
          <Tab label='Eventos' value='eventos' />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {selectedTab === 'resumen' && (
            <SummaryTab
              realTimeDataFlat={realTimeDataFlat}
              lastEntry={lastEntry}
              tempConfig={tempConfig}
              humConfig={humConfig}
              lastTemperature={lastEntry?.data?.sen.t || 0}
              lastHumidity={lastEntry?.data?.sen.h || 0}
            />
          )}

          {selectedTab === 'historico' && (
            <HistoryTab
              combinedData={combinedData}
              visibleSeries={visibleSeries}
              onToggleSeries={(series: 'temperature' | 'humidity') =>
                setVisibleSeries((prev) => ({
                  ...prev,
                  [series]: !prev[series]
                }))
              }
              temperatureAlarms={temperatureAlarms}
              humidityAlarms={humidityAlarms}
              selectedRange={selectedRange}
              onSelectRange={setSelectedRange}
              aggregateStats={stats}
              isLoading={isLoading}
              error={error}
            />
          )}

          {selectedTab === 'configuracion' && (
            <ConfigTab
              onConfigUpdated={handleConfigUpdated}
              selectedSensorType={selectedSensorType}
              sensorTypes={['TEMPERATURA', 'HUMEDAD', 'PRESION', 'OTRO']}
              currentDevice={currentDevice}
              deviceId={deviceId}
              selectedConfig={selectedConfig}
              onSelectSensorType={(type) =>
                handleSelectSensorType(
                  type,
                  currentDevice?.deviceIotConfigs?.find(
                    (c: any) => c.sensorType === type
                  )
                )
              }
              onResetSelection={resetConfig}
              onSuccess={() => {
                resetConfig()
                // Aquí deberías agregar lógica para actualizar los datos del dispositivo
              }}
            />
          )}

          {selectedTab === 'eventos' && deviceId && (
            <EventsTab deviceId={deviceId.toString()} />
          )}
        </Box>
      </Box>
    </Drawer>
  )
}

export default GraphDrawer
