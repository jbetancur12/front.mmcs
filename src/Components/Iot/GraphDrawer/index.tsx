import { useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import { $realTimeData } from 'src/store/deviceIotStore'
import { Drawer, Box, Tabs, Tab } from '@mui/material'

import { DrawerHeader } from './parts/Header'

import { HistoryTab } from './tabs/HistoryTab'

import { useDeviceData } from './hooks/useDeviceData'
import { useAlarms } from './hooks/useAlarms'

import { aggregateStats } from './helpers'
import { GraphDrawerProps, RangeOption } from './types'
import { RANGE_OPTIONS } from 'src/Components/Iot/constants'

import { Alarm, Assessment, Info } from '@mui/icons-material'
import { DeviceDetailPanel } from './tabs/DeviceDetailPanel'
import DeviceAlarmsPanel from './parts/DeviceAlarmsPanel'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`device-tabpanel-${index}`}
      aria-labelledby={`device-tab-${index}`}
      {...other}
      style={{ width: '100%' }}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  )
}

const GraphDrawer = ({
  device,
  deviceId,
  open,
  onClose,
  deviceName
}: GraphDrawerProps) => {
  const realTimeData = useStore($realTimeData)

  const [selectedRange, setSelectedRange] = useState<RangeOption>(
    RANGE_OPTIONS[0]
  )
  const [tabValue, setTabValue] = useState(0)

  const {
    visibleSeries,
    setVisibleSeries,
    combinedData,
    graphData,
    isLoading,
    error
  } = useDeviceData(deviceId, selectedRange)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const stats = useMemo(() => aggregateStats(graphData), [graphData])

  const lilygoData = realTimeData?.[deviceName] || []
  const lastEntry = lilygoData[lilygoData.length - 1] || null
  const status = lastEntry ? 'Online' : 'Offline'

  const currentDevice = device

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
          isInAlarm={device?.isInAlarm}
        />

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant='standard'
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<Info />}
            label='Detalles'
            id='device-tab-0'
            aria-controls='device-tabpanel-0'
          />
          <Tab
            icon={<Assessment />}
            label='Historial'
            id='device-tab-2'
            aria-controls='device-tabpanel-2'
          />

          <Tab
            icon={<Alarm />}
            label='Alarmas'
            id='device-tab-3'
            aria-controls='device-tabpanel-3'
          />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <TabPanel value={tabValue} index={0}>
            <DeviceDetailPanel device={currentDevice} />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
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
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {deviceId && <DeviceAlarmsPanel deviceId={deviceId as number} />}
          </TabPanel>
        </Box>
      </Box>
    </Drawer>
  )
}

export default GraphDrawer
